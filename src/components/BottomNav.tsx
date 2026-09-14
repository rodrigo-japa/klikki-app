import React from 'react';
import { Home, Search, Heart, Menu } from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const items: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'busca', label: 'Busca', icon: Search },
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
    { id: 'menu', label: 'Menu', icon: Menu },
  ];

  return (
    <nav
      id="bottom-navigation"
      aria-label="Navegação mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all duration-150 ${
                isActive
                  ? 'text-orange-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 font-normal'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110 stroke-[2.25]' : 'stroke-[1.75]'}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" />
                )}
              </div>
              <span className="text-[11px] mt-1 leading-tight tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
