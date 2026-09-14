import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PerfilAnunciante } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ADVERTISERS } from '../data/mockData';
import {
  Store,
  MapPin,
  Star,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Heart,
  Sparkles,
  ChevronRight,
  MessageCircle,
  Phone,
  Eye,
} from 'lucide-react';

interface AdvertisersFeedProps {
  searchQuery?: string;
  categoryFilter?: string;
  onSelectAdvertiser: (advertiser: PerfilAnunciante) => void;
  onOpenAuth: () => void;
}

export const AdvertisersFeed: React.FC<AdvertisersFeedProps> = ({
  searchQuery = '',
  categoryFilter = '',
  onSelectAdvertiser,
  onOpenAuth,
}) => {
  const { user, isFavorite, toggleFavorite } = useAuth();
  const [advertisers, setAdvertisers] = useState<PerfilAnunciante[]>([]);
  const [realSupabaseCount, setRealSupabaseCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useDemoData, setUseDemoData] = useState<boolean>(false);

  // Normalizador defensivo para garantir integridade caso a tabela contenha variações de colunas
  const normalizeAdvertiser = (raw: any): PerfilAnunciante => {
    const fallbackFoto =
      raw.tipo_perfil === 'prestador'
        ? 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80'
        : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80';

    return {
      id: raw.id,
      user_id: raw.user_id,
      nome: raw.nome || raw.nome_comercial || raw.titulo || 'Anunciante Klikki',
      nome_comercial: raw.nome_comercial || raw.nome || raw.titulo || 'Anunciante Klikki',
      titulo: raw.titulo || raw.nome_comercial || raw.nome || 'Anunciante no Klikki',
      descricao: raw.descricao || 'Atendimento com qualidade e compromisso.',
      categoria: raw.categoria || 'Serviços Gerais',
      subcategoria: raw.subcategoria || raw.categoria || 'Geral',
      tipo_perfil: raw.tipo_perfil || 'comercio',
      cidade: raw.cidade || 'São Paulo',
      bairro: raw.bairro || 'Centro',
      logradouro: raw.logradouro,
      numero: raw.numero || raw.endereco_numero,
      endereco_numero: raw.endereco_numero || raw.numero,
      cep: raw.cep,
      estado: raw.estado || 'SP',
      whatsapp: raw.whatsapp || '',
      telefone: raw.telefone || raw.whatsapp || '',
      plano_atual: raw.plano_atual || 'gratis',
      foto_url: raw.foto_url || raw.logo_url || raw.logo || fallbackFoto,
      logo_url: raw.logo_url || raw.foto_url || raw.logo || fallbackFoto,
      banner_url:
        raw.banner_url ||
        (raw.tipo_perfil === 'prestador'
          ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'),
      cnpj: raw.cnpj,
      cnpj_verificado: Boolean(raw.cnpj_verificado),
      avaliacao: Number(raw.avaliacao) || 5.0,
      total_avaliacoes: Number(raw.total_avaliacoes) || 1,
      destaque:
        raw.destaque ?? (raw.plano_atual === 'diamante' || raw.plano_atual === 'ouro'),
      verificado: raw.verificado ?? true,
      created_at: raw.created_at,
    };
  };

  const fetchAdvertisers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Ler anunciantes em cache local para carregamento instantâneo
      let localSaved: PerfilAnunciante[] = [];
      try {
        const raw = localStorage.getItem('klikki_saved_advertisers');
        if (raw) {
          localSaved = JSON.parse(raw);
        }
      } catch (e) {
        console.warn('Aviso ao ler anunciantes locais:', e);
      }

      // 2. Consulta Pública e Global ao Supabase (SEM QUALQUER FILTRO DE USER_ID OU SESSÃO)
      // Traz todos os registros publicados para visitantes anônimos e qualquer usuário
      const supaData: PerfilAnunciante[] = [];
      const seenIds = new Set<string>();
      
      try {
        // BUSCA DIRETA E LIMPA NA TABELA CORRETA
        const { data, error } = await supabase
          .from('perfil_anunciante')
          .select('*');

        if (!error && data) {
          for (const item of data) {
            if (item && item.id && !seenIds.has(String(item.id))) {
              seenIds.add(String(item.id));
              supaData.push(normalizeAdvertiser(item));
            }
          }
        }
      } catch (dbErr) {
        console.warn('Aviso de rede ao consultar Supabase:', dbErr);
      }

      setRealSupabaseCount(supaData.length);

      // 3. Mesclagem: Anúncios do Supabase + Cache Local + Vitrine de Demonstração
      // Garantir que todos os anúncios reais do banco apareçam na vitrine pública
      const combinedMap = new Map<string, PerfilAnunciante>();
      supaData.forEach((item) => combinedMap.set(String(item.id), item));
      localSaved.forEach((item) => {
        if (!combinedMap.has(String(item.id))) {
          combinedMap.set(String(item.id), item);
        }
      });

      const mergedReal = Array.from(combinedMap.values());

      if (mergedReal.length > 0) {
        // Exibir anúncios reais primeiro, complementados com os de demonstração para catálogo rico
        const finalAdvertisers = [
          ...mergedReal,
          ...DEMO_ADVERTISERS.filter((d) => !combinedMap.has(String(d.id))),
        ];
        setAdvertisers(finalAdvertisers);
        setUseDemoData(false);
      } else {
        setAdvertisers(DEMO_ADVERTISERS);
        setUseDemoData(true);
      }
    } catch (err: unknown) {
      console.error('Erro inesperado ao carregar vitrine:', err);
      try {
        const raw = localStorage.getItem('klikki_saved_advertisers');
        if (raw) {
          const localSaved: PerfilAnunciante[] = JSON.parse(raw);
          setAdvertisers([...localSaved, ...DEMO_ADVERTISERS]);
        } else {
          setAdvertisers(DEMO_ADVERTISERS);
        }
      } catch {
        setAdvertisers(DEMO_ADVERTISERS);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertisers();

    // Listen for real-time newly created advertisers from funnel
    const handleNewAdvertiser = (e: Event) => {
      const customEvent = e as CustomEvent<PerfilAnunciante>;
      if (customEvent.detail) {
        setAdvertisers((prev) => {
          const filtered = prev.filter((p) => String(p.id) !== String(customEvent.detail.id));
          return [customEvent.detail, ...filtered];
        });
        setUseDemoData(false);
      }
    };

    window.addEventListener('klikki:new_advertiser', handleNewAdvertiser);
    return () => {
      window.removeEventListener('klikki:new_advertiser', handleNewAdvertiser);
    };
  }, []);

  const handleFavoriteClick = async (anuncianteId: string | number) => {
    const res = await toggleFavorite(anuncianteId);
    if (res === 'unauthenticated') {
      onOpenAuth();
    }
  };

  // Determine active source: either real Supabase or demo data
  const dataSource =
    useDemoData || (advertisers.length === 0 && !isLoading && !errorMessage)
      ? DEMO_ADVERTISERS
      : advertisers;

  // Filter if user searched or picked category
  const filtered = dataSource.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.nome?.toLowerCase().includes(q) ||
      item.nome_comercial?.toLowerCase().includes(q) ||
      item.titulo?.toLowerCase().includes(q) ||
      item.descricao?.toLowerCase().includes(q) ||
      item.categoria?.toLowerCase().includes(q);

    const matchesCategory =
      !categoryFilter ||
      item.categoria?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <section id="advertisers-feed-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Vitrines & Profissionais Locais
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {filtered.length} {filtered.length === 1 ? 'anúncio' : 'anúncios'}
            </span>
            {advertisers.length === 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                Modo Demonstração (Planos Diamante, Ouro e Grátis)
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Explore estabelecimentos comerciais e prestadores de serviços. Clique no card para ver o perfil completo.
          </p>
        </div>

        {/* Supabase Status / Refresh & Demo Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <div
            id="supabase-status-badge"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200"
            title="Consulta global e pública ao Supabase (RLS SELECT ativo para todos os usuários)"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase:</span>
            {isLoading ? (
              <span className="text-amber-600 font-semibold">Consultando...</span>
            ) : errorMessage ? (
              <span className="text-red-500 font-semibold">Aviso</span>
            ) : realSupabaseCount > 0 ? (
              <span className="text-emerald-700 font-semibold">
                {realSupabaseCount} {realSupabaseCount === 1 ? 'anúncio no banco' : 'anúncios no banco'}
              </span>
            ) : (
              <span className="text-slate-600 font-medium">0 remotos (vitrine ativa)</span>
            )}
          </div>

          <button
            id="btn-ver-exemplo-perfil"
            type="button"
            onClick={() => onSelectAdvertiser(DEMO_ADVERTISERS[0])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg shadow-2xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-orange-600" />
            <span>Ver exemplo de Perfil Público</span>
          </button>

          <button
            id="btn-refresh-feed"
            type="button"
            onClick={fetchAdvertisers}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            title="Recarregar do Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-500' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div id="feed-loading-skeleton" className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs animate-pulse flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-200 rounded-md w-1/2" />
                </div>
              </div>
              <div className="h-12 bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-200 rounded-md w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Database Notice if RLS / Warning */}
      {!isLoading && errorMessage && (
        <div
          id="supabase-error-alert"
          className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-950">Aviso sobre a consulta Supabase</h4>
            <p className="mt-0.5 text-amber-800">{errorMessage}</p>
            <p className="mt-1 text-xs text-amber-700">
              Exibindo dados demonstrativos dos planos (Diamante, Ouro e Grátis) para teste imediato de navegação e favoritos.
            </p>
          </div>
        </div>
      )}

      {/* Cards list */}
      {!isLoading && filtered.length > 0 && (
        <div
          id="advertisers-grid"
          className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((item) => {
            const displayName =
              item.nome_comercial || item.nome || item.titulo || 'Anunciante Klikki';
            const category = item.categoria || 'Geral';
            const categoryDisplay =
              item.subcategoria && item.subcategoria !== item.categoria
                ? `${category} • ${item.subcategoria}`
                : category;
            const location =
              [item.logradouro, item.numero ? `Nº ${item.numero}` : '', item.bairro, item.cidade]
                .filter(Boolean)
                .join(' - ') ||
              [item.bairro, item.cidade].filter(Boolean).join(' - ') ||
              item.cidade ||
              'Atende na região';

            const isDiamond = item.plano_atual === 'diamante';
            const isGold = item.plano_atual === 'ouro';
            const favorited = isFavorite(item.id);

            return (
              <div
                key={item.id}
                id={`advertiser-card-${item.id}`}
                onClick={() => onSelectAdvertiser(item)}
                className={`group relative bg-white rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  isDiamond
                    ? 'border-orange-300 hover:border-orange-500 ring-1 ring-orange-200/70'
                    : isGold
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Highlight badge & Favorite Heart button */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isDiamond && (
                        <span
                          id={`badge-card-diamante-${item.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-200/90 shadow-2xs"
                        >
                          <Sparkles className="w-3 h-3 text-orange-500 fill-orange-500" />
                          <span>Destaque Diamante</span>
                        </span>
                      )}

                      {isGold && (
                        <span
                          id={`badge-card-ouro-${item.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs"
                        >
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Destaque</span>
                        </span>
                      )}

                      {!isDiamond && !isGold && (
                        <span className="text-[11px] font-medium text-slate-400 truncate max-w-[220px]">
                          {categoryDisplay}
                        </span>
                      )}
                    </div>

                    {/* Botão de Favoritar (ícone de coração) */}
                    <button
                      type="button"
                      id={`btn-favorito-${item.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavoriteClick(item.id);
                      }}
                      title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                      aria-label="Favoritar anunciante"
                      className={`p-2 rounded-xl border transition-all ${
                        favorited
                          ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-200'
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform active:scale-125 ${
                          favorited ? 'fill-rose-500 text-rose-500' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Card Header Info */}
                  <div className="flex items-start gap-3">
                    {item.logo_url || item.foto_url ? (
                      <img
                        src={item.logo_url || item.foto_url}
                        alt={displayName}
                        referrerPolicy="no-referrer"
                        className="w-13 h-13 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-lg shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 leading-snug group-hover:text-orange-600 transition-colors truncate">
                        {displayName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-slate-500 truncate">
                          {categoryDisplay}
                        </span>
                        {item.avaliacao ? (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{item.avaliacao.toFixed(1)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {item.descricao && (
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-3 leading-relaxed">
                      {item.descricao}
                    </p>
                  )}

                  {/* Location info */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-orange-600 group-hover:text-orange-700 inline-flex items-center gap-1">
                    <span>Ver perfil público</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>

                  {isDiamond && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200/80">
                      <MessageCircle className="w-3 h-3 text-emerald-600" />
                      <span>WhatsApp Liberado</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty Filter State */}
      {!isLoading && filtered.length === 0 && (
        <div
          id="empty-filter-state"
          className="mt-8 bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md mx-auto"
        >
          <Store className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">
            Nenhum anúncio encontrado para esta busca
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tente buscar por outro termo ou limpar os filtros de categoria.
          </p>
        </div>
      )}
    </section>
  );
};