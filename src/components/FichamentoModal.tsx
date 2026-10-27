import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Book, FichamentoData, FichamentoItem } from '../types';
import { X, Plus, Trash2, FileText, Copy, Check, BookOpen, Pencil, Undo2, type LucideIcon } from 'lucide-react';
import {
  createEmptyItem,
  formatFichamentoText,
  hasContent,
  itemStatus,
  itemsToPublish,
  loadPublishedItems,
  pageLabel,
  summarize,
} from '../utils/fichamento';

interface FichamentoModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookId: number, fichamento: FichamentoData) => Promise<string | null>;
}

function getDefaultReference(b: Book): string {
  const authorUpper = b.author ? b.author.toUpperCase() : 'AUTOR';
  return `${authorUpper}. ${b.title}. ${b.year || ''}. (${b.pages || 0} pág.)`;
}

interface AutoGrowTextareaProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
  focusOnMount?: boolean;
}

/** Grows with its content, so a long quote is always shown in full while it is edited. */
function AutoGrowTextarea({ focusOnMount, className = '', value, ...props }: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fit = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    // Re-measuring collapses the box for a moment; keep the modal from jumping while typing.
    const scroller = element.closest<HTMLElement>('[data-fichamento-scroll]');
    const scrollTop = scroller?.scrollTop ?? 0;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight + element.offsetHeight - element.clientHeight}px`;
    if (scroller) scroller.scrollTop = scrollTop;
  }, []);

  useLayoutEffect(fit, [value, fit]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (focusOnMount) {
      element.focus();
      element.setSelectionRange(element.value.length, element.value.length);
    }
    if (typeof ResizeObserver === 'undefined') return;
    let width = element.clientWidth;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth === width) return;
      width = element.clientWidth;
      fit();
    });
    observer.observe(element);
    return () => observer.disconnect();
    // Focus runs once, when the field appears; later changes to the request must not steal the cursor.
  }, [fit]);

  return <textarea ref={ref} rows={3} value={value} {...props} className={`resize-none overflow-hidden ${className}`} />;
}

function IconAction({ icon: Icon, title, danger = false, onClick }: {
  icon: LucideIcon;
  title: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-md p-1.5 text-stone-600 transition-colors cursor-pointer ${
        danger ? 'hover:text-rose-400 hover:bg-rose-500/10' : 'hover:text-amber-300 hover:bg-stone-800'
      }`}
    >
      <Icon size={14} />
    </button>
  );
}

export const FichamentoModal: React.FC<FichamentoModalProps> = ({
  book,
  isOpen,
  onClose,
  onSave,
}) => {
  const [reference, setReference] = useState('');
  const [publishedReference, setPublishedReference] = useState('');
  const [items, setItems] = useState<FichamentoItem[]>([]);
  // Snapshot of what is saved; anything that differs from it is waiting to be published.
  const [published, setPublished] = useState<Map<string, FichamentoItem>>(() => new Map());
  const [editing, setEditing] = useState<Set<string>>(() => new Set());
  // Saved quotes deleted in this session: hidden right away, dropped for good on publish.
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [focusRequest, setFocusRequest] = useState<{ id: string; field: 'page' | 'text' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [justPublished, setJustPublished] = useState(false);
  const publishedTimer = useRef<number | undefined>(undefined);
  const shortcuts = useRef({ close: () => {}, publish: () => {} });

  useEffect(() => {
    if (!book || !isOpen) return;
    const saved = loadPublishedItems(book.fichamento?.items);
    const savedReference = book.fichamento?.reference || getDefaultReference(book);
    const first = saved.length ? null : createEmptyItem();
    setReference(savedReference);
    setPublishedReference(savedReference);
    setPublished(new Map(saved.map((item) => [item.id, item])));
    setItems(first ? [first] : saved);
    setEditing(new Set());
    setRemoved(new Set());
    setFocusRequest(first ? { id: first.id, field: 'page' } : null);
    setSaveError('');
    setJustPublished(false);
  }, [book, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        shortcuts.current.close();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        shortcuts.current.publish();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  useEffect(() => () => window.clearTimeout(publishedTimer.current), []);

  const referenceChanged = reference.trim() !== publishedReference.trim();
  const pending = useMemo(
    () => summarize(items, published, removed, referenceChanged).pending,
    [items, published, removed, referenceChanged]
  );

  if (!isOpen || !book) return null;

  const visibleItems = items.filter((item) => !removed.has(item.id));
  const visibleCount = visibleItems.filter(hasContent).length;

  const updateItem = (id: string, field: 'page' | 'text', value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const addItem = () => {
    const item = createEmptyItem();
    setItems((prev) => [...prev, item]);
    setFocusRequest({ id: item.id, field: 'page' });
  };

  const startEditing = (id: string) => {
    setEditing((prev) => new Set(prev).add(id));
    setFocusRequest({ id, field: 'text' });
  };

  const finishEditing = (id: string) => {
    setEditing((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const revertItem = (id: string) => {
    const original = published.get(id);
    if (!original) return;
    setItems((prev) => prev.map((item) => (item.id === id ? original : item)));
    finishEditing(id);
  };

  const removeItem = (id: string) => {
    if (published.has(id)) {
      setRemoved((prev) => new Set(prev).add(id));
      finishEditing(id);
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handlePublish = async () => {
    if (isSaving || !pending) return;
    const finalItems = itemsToPublish(items, removed);
    const finalReference = reference.trim();
    setIsSaving(true);
    setSaveError('');
    try {
      const error = await onSave(book.id, { reference: finalReference, items: finalItems });
      if (error) {
        setSaveError(error);
        return;
      }
      setPublished(new Map(finalItems.map((item) => [item.id, item])));
      setPublishedReference(finalReference);
      setReference(finalReference);
      setItems(finalItems);
      setEditing(new Set());
      setRemoved(new Set());
      setFocusRequest(null);
      setJustPublished(true);
      window.clearTimeout(publishedTimer.current);
      publishedTimer.current = window.setTimeout(() => setJustPublished(false), 2500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível publicar o fichamento.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return;
    if (pending && !window.confirm('Há alterações não publicadas. Fechar e descartar?')) return;
    onClose();
  };

  shortcuts.current = { close: handleClose, publish: () => void handlePublish() };

  const handleCopyFormatted = async () => {
    try {
      await navigator.clipboard.writeText(formatFichamentoText(book, reference, visibleItems));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSaveError('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.');
    }
  };

  const renderItem = (item: FichamentoItem, index: number) => {
    const status = itemStatus(item, published, removed);
    const edited = status === 'edited';

    if (status !== 'new' && !editing.has(item.id)) {
      return (
        <li
          key={item.id}
          title={edited ? 'Alterada; publique para salvar' : undefined}
          className={`group rounded-xl border bg-stone-950/40 px-4 pb-4 pt-2.5 transition-colors ${
            edited ? 'border-sky-500/40 light:border-sky-400/60' : 'border-stone-800/80 hover:border-stone-700'
          }`}
        >
          <div className="mb-1.5 flex items-center gap-2">
            <span className="font-mono text-[11px] text-stone-500">#{index + 1}</span>
            {item.page.trim() && (
              <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-amber-300">
                {pageLabel(item.page)}
              </span>
            )}
            <div className="ml-auto flex items-center">
              {edited && <IconAction icon={Undo2} title="Desfazer alteração" onClick={() => revertItem(item.id)} />}
              <IconAction icon={Pencil} title="Editar" onClick={() => startEditing(item.id)} />
              <IconAction icon={Trash2} title="Apagar" danger onClick={() => removeItem(item.id)} />
            </div>
          </div>
          {item.text.trim() && (
            <blockquote
              onDoubleClick={() => startEditing(item.id)}
              className="border-l-2 border-amber-500/40 pl-4 font-serif text-[15px] leading-relaxed text-stone-200 whitespace-pre-wrap break-words"
            >
              {item.text}
            </blockquote>
          )}
        </li>
      );
    }

    const focusField = focusRequest?.id === item.id ? focusRequest.field : null;
    return (
      <li
        key={item.id}
        className={`rounded-xl border p-3 ${
          status === 'new'
            ? 'border-dashed border-amber-500/50 light:border-amber-400/60 bg-amber-500/[0.04]'
            : edited
              ? 'border-sky-500/40 light:border-sky-400/60 bg-sky-500/[0.04]'
              : 'border-stone-700 bg-stone-950/40'
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start">
            <input
              type="text"
              value={item.page}
              autoFocus={focusField === 'page'}
              onChange={(e) => updateItem(item.id, 'page', e.target.value)}
              placeholder="Página"
              aria-label="Página ou local"
              className="w-full rounded-md border border-stone-800 bg-stone-900 px-2.5 py-2 font-mono text-xs text-amber-300 placeholder-stone-600 focus:border-amber-500/60 focus:outline-none sm:w-28"
            />
            <AutoGrowTextarea
              value={item.text}
              focusOnMount={focusField === 'text'}
              onChange={(e) => updateItem(item.id, 'text', e.target.value)}
              placeholder="Citação ou anotação"
              aria-label="Texto da citação ou anotação"
              className="w-full min-w-0 flex-1 rounded-md border border-stone-800 bg-stone-900 px-3 py-2 text-sm leading-relaxed text-stone-200 placeholder-stone-600 focus:border-amber-500/60 focus:outline-none"
            />
          </div>
          <div className="flex shrink-0 flex-col items-center">
            {status !== 'new' && <IconAction icon={Check} title="Concluir" onClick={() => finishEditing(item.id)} />}
            {edited && <IconAction icon={Undo2} title="Desfazer alteração" onClick={() => revertItem(item.id)} />}
            <IconAction
              icon={Trash2}
              title={status === 'new' ? 'Descartar' : 'Apagar'}
              danger
              onClick={() => removeItem(item.id)}
            />
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/75 backdrop-blur-sm animate-fadeIn">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fichamento-title"
        className="relative w-full max-w-3xl max-h-[90vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100"
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="fichamento-title" className="font-bold text-lg text-amber-300">Fichamento de Leitura</h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400">
                  #{book.yearBookId || book.id}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                <span className="font-semibold text-stone-200">{book.title}</span> — {book.author}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div data-fichamento-scroll className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {saveError && (
            <div role="alert" className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {saveError}
            </div>
          )}

          <fieldset disabled={isSaving} className="min-w-0 space-y-6">
            {/* Cabeçalho Simples - Referência Bibliográfica */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="fichamento-reference" className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                  <BookOpen size={13} />
                  Cabeçalho de Referência
                </label>
                <button
                  type="button"
                  onClick={() => setReference(getDefaultReference(book))}
                  className="text-[11px] text-stone-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Restaurar padrão
                </button>
              </div>
              <input
                id="fichamento-reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: SOBRENOME, Nome. Título do Livro. Cidade: Editora, Ano."
                className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 font-mono transition-colors"
              />
            </div>

            {/* Lista de Trechos e Citações (Página / Texto) */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                Anotações e Citações ({visibleCount})
              </h3>

              {visibleItems.length > 0 && <ol className="space-y-3">{visibleItems.map(renderItem)}</ol>}

              <button
                type="button"
                onClick={addItem}
                className="w-full py-2.5 border border-dashed border-stone-700 hover:border-amber-500/60 bg-stone-950/40 hover:bg-amber-500/5 text-amber-400/90 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Adicionar Novo Trecho / Citação</span>
              </button>
            </section>
          </fieldset>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-stone-950/90 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => void handleCopyFormatted()}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copiar texto do fichamento formatado"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => void handlePublish()}
              disabled={isSaving || !pending}
              title="Publicar (Ctrl+Enter)"
              className={`px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-on-accent font-semibold rounded-lg text-xs shadow-md transition-all cursor-pointer disabled:cursor-default flex items-center gap-1.5 ${
                justPublished ? '' : 'disabled:opacity-50'
              }`}
            >
              {justPublished && <Check size={14} />}
              {isSaving ? 'Publicando...' : justPublished ? 'Publicado' : pending ? `Publicar (${pending})` : 'Publicar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
