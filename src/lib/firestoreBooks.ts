import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Book } from '../types';

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

/**
 * Sanitize a book object for Firestore storage (remove undefined fields which Firestore rejects).
 */
export function sanitizeBookForFirestore(book: Book): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.entries(book).forEach(([k, v]) => {
    if (v !== undefined) {
      clean[k] = v;
    }
  });
  return clean;
}

function stableSerialize(value: unknown): string {
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
 * Real-time listener for user's books stored in Firestore.
 */
export function subscribeUserBooks(
  userId: string,
  onUpdate: (books: Book[]) => void,
  onError?: (error: Error) => void
): () => void {
  const path = getUserBooksPath(userId);
  const booksCol = collection(db, 'users', userId, 'books');

  const unsubscribe = onSnapshot(
    booksCol,
    (snapshot) => {
      const books: Book[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        books.push(data as Book);
      });
      // Sort by id ascending or yearBookId
      books.sort((a, b) => b.id - a.id);
      onUpdate(books);
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
 * Fetches all books for a user once from Firestore.
 */
export async function fetchUserBooks(userId: string): Promise<Book[]> {
  const path = getUserBooksPath(userId);
  try {
    const booksCol = collection(db, 'users', userId, 'books');
    const snapshot = await getDocs(booksCol);
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

/**
 * Saves or updates a single book in Firestore at users/{userId}/books/{bookId}.
 */
export async function saveUserBook(userId: string, book: Book): Promise<void> {
  const path = `${getUserBooksPath(userId)}/${book.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'books', String(book.id));
    const data = sanitizeBookForFirestore(book);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Deletes a book from Firestore at users/{userId}/books/{bookId}.
 */
export async function deleteUserBook(userId: string, bookId: number): Promise<void> {
  const path = `${getUserBooksPath(userId)}/${bookId}`;
  try {
    const docRef = doc(db, 'users', userId, 'books', String(bookId));
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function createUserBook(
  userId: string,
  buildBook: (id: number) => Book,
  requestId: string
): Promise<Book> {
  const booksCol = collection(db, 'users', userId, 'books');
  const counterRef = doc(db, 'users', userId, 'metadata', 'bookIdCounter');
  let currentMaximum = 0;

  try {
    const counter = await getDoc(counterRef);
    if (!counter.exists()) {
      const existingBooks = await getDocs(booksCol);
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
        const previousRef = doc(db, 'users', userId, 'books', String(previousId));
        const previousBook = await transaction.get(previousRef);
        if (previousBook.exists()) return previousBook.data() as Book;
      }

      const lastId = counter.exists() ? Number(counterData?.lastId) || 0 : currentMaximum;
      const book = buildBook(lastId + 1);
      transaction.set(counterRef, {
        lastId: book.id,
        requestIds: { ...requestIds, [requestId]: book.id },
      }, { merge: true });
      transaction.set(doc(db, 'users', userId, 'books', String(book.id)), sanitizeBookForFirestore(book));
      return book;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, getUserBooksPath(userId));
  }
}

export async function replaceUserBooks(userId: string, books: Book[]): Promise<void> {
  const booksCol = collection(db, 'users', userId, 'books');
  const existingBooks = await getDocs(booksCol);
  const nextIds = new Set(books.map((book) => String(book.id)));
  const maxId = books.reduce((maximum, book) => Math.max(maximum, book.id), 0);

  for (let index = 0; index < books.length; index += 400) {
    const batch = writeBatch(db);
    books.slice(index, index + 400).forEach((book) => {
      batch.set(doc(db, 'users', userId, 'books', String(book.id)), sanitizeBookForFirestore(book));
    });
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
    const existingSnap = await getDocs(booksCol);
    existingSnap.forEach((d) => existingIds.add(d.id));
  } catch (err: any) {
    const friendly = formatFirestoreErrorMessage(err);
    console.error('Falha ao consultar coleção de livros antes da migração:', err);
    throw new Error(friendly);
  }

  // Step 2: Batch upload in chunks of 50 (Firestore limit is 500 ops per batch)
  const BATCH_SIZE = 50;
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
          const sanitized = sanitizeBookForFirestore(book);
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
export async function getFirestoreStats(userId: string, expectedBooks?: Book[]): Promise<{
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
  const isValidTarget = expectedBooks
    ? books.length === expectedBooks.length && expectedBooks.every((expectedBook) => {
      const actualBook = actualBooksById.get(expectedBook.id);
      return !!actualBook && stableSerialize(sanitizeBookForFirestore(actualBook)) ===
        stableSerialize(sanitizeBookForFirestore(expectedBook));
    })
    : books.length === 551 &&
      readBooks.length === 549 &&
      readingTotal === 2 &&
      byYear[2023] === 69 &&
      byYear[2024] === 183 &&
      byYear[2025] === 207 &&
      byYear[2026] === 90;

  return {
    total: books.length,
    readTotal: readBooks.length,
    readingTotal,
    byYear,
    isValidTarget,
  };
}
