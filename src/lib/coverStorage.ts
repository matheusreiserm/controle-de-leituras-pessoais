import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebase';

async function contentHash(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Stores the cover as a file and returns its https URL; the book document keeps only the link. */
export async function uploadCover(blob: Blob): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Entre com sua conta para salvar a capa.');
  // Content-addressed: the same image always maps to the same file, so re-saving never duplicates it.
  const file = ref(storage, `users/${user.uid}/covers/${await contentHash(blob)}.webp`);
  await uploadBytes(file, blob, { contentType: 'image/webp', cacheControl: 'public, max-age=31536000, immutable' });
  return getDownloadURL(file);
}
