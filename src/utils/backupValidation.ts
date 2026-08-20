import { Book, FormatType, LanguageType, MonthName } from '../types';
import { MONTHS_LIST } from './helpers';

export const CURRENT_BACKUP_VERSION = '1.0.0';

const VALID_FORMATS: FormatType[] = ['Físico', 'Kindle', 'PDF', 'Archive.org', 'Audible', 'Físico/Audible'];
const VALID_LANGUAGES: LanguageType[] = ['Português', 'Inglês', 'Espanhol', 'Outros', 'Não informado'];

export interface BackupValidationResult {
  isValid: boolean;
  books?: Book[];
  error?: string;
  totalRecords?: number;
  statsByYear?: Record<number, number>;
  version?: string;
}

export interface BackupPayload {
  formatVersion: string;
  exportedAt: string;
  totalBooks: number;
  app: string;
  books: Book[];
}

/**
 * Creates a versioned, structured backup payload for export.
 */
export function createBackupPayload(books: Book[]): BackupPayload {
  return {
    formatVersion: CURRENT_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    totalBooks: books.length,
    app: 'Controle de Leituras Pessoais',
    books,
  };
}

/**
 * Rigorously validates an imported backup dataset.
 * Supports both direct arrays of books and structured versioned backup objects.
 */
export function validateBackupPayload(raw: unknown): BackupValidationResult {
  if (!raw || (typeof raw !== 'object' && !Array.isArray(raw))) {
    return {
      isValid: false,
      error: 'O arquivo importado não contém um formato JSON válido.',
    };
  }

  let booksArray: any[] = [];
  let version = 'legacy';

  if (Array.isArray(raw)) {
    booksArray = raw;
  } else {
    const obj = raw as Record<string, any>;
    if (Array.isArray(obj.books)) {
      booksArray = obj.books;
      version = typeof obj.formatVersion === 'string' ? obj.formatVersion : '1.0.0';
    } else {
      return {
        isValid: false,
        error: 'O arquivo JSON não contém uma lista de livros válida (propriedade "books" ausente ou inválida).',
      };
    }
  }

  if (booksArray.length === 0) {
    return {
      isValid: false,
      error: 'O backup não contém nenhuma leitura registrada (lista vazia).',
    };
  }

  const validatedBooks: Book[] = [];
  const statsByYear: Record<number, number> = {};

  for (let i = 0; i < booksArray.length; i++) {
    const item = booksArray[i];
    const itemIndex = i + 1;

    if (!item || typeof item !== 'object') {
      return {
        isValid: false,
        error: `Registro #${itemIndex} inválido: não é um objeto válido.`,
      };
    }

    // ID validation
    const id = Number(item.id);
    if (!Number.isFinite(id) || id <= 0) {
      return {
        isValid: false,
        error: `Registro #${itemIndex} inválido: campo 'id' deve ser um número positivo (recebido: ${item.id}).`,
      };
    }

    // Title validation
    if (typeof item.title !== 'string' || !item.title.trim()) {
      return {
        isValid: false,
        error: `Registro #${itemIndex} (ID ${id}): campo 'title' é obrigatório e não pode ser vazio.`,
      };
    }

    // Author validation
    if (typeof item.author !== 'string' || !item.author.trim()) {
      return {
        isValid: false,
        error: `Registro #${itemIndex} (ID ${id}): campo 'author' é obrigatório e não pode ser vazio.`,
      };
    }

    // Reading Year validation
    const readingYear = Number(item.readingYear);
    if (!Number.isFinite(readingYear) || readingYear < 1900 || readingYear > 2100) {
      return {
        isValid: false,
        error: `Registro #${itemIndex} (ID ${id}): campo 'readingYear' inválido (${item.readingYear}).`,
      };
    }

    // Month validation
    const month = typeof item.month === 'string' && MONTHS_LIST.includes(item.month as MonthName)
      ? (item.month as MonthName)
      : 'Janeiro';

    // Format validation
    let format: FormatType = 'Físico';
    if (typeof item.format === 'string' && VALID_FORMATS.includes(item.format as FormatType)) {
      format = item.format as FormatType;
    }

    // Language validation
    let language: LanguageType = 'Não informado';
    if (typeof item.language === 'string' && VALID_LANGUAGES.includes(item.language as LanguageType)) {
      language = item.language as LanguageType;
    }

    // Rating validation
    const rating = Number(item.rating);
    const validRating = Number.isFinite(rating) ? Math.min(6, Math.max(0, rating)) : 0;

    // Pages validation
    const pages = Number(item.pages);
    const validPages = Number.isFinite(pages) && pages >= 0 ? pages : 0;

    // Status validation
    let status: 'read' | 'reading' | 'wishlist' = 'read';
    if (item.status === 'reading' || item.status === 'wishlist' || item.status === 'read') {
      status = item.status;
    }

    // Fichamento validation
    let fichamento = undefined;
    if (item.fichamento && typeof item.fichamento === 'object') {
      const items = Array.isArray(item.fichamento.items)
        ? item.fichamento.items.map((fi: any) => ({
            id: typeof fi.id === 'string' ? fi.id : String(Date.now() + Math.random()),
            page: typeof fi.page === 'string' ? fi.page : '',
            text: typeof fi.text === 'string' ? fi.text : '',
            type: fi.type === 'citacao' || fi.type === 'resumo' || fi.type === 'referencia' ? fi.type : 'citacao',
          }))
        : [];
      fichamento = { items };
    }

    const validatedBook: Book = {
      id,
      title: item.title.trim(),
      author: item.author.trim(),
      year: Number(item.year) || readingYear,
      pages: validPages,
      nationality: typeof item.nationality === 'string' ? item.nationality.trim() : 'Brasil',
      continent: typeof item.continent === 'string' ? item.continent.trim() : 'América do Sul',
      format,
      language,
      rating: validRating,
      month,
      monthId: Number(item.monthId) || 1,
      readingYear,
      yearBookId: typeof item.yearBookId === 'number' ? item.yearBookId : undefined,
      coverUrl: typeof item.coverUrl === 'string' && item.coverUrl.trim() ? item.coverUrl.trim() : undefined,
      genre: typeof item.genre === 'string' && item.genre.trim() ? item.genre.trim() : undefined,
      notes: typeof item.notes === 'string' && item.notes.trim() ? item.notes.trim() : undefined,
      status,
      fichamento,
    };

    validatedBooks.push(validatedBook);
    statsByYear[readingYear] = (statsByYear[readingYear] || 0) + 1;
  }

  return {
    isValid: true,
    books: validatedBooks,
    totalRecords: validatedBooks.length,
    statsByYear,
    version,
  };
}
