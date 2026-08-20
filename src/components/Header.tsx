import React from 'react';
import { Book, TabType } from '../types';
import { calculateDashboardStats } from '../utils/helpers';
import {
  BookOpen,
  Globe,
  UserCheck,
  Plus,
  BarChart3,
  Calendar,
  Table,
  Map,
  Filter,
  Check,
  LogOut,
  User,
  CloudUpload,
  Database,
} from 'lucide-react';

interface HeaderProps {
  books: Book[];
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  availableYears: number[];
  selectedYears: number[];
  onToggleYear: (year: number, isMultiSelect: boolean) => void;
  onSelectAllYears: () => void;
  onAddBook: () => void;
  onOpenBackupModal?: () => void;
  onOpenMigrationModal?: () => void;
  userEmail?: string | null;
  onLogout?: () => void;
  readingBooksCount?: number;
  isFirestoreSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  books,
  activeTab,
  onSelectTab,
  availableYears,
  selectedYears,
  onToggleYear,
  onSelectAllYears,
  onAddBook,
  onOpenBackupModal,
  onOpenMigrationModal,
  userEmail,
  onLogout,
  readingBooksCount = 0,
}) => {
  const stats = calculateDashboardStats(books);
  const isAllYearsSelected =
    availableYears.length > 0 && availableYears.every((y) => selectedYears.includes(y));

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Row: Title + Year Selector + Stat Badges Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                <BookOpen size={20} />
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 tracking-tight">
                Leituras
              </h1>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Acervo de Leituras • Diário Mensal • Matriz de Nacionalidades
            </p>
          </div>

          {/* Year Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-950/80 p-1 rounded-xl border border-stone-800">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider px-1.5 flex items-center gap-1">
              <Filter size={11} className="text-amber-400" />
              <span>Ano:</span>
            </span>

            {/* "Todos" button */}
            <button
              onClick={onSelectAllYears}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                isAllYearsSelected
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              Todos
            </button>

            {/* Individual Year Pills */}
            {availableYears.map((yr) => {
              const isSelected = selectedYears.includes(yr);
              return (
                <button
                  key={yr}
                  onClick={(e) => onToggleYear(yr, e.ctrlKey || e.metaKey)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-xs'
                      : 'text-stone-400 border border-stone-800 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                  title={`Clique para selecionar apenas ${yr} (Segure CTRL para selecionar múltiplos)`}
                >
                  {isSelected && <Check size={10} className="text-amber-400" />}
                  <span>{yr}</span>
                </button>
              );
            })}
          </div>

          {/* Stat Badges Summary */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="bg-stone-800/80 border border-stone-700/60 px-3 py-1 rounded-lg flex items-center gap-2">
              <BookOpen size={14} className="text-amber-400" />
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-stone-400">Total Livros</span>
                <span className="font-bold text-stone-100 text-xs sm:text-sm">{stats.totalBooks}</span>
              </div>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/60 px-3 py-1 rounded-lg flex items-center gap-2">
              <span className="text-amber-400 font-serif font-bold text-xs">Pág</span>
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-stone-400">Total Páginas</span>
                <span className="font-bold text-stone-100 text-xs sm:text-sm">{stats.totalPages.toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/60 px-3 py-1 rounded-lg flex items-center gap-2">
              <UserCheck size={14} className="text-emerald-400" />
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-stone-400">Autores</span>
                <span className="font-bold text-stone-100 text-xs sm:text-sm">{stats.uniqueAuthors}</span>
              </div>
            </div>

            <div className="bg-stone-800/80 border border-stone-700/60 px-3 py-1 rounded-lg flex items-center gap-2">
              <Globe size={14} className="text-sky-400" />
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-stone-400">Países</span>
                <span className="font-bold text-stone-100 text-xs sm:text-sm">{stats.uniqueCountries}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Navigation Tabs + Primary Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2.5">
          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => onSelectTab('journal')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Calendar size={15} />
              <span>Diário Mensal</span>
            </button>

            <button
              onClick={() => onSelectTab('reading')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'reading'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <BookOpen size={15} />
              <span>Lendo</span>
              {readingBooksCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    activeTab === 'reading'
                      ? 'bg-stone-950 text-amber-400'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {readingBooksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <BarChart3 size={15} />
              <span>Painel Analítico</span>
            </button>

            <button
              onClick={() => onSelectTab('matrix')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Map size={15} />
              <span>Matriz de Nacionalidades</span>
            </button>

            <button
              onClick={() => onSelectTab('table')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800'
              }`}
            >
              <Table size={15} />
              <span>Tabela Mestre ({stats.totalBooks})</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={onAddBook}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition-all shrink-0 cursor-pointer"
            >
              <Plus size={15} />
              <span>Nova Leitura</span>
            </button>

            {onOpenMigrationModal && (
              <button
                onClick={onOpenMigrationModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold shadow transition-all shrink-0 cursor-pointer"
                title="Ferramenta de Migração e Validação do Firestore"
              >
                <Database size={15} className="text-amber-400" />
                <span>Migração Nuvem</span>
              </button>
            )}

            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                className="p-2 bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 rounded-lg shadow transition-all shrink-0 cursor-pointer flex items-center justify-center"
                title="Backup e Restauração Manual (Google Drive & JSON)"
              >
                <CloudUpload size={18} className="text-amber-400" />
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-all cursor-pointer flex items-center gap-1.5 border border-stone-800 ml-1"
                title={`Conectado como ${userEmail || ''}. Clique para Sair.`}
              >
                <User size={15} className="text-amber-400" />
                <span className="hidden sm:inline text-xs font-mono max-w-[120px] truncate text-stone-300">
                  {userEmail?.split('@')[0]}
                </span>
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
