import React, { useState } from 'react';
import { Book } from '../types';
import { calculateCountryStats, getContinentColors } from '../utils/helpers';
import { BookCard } from './BookCard';
import { CountryFlag } from './CountryFlag';
import { Globe, UserCheck, Search, ChevronDown, ChevronUp, BookOpen, Layers, Filter } from 'lucide-react';

interface NationalityMatrixViewProps {
  books: Book[];
  onEditBook?: (book: Book) => void;
  onDeleteBook?: (id: number) => void;
  onOpenCover?: (book: Book) => void;
  onOpenFichamento?: (book: Book) => void;
}

export const NationalityMatrixView: React.FC<NationalityMatrixViewProps> = ({
  books,
  onEditBook,
  onDeleteBook,
  onOpenCover,
  onOpenFichamento,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinent, setSelectedContinent] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'volume' | 'authors' | 'ratio'>('volume');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  const countryStats = calculateCountryStats(books);

  // Continents list for filter
  const continentTabs = [
    { key: 'Todos', label: 'Todos' },
    { key: 'América', label: 'América' },
    { key: 'Europa', label: 'Europa' },
    { key: 'África', label: 'África' },
    { key: 'Ásia', label: 'Ásia' },
    { key: 'Oceania', label: 'Oceania' },
  ];

  // Filter & Sort
  const filteredStats = countryStats
    .filter((cs) => {
      const matchesSearch =
        cs.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cs.authorsList.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesContinent =
        selectedContinent === 'Todos'
          ? true
          : selectedContinent === 'América'
          ? cs.continent === 'América do Sul' || cs.continent === 'América do Norte'
          : cs.continent === selectedContinent;
      return matchesSearch && matchesContinent;
    })
    .sort((a, b) => {
      if (sortBy === 'volume') return b.volume - a.volume || b.uniqueAuthors - a.uniqueAuthors;
      if (sortBy === 'authors') return b.uniqueAuthors - a.uniqueAuthors || b.volume - a.volume;
      const ratioA = a.volume / a.uniqueAuthors;
      const ratioB = b.volume / b.uniqueAuthors;
      return ratioB - ratioA;
    });

  const totalVolume = countryStats.reduce((acc, c) => acc + c.volume, 0);

  return (
    <div className="space-y-6">
      {/* Informational Banner */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Globe size={16} /> Matriz de Dupla Contagem Literária
            </div>
            <h2 className="text-2xl font-serif font-bold text-amber-100 mt-1">
              Volume de Leitura vs. Diversidade por País
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-3xl">
              Esta matriz gerencia a diversidade geográfica e autoral de forma rigorosa, distinguindo o{' '}
              <strong className="text-amber-300">Volume de Leitura</strong> (número total de livros lidos por país) da{' '}
              <strong className="text-emerald-400">Diversidade Literária</strong> (autores únicos lidos daquele país).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-stone-950/80 p-3 rounded-xl border border-stone-800 shrink-0">
            <div className="text-center px-3 border-r border-stone-800">
              <span className="block text-[10px] uppercase text-stone-400">Total Países</span>
              <span className="text-xl font-bold font-mono text-stone-100">{countryStats.length}</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-[10px] uppercase text-stone-400">Média Livros/País</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {(totalVolume / (countryStats.length || 1)).toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Controls: Search, Sort */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs border-t border-stone-800">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar país ou autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-950/90 border border-stone-700/80 rounded-lg text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Sort Toggle */}
          <div className="flex items-center bg-stone-950/90 border border-stone-700/80 rounded-lg p-1 shrink-0">
            <button
              onClick={() => setSortBy('volume')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                sortBy === 'volume'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Ordenar p/ Volume
            </button>
            <button
              onClick={() => setSortBy('authors')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                sortBy === 'authors'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Ordenar p/ Autores
            </button>
            <button
              onClick={() => setSortBy('ratio')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                sortBy === 'ratio'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Razão Autores/Livro
            </button>
          </div>
        </div>

        {/* Translucent Continent Filter Bar */}
        <div className="pt-3 border-t border-stone-800/60">
          <div className="flex items-center gap-2 mb-2 text-stone-400 text-[11px] font-mono uppercase tracking-wider">
            <Filter size={12} className="text-amber-400" />
            <span>Filtrar por Continente</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {continentTabs.map((tab) => {
              const colors = getContinentColors(tab.key);
              const isSelected = selectedContinent === tab.key;
              const count = books.filter((b) => {
                if (tab.key === 'Todos') return true;
                if (tab.key === 'América') return b.continent === 'América do Sul' || b.continent === 'América do Norte';
                return b.continent === tab.key;
              }).length;

              if (tab.key === 'Todos') {
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedContinent('Todos')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-stone-800 border-amber-500/70 text-amber-300 shadow-sm font-semibold'
                        : 'bg-stone-950/80 hover:bg-stone-800/80 border-stone-800 text-stone-400'
                    }`}
                  >
                    <span>Todos os Continentes</span>
                    <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-stone-800 text-stone-300 rounded font-mono">
                      {count}
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedContinent(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${colors.bgActive} ${colors.borderActive} ${colors.text} font-semibold shadow-sm backdrop-blur-sm ring-1 ring-amber-500/20`
                      : `${colors.bgTranslucent} ${colors.bgHover} ${colors.border} ${colors.text} opacity-80 hover:opacity-100`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${colors.solidBg}`}></span>
                  <span>{tab.label}</span>
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-black/30 rounded font-mono font-bold">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/80 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-stone-100/80 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 font-mono uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">País & Bandeira</th>
                <th className="py-3 px-4">Continente</th>
                <th className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-400 font-bold">
                    <BookOpen size={13} /> Volume (Obras)
                  </span>
                </th>
                <th className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-400 font-bold">
                    <UserCheck size={13} /> Diversidade (Autores Únicos)
                  </span>
                </th>
                <th className="py-3 px-4 text-center">Média Obra / Autor</th>
                <th className="py-3 px-4 text-left">Autores Lidos</th>
                <th className="py-3 px-4 text-right">Detalhar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredStats.map((cs) => {
                const isExpanded = expandedCountry === cs.country;
                const ratio = (cs.volume / cs.uniqueAuthors).toFixed(1);

                return (
                  <React.Fragment key={cs.country}>
                    <tr
                      onClick={() => setExpandedCountry(isExpanded ? null : cs.country)}
                      className={`hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors cursor-pointer ${
                        isExpanded ? 'bg-amber-50/80 dark:bg-amber-950/30 font-medium' : ''
                      }`}
                    >
                      {/* Country + Flag */}
                      <td className="py-3 px-4 font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2.5">
                        <CountryFlag country={cs.country} size="md" />
                        <span>{cs.country}</span>
                      </td>

                      {/* Continent */}
                      <td className="py-3 px-4 text-xs">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getContinentColors(cs.continent).badgeLight}`}>
                          {cs.continent}
                        </span>
                      </td>

                      {/* Volume */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-mono font-bold text-sm">
                          {cs.volume}
                        </span>
                      </td>

                      {/* Unique Authors */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-mono font-bold text-sm">
                          {cs.uniqueAuthors}
                        </span>
                      </td>

                      {/* Ratio */}
                      <td className="py-3 px-4 text-center font-mono text-xs text-stone-600 dark:text-stone-400">
                        {ratio}x
                      </td>

                      {/* Authors List Preview */}
                      <td className="py-3 px-4 text-xs text-stone-600 dark:text-stone-400 max-w-xs truncate">
                        {cs.authorsList.join(', ')}
                      </td>

                      {/* Expand Button */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCountry(isExpanded ? null : cs.country);
                          }}
                          className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-500 hover:text-stone-950 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Detail Row showing Books from this country */}
                    {isExpanded && (
                      <tr className="bg-stone-50/90 dark:bg-stone-950/60">
                        <td colSpan={7} className="p-4 sm:p-6 border-t border-b border-stone-200 dark:border-stone-800">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
                              <div className="flex items-center gap-2.5">
                                <CountryFlag country={cs.country} size="lg" />
                                <div>
                                  <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                                    Obras de {cs.country} ({cs.volume} livros de {cs.uniqueAuthors} autores)
                                  </h4>
                                  <p className="text-xs text-stone-500">
                                    Autores: {cs.authorsList.join(' • ')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {cs.booksList.map((b) => (
                                <BookCard
                                  key={b.id}
                                  book={b}
                                  onEdit={onEditBook}
                                  onDelete={onDeleteBook}
                                  onOpenCover={onOpenCover}
                                  onOpenFichamento={onOpenFichamento}
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
