import React, { useState, useRef, useEffect } from 'react';
import { Search, User, LogOut, ChevronDown, PlusCircle, Store } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onOpenAuth: () => void;
  onLogoClick?: () => void;
  onOpenAdvertise?: () => void;
  onOpenMyProfile?: () => void;
  userHasProfile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onOpenAuth,
  onLogoClick,
  onOpenAdvertise,
  onOpenMyProfile,
  userHasProfile,
}) => {
  const { user, userName, userInitials, signOut, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onLogoClick}
            id="brand-logo"
            className="group flex items-center gap-2 select-none text-left cursor-pointer"
            aria-label="Klikki Início"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/25 group-hover:scale-105 transition-transform duration-200">
              <span className="font-extrabold text-xl tracking-tighter">K</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                Kli<span className="text-orange-500">kki</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-600 tracking-wider uppercase">
                Marketplace Local
              </span>
            </div>
          </button>
        </div>

        {/* Search Bar (Tablet / Desktop) */}
        <form
          onSubmit={onSearchSubmit}
          className="hidden md:flex flex-1 max-w-lg mx-4"
          id="header-search-form"
        >
          <div className="relative w-full">
            <input
              id="header-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por serviços, lojas ou especialidades..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-slate-900 placeholder:text-slate-500 rounded-full border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </form>

        {/* Right Actions: Authenticated vs Unauthenticated */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user && userHasProfile ? (
            onOpenMyProfile && (
              <button
                id="btn-header-gerenciar-anuncio"
                type="button"
                onClick={onOpenMyProfile}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 border border-orange-200 shadow-2xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer"
                title="Acesse e gerencie o seu perfil de anunciante no Klikki"
              >
                <Store className="w-4 h-4 text-orange-600 stroke-[2.5]" />
                <span className="whitespace-nowrap font-extrabold tracking-tight">Gerenciar Anúncio</span>
              </button>
            )
          ) : (
            onOpenAdvertise && (
              <button
                id="btn-header-anunciar-gratis"
                type="button"
                onClick={onOpenAdvertise}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-md shadow-emerald-700/25 hover:shadow-lg hover:shadow-emerald-700/30 border border-emerald-400/80 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer"
                title="Cadastre seu negócio ou serviço gratuitamente no Klikki"
              >
                <PlusCircle className="w-4 h-4 text-white stroke-[2.5]" />
                <span className="whitespace-nowrap font-extrabold tracking-tight">Anunciar Grátis</span>
              </button>
            )
          )}

          {loading ? (
            <div className="w-24 h-9 bg-slate-100 rounded-lg animate-pulse" />
          ) : user ? (
            /* Logged in User Menu with initials button & dropdown */
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-profile-menu-button"
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-slate-50 active:scale-95 transition-all text-slate-800"
                aria-expanded={dropdownOpen}
                aria-label="Abrir menu do usuário"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-900 to-slate-800 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {userInitials}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                  {userName}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                    dropdownOpen ? 'rotate-180 text-orange-500' : ''
                  }`}
                />
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <div
                  id="user-dropdown-menu"
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {userName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>

                  <div className="p-1 space-y-0.5">
                    {onOpenMyProfile && (
                      <button
                        id="btn-dropdown-meus-anuncios"
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenMyProfile();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-orange-500" />
                        <span>Meus Anúncios (Meu Perfil)</span>
                      </button>
                    )}
                    <button
                      id="btn-logout"
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Sair da conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Logged out: "Entrar / Cadastrar" button */
            <button
              id="btn-login-header"
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
            >
              <User className="w-4 h-4 text-orange-400" />
              <span>Entrar / Cadastrar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
