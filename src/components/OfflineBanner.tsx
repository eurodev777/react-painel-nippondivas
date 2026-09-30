import React from 'react';
import { WifiOff, Database, RotateCcw, AlertTriangle } from 'lucide-react';

interface OfflineBannerProps {
  isOfflineMode: boolean;
  onResetToDefault: () => void;
  onRetryConnection: () => void;
  isRetrying: boolean;
}

export default function OfflineBanner({
  isOfflineMode,
  onResetToDefault,
  onRetryConnection,
  isRetrying,
}: OfflineBannerProps) {
  if (!isOfflineMode) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
              <span>Modo Banco Local (Offline / Demo)</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-medium bg-amber-200 text-amber-900">Ativo</span>
            </p>
            <p className="text-xs text-amber-700">
              A API oficial da Nippon não respondeu ou bloqueou CORS. Suas alterações serão salvas localmente no seu navegador.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRetryConnection}
            disabled={isRetrying}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-800 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 transition"
          >
            {isRetrying ? (
              <span className="animate-spin inline-block w-3 h-3 border-2 border-amber-800 border-t-transparent rounded-full" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            Tentar Reconectar API
          </button>
          
          <button
            onClick={onResetToDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-600 bg-stone-100 hover:bg-stone-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Resetar Dados Padrão
          </button>
        </div>

      </div>
    </div>
  );
}
