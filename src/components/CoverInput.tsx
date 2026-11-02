import React, { useEffect, useRef, useState } from 'react';
import { fetchCoverBlob, imageToCover, imageToCoverBlob, resolveCoverUrl } from '../utils/covers';
import { uploadCoverToDrive } from '../lib/driveCovers';

interface Props {
  value: string;
  onChange: (cover: string) => void;
  /** Small embedded copy kept next to a Drive cover, shown if the Drive link ever stops loading. */
  onFallbackChange?: (fallback: string | undefined) => void;
  onPendingChange: (pending: boolean) => void;
}

export function CoverInput({ value, onChange, onFallbackChange, onPendingChange }: Props) {
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
      const reduced = await imageToCover(blob);
      let cover = reduced;
      let fallback: string | undefined;
      let notice = '';
      try {
        cover = await uploadCoverToDrive(await imageToCoverBlob(blob));
        fallback = reduced;
      } catch (uploadError) {
        // Drive not authorized or offline: keep the reduced copy so the cover is not lost.
        console.warn('Cover upload to Drive failed, embedding instead:', uploadError);
        const reason = uploadError instanceof Error ? uploadError.message : '';
        notice = `A capa foi salva em tamanho reduzido; o envio para o Drive falhou.${reason ? ` ${reason}` : ''}`;
      }
      if (request.current !== attempt) return;
      onChange(cover); onFallbackChange?.(fallback); setAddress(''); setError(notice);
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
    {busy && <p role="status" className="text-xs text-amber-600">Enviando a capa…</p>}
    {error && <p role="alert" className="text-xs text-rose-500">{error}</p>}
    {!!address.trim() && !busy && <p className="text-xs text-amber-600">Use a imagem da URL ou apague o endereço antes de salvar o livro.</p>}
    {value && <div className="flex items-center gap-3">
      <img key={value} src={resolveCoverUrl(value)} alt="Prévia da capa" className="w-16 h-24 object-contain rounded" />
      <div className="space-y-2 text-xs">
        <p>{value.startsWith('data:') ? 'Imagem reduzida, incorporada ao livro e incluída no backup.' : /^https:\/\/lh3\.googleusercontent\.com\/d\//.test(value) ? 'Capa em alta resolução, guardada no seu Google Drive.' : /^\/?covers\//.test(value) ? 'Capa do catálogo, incluída no site.' : 'Capa antiga por link. Cole a URL acima para incorporar a imagem.'}</p>
        <button type="button" disabled={busy} onClick={() => { onChange(''); onFallbackChange?.(undefined); setAddress(''); setError(''); }} className="text-rose-500 underline">Remover capa</button>
      </div>
    </div>}
  </div>;
}
