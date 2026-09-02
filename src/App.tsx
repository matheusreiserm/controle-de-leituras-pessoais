import React, { useState, useEffect, useMemo } from 'react';
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
import { LoginView } from './components/LoginView';
import { auth, logout, ALLOWED_EMAIL } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { MONTHS_LIST } from './utils/helpers';

const LOCAL_STORAGE_CACHE_KEY = 'controle_leituras_cache_v5';

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
      const cached = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
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

  // Keep local cache in sync whenever books state changes
  useEffect(() => {
    if (books.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(books));
      } catch (e) {
        console.warn('Erro ao gravar cache local:', e);
      }
    }
  }, [books]);

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

  // Os dados ficam no navegador e podem ser exportados/restaurados pelo Google Drive.
  const handleSaveBook = (bookData: Omit<Book, 'id' | 'monthId'> & { id?: number }) => {
    if (bookData.id) {
      const updatedBook: Book = {
        ...books.find((b) => b.id === bookData.id),
        ...bookData,
      } as Book;

      setBooks((prev) => prev.map((b) => (b.id === bookData.id ? updatedBook : b)));

    } else {
      const nextId = books.length > 0 ? Math.max(...books.map((b) => b.id)) + 1 : 1;
      const yearToUse = bookData.readingYear || 2026;
      const sameMonthCount = books.filter(
        (b) => (b.readingYear || 2026) === yearToUse && b.month === bookData.month
      ).length;

      const newBook: Book = {
        ...bookData,
        readingYear: yearToUse,
        id: nextId,
        monthId: sameMonthCount + 1,
        status: bookData.status || 'read',
      };

      setBooks((prev) => [...prev, newBook]);

    }
  };

  // Exclusão local; o backup do Drive só muda quando o usuário exporta.
  const handleDeleteBook = (id: number) => {
    if (window.confirm(`Tem certeza que deseja excluir a leitura #${id}?`)) {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  // Fichamentos também fazem parte do JSON integral do acervo.
  const handleSaveFichamento = (bookId: number, fichamento: FichamentoData) => {
    setBooks((prev) => {
      const updated = prev.map((b) => (b.id === bookId ? { ...b, fichamento } : b));
      return updated;
    });
  };

  // In-Progress Reading Handlers
  const handleAddReadingBook = (newBookData: Omit<Book, 'id' | 'monthId'>) => {
    const nextId = books.length > 0 ? Math.max(...books.map((b) => b.id)) + 1 : 1;
    const newBook: Book = {
      ...newBookData,
      id: nextId,
      status: 'reading',
      monthId: 1,
    };

    setBooks((prev) => [newBook, ...prev]);

  };

  const handleCompleteReading = (
    bookId: number,
    rating: number,
    month: MonthName,
    readingYear: number
  ) => {
    setBooks((prev) => {
      const target = prev.find((b) => b.id === bookId);
      if (!target) return prev;

      const readInTargetYear = prev.filter(
        (b) => (!b.status || b.status === 'read') && (b.readingYear || 2026) === readingYear
      );
      const readInTargetMonth = readInTargetYear.filter((b) => b.month === month);

      const completedBook: Book = {
        ...target,
        status: 'read' as const,
        rating,
        month,
        readingYear,
        yearBookId: readInTargetYear.length + 1,
        monthId: readInTargetMonth.length + 1,
      };

      return prev.map((b) => (b.id === bookId ? completedBook : b));
    });
  };

  // Wishlist Handlers
  const handleAddWish = (title: string, author: string) => {
    const now = new Date();
    const currMonthName = MONTHS_LIST[now.getMonth()] || 'Agosto';
    const nextId = books.length > 0 ? Math.max(...books.map((b) => b.id)) + 1 : 1;

    const newWish: Book = {
      id: nextId,
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
    };

    setBooks((prev) => [newWish, ...prev]);

  };

  const handleMarkAsRead = (wishBook: Book) => {
    setEditingBook({ ...wishBook, status: 'read' });
    setIsModalOpen(true);
  };

  // Restauração manual: a base canônica protege os 551 registros históricos.
  const handleRestoreBooks = (importedBooks: Book[]) => {
    setBooks(mergeBooksWithCanonical(importedBooks));
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

    </div>
  );
}
