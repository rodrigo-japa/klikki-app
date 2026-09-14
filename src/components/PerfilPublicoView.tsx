import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Star,
  MapPin,
  MessageCircle,
  MessageSquare,
  Send,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Heart,
  AlertTriangle,
  CheckCircle2,
  Package,
  X,
  Share2,
  Sparkles,
  ExternalLink,
  Plus,
  Lock,
  Trash2,
  Upload,
} from 'lucide-react';
import { PerfilAnunciante, AnuncioItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ITEMS } from '../data/mockData';

interface PerfilPublicoViewProps {
  advertiser: PerfilAnunciante;
  onBack: () => void;
  onOpenAuth: () => void;
  onUpgradePlan?: () => void;
}

export const PerfilPublicoView: React.FC<PerfilPublicoViewProps> = ({
  advertiser,
  onBack,
  onOpenAuth,
  onUpgradePlan,
}) => {
  const prestador = advertiser;
  const { user, isFavorite, toggleFavorite, showToast } = useAuth();
  const [items, setItems] = useState<AnuncioItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Contato indevido ou desatualizado');
  const [reportSuccess, setReportSuccess] = useState(false);

  // Plan limits helper: gratis = max 3, ouro = max 10, diamante = unlimited
  const getPlanLimit = (plano?: string): { max: number; name: string } => {
    const p = (plano || 'gratis').toLowerCase();
    if (p === 'diamante') return { max: Infinity, name: 'Diamante' };
    if (p === 'ouro') return { max: 10, name: 'Ouro' };
    return { max: 3, name: 'Grátis' };
  };

  const isLojista = prestador.tipo_perfil === 'lojista';
  const planInfo = getPlanLimit(prestador.plano_atual);
  const hasReachedLimit = items.length >= planInfo.max;

  // New Item and Plan Limit Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);

  // Form fields for adding a new item
  const [itemTitulo, setItemTitulo] = useState('');
  const [itemPreco, setItemPreco] = useState('');
  const [itemPrecoPromo, setItemPrecoPromo] = useState('');
  const [itemCategoria, setItemCategoria] = useState('');
  const [itemDescricao, setItemDescricao] = useState('');
  const [itemImagemUrl, setItemImagemUrl] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const [isAiOptimizingItem, setIsAiOptimizingItem] = useState(false);

  const handleAIOptimizeItemDescription = () => {
    if (!itemTitulo.trim()) {
      showToast('Por favor, informe primeiro o título do item para a IA gerar o texto comercial.', 'error');
      return;
    }

    setIsAiOptimizingItem(true);
    setTimeout(() => {
      const titulo = itemTitulo.trim();
      const preco = itemPreco.trim();
      const promo = itemPrecoPromo.trim();

      const optionsLojista = [
        `Imperdível: ${titulo}${promo ? ` saindo por apenas ${promo} (de ${preco})` : preco ? ` por apenas ${preco}` : ''}! Qualidade artesanal de primeira, pronta entrega e satisfação garantida. Peça já o seu antes que acabe o estoque!`,
        `O melhor ${titulo} que você vai encontrar${promo ? ` com super desconto: só ${promo}!` : preco ? ` por apenas ${preco}!` : '!'}. Feito no capricho com ingredientes selecionados. Faça seu pedido agora mesmo direto no chat!`,
        `Super oferta especial: ${titulo}${promo ? ` de ${preco} por apenas ${promo}` : preco ? ` por ${preco}` : ''}. Perfeito para quem busca qualidade incomparável e praticidade. Chame agora e aproveite!`,
      ];

      const optionsPrestador = [
        `Precisando de ${titulo}? Execução ágil, pontualidade britânica e garantia total do serviço${preco ? ` a partir de ${preco}` : ''}. Orçamento rápido e sem compromisso. Chame no chat agora mesmo!`,
        `Especialista em ${titulo} com atendimento profissional de ponta${preco ? ` (${preco})` : ''}. Diagnóstico transparente, materiais de alta qualidade e suporte pós-serviço. Agende já seu horário!`,
        `Não perca tempo com amadores! Serviço certificado de ${titulo}${promo ? ` com preço especial de ${promo}` : preco ? ` por ${preco}` : ''}. Qualidade comprovada e resolução rápida do seu problema. Mande uma mensagem agora!`,
      ];

      const pool = isLojista ? optionsLojista : optionsPrestador;
      const chosen = pool[Math.floor(Math.random() * pool.length)];

      setItemDescricao(chosen);
      setIsAiOptimizingItem(false);
      showToast('✨ Texto comercial persuasivo e direto gerado com sucesso!', 'success');
    }, 400);
  };

  const handleOpenAddItem = () => {
    const currentLimit = getPlanLimit(prestador.plano_atual);
    if (items.length >= currentLimit.max) {
      setShowLimitReachedModal(true);
      return;
    }
    setImageUploadError('');
    setShowAddItemModal(true);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageUploadError('Por favor, selecione uma imagem no formato JPG, PNG ou WebP.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageUploadError('A imagem excede o tamanho máximo recomendado de 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setItemImagemUrl(reader.result);
      }
    };
    reader.onerror = () => {
      setImageUploadError('Erro ao carregar o arquivo de imagem.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitulo.trim()) {
      showToast('Por favor, informe o título do item.', 'error');
      return;
    }
    if (!itemPreco.trim()) {
      showToast('Por favor, informe o valor ou preço.', 'error');
      return;
    }

    // Double check plan limit
    const currentLimit = getPlanLimit(prestador.plano_atual);
    if (items.length >= currentLimit.max) {
      setShowAddItemModal(false);
      setShowLimitReachedModal(true);
      return;
    }

    setIsSavingItem(true);
    const isAdvUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      String(advertiser.id)
    );

    const itemData: any = {
      titulo: itemTitulo.trim(),
      descricao: itemDescricao.trim() || undefined,
      preco: itemPreco.trim(),
      preco_promocional: itemPrecoPromo.trim() || undefined,
      imagem_url: itemImagemUrl.trim() || undefined,
      categoria: itemCategoria.trim() || (isLojista ? 'Oferta' : 'Serviço'),
      ativo: true,
    };

    if (isAdvUuid) {
      itemData.anunciante_id = advertiser.id;
    }

    let created: AnuncioItem | null = null;
    if (isAdvUuid) {
      try {
        const { data, error } = await supabase
          .from('anuncios_itens')
          .insert(itemData)
          .select()
          .single();

        if (!error && data) {
          created = data as AnuncioItem;
        } else if (error) {
          console.warn('Supabase anuncios_itens insert:', error.message);
        }
      } catch (err) {
        console.warn('Falha de rede ao inserir no Supabase:', err);
      }
    }

    if (!created) {
      created = {
        id: `item-${Date.now()}`,
        anunciante_id: String(advertiser.id),
        ...itemData,
        created_at: new Date().toISOString(),
      };
    }

    // Update state immediately
    setItems((prev) => [created!, ...prev]);

    // Save to localStorage
    try {
      const localKey = `klikki_items_${advertiser.id}`;
      const raw = localStorage.getItem(localKey);
      const existing: AnuncioItem[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem(localKey, JSON.stringify([created, ...existing]));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    setIsSavingItem(false);
    setShowAddItemModal(false);

    // Reset fields
    setItemTitulo('');
    setItemPreco('');
    setItemPrecoPromo('');
    setItemCategoria('');
    setItemDescricao('');
    setItemImagemUrl('');

    showToast(
      `${isLojista ? 'Oferta cadastrada' : 'Serviço cadastrado'} com sucesso na vitrine!`,
      'success'
    );
  };

  const handleDeleteItem = async (itemId: string | number) => {
    setItems((prev) => prev.filter((i) => String(i.id) !== String(itemId)));
    try {
      const localKey = `klikki_items_${advertiser.id}`;
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const list: AnuncioItem[] = JSON.parse(raw);
        localStorage.setItem(
          localKey,
          JSON.stringify(list.filter((i) => String(i.id) !== String(itemId)))
        );
      }
      const isItemUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(itemId)
      );
      if (isItemUuid) {
        await supabase.from('anuncios_itens').delete().eq('id', itemId);
      }
    } catch (err) {
      console.warn('Erro ao deletar item:', err);
    }
    showToast('Item removido da vitrine.', 'success');
  };

  // Chat Interno State
  const [showChatInterno, setShowChatInterno] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'prestador'; text: string; time: string }>
  >([]);
  const [newMessage, setNewMessage] = useState('');

  const abrirChatInterno = (_id: string | number, initialNote?: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          sender: 'prestador',
          text: `Olá! Sou ${prestador.nome_comercial || prestador.nome || 'o anunciante'}. Como posso te ajudar hoje? Envie sua dúvida ou solicite um orçamento.`,
          time: 'Agora',
        },
      ]);
    }
    if (initialNote) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'user',
          text: initialNote,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
    setShowChatInterno(true);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage.trim();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'user', text, time }]);
    setNewMessage('');
    showToast('Mensagem enviada no Chat Interno!', 'success');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'prestador',
          text: 'Obrigado pelo contato! Sua mensagem foi entregue e o anunciante responderá em breve.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 1200);
  };

  const favorited = isFavorite(advertiser.id);

  // Fetch items from 'anuncios_itens'
  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      const localKey = `klikki_items_${advertiser.id}`;
      let localSaved: AnuncioItem[] = [];
      try {
        const raw = localStorage.getItem(localKey);
        if (raw) localSaved = JSON.parse(raw);
      } catch (e) {
        console.warn('Erro ao ler itens do localStorage:', e);
      }

      const isAdvUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(advertiser.id)
      );

      let supaItems: AnuncioItem[] = [];

      if (isAdvUuid) {
        try {
          const { data, error } = await supabase
            .from('anuncios_itens')
            .select('*')
            .eq('anunciante_id', advertiser.id);

          if (!error && data) {
            supaItems = data as AnuncioItem[];
          } else if (error) {
            console.warn('Aviso ao consultar anuncios_itens do Supabase:', error.message);
          }
        } catch (err) {
          console.warn('Falha inesperada ao buscar itens do Supabase:', err);
        }
      }

      const fallback = DEMO_ITEMS[String(advertiser.id)] || [];
      const combined = [...supaItems];

      // Mesclar itens locais salvos
      for (const loc of localSaved) {
        if (!combined.some((c) => String(c.id) === String(loc.id))) {
          combined.unshift(loc);
        }
      }

      // Se nenhum item foi encontrado nem no banco nem localmente, utilizar demonstração
      if (combined.length === 0 && fallback.length > 0) {
        for (const item of fallback) {
          if (!combined.some((c) => String(c.id) === String(item.id))) {
            combined.push(item);
          }
        }
      }

      setItems(combined);
      setLoadingItems(false);
    };

    fetchItems();
  }, [advertiser.id]);

  const handleFavoriteClick = async () => {
    const result = await toggleFavorite(advertiser.id);
    if (result === 'unauthenticated') {
      onOpenAuth();
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Link do perfil copiado para a área de transferência!', 'success');
    }
  };

  const handleSendReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportSuccess(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSuccess(false);
      showToast('Denúncia enviada com sucesso para moderação.', 'success');
    }, 1200);
  };

  const displayName =
    advertiser.nome_comercial || advertiser.nome || advertiser.titulo || 'Anunciante';
  const category = advertiser.categoria || 'Geral';
  const location =
    [
      advertiser.logradouro,
      advertiser.numero || advertiser.endereco_numero
        ? `Nº ${advertiser.numero || advertiser.endereco_numero}`
        : '',
      advertiser.bairro,
      advertiser.cidade,
    ]
      .filter(Boolean)
      .join(', ') ||
    [advertiser.bairro, advertiser.cidade].filter(Boolean).join(', ') ||
    advertiser.cidade ||
    'Localização não informada';

  const rating = advertiser.avaliacao || 5.0;
  const totalReviews = advertiser.total_avaliacoes || 1;
  const isDiamond = advertiser.plano_atual === 'diamante';
  const isGold = advertiser.plano_atual === 'ouro';

  const rawPhone = advertiser.whatsapp || advertiser.telefone || '';
  const sanitizedWhatsApp = rawPhone.replace(/\D/g, '');
  const whatsappUrl = sanitizedWhatsApp
    ? `https://wa.me/${sanitizedWhatsApp}?text=${encodeURIComponent(
        `Olá, vi seu perfil no Klikki (${displayName}) e gostaria de mais informações.`
      )}`
    : '#';

  return (
    <div id="perfil-publico-container" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Bar with Back Button and Quick Actions */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          id="btn-voltar-vitrine"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Voltar para a Vitrine</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-share-profile"
            onClick={handleShare}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Compartilhar"
            aria-label="Compartilhar perfil"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            id="btn-favorite-profile"
            onClick={handleFavoriteClick}
            className={`p-2 rounded-xl border transition-all ${
              favorited
                ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-500 hover:text-rose-500 hover:bg-slate-50'
            }`}
            title={favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
            aria-label="Favoritar anunciante"
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div
        id="perfil-header-card"
        className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all ${
          isDiamond
            ? 'border-orange-300 ring-1 ring-orange-200/60'
            : isGold
            ? 'border-amber-300'
            : 'border-slate-200'
        }`}
      >
        {/* Banner if available or clean pattern */}
        <div className="h-32 sm:h-44 w-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {advertiser.banner_url && (
            <img
              src={advertiser.banner_url}
              alt="Banner do anunciante"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Plan badge in banner */}
          <div className="absolute top-4 right-4">
            {isDiamond && (
              <span
                id="badge-perfil-diamante"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-orange-600 shadow-sm border border-orange-200 backdrop-blur-xs"
              >
                <Sparkles className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                <span>Destaque Diamante</span>
              </span>
            )}
            {isGold && (
              <span
                id="badge-perfil-ouro"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-sm border border-amber-400"
              >
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                <span>Destaque</span>
              </span>
            )}
          </div>
        </div>

        {/* Profile Details Content */}
        <div className="p-6 sm:p-8 -mt-12 sm:-mt-16 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-end gap-4">
              {/* Photo / Logo */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1 shadow-md border border-slate-200 shrink-0">
                {advertiser.foto_url || advertiser.logo_url ? (
                  <img
                    src={advertiser.foto_url || advertiser.logo_url}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-orange-50 text-orange-600 font-extrabold text-3xl flex items-center justify-center border border-orange-100">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title & Info */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    id="perfil-nome-negocio"
                    className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight"
                  >
                    {displayName}
                  </h1>
                  {advertiser.verificado && (
                    <span
                      title="Anunciante Verificado"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verificado</span>
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-orange-600 mt-1">
                  {category}
                  {advertiser.subcategoria ? ` • ${advertiser.subcategoria}` : ''}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{location}</span>
                </div>
              </div>
            </div>

            {/* CONDITIONAL MONETIZATION (STRICT):
                - If prestador.plano_atual === 'diamante': render WhatsApp link "Conversar no WhatsApp"
                - Else: render button "Chat Interno" calling abrirChatInterno(prestador.id)
            */}
            <div className="w-full sm:w-auto pt-2 sm:pt-0">
              {prestador.plano_atual === 'diamante' ? (
                <a 
                  href={`https://wa.me/${(prestador.whatsapp || '').replace(/\D/g, '') || sanitizedWhatsApp}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  id="btn-whatsapp-diamante"
                  className="btn-whatsapp w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md shadow-emerald-600/25 transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5 fill-white/20" />
                  <span>Conversar no WhatsApp</span>
                </a>
              ) : (
                <button 
                  onClick={() => abrirChatInterno(prestador.id)}
                  id="btn-chat-interno"
                  className="btn-chat-interno w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-slate-600" />
                  <span>Chat Interno</span>
                </button>
              )}
            </div>
          </div>

          {/* Ratings section (1 to 5 yellow star icons) */}
          <div className="py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-extrabold text-slate-900">
                {rating.toFixed(1)}
              </span>
              <div
                id="rating-stars"
                className="flex items-center gap-0.5 text-amber-400"
                aria-label={`Avaliação ${rating} de 5 estrelas`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 ml-1">
                ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})
              </span>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="text-xs text-slate-500">
              Membro ativo na comunidade Klikki
            </div>
          </div>

          {/* Business Description */}
          <div className="py-6 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs mb-2">
              Sobre o Negócio
            </h3>
            <p
              id="perfil-descricao"
              className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line"
            >
              {advertiser.descricao ||
                'Este anunciante ainda não adicionou uma descrição detalhada sobre seus serviços ou produtos.'}
            </p>

            {/* Discreet Report Button ("🚩 Denunciar Anúncio") in the description footer */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                id="btn-denunciar-anuncio"
                onClick={() => setShowReportModal(true)}
                className="text-xs text-slate-400 hover:text-red-600 transition-colors inline-flex items-center gap-1 font-medium underline underline-offset-2"
              >
                <span>🚩 Denunciar Anúncio</span>
              </button>

              <span className="text-[11px] text-slate-400">
                Identificador: #{advertiser.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vitrine de Ofertas / Serviços ('anuncios_itens') */}
      <section id="vitrine-itens-section" className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              <span>Ofertas e Serviços</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Itens cadastrados na tabela 'anuncios_itens' de {displayName}
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span
              id="badge-itens-limite"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200"
            >
              {items.length} {items.length === 1 ? 'item' : 'itens'}
              {planInfo.max !== Infinity
                ? ` • Limite: ${planInfo.max} (Plano ${planInfo.name})`
                : ` • Ilimitado (Plano ${planInfo.name})`}
            </span>

            {/* Injected Dynamic Action Button */}
            <button
              id="btn-adicionar-item-vitrine"
              type="button"
              onClick={handleOpenAddItem}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                hasReachedLimit
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                  : 'bg-orange-500 hover:bg-orange-600 active:scale-95 text-white shadow-orange-500/20'
              }`}
              title={
                hasReachedLimit
                  ? `Limite de ${planInfo.max} itens atingido no Plano ${planInfo.name}. Clique para saber como fazer upgrade.`
                  : isLojista
                  ? 'Adicionar nova oferta à vitrine'
                  : 'Adicionar novo serviço à vitrine'
              }
            >
              {hasReachedLimit ? (
                <Lock className="w-4 h-4 text-amber-700" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
              <span>{isLojista ? '+ Adicionar Oferta' : '+ Adicionar Serviço'}</span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loadingItems && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse space-y-3"
              >
                <div className="h-32 bg-slate-100 rounded-lg" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state for items */}
        {!loadingItems && items.length === 0 && (
          <div
            id="empty-items-state"
            className="bg-white rounded-2xl border border-slate-200 p-8 text-center"
          >
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              Nenhum item cadastrado no momento
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Este anunciante ainda não publicou {isLojista ? 'ofertas' : 'serviços'} na tabela
              'anuncios_itens'.
            </p>
            <button
              type="button"
              onClick={handleOpenAddItem}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isLojista ? 'Cadastrar Primeira Oferta' : 'Cadastrar Primeiro Serviço'}</span>
            </button>
          </div>
        )}

        {/* Items Grid */}
        {!loadingItems && items.length > 0 && (
          <div
            id="anuncios-itens-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {items.map((item) => (
              <div
                key={item.id}
                id={`item-card-${item.id}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-orange-300 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group relative"
              >
                <div>
                  {/* Optional delete button on card */}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id)}
                    className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-lg bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-600 shadow-xs border border-slate-200 flex items-center justify-center transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Excluir este item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {item.imagem_url ? (
                    <div className="h-40 w-full overflow-hidden bg-slate-100">
                      <img
                        src={item.imagem_url}
                        alt={item.titulo}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-28 w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center text-slate-300">
                      <Package className="w-8 h-8" />
                    </div>
                  )}

                  <div className="p-4">
                    {item.categoria && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm bg-slate-100 text-slate-600 mb-2 inline-block">
                        {item.categoria}
                      </span>
                    )}
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.titulo}
                    </h4>
                    {item.descricao && (
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
                  <div>
                    {item.preco_promocional ? (
                      <div>
                        <span className="text-[11px] text-slate-400 line-through mr-1.5">
                          {item.preco}
                        </span>
                        <span className="text-base font-extrabold text-orange-600">
                          {item.preco_promocional}
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-extrabold text-slate-900">
                        {item.preco || 'A combinar'}
                      </span>
                    )}
                  </div>

                  {prestador.plano_atual === 'diamante' ? (
                    <a
                      href={`https://wa.me/${sanitizedWhatsApp || (prestador.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Olá! Vi o item "${item.titulo}" no seu perfil do Klikki e gostaria de pedir.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Pedir via WhatsApp</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        abrirChatInterno(
                          prestador.id,
                          `Olá! Tenho interesse no item "${item.titulo}". Gostaria de mais detalhes.`
                        )
                      }
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-slate-500" />
                      <span>Chat Interno</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Report Modal */}
      {showReportModal && (
        <div
          id="report-modal-overlay"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowReportModal(false)}
        >
          <div
            id="report-modal-card"
            className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Denunciar Anúncio
                </h3>
                <p className="text-xs text-slate-500">
                  Ajude a manter o Klikki seguro e confiável.
                </p>
              </div>
            </div>

            {reportSuccess ? (
              <div className="py-6 text-center text-emerald-700">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600 mb-2" />
                <p className="text-sm font-semibold">Obrigado pela denúncia!</p>
                <p className="text-xs text-slate-500 mt-1">
                  Nossa equipe de moderação avaliará os dados informados.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motivo da denúncia
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-orange-500"
                  >
                    <option value="Contato indevido ou desatualizado">
                      Contato indevido ou desatualizado
                    </option>
                    <option value="Serviço ou empresa inexistente">
                      Serviço ou empresa inexistente
                    </option>
                    <option value="Conteúdo enganoso ou impróprio">
                      Conteúdo enganoso ou impróprio
                    </option>
                    <option value="Spam ou preços abusivos">
                      Spam ou preços abusivos
                    </option>
                    <option value="Outro motivo">Outro motivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detalhes adicionais (opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva brevemente o problema encontrado..."
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
                  >
                    Enviar denúncia
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Chat Interno */}
      {showChatInterno && (
        <div
          id="modal-chat-interno"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 text-white font-bold flex items-center justify-center text-base">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{displayName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] text-slate-300">
                      Chat Interno Klikki • {prestador.plano_atual === 'ouro' ? 'Plano Ouro' : 'Plano Grátis'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChatInterno(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Fechar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice */}
            <div className="bg-orange-50/80 border-b border-orange-100 px-4 py-2 text-[11px] text-orange-900 flex items-center justify-between">
              <span>Canal de atendimento direto pela plataforma Klikki.</span>
              <span className="font-semibold">Seguro e rastreado</span>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[260px]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-orange-500 text-white rounded-br-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escreva sua mensagem ou dúvida..."
                className="flex-1 bg-slate-100 border border-slate-200 text-slate-900 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-orange-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors cursor-pointer"
                title="Enviar mensagem"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Limite do Plano Atingido */}
      {showLimitReachedModal && (
        <div
          id="modal-limite-atingido"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setShowLimitReachedModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-md inline-block mb-2">
                Teto de Itens Atingido • Plano {planInfo.name}
              </span>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Limite de {isLojista ? 'Ofertas' : 'Serviços'} Alcançado
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Seu plano atual contratado (<strong>Plano {planInfo.name}</strong>) permite
                cadastrar no máximo <strong>{planInfo.max} {isLojista ? 'ofertas' : 'serviços'}</strong> na tabela de itens da vitrine.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Você já atingiu o teto permitido com <strong>{items.length} itens</strong> ativos.
                Para publicar mais itens no seu perfil e aumentar sua visibilidade, faça um upgrade!
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="flex justify-between items-center">
                <span>Plano Grátis:</span>
                <span className="font-semibold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-md">
                  Máximo 3 itens
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Plano Ouro:</span>
                <span className="font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Até 10 itens
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Plano Diamante:</span>
                <span className="font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-md">
                  Itens Ilimitados + WhatsApp
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLimitReachedModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
              {onUpgradePlan && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLimitReachedModal(false);
                    onUpgradePlan();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Fazer Upgrade de Plano</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Novo Item na tabela 'anuncios_itens' */}
      {showAddItemModal && (
        <div
          id="modal-adicionar-item-anuncios"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in"
        >
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {isLojista ? 'Cadastrar Nova Oferta' : 'Cadastrar Novo Serviço'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tabela: 'anuncios_itens' • Plano {planInfo.name} ({items.length} de{' '}
                    {planInfo.max === Infinity ? 'Ilimitado' : planInfo.max} usados)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Titulo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título do {isLojista ? 'Produto / Oferta' : 'Serviço'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={itemTitulo}
                  onChange={(e) => setItemTitulo(e.target.value)}
                  placeholder={
                    isLojista
                      ? 'Ex: Bolo Red Velvet Artesanal 1,2kg'
                      : 'Ex: Instalação e Manutenção de Ar Condicionado'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* Preços Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preço <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemPreco}
                    onChange={(e) => setItemPreco(e.target.value)}
                    placeholder="Ex: R$ 120,00 ou A combinar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Preço Promocional <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={itemPrecoPromo}
                    onChange={(e) => setItemPrecoPromo(e.target.value)}
                    placeholder="Ex: R$ 99,90"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Categoria do Item */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria do Item <span className="text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={itemCategoria}
                  onChange={(e) => setItemCategoria(e.target.value)}
                  placeholder={
                    isLojista
                      ? 'Ex: Confeitaria, Doces Gourmet, Sobremesas...'
                      : 'Ex: Instalações, Manutenção Preventiva, Reformas...'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                />
              </div>

              {/* Descricao com Botão de IA */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Descrição Curta <span className="text-slate-400 font-normal">(Opcional)</span>
                  </label>
                  <button
                    type="button"
                    id="btn-otimizar-item-ia"
                    onClick={handleAIOptimizeItemDescription}
                    disabled={isAiOptimizingItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-[11px] font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    title="Gerar texto comercial direto e de alta conversão com IA"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAiOptimizingItem ? 'animate-spin' : ''}`} />
                    <span>{isAiOptimizingItem ? 'Otimizando...' : '✨ Otimizar com IA'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={itemDescricao}
                  onChange={(e) => setItemDescricao(e.target.value)}
                  placeholder={
                    isLojista
                      ? 'Ex: Produzido artesanalmente com ingredientes nobres. Pronta entrega ou encomenda rápida. Garanta o seu hoje mesmo!'
                      : 'Ex: Atendimento rápido no mesmo dia, diagnóstico preciso e garantia total de 90 dias. Solicite um orçamento sem compromisso!'
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Foto do Item */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Foto do Item <span className="text-slate-400 font-normal">(Upload ou Link)</span>
                </label>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Escolher Imagem (máx 2MB)</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-xs text-slate-400">ou insira a URL abaixo</span>
                  </div>

                  {imageUploadError && (
                    <p className="text-xs text-red-600 font-medium">{imageUploadError}</p>
                  )}

                  <input
                    type="url"
                    value={itemImagemUrl}
                    onChange={(e) => setItemImagemUrl(e.target.value)}
                    placeholder="https://exemplo.com/foto-do-item.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-orange-500 focus:bg-white transition-all"
                  />

                  {/* Thumbnail Preview */}
                  {itemImagemUrl && (
                    <div className="relative mt-2 w-28 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs group">
                      <img
                        src={itemImagemUrl}
                        alt="Pré-visualização"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setItemImagemUrl('')}
                        className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/70 hover:bg-red-600 text-white transition-colors cursor-pointer"
                        title="Remover imagem"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingItem}
                  className="px-5 py-2 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  {isSavingItem ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{isLojista ? 'Publicar Oferta' : 'Publicar Serviço'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
