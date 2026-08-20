import React, { useState, useEffect } from 'react';
import { INITIAL_BOOKS } from '../data/initialBooks';
import {
  migrateBooksToFirestore,
  getFirestoreStats,
  formatFirestoreErrorMessage,
  MigrationProgress,
} from '../lib/firestoreBooks';
import { FIRESTORE_DATABASE_ID } from '../lib/firebase';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Info,
  Server,
  AlertCircle,
  WifiOff,
  Lock,
} from 'lucide-react';

interface MigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onMigrationSuccess?: () => void;
}

export const MigrationModal: React.FC<MigrationModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onMigrationSuccess,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [overwrite, setOverwrite] = useState(true);
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [firestoreStats, setFirestoreStats] = useState<{
    total: number;
    readTotal: number;
    readingTotal: number;
    byYear: Record<number, number>;
    isValidTarget: boolean;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Local expected dataset totals validation
  const localStats = React.useMemo(() => {
    const byYear: Record<number, number> = {};
    const readBooks = INITIAL_BOOKS.filter((b) => !b.status || b.status === 'read');
    const readingTotal = INITIAL_BOOKS.filter((b) => b.status === 'reading').length;
    readBooks.forEach((b) => {
      const y = b.readingYear || 0;
      byYear[y] = (byYear[y] || 0) + 1;
    });
    const isValid =
      INITIAL_BOOKS.length === 551 &&
      readBooks.length === 549 &&
      readingTotal === 2 &&
      byYear[2023] === 69 &&
      byYear[2024] === 183 &&
      byYear[2025] === 207 &&
      byYear[2026] === 90;

    return {
      total: INITIAL_BOOKS.length,
      readTotal: readBooks.length,
      readingTotal,
      byYear,
      isValid,
    };
  }, []);

  const loadLiveStats = async () => {
    if (!userId) return;
    setLoadingStats(true);
    setConnectionError(null);
    try {
      const stats = await getFirestoreStats(userId);
      setFirestoreStats(stats);
    } catch (e: any) {
      const friendly = formatFirestoreErrorMessage(e);
      console.warn('Erro ao carregar estatísticas do Firestore:', e);
      setConnectionError(friendly);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      loadLiveStats();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleStartMigration = async () => {
    if (overwrite) {
      const confirmed = window.confirm(
        'A base corrigida substituirá os campos bibliográficos dos registros existentes. Fichamentos, notas e outros campos adicionais serão preservados. Deseja continuar?'
      );
      if (!confirmed) return;
    }

    setIsRunning(true);
    setStatusMessage('Iniciando migração segura em lotes...');
    setConnectionError(null);

    try {
      const result = await migrateBooksToFirestore(
        userId,
        INITIAL_BOOKS,
        overwrite,
        (p) => setProgress({ ...p })
      );

      setProgress(result);
      await loadLiveStats();

      if (result.errors === 0) {
        setStatusMessage(
          `Migração concluída! ${result.imported} registros gravados/atualizados e ${result.skipped} preservados.`
        );
        if (onMigrationSuccess) {
          onMigrationSuccess();
        }
      } else {
        setStatusMessage(
          `Migração finalizada com ${result.errors} erros. Verifique os detalhes abaixo.`
        );
      }
    } catch (err: any) {
      const friendly = formatFirestoreErrorMessage(err);
      setConnectionError(friendly);
      setStatusMessage(`Falha na migração: ${friendly}`);
    } finally {
      setIsRunning(false);
    }
  };

  const percentage =
    progress && progress.total > 0
      ? Math.round((progress.processed / progress.total) * 100)
      : 0;

  const isPermissionDenied = connectionError?.includes('Permissão') || connectionError?.includes('403');
  const isConnectionOffline = connectionError?.includes('Conexão') || connectionError?.includes('offline');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-stone-800/80 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
              <Database size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base text-stone-100">
                  Migração Segura para o Firestore
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Banco Nomeado
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5 font-mono truncate max-w-md">
                DB ID: {FIRESTORE_DATABASE_ID}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Target Collection Info */}
          <div className="flex items-center justify-between p-3 bg-stone-950/60 border border-stone-800 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-stone-300">
              <Server size={15} className="text-amber-400" />
              <span>Coleção de Destino:</span>
              <span className="font-mono text-amber-300 bg-stone-900 px-2 py-0.5 rounded border border-stone-800">
                users/{userId}/books
              </span>
            </div>
            <span className="text-stone-400 font-mono text-[11px]">{userEmail}</span>
          </div>

          {/* Error Banner if any */}
          {connectionError && (
            <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-300">
              {isPermissionDenied ? (
                <Lock size={18} className="text-rose-400 shrink-0 mt-0.5" />
              ) : isConnectionOffline ? (
                <WifiOff size={18} className="text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-bold block text-rose-200">
                  {isPermissionDenied
                    ? 'Erro de Permissão de Acesso'
                    : isConnectionOffline
                    ? 'Problema de Conexão com o Firestore'
                    : 'Falha na Operação do Banco de Dados'}
                </span>
                <p className="leading-relaxed opacity-95">{connectionError}</p>
                {isPermissionDenied && (
                  <p className="text-[11px] text-rose-300/80 pt-1">
                    Dica: As regras de segurança exigem autenticação exclusiva com <code>matheusreiserm@gmail.com</code>.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Validation Table (Target vs Cloud Live) */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-200 uppercase tracking-wider">
                <ShieldCheck size={16} className="text-amber-400" />
                <span>Validação da Base Corrigida (549 concluídas + 2 em leitura)</span>
              </div>
              <button
                onClick={loadLiveStats}
                disabled={loadingStats || isRunning}
                className="text-[11px] text-stone-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                title="Recarregar estatísticas do Firestore"
              >
                <RefreshCw size={12} className={loadingStats ? 'animate-spin text-amber-400' : ''} />
                <span>Atualizar Nuvem</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-mono block">2023</span>
                <span className="font-bold text-stone-200 text-sm">69</span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  {firestoreStats ? `Nuvem: ${firestoreStats.byYear[2023] || 0}` : '...'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-mono block">2024</span>
                <span className="font-bold text-stone-200 text-sm">183</span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  {firestoreStats ? `Nuvem: ${firestoreStats.byYear[2024] || 0}` : '...'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-mono block">2025</span>
                <span className="font-bold text-stone-200 text-sm">207</span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  {firestoreStats ? `Nuvem: ${firestoreStats.byYear[2025] || 0}` : '...'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800">
                <span className="text-[10px] text-stone-400 uppercase font-mono block">2026</span>
                <span className="font-bold text-stone-200 text-sm">90</span>
                <span className="text-[10px] text-emerald-400 block font-mono">
                  {firestoreStats ? `Nuvem: ${firestoreStats.byYear[2026] || 0}` : '...'}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <span className="text-[10px] text-amber-300 uppercase font-mono font-bold block">
                  Total
                </span>
                <span className="font-bold text-amber-400 text-sm">551</span>
                <span className="text-[10px] font-bold text-emerald-400 block font-mono">
                  {firestoreStats ? `Nuvem: ${firestoreStats.total}` : '...'}
                </span>
              </div>
            </div>

            {/* Validation Banner */}
            {firestoreStats?.isValidTarget ? (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-300 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>
                  Perfeito! Os 551 registros estão sincronizados: 549 leituras concluídas (69, 183, 207 e 90 por ano) e 2 leituras em andamento.
                </span>
              </div>
            ) : (
              <div className="p-2.5 bg-stone-900/60 border border-stone-800 rounded-lg flex items-center gap-2 text-[11px] text-stone-400">
                <Info size={14} className="text-amber-400 shrink-0" />
                <span>
                  O acervo local contém 551 registros com IDs únicos de 1 a 551. Ative a atualização dos existentes para corrigir os dados bibliográficos e as capas no caminho <code>users/{userId}/books/[1..551]</code>.
                </span>
              </div>
            )}
          </div>

          {/* Idempotence & Options */}
          <div className="p-4 bg-stone-950/50 border border-stone-800/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-stone-300">
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  disabled={isRunning}
                  className="rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-stone-900"
                />
                <span>Atualizar registros existentes com a base corrigida</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-mono font-semibold">
                {overwrite ? '✓ Correção completa (recomendado)' : 'Somente novos registros'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              A atualização substitui somente os campos presentes na base corrigida. Fichamentos, notas e outros campos adicionais já salvos no Firestore são preservados.
            </p>
          </div>

          {/* Progress Bar (when active or complete) */}
          {progress && (
            <div className="space-y-2 p-4 bg-stone-950 border border-stone-800 rounded-xl">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                  {isRunning ? (
                    <>
                      <Loader2 size={13} className="animate-spin text-amber-400" />
                      <span>Migrando... ({progress.processed}/{progress.total})</span>
                    </>
                  ) : progress.isComplete ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span>Processamento finalizado</span>
                    </>
                  ) : (
                    <span>Progresso</span>
                  )}
                </span>
                <span className="font-mono font-bold text-amber-400">{percentage}%</span>
              </div>

              <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[11px] font-mono">
                <div className="p-1.5 bg-stone-900 rounded border border-stone-800">
                  <span className="text-stone-400 block text-[10px]">GRAVADOS/ATUALIZADOS</span>
                  <span className="font-bold text-emerald-400">{progress.imported}</span>
                </div>
                <div className="p-1.5 bg-stone-900 rounded border border-stone-800">
                  <span className="text-stone-400 block text-[10px]">IGNORADOS (IDEMPOTÊNCIA)</span>
                  <span className="font-bold text-sky-400">{progress.skipped}</span>
                </div>
                <div className="p-1.5 bg-stone-900 rounded border border-stone-800">
                  <span className="text-stone-400 block text-[10px]">ERROS</span>
                  <span className="font-bold text-rose-400">{progress.errors}</span>
                </div>
              </div>

              {progress.errorMessages.length > 0 && (
                <div className="mt-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-[11px] text-rose-300 max-h-28 overflow-y-auto space-y-1">
                  {progress.errorMessages.map((msg, i) => (
                    <div key={i}>{msg}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-stone-800/80 rounded-xl text-xs text-stone-200 border border-stone-700/80 flex items-start gap-2">
              <Sparkles size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <Server size={14} className="text-amber-400" />
            <span>Documentos: users/{userId}/books/[1..551]</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isRunning}
              className="px-4 py-2 text-stone-400 hover:text-stone-200 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Fechar
            </button>
            <button
              onClick={handleStartMigration}
              disabled={isRunning}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Migrando...</span>
                </>
              ) : (
                <>
                  <Database size={14} />
                  <span>Aplicar Base Corrigida (551 Registros)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
