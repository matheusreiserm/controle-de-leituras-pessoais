import React from 'react';
import { Book } from '../types';
import { StarRating } from './StarRating';
import { CountryFlag } from './CountryFlag';
import { getCoverGradient, getContinentColors } from '../utils/helpers';
import {
  X,
  FileText,
  Calendar,
  BookOpen,
  Edit3,
  Globe,
  Award,
  Sparkles,
  Smartphone,
  HardDrive,
  Headphones,
} from 'lucide-react';

interface CoverHighlightModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenFichamento: (book: Book) => void;
  onEditBook?: (book: Book) => void;
}

export const CoverHighlightModal: React.FC<CoverHighlightModalProps> = ({
  book,
  isOpen,
  onClose,
  onOpenFichamento,
  onEditBook,
}) => {
  if (!isOpen || !book) return null;

  const coverBg = getCoverGradient(book.id, book.title);
  const fichamentoCount = book.fichamento?.items?.filter(i => i.text.trim() || i.page.trim()).length || 0;

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'Kindle':
        return <Smartphone size={13} className="text-cyan-400" />;
      case 'PDF':
        return <FileText size={13} className="text-red-400" />;
      case 'Archive.org':
        return <HardDrive size={13} className="text-amber-400" />;
      case 'Audible':
      case 'Físico/Audible':
        return <Headphones size={13} className="text-purple-400" />;
      default:
        return <BookOpen size={13} className="text-emerald-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-fadeIn">
      {/* Click backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row items-stretch">
        
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-stone-950/70 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X size={18} />
        </button>

        {/* Cover Column (Highlighted in foreground) */}
        <div className="md:w-64 bg-stone-950/90 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-stone-800 shrink-0">
          <div className="relative group w-44 h-64 rounded-lg overflow-hidden shadow-2xl border border-stone-700/60 transition-transform duration-300 hover:scale-105">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-gradient-to-br ${coverBg} p-4 flex flex-col justify-between text-left select-none`}
            >
              <div className="text-xs font-bold uppercase tracking-wider line-clamp-3 leading-snug">
                {book.title}
              </div>
              <div>
                <div className="text-xs opacity-85 line-clamp-1 italic">{book.author}</div>
                <div className="text-[10px] font-mono mt-1 opacity-70">{book.year}</div>
              </div>
            </div>
          </div>

          {/* Diminutive Fichamento Button under Cover */}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFichamento(book);
              }}
              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow transition-all cursor-pointer group"
              title="Abrir fichamento de leitura"
            >
              <FileText size={14} className="text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Fichamento</span>
              {fichamentoCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[10px] bg-amber-400 text-stone-950 rounded-full font-mono font-bold">
                  {fichamentoCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Book Information Body */}
        <div className="flex-1 p-6 flex flex-col justify-between space-y-4 text-stone-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400/90 mb-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-bold">
                Leitura #{book.yearBookId || book.id}
              </span>
              <span>•</span>
              <span className="text-stone-400">{book.month} de {book.readingYear}</span>
            </div>

            <h2 className="text-xl font-bold text-stone-100 leading-tight">
              {book.title}
            </h2>
            <p className="text-sm font-medium text-stone-400 mt-1">
              {book.author}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <StarRating rating={book.rating} size="md" />
              <span className="text-xs text-stone-400 font-mono">({book.rating}/6 ★)</span>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/80 space-y-0.5">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-mono">Nacionalidade</span>
              <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                <CountryFlag country={book.nationality} size="xs" />
                {book.nationality}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/80 space-y-0.5">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-mono">Continente</span>
              <span className="font-semibold flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${getContinentColors(book.continent).badge}`}>
                  <Globe size={11} />
                  {book.continent}
                </span>
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/80 space-y-0.5">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-mono">Ano & Páginas</span>
              <span className="font-semibold text-stone-200 flex items-center gap-2">
                <span>{book.year}</span>
                <span>•</span>
                <span>{book.pages} pág.</span>
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800/80 space-y-0.5">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider block font-mono">Formato & Idioma</span>
              <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                {getFormatIcon(book.format)}
                <span>{book.format}</span>
                <span className="text-[10px] text-amber-400 bg-amber-950/40 px-1 rounded border border-amber-800/40">
                  {book.language}
                </span>
              </span>
            </div>
          </div>

          {/* Notes or Genre if present */}
          {book.notes && (
            <div className="p-3 rounded-lg bg-stone-950/40 border border-stone-800/60 text-xs italic text-stone-300">
              "{book.notes}"
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenFichamento(book);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <FileText size={13} />
              <span>{fichamentoCount > 0 ? `Ver Fichamento (${fichamentoCount})` : 'Criar Fichamento'}</span>
            </button>

            {onEditBook && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditBook(book);
                }}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Editar Detalhes</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
