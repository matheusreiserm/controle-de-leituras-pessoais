import React, { useEffect, useRef, useState } from 'react';
import { fetchCoverBlob, imageToCover, resolveCoverUrl } from '../utils/covers';

interface Props {
  value: string;
  onChange: (cover: string) => void;
  onPendingChange: (pending: boolean) => void;
}

export function CoverInput({ value, onChange, onPendingChange }: Props) {
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  useEffect(() => { onPendingChange(busy || !!address.trim()); }, [busy, address, onPendingChange]);

  const prepare = async (source: Blob | string) => {
    const attempt = ++request.current;
    setBusy(true); setError('');
    try {
      const blob = typeof source === 'string' ? await fetchCoverBlob(source) : source;
      const cover = await imageToCover(blob);
      if (request.current !== attempt) return;
      onChange(cover); setAddress('');
    } catch (err) {
      if (request.current === attempt) setError(err instanceof Error ? err.message : 'Não foi possível preparar a capa.');
    } finally { if (request.current === attempt) setBusy(false); }
  };

  return <div className="space-y-3 pt-3 border-t border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200">
    <label htmlFor="cover-address" className="block text-xs font-semibold">Capa do livro</label>
    <div className="flex flex-wrap gap-2">
      <input id="cover-address" type="url" value={address} disabled={busy}
        onChange={e => { setAddress(e.target.value); setError(''); }}
        placeholder="Cole a URL da imagem"
        className="min-w-0 flex-1 rounded-lg p-2 text-sm bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700" />
      <button type="button" disabled={busy || !address.trim()} onClick={() => void prepare(address)}
        className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs disabled:opacity-50">Usar imagem da URL</button>
    </div>
    <label className="block text-xs space-y-2">
      <span>Ou envie uma imagem do dispositivo (até 10 MB)</span>
      <input aria-label="Enviar capa do dispositivo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={busy}
        className="block w-full text-xs"
        onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void prepare(file); }} />
    </label>
    {busy && <p role="status" className="text-xs text-amber-600">Preparando a imagem da capa…</p>}
    {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}
    {!!address.trim() && !busy && <p className="text-xs text-amber-600">Use a imagem da URL ou apague o endereço antes de salvar o livro.</p>}
    {value && <div className="flex items-center gap-3">
      <img key={value} src={resolveCoverUrl(value)} alt="Prévia da capa" className="w-16 h-24 object-contain rounded" />
      <div className="space-y-2 text-xs">
        <p>{value.startsWith('data:') ? 'Imagem incorporada. Será salva com o livro e incluída no backup.' : /^\/?covers\//.test(value) ? 'Capa do catálogo, incluída no site.' : 'Capa antiga por link. Cole a URL acima para incorporar a imagem.'}</p>
        <button type="button" disabled={busy} onClick={() => { onChange(''); setAddress(''); setError(''); }} className="text-rose-500 underline">Remover capa</button>
      </div>
    </div>}
  </div>;
}
