import { Book } from '../types';

/**
 * Personal backups are authoritative: preserve edits, covers and deletions.
 */
export function mergeBooksWithCanonical(remoteBooks: Book[]): Book[] {
  return remoteBooks.map((book) => ({ ...book }));
}
