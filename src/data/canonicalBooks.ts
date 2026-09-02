import { Book } from '../types';
import { INITIAL_BOOKS } from './initialBooks';

const canonicalById = new Map(INITIAL_BOOKS.map((book) => [book.id, book]));

/**
 * Mantém os dados bibliográficos do código como fonte de verdade.
 * O Firestore contribui apenas com campos pessoais/dinâmicos e livros novos.
 */
export function mergeBooksWithCanonical(remoteBooks: Book[]): Book[] {
  const remoteById = new Map(remoteBooks.map((book) => [book.id, book]));

  const canonicalBooks = INITIAL_BOOKS.map((canonical) => {
    const remote = remoteById.get(canonical.id);
    if (!remote) return canonical;

    return {
      ...remote,
      ...canonical,
      ...(remote.notes !== undefined ? { notes: remote.notes } : {}),
      ...(remote.genre !== undefined ? { genre: remote.genre } : {}),
      ...(remote.fichamento !== undefined ? { fichamento: remote.fichamento } : {}),
      ...(remote.status !== undefined ? { status: remote.status } : {}),
    };
  });

  const newRemoteBooks = remoteBooks.filter((book) => !canonicalById.has(book.id));
  return [...canonicalBooks, ...newRemoteBooks].sort((a, b) => a.id - b.id);
}
