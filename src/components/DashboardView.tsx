import React from 'react';
import { Book } from '../types';
import { calculateDashboardStats, calculateCountryStats, getContinentColors } from '../utils/helpers';
import { StarRating } from './StarRating';
import { CountryFlag } from './CountryFlag';
import { BookOpen, UserCheck, Globe, Star, Layers, MapPin, Languages, PieChart, Sparkles } from 'lucide-react';

interface DashboardViewProps {
  books: Book[];
  onNavigateToMatrix: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ books, onNavigateToMatrix }) => {
  const stats = calculateDashboardStats(books);
  const countryStats = calculateCountryStats(books);

  // Top 10 countries for quick matrix preview
  const topCountries = countryStats.slice(0, 8);

  const renderDistributionBar = (
    label: string,
    count: number,
    total: number,
    colorClass: string,
    extraBadge?: string
  ) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div key={label} className="space-y-1">
        <div className="flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
            <span>{label}</span>
            {extraBadge && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-500">
                {extraBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-stone-500 dark:text-stone-400 font-mono">{count} livros</span>
            <span className="font-bold text-stone-900 dark:text-stone-100 font-mono w-9 text-right">
              {percentage}%
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Livros */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Total Livros</span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
              <BookOpen size={16} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {stats.totalBooks}
            </span>
            <p className="text-[11px] text-stone-500 mt-0.5">Registrados no ano</p>
          </div>
        </div>

        {/* Card 2: Total Páginas */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Total Páginas</span>
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg font-serif font-bold text-xs">
              PÁG
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {stats.totalPages.toLocaleString('pt-BR')}
            </span>
            <p className="text-[11px] text-stone-500 mt-0.5">Páginas lidas</p>
          </div>
        </div>

        {/* Card 3: Autores Únicos */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Autores Únicos</span>
            <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
              <UserCheck size={16} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {stats.uniqueAuthors}
            </span>
            <p className="text-[11px] text-stone-500 mt-0.5">Diversidade de autores</p>
          </div>
        </div>

        {/* Card 4: Países Únicos */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Países Únicos</span>
            <span className="p-1.5 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-lg">
              <Globe size={16} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {stats.uniqueCountries}
            </span>
            <p className="text-[11px] text-stone-500 mt-0.5">Nacionalidades distintas</p>
          </div>
        </div>

        {/* Card 5: Média de Páginas */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Média p/ Livro</span>
            <span className="p-1.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 rounded-lg">
              <Layers size={16} />
            </span>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-mono">
              {stats.averagePages}
            </span>
            <p className="text-[11px] text-stone-500 mt-0.5">páginas / livro</p>
          </div>
        </div>

        {/* Card 6: Nota Média */}
        <div className="bg-white dark:bg-stone-900 p-4 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Avaliação Média</span>
            <span className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-500 rounded-lg">
              <Star size={16} className="fill-amber-400" />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-800 dark:text-amber-400 font-mono">
                {stats.averageRating}
              </span>
              <span className="text-xs text-stone-500">/ 6★</span>
            </div>
            <div className="mt-1">
              <StarRating rating={Math.round(stats.averageRating)} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Highlight Box: Matriz de Nacionalidades (Dupla Contagem) */}
      <div className="bg-gradient-to-br from-amber-900/90 via-stone-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-amber-800/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
                Regra Fundamental de Negócio
              </span>
              <span className="text-xs text-stone-300">Dupla Contagem</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-amber-100 mt-1">
              Matriz de Nacionalidades: Volume vs. Diversidade
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-2xl">
              Distinção matemática entre <strong>Volume de Leitura</strong> (total de livros lidos de um determinado país)
              e <strong>Diversidade Literária</strong> (quantidade de autores únicos lidos daquele país).
            </p>
          </div>

          <button
            onClick={onNavigateToMatrix}
            className="self-start md:self-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Ver Matriz Completa</span>
          </button>
        </div>

        {/* Quick Country Table */}
        <div className="overflow-x-auto bg-stone-950/60 rounded-xl border border-amber-900/40 p-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 uppercase font-mono tracking-wider text-[10px]">
                <th className="pb-2 pl-2">País</th>
                <th className="pb-2">Continente</th>
                <th className="pb-2 text-center">Volume (Livros)</th>
                <th className="pb-2 text-center">Diversidade (Autores Únicos)</th>
                <th className="pb-2 text-right pr-2">Proporção (Livro/Autor)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-sans">
              {topCountries.map((c) => {
                const ratio = (c.volume / c.uniqueAuthors).toFixed(1);
                return (
                  <tr key={c.country} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 pl-2 font-medium flex items-center gap-2">
                      <CountryFlag country={c.country} size="sm" />
                      <span className="text-stone-100 font-semibold">{c.country}</span>
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getContinentColors(c.continent).badgeLight}`}>
                        {c.continent}
                      </span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-amber-300 font-mono text-sm">
                      {c.volume} <span className="text-[10px] text-stone-400 font-normal">obras</span>
                    </td>
                    <td className="py-2.5 text-center font-bold text-emerald-400 font-mono text-sm">
                      {c.uniqueAuthors} <span className="text-[10px] text-stone-400 font-normal">autores</span>
                    </td>
                    <td className="py-2.5 text-right pr-2 font-mono text-stone-300">
                      {ratio} <span className="text-stone-500 text-[10px]">x/autor</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid of Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Divisão por Idioma */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-lg">
                <Languages size={18} />
              </span>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Divisão por Idioma
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">{Object.keys(stats.byLanguage).length} idiomas</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.byLanguage)
              .sort((a, b) => b[1] - a[1])
              .map(([lang, count]) =>
                renderDistributionBar(
                  lang,
                  count,
                  stats.totalBooks,
                  lang === 'Português'
                    ? 'bg-emerald-500'
                    : lang === 'Inglês'
                    ? 'bg-sky-500'
                    : lang === 'Espanhol'
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                )
              )}
          </div>
        </div>

        {/* 2. Divisão por Formato */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                <PieChart size={18} />
              </span>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Formato de Leitura
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">{Object.keys(stats.byFormat).length} formatos</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.byFormat)
              .sort((a, b) => b[1] - a[1])
              .map(([fmt, count]) =>
                renderDistributionBar(
                  fmt,
                  count,
                  stats.totalBooks,
                  fmt === 'Físico'
                    ? 'bg-emerald-600'
                    : fmt === 'Kindle'
                    ? 'bg-cyan-500'
                    : fmt === 'PDF'
                    ? 'bg-rose-500'
                    : fmt === 'Archive.org'
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                )
              )}
          </div>
        </div>

        {/* 3. Divisão por Continente */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-lg">
                <MapPin size={18} />
              </span>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Origem por Continente
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">{Object.keys(stats.byContinent).length} continentes</span>
          </div>

          <div className="space-y-3">
            {Object.entries(stats.byContinent)
              .sort((a, b) => b[1] - a[1])
              .map(([cont, count]) =>
                renderDistributionBar(
                  cont,
                  count,
                  stats.totalBooks,
                  getContinentColors(cont).solidBg
                )
              )}
          </div>
        </div>

        {/* 4. Divisão por Década de Publicação */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4 md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-lg">
                <BookOpen size={18} />
              </span>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Década de Publicação (Anos 1800 a 2020)
              </h3>
            </div>
            <span className="text-xs text-stone-400 font-mono">{Object.keys(stats.byDecade).length} décadas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {Object.entries(stats.byDecade)
              .sort((a, b) => {
                // custom sort by year order
                return a[0].localeCompare(b[0]);
              })
              .map(([dec, count]) =>
                renderDistributionBar(dec, count, stats.totalBooks, 'bg-stone-700 dark:bg-stone-300')
              )}
          </div>
        </div>

        {/* 5. Avaliação (1 a 6 Estrelas) */}
        <div className="bg-white dark:bg-stone-900 rounded-xl p-5 border border-stone-200/80 dark:border-stone-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-500 rounded-lg">
                <Star size={18} className="fill-amber-400" />
              </span>
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                Distribuição de Notas (1 a 6★)
              </h3>
            </div>
          </div>

          <div className="space-y-2.5">
            {[6, 5, 4, 3, 2, 1].map((stars) => {
              const count = stats.byRating[stars] || 0;
              return renderDistributionBar(
                `${stars} Estrelas`,
                count,
                stats.totalBooks,
                stars === 6
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                  : stars === 5
                  ? 'bg-amber-500'
                  : stars === 4
                  ? 'bg-amber-600/80'
                  : 'bg-stone-400',
                stars === 6 ? 'Especial / Obra-Prima' : undefined
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
