import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Hero } from './components/Hero';
import { AdBanner } from './components/AdBanner';
import { AdvertisersFeed } from './components/AdvertisersFeed';
import { PerfilPublicoView } from './components/PerfilPublicoView';
import { AnuncieAgoraFunnel } from './components/AnuncieAgoraFunnel';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';
import { NavTab, PerfilAnunciante } from './types';
import { DEMO_ADVERTISERS } from './data/mockData';
import { supabase } from './lib/supabase';
import {
  Search,
  Heart,
  Store,
  Info,
  ChevronRight,
  UserPlus,
  LogIn,
  LogOut,
  Sparkles,
  Star,
  MapPin,
} from 'lucide-react';

function AppContent() {
  const { user, userName, signOut, showToast, favorites = [], isFavorite, toggleFavorite } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('inicio');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<PerfilAnunciante | null>(null);
  const [showAdvertiseFunnel, setShowAdvertiseFunnel] = useState<boolean>(false);
  const [userHasProfile, setUserHasProfile] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      setUserHasProfile(false);
      return;
    }

    const checkExistingProfile = async () => {
      try {
        const raw = localStorage.getItem('klikki_saved_advertisers');
        if (raw) {
          const list: PerfilAnunciante[] = JSON.parse(raw);
          if (list.some((p) => p.user_id === user.id)) {
            setUserHasProfile(true);
            return;
          }
        }
      } catch (err) {
        console.warn('Error checking local profile:', err);
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        user.id
      );

      if (isUuid) {
        try {
          const { data } = await supabase
            .from('perfis_anunciantes')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (data) {
            setUserHasProfile(true);
            return;
          }
          const fallbackRes = await supabase
            .from('perfil_anunciante')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (fallbackRes.data) {
            setUserHasProfile(true);
          }
        } catch (err) {
          console.warn('Aviso ao consultar perfil no Supabase:', err);
        }
      }
    };

    checkExistingProfile();

    const handleProfileCreated = () => {
      setUserHasProfile(true);
    };

    window.addEventListener('klikki:new_advertiser', handleProfileCreated);
    return () => {
      window.removeEventListener('klikki:new_advertiser', handleProfileCreated);
    };
  }, [user]);

  const openAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  const handleSelectTab = (tab: NavTab) => {
    setSelectedAdvertiser(null);
    setShowAdvertiseFunnel(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedAdvertiser(null);
    setShowAdvertiseFunnel(false);
    if (activeTab !== 'inicio' && activeTab !== 'busca') {
      setActiveTab('inicio');
    }
  };

  const handleAdvertiseClick = () => {
    setSelectedAdvertiser(null);
    setShowAdvertiseFunnel(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenMyProfile = async () => {
    if (!user) {
      openAuth('login');
      return;
    }

    let userProfile: PerfilAnunciante | null = null;
    try {
      const raw = localStorage.getItem('klikki_saved_advertisers');
      if (raw) {
        const list: PerfilAnunciante[] = JSON.parse(raw);
        const found = list.find((p) => p.user_id === user.id) || list[0];
        if (found) {
          userProfile = found;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler do localStorage:', e);
    }

    if (!userProfile && user.id) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        user.id
      );
      if (isUuid) {
        try {
          const { data } = await supabase
            .from('perfis_anunciantes')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (data) {
            userProfile = data as PerfilAnunciante;
          } else {
            const fallbackRes = await supabase
              .from('perfil_anunciante')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            if (fallbackRes.data) {
              userProfile = fallbackRes.data as PerfilAnunciante;
            }
          }
        } catch (e) {
          console.warn('Erro ao buscar perfil do usuário no Supabase:', e);
        }
      }
    }

    if (!userProfile) {
      userProfile = {
        id: user.id || `profile-${Date.now()}`,
        user_id: user.id,
        nome: userName,
        nome_comercial: `${userName} - Serviços & Vendas`,
        titulo: 'Profissional Verificado Klikki',
        descricao:
          'Bem-vindo ao meu perfil público no Klikki! Aqui você confere meus serviços, ofertas e canais de contato com qualidade e rapidez.',
        tipo_perfil: 'prestador',
        categoria: 'Serviços Gerais',
        subcategoria: 'Atendimento Rápido',
        cidade: 'São Paulo',
        bairro: 'Centro',
        estado: 'SP',
        plano_atual: 'gratis',
        verificado: true,
        avaliacao: 5.0,
        total_avaliacoes: 1,
      };

      try {
        const raw = localStorage.getItem('klikki_saved_advertisers');
        const list: PerfilAnunciante[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem('klikki_saved_advertisers', JSON.stringify([userProfile, ...list]));
      } catch (err) {
        console.warn('Storage err:', err);
      }
    }

    setShowAdvertiseFunnel(false);
    setSelectedAdvertiser(userProfile);
    setUserHasProfile(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Acessando seu Perfil Público no Klikki', 'success');
  };

  // Find all advertisers that are favorited
  const safeFavorites = Array.isArray(favorites) ? favorites : [];
  const favoritedAdvertisers = DEMO_ADVERTISERS.filter((item) =>
    safeFavorites.includes(String(item.id))
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
      <Toast />

      {/* Topbar / Global Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onOpenAuth={() => openAuth('login')}
        onLogoClick={() => handleSelectTab('inicio')}
        onOpenAdvertise={handleAdvertiseClick}
        onOpenMyProfile={handleOpenMyProfile}
        userHasProfile={userHasProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-12">
        {/* If the multi-step Advertise Funnel is open */}
        {showAdvertiseFunnel ? (
          <AnuncieAgoraFunnel
            onBack={() => {
              setShowAdvertiseFunnel(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onProfileCreated={(newProfile) => {
              setUserHasProfile(true);
              setShowAdvertiseFunnel(false);
              setSelectedAdvertiser(newProfile);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={(tab) => openAuth(tab || 'register')}
          />
        ) : selectedAdvertiser ? (
          <PerfilPublicoView
            advertiser={selectedAdvertiser}
            onBack={() => {
              setSelectedAdvertiser(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => openAuth('login')}
            onUpgradePlan={handleAdvertiseClick}
          />
        ) : (
          <>
            {activeTab === 'inicio' && (
              <>
                {/* Hero Section */}
                <Hero
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearchSubmit={handleSearchSubmit}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />

                {/* Horizontal Ad Banner Placeholder */}
                <AdBanner onAdvertiseClick={handleAdvertiseClick} />

                {/* Advertisers Feed & Supabase Query */}
                <AdvertisersFeed
                  searchQuery={searchQuery}
                  categoryFilter={selectedCategory}
                  onSelectAdvertiser={(adv) => {
                    setSelectedAdvertiser(adv);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenAuth={() => openAuth('login')}
                />
              </>
            )}

            {activeTab === 'busca' && (
              <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Busca de Serviços & Comércios
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Pesquise por nome, profissão ou segmento local.
                  </p>
                </div>

                <div className="relative mb-6">
                  <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: eletricista, confeitaria, clínica, encanador..."
                    className="w-full pl-11 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-xs"
                  />
                </div>

                <AdvertisersFeed
                  searchQuery={searchQuery}
                  categoryFilter={selectedCategory}
                  onSelectAdvertiser={(adv) => {
                    setSelectedAdvertiser(adv);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onOpenAuth={() => openAuth('login')}
                />
              </div>
            )}

            {activeTab === 'favoritos' && (
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 pb-4 border-b border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                    <span>Seus Favoritos</span>
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Lojistas e prestadores que você salvou para contato rápido.
                  </p>
                </div>

                {!user ? (
                  <div className="max-w-md mx-auto py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-4 border border-rose-100">
                      <Heart className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Faça login para ver seus favoritos
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                      Conecte-se com sua conta para salvar estabelecimentos e sincronizar suas preferências na nuvem.
                    </p>
                    <button
                      type="button"
                      onClick={() => openAuth('login')}
                      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-colors"
                    >
                      <LogIn className="w-4 h-4 text-orange-400" />
                      <span>Entrar na minha conta</span>
                    </button>
                  </div>
                ) : favoritedAdvertisers.length === 0 ? (
                  <div className="max-w-md mx-auto py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center mb-4 border border-orange-100">
                      <Heart className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Nenhum favorito salvo ainda
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                      Você ainda não favoritou nenhum lojista ou prestador de serviço. Clique no ícone de coração nos cards para salvar aqui.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSelectTab('inicio')}
                      className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 shadow-xs transition-colors"
                    >
                      Explorar vitrines
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoritedAdvertisers.map((item) => {
                      const isDiamond = item.plano_atual === 'diamante';
                      const isGold = item.plano_atual === 'ouro';
                      const displayName =
                        item.nome_comercial || item.nome || item.titulo || 'Anunciante';
                      const location =
                        [item.bairro, item.cidade].filter(Boolean).join(' - ') ||
                        item.cidade ||
                        'Atende na região';

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedAdvertiser(item)}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              {isDiamond ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                  <Sparkles className="w-3 h-3 text-orange-500 fill-orange-500" />
                                  <span>Destaque Diamante</span>
                                </span>
                              ) : isGold ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  <span>Destaque</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">
                                  {item.categoria}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                                className="p-2 rounded-xl border bg-rose-50 border-rose-200 text-rose-500 shadow-2xs hover:scale-105 transition-all"
                                title="Remover dos favoritos"
                              >
                                <Heart className="w-4 h-4 fill-rose-500" />
                              </button>
                            </div>

                            <h4 className="font-bold text-slate-900 text-base">
                              {displayName}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {item.categoria}
                            </p>
                            {item.descricao && (
                              <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                                {item.descricao}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{location}</span>
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-orange-600 inline-flex items-center gap-1">
                              <span>Ver detalhes</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'menu' && (
              <div className="max-w-3xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Menu Klikki</h2>
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
                  {/* User Identity Card if logged in */}
                  {user ? (
                    <>
                      <div className="p-4 bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{userName}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={signOut}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sair</span>
                        </button>
                      </div>

                      {/* Botão Meus Anúncios / Perfil Público no menu */}
                      <button
                        type="button"
                        onClick={handleOpenMyProfile}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-orange-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 text-sm block">
                              Meus Anúncios (Meu Perfil Público)
                            </span>
                            <span className="text-xs text-slate-500">
                              Acesse sua página oficial e gerencie suas ofertas
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAuth('login')}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                          <LogIn className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 text-sm block">
                            Entrar ou Criar Conta
                          </span>
                          <span className="text-xs text-slate-500">
                            Acesse sua conta para gerenciar preferências
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSelectTab('inicio')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 text-sm block">Vitrines e Lojas</span>
                        <span className="text-xs text-slate-500">Navegue pelas empresas locais</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectTab('favoritos')}
                    className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 text-sm block">Favoritos Salvos</span>
                        <span className="text-xs text-slate-500">Acesse seus prestadores salvos ({safeFavorites.length})</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>

                  {!userHasProfile && (
                    <button
                      type="button"
                      onClick={handleAdvertiseClick}
                      className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                          <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 text-sm block">
                            Cadastre seu Serviço ou Negócio Grátis
                          </span>
                          <span className="text-xs text-slate-500">
                            Crie seu anúncio no Klikki e conquiste novos clientes
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  )}

                  <div className="px-5 py-4 bg-slate-50/70 text-xs text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Klikki V2 • Etapa 3: Cards, Favoritos e Perfil Público</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer (Desktop / Tablet) */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm tracking-tight">
              Kli<span className="text-orange-500">kki</span>
            </span>
            <span className="text-slate-400">|</span>
            <span>Marketplace Local de Prestadores e Lojistas</span>
          </div>
          <div className="text-slate-400">
            © {new Date().getFullYear()} Klikki. Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Mobile-Only Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab={authModalTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
