import React, { useState, useMemo } from 'react';
import { Book, FormatType, MonthName, LanguageType } from '../types';
import { MONTHS_LIST } from '../utils/helpers';
import { StarRating } from './StarRating';
import { CountryFlag } from './CountryFlag';
import { Search, Filter, ArrowUpDown, Edit3, Trash2, Plus, Download, BookOpen, FileText, Image } from 'lucide-react';

interface MasterTableViewProps {
  books: Book[];
  onEditBook: (book: Book) => void;
  onDeleteBook: (id: number) => void;
  onAddBook: () => void;
  onOpenCover?: (book: Book) => void;
  onOpenFichamento?: (book: Book) => void;
}

export const MasterTableView: React.FC<MasterTableViewProps> = ({
  books,
  onEditBook,
  onDeleteBook,
  onAddBook,
  onOpenCover,
  onOpenFichamento,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('Todos');
  const [filterFormat, setFilterFormat] = useState<string>('Todos');
  const [filterRating, setFilterRating] = useState<string>('Todos');
  const [filterLanguage, setFilterLanguage] = useState<string>('Todos');

  const [sortField, setSortField] = useState<'id' | 'title' | 'author' | 'year' | 'pages' | 'rating'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filtered & Sorted list
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        const matchesSearch =
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.nationality.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(book.year).includes(searchTerm);

        const matchesMonth = filterMonth === 'Todos' || book.month === filterMonth;
        const matchesFormat = filterFormat === 'Todos' || book.format === filterFormat;
        const matchesRating = filterRating === 'Todos' || String(book.rating) === filterRating;
        const matchesLanguage = filterLanguage === 'Todos' || book.language === filterLanguage;

        return matchesSearch && matchesMonth && matchesFormat && matchesRating && matchesLanguage;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          valA = (valA as string).toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [books, searchTerm, filterMonth, filterFormat, filterRating, filterLanguage, sortField, sortOrder]);

  const handleSortToggle = (field: 'id' | 'title' | 'author' | 'year' | 'pages' | 'rating') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por título, autor, país ou ano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick Add Button */}
          <button
            onClick={onAddBook}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow transition-all cursor-pointer shrink-0"
          >
            <Plus size={15} />
            <span>Adicionar Leitura</span>
          </button>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 dark:border-stone-800 text-xs">
          <span className="flex items-center gap-1 font-semibold text-stone-500 mr-1">
            <Filter size={13} /> Filtros:
          </span>

          {/* Month Filter */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="Todos">Mês: Todos</option>
            {MONTHS_LIST.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* Format Filter */}
          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="Todos">Formato: Todos</option>
            <option value="Físico">Físico</option>
            <option value="Kindle">Kindle</option>
            <option value="PDF">PDF</option>
            <option value="Archive.org">Archive.org</option>
            <option value="Audible">Audible</option>
            <option value="Físico/Audible">Físico/Audible</option>
          </select>

          {/* Rating Filter */}
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="Todos">Avaliação: Todas</option>
            <option value="6">6★ (Excepcional)</option>
            <option value="5">5★ (Excelente)</option>
            <option value="4">4★ (Muito Bom)</option>
            <option value="3">3★ (Bom)</option>
            <option value="2">2★ (Regular)</option>
            <option value="1">1★ (Ruim)</option>
          </select>

          {/* Language Filter */}
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-2.5 py-1.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg text-stone-700 dark:text-stone-300 focus:outline-none focus:border-amber-500"
          >
            <option value="Todos">Idioma: Todos</option>
            <option value="Português">Português</option>
            <option value="Inglês">Inglês</option>
            <option value="Espanhol">Espanhol</option>
            <option value="Francês">Francês</option>
            <option value="Não informado">Não informado</option>
          </select>

          {/* Clear Filters Button */}
          {(filterMonth !== 'Todos' || filterFormat !== 'Todos' || filterRating !== 'Todos' || filterLanguage !== 'Todos' || searchTerm) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterMonth('Todos');
                setFilterFormat('Todos');
                setFilterRating('Todos');
                setFilterLanguage('Todos');
              }}
              className="px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline cursor-pointer font-medium ml-auto"
            >
              Limpar Filtros
            </button>
          )}

          <span className="text-[11px] text-stone-400 font-mono ml-auto">
            {filteredBooks.length} de {books.length} leituras
          </span>
        </div>
      </div>

      {/* Main Linear Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-100 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-mono uppercase text-[10px] tracking-wider">
                <th
                  onClick={() => handleSortToggle('id')}
                  className="py-3 px-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ID (#)</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3 px-3">Mês</th>
                <th
                  onClick={() => handleSortToggle('title')}
                  className="py-3 px-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Título</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('author')}
                  className="py-3 px-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Autor</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('year')}
                  className="py-3 px-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Ano</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('pages')}
                  className="py-3 px-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Pág</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3 px-3">Nacionalidade</th>
                <th className="py-3 px-3">Formato</th>
                <th className="py-3 px-3">Idioma</th>
                <th
                  onClick={() => handleSortToggle('rating')}
                  className="py-3 px-3 cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Nota</span>
                    <ArrowUpDown size={11} />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredBooks.map((book) => {
                return (
                  <tr
                    key={book.id}
                    className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors"
                  >
                    {/* ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-800 dark:text-amber-400">
                      #{String(book.id).padStart(2, '0')}
                    </td>

                    {/* Month */}
                    <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400 font-medium">
                      {book.month}
                    </td>

                    {/* Title */}
                    <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-stone-100 max-w-xs truncate">
                      {book.title}
                    </td>

                    {/* Author */}
                    <td className="py-2.5 px-3 text-stone-700 dark:text-stone-300">
                      {book.author}
                    </td>

                    {/* Year */}
                    <td className="py-2.5 px-3 text-center font-mono text-stone-600 dark:text-stone-400">
                      {book.year}
                    </td>

                    {/* Pages */}
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                      {book.pages}
                    </td>

                    {/* Nationality */}
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 font-medium text-stone-800 dark:text-stone-200">
                        <CountryFlag country={book.nationality} size="xs" />
                        <span>{book.nationality}</span>
                      </span>
                    </td>

                    {/* Format */}
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                        {book.format}
                      </span>
                    </td>

                    {/* Language */}
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-900/50">
                        {book.language}
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="py-2.5 px-3 text-center">
                      <StarRating rating={book.rating} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onOpenCover && (
                          <button
                            onClick={() => onOpenCover(book)}
                            className="p-1 rounded text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                            title="Ver capa destacada"
                          >
                            <Image size={14} />
                          </button>
                        )}
                        {onOpenFichamento && (
                          <button
                            onClick={() => onOpenFichamento(book)}
                            className="p-1 rounded text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors relative"
                            title="Fichamento de leitura"
                          >
                            <FileText size={14} />
                            {book.fichamento?.items?.some(i => i.text || i.page) && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => onEditBook(book)}
                          className="p-1 rounded text-stone-500 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Editar registro"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteBook(book.id)}
                          className="p-1 rounded text-stone-500 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Excluir registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
