import React, { useState, useEffect } from 'react';
import { Book, FichamentoData, FichamentoItem } from '../types';
import { X, Plus, Trash2, FileText, Copy, Check, BookOpen } from 'lucide-react';

interface FichamentoModalProps {
  book: Book | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookId: number, fichamento: FichamentoData) => void;
}

export const FichamentoModal: React.FC<FichamentoModalProps> = ({
  book,
  isOpen,
  onClose,
  onSave,
}) => {
  const [reference, setReference] = useState('');
  const [items, setItems] = useState<FichamentoItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (book) {
      if (book.fichamento) {
        setReference(book.fichamento.reference || getDefaultReference(book));
        setItems(book.fichamento.items?.length ? book.fichamento.items : [createEmptyItem()]);
      } else {
        setReference(getDefaultReference(book));
        setItems([createEmptyItem()]);
      }
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  function getDefaultReference(b: Book): string {
    const authorUpper = b.author ? b.author.toUpperCase() : 'AUTOR';
    return `${authorUpper}. ${b.title}. ${b.year || ''}. (${b.pages || 0} pág.)`;
  }

  function createEmptyItem(): FichamentoItem {
    return {
      id: String(Date.now() + Math.random()),
      page: '',
      text: '',
    };
  }

  const handleAddItem = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id: string, field: 'page' | 'text', value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = () => {
    const validItems = items.filter((item) => item.page.trim() || item.text.trim());
    onSave(book.id, {
      reference: reference.trim(),
      items: validItems,
    });
    onClose();
  };

  const handleCopyFormatted = () => {
    let output = `FICHAMENTO: ${book.title.toUpperCase()}\n`;
    output += `Autor: ${book.author}\n`;
    if (reference) {
      output += `Referência: ${reference}\n`;
    }
    output += `----------------------------------------\n\n`;

    items.forEach((item, idx) => {
      if (item.text.trim()) {
        const pageLabel = item.page.trim() ? `[${item.page.trim()}]` : `[#${idx + 1}]`;
        output += `${pageLabel}\n${item.text.trim()}\n\n`;
      }
    });

    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950/80 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-amber-300">Fichamento de Leitura</h2>
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
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Cabeçalho Simples - Referência Bibliográfica */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
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
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: SOBRENOME, Nome. Título do Livro. Cidade: Editora, Ano."
              className="w-full px-3.5 py-2 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 font-mono transition-colors"
            />
          </div>

          {/* Lista de Trechos e Citações (Página / Texto) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
                Anotações e Citações ({items.length})
              </span>
              <span className="text-[11px] text-stone-500">
                Página em um campo, texto no outro
              </span>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 bg-stone-950/60 border border-stone-800/80 hover:border-stone-700 rounded-xl space-y-2 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    {/* Campo Página */}
                    <div className="w-32 shrink-0">
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-mono mb-1">
                        Página / Local
                      </label>
                      <input
                        type="text"
                        value={item.page}
                        onChange={(e) => handleItemChange(item.id, 'page', e.target.value)}
                        placeholder="Ex: p. 45"
                        className="w-full px-2.5 py-1.5 bg-stone-900 border border-stone-800 rounded-md text-xs text-amber-300 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 font-mono"
                      />
                    </div>

                    {/* Campo Texto / Anotação */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-mono mb-1">
                        Texto / Anotação / Citação #{index + 1}
                      </label>
                      <textarea
                        rows={2}
                        value={item.text}
                        onChange={(e) => handleItemChange(item.id, 'text', e.target.value)}
                        placeholder="Insira o texto da citação ou comentário..."
                        className="w-full px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-md text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 resize-y min-h-[42px]"
                      />
                    </div>

                    {/* Botão Remover */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-stone-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer self-end mb-1"
                        title="Remover este trecho"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 border border-dashed border-stone-700 hover:border-amber-500/60 bg-stone-950/40 hover:bg-amber-500/5 text-amber-400/90 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus size={14} />
              <span>Adicionar Novo Trecho / Citação</span>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-stone-950/90 border-t border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopyFormatted}
            className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copiar texto do fichamento formatado"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg text-xs shadow-md transition-all cursor-pointer"
            >
              Salvar Fichamento
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
