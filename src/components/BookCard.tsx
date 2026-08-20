import React from 'react';
import { Book } from '../types';
import { StarRating } from './StarRating';
import { CountryFlag } from './CountryFlag';
import { getCoverGradient, getContinentColors } from '../utils/helpers';
import { BookOpen, Calendar, Edit3, Trash2, Globe, FileText, Smartphone, HardDrive, Headphones, Maximize2 } from 'lucide-react';

interface BookCardProps {
  book: Book;
  displayNumber?: number;
  showYearBadge?: boolean;
  onEdit?: (book: Book) => void;
  onDelete?: (id: number) => void;
  onOpenCover?: (book: Book) => void;
  onOpenFichamento?: (book: Book) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  displayNumber,
  showYearBadge = false,
  onEdit,
  onDelete,
  onOpenCover,
  onOpenFichamento,
}) => {
  const coverBg = getCoverGradient(book.id, book.title);
  const numberToShow = displayNumber !== undefined ? displayNumber : (book.yearBookId || book.id);
  const fichamentoCount = book.fichamento?.items?.filter(i => i.text.trim() || i.page.trim()).length || 0;

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'Kindle':
        return <Smartphone size={13} className="text-cyan-600 dark:text-cyan-400" />;
      case 'PDF':
        return <FileText size={13} className="text-red-600 dark:text-red-400" />;
      case 'Archive.org':
        return <HardDrive size={13} className="text-amber-600 dark:text-amber-400" />;
      case 'Audible':
      case 'Físico/Audible':
        return <Headphones size={13} className="text-purple-600 dark:text-purple-400" />;
      default:
        return <BookOpen size={13} className="text-emerald-600 dark:text-emerald-400" />;
    }
  };

  const handleCoverClick = () => {
    if (onOpenCover) {
      onOpenCover(book);
    } else if (onOpenFichamento) {
      onOpenFichamento(book);
    }
  };

  return (
    <div className="group relative bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Top Header Tag */}
      <div className="flex items-center justify-between px-3 py-2 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800/80 text-xs text-stone-600 dark:text-stone-400 font-mono">
        <span className="font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/50">
          #{String(numberToShow).padStart(2, '0')}
        </span>
        <div className="flex items-center gap-1.5 font-sans font-medium text-stone-500">
          {showYearBadge && (
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300 bg-stone-200 dark:bg-stone-800 px-1.5 py-0.2 rounded text-[10px]">
              {book.readingYear}
            </span>
          )}
          <span>{book.month}</span>
          <span className="text-stone-300 dark:text-stone-700">•</span>
          <span className="text-stone-400">mês #{book.monthId}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-3.5 flex gap-3 items-start flex-1">
        {/* Cover Thumbnail - Clickable */}
        <div
          onClick={handleCoverClick}
          className="shrink-0 w-20 h-28 rounded-md shadow-inner overflow-hidden border border-stone-300/40 dark:border-stone-700 relative group-hover:scale-102 transition-transform cursor-pointer group/cover"
          title="Clique para ver a capa destacada em primeiro plano e acessar o fichamento"
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback on image error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}
          <div
            className={`w-full h-full bg-gradient-to-br ${coverBg} p-2 flex flex-col justify-between select-none text-left`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider line-clamp-2 leading-tight opacity-90">
              {book.title}
            </div>
            <div>
              <div className="text-[9px] opacity-80 line-clamp-1 italic">{book.author}</div>
              <div className="text-[8px] font-mono mt-1 opacity-70">{book.year}</div>
            </div>
          </div>

          {/* Hover Overlay Hint */}
          <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center text-amber-300">
            <Maximize2 size={16} className="drop-shadow-md" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[7rem] space-y-1.5">
          <div>
            <div className="flex items-start justify-between gap-1">
              <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug line-clamp-2 hover:line-clamp-none transition-all">
                {book.title}
              </h3>
            </div>
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-1">
              {book.author}
            </p>
          </div>

          <div className="space-y-1.5 my-1">
            <div className="flex items-center gap-2 text-xs">
              <StarRating rating={book.rating} size="sm" />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200/50 dark:border-stone-700/50">
                <CountryFlag country={book.nationality} size="xs" />
                <span className="font-medium">{book.nationality}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200/50 dark:border-stone-700/50">
                <Calendar size={11} className="text-stone-400" />
                <span>{book.year}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200/50 dark:border-stone-700/50">
                <BookOpen size={11} className="text-stone-400" />
                <span>{book.pages} pág</span>
              </span>
            </div>
          </div>

          {/* Footer format & language */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100 dark:border-stone-800/80">
            <span className="inline-flex items-center gap-1 font-medium text-stone-600 dark:text-stone-400">
              {getFormatIcon(book.format)}
              <span>{book.format}</span>
            </span>

            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/40 dark:border-amber-800/40">
              {book.language}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons bar */}
      <div className="px-3 py-2 bg-stone-50/80 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 mt-auto">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${getContinentColors(book.continent).badgeLight}`}>
          <Globe size={10} /> {book.continent}
        </span>
        <div className="flex items-center gap-1.5">
          {onOpenFichamento && (
            <button
              onClick={() => onOpenFichamento(book)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-amber-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer relative"
              title="Fichamento de leitura"
            >
              <FileText size={13} />
              {fichamentoCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(book)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-amber-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Editar leitura"
            >
              <Edit3 size={13} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(book.id)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-rose-500 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Excluir leitura"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
