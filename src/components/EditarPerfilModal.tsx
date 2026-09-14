import React, { useState } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Package,
  DollarSign,
  Camera,
  Layers,
  FileText,
} from 'lucide-react';
import { PerfilAnunciante, AnuncioItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_ITEMS } from '../data/mockData';
import { supabase } from '../lib/supabase';

interface EditarPerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PerfilAnunciante;
  onSaveProfile: (updatedProfile: PerfilAnunciante, updatedItems: AnuncioItem[]) => void;
  initialItems?: AnuncioItem[];
}

const PRESET_BANNERS = [
  {
    label: 'Oficina & Técnico',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Loja & Vitrine',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Gastronomia & Café',
    url: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Ambiente Profissional',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    label: 'Construção & Reformas',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
  },
];

const PRESET_LOGOS = [
  {
    label: 'Serviços Técnicos',
    url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Comércio / Vendas',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Gastronomia Artesanal',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Beleza & Estética',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
  },
];

export const EditarPerfilModal: React.FC<EditarPerfilModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  initialItems,
}) => {
  const { showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'imagens' | 'descricao' | 'ofertas'>('imagens');

  // Form states
  const [bannerUrl, setBannerUrl] = useState<string>(profile.banner_url || PRESET_BANNERS[0].url);
  const [fotoUrl, setFotoUrl] = useState<string>(profile.foto_url || profile.logo_url || PRESET_LOGOS[0].url);
  const [descricao, setDescricao] = useState<string>(profile.descricao || '');
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Items / Ofertas State
  const [items, setItems] = useState<AnuncioItem[]>(() => {
    if (initialItems && initialItems.length > 0) return initialItems;
    if (DEMO_ITEMS[String(profile.id)]) return [...DEMO_ITEMS[String(profile.id)]];
    return [
      {
        id: `item-${Date.now()}-1`,
        anunciante_id: profile.id,
        titulo: `${profile.categoria || 'Serviço Principal'} em Destaque`,
        descricao: 'Atendimento qualificado com pontualidade e orçamento transparente.',
        preco: 'A combinar',
        categoria: profile.categoria || 'Geral',
        ativo: true,
      },
    ];
  });

  // Item inclusion/editing state
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemTitulo, setItemTitulo] = useState('');
  const [itemPreco, setItemPreco] = useState('');
  const [itemPrecoPromocional, setItemPrecoPromocional] = useState('');
  const [itemDescricao, setItemDescricao] = useState('');
  const [itemImagemUrl, setItemImagemUrl] = useState('');

  if (!isOpen) return null;

  // File upload helper for Banner
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem de capa deve ter no máximo 5MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setBannerUrl(res);
        showToast('Imagem de capa carregada!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // File upload helper for Logo
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      showToast('O logo deve ter no máximo 4MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setFotoUrl(res);
        showToast('Logo atualizado com sucesso!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Description Optimization
  const handleOptimizeDescription = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const businessName = profile.nome_comercial || profile.nome || 'Nosso Estabelecimento';
      const category = profile.categoria || 'Serviços Especializados';
      const subcat = profile.subcategoria ? ` com foco em ${profile.subcategoria}` : '';
      const local = [profile.bairro, profile.cidade].filter(Boolean).join(', ') || 'sua região';

      const generatedCopy = `Somos especialistas em ${category}${subcat}, atendendo com excelência em ${local} e proximidades.\n\nNosso compromisso é entregar soluções de alto padrão com agilidade, transparência e atendimento 100% humanizado. Trabalhamos com materiais e técnicas de primeira linha, garantindo a sua total satisfação em cada detalhe.\n\nConte com ${businessName} para um serviço seguro, pontual e confiável. Solicite um orçamento sem compromisso!`;

      setDescricao(generatedCopy);
      setIsAiGenerating(false);
      showToast('Descrição otimizada com sucesso pela IA do Klikki!', 'success');
    }, 900);
  };

  // Item Management Handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitulo.trim()) {
      showToast('Informe o título da oferta ou serviço.', 'error');
      return;
    }

    const newItem: AnuncioItem = {
      id: `item-${Date.now()}`,
      anunciante_id: profile.id,
      titulo: itemTitulo.trim(),
      descricao: itemDescricao.trim() || undefined,
      preco: itemPreco.trim() || 'A combinar',
      preco_promocional: itemPrecoPromocional.trim() || undefined,
      imagem_url: itemImagemUrl.trim() || undefined,
      categoria: profile.categoria || 'Geral',
      ativo: true,
    };

    setItems((prev) => [newItem, ...prev]);
    setItemTitulo('');
    setItemPreco('');
    setItemPrecoPromocional('');
    setItemDescricao('');
    setItemImagemUrl('');
    setShowItemForm(false);
    showToast('Oferta adicionada com sucesso!', 'success');
  };

  const handleDeleteItem = (itemId: string | number) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    showToast('Oferta removida.', 'success');
  };

  // Save All Changes
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updatedProfile: PerfilAnunciante = {
        ...profile,
        banner_url: bannerUrl,
        foto_url: fotoUrl,
        logo_url: fotoUrl,
        descricao: descricao.trim(),
      };

      // Keep local mock cache updated
      DEMO_ITEMS[String(profile.id)] = items;

      // Atualizar no localStorage caso seja perfil salvo localmente
      try {
        const rawSaved = localStorage.getItem('klikki_saved_advertisers');
        if (rawSaved) {
          const list: PerfilAnunciante[] = JSON.parse(rawSaved);
          const updatedList = list.map((p) =>
            String(p.id) === String(profile.id) ? updatedProfile : p
          );
          localStorage.setItem('klikki_saved_advertisers', JSON.stringify(updatedList));
        }
      } catch (storageErr) {
        console.warn('Erro ao atualizar cache local do perfil:', storageErr);
      }

      // Atualizar no Supabase se for UUID válido (apenas o dono com auth.uid() permitido via RLS)
      const isProfileUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        String(profile.id)
      );

      if (isProfileUuid) {
        try {
          const updatePayload = {
            banner_url: bannerUrl,
            foto_url: fotoUrl,
            logo_url: fotoUrl,
            descricao: descricao.trim(),
            updated_at: new Date().toISOString(),
          };

          const resPlural = await supabase
            .from('perfis_anunciantes')
            .update(updatePayload)
            .eq('id', profile.id);

          if (resPlural.error) {
            await supabase
              .from('perfil_anunciante')
              .update(updatePayload)
              .eq('id', profile.id);
          }
        } catch (err) {
          console.warn('Aviso ao sincronizar edição com Supabase:', err);
        }
      }

      onSaveProfile(updatedProfile, items);
      showToast('Perfil público e ofertas atualizados com sucesso!', 'success');
      onClose();
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar alterações do perfil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="modal-editar-perfil-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="modal-editar-perfil-card"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                Editar meu Perfil Público
              </h3>
              <p className="text-xs text-slate-500">
                {profile.nome_comercial || profile.nome || 'Gerenciamento do Anúncio'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('imagens')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'imagens'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Capa & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('descricao')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'descricao'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Descrição do Negócio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ofertas')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'ofertas'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Ofertas & Serviços ({items.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* TAB 1: IMAGENS (CAPA & LOGO) */}
          {activeTab === 'imagens' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Seção Imagem de Capa (Banner) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Imagem de Capa (Banner)
                </label>
                <div className="relative h-36 sm:h-44 w-full rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 group">
                  <img
                    src={bannerUrl}
                    alt="Banner de Capa"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 hover:bg-white text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-102">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Fazer Upload de Nova Capa</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Presets de Capa */}
                <div className="mt-3">
                  <p className="text-[11px] text-slate-500 mb-1.5 font-medium">
                    Ou escolha uma capa pré-selecionada:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_BANNERS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setBannerUrl(preset.url)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          bannerUrl === preset.url
                            ? 'bg-orange-50 border-orange-400 text-orange-700 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seção Logo / Foto de Perfil */}
              <div className="pt-4 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Logo ou Foto do Estabelecimento
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 overflow-hidden shrink-0 shadow-sm bg-white p-0.5">
                    <img
                      src={fotoUrl}
                      alt="Logo do Negócio"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Enviar Imagem do Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Recomendado: imagem quadrada (JPG ou PNG) de até 4MB.
                    </p>
                  </div>
                </div>

                {/* Presets de Logo */}
                <div className="mt-3">
                  <p className="text-[11px] text-slate-500 mb-1.5 font-medium">
                    Ou selecione um ícone de identidade visual:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_LOGOS.map((logo) => (
                      <button
                        key={logo.label}
                        type="button"
                        onClick={() => setFotoUrl(logo.url)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          fotoUrl === logo.url
                            ? 'bg-orange-50 border-orange-400 text-orange-700 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {logo.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DESCRIÇÃO DO NEGÓCIO */}
          {activeTab === 'descricao' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Apresentação Comercial & Diferenciais
                  </h4>
                  <p className="text-xs text-slate-500">
                    Mantenha o foco em qualidade, garantia e diferenciais de atendimento.
                  </p>
                </div>

                {/* Botão Otimizar com IA */}
                <button
                  type="button"
                  onClick={handleOptimizeDescription}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAiGenerating ? 'Gerando com IA...' : '✨ Otimizar com IA'}</span>
                </button>
              </div>

              <textarea
                rows={6}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Apresente sua experiência, diferenciais e especialidades..."
                className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-900 leading-relaxed outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Dica: Não divulgue links ou telefones externos no texto livre.</span>
                <span>{descricao.length} caracteres</span>
              </div>
            </div>
          )}

          {/* TAB 3: GERENCIAMENTO DE OFERTAS & SERVIÇOS */}
          {activeTab === 'ofertas' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Ofertas Ativas na sua Vitrine
                  </h4>
                  <p className="text-xs text-slate-500">
                    Cadastre produtos ou serviços que aparecerão no seu perfil público.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowItemForm(!showItemForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showItemForm ? 'Cancelar' : 'Nova Oferta / Serviço'}</span>
                </button>
              </div>

              {/* Form de inclusão de nova oferta */}
              {showItemForm && (
                <form
                  onSubmit={handleAddItem}
                  className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-3 animate-in fade-in duration-200"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-800 uppercase tracking-wider">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span>Adicionar Nova Oferta à Vitrine</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Título do Item ou Serviço *
                      </label>
                      <input
                        type="text"
                        required
                        value={itemTitulo}
                        onChange={(e) => setItemTitulo(e.target.value)}
                        placeholder="Ex: Instalação de Ponto de Luz"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Preço ou Condição *
                      </label>
                      <input
                        type="text"
                        value={itemPreco}
                        onChange={(e) => setItemPreco(e.target.value)}
                        placeholder="Ex: R$ 80,00 ou A combinar"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Descrição Curta
                    </label>
                    <input
                      type="text"
                      value={itemDescricao}
                      onChange={(e) => setItemDescricao(e.target.value)}
                      placeholder="Ex: Serviço executado com material isolante de segurança."
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowItemForm(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-2xs"
                    >
                      Salvar Oferta
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Itens Cadastrados */}
              <div className="space-y-2.5">
                {items.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-slate-400 text-xs">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Nenhuma oferta cadastrada ainda.</p>
                    <p className="mt-0.5">Adicione produtos ou serviços para enriquecer sua vitrine.</p>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">{item.titulo}</p>
                          {item.descricao && (
                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              {item.descricao}
                            </p>
                          )}
                          <span className="text-xs font-extrabold text-emerald-600 mt-0.5 inline-block">
                            {item.preco || 'A combinar'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Remover oferta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Save Action */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações no Perfil'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
