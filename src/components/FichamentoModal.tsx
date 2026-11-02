import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Book, FichamentoData, FichamentoItem, FichamentoSection } from '../types';
import { X, Plus, Trash2, FileText, Copy, Check, BookOpen, Pencil, Undo2, Download, ListTree, ChevronDown, type LucideIcon } from 'lucide-react';
import {
  cleanSections,
  createEmptyItem,
  groupBySection,
  sectionOf,
  sortSections,
  fichamentoFileName,
  formatFichamentoHtml,
  formatFichamentoMarkdown,
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
  // Table of contents of collections (stories, essays); quotes are grouped by text through their page.
  const [sections, setSections] = useState<FichamentoSection[]>([]);
  const [publishedSections, setPublishedSections] = useState('[]');
  const [summaryOpen, setSummaryOpen] = useState(false);
  // Snapshot of what is saved; anything that differs from it is waiting to be published.
  const [published, setPublished] = useState<Map<string, FichamentoItem>>(() => new Map());
  const [editing, setEditing] = useState<Set<string>>(() => new Set());
  // Saved quotes deleted in this session: hidden right away, dropped for good on publish.
  const [removed, setRemoved] = useState<Set<string>>(() => new Set());
  const [focusRequest, setFocusRequest] = useState<{ id: string; field: 'page' | 'text' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
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
    const savedSections = cleanSections(book.fichamento?.sections || []);
    setSections(savedSections);
    setPublishedSections(JSON.stringify(savedSections));
    setSummaryOpen(false);
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
  const sectionsChanged = JSON.stringify(cleanSections(sections)) !== publishedSections;
  const pending = useMemo(
    () => summarize(items, published, removed, referenceChanged).pending + (sectionsChanged ? 1 : 0),
    [items, published, removed, referenceChanged, sectionsChanged]
  );

  if (!isOpen || !book) return null;

  const visibleItems = items.filter((item) => !removed.has(item.id));
  const visibleCount = visibleItems.filter(hasContent).length;
  const sortedSections = sortSections(sections);
  const groups = groupBySection(visibleItems, sortedSections);
  // Numbers follow the order on screen, group after group.
  const numbers = new Map(groups.flatMap((group) => group.items).map((item, index) => [item.id, index] as const));
  const autoSectionLabel = (page: string) => {
    const found = sectionOf({ page }, sortedSections);
    return found ? `Pela página: ${found.title || 'sem título'}` : 'Pela página';
  };

  const updateItem = (id: string, field: 'page' | 'text', value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const setItemSection = (id: string, sectionId: string) => {
    setItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const { sectionId: _previous, ...rest } = item;
      return sectionId ? { ...rest, sectionId } : rest;
    }));
  };

  const updateSection = (id: string, patch: Partial<FichamentoSection>) => {
    setSections((prev) => prev.map((section) => (section.id === id ? { ...section, ...patch } : section)));
  };

  const addSection = () => {
    const sorted = sortSections(sections);
    const last = sorted[sorted.length - 1];
    setSections((prev) => [...prev, { id: createEmptyItem().id, title: '', startPage: last ? last.startPage + 1 : 1 }]);
    setSummaryOpen(true);
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
    const finalSections = cleanSections(sections);
    setIsSaving(true);
    setSaveError('');
    try {
      const error = await onSave(book.id, {
        reference: finalReference,
        items: finalItems,
        ...(finalSections.length ? { sections: finalSections } : {}),
      });
      if (error) {
        setSaveError(error);
        return;
      }
      setPublished(new Map(finalItems.map((item) => [item.id, item])));
      setPublishedReference(finalReference);
      setSections(finalSections);
      setPublishedSections(JSON.stringify(finalSections));
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
    setExportOpen(false);
    try {
      await navigator.clipboard.writeText(formatFichamentoText(book, reference, visibleItems, sections));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setSaveError('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.');
    }
  };

  const downloadFile = (content: string, extension: 'md' | 'txt', type: string) => {
    setExportOpen(false);
    const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fichamentoFileName(book.title)}.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // A print-ready page; the browser's print dialog offers "Salvar como PDF".
  const printAsPdf = () => {
    setExportOpen(false);
    const page = window.open('', '_blank');
    if (!page) {
      setSaveError('O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente de novo.');
      return;
    }
    page.document.write(formatFichamentoHtml(book, reference, visibleItems, sections));
    page.document.close();
    page.focus();
    page.print();
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
            {sortedSections.length > 0 && (
              <select
                value={item.sectionId && sortedSections.some((section) => section.id === item.sectionId) ? item.sectionId : ''}
                onChange={(e) => setItemSection(item.id, e.target.value)}
                aria-label="Texto do sumário"
                className="w-full rounded-md border border-stone-800 bg-stone-900 px-2 py-2 text-xs text-stone-300 focus:border-amber-500/60 focus:outline-none sm:w-44"
              >
                <option value="">{autoSectionLabel(item.page)}</option>
                {sortedSections.map((section) => (
                  <option key={section.id} value={section.id}>{section.title || 'Sem título'}</option>
                ))}
              </select>
            )}
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

            {/* Sumário: texts of a collection, each starting at a page */}
            <div className="space-y-2">
              {sections.length === 0 ? (
                <button
                  type="button"
                  onClick={addSection}
                  className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-amber-300 cursor-pointer"
                >
                  <ListTree size={13} />
                  Adicionar sumário (livro de contos, ensaios ou coletânea)
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSummaryOpen((open) => !open)}
                    aria-expanded={summaryOpen}
                    className="flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400/90 cursor-pointer"
                  >
                    <ListTree size={13} />
                    Sumário ({sections.length} {sections.length === 1 ? 'texto' : 'textos'})
                    <ChevronDown size={14} className={`ml-auto transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {summaryOpen && (
                    <div className="space-y-2 rounded-xl border border-stone-800 bg-stone-950/40 p-3">
                      {sections.map((section) => (
                        <div key={section.id} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                          <input
                            type="number"
                            min={0}
                            value={section.startPage || ''}
                            onChange={(e) => updateSection(section.id, { startPage: Number(e.target.value) || 0 })}
                            placeholder="Pág."
                            aria-label="Página em que o texto começa"
                            className="w-20 rounded-md border border-stone-800 bg-stone-900 px-2 py-1.5 font-mono text-xs text-amber-300 placeholder-stone-600 focus:border-amber-500/60 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={section.title}
                            onChange={(e) => updateSection(section.id, { title: e.target.value })}
                            placeholder="Título do texto"
                            aria-label="Título do texto"
                            className="min-w-0 flex-1 rounded-md border border-stone-800 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:border-amber-500/60 focus:outline-none"
                          />
                          <input
                            type="text"
                            value={section.author || ''}
                            onChange={(e) => updateSection(section.id, { author: e.target.value })}
                            placeholder="Autor (se outro)"
                            aria-label="Autor do texto, se for outro"
                            className="w-full rounded-md border border-stone-800 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-200 placeholder-stone-600 focus:border-amber-500/60 focus:outline-none sm:w-44"
                          />
                          <IconAction icon={Trash2} title="Tirar do sumário" danger onClick={() => setSections((prev) => prev.filter((other) => other.id !== section.id))} />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addSection}
                        className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-400/90 hover:text-amber-300 cursor-pointer"
                      >
                        <Plus size={12} />
                        Adicionar texto
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Lista de Trechos e Citações (Página / Texto) */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                Anotações e Citações ({visibleCount})
              </h3>

              {groups.map((group, groupIndex) => (
                <div key={group.section?.id ?? `loose-${groupIndex}`} className="space-y-3">
                  {group.section && (
                    <div className="flex items-baseline gap-2 border-b border-amber-500/20 pb-1 pt-2">
                      <h4 className="font-serif text-base font-bold text-stone-100">{group.section.title}</h4>
                      {group.section.author && <span className="text-xs italic text-stone-400">{group.section.author}</span>}
                      <span className="ml-auto font-mono text-[11px] text-stone-500">p. {group.section.startPage}</span>
                    </div>
                  )}
                  <ol className="space-y-3">{group.items.map((item) => renderItem(item, numbers.get(item.id) ?? 0))}</ol>
                </div>
              ))}

            </section>
          </fieldset>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-stone-950/90 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Always in view: no scrolling to the end of a long fichamento to add a quote. */}
            <button
              type="button"
              onClick={addItem}
              disabled={isSaving}
              className="px-3 py-1.5 border border-dashed border-amber-500/60 hover:bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Plus size={14} />
              <span>Nova citação</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((open) => !open)}
                aria-expanded={exportOpen}
                className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Download size={14} />}
                <span>{copied ? 'Copiado!' : 'Exportar'}</span>
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div role="menu" className="absolute bottom-full left-0 z-20 mb-2 w-52 overflow-hidden rounded-xl border border-stone-700 bg-stone-900 py-1 shadow-2xl">
                    {[
                      { label: 'Copiar texto', icon: Copy, action: () => void handleCopyFormatted() },
                      { label: 'PDF (imprimir)', icon: FileText, action: printAsPdf },
                      { label: 'Markdown (.md)', icon: Download, action: () => downloadFile(formatFichamentoMarkdown(book, reference, visibleItems, sections), 'md', 'text/markdown') },
                      { label: 'Texto (.txt)', icon: Download, action: () => downloadFile(formatFichamentoText(book, reference, visibleItems, sections), 'txt', 'text/plain') },
                    ].map(({ label, icon: Icon, action }) => (
                      <button
                        key={label}
                        type="button"
                        role="menuitem"
                        onClick={action}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-stone-300 hover:bg-stone-800 hover:text-amber-300 cursor-pointer"
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

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
