import { Book } from '../types';
import { auth, getAccessToken, setAccessToken, loginWithGoogle } from './firebase';
import { createBackupPayload, validateBackupPayload } from '../utils/backupValidation';

const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const PREFIX = 'controle_leituras_backup_';
const RETENTION = 4;
const WEEK = 7 * 24 * 60 * 60 * 1000;
interface DriveFile {
  id: string; name: string; modifiedTime?: string; size?: string;
  appProperties?: Record<string, string>;
}
interface Result { success: boolean; message: string; fileId?: string; folderId?: string; books?: Book[] }
type Request = (url: string, init?: RequestInit) => Promise<Response>;

async function connection(interactive: boolean): Promise<Request> {
  let token = getAccessToken();
  if (!token && interactive) token = (await loginWithGoogle()).accessToken;
  if (!token) throw new Error('Backup aguardando autorização do Drive. Use Exportar para o Drive para reconectar.');
  return async (url, init = {}) => {
    const send = () => fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(120000) });
    let response = await send();
    if (response.status === 401) {
      setAccessToken(null);
      if (interactive) {
        token = (await loginWithGoogle()).accessToken;
        if (token) response = await send();
      }
    }
    if (!response.ok) {
      let detail = '';
      try { const body = await response.json(); detail = body?.error?.message || ''; } catch { /* non-JSON error */ }
      if (response.status === 401) throw new Error('Autorização do Drive expirada. Use Exportar ou Importar para reconectar.');
      if (response.status === 403) throw new Error(`O Google Drive negou acesso (403). ${detail || 'Verifique a autorização e se a Drive API está ativada.'}`);
      throw new Error(`Falha no Google Drive (${response.status}). ${detail}`);
    }
    return response;
  };
}

async function list(request: Request, query: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: query, pageSize: '100', orderBy: 'modifiedTime desc',
      fields: 'nextPageToken,files(id,name,modifiedTime,size,appProperties)',
      ...(pageToken ? { pageToken } : {}),
    });
    const data = await (await request(`${API}?${params}`)).json();
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return files;
}

function isBackup(file: DriveFile) {
  return /^controle_leituras_backup(?:_\d{4}-\d{2}-\d{2}T[\dTZ.-]+)?\.json$/i.test(file.name);
}
async function backups(request: Request, folderId: string) {
  const files = await list(request, `'${folderId.replace(/'/g, "\\'")}' in parents and trashed=false`);
  return files.filter(isBackup).sort((a, b) => (b.modifiedTime || '').localeCompare(a.modifiedTime || '') || b.name.localeCompare(a.name));
}
function folderKey() { return `reading_backup_folder_${auth.currentUser?.uid || 'owner'}`; }
function rememberFolder(id: string) { try { localStorage.setItem(folderKey(), id); } catch { /* storage optional */ } }

async function findFolder(request: Request, create: boolean): Promise<string> {
  // Re-discover on each device; a local preference is only a hint, never a reason to create a duplicate.
  const folders = await list(request, "name='Backups' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false");
  let remembered: string | null = null;
  try { remembered = localStorage.getItem(folderKey()); } catch { /* storage optional */ }
  const previous = folders.find(folder => folder.id === remembered);
  if (previous) return previous.id;
  if (folders.length === 1) { rememberFolder(folders[0].id); return folders[0].id; }
  if (folders.length > 1) {
    const candidates = await Promise.all(folders.map(async folder => ({ folder, latest: (await backups(request, folder.id))[0] })));
    const populated = candidates.filter(item => item.latest);
    if (populated.length === 1) { rememberFolder(populated[0].folder.id); return populated[0].folder.id; }
    throw new Error('Há mais de uma pasta Backups acessível ao aplicativo. Renomeie as pastas antigas no Drive, mantendo Backups apenas na pasta usada pelo aplicativo.');
  }
  if (!create) throw new Error('A pasta Backups do aplicativo não foi encontrada. Exporte um backup antes de restaurar.');
  const folder = await (await request(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Backups', mimeType: 'application/vnd.google-apps.folder' }),
  })).json();
  rememberFolder(folder.id);
  return folder.id;
}

function parseBackup(text: string, file: DriveFile): Book[] {
  let parsed: unknown;
  if (!text.trim()) throw new Error(`O backup "${file.name}" está vazio. Nenhum dado foi restaurado.`);
  try { parsed = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new Error(`O backup "${file.name}" não contém JSON válido. Nenhum dado foi restaurado.`); }
  const result = validateBackupPayload(parsed);
  if (!result.isValid || !result.books) throw new Error(`Backup "${file.name}": ${result.error}`);
  return result.books;
}

async function fingerprint(books: Book[]) {
  const stable = (value: any): any => Array.isArray(value) ? value.map(stable) :
    value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => [k, stable(value[k])])) : value;
  const bytes = new TextEncoder().encode(JSON.stringify(stable([...books].sort((a, b) => a.id - b.id))));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

let exportInProgress = false;
export async function exportToGoogleDrive(books: Book[], interactive = true, automatic = false): Promise<Result> {
  if (exportInProgress) return { success: false, message: 'Já há um backup em andamento. Aguarde a conclusão.' };
  exportInProgress = true;
  try {
    const validation = validateBackupPayload(books);
    if (!validation.isValid) throw new Error(validation.error);
    const request = await connection(interactive);
    const folderId = await findFolder(request, true);
    const versions = await backups(request, folderId);
    const latest = versions[0];
    const hash = await fingerprint(books);
    if (latest?.appProperties?.contentHash === hash && latest.appProperties.verified === 'true') {
      return { success: true, message: 'Backup ignorado: o acervo não mudou desde a última versão verificada.', folderId };
    }
    if (automatic && latest?.modifiedTime && latest.appProperties?.verified === 'true' && Date.now() - Date.parse(latest.modifiedTime) < WEEK) {
      return { success: true, message: 'Backup automático aguardando o intervalo semanal.', folderId };
    }
    const name = `${PREFIX}${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const metadata = { name, parents: [folderId], mimeType: 'application/json', appProperties: { contentHash: hash, verified: 'false' } };
    const body = JSON.stringify(createBackupPayload(books));
    let upload: Response;
    if (new Blob([body]).size <= 5 * 1024 * 1024) {
      const boundary = `reading_${crypto.randomUUID()}`;
      const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
      upload = await request(`${UPLOAD}?uploadType=multipart&fields=id,name`, {
        method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart,
      });
    } else {
      const start = await request(`${UPLOAD}?uploadType=resumable&fields=id,name`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });
      const location = start.headers.get('Location');
      if (!location || new URL(location).origin !== 'https://www.googleapis.com') throw new Error('O Drive não retornou um endereço válido para enviar o backup.');
      upload = await request(location, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
    }
    const saved = await upload.json() as DriveFile;
    if (!saved.id) throw new Error('O Drive não confirmou o arquivo de backup.');
    saved.name = name;
    // Verify the downloaded bytes before retiring any older backup.
    const downloaded = await (await request(`${API}/${encodeURIComponent(saved.id)}?alt=media`)).text();
    parseBackup(downloaded, saved);
    const original = JSON.parse(downloaded);
    if (await fingerprint(Array.isArray(original) ? original : original.books) !== hash) throw new Error(`O backup "${name}" não passou na conferência. Os backups anteriores foram mantidos.`);
    await request(`${API}/${encodeURIComponent(saved.id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appProperties: { contentHash: hash, verified: 'true' } }),
    });
    let retentionWarning = '';
    try {
      // Preserve legacy/manual backups; only retire versions verified by this app.
      const verified = (await backups(request, folderId)).filter(file => file.appProperties?.verified === 'true');
      for (const file of verified.filter(file => file.id !== saved.id).slice(RETENTION - 1)) {
        await request(`${API}/${encodeURIComponent(file.id)}`, { method: 'DELETE' });
      }
    } catch { retentionWarning = ' As cópias antigas foram mantidas porque a limpeza não foi concluída.'; }
    return { success: true, message: `Backup salvo e conferido: ${name} (${books.length} leituras).${retentionWarning}`, fileId: saved.id, folderId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Falha ao salvar o backup no Drive.' };
  } finally { exportInProgress = false; }
}

export async function importFromGoogleDrive(interactive = true): Promise<Result> {
  try {
    const request = await connection(interactive);
    const folderId = await findFolder(request, false);
    const file = (await backups(request, folderId))[0];
    if (!file) return { success: false, message: 'Nenhum backup de leituras foi encontrado na pasta Backups do aplicativo.', folderId };
    if (file.appProperties?.verified === 'false') throw new Error(`O backup "${file.name}" não concluiu a conferência. Exporte uma nova cópia ou restaure um backup anterior pelo arquivo JSON.`);
    const text = await (await request(`${API}/${encodeURIComponent(file.id)}?alt=media`)).text();
    const books = parseBackup(text, file);
    return { success: true, message: `Backup lido: ${file.name} (${books.length} leituras).`, books, fileId: file.id, folderId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Falha ao importar o backup do Drive.' };
  }
}
