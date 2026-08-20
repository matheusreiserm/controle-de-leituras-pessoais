import React, { useState } from 'react';
import { Book } from '../types';
import { Bookmark, Plus, CheckCircle2, Trash2, BookOpen } from 'lucide-react';

interface WishlistViewProps {
  books: Book[];
  onAddWish: (title: string, author: string) => void;
  onMarkAsRead: (book: Book) => void;
  onDeleteWish: (id: number) => void;
  onOpenCover?: (book: Book) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  books,
  onAddWish,
  onMarkAsRead,
  onDeleteWish,
  onOpenCover,
}) => {
  const wishBooks = books.filter((b) => b.status === 'wishlist');

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddWish(title.trim(), author.trim() || 'Desconhecido');
    setTitle('');
    setAuthor('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-stone-900 border border-stone-800 p-5 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold">
            <Bookmark size={20} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-bold text-amber-100">Lista de Desejos / Pendentes</h2>
            <p className="text-xs text-stone-400">Livros que pretende ler em breve</p>
          </div>
        </div>

        <button
          onClick={() => setShowAdd((prev) => !prev)}
          className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Add Form (Minimal & Clean) */}
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-stone-900 border border-amber-500/30 p-4 rounded-2xl space-y-3 shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Título do livro *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
            <input
              type="text"
              placeholder="Autor"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-stone-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl cursor-pointer"
            >
              Salvar na Lista
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {wishBooks.length === 0 ? (
        <div className="text-center py-12 bg-stone-900/40 border border-dashed border-stone-800 rounded-3xl space-y-2">
          <BookOpen size={32} className="mx-auto text-stone-600" />
          <p className="text-xs text-stone-400 font-mono">Sua lista de desejos está vazia.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wishBooks.map((b) => (
            <div
              key={b.id}
              className="bg-stone-900 border border-stone-800 hover:border-stone-700 p-4 rounded-2xl flex items-center justify-between gap-3 group transition-all"
            >
              <div
                onClick={() => onOpenCover && onOpenCover(b)}
                className="flex items-center gap-3 overflow-hidden cursor-pointer"
                title="Clique para ver a capa destacada"
              >
                {b.coverUrl ? (
                  <img
                    src={b.coverUrl}
                    alt={b.title}
                    className="w-10 h-14 object-cover rounded-lg shrink-0 hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-14 bg-stone-950 rounded-lg shrink-0 flex items-center justify-center text-stone-600 font-serif font-bold text-sm">
                    {b.title.charAt(0)}
                  </div>
                )}
                <div className="truncate">
                  <h4 className="text-xs font-bold font-serif text-white truncate">{b.title}</h4>
                  <p className="text-[11px] text-stone-400 truncate">{b.author}</p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onMarkAsRead(b)}
                  className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-stone-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  title="Marcar como Lido"
                >
                  <CheckCircle2 size={16} />
                  <span className="hidden sm:inline text-[11px]">Concluir</span>
                </button>
                <button
                  onClick={() => onDeleteWish(b.id)}
                  className="p-2 text-stone-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
