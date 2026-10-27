const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const MAX_COVER_CHARACTERS = 260_000;
/** Same geometry as the catalog covers in public/covers (about 900x1400). */
const STORED_MAX_WIDTH = 900;
const STORED_MAX_HEIGHT = 1400;
export const CATALOG_SIZE = 551;
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function resolveCoverUrl(value?: string, base = (import.meta as any).env?.BASE_URL || '/'): string {
  if (!value) return '';
  const cover = value.trim();
  if (/^\/?covers\/[\w.-]+$/.test(cover)) return `${base.replace(/\/$/, '')}/${cover.replace(/^\//, '')}`;
  if (/^https?:\/\//i.test(cover) || /^data:image\/(png|jpeg|webp|gif);base64,/i.test(cover)) return cover;
  return '';
}

function validateSource(blob: Blob) {
  if (!ACCEPTED_TYPES.has(blob.type.toLowerCase())) throw new Error('Escolha uma imagem JPG, PNG, WEBP ou GIF.');
  if (!blob.size || blob.size > MAX_SOURCE_BYTES) throw new Error('Escolha uma imagem de até 10 MB.');
}

export async function fetchCoverBlob(address: string): Promise<Blob> {
  let url: URL;
  try { url = new URL(address.trim()); } catch { throw new Error('Cole a URL completa da imagem (https://...).'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('Use uma URL de imagem http ou https, sem credenciais.');
  let response: Response;
  try {
    response = await fetch(url.href, { mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(20000) });
  } catch {
    throw new Error('Não foi possível baixar a capa. O site pode bloquear o download. Baixe a imagem e envie o arquivo.');
  }
  if (!response.ok) throw new Error(`O site não liberou a imagem (${response.status}). Baixe a imagem e envie o arquivo.`);
  if (Number(response.headers.get('content-length')) > MAX_SOURCE_BYTES) throw new Error('Escolha uma imagem de até 10 MB.');
  const type = (response.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!ACCEPTED_TYPES.has(type)) throw new Error('A URL não retornou uma imagem JPG, PNG, WEBP ou GIF. Envie o arquivo da capa.');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('A imagem está vazia. Envie o arquivo da capa.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SOURCE_BYTES) { await reader.cancel(); throw new Error('Escolha uma imagem de até 10 MB.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const blob = new Blob(chunks, { type });
  validateSource(blob);
  return blob;
}

/** Small embedded images travel with each Firestore book and the JSON backup. */
export async function imageToCover(blob: Blob): Promise<string> {
  validateSource(blob);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    try { await image.decode(); } catch { throw new Error('Não foi possível ler a imagem. Envie outro arquivo JPG, PNG ou WEBP.'); }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('A imagem não tem dimensões válidas.');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Este navegador não conseguiu preparar a capa.');
    for (const maxEdge of [1000, 800, 600, 400]) {
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.85, 0.7, 0.55]) {
        const encoded = canvas.toDataURL('image/webp', quality);
        if (encoded.length <= MAX_COVER_CHARACTERS && encoded.startsWith('data:image/')) return encoded;
      }
    }
    throw new Error('A imagem ainda ficou muito grande. Escolha uma capa menor.');
  } finally { URL.revokeObjectURL(objectUrl); }
}

export function catalogCoverPath(id: number): string {
  return `/covers/${String(id).padStart(4, '0')}.webp`;
}

/** Catalog books whose good-quality file ships with the site but whose stored cover was replaced by a degraded embedded copy. */
export function restoreCatalogCovers<T extends { id: number; coverUrl?: string }>(books: T[]): { books: T[]; restored: number } {
  let restored = 0;
  const next = books.map((book) => {
    if (book.id >= 1 && book.id <= CATALOG_SIZE && book.coverUrl?.startsWith('data:')) {
      restored++;
      return { ...book, coverUrl: catalogCoverPath(book.id) };
    }
    return book;
  });
  return { books: next, restored };
}

/** Full-quality cover for file storage: no 260k-character budget, same size as the catalog covers. */
export async function imageToCoverBlob(blob: Blob): Promise<Blob> {
  validateSource(blob);
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = objectUrl;
    try { await image.decode(); } catch { throw new Error('Não foi possível ler a imagem. Envie outro arquivo JPG, PNG ou WEBP.'); }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('A imagem não tem dimensões válidas.');
    const scale = Math.min(1, STORED_MAX_WIDTH / image.naturalWidth, STORED_MAX_HEIGHT / image.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Este navegador não conseguiu preparar a capa.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const encoded = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.9));
    if (!encoded || encoded.type !== 'image/webp') throw new Error('Este navegador não conseguiu gerar a capa em WEBP.');
    return encoded;
  } finally { URL.revokeObjectURL(objectUrl); }
}
