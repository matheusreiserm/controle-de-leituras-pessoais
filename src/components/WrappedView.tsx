import React, { useState } from 'react';
import { Book } from '../types';
import { Sparkles, Trophy, Flame, Globe2, Award, Star } from 'lucide-react';

interface WrappedViewProps {
  books: Book[];
  availableYears: number[];
}

export const WrappedView: React.FC<WrappedViewProps> = ({ books, availableYears }) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    return availableYears.length > 0 ? Math.max(...availableYears) : 2026;
  });

  const yearBooks = books.filter(
    (b) => (b.status || 'read') === 'read' && (b.readingYear || 2026) === selectedYear
  );

  const totalBooks = yearBooks.length;
  const totalPages = yearBooks.reduce((acc, b) => acc + (b.pages || 0), 0);

  // Author counts
  const authorCounts: Record<string, number> = {};
  yearBooks.forEach((b) => {
    if (b.author) authorCounts[b.author] = (authorCounts[b.author] || 0) + 1;
  });

  let topAuthor = '';
  let topAuthorCount = 0;
  Object.entries(authorCounts).forEach(([author, count]) => {
    if (count > topAuthorCount) {
      topAuthor = author;
      topAuthorCount = count;
    }
  });

  // Top rated books
  const topBooks = yearBooks.filter((b) => b.rating >= 5).slice(0, 6);

  // Geography
  const countries = Array.from(new Set(yearBooks.map((b) => b.nationality).filter(Boolean)));
  const continents = Array.from(new Set(yearBooks.map((b) => b.continent).filter(Boolean)));

  return (
    <div className="space-y-6 pb-12">
      {/* Year Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-5 rounded-3xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-amber-100">Retrospectiva Literária</h2>
            <p className="text-xs text-stone-400">Destaques e estatísticas do ano</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
          {availableYears.map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedYear === yr
                  ? 'bg-amber-500 text-stone-950 shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {yr}
            </button>
          ))}
        </div>
      </div>

      {/* Wrapped Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Main Stats */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Trophy size={16} /> Total do Ano
          </div>
          <div>
            <span className="text-5xl font-serif font-black text-amber-100">{totalBooks}</span>
            <span className="text-stone-400 text-sm ml-2">livros lidos</span>
          </div>
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs text-stone-300 font-mono">
            <span>Páginas acumuladas:</span>
            <strong className="text-amber-300 font-bold">{totalPages.toLocaleString()} pág.</strong>
          </div>
        </div>

        {/* Card 2: Top Author */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Flame size={16} /> Autor Destaque
          </div>
          <div>
            <h3 className="text-xl font-serif font-bold text-white truncate">{topAuthor || 'N/A'}</h3>
            <p className="text-xs text-stone-400 mt-1">
              {topAuthorCount > 0 ? `${topAuthorCount} obras lidas em ${selectedYear}` : 'Sem registros'}
            </p>
          </div>
          <div className="pt-2 border-t border-stone-800 text-xs text-stone-400 font-mono">
            {topAuthor ? `Presença marcante nas suas leituras de ${selectedYear}` : ''}
          </div>
        </div>

        {/* Card 3: Diversity */}
        <div className="bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 p-6 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Globe2 size={16} /> Fronteiras Literárias
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-3xl font-serif font-bold text-amber-100">{countries.length}</span>
              <span className="text-xs text-stone-400 block font-mono">Países</span>
            </div>
            <div>
              <span className="text-3xl font-serif font-bold text-amber-100">{continents.length}</span>
              <span className="text-xs text-stone-400 block font-mono">Continentes</span>
            </div>
          </div>
          <div className="pt-2 border-t border-stone-800 text-xs text-stone-400 truncate font-mono">
            {countries.slice(0, 4).join(', ')}{countries.length > 4 ? '...' : ''}
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      {topBooks.length > 0 && (
        <div className="bg-stone-900/60 border border-stone-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-sm font-bold font-mono text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Award size={16} /> Favoritos de {selectedYear} (5 e 6 Estrelas)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {topBooks.map((b) => (
              <div
                key={b.id}
                className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex flex-col justify-between space-y-2 group hover:border-amber-500/50 transition-all"
              >
                {b.coverUrl ? (
                  <img
                    src={b.coverUrl}
                    alt={b.title}
                    className="w-full h-36 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-36 bg-stone-900 rounded-xl flex items-center justify-center text-stone-600 font-serif text-2xl font-bold">
                    {b.title.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold font-serif text-stone-200 line-clamp-1">{b.title}</h4>
                  <p className="text-[11px] text-stone-400 truncate">{b.author}</p>
                  <div className="flex items-center gap-1 text-amber-400 text-[10px] mt-1 font-bold">
                    <Star size={10} className="fill-amber-400" />
                    <span>{b.rating}★</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
