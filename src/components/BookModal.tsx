import { CoverInput } from './CoverInput';
import React, { useState, useEffect } from 'react';
import { Book, FormatType, LanguageType, MonthName } from '../types';
import { MONTHS_LIST, getCountryContinent, COUNTRY_NAMES_LIST } from '../utils/helpers';
import { StarRating } from './StarRating';
import { CountryFlag } from './CountryFlag';
import { X, Save, BookOpen } from 'lucide-react';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookData: Omit<Book, 'id' | 'monthId'> & { id?: number }) => Promise<string | null>;
  initialData?: Book | null;
  totalBooksCount: number;
}

export const BookModal: React.FC<BookModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  totalBooksCount,
}) => {
  const getCurrentYear = () => new Date().getFullYear();
  const getCurrentMonthName = (): MonthName => {
    const monthIdx = new Date().getMonth();
    return MONTHS_LIST[monthIdx] || 'Agosto';
  };

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [readingYear, setReadingYear] = useState<number>(getCurrentYear());
  const [year, setYear] = useState<number>(getCurrentYear());
  const [pages, setPages] = useState<number>(200);
  const [month, setMonth] = useState<MonthName>(getCurrentMonthName());
  const [nationality, setNationality] = useState('Brasil');
  const [format, setFormat] = useState<FormatType>('Físico');
  const [language, setLanguage] = useState<LanguageType>('Português');
  const [rating, setRating] = useState<number>(5);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPending, setCoverPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (initialData) {
      setReadingYear(initialData.readingYear || getCurrentYear());
      setTitle(initialData.title);
      setAuthor(initialData.author);
      setYear(initialData.year);
      setPages(initialData.pages);
      setMonth(initialData.month || getCurrentMonthName());
      setNationality(initialData.nationality);
      setFormat(initialData.format);
      setLanguage(initialData.language === ('Francês' as any) ? 'Inglês' : initialData.language);
      setRating(initialData.rating);
      setCoverUrl(initialData.coverUrl || '');

    } else {
      // Reset defaults for new book (Current Year: 2026, Current Month: Agosto, Cover: URL da Web)
      setReadingYear(getCurrentYear());
      setTitle('');
      setAuthor('');
      setYear(getCurrentYear() - 2);
      setPages(200);
      setMonth(getCurrentMonthName());
      setNationality('Brasil');
      setFormat('Físico');
      setLanguage('Português');
      setRating(5);
      setCoverUrl('');

    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || isSaving || coverPending) return;

    const continent = getCountryContinent(nationality);
    setIsSaving(true);
    setSaveError('');
    try {
      const error = await onSave({
        id: initialData?.id,
        status: initialData?.status,
        readingYear: Number(readingYear) || 2025,
        title: title.trim(),
        author: author.trim(),
        year: Number(year) || 2024,
        pages: Number(pages) || 1,
        month,
        nationality: nationality.trim(),
        continent,
        format,
        language,
        rating,
        coverUrl: coverUrl.trim(),
      });
      if (error) {
        setSaveError(error);
        return;
      }
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar o livro.');
    } finally {
      setIsSaving(false);
    }
  };

  const detectedContinent = getCountryContinent(nationality);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-stone-100 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <BookOpen size={18} />
            </span>
            <div>
              <h3 className="font-serif font-bold text-lg text-amber-100">
                {initialData ? `Editar Leitura #${initialData.id}` : 'Adicionar Nova Leitura'}
              </h3>
              <p className="text-xs text-stone-400">
                {initialData ? 'Atualize as informações do livro' : `Será registrado como a leitura #${totalBooksCount + 1}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {saveError && (
            <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {saveError}
            </div>
          )}
          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Título do Livro *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Noites Brancas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Autor *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Fiódor Dostoiévski"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Reading Year, Month, Publication Year, Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                Ano da Leitura *
              </label>
              <select
                value={readingYear}
                onChange={(e) => setReadingYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value={2026}>2026 (Atual)</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
                <option value={2022}>2022</option>
                <option value={2021}>2021</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Mês de Leitura
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value as MonthName)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              >
                {MONTHS_LIST.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Ano Publicação
              </label>
              <input
                type="number"
                min="1800"
                max="2030"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Páginas
              </label>
              <input
                type="number"
                min="1"
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Nationality, Format, Language */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nacionalidade do Autor
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="countries-datalist"
                  placeholder="Ex: Suíça, Rússia, Brasil"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                />
                <span className="absolute left-2.5 top-2.5 flex items-center pointer-events-none">
                  <CountryFlag country={nationality} size="xs" />
                </span>
                <datalist id="countries-datalist">
                  {COUNTRY_NAMES_LIST.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                <CountryFlag country={nationality} size="xs" /> {nationality || 'País'} &bull; {detectedContinent}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Formato
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as FormatType)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Físico">Físico</option>
                <option value="Kindle">Kindle</option>
                <option value="PDF">PDF</option>
                <option value="Archive.org">Archive.org</option>
                <option value="Audible">Audible</option>
                <option value="Físico/Audible">Físico/Audible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Idioma da Leitura
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageType)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-xs sm:text-sm text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Português">Português</option>
                <option value="Inglês">Inglês</option>
                <option value="Espanhol">Espanhol</option>
                <option value="Outros">Outros</option>
                <option value="Não informado">Não informado</option>
              </select>
            </div>
          </div>

          {/* Rating (1 to 6 Stars) */}
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-2">
              Avaliação Pessoal (1 a 6 Estrelas)
            </label>
            <div className="flex items-center gap-3">
              <StarRating rating={rating} onChange={(r) => setRating(r)} readOnly={false} size="lg" />
              <span className="text-xs text-stone-500 font-medium">
                {rating === 6
                  ? '6★ Obra-prima'
                  : rating === 5
                  ? '5★ Excelente'
                  : rating === 4
                  ? '4★ Muito Bom'
                  : rating === 3
                  ? '3★ Bom'
                  : rating === 2
                  ? '2★ Regular'
                  : '1★ Ruim'}
              </span>
            </div>
          </div>

          <CoverInput value={coverUrl} onChange={setCoverUrl} onPendingChange={setCoverPending} />

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
                disabled={isSaving || coverPending}
              className="flex items-center gap-2 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
            >
              <Save size={15} />
              <span>{initialData ? 'Salvar Alterações' : 'Adicionar ao Diário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
