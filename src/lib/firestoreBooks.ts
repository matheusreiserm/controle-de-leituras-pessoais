import {
  collection,
  doc,
  getDocsFromServer,
  onSnapshot,
  writeBatch,
  getDoc,
  runTransaction,
  Transaction,
  WriteBatch,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Book, FichamentoData } from '../types';
import { mergeFichamento } from '../utils/fichamento';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function formatFirestoreErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions') || msg.includes('PERMISSION_DENIED')) {
    return 'Erro de Permissão (403): Acesso negado pelo Firestore. Verifique se você está autenticado com matheusreiserm@gmail.com.';
  }
  if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('Failed to get document because the client is offline')) {
    return 'Erro de Conexão: O Firestore está temporariamente inacessível ou sem conexão de rede.';
  }
  if (msg.includes('not-found') || msg.includes('NOT_FOUND')) {
    return 'Recurso ou documento não encontrado no Firestore.';
  }
  if (msg.includes('unauthenticated') || msg.includes('UNAUTHENTICATED')) {
    return 'Sessão expirada ou usuário não autenticado. Por favor, reconecte sua conta Google.';
  }
  return msg;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const friendly = formatFirestoreErrorMessage(error);
  const errInfo: FirestoreErrorInfo = {
    error: friendly,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Security / Operation Error: ', JSON.stringify(errInfo));
  const err = new Error(friendly);
  (err as any).info = errInfo;
  throw err;
}

/**
 * Returns the Firestore collection path for a user's books.
 */
export function getUserBooksPath(userId: string): string {
  return `users/${userId}/books`;
}

/** Firestore rejects undefined anywhere in a document: drop it from objects and arrays, at any depth. */
function withoutUndefined(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((entry) => entry !== undefined).map(withoutUndefined);
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    Object.entries(value).forEach(([key, entry]) => {
      if (entry !== undefined) clean[key] = withoutUndefined(entry);
    });
    return clean;
  }
  return value;
}

/**
 * Sanitize a book object for Firestore storage (remove undefined fields which Firestore rejects).
 */
export function sanitizeBookForFirestore(book: Book): Record<string, any> {
  return withoutUndefined(book) as Record<string, any>;
}

const MAX_DOCUMENT_BYTES = 900_000;
const documentBytes = (data: unknown) => new TextEncoder().encode(JSON.stringify(data)).byteLength;

export function prepareBookForWrite(book: Book): Record<string, any> {
  let clean = sanitizeBookForFirestore(book);
  // Leave room for Firestore field/path overhead within its 1 MiB document limit. The embedded copy of a
  // Drive cover is only a fallback, so it gives way before the book is refused.
  if (documentBytes(clean) > MAX_DOCUMENT_BYTES && clean.coverFallback) {
    const { coverFallback: _fallback, ...rest } = clean;
    clean = rest;
  }
  if (documentBytes(clean) > MAX_DOCUMENT_BYTES) {
    throw new Error(`O livro "${book.title}" ficou grande demais. Reduza a capa ou o fichamento antes de salvar.`);
  }
  return clean;
}

export function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'undefined';
}

export function areBookCollectionsEquivalent(left: Book[], right: Book[]): boolean {
  if (left.length !== right.length) return false;
  const rightById = new Map(right.map((book) => [book.id, book]));
  return left.every((book) => {
    const matchingBook = rightById.get(book.id);
    return !!matchingBook && stableSerialize(sanitizeBookForFirestore(book)) ===
      stableSerialize(sanitizeBookForFirestore(matchingBook));
  });
}

/**
 * Real-time listener for user's books stored in Firestore. `fromCache` marks a list the server has not
 * confirmed yet (offline start): empty there means "not loaded", never "the cloud is empty". `changed`
 * is false when only that confirmation (or a pending-write flag) changed.
 */
export function subscribeUserBooks(
  userId: string,
  onUpdate: (books: Book[], state: { fromCache: boolean; changed: boolean }) => void,
  onError?: (error: Error) => void
): () => void {
  const path = getUserBooksPath(userId);
  const booksCol = collection(db, 'users', userId, 'books');

  // Metadata changes too, so the moment the server confirms a list already shown from cache is seen.
  const unsubscribe = onSnapshot(
    booksCol,
    { includeMetadataChanges: true },
    (snapshot) => {
      const books: Book[] = [];
      snapshot.forEach((docSnap) => {
        books.push(docSnap.data() as Book);
      });
      books.sort((a, b) => b.id - a.id);
      onUpdate(books, { fromCache: snapshot.metadata.fromCache, changed: snapshot.docChanges().length > 0 });
    },
    (error) => {
      console.error(`Error subscribing to ${path}:`, error);
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (wrapped) {
          onError(wrapped as Error);
        }
      }
    }
  );

  return unsubscribe;
}

/**
 * Fetches all books for a user from the server (never from a local cache, which may be incomplete).
 */
export async function fetchUserBooks(userId: string): Promise<Book[]> {
  const path = getUserBooksPath(userId);
  try {
    const booksCol = collection(db, 'users', userId, 'books');
    const snapshot = await getDocsFromServer(booksCol);
    const books: Book[] = [];
    snapshot.forEach((docSnap) => {
      books.push(docSnap.data() as Book);
    });
    books.sort((a, b) => b.id - a.id);
    return books;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

const bookRef = (userId: string, bookId: number) => doc(db, 'users', userId, 'books', String(bookId));

/** Readings shifted by an insertion, move or removal: only their two number fields change. */
type ShiftedReading = Pick<Book, 'id' | 'yearBookId' | 'monthId'>;
// A transaction or batch takes up to 500 writes; a year of readings stays far below that.
const MAX_SHIFTED_PER_WRITE = 450;

function updateNumbers(target: Transaction | WriteBatch, userId: string, shifted: ShiftedReading[]) {
  shifted.forEach((book) => {
    const numbers = { yearBookId: book.yearBookId, monthId: book.monthId };
    if (target instanceof WriteBatch) target.update(bookRef(userId, book.id), numbers);
    else target.update(bookRef(userId, book.id), numbers);
  });
}

function checkShiftedSize(shifted: ShiftedReading[]) {
  if (shifted.length > MAX_SHIFTED_PER_WRITE) {
    throw new Error('A mudança renumeraria leituras demais de uma vez. Nada foi salvo.');
  }
}

/**
 * Saves an edited reading and renumbers the readings it shifted, all or nothing. The document is
 * written whole (fields removed in the form really disappear), except the fichamento, which the form
 * never edits: the one in the cloud is kept, so quotes added on another device are not lost.
 */
export async function saveReading(userId: string, book: Book, shifted: ShiftedReading[] = []): Promise<Book> {
  const path = `${getUserBooksPath(userId)}/${book.id}`;
  try {
    checkShiftedSize(shifted);
    const ref = bookRef(userId, book.id);
    return await runTransaction(db, async (transaction) => {
      const current = await transaction.get(ref);
      const { fichamento: _local, ...rest } = book;
      const remoteFichamento = current.exists() ? (current.data() as Book).fichamento : undefined;
      const saved: Book = remoteFichamento ? { ...rest, fichamento: remoteFichamento } : rest;
      transaction.set(ref, prepareBookForWrite(saved));
      updateNumbers(transaction, userId, shifted);
      return saved;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/** Deletes a reading and renumbers the readings after it, all or nothing. */
export async function deleteReading(userId: string, bookId: number, shifted: ShiftedReading[] = []): Promise<void> {
  const path = `${getUserBooksPath(userId)}/${bookId}`;
  try {
    checkShiftedSize(shifted);
    const batch = writeBatch(db);
    batch.delete(bookRef(userId, bookId));
    updateNumbers(batch, userId, shifted);
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Publishes a fichamento. `base` is the version the editor started from: if the cloud changed since
 * (another device), both sides are merged quote by quote instead of one overwriting the other.
 */
export async function saveFichamento(
  userId: string,
  bookId: number,
  base: FichamentoData | undefined,
  next: FichamentoData
): Promise<{ fichamento: FichamentoData; merged: boolean }> {
  const path = `${getUserBooksPath(userId)}/${bookId}`;
  try {
    const ref = bookRef(userId, bookId);
    return await runTransaction(db, async (transaction) => {
      const current = await transaction.get(ref);
      if (!current.exists()) throw new Error('O livro não foi encontrado na nuvem. Nada foi salvo.');
      const book = current.data() as Book;
      const result = mergeFichamento(base, next, book.fichamento);
      // Validates the size of the whole document before writing the single field.
      prepareBookForWrite({ ...book, fichamento: result.fichamento });
      transaction.update(ref, { fichamento: withoutUndefined(result.fichamento) });
      return result;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// Ids of recent creations, so a retried request returns the book it already made instead of a copy.
const KEPT_REQUEST_IDS = 50;

export async function createUserBook(
  userId: string,
  buildBook: (id: number) => Book,
  requestId: string,
  shifted: ShiftedReading[] = []
): Promise<Book> {
  const booksCol = collection(db, 'users', userId, 'books');
  const counterRef = doc(db, 'users', userId, 'metadata', 'bookIdCounter');
  let currentMaximum = 0;

  try {
    checkShiftedSize(shifted);
    const counter = await getDoc(counterRef);
    if (!counter.exists()) {
      const existingBooks = await getDocsFromServer(booksCol);
      existingBooks.forEach((bookDoc) => {
        currentMaximum = Math.max(currentMaximum, Number(bookDoc.data().id) || 0);
      });
    }

    return await runTransaction(db, async (transaction) => {
      const counter = await transaction.get(counterRef);
      const counterData = counter.data();
      const requestIds = (counterData?.requestIds || {}) as Record<string, number>;
      const previousId = requestIds[requestId];
      if (previousId) {
        const previousBook = await transaction.get(bookRef(userId, previousId));
        if (previousBook.exists()) return previousBook.data() as Book;
      }

      const lastId = counter.exists() ? Number(counterData?.lastId) || 0 : currentMaximum;
      const book = buildBook(lastId + 1);
      const recent = Object.entries({ ...requestIds, [requestId]: book.id })
        .sort(([, left], [, right]) => right - left)
        .slice(0, KEPT_REQUEST_IDS);
      // Written whole (not merged) so the list of request ids stays short.
      transaction.set(counterRef, { lastId: book.id, requestIds: Object.fromEntries(recent) });
      transaction.set(bookRef(userId, book.id), prepareBookForWrite(book));
      updateNumbers(transaction, userId, shifted);
      return book;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, getUserBooksPath(userId));
  }
}

/** Ids of the books a restore has to write: new ones and the ones whose content differs. */
export function booksToWrite(existing: Map<string, Record<string, unknown>>, prepared: Record<string, any>[]): Record<string, any>[] {
  return prepared.filter((data) => {
    const current = existing.get(String(data.id));
    return !current || stableSerialize(current) !== stableSerialize(data);
  });
}

/**
 * Makes the cloud equal to the given books: writes only what differs and deletes what is not in them.
 * Every book is validated before the first write.
 */
export async function replaceUserBooks(userId: string, books: Book[]): Promise<{ written: number; deleted: number }> {
  const prepared = books.map(prepareBookForWrite);
  const booksCol = collection(db, 'users', userId, 'books');
  const existingBooks = await getDocsFromServer(booksCol);
  const existing = new Map(existingBooks.docs.map((bookDoc) => [bookDoc.id, bookDoc.data()]));
  const nextIds = new Set(books.map((book) => String(book.id)));
  const maxId = books.reduce((maximum, book) => Math.max(maximum, book.id), 0);
  const changed = booksToWrite(existing, prepared);

  // Eight bounded documents stay below the 10 MiB limit of one request.
  for (let index = 0; index < changed.length; index += 8) {
    const batch = writeBatch(db);
    changed.slice(index, index + 8).forEach((data) => batch.set(bookRef(userId, data.id), data));
    await batch.commit();
  }

  const staleDocs = existingBooks.docs.filter((bookDoc) => !nextIds.has(bookDoc.id));
  for (let index = 0; index < staleDocs.length; index += 400) {
    const batch = writeBatch(db);
    staleDocs.slice(index, index + 400).forEach((bookDoc) => batch.delete(bookDoc.ref));
    await batch.commit();
  }

  const counterRef = doc(db, 'users', userId, 'metadata', 'bookIdCounter');
  await runTransaction(db, async (transaction) => {
    const counter = await transaction.get(counterRef);
    const lastId = counter.exists() ? Number(counter.data().lastId) || 0 : 0;
    transaction.set(counterRef, { lastId: Math.max(lastId, maxId) }, { merge: true });
  });
  return { written: changed.length, deleted: staleDocs.length };
}

export interface MigrationProgress {
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
  isComplete: boolean;
}

/**
 * Idempotent batch migration of books into users/{userId}/books/{bookId}.
 */
export async function migrateBooksToFirestore(
  userId: string,
  booksToMigrate: Book[],
  overwriteExisting: boolean = false,
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    total: booksToMigrate.length,
    processed: 0,
    imported: 0,
    skipped: 0,
    errors: 0,
    errorMessages: [],
    isComplete: false,
  };

  // Step 1: Fetch existing IDs to ensure idempotency and non-destructive operation
  const existingIds = new Set<string>();
  try {
    const booksCol = collection(db, 'users', userId, 'books');
    // From the server: an offline cache could make every book look missing.
    const existingSnap = await getDocsFromServer(booksCol);
    existingSnap.forEach((d) => existingIds.add(d.id));
  } catch (err: any) {
    const friendly = formatFirestoreErrorMessage(err);
    console.error('Falha ao consultar coleção de livros antes da migração:', err);
    throw new Error(friendly);
  }

  // Step 2: Batch upload in chunks of 50 (Firestore limit is 500 ops per batch)
  const BATCH_SIZE = 8;
  for (let i = 0; i < booksToMigrate.length; i += BATCH_SIZE) {
    const chunk = booksToMigrate.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    let batchOperations = 0;

    for (const book of chunk) {
      const docId = String(book.id);
      const isExisting = existingIds.has(docId);

      if (isExisting && !overwriteExisting) {
        progress.skipped++;
        progress.processed++;
      } else {
        try {
          const docRef = doc(db, 'users', userId, 'books', docId);
          const sanitized = prepareBookForWrite(book);
          batch.set(docRef, sanitized, { merge: true });
          batchOperations++;
          progress.imported++;
          progress.processed++;
        } catch (e: any) {
          progress.errors++;
          progress.processed++;
          progress.errorMessages.push(`Livro ID ${book.id} (${book.title}): ${formatFirestoreErrorMessage(e)}`);
        }
      }
    }

    if (batchOperations > 0) {
      try {
        await batch.commit();
      } catch (err: any) {
        progress.errors += batchOperations;
        progress.imported -= batchOperations;
        progress.errorMessages.push(`Erro ao gravar lote (${i + 1} a ${i + chunk.length}): ${formatFirestoreErrorMessage(err)}`);
      }
    }

    if (onProgress) {
      onProgress({ ...progress });
    }
  }

  progress.isComplete = true;
  if (progress.errors === 0 && booksToMigrate.length > 0) {
    const counterRef = doc(db, 'users', userId, 'metadata', 'bookIdCounter');
    const maxId = booksToMigrate.reduce((maximum, book) => Math.max(maximum, book.id), 0);
    await runTransaction(db, async (transaction) => {
      const counter = await transaction.get(counterRef);
      const lastId = counter.exists() ? Number(counter.data().lastId) || 0 : 0;
      transaction.set(counterRef, { lastId: Math.max(lastId, maxId) }, { merge: true });
    });
  }
  if (onProgress) {
    onProgress({ ...progress });
  }

  return progress;
}

/**
 * Calculates live Firestore statistics directly from database for the user.
 */
export async function getFirestoreStats(userId: string, expectedBooks: Book[]): Promise<{
  total: number;
  readTotal: number;
  readingTotal: number;
  byYear: Record<number, number>;
  isValidTarget: boolean;
}> {
  const books = await fetchUserBooks(userId);
  const readBooks = books.filter((b) => !b.status || b.status === 'read');
  const readingTotal = books.filter((b) => b.status === 'reading').length;
  const byYear: Record<number, number> = {};
  readBooks.forEach((b) => {
    const y = b.readingYear || 0;
    byYear[y] = (byYear[y] || 0) + 1;
  });

  const actualBooksById = new Map(books.map((book) => [book.id, book]));
  const isValidTarget = books.length === expectedBooks.length && expectedBooks.every((expectedBook) => {
    const actualBook = actualBooksById.get(expectedBook.id);
    return !!actualBook && stableSerialize(sanitizeBookForFirestore(actualBook)) ===
      stableSerialize(sanitizeBookForFirestore(expectedBook));
  });

  return {
    total: books.length,
    readTotal: readBooks.length,
    readingTotal,
    byYear,
    isValidTarget,
  };
}
