import React from 'react';
import { Search, MapPin, Sparkles } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onSelectCategory,
}) => {
  const quickTags = [
    'Reformas & Serviços',
    'Eletricistas',
    'Encanadores',
    'Lojas Locais',
    'Beleza & Estética',
    'Mecânicos',
  ];

  return (
    <section
      id="hero-section"
      className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-10 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800"
    >
      {/* Subtle background ambient glow (subtle, controlled, anti-slop) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
      />

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Direct Title requested by user */}
        <h1
          id="hero-title"
          className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight"
        >
          Encontre os melhores lojistas e prestadores da sua cidade
        </h1>

        {/* Short Subtitle requested by user */}
        <p
          id="hero-subtitle"
          className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Conecte-se com profissionais verificados, negócios locais e serviços de
          confiança perto de você.
        </p>

        {/* Main Search Bar */}
        <form
          id="hero-search-form"
          onSubmit={onSearchSubmit}
          className="mt-8 max-w-2xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 p-2 bg-white rounded-2xl shadow-xl shadow-black/20 border border-slate-200/20">
            <div className="relative flex-1 flex items-center">
              <Search className="w-5 h-5 text-slate-500 absolute left-3.5" />
              <input
                id="hero-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="O que você precisa hoje? (ex: eletricista, padaria, pintor)"
                className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-500 bg-transparent outline-none rounded-xl"
              />
            </div>

            <button
              id="hero-search-btn"
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-md shadow-orange-500/30 transition-all duration-150 active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
            </button>
          </div>
        </form>

        {/* Quick Category Chips */}
        <div className="mt-5 flex items-center justify-center flex-wrap gap-2 text-xs">
          <span className="text-slate-300 mr-1 font-medium hidden sm:inline">
            Mais procurados:
          </span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSelectCategory?.(tag === selectedCategory ? '' : tag)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                selectedCategory === tag
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
