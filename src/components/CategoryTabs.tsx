import React, { useState } from 'react';
import { Categoria } from '../types';
import { Plus, FolderPlus, Trash2, Edit3, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CategoryTabsProps {
  categorias: Categoria[];
  categoriaAtualIndex: number;
  onSelectCategoria: (index: number) => void;
  onAdicionarCategoria: (titulo: string) => void;
  onRemoverCategoriaLocal?: (index: number) => void;
}

export default function CategoryTabs({
  categorias,
  categoriaAtualIndex,
  onSelectCategoria,
  onAdicionarCategoria,
  onRemoverCategoriaLocal,
}: CategoryTabsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (novoTitulo.trim()) {
      onAdicionarCategoria(novoTitulo.trim());
      setNovoTitulo('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="w-full bg-white border-b border-stone-200 py-3 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Scrollable Tabs Wrapper */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none scroll-smooth">
          <div className="flex items-center gap-1.5 flex-nowrap">
            {categorias.map((cat, idx) => {
              const isActive = categoriaAtualIndex === idx;
              // Clean Category Title for display (e.g. strip prefixes)
              const displayTitle = cat.titulo
                ? cat.titulo.replace('RELAÇÃO DOS ATLETAS - ', '')
                : `Categoria ${idx + 1}`;

              return (
                <button
                  key={cat.id || `tab-${idx}`}
                  onClick={() => onSelectCategoria(idx)}
                  className={`relative px-4 py-2 text-xs sm:text-sm font-semibold rounded-full transition duration-300 whitespace-nowrap focus:outline-hidden ${
                    isActive
                      ? 'text-white'
                      : 'text-stone-600 bg-stone-100 hover:bg-stone-200/80 hover:text-stone-900'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeCategoryTab"
                      className="absolute inset-0 bg-red-600 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{displayTitle}</span>
                </button>
              );
            })}
          </div>

          {/* Add Category Button Toggle */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition cursor-pointer shrink-0"
              title="Criar nova categoria"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Categoria</span>
            </button>
          )}
        </div>

        {/* Add Category Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmit}
              className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-1.5 w-full md:max-w-xs shrink-0"
            >
              <input
                type="text"
                placeholder="Nome da categoria (ex: SUB-15)..."
                value={novoTitulo}
                onChange={(e) => setNovoTitulo(e.target.value)}
                autoFocus
                className="bg-transparent border-0 outline-hidden text-xs text-stone-800 px-2 w-full"
              />
              <button
                type="submit"
                disabled={!novoTitulo.trim()}
                className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition"
                title="Confirmar categoria"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNovoTitulo('');
                }}
                className="p-1.5 rounded-md bg-stone-200 text-stone-600 hover:bg-stone-300 transition"
              >
                Cancelar
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Local Deletion/Aux Actions */}
        {onRemoverCategoriaLocal && categorias.length > 1 && (
          <button
            onClick={() => {
              if (window.confirm(`Tem certeza que deseja remover localmente a categoria "${categorias[categoriaAtualIndex].titulo}"?`)) {
                onRemoverCategoriaLocal(categoriaAtualIndex);
              }
            }}
            className="hidden md:flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-500 transition font-medium"
            title="Excluir categoria localmente"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Categoria Atual</span>
          </button>
        )}

      </div>
    </div>
  );
}
