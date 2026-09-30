import React, { useState } from 'react';
import { Equipe, Atleta } from '../types';
import { PlusCircle, Trash2, Award, User, Star, StarOff, ShieldAlert, BadgeInfo } from 'lucide-react';
import { motion } from 'motion/react';

interface TeamCardProps {
  key?: React.Key;
  equipe: Equipe;
  eqIdx: number;
  categoriaIdReal: string | number | undefined;
  obterId: (obj: any) => string | number | undefined;
  onEquipeChange: (eqIdx: number, novoNome: string) => void;
  onAtletaChange: (eqIdx: number, atlIdx: number, novoNome: string) => void;
  onAdicionarAtletaLocal: (eqIdx: number) => void;
  onSalvarAlteracao: (
    tipo: 'categoria' | 'equipe' | 'atleta',
    id: any,
    novoValor: string,
    parentId?: number | string,
    eqIdx?: number,
    atlIdx?: number
  ) => Promise<void>;
  onRemoverEquipeLocal: (eqIdx: number) => void;
  onRemoverAtletaLocal: (eqIdx: number, atlIdx: number) => void;
}

export default function TeamCard({
  equipe,
  eqIdx,
  categoriaIdReal,
  obterId,
  onEquipeChange,
  onAtletaChange,
  onAdicionarAtletaLocal,
  onSalvarAlteracao,
  onRemoverEquipeLocal,
  onRemoverAtletaLocal,
}: TeamCardProps) {
  const equipeIdReal = obterId(equipe);
  const isTeamNew = !equipeIdReal || String(equipeIdReal).startsWith('novo-');

  // Toggle captain suffix "(C)"
  const toggleCaptainStatus = (atlIdx: number, atleta: Atleta) => {
    const atletaNome = typeof atleta === 'object' ? atleta.nome : String(atleta);
    const atletaId = obterId(atleta) || `atl-temp-${atlIdx}`;
    
    let novoNome = atletaNome.trim();
    if (novoNome.endsWith('(C)')) {
      novoNome = novoNome.replace(/\s*\(C\)$/, '').trim();
    } else {
      novoNome = `${novoNome} (C)`;
    }

    onAtletaChange(eqIdx, atlIdx, novoNome);
    onSalvarAlteracao('atleta', atletaId, novoNome, equipeIdReal, eqIdx, atlIdx);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: Math.min(eqIdx * 0.05, 0.4) }}
      className="flex flex-col bg-white rounded-2xl shadow-xs border border-stone-200/80 hover:shadow-md hover:border-stone-300/80 transition duration-300 group"
    >
      
      {/* Header section with delete and edit */}
      <div className="p-4 border-b border-stone-100 bg-stone-50/50 rounded-t-2xl">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest font-mono">
            {isTeamNew ? 'Nova Equipe' : `ID: #${equipeIdReal}`}
          </span>
          
          <button
            onClick={() => onRemoverEquipeLocal(eqIdx)}
            className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 hover:bg-stone-100 p-1 rounded-md transition"
            title="Remover equipe localmente"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <input
          type="text"
          placeholder="NOME DA EQUIPE..."
          value={equipe.nome || ''}
          onChange={(e) => onEquipeChange(eqIdx, e.target.value)}
          onBlur={() => onSalvarAlteracao('equipe', equipeIdReal, equipe.nome, categoriaIdReal, eqIdx)}
          className="w-full text-stone-900 font-extrabold text-left text-sm uppercase bg-transparent border-b border-transparent hover:border-stone-300 focus:border-red-600 focus:bg-white px-2 py-1 outline-hidden text-ellipsis rounded-md transition duration-200"
        />
      </div>

      {/* Athletes List */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider font-mono">
              Atletas ({equipe.atletas?.length || 0})
            </span>
            {isTeamNew && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">
                <BadgeInfo className="w-3 h-3" />
                Requer salvar equipe
              </span>
            )}
          </div>

          <div className="border border-stone-200/80 rounded-xl bg-stone-50/30 overflow-hidden divide-y divide-stone-100">
            {equipe.atletas && equipe.atletas.length > 0 ? (
              equipe.atletas.map((atleta: any, atlIdx: number) => {
                const atletaNome = typeof atleta === 'object' && atleta !== null ? atleta.nome : String(atleta);
                const atletaId = obterId(atleta) || `atl-temp-${atlIdx}`;
                const isCaptain = atletaNome ? atletaNome.includes('(C)') : false;
                const isAthleteNew = !atletaId || String(atletaId).startsWith('novo-') || String(atletaId).startsWith('atl-temp-');

                return (
                  <div
                    key={atletaId}
                    className="group/item flex items-center justify-between px-3 py-1.5 hover:bg-stone-50 transition duration-150"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`p-1 rounded-md ${isCaptain ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                        <User className="w-3.5 h-3.5" />
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Nome do atleta..."
                        value={atletaNome || ''}
                        onChange={(e) => onAtletaChange(eqIdx, atlIdx, e.target.value)}
                        onBlur={() => onSalvarAlteracao(
                          'atleta',
                          atletaId,
                          atletaNome,
                          equipeIdReal,
                          eqIdx,
                          atlIdx
                        )}
                        className={`w-full text-left text-sm text-stone-800 bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:bg-white outline-hidden py-1 px-1.5 rounded-md transition duration-150 ${
                          isCaptain ? 'font-bold text-stone-900' : ''
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 pl-2">
                      {/* Toggle Captain Armband */}
                      <button
                        onClick={() => toggleCaptainStatus(atlIdx, atleta)}
                        disabled={!atletaNome.trim() || isTeamNew}
                        className={`p-1 rounded-md hover:bg-stone-100 transition shrink-0 ${
                          isCaptain ? 'text-amber-500 hover:text-amber-600' : 'text-stone-300 hover:text-stone-500'
                        }`}
                        title={isCaptain ? 'Remover braçadeira de capitão' : 'Tornar capitão da equipe'}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>

                      {/* Remove Athlete Button */}
                      <button
                        onClick={() => onRemoverAtletaLocal(eqIdx, atlIdx)}
                        className="p-1 rounded-md text-stone-300 hover:text-red-500 hover:bg-red-50 transition shrink-0"
                        title="Remover atleta da lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 px-4 text-center text-stone-400 text-xs italic">
                Nenhum atleta inscrito nesta equipe.
              </div>
            )}
          </div>
        </div>

        {/* Action Button: Add Athlete */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          {isTeamNew ? (
            <div className="text-[11px] text-stone-400 bg-stone-50 p-2 rounded-lg border border-dashed border-stone-200 flex items-center gap-1.5 justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-stone-400" />
              <span>Digite um nome e clique fora para ativar</span>
            </div>
          ) : (
            <button
              onClick={() => onAdicionarAtletaLocal(eqIdx)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 hover:text-stone-900 rounded-xl border border-stone-200 hover:border-stone-300 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-stone-500" />
              <span>Adicionar Atleta</span>
            </button>
          )}
        </div>

      </div>

    </motion.div>
  );
}
