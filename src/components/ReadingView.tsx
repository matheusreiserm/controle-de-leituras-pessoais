import React, { useState } from 'react';
import { Book, FormatType, LanguageType, MonthName } from '../types';
import { MONTHS_LIST, getCountryContinent, getCoverGradient, getContinentColors } from '../utils/helpers';
import { StarRating } from './StarRating';
import { CountryFlag } from './CountryFlag';
import {
  Plus,
  BookOpen,
  Calendar,
  Edit3,
  Trash2,
  Globe,
  FileText,
  Smartphone,
  HardDrive,
  Headphones,
  Maximize2,
  CheckCircle2,
  X,
  Sparkles,
  Upload,
  Link as LinkIcon,
} from 'lucide-react';

interface ReadingViewProps {
  books: Book[];
  onAddReading: (bookData: Omit<Book, 'id' | 'monthId'>) => void;
  onEditReading: (book: Book) => void;
  onDeleteReading: (id: number) => void;
  onCompleteReading: (bookId: number, rating: number, month: MonthName, year: number) => void;
  onOpenCover: (book: Book) => void;
  onOpenFichamento: (book: Book) => void;
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  books,
  onAddReading,
  onEditReading,
  onDeleteReading,
  onCompleteReading,
  onOpenCover,
  onOpenFichamento,
}) => {
  const readingBooks = books.filter((b) => b.status === 'reading');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [completingBook, setCompletingBook] = useState<Book | null>(null);

  // Completion modal state
  const getCurrentMonthName = (): MonthName => {
    const monthIdx = new Date().getMonth();
    return MONTHS_LIST[monthIdx] || 'Agosto';
  };
  const getCurrentYear = () => new Date().getFullYear();

  const [completionRating, setCompletionRating] = useState<number>(5);
  const [completionMonth, setCompletionMonth] = useState<MonthName>(getCurrentMonthName());
  const [completionYear, setCompletionYear] = useState<number>(getCurrentYear());

  // Add Reading Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pubYear, setPubYear] = useState<number>(getCurrentYear());
  const [pages, setPages] = useState<number>(200);
  const [nationality, setNationality] = useState('Brasil');
  const [format, setFormat] = useState<FormatType>('Físico');
  const [language, setLanguage] = useState<LanguageType>('Português');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverMode, setCoverMode] = useState<'upload' | 'url'>('url');

  const handleOpenAdd = () => {
    setTitle('');
    setAuthor('');
    setPubYear(getCurrentYear());
    setPages(200);
    setNationality('Brasil');
    setFormat('Físico');
    setLanguage('Português');
    setCoverUrl('');
    setCoverMode('url');
    setIsAddModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const continent = getCountryContinent(nationality);
    onAddReading({
      title: title.trim(),
      author: author.trim(),
      year: Number(pubYear) || getCurrentYear(),
      pages: Number(pages) || 1,
      nationality: nationality.trim(),
      continent,
      format,
      language,
      rating: 0,
      readingYear: getCurrentYear(),
      month: getCurrentMonthName(),
      status: 'reading',
      coverUrl: coverUrl.trim() || undefined,
    });

    setIsAddModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem é muito grande. Por favor escolha um arquivo menor que 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCoverUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartComplete = (book: Book) => {
    setCompletingBook(book);
    setCompletionRating(5);
    setCompletionMonth(getCurrentMonthName());
    setCompletionYear(getCurrentYear());
  };

  const handleConfirmComplete = () => {
    if (!completingBook) return;
    onCompleteReading(completingBook.id, completionRating, completionMonth, completionYear);
    setCompletingBook(null);
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
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

  return (
    <div className="space-y-6 pb-12">
      {/* Discreet Header Toolbar */}
      <div className="flex items-center justify-between bg-stone-900/90 border border-stone-800 px-5 py-3.5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-stone-100">Lendo</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {readingBooks.length} {readingBooks.length === 1 ? 'leitura' : 'leituras'} em andamento
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Acompanhe suas leituras atuais e registre fichamentos em tempo real
            </p>
          </div>
        </div>

        {/* Discreet '+' Button */}
        <button
          onClick={handleOpenAdd}
          className="p-2.5 bg-stone-800 hover:bg-amber-500 hover:text-stone-950 text-amber-400 border border-stone-700 hover:border-amber-400 rounded-xl transition-all shadow-sm cursor-pointer flex items-center gap-1.5 text-xs font-semibold group"
          title="Adicionar leitura em andamento"
        >
          <Plus size={16} className="transition-transform group-hover:scale-110" />
          <span className="hidden sm:inline">Nova Leitura</span>
        </button>
      </div>

      {/* Book Grid */}
      {readingBooks.length === 0 ? (
        <div className="text-center py-16 px-4 bg-stone-900/40 border border-dashed border-stone-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-800/80 text-stone-500 flex items-center justify-center mx-auto border border-stone-700/50">
            <BookOpen size={24} />
          </div>
          <h3 className="text-sm font-medium text-stone-300">Nenhuma leitura em andamento</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Clique no botão <strong>+</strong> no topo para adicionar o livro que você está lendo agora e começar a registrar seus fichamentos.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm mt-2"
          >
            <Plus size={14} /> Adicionar Leitura
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {readingBooks.map((book) => {
            const coverBg = getCoverGradient(book.id, book.title);
            const fichamentoCount =
              book.fichamento?.items?.filter((i) => i.text.trim() || i.page.trim()).length || 0;

            return (
              <div
                key={book.id}
                className="group relative bg-white dark:bg-stone-900 rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Top Header Tag */}
                <div className="flex items-center justify-between px-3 py-2 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800/80 text-xs text-stone-600 dark:text-stone-400 font-mono">
                  <span className="font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Lendo
                  </span>
                  <div className="flex items-center gap-1.5 font-sans font-medium text-stone-500">
                    <span>{book.format}</span>
                    <span className="text-stone-300 dark:text-stone-700">•</span>
                    <span className="text-stone-400">{book.pages} pág</span>
                  </div>
                </div>

                {/* Main Body */}
                <div className="p-3.5 flex gap-3 items-start flex-1">
                  {/* Cover Thumbnail - Clickable */}
                  <div
                    onClick={() => onOpenCover(book)}
                    className="shrink-0 w-20 h-28 rounded-md shadow-inner overflow-hidden border border-stone-300/40 dark:border-stone-700 relative group-hover:scale-102 transition-transform cursor-pointer group/cover"
                    title="Clique para ver a capa destacada ou abrir o fichamento"
                  >
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

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-stone-950/50 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center text-amber-300">
                      <Maximize2 size={16} className="drop-shadow-md" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between min-h-[7rem] space-y-1.5">
                    <div>
                      <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm leading-snug line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5 line-clamp-1">
                        {book.author}
                      </p>
                    </div>

                    <div className="space-y-1.5 my-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-600 dark:text-stone-400">
                        <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200/50 dark:border-stone-700/50">
                          <CountryFlag country={book.nationality} size="xs" />
                          <span className="font-medium">{book.nationality}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 border border-stone-200/50 dark:border-stone-700/50">
                          <Calendar size={11} className="text-stone-400" />
                          <span>{book.year}</span>
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
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                      getContinentColors(book.continent).badgeLight
                    }`}
                  >
                    <Globe size={10} /> {book.continent}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Fichamento button */}
                    <button
                      onClick={() => onOpenFichamento(book)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-amber-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer relative"
                      title="Fichamento de leitura (anotações e citações)"
                    >
                      <FileText size={14} />
                      {fichamentoCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 text-[8px] text-stone-950 font-bold flex items-center justify-center">
                          {fichamentoCount}
                        </span>
                      )}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => onEditReading(book)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-amber-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      title="Editar informações"
                    >
                      <Edit3 size={14} />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteReading(book.id)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-rose-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Discreet 'Concluir Leitura' Button */}
                    <button
                      onClick={() => handleStartComplete(book)}
                      className="ml-1 px-2.5 py-1 bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-stone-950 border border-emerald-500/30 hover:border-emerald-400 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Concluir leitura e enviar para o Diário Mensal"
                    >
                      <CheckCircle2 size={13} />
                      <span>Concluir</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Reading Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                  <BookOpen size={18} />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-base text-amber-100">
                    Adicionar Leitura em Andamento
                  </h3>
                  <p className="text-xs text-stone-400">
                    Registre o livro para acompanhar o progresso e fichamento
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-300">Título do Livro *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Dom Quixote"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Autor *</label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Ex: Miguel de Cervantes"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Nacionalidade do Autor</label>
                  <input
                    type="text"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Ex: Espanha, Brasil, Rússia..."
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Ano Publicação</label>
                  <input
                    type="number"
                    value={pubYear}
                    onChange={(e) => setPubYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Total Páginas</label>
                  <input
                    type="number"
                    value={pages}
                    min={1}
                    onChange={(e) => setPages(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Formato</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as FormatType)}
                    className="w-full px-2 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Físico">Físico</option>
                    <option value="Kindle">Kindle</option>
                    <option value="PDF">PDF</option>
                    <option value="Audible">Audible</option>
                    <option value="Archive.org">Archive.org</option>
                    <option value="Físico/Audible">Físico/Audible</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Idioma</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as LanguageType)}
                    className="w-full px-2 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Português">Português</option>
                    <option value="Inglês">Inglês</option>
                    <option value="Espanhol">Espanhol</option>
                    <option value="Outros">Outros</option>
                    <option value="Não informado">Não informado</option>
                  </select>
                </div>
              </div>

              {/* Cover input */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300">Capa do Livro (Opcional)</label>
                  <div className="flex items-center gap-1 bg-stone-950 p-0.5 rounded-lg border border-stone-800">
                    <button
                      type="button"
                      onClick={() => setCoverMode('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        coverMode === 'url' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      <LinkIcon size={10} className="inline mr-1" />
                      URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setCoverMode('upload')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                        coverMode === 'upload' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      <Upload size={10} className="inline mr-1" />
                      Upload
                    </button>
                  </div>
                </div>

                {coverMode === 'url' ? (
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://exemplo.com/capa.jpg"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500"
                  />
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-stone-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Iniciar Leitura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Modal with Star Rating */}
      {completingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-stone-800/80 bg-stone-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-100">
                    Concluir Leitura
                  </h3>
                  <p className="text-xs text-stone-400 truncate max-w-[260px]">
                    {completingBook.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompletingBook(null)}
                className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form body */}
            <div className="p-6 space-y-5">
              {/* Star Rating selector */}
              <div className="bg-stone-950/80 p-4 rounded-xl border border-stone-800/80 text-center space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-300">
                  Avaliação da Leitura
                </label>
                <div className="flex justify-center py-1">
                  <StarRating
                    rating={completionRating}
                    onChange={(r) => setCompletionRating(r)}
                    readOnly={false}
                    size="lg"
                    maxStars={6}
                  />
                </div>
                <p className="text-[11px] text-stone-400 font-mono">
                  {completionRating === 6
                    ? '★ Obra-prima / Destaque absoluto'
                    : completionRating >= 5
                    ? '★★★★★ Excelente'
                    : completionRating >= 4
                    ? '★★★★ Muito Bom'
                    : completionRating >= 3
                    ? '★★★ Bom'
                    : '★ Regular'}
                </p>
              </div>

              {/* Month and Year of conclusion */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Mês de Conclusão</label>
                  <select
                    value={completionMonth}
                    onChange={(e) => setCompletionMonth(e.target.value as MonthName)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    {MONTHS_LIST.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-stone-300">Ano de Conclusão</label>
                  <input
                    type="number"
                    value={completionYear}
                    onChange={(e) => setCompletionYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2">
                <Sparkles size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Ao confirmar, esta leitura será salva permanentemente no seu <strong>Diário Mensal</strong> com todos os fichamentos associados e removida da aba Lendo.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-800/80 bg-stone-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingBook(null)}
                className="px-4 py-2 text-stone-400 hover:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                <span>Concluir e Salvar no Diário</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
