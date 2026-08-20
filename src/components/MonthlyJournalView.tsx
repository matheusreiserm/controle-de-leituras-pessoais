import React, { useState, useMemo } from 'react';
import { Book, MonthName } from '../types';
import { MONTHS_LIST } from '../utils/helpers';
import { BookCard } from './BookCard';
import { Calendar, BookOpen, UserCheck, Layers, Filter, Globe, Clock, User, Search, X, ArrowUpDown } from 'lucide-react';

// Reverse months list so recent months appear first (Dezembro -> Janeiro)
const REVERSE_MONTHS_LIST = [...MONTHS_LIST].reverse();

interface MonthlyJournalViewProps {
  books: Book[];
  selectedYears?: number[];
  availableYears?: number[];
  onEditBook?: (book: Book) => void;
  onDeleteBook?: (id: number) => void;
  onOpenCover?: (book: Book) => void;
  onOpenFichamento?: (book: Book) => void;
}

function getBookDecade(year: number | string): string {
  if (typeof year === 'string') {
    if (year.includes('XI')) return 'Século XI';
    if (year.includes('XIV')) return 'Século XIV';
    if (year.includes('II')) return 'Séc. II (Antiguidade)';
    const parsed = parseInt(year, 10);
    if (!isNaN(parsed)) year = parsed;
    else return 'Clássicos Antigos';
  }
  if (typeof year === 'number') {
    if (year < 1800) return 'Antes de 1800';
    if (year < 1900) return 'Século XIX (1800s)';
    const dec = Math.floor(year / 10) * 10;
    return `${dec}s`;
  }
  return 'Outros';
}

export const MonthlyJournalView: React.FC<MonthlyJournalViewProps> = ({
  books,
  selectedYears = [],
  availableYears = [],
  onEditBook,
  onDeleteBook,
  onOpenCover,
  onOpenFichamento,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthName | 'Todos'>('Todos');

  // Filters specifically for "Todos" (All Years) view
  const [selectedCountry, setSelectedCountry] = useState<string>('Todos');
  const [selectedDecade, setSelectedDecade] = useState<string>('Todas');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'reading' | 'reverse' | 'pubYear' | 'title'>('reading');

  // Determine if we are in "Todos" (All Years or Multiple Years) mode
  const isAllYearsMode =
    selectedYears.length > 1 ||
    (availableYears.length > 0 && selectedYears.length === availableYears.length);

  // Derive unique filter options for "Todos" mode
  const uniqueCountries = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      if (b.nationality) {
        counts[b.nationality] = (counts[b.nationality] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([country, count]) => ({ country, count }));
  }, [books]);

  const uniqueDecades = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      const dec = getBookDecade(b.year);
      counts[dec] = (counts[dec] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([decade, count]) => ({ decade, count }));
  }, [books]);

  const uniqueAuthors = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) => {
      if (b.author) {
        counts[b.author] = (counts[b.author] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([author, count]) => ({ author, count }));
  }, [books]);

  // Filtered books list for "Todos" mode
  const filteredAllBooks = useMemo(() => {
    let result = books.filter((b) => {
      if (selectedCountry !== 'Todos' && b.nationality !== selectedCountry) return false;
      if (selectedDecade !== 'Todas' && getBookDecade(b.year) !== selectedDecade) return false;
      if (selectedAuthor !== 'Todos' && b.author !== selectedAuthor) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchAuthor = b.author.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor) return false;
      }
      return true;
    });

    // Apply sorting
    return result.sort((a, b) => {
      if (sortOrder === 'reverse') return b.id - a.id;
      if (sortOrder === 'pubYear') {
        const yA = typeof a.year === 'number' ? a.year : 0;
        const yB = typeof b.year === 'number' ? b.year : 0;
        return yA - yB;
      }
      if (sortOrder === 'title') return a.title.localeCompare(b.title);
      return a.id - b.id; // default reading order
    });
  }, [books, selectedCountry, selectedDecade, selectedAuthor, searchQuery, sortOrder]);

  const hasActiveFilters =
    selectedCountry !== 'Todos' ||
    selectedDecade !== 'Todas' ||
    selectedAuthor !== 'Todos' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCountry('Todos');
    setSelectedDecade('Todas');
    setSelectedAuthor('Todos');
    setSearchQuery('');
  };

  // Group books by month for Single Year mode
  const booksByMonth: Record<string, Book[]> = {};
  REVERSE_MONTHS_LIST.forEach((m) => {
    booksByMonth[m] = [];
  });

  books.forEach((b) => {
    if (!booksByMonth[b.month]) {
      booksByMonth[b.month] = [];
    }
    booksByMonth[b.month].push(b);
  });

  // Sort books within each month from most recent read to oldest read
  Object.keys(booksByMonth).forEach((m) => {
    booksByMonth[m].sort((a, b) => (b.monthId || b.id) - (a.monthId || a.id));
  });

  const displayMonths =
    selectedMonth === 'Todos'
      ? REVERSE_MONTHS_LIST.filter((m) => booksByMonth[m] && booksByMonth[m].length > 0)
      : [selectedMonth];

  // Render "Todos" Mode (Single Box for All Books with Country, Decade, Author Filters)
  if (isAllYearsMode) {
    const totalPagesFiltered = filteredAllBooks.reduce((acc, b) => acc + (b.pages || 0), 0);
    const totalAuthorsFiltered = new Set(filteredAllBooks.map((b) => b.author)).size;
    const totalCountriesFiltered = new Set(filteredAllBooks.map((b) => b.nationality)).size;

    return (
      <div className="space-y-6">
        {/* "Todos" Filter Header Box */}
        <div className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-500/20 text-amber-500 rounded-lg">
                <Layers size={18} />
              </span>
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                  Acervo Completo de Leituras (Todas as {books.length} Obras em Ordem)
                </h2>
                <p className="text-xs text-stone-500">
                  Exibição unificada das leituras registradas com filtros avançados por País, Década e Autor.
                </p>
              </div>
            </div>

            {/* Total Summary Badge */}
            <div className="flex items-center gap-2 text-xs bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl self-start sm:self-auto font-mono text-stone-700 dark:text-stone-300">
              <span className="font-bold text-amber-600 dark:text-amber-400">{filteredAllBooks.length}</span>
              <span>obras</span>
              <span>•</span>
              <span>{totalPagesFiltered.toLocaleString('pt-BR')} pág</span>
              <span>•</span>
              <span>{totalAuthorsFiltered} autores</span>
              <span>•</span>
              <span>{totalCountriesFiltered} países</span>
            </div>
          </div>

          {/* Filters Bar: Country, Decade, Author, Search, Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
            {/* Country Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 uppercase tracking-wider">
                <Globe size={12} className="text-amber-500" /> País:
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="Todos">Todos os Países ({books.length})</option>
                {uniqueCountries.map(({ country, count }) => (
                  <option key={country} value={country}>
                    {country} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Decade Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 uppercase tracking-wider">
                <Clock size={12} className="text-amber-500" /> Década / Época:
              </label>
              <select
                value={selectedDecade}
                onChange={(e) => setSelectedDecade(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="Todas">Todas as Décadas</option>
                {uniqueDecades.map(({ decade, count }) => (
                  <option key={decade} value={decade}>
                    {decade} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Author Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 uppercase tracking-wider">
                <User size={12} className="text-amber-500" /> Autor:
              </label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="Todos">Todos os Autores ({uniqueAuthors.length})</option>
                {uniqueAuthors.map(({ author, count }) => (
                  <option key={author} value={author}>
                    {author} ({count})
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 uppercase tracking-wider">
                <Search size={12} className="text-amber-500" /> Buscar Livro/Autor:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Digite título ou autor..."
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-2.5 pr-7 py-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-stone-500 flex items-center gap-1 uppercase tracking-wider">
                <ArrowUpDown size={12} className="text-amber-500" /> Ordenação:
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-800 dark:text-stone-200 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="reading">Ordem de Leitura (#1 → #{books.length})</option>
                <option value="reverse">Mais Recente (#1 Inverso)</option>
                <option value="pubYear">Ano de Publicação</option>
                <option value="title">Título da Obra (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Reset Filters Bar if Active */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between text-xs bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl">
              <span className="text-amber-900 dark:text-amber-300 font-medium">
                Filtros ativos aplicados. Exibindo {filteredAllBooks.length} de {books.length} obras.
              </span>
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 bg-amber-500 text-stone-950 rounded-lg text-xs font-bold hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X size={12} /> Limpar Filtros
              </button>
            </div>
          )}
        </div>

        {/* Single Box containing all books */}
        {filteredAllBooks.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-10 border border-stone-200/80 dark:border-stone-800 text-center space-y-3">
            <Filter size={32} className="mx-auto text-amber-500 opacity-60" />
            <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
              Nenhuma leitura encontrada com os filtros selecionados
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Tente alterar os filtros de País, Década ou Autor para visualizar as obras do seu acervo.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Restaurar Todos os Filtros
            </button>
          </div>
        ) : (
          <div className="bg-stone-100/50 dark:bg-stone-900/40 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 font-semibold px-1">
              <span>Exibindo caixa única de leituras ({filteredAllBooks.length} itens):</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                # global de leitura 1 até #{books.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAllBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  displayNumber={book.id}
                  showYearBadge={true}
                  onEdit={onEditBook}
                  onDelete={onDeleteBook}
                  onOpenCover={onOpenCover}
                  onOpenFichamento={onOpenFichamento}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render Single Year Mode (Monthly Blocks & Month Filter Pills)
  return (
    <div className="space-y-6">
      {/* Top Selector: Months Pills (Most Recent First) */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200">
            <Calendar size={14} className="text-amber-500" /> Diário de Leitura Mensal (Ano Individual)
          </span>
          <span>
            {selectedMonth === 'Todos'
              ? `${books.length} leituras no ano`
              : `${booksByMonth[selectedMonth]?.length || 0} leituras em ${selectedMonth}`}
          </span>
        </div>

        {/* Month Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedMonth('Todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedMonth === 'Todos'
                ? 'bg-amber-500 text-stone-950 font-bold shadow'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            Todos os Meses ({books.length})
          </button>

          {REVERSE_MONTHS_LIST.map((m) => {
            const count = booksByMonth[m]?.length || 0;
            const isSelected = selectedMonth === m;
            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 font-bold shadow'
                    : count > 0
                    ? 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700'
                    : 'bg-stone-50 dark:bg-stone-900/40 text-stone-400 dark:text-stone-600 opacity-60'
                }`}
              >
                <span>{m}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected
                      ? 'bg-stone-950 text-amber-300'
                      : count > 0
                      ? 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Each Month Block */}
      {books.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200/80 dark:border-stone-800 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg border border-amber-500/30">
            <BookOpen size={20} />
          </div>
          <h3 className="text-lg font-serif font-bold text-stone-900 dark:text-stone-100">
            Nenhuma leitura registrada para este ano ainda
          </h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Clique em <strong className="text-amber-600 dark:text-amber-400">"Adicionar Nova Leitura"</strong> para registrar obras neste ano.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayMonths.map((month) => {
            const monthBooks = booksByMonth[month] || [];
            if (monthBooks.length === 0) {
              return (
                <div
                  key={month}
                  className="bg-white dark:bg-stone-900 rounded-2xl p-8 border border-stone-200/80 dark:border-stone-800 text-center space-y-2"
                >
                  <p className="text-stone-400 text-sm font-medium">Nenhuma leitura registrada para {month}.</p>
                  <p className="text-xs text-stone-500">Clique em "Adicionar Nova Leitura" para registrar obras neste mês.</p>
                </div>
              );
            }

            const monthPages = monthBooks.reduce((acc, b) => acc + (b.pages || 0), 0);
            const monthAuthors = new Set(monthBooks.map((b) => b.author)).size;

            return (
              <div key={month} className="space-y-4">
                {/* Month Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b-2 border-amber-500/30">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-amber-500 text-stone-950 font-serif font-bold text-lg rounded-xl shadow">
                      {month.slice(0, 3)}
                    </span>
                    <div>
                      <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                        {month}
                      </h2>
                      <p className="text-xs text-stone-500">
                        {monthBooks.length} obras concluídas no ano
                      </p>
                    </div>
                  </div>

                  {/* Month Summary Bar */}
                  <div className="flex items-center gap-3 text-xs bg-stone-100 dark:bg-stone-800/60 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700/60 self-start sm:self-auto">
                    <span className="flex items-center gap-1 font-mono font-bold text-stone-700 dark:text-stone-300">
                      <BookOpen size={13} className="text-amber-500" /> {monthBooks.length} livros
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span className="flex items-center gap-1 font-mono font-bold text-stone-700 dark:text-stone-300">
                      <Layers size={13} className="text-indigo-500" /> {monthPages.toLocaleString('pt-BR')} pág
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span className="flex items-center gap-1 font-mono font-bold text-stone-700 dark:text-stone-300">
                      <UserCheck size={13} className="text-emerald-500" /> {monthAuthors} autores
                    </span>
                  </div>
                </div>

                {/* Grid of Cards - Uses annual reading number (yearBookId) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {monthBooks.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      displayNumber={book.yearBookId}
                      showYearBadge={false}
                      onEdit={onEditBook}
                      onDelete={onDeleteBook}
                      onOpenCover={onOpenCover}
                      onOpenFichamento={onOpenFichamento}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
