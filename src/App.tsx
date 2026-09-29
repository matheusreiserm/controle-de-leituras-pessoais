import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Book, TabType, FichamentoData, MonthName } from './types';
import { INITIAL_BOOKS } from './data/initialBooks';
import { mergeBooksWithCanonical } from './data/canonicalBooks';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { NationalityMatrixView } from './components/NationalityMatrixView';
import { MonthlyJournalView } from './components/MonthlyJournalView';
import { MasterTableView } from './components/MasterTableView';
import { WrappedView } from './components/WrappedView';
import { WishlistView } from './components/WishlistView';
import { ReadingView } from './components/ReadingView';
import { BookModal } from './components/BookModal';
import { CoverHighlightModal } from './components/CoverHighlightModal';
import { FichamentoModal } from './components/FichamentoModal';
import { BackupModal } from './components/BackupModal';
import { MigrationModal } from './components/MigrationModal';
import { LoginView } from './components/LoginView';
import { auth, logout, ALLOWED_EMAIL } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MONTHS_LIST } from './utils/helpers';
import {
  areBookCollectionsEquivalent,
  createUserBook,
  deleteUserBook,
  fetchUserBooks,
  formatFirestoreErrorMessage,
  replaceUserBooks,
  saveUserBook,
  subscribeUserBooks,
} from './lib/firestoreBooks';
import { exportToGoogleDrive } from './lib/driveSync';

const LOCAL_STORAGE_CACHE_KEY = 'controle_leituras_cache_v5';
const LOCAL_STORAGE_MIGRATION_SOURCE_KEY = 'controle_leituras_cache_v5_migration_source';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Modals state
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [selectedCoverBook, setSelectedCoverBook] = useState<Book | null>(null);
  const [selectedFichamentoBook, setSelectedFichamentoBook] = useState<Book | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabType>('journal');

  // Books state with local cache as instant fallback
  const [books, setBooks] = useState<Book[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_MIGRATION_SOURCE_KEY)
        || localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return mergeBooksWithCanonical(parsed);
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar cache local:', e);
    }
    return INITIAL_BOOKS;
  });
  const migrationSourceBooks = useRef(books);
  const initialSnapshotHandled = useRef(false);
  const [syncPhase, setSyncPhase] = useState<'connecting' | 'ready' | 'migration-required' | 'offline'>('connecting');
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');
  const [retryWrite, setRetryWrite] = useState<(() => void) | null>(null);
  const automaticBackupInProgress = useRef(false);

  // Auth State Listener
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setCurrentUser(user);
          setAuthLoading(false);
        },
        (error) => {
          console.warn('Auth state subscription notice:', error);
          setAuthLoading(false);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Failed to subscribe to auth state:', e);
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.email?.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) return;

    initialSnapshotHandled.current = false;
    setSyncPhase('connecting');
    const unsubscribe = subscribeUserBooks(
      currentUser.uid,
      (cloudBooks) => {
        if (!initialSnapshotHandled.current) {
          initialSnapshotHandled.current = true;
          if (cloudBooks.length === 0) {
            try {
              localStorage.setItem(LOCAL_STORAGE_MIGRATION_SOURCE_KEY, JSON.stringify(migrationSourceBooks.current));
            } catch (error) {
              console.warn('Não foi possível preservar uma cópia local para migração:', error);
            }
            setSyncPhase('migration-required');
            setIsMigrationModalOpen(true);
            return;
          }

          const hasLocalDifferences = !areBookCollectionsEquivalent(
            migrationSourceBooks.current,
            cloudBooks
          );

          if (hasLocalDifferences) {
            try {
              localStorage.setItem(LOCAL_STORAGE_MIGRATION_SOURCE_KEY, JSON.stringify(migrationSourceBooks.current));
            } catch (error) {
              console.warn('Não foi possível preservar uma cópia local para migração:', error);
            }
          }
          setBooks(cloudBooks);
          setSyncPhase('ready');
          if (hasLocalDifferences) setIsMigrationModalOpen(true);
          return;
        }

        setBooks(cloudBooks);
        setSyncPhase('ready');
      },
      (error) => {
        initialSnapshotHandled.current = true;
        setSyncPhase('offline');
        setSaveState('error');
        setSaveMessage(formatFirestoreErrorMessage(error));
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, currentUser?.email, syncAttempt]);

  // Keep local cache in sync whenever books state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(books));
    } catch (e) {
      console.warn('Erro ao gravar cache local:', e);
    }
  }, [books]);

  useEffect(() => {
    if (syncPhase !== 'ready' || isMigrationModalOpen || books.length === 0) return;

    const runAutomaticBackup = () => {
      if (automaticBackupInProgress.current) return;
      automaticBackupInProgress.current = true;
      void exportToGoogleDrive(books, false, true).then((result) => {
        if (!result.success && !result.message.includes('aguardando autorização')) {
          console.warn('Backup automático do Drive não concluído:', result.message);
        }
      }).finally(() => {
        automaticBackupInProgress.current = false;
      });
    };

    const timeoutId = window.setTimeout(runAutomaticBackup, 3000);
    const intervalId = window.setInterval(runAutomaticBackup, 24 * 60 * 60 * 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [syncPhase, isMigrationModalOpen, books]);

  const CURRENT_YEAR = 2026;

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([CURRENT_YEAR, 2025, 2024, 2023]);
    books.forEach((b) => {
      if (b.readingYear) yearsSet.add(b.readingYear);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [books]);

  const [selectedYears, setSelectedYears] = useState<number[]>(() => [CURRENT_YEAR]);

  const handleToggleYear = (year: number, isMultiSelect: boolean = false) => {
    setSelectedYears((prev) => {
      if (!isMultiSelect) {
        return [year];
      }
      if (prev.includes(year)) {
        if (prev.length === 1) {
          return [year];
        }
        return prev.filter((y) => y !== year);
      } else {
        return [...prev, year];
      }
    });
  };

  const handleSelectAllYears = () => {
    setSelectedYears(availableYears);
  };

  // Filtered books list based on selected years
  const filteredBooks = useMemo(() => {
    return books.filter((b) => selectedYears.includes(b.readingYear || 2026));
  }, [books, selectedYears]);

  // Read books only
  const readBooks = useMemo(() => {
    return filteredBooks.filter((b) => !b.status || b.status === 'read');
  }, [filteredBooks]);

  // Reading in-progress
  const readingBooks = useMemo(() => {
    return books.filter((b) => b.status === 'reading');
  }, [books]);

  const runWrite = async <T,>(
    label: string,
    operation: () => Promise<T>,
    onSuccess: (result: T) => void,
    retry?: () => Promise<string | null>
  ): Promise<string | null> => {
    if (syncPhase !== 'ready' || !currentUser) {
      const message = syncPhase === 'migration-required'
        ? 'Migre o acervo para o Firestore antes de alterá-lo.'
        : 'O Firestore ainda não está conectado. Tente novamente quando a conexão voltar.';
      setSaveState('error');
      setSaveMessage(message);
      return message;
    }

    setSaveState('saving');
    setSaveMessage(`${label}: salvando na nuvem...`);
    setRetryWrite(null);
    try {
      const result = await operation();
      onSuccess(result);
      setSaveState('idle');
      setSaveMessage('Alterações salvas na nuvem.');
      return null;
    } catch (error) {
      const message = formatFirestoreErrorMessage(error);
      setSaveState('error');
      setSaveMessage(`${label}: ${message}`);
      if (retry) setRetryWrite(() => () => { void retry(); });
      return message;
    }
  };

  const persistBook = (book: Book, label = 'Livro'): Promise<string | null> =>
    runWrite(
      label,
      () => saveUserBook(currentUser!.uid, book),
      () => setBooks((prev) => (prev.some((item) => item.id === book.id)
        ? prev.map((item) => item.id === book.id ? book : item)
        : [...prev, book])),
      () => persistBook(book, label)
    );

  const persistNewBook = (
    buildBook: (id: number) => Book,
    label: string,
    requestId: string = crypto.randomUUID()
  ): Promise<string | null> => runWrite(
    label,
    () => createUserBook(currentUser!.uid, buildBook, requestId),
    (book) => setBooks((prev) => [...prev.filter((item) => item.id !== book.id), book]),
    () => persistNewBook(buildBook, label, requestId)
  );

  const handleSaveBook = async (bookData: Omit<Book, 'id' | 'monthId'> & { id?: number }): Promise<string | null> => {
    if (bookData.id) {
      const updatedBook: Book = {
        ...books.find((b) => b.id === bookData.id),
        ...bookData,
      } as Book;
      return persistBook(updatedBook, 'Edição do livro');
    } else {
      const yearToUse = bookData.readingYear || 2026;
      const sameMonthCount = books.filter(
        (b) => (b.readingYear || 2026) === yearToUse && b.month === bookData.month
      ).length;

      return persistNewBook((id) => ({
        ...bookData,
        readingYear: yearToUse,
        id,
        monthId: sameMonthCount + 1,
        status: bookData.status || 'read',
      }), 'Novo livro');
    }
  };

  const persistDeleteBook = (id: number): Promise<string | null> => runWrite(
    'Exclusão do livro',
    () => deleteUserBook(currentUser!.uid, id),
    () => setBooks((prev) => prev.filter((book) => book.id !== id)),
    () => persistDeleteBook(id)
  );

  const handleDeleteBook = (id: number) => {
    if (window.confirm(`Tem certeza que deseja excluir a leitura #${id}?`)) {
      void persistDeleteBook(id);
    }
  };

  const handleSaveFichamento = (bookId: number, fichamento: FichamentoData): Promise<string | null> => {
    const book = books.find((item) => item.id === bookId);
    if (!book) return Promise.resolve('O livro não foi encontrado no acervo atual.');
    return persistBook({ ...book, fichamento }, 'Fichamento');
  };

  // In-Progress Reading Handlers
  const handleAddReadingBook = (newBookData: Omit<Book, 'id' | 'monthId'>) => {
    return persistNewBook((id) => ({
      ...newBookData,
      id,
      status: 'reading',
      monthId: 1,
    }), 'Nova leitura em andamento');
  };

  const handleCompleteReading = (
    bookId: number,
    rating: number,
    month: MonthName,
    readingYear: number
  ) => {
    const target = books.find((book) => book.id === bookId);
    if (!target) return;

    const readInTargetYear = books.filter(
        (b) => (!b.status || b.status === 'read') && (b.readingYear || 2026) === readingYear
      );
    const readInTargetMonth = readInTargetYear.filter((b) => b.month === month);

    const completedBook: Book = {
      ...target,
      status: 'read',
      rating,
      month,
      readingYear,
      yearBookId: readInTargetYear.length + 1,
      monthId: readInTargetMonth.length + 1,
    };

    void persistBook(completedBook, 'Conclusão da leitura');
  };

  // Wishlist Handlers
  const handleAddWish = (title: string, author: string) => {
    const now = new Date();
    const currMonthName = MONTHS_LIST[now.getMonth()] || 'Agosto';
    void persistNewBook((id) => ({
      id,
      title,
      author,
      readingYear: 2026,
      yearBookId: 0,
      monthId: now.getMonth() + 1,
      month: currMonthName,
      year: 2026,
      pages: 0,
      nationality: 'Brasil',
      continent: 'América do Sul',
      format: 'Físico',
      language: 'Português',
      rating: 5,
      status: 'wishlist',
    }), 'Novo item na lista de desejos');
  };

  const handleMarkAsRead = (wishBook: Book) => {
    setEditingBook({ ...wishBook, status: 'read' });
    setIsModalOpen(true);
  };

  const handleRestoreBooks = async (importedBooks: Book[]): Promise<void> => {
    const restoredBooks = mergeBooksWithCanonical(importedBooks);
    const error = await runWrite(
      'Restauração do backup',
      () => replaceUserBooks(currentUser!.uid, restoredBooks),
      () => setBooks(restoredBooks)
    );
    if (error) throw new Error(error);
  };

  const handleOpenAddModal = () => {
    setEditingBook(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book: Book) => {
    setEditingBook(book);
    setIsModalOpen(true);
  };

  // Auth Gate: Only allow matheusreiserm@gmail.com
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const isAuthorized =
    currentUser && currentUser.email?.toLowerCase() === ALLOWED_EMAIL.toLowerCase();

  if (!currentUser || !isAuthorized) {
    return <LoginView currentUser={currentUser} />;
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Header */}
      <Header
        books={readBooks}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        availableYears={availableYears}
        selectedYears={selectedYears}
        onToggleYear={handleToggleYear}
        onSelectAllYears={handleSelectAllYears}
        onAddBook={handleOpenAddModal}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        userEmail={currentUser.email}
        onLogout={logout}
        readingBooksCount={readingBooks.length}
      />

      {(syncPhase === 'connecting' || syncPhase === 'offline' || syncPhase === 'migration-required' || saveState !== 'idle') && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-xs ${
            saveState === 'error' || syncPhase === 'offline' || syncPhase === 'migration-required'
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : 'border-stone-300 bg-white text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300'
          }`}>
            <span>
              {syncPhase === 'connecting' && 'Conectando ao Firestore...'}
              {syncPhase === 'offline' && `Sem conexão com o Firestore. O cache local foi mantido. ${saveMessage}`}
              {syncPhase === 'migration-required' && 'A nuvem ainda não tem o acervo. Migre os dados locais antes de fazer novas alterações.'}
              {syncPhase === 'ready' && saveState !== 'idle' && saveMessage}
            </span>
            <div className="flex items-center gap-2">
              {(syncPhase === 'offline' || syncPhase === 'connecting') && (
                <button
                  onClick={() => setSyncAttempt((attempt) => attempt + 1)}
                  className="font-semibold underline underline-offset-2"
                >
                  Reconectar
                </button>
              )}
              {syncPhase === 'migration-required' && (
                <button
                  onClick={() => setIsMigrationModalOpen(true)}
                  className="font-semibold underline underline-offset-2"
                >
                  Migrar acervo
                </button>
              )}
              {saveState === 'error' && retryWrite && (
                <button
                  onClick={() => retryWrite()}
                  className="font-semibold underline underline-offset-2"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'journal' && (
          <MonthlyJournalView
            books={readBooks}
            selectedYears={selectedYears}
            availableYears={availableYears}
            onEditBook={handleOpenEditModal}
            onDeleteBook={handleDeleteBook}
            onOpenCover={(b) => setSelectedCoverBook(b)}
            onOpenFichamento={(b) => setSelectedFichamentoBook(b)}
          />
        )}

        {activeTab === 'reading' && (
          <ReadingView
            books={books}
            onAddReading={handleAddReadingBook}
            onEditReading={handleOpenEditModal}
            onDeleteReading={handleDeleteBook}
            onCompleteReading={handleCompleteReading}
            onOpenCover={(b) => setSelectedCoverBook(b)}
            onOpenFichamento={(b) => setSelectedFichamentoBook(b)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            books={readBooks}
            onNavigateToMatrix={() => setActiveTab('matrix')}
          />
        )}

        {activeTab === 'matrix' && (
          <NationalityMatrixView
            books={readBooks}
            onEditBook={handleOpenEditModal}
            onDeleteBook={handleDeleteBook}
            onOpenCover={(b) => setSelectedCoverBook(b)}
            onOpenFichamento={(b) => setSelectedFichamentoBook(b)}
          />
        )}

        {activeTab === 'table' && (
          <MasterTableView
            books={readBooks}
            onEditBook={handleOpenEditModal}
            onDeleteBook={handleDeleteBook}
            onAddBook={handleOpenAddModal}
            onOpenCover={(b) => setSelectedCoverBook(b)}
            onOpenFichamento={(b) => setSelectedFichamentoBook(b)}
          />
        )}

        {activeTab === 'wrapped' && (
          <WrappedView books={books} availableYears={availableYears} />
        )}

        {activeTab === 'wishlist' && (
          <WishlistView
            books={books}
            onAddWish={handleAddWish}
            onMarkAsRead={handleMarkAsRead}
            onDeleteWish={handleDeleteBook}
            onOpenCover={(b) => setSelectedCoverBook(b)}
          />
        )}
      </main>

      {/* Add / Edit Modal */}
      <BookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBook}
        initialData={editingBook}
        totalBooksCount={books.length}
      />

      {/* Cover Highlight Modal */}
      <CoverHighlightModal
        book={selectedCoverBook}
        isOpen={!!selectedCoverBook}
        onClose={() => setSelectedCoverBook(null)}
        onOpenFichamento={(b) => {
          setSelectedCoverBook(null);
          setSelectedFichamentoBook(b);
        }}
        onEditBook={handleOpenEditModal}
      />

      {/* Fichamento Modal */}
      <FichamentoModal
        book={selectedFichamentoBook}
        isOpen={!!selectedFichamentoBook}
        onClose={() => setSelectedFichamentoBook(null)}
        onSave={handleSaveFichamento}
      />

      {/* Backup & Restauração Manual Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        books={books}
        onRestoreBooks={handleRestoreBooks}
      />

      <MigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => {
          setIsMigrationModalOpen(false);
          if (syncPhase === 'ready') {
            migrationSourceBooks.current = books;
            localStorage.removeItem(LOCAL_STORAGE_MIGRATION_SOURCE_KEY);
          }
        }}
        userId={currentUser.uid}
        userEmail={currentUser.email || ''}
        books={migrationSourceBooks.current}
        onMigrationSuccess={async () => {
          setIsMigrationModalOpen(false);
          try {
            const syncedBooks = await fetchUserBooks(currentUser.uid);
            setBooks(syncedBooks);
            migrationSourceBooks.current = syncedBooks;
            localStorage.removeItem(LOCAL_STORAGE_MIGRATION_SOURCE_KEY);
            setSyncPhase('ready');
          } catch (error) {
            setSyncPhase('offline');
            setSaveState('error');
            setSaveMessage(formatFirestoreErrorMessage(error));
          }
        }}
      />

    </div>
  );
}
