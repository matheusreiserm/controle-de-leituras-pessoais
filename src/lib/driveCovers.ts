import { auth } from './firebase';
import { connection, list, type Request } from './driveSync';

const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_NAME = 'Capas do Leituras';

/** Public image address of a Drive file, served at up to 1000 px wide. */
export function driveCoverUrl(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1000`;
}

function folderKey() { return `reading_cover_folder_${auth.currentUser?.uid || 'owner'}`; }

async function coverFolder(request: Request): Promise<string> {
  let remembered: string | null = null;
  try { remembered = localStorage.getItem(folderKey()); } catch { /* storage optional */ }
  // The app only sees folders it created itself (drive.file), so a name match is the app's own folder.
  const folders = await list(request, `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`);
  const found = folders.find((folder) => folder.id === remembered) ?? folders[0];
  if (found) {
    try { localStorage.setItem(folderKey(), found.id); } catch { /* storage optional */ }
    return found.id;
  }
  const created = await (await request(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })).json();
  try { localStorage.setItem(folderKey(), created.id); } catch { /* storage optional */ }
  return created.id;
}

/**
 * Saves a cover in the owner's Drive and opens it to anyone with the link, so every device shows it
 * without signing in. Book covers only: the reading list itself stays private in Firestore.
 */
export async function uploadCoverToDrive(image: Blob): Promise<string> {
  const request = await connection(true);
  const folderId = await coverFolder(request);
  const boundary = `capa-${crypto.randomUUID()}`;
  const metadata = { name: `capa-${new Date().toISOString().replace(/[:.]/g, '-')}.webp`, parents: [folderId], mimeType: 'image/webp' };
  const body = new Blob([
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    `--${boundary}\r\nContent-Type: image/webp\r\n\r\n`,
    image,
    `\r\n--${boundary}--`,
  ]);
  const file = await (await request(`${UPLOAD}?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  })).json();
  await request(`${API}/${file.id}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' }),
  });
  return driveCoverUrl(file.id);
}
