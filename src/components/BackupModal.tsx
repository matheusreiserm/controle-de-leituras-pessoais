import React, { useState, useRef } from 'react';
import { Book } from '../types';
import { exportToGoogleDrive, importFromGoogleDrive } from '../lib/driveSync';
import { validateBackupPayload, createBackupPayload } from '../utils/backupValidation';
import {
  Cloud,
  Upload,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileJson,
  ShieldCheck,
  HardDriveDownload,
  HardDriveUpload,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onRestoreBooks: (importedBooks: Book[]) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  books,
  onRestoreBooks,
}) => {
  const [loadingAction, setLoadingAction] = useState<'export' | 'import' | 'file-import' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string; details?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleExportDrive = async () => {
    const confirmed = window.confirm(
      `Deseja exportar o backup de ${books.length} leituras para o Google Drive? Isso atualizará o arquivo 'controle_leituras_backup.json' na pasta 'Google AI Studio/Backups'.`
    );
    if (!confirmed) return;

    setLoadingAction('export');
    setFeedback(null);
    try {
      const payload = createBackupPayload(books);
      const result = await exportToGoogleDrive(payload.books, true);
      if (result.success) {
        setFeedback({
          type: 'success',
          text: result.message,
          details: `Backup versionado (v${payload.formatVersion}) com ${books.length} registros exportados.`,
        });
      } else {
        setFeedback({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Falha ao exportar backup para o Google Drive.',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleImportDrive = async () => {
    const confirmed = window.confirm(
      'Atenção: A restauração do Google Drive substituirá os dados atuais pelas leituras do backup. Deseja continuar?'
    );
    if (!confirmed) return;

    setLoadingAction('import');
    setFeedback(null);
    try {
      const result = await importFromGoogleDrive(true);
      if (result.success && result.books) {
        // Strict validation of downloaded data
        const validation = validateBackupPayload(result.books);
        if (!validation.isValid || !validation.books) {
          setFeedback({
            type: 'error',
            text: 'O arquivo baixado do Google Drive não passou na validação rigorosa de integridade.',
            details: validation.error,
          });
          return;
        }

        onRestoreBooks(validation.books);
        setFeedback({
          type: 'success',
          text: `Backup restaurado com sucesso do Google Drive! (${validation.totalRecords} leituras validadas)`,
          details: `Formato: ${validation.version || '1.0.0'}. Integridade dos campos 100% verificada.`,
        });
      } else {
        setFeedback({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Falha ao importar backup do Google Drive.',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportLocalJson = () => {
    try {
      const payload = createBackupPayload(books);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_leituras_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        text: `Arquivo de backup JSON baixado com sucesso (${books.length} leituras)!`,
        details: 'Versão do formato 1.0.0 gerada.',
      });
    } catch (e: any) {
      setFeedback({
        type: 'error',
        text: `Erro ao baixar arquivo JSON: ${e?.message || String(e)}`,
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      `Deseja restaurar o backup a partir do arquivo '${file.name}'? Todos os dados atuais serão substituídos pelo conteúdo validado deste arquivo.`
    );
    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoadingAction('file-import');
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Strict validation
        const validation = validateBackupPayload(parsed);
        if (!validation.isValid || !validation.books) {
          setFeedback({
            type: 'error',
            text: 'Falha na validação do arquivo de backup.',
            details: validation.error,
          });
          return;
        }

        onRestoreBooks(validation.books);
        setFeedback({
          type: 'success',
          text: `Backup local restaurado com sucesso! (${validation.totalRecords} leituras validadas)`,
          details: `Versão do formato: ${validation.version}. Todos os tipos e campos obrigatórios foram aprovados.`,
        });
      } catch (err: any) {
        setFeedback({
          type: 'error',
          text: 'Erro ao processar o arquivo JSON.',
          details: err?.message || String(err),
        });
      } finally {
        setLoadingAction(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setFeedback({
        type: 'error',
        text: 'Erro ao ler o arquivo selecionado.',
      });
      setLoadingAction(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-800/80 flex items-center justify-between bg-stone-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-100 tracking-wide font-mono uppercase">
                DADOS NO GOOGLE DRIVE
              </h2>
              <p className="text-[11px] text-stone-400">
                Importe ou exporte o JSON completo do seu acervo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Notice: Manual only */}
          <div className="p-3 bg-stone-950/60 border border-stone-800 rounded-xl flex items-start gap-2.5 text-xs text-stone-300">
            <ShieldCheck size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-stone-200">Seu acervo fica sob seu controle:</span>
              <span>
                As alterações feitas no app são salvas neste navegador. Depois de registrar novas leituras, use “Exportar para o Drive” para atualizar sua cópia integral na nuvem.
              </span>
            </div>
          </div>

          {/* Section 1: Google Drive */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
              Google Drive (Nuvem Pessoal)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportDrive}
                disabled={loadingAction !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-stone-950/80 hover:bg-amber-500/10 border border-stone-800 hover:border-amber-500/50 rounded-xl transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="p-2.5 bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-stone-950 rounded-full transition-all">
                  {loadingAction === 'export' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                </div>
                <span className="font-semibold text-stone-200 group-hover:text-amber-300 text-xs">
                  Exportar para o Drive
                </span>
                <span className="text-[10px] text-stone-500 text-center">
                  Salva em Google AI Studio/Backups
                </span>
              </button>

              <button
                onClick={handleImportDrive}
                disabled={loadingAction !== null}
                className="flex flex-col items-center justify-center gap-2 p-4 bg-stone-950/80 hover:bg-sky-500/10 border border-stone-800 hover:border-sky-500/50 rounded-xl transition-all group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="p-2.5 bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-stone-950 rounded-full transition-all">
                  {loadingAction === 'import' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                </div>
                <span className="font-semibold text-stone-200 group-hover:text-sky-300 text-xs">
                  Importar do Drive
                </span>
                <span className="text-[10px] text-stone-500 text-center">
                  Restaura com validação de esquema
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Local JSON File */}
          <div className="space-y-2 pt-2 border-t border-stone-800/80">
            <h3 className="text-xs font-mono font-bold text-stone-400 uppercase tracking-wider">
              Arquivo JSON Local (Offline)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportLocalJson}
                disabled={loadingAction !== null}
                className="flex items-center gap-2.5 p-3 bg-stone-950/60 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50"
              >
                <HardDriveDownload size={16} className="text-amber-400 shrink-0" />
                <div>
                  <span className="block text-xs font-medium text-stone-200">Baixar Arquivo JSON</span>
                  <span className="text-[10px] text-stone-500">Backup seguro no seu dispositivo</span>
                </div>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingAction !== null}
                className="flex items-center gap-2.5 p-3 bg-stone-950/60 hover:bg-stone-800 border border-stone-800 rounded-xl transition-all text-left cursor-pointer disabled:opacity-50"
              >
                <HardDriveUpload size={16} className="text-sky-400 shrink-0" />
                <div>
                  <span className="block text-xs font-medium text-stone-200">Restaurar de JSON</span>
                  <span className="text-[10px] text-stone-500">Carregar arquivo validado</span>
                </div>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in slide-in-from-top-1 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{feedback.text}</p>
                {feedback.details && <p className="text-[11px] opacity-80">{feedback.details}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-950/70 flex justify-between items-center">
          <span className="text-xs text-stone-400 font-mono">
            {books.length} leituras no acervo atual
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
