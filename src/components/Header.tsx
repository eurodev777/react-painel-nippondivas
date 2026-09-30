import React from 'react';
import { Trophy, Shield, Users, Search, Award } from 'lucide-react';

interface HeaderProps {
  totalCategorias: number;
  totalEquipes: number;
  totalAtletas: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
}

export default function Header({
  totalCategorias,
  totalEquipes,
  totalAtletas,
  searchTerm,
  onSearchChange,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-stone-200/80 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo and Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/10 border border-red-500 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-tr from-black/20 to-transparent"></div>
              <Shield className="w-6 h-6 relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-stone-900 text-white uppercase tracking-wider">Admin</span>
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest font-mono">Nippon Sorocaba</span>
              </div>
              <h1 className="text-2xl font-bold font-display tracking-tight text-stone-900">
                Relação Oficial de Atletas
              </h1>
            </div>
          </div>

          {/* Core Stats Overview */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-2 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200/50">
              <Trophy className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider font-mono">Categorias</p>
                <p className="text-sm font-bold text-stone-800 leading-none">{totalCategorias}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200/50">
              <Shield className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider font-mono">Equipes</p>
                <p className="text-sm font-bold text-stone-800 leading-none">{totalEquipes}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200/50">
              <Users className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider font-mono">Atletas</p>
                <p className="text-sm font-bold text-stone-800 leading-none">{totalAtletas}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Search bar row */}
        <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              id="global-search"
              placeholder="Buscar atleta ou equipe em todo o clube..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm text-stone-800 bg-stone-50 border border-stone-200 hover:border-stone-300 focus:border-red-500 focus:bg-white outline-hidden rounded-xl transition duration-200"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-semibold px-1 py-0.5 rounded-sm hover:bg-stone-100"
              >
                Limpar
              </button>
            )}
          </div>
          
          <div className="hidden md:flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <Award className="w-3.5 h-3.5 text-red-500" />
            <span>As alterações são sincronizadas ao desfocar (blur) dos campos.</span>
          </div>
        </div>
      </div>
    </header>
  );
}
