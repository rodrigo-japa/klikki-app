import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PerfilAnunciante, PlanoTipo } from '../types';
import { EditarPerfilModal } from './EditarPerfilModal';
import {
  Wrench,
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Star,
  ShieldCheck,
  AlertTriangle,
  Flag,
  MessageCircle,
  MessageSquare,
  Building2,
  MapPin,
  Phone,
  Info,
  Check,
  X,
  User,
  LogIn,
  ExternalLink,
  Upload,
  Camera,
  Search,
  Loader2,
  Edit3,
  Award,
} from 'lucide-react';

interface AnuncieAgoraFunnelProps {
  onBack: () => void;
  onProfileCreated: (newProfile: PerfilAnunciante) => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

type FunnelStep = 1 | 2 | 3 | 4 | 'success';

// Categories tailored for each profile type
const CATEGORIAS_PRESTADOR = [
  'Eletricistas & Instalações',
  'Encanadores & Desentupimento',
  'Reformas, Pedreiro & Pintura',
  'Assistência Técnica & Celulares',
  'Limpeza, Diaristas & Mudanças',
  'Jardinagem & Manutenção de Piscinas',
  'Mecânica & Auto Elétrica',
  'Beleza, Cabelo & Estética',
  'Saúde, Fisioterapia & Bem-Estar',
  'Aulas Particulares & Consultoria',
  'Fotografia, Vídeo & Eventos',
  'Marcenaria & Móveis Planejados',
  'Outros Serviços Especializados',
];

const CATEGORIAS_LOJISTA = [
  'Confeitaria, Bolos & Doces Finos',
  'Restaurantes, Pizzarias & Lanchonetes',
  'Roupas, Calçados & Acessórios',
  'Mercados, Hortifrúti & Mercearias',
  'Pet Shop, Ração & Banho/Tosa',
  'Farmácias & Cosméticos',
  'Materiais de Construção & Ferramentas',
  'Artesanato, Decoração & Flores',
  'Papelaria, Presentes & Brinquedos',
  'Bebidas, Distribuidora & Adegas',
  'Informática, Celulares & Acessórios',
  'Móveis, Colchões & Utilidades',
  'Outro Comércio Local',
];

const CIDADES_SUGERIDAS = [
  'São Paulo',
  'Campinas',
  'Santos',
  'São Bernardo do Campo',
  'Santo André',
  'Sorocaba',
  'Ribeirão Preto',
  'Guarulhos',
  'Osasco',
  'São José dos Campos',
];

// Anti-Poaching / Anti-Malandragem Regex Validator with Humanized Alert
export const HUMANIZED_ALERT_MESSAGE =
  'Por segurança, a divulgação de telefones / links externos não é permitida. Mantenha o foco em seus diferenciais!';

export const detectPoachingOrExternalContacts = (text: string) => {
  if (!text || text.trim().length === 0) return null;

  // 1. Phone numbers detection:
  const standardPhoneRegex = /(?:\+?55\s?)?(?:\(?0?[1-9]{2}\)?[\s.-]?)?(?:9[\s.-]?)?[2-9]\d{3}[\s.-]?\d{4}/;
  const spacedDigitsRegex = /(?:\d[\s.-]*){8,}/;
  const keywordPhoneRegex = /(?:zap|whats|whatsapp|cel|celular|telefone|fone|ligar|chama|chamar|tel)[\s:]*[\d\s.-]{5,}/i;

  // 2. URLs / External Links:
  const urlRegex = /(?:https?:\/\/|www\.)[^\s]+/i;
  const domainRegex = /\b[a-zA-Z0-9-]+\.(?:com\.br|com|net|org|io|app|me|link|site|store|online|xyz|tech)\b/i;
  const waLinkRegex = /(?:wa\.me|api\.whatsapp\.com|whatsapp\.com\/send)/i;
  const socialRegex = /(?:instagram\.com|facebook\.com|tiktok\.com|t\.me\/|@[\w.-]{3,})/i;
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

  if (urlRegex.test(text)) {
    const match = text.match(urlRegex)?.[0] || 'Link externo';
    return {
      type: 'url',
      message: HUMANIZED_ALERT_MESSAGE,
      matched: match,
    };
  }

  if (waLinkRegex.test(text)) {
    return {
      type: 'whatsapp_link',
      message: HUMANIZED_ALERT_MESSAGE,
      matched: 'Link do WhatsApp',
    };
  }

  if (domainRegex.test(text)) {
    const match = text.match(domainRegex)?.[0] || 'Domínio';
    return {
      type: 'domain',
      message: HUMANIZED_ALERT_MESSAGE,
      matched: match,
    };
  }

  if (socialRegex.test(text)) {
    const match = text.match(socialRegex)?.[0] || '@rede_social';
    return {
      type: 'social',
      message: HUMANIZED_ALERT_MESSAGE,
      matched: match,
    };
  }

  if (emailRegex.test(text)) {
    const match = text.match(emailRegex)?.[0] || 'E-mail';
    return {
      type: 'email',
      message: HUMANIZED_ALERT_MESSAGE,
      matched: match,
    };
  }

  if (keywordPhoneRegex.test(text)) {
    const match = text.match(keywordPhoneRegex)?.[0] || 'Contato';
    return {
      type: 'phone_keyword',
      message: HUMANIZED_ALERT_MESSAGE,
      matched: match,
    };
  }

  if (standardPhoneRegex.test(text) || spacedDigitsRegex.test(text)) {
    return {
      type: 'phone',
      message: HUMANIZED_ALERT_MESSAGE,
      matched: 'Número de telefone detectado',
    };
  }

  return null;
};

// Mask utilities
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export const formatCEP = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

export const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
};

export const isValidCNPJ = (cnpj: string): boolean => {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;

  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(1))) return false;

  return true;
};

// Preset Logo Choices
const PRESET_LOGOS_SUGGESTIONS = [
  {
    label: 'Técnico / Reparos',
    url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Comércio / Varejo',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Confeitaria / Café',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
  },
  {
    label: 'Estética / Beleza',
    url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80',
  },
];

export const AnuncieAgoraFunnel: React.FC<AnuncieAgoraFunnelProps> = ({
  onBack,
  onProfileCreated,
  onOpenAuth,
}) => {
  const { user, userName, showToast, signInWithGoogle } = useAuth();

  const [currentStep, setCurrentStep] = useState<FunnelStep>(1);

  // Form State
  const [formData, setFormData] = useState({
    tipo_perfil: 'prestador' as 'prestador' | 'lojista',
    nome_comercial: '',
    categoria: '',
    subcategoria: '',
    cep: '',
    logradouro: '',
    numero: '',
    cidade: 'São Paulo',
    bairro: '',
    estado: 'SP',
    whatsapp: '',
    telefone: '',
    cnpj: '',
    cnpj_verificado: false,
    descricao: '',
    plano_atual: 'diamante' as PlanoTipo,
    foto_url: '',
  });

  // UI & Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportTooltip, setShowReportTooltip] = useState(false);
  const [createdProfile, setCreatedProfile] = useState<PerfilAnunciante | null>(null);

  // CEP Lookup State
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<{ type: 'success' | 'error' | null; msg: string }>({
    type: null,
    msg: '',
  });

  // AI Description Optimizer State
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Post-publication Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);

  // Real-time Anti-poaching status
  const poachingViolation = detectPoachingOrExternalContacts(formData.descricao);

  // Handle Intelligent Back Step
  const handleStepBack = () => {
    if (currentStep === 'success' || currentStep === 1) {
      onBack();
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 4) {
      setCurrentStep(3);
    }
  };

  // Step 1: Selection handler
  const handleSelectTipo = (tipo: 'prestador' | 'lojista') => {
    setFormData((prev) => ({
      ...prev,
      tipo_perfil: tipo,
      categoria: tipo === 'prestador' ? CATEGORIAS_PRESTADOR[0] : CATEGORIAS_LOJISTA[0],
    }));
    setCurrentStep(2);
  };

  // CEP Auto-Search Handler
  const handleCepChange = async (val: string) => {
    const formatted = formatCEP(val);
    setFormData((prev) => ({ ...prev, cep: formatted }));

    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      setIsSearchingCep(true);
      setCepFeedback({ type: null, msg: 'Buscando endereço via CEP...' });
      try {
        const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (response.ok) {
          const data = await response.json();
          if (data.erro) {
            setCepFeedback({
              type: 'error',
              msg: 'CEP não encontrado. Por favor, digite a cidade e o bairro manualmente.',
            });
          } else {
            setFormData((prev) => ({
              ...prev,
              logradouro: data.logradouro || prev.logradouro,
              cidade: data.localidade || prev.cidade,
              bairro: data.bairro || prev.bairro,
              estado: data.uf || prev.estado,
            }));
            setCepFeedback({
              type: 'success',
              msg: `Endereço localizado: ${data.logradouro ? `${data.logradouro}, ` : ''}${data.bairro ? `${data.bairro}, ` : ''}${data.localidade} - ${data.uf}`,
            });
            // Clear any location errors
            setErrors((prev) => {
              const next = { ...prev };
              delete next.cidade;
              delete next.bairro;
              return next;
            });
          }
        } else {
          setCepFeedback({
            type: 'error',
            msg: 'Não foi possível consultar o CEP. Preencha manualmente.',
          });
        }
      } catch (err) {
        console.warn('ViaCEP network err:', err);
        setCepFeedback({
          type: 'error',
          msg: 'Não foi possível consultar o CEP. Preencha a cidade e o bairro manualmente.',
        });
      } finally {
        setIsSearchingCep(false);
      }
    } else {
      setCepFeedback({ type: null, msg: '' });
    }
  };

  // CNPJ Handler
  const handleCnpjChange = (val: string) => {
    const formatted = formatCNPJ(val);
    const clean = val.replace(/\D/g, '');
    const valid = clean.length === 14 ? isValidCNPJ(formatted) : false;
    setFormData((prev) => ({
      ...prev,
      cnpj: formatted,
      cnpj_verificado: valid,
    }));
  };

  // Logo Upload Handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('A imagem do logo deve ter no máximo 2MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setFormData((prev) => ({ ...prev, foto_url: res }));
        showToast('Logo carregado com sucesso!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Description Optimizer Handler (Garante estritamente texto persuasivo <= 230 caracteres)
  const handleAIOptimizeDescription = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const nome = formData.nome_comercial ? formData.nome_comercial.trim() : 'Nosso Negócio';
      const cat = formData.categoria || 'Serviços Especializados';
      const sub = formData.subcategoria ? ` (${formData.subcategoria})` : '';
      const local = formData.bairro || formData.cidade || 'sua região';

      let optimizedText = '';
      if (formData.tipo_perfil === 'prestador') {
        optimizedText = `${nome}: Atendimento de excelência em ${cat}${sub} em ${local}. Pontualidade, materiais de primeira e garantia comprovada. Peça seu orçamento!`;
      } else {
        optimizedText = `${nome}: Sua loja de referência em ${cat}${sub} em ${local}. Produtos selecionados, pronta entrega e atendimento especial. Venha conferir!`;
      }

      // Limite estrito de 230 caracteres com salvaguarda matemática
      if (optimizedText.length > 230) {
        optimizedText = optimizedText.slice(0, 227).trim() + '...';
      }

      setFormData((prev) => ({ ...prev, descricao: optimizedText }));
      setIsAiGenerating(false);
      showToast('Descrição comercial persuasiva gerada pela IA do Klikki!', 'success');
    }, 600);
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!formData.nome_comercial.trim()) {
      errs.nome_comercial = 'Informe o nome do seu negócio ou nome profissional.';
    }
    if (!formData.categoria) {
      errs.categoria = 'Selecione uma categoria principal.';
    }
    if (!formData.numero.trim()) {
      errs.numero = 'Informe o número do endereço ou S/N.';
    }
    if (!formData.cidade.trim()) {
      errs.cidade = 'Informe a cidade onde você atende.';
    }
    if (!formData.bairro.trim()) {
      errs.bairro = 'Informe o bairro ou região principal.';
    }
    const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');
    if (cleanWhatsapp.length < 10) {
      errs.whatsapp = 'Informe um número de WhatsApp válido com DDD (ex: 11 99999-8888).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep2 = () => {
    if (validateStep2()) {
      setCurrentStep(3);
    }
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!formData.descricao.trim()) {
      errs.descricao = 'Por favor, descreva seus serviços, diferenciais ou produtos.';
    } else if (formData.descricao.trim().length < 25) {
      errs.descricao = 'A descrição deve ter pelo menos 25 caracteres para ser atrativa aos clientes.';
    } else if (poachingViolation) {
      errs.descricao = poachingViolation.message;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep3 = () => {
    if (validateStep3()) {
      setCurrentStep(4);
    }
  };

  // Final Publish Handler (Step 4)
  const handlePublish = async () => {
    if (!user) {
      showToast('Faça login com o Google ou crie sua conta para publicar.', 'error');
      onOpenAuth('register');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanWhatsapp = formData.whatsapp.replace(/\D/g, '');
      const fullWhatsapp = cleanWhatsapp.startsWith('55') ? cleanWhatsapp : `55${cleanWhatsapp}`;

      const avatarMock = formData.foto_url || (formData.tipo_perfil === 'prestador'
          ? 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80'
          : 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80');

      const bannerMock = formData.tipo_perfil === 'prestador'
          ? 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
          : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80';

      const payload = {
        user_id: user.id,
        nome: formData.nome_comercial,
        nome_comercial: formData.nome_comercial,
        titulo: `${formData.nome_comercial} - ${formData.categoria}`,
        descricao: formData.descricao,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria || formData.categoria,
        tipo_perfil: formData.tipo_perfil,
        cidade: formData.cidade,
        bairro: formData.bairro,
        logradouro: formData.logradouro || undefined,
        numero: formData.numero,
        endereco_numero: formData.numero,
        cep: formData.cep || undefined,
        estado: formData.estado || 'SP',
        whatsapp: fullWhatsapp,
        telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : fullWhatsapp,
        plano_atual: formData.plano_atual,
        foto_url: avatarMock,
        logo_url: avatarMock,
        banner_url: bannerMock,
        cnpj: formData.cnpj || undefined,
        cnpj_verificado: formData.cnpj_verificado,
        avaliacao: 5.0,
        total_avaliacoes: 1,
        destaque: formData.plano_atual === 'diamante' || formData.plano_atual === 'ouro',
        verificado: true,
      };

      // TENTA SALVAR DE VERDADE NO SUPABASE GLOBLAL
      const { data, error } = await supabase
        .from('perfil_anunciante')
        .insert(payload)
        .select()
        .single();

      // SE O BANCO REJEITAR, O SISTEMA TRAVA E JOGA O ERRO NA TELA!
      if (error) {
        console.error('ERRO BRUTO DO SUPABASE:', error);
        showToast(`Erro do Banco: ${error.message}`, 'error');
        setIsSubmitting(false);
        return; // Impede que a tela verde de sucesso apareça
      }

      // SE PASSOU DO BLOCO ACIMA, ESTÁ OFICIALMENTE SALVO NA NUVEM!
      setCreatedProfile(data as PerfilAnunciante);
      setCurrentStep('success');
      showToast('Parabéns! Seu anúncio está público para todos.', 'success');

    } catch (err: any) {
      console.error('Error publishing:', err);
      showToast('Erro interno de conexão. Verifique a rede.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header & Breadcrumb */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={handleStepBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {currentStep === 1 || currentStep === 'success'
                ? 'Voltar para a Vitrine'
                : currentStep === 2
                ? 'Voltar para Tipo de Perfil'
                : currentStep === 3
                ? 'Voltar para Dados do Negócio'
                : 'Voltar para Descrição'}
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[11px] font-bold uppercase tracking-wider">
              Anuncie Agora
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Funil de Conversão Klikki</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Cadastre seu Serviço ou Negócio Grátis
          </h1>
        </div>

        {/* User indicator */}
        {user ? (
          <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">{userName}</p>
              <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Conta autenticada</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onOpenAuth('login')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <LogIn className="w-3.5 h-3.5 text-orange-500" />
            <span>Já tem conta? Entrar</span>
          </button>
        )}
      </div>

      {/* Stepper Progress Indicator (Steps 1 to 4) */}
      {currentStep !== 'success' && (
        <div className="mb-8 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: 'Tipo de Perfil' },
              { num: 2, label: 'Dados & Contato' },
              { num: 3, label: 'Descrição & Segurança' },
              { num: 4, label: 'Escolha do Plano' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isDone = typeof currentStep === 'number' && currentStep > step.num;

              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => {
                    if (isDone) {
                      setCurrentStep(step.num as FunnelStep);
                    }
                  }}
                  disabled={!isDone}
                  title={isDone ? `Voltar para etapa ${step.num}: ${step.label}` : step.label}
                  className={`flex flex-col items-center text-center transition-all ${
                    isDone
                      ? 'cursor-pointer hover:opacity-85 focus:outline-none'
                      : 'cursor-default'
                  }`}
                >
                  <div className="w-full flex items-center mb-2">
                    <div
                      className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500'
                          : isActive
                          ? 'bg-orange-500'
                          : 'bg-slate-100'
                      }`}
                    />
                  </div>
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                      isDone
                        ? 'bg-emerald-500 text-white hover:scale-105 shadow-xs'
                        : isActive
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25 ring-4 ring-orange-100'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.num}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs tracking-tight ${
                      isActive
                        ? 'font-bold text-orange-600'
                        : isDone
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 1: Seleção de Categoria de Perfil
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Qual é o perfil do seu negócio?
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Escolha a opção que melhor descreve suas atividades para personalizarmos sua vitrine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card Prestador de Serviços */}
            <div
              id="card-tipo-prestador"
              onClick={() => handleSelectTipo('prestador')}
              className={`group relative p-6 sm:p-7 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left bg-white ${
                formData.tipo_perfil === 'prestador'
                  ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-lg'
                  : 'border-slate-200 hover:border-orange-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wrench className="w-7 h-7" />
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    formData.tipo_perfil === 'prestador'
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {formData.tipo_perfil === 'prestador' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Mão de Obra & Assistência
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Prestador de Serviços
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Ideal para profissionais autônomos, eletricistas, encanadores, diaristas, técnicos, mecânicos, consultores e assistências.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Atendimento por agendamento ou emergência</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Destaque por raio de atendimento e cidades</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Contato via WhatsApp direto (Plano Diamante)</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-orange-500 text-white hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Selecionar Prestador</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Card Lojista / Comércio */}
            <div
              id="card-tipo-lojista"
              onClick={() => handleSelectTipo('lojista')}
              className={`group relative p-6 sm:p-7 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left bg-white ${
                formData.tipo_perfil === 'lojista'
                  ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-lg'
                  : 'border-slate-200 hover:border-orange-300 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Store className="w-7 h-7" />
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    formData.tipo_perfil === 'lojista'
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {formData.tipo_perfil === 'lojista' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>

              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                Vendas & Vitrine Física / Delivery
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                Lojista / Comércio
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Ideal para confeitarias, restaurantes, lojas de roupas, pet shops, mercados de bairro, marcenarias e comércio local.
              </p>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Vitrine com fotos, preços e promoções</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Endereço fixo e opções de retirada ou entrega</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Pedidos diretos via WhatsApp (Plano Diamante)</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Selecionar Lojista</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 2: Dados do Negócio e Contato
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs animate-in fade-in duration-200">
          <div className="mb-6">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Etapa 2 de 4
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Dados do Negócio, Identidade e Contato
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Preencha os dados oficiais, logotipo e localização para conectar-se aos clientes da sua cidade.
            </p>
          </div>

          <div className="space-y-6">
            {/* 1. UPLOAD DE LOGO DO NEGÓCIO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Logotipo ou Foto do Negócio (Recomendado)
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Logo Preview Avatar */}
                <div className="relative w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-2xs group">
                  {formData.foto_url ? (
                    <img
                      src={formData.foto_url}
                      alt="Logo do Negócio"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto mb-0.5" />
                      <span className="text-[10px] text-slate-400 font-medium">Sem logo</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="logo-upload-input"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-orange-500" />
                      <span>{formData.foto_url ? 'Alterar Imagem do Logo' : 'Enviar Imagem do Logo'}</span>
                    </label>
                    <input
                      id="logo-upload-input"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    {formData.foto_url && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, foto_url: '' }))}
                        className="px-2.5 py-2 rounded-xl text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  {/* Orientação textual clara de formato e tamanho do logo */}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Recomendado: Imagem em formato quadrado (JPG ou PNG), fundo limpo, máx. 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* 2. NOME DO NEGÓCIO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Negócio ou Nome Profissional *
              </label>
              <input
                id="input-nome-comercial"
                type="text"
                value={formData.nome_comercial}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome_comercial: e.target.value }))
                }
                placeholder={
                  formData.tipo_perfil === 'prestador'
                    ? 'Ex: Marcos Eletricista Residencial'
                    : 'Ex: Doceria Flor de Açúcar'
                }
                className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-900 outline-none transition-all ${
                  errors.nome_comercial
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                }`}
              />
              {errors.nome_comercial && (
                <p className="text-xs text-red-500 mt-1">{errors.nome_comercial}</p>
              )}
            </div>

            {/* 3. CNPJ (OPCIONAL) COM BOX DE INCENTIVO AMIGÁVEL E SELO VERIFICADO */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 border border-amber-200/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  CNPJ do Negócio <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                {formData.cnpj_verificado && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Selo "CNPJ Verificado" Elegível</span>
                  </span>
                )}
              </div>

              <div className="relative max-w-sm">
                <input
                  id="input-cnpj"
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className={`w-full pl-4 pr-10 py-2.5 rounded-xl border text-sm font-mono text-slate-900 bg-white outline-none transition-all ${
                    formData.cnpj_verificado
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                      : formData.cnpj && formData.cnpj.replace(/\D/g, '').length === 14
                      ? 'border-amber-400 focus:ring-2 focus:ring-amber-400/20'
                      : 'border-slate-200 focus:border-orange-500'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {formData.cnpj_verificado ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : formData.cnpj ? (
                    <Award className="w-4 h-4 text-amber-500" />
                  ) : null}
                </div>
              </div>

              {/* Status / Incentivo Box */}
              <div className="mt-3 p-3 rounded-xl bg-white/80 border border-amber-200/80 text-xs">
                <div className="flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      🌟 Destaque de Confiança com Selo "CNPJ Verificado"
                    </p>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Anúncios com CNPJ verificado recebem o selo oficial de garantia da plataforma Klikki, transmitindo mais credibilidade e aumentando a taxa de contato direto em até 40%.
                    </p>
                    {formData.cnpj && !formData.cnpj_verificado && formData.cnpj.replace(/\D/g, '').length < 14 && (
                      <p className="text-[11px] text-amber-700 font-medium">
                        ℹ️ Preencha os 14 dígitos para validar seu CNPJ. Se não possuir, pode deixar em branco.
                      </p>
                    )}
                    {formData.cnpj && !formData.cnpj_verificado && formData.cnpj.replace(/\D/g, '').length === 14 && (
                      <p className="text-[11px] text-red-600 font-medium">
                        ⚠️ O formato do CNPJ parece incorreto. Verifique os números digitados ou deixe em branco.
                      </p>
                    )}
                    {formData.cnpj_verificado && (
                      <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        CNPJ validado com sucesso! O selo oficial será exibido em seu card.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. CATEGORIA PRINCIPAL E SUBCATEGORIA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoria Principal *
                </label>
                <select
                  id="select-categoria"
                  value={formData.categoria}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, categoria: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  {(formData.tipo_perfil === 'prestador'
                    ? CATEGORIAS_PRESTADOR
                    : CATEGORIAS_LOJISTA
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Especialidade ou Subcategoria (opcional)
                </label>
                <input
                  type="text"
                  value={formData.subcategoria}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, subcategoria: e.target.value }))
                  }
                  placeholder="Ex: Instalações LED, Bolos de Casamento..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            {/* 5. LOCALIZAÇÃO COM BUSCA AUTOMÁTICA POR CEP */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Endereço & Atendimento Local
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Digite seu CEP para preencher automaticamente Cidade e Bairro.
                  </p>
                </div>
              </div>

              {/* Grid com CEP e Número Obrigatório */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    CEP (Busca Automática)
                  </label>
                  <div className="relative">
                    <input
                      id="input-cep"
                      type="text"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isSearchingCep ? (
                        <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {cepFeedback.msg && (
                    <p
                      className={`text-[11px] mt-1.5 font-medium ${
                        cepFeedback.type === 'success'
                          ? 'text-emerald-600'
                          : cepFeedback.type === 'error'
                          ? 'text-red-500'
                          : 'text-slate-500'
                      }`}
                    >
                      {cepFeedback.msg}
                    </p>
                  )}
                </div>

                {/* Campo Número Obrigatório ao lado do CEP/Endereço */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Número *
                  </label>
                  <input
                    id="input-numero"
                    type="text"
                    value={formData.numero}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, numero: e.target.value }));
                      if (errors.numero) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.numero;
                          return next;
                        });
                      }
                    }}
                    placeholder="Ex: 123 ou S/N"
                    className={`w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 bg-white outline-none ${
                      errors.numero
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400/20'
                        : 'border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
                    }`}
                  />
                  {errors.numero ? (
                    <p className="text-xs text-red-500 mt-1">{errors.numero}</p>
                  ) : (
                    <p className="text-[10px] text-slate-400 mt-1">Caso não tenha número, digite S/N</p>
                  )}
                </div>
              </div>

              {formData.logradouro && (
                <div className="text-xs text-slate-600 bg-white px-3 py-2 rounded-lg border border-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>Logradouro identificado: <strong>{formData.logradouro}</strong></span>
                </div>
              )}

              {/* Campos Cidade & Bairro preenchidos automaticamente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cidade *
                  </label>
                  <input
                    id="input-cidade"
                    type="text"
                    value={formData.cidade}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, cidade: e.target.value }))
                    }
                    placeholder="Ex: São Paulo"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white outline-none ${
                      errors.cidade ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
                    }`}
                  />
                  {errors.cidade && <p className="text-xs text-red-500 mt-1">{errors.cidade}</p>}

                  {/* Quick City chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {CIDADES_SUGERIDAS.slice(0, 4).map((cid) => (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, cidade: cid }))}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors cursor-pointer"
                      >
                        {cid}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Bairro ou Região de Atendimento *
                  </label>
                  <input
                    id="input-bairro"
                    type="text"
                    value={formData.bairro}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, bairro: e.target.value }))
                    }
                    placeholder="Ex: Pinheiros, Moema, Centro..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm text-slate-900 bg-white outline-none ${
                      errors.bairro ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
                    }`}
                  />
                  {errors.bairro && <p className="text-xs text-red-500 mt-1">{errors.bairro}</p>}
                </div>
              </div>
            </div>

            {/* 6. WHATSAPP (OBRIGATÓRIO) & REGRA COMERCIAL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/70 border border-orange-200/80">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <MessageCircle className="w-5 h-5 fill-white/20" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Número de WhatsApp Oficial *
                  </label>
                  <p className="text-xs text-slate-600 mt-0.5 mb-2">
                    <span className="font-bold text-orange-700">Regra Comercial Diamante:</span> O WhatsApp cadastrado será usado para o botão direto de conversa no plano Diamante.
                  </p>
                  <div className="relative max-w-sm">
                    <input
                      id="input-whatsapp"
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          whatsapp: formatPhoneNumber(e.target.value),
                        }))
                      }
                      placeholder="(11) 99999-8888"
                      className={`w-full pl-4 pr-4 py-2.5 rounded-xl border bg-white text-sm font-semibold text-slate-900 outline-none ${
                        errors.whatsapp
                          ? 'border-red-500'
                          : 'border-orange-300 focus:ring-2 focus:ring-orange-500/20'
                      }`}
                    />
                  </div>
                  {errors.whatsapp && (
                    <p className="text-xs text-red-500 mt-1 font-medium">{errors.whatsapp}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para Escolha de Perfil</span>
              </button>

              <button
                id="btn-avancar-etapa-2"
                type="button"
                onClick={handleNextStep2}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Avançar para Descrição</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 3: Descrição e Segurança (Anti-Malandragem / Validação Regex)
          ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            <div className="mb-6">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Etapa 3 de 4
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Descrição do Negócio & Regras de Segurança
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Apresente seus diferenciais e serviços. Nosso sistema protege a comunidade verificando tentativas indevidas de desvio de contato.
              </p>
            </div>

            {/* Free text field */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Descrição Completa dos Serviços ou Produtos *
                </label>

                {/* BOTÃO OTIMIZAR DESCRIÇÃO COM IA */}
                <button
                  type="button"
                  id="btn-otimizar-ia"
                  onClick={handleAIOptimizeDescription}
                  disabled={isAiGenerating}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAiGenerating ? 'Otimizando texto...' : '✨ Otimizar descrição com IA'}</span>
                </button>
              </div>

              <div className="relative">
                <textarea
                  id="textarea-descricao"
                  rows={5}
                  maxLength={230}
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                  }
                  placeholder={
                    formData.tipo_perfil === 'prestador'
                      ? 'Ex: Profissional com mais de 10 anos de experiência em instalações residenciais e comerciais. Realizo troca de fiação, luminárias e quadros elétricos com garantia e agilidade.'
                      : 'Ex: Confeitaria artesanal com bolos sob encomenda, docinhos gourmet e cafés especiais. Ingredientes nobres e opções sem lactose com entrega rápida na região.'
                  }
                  className={`w-full p-4 rounded-xl border text-sm text-slate-900 leading-relaxed outline-none transition-all ${
                    poachingViolation
                      ? 'border-red-400 bg-red-50/20 focus:ring-2 focus:ring-red-400/20'
                      : formData.descricao.length >= 25
                      ? 'border-emerald-400 bg-emerald-50/10 focus:ring-2 focus:ring-emerald-400/20'
                      : 'border-slate-200 focus:border-orange-500'
                  }`}
                />
              </div>

              {/* Character counter (Limite Estrito 230) */}
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Mínimo de 25 caracteres para melhor conversão</span>
                <span className={`font-mono font-medium ${formData.descricao.length >= 220 ? 'text-amber-600 font-bold' : ''}`}>
                  {formData.descricao.length}/230 caracteres
                </span>
              </div>

              {/* ANTI-MALANDRAGEM REAL-TIME REGEX ALERT (TOM HUMANIZADO E EDUCATIVO) */}
              {poachingViolation ? (
                <div
                  id="alerta-anti-malandragem"
                  className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 animate-in shake duration-300"
                >
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-amber-950 flex items-center gap-1.5">
                      <span>⚠️ Alerta de Segurança e Boas Práticas</span>
                    </h4>
                    <p className="text-xs font-semibold text-amber-900 mt-1 leading-relaxed">
                      Por segurança, a divulgação de telefones / links externos não é permitida. Mantenha o foco em seus diferenciais!
                    </p>
                    <div className="mt-2 text-[11px] bg-white/90 px-2.5 py-1.5 rounded-lg border border-amber-200 font-mono text-amber-900">
                      Elemento identificado: <span className="font-bold underline">{poachingViolation.matched}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 mt-2">
                      💡 <strong>Dica amigável:</strong> Destaque a qualidade do seu trabalho, agilidade e garantia. O contato com os clientes é realizado de forma segura pelos botões oficiais do anúncio.
                    </p>
                  </div>
                </div>
              ) : formData.descricao.trim().length >= 25 ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Descrição validada e em conformidade com as diretrizes do Klikki!</span>
                </div>
              ) : null}

              {errors.descricao && !poachingViolation && (
                <p className="text-xs text-red-500 font-medium">{errors.descricao}</p>
              )}
            </div>

            {/* LIVE PREVIEW SECTION */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Pré-Visualização do Anúncio</span>
                </span>
                <span className="text-[11px] text-slate-400">Como os clientes verão seu card</span>
              </div>

              {/* Preview Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 max-w-lg mx-auto">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs">
                  <div className="flex items-start gap-3 mb-2">
                    {/* Logo in Preview */}
                    <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {formData.foto_url ? (
                        <img
                          src={formData.foto_url}
                          alt="Logo"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Store className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700">
                            {formData.tipo_perfil === 'prestador' ? 'Prestador' : 'Lojista'} • {formData.categoria || 'Categoria'}
                            {formData.subcategoria ? ` • ${formData.subcategoria}` : ''}
                          </span>
                          {formData.cnpj_verificado && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" />
                              <span>CNPJ Verificado</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-xs font-bold text-amber-700 shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>5.0</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-base text-slate-900 mt-1 truncate">
                        {formData.nome_comercial || 'Nome do seu negócio'}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mt-2 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {formData.descricao.trim() || 'Sua descrição aparecerá aqui de forma limpa e legível.'}
                  </p>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {[
                        formData.logradouro,
                        formData.numero ? `Nº ${formData.numero}` : '',
                        formData.bairro,
                        formData.cidade,
                      ]
                        .filter(Boolean)
                        .join(' - ') ||
                        [formData.bairro, formData.cidade].filter(Boolean).join(' - ') ||
                        'Localização'}
                    </span>
                  </div>

                  {/* PREVIEW FOOTER WITH REQUESTED DISCREET REPORT BUTTON */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Canal verificado Klikki</span>

                    {/* Friendly Discreet "Denunciar Anúncio" in Preview Layout */}
                    <div className="relative">
                      <button
                        type="button"
                        id="btn-denunciar-preview"
                        onClick={() => setShowReportTooltip(!showReportTooltip)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        title="Botão de denúncia disponível aos clientes"
                      >
                        <Flag className="w-3 h-3 text-slate-400" />
                        <span>🚩 Denunciar Anúncio</span>
                      </button>

                      {showReportTooltip && (
                        <div className="absolute right-0 bottom-6 w-64 bg-slate-900 text-white text-[11px] p-2.5 rounded-xl shadow-xl z-10">
                          <p className="font-semibold text-orange-400 mb-0.5">Segurança da Comunidade:</p>
                          <p className="text-slate-300">
                            Este botão fica disponível no seu perfil para que a comunidade mantenha a qualidade e segurança de contatos do Klikki.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para Dados do Negócio</span>
              </button>

              <button
                id="btn-avancar-etapa-3"
                type="button"
                disabled={Boolean(poachingViolation) || formData.descricao.trim().length < 25}
                onClick={handleNextStep3}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Avançar para Escolha do Plano</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          ETAPA 4: Escolha do Plano e Conclusão
          ========================================================================= */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="text-center max-w-xl mx-auto mb-6">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              Etapa 4 de 4
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Escolha seu Plano de Publicação
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Destaque seu anúncio e desbloqueie o contato direto com seus futuros clientes.
            </p>
          </div>

          {/* Destaque Comercial Exclusivo Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Diferencial Comercial Klikki:</p>
                <p className="text-xs text-orange-100">
                  O <strong>Plano Diamante</strong> libera o botão <strong>"Conversar no WhatsApp"</strong> diretamente no seu perfil. Os demais planos utilizam o Chat Interno.
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold bg-white text-orange-600 px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0 self-start sm:self-auto shadow-2xs">
              WhatsApp Direto
            </span>
          </div>

          {/* Grid de 3 Planos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Plano Grátis */}
            <div
              id="plano-card-gratis"
              onClick={() => setFormData((prev) => ({ ...prev, plano_atual: 'gratis' }))}
              className={`relative bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                formData.plano_atual === 'gratis'
                  ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Básico
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.plano_atual === 'gratis'
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {formData.plano_atual === 'gratis' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Plano Grátis</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">R$ 0</span>
                  <span className="text-xs text-slate-500 ml-1">/ para sempre</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Presença na vitrine e buscas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Até 3 itens cadastrados</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <MessageSquare className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Contato via Chat Interno</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 line-through">
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Sem botão de WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 line-through">
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Sem selo de destaque</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  formData.plano_atual === 'gratis'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {formData.plano_atual === 'gratis' ? 'Plano Selecionado' : 'Selecionar Grátis'}
              </button>
            </div>

            {/* 2. Plano Ouro */}
            <div
              id="plano-card-ouro"
              onClick={() => setFormData((prev) => ({ ...prev, plano_atual: 'ouro' }))}
              className={`relative bg-white rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                formData.plano_atual === 'ouro'
                  ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'border-slate-200 hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Destaque</span>
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.plano_atual === 'ouro'
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {formData.plano_atual === 'ouro' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Plano Ouro</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">R$ 49</span>
                  <span className="text-xs text-slate-500 ml-1">/ mês</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Selo <strong>"Destaque"</strong> dourado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Prioridade à frente de anúncios grátis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Até 10 itens na vitrine</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <MessageSquare className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Contato via Chat Interno</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 line-through">
                    <X className="w-4 h-4 text-slate-300 shrink-0" />
                    <span>Sem botão de WhatsApp</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  formData.plano_atual === 'ouro'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                {formData.plano_atual === 'ouro' ? 'Plano Selecionado' : 'Selecionar Ouro'}
              </button>
            </div>

            {/* 3. Plano Diamante (MAIS VANTAJOSO / EXCLUSIVO WHATSAPP) */}
            <div
              id="plano-card-diamante"
              onClick={() => setFormData((prev) => ({ ...prev, plano_atual: 'diamante' }))}
              className={`relative bg-gradient-to-b from-white to-orange-50/40 rounded-2xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                formData.plano_atual === 'diamante'
                  ? 'border-orange-500 ring-4 ring-orange-500/20 shadow-xl scale-[1.02]'
                  : 'border-orange-200 hover:border-orange-400'
              }`}
            >
              {/* Badge Recomendado */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Mais Vendido • WhatsApp Liberado</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    <span>Diamante Premium</span>
                  </span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.plano_atual === 'diamante'
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {formData.plano_atual === 'diamante' && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-900">Plano Diamante</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-extrabold text-slate-900">R$ 99</span>
                  <span className="text-xs text-slate-500 ml-1">/ mês</span>
                </div>

                <div className="space-y-2.5 text-xs text-slate-700 border-t border-orange-100 pt-4">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                    <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600/20 shrink-0" />
                    <span>🔥 BOTÃO DIRETO DE WHATSAPP (wa.me)</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Selo <strong>"Destaque Diamante"</strong> e borda premium</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Máxima prioridade no topo de buscas</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Vitrine de produtos/serviços ilimitada</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Conversão imediata sem intermediários</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={`mt-6 w-full py-2.5 rounded-xl text-xs font-bold transition-colors ${
                  formData.plano_atual === 'diamante'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                }`}
              >
                {formData.plano_atual === 'diamante'
                  ? '✓ Plano Diamante Selecionado'
                  : 'Escolher Plano Diamante'}
              </button>
            </div>
          </div>

          {/* Autenticação & Botão de Publicação */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs mt-8">
            {!user ? (
              <div className="text-center max-w-md mx-auto py-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 mx-auto flex items-center justify-center mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Conecte sua conta para publicar
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Seu anúncio será vinculado com segurança ao seu usuário autenticado via Supabase.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={signInWithGoogle}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Entrar com Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenAuth('login')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span>Entrar com E-mail</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-xs">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Publicando como usuário:</p>
                      <p className="font-bold text-sm text-slate-900">{userName}</p>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  {/* Campo editável para o Nome da Loja/Negócio */}
                  <div className="w-full md:max-w-xs">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Edit3 className="w-3 h-3 text-orange-500" />
                      <span>Nome da Loja / Negócio (Editável)</span>
                    </label>
                    <input
                      id="input-nome-loja-step4"
                      type="text"
                      value={formData.nome_comercial}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, nome_comercial: e.target.value }))
                      }
                      placeholder="Nome do seu negócio"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-2xs"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-xs text-slate-500">
                    Ao publicar, seu anúncio estará ativo e em conformidade com as regras do Klikki.
                  </span>

                  <button
                    id="btn-publicar-anuncio"
                    type="button"
                    disabled={isSubmitting || !formData.nome_comercial.trim()}
                    onClick={handlePublish}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Salvando anúncio...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Publicar Anúncio Agora</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-start pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para Descrição</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TELA DE SUCESSO / DASHBOARD DO ANUNCIANTE
          ========================================================================= */}
      {currentStep === 'success' && (
        <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm text-center max-w-xl mx-auto animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-500 border-2 border-emerald-200 mx-auto flex items-center justify-center mb-6 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider mb-2">
            Anúncio Publicado com Sucesso!
          </span>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Parabéns, {formData.nome_comercial}!
          </h2>

          <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
            Seu negócio já está visível para clientes locais no Klikki com o{' '}
            <span className="font-bold text-slate-900">
              {formData.plano_atual === 'diamante'
                ? 'Plano Diamante (WhatsApp Direto)'
                : formData.plano_atual === 'ouro'
                ? 'Plano Ouro'
                : 'Plano Grátis'}
            </span>
            .
          </p>

          {/* Quick Summary Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left my-6 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Nome:</span>
              <span className="font-bold text-slate-800">{formData.nome_comercial}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Categoria:</span>
              <span className="font-bold text-slate-800">{formData.categoria}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Local:</span>
              <span className="font-bold text-slate-800">
                {formData.bairro} - {formData.cidade}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Canal de Contato:</span>
              <span
                className={`font-bold ${
                  formData.plano_atual === 'diamante' ? 'text-emerald-600' : 'text-slate-700'
                }`}
              >
                {formData.plano_atual === 'diamante'
                  ? 'Botão WhatsApp Liberado'
                  : 'Chat Interno Klikki'}
              </span>
            </div>
            {formData.cnpj_verificado && (
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Status CNPJ:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Selo CNPJ Verificado Ativo
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {createdProfile && (
              <>
                <button
                  type="button"
                  id="btn-ver-perfil-publico-novo"
                  onClick={() => onProfileCreated(createdProfile)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Ver meu Perfil Público</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {/* BOTÃO EDITAR MEU PERFIL PÚBLICO (ABRE MODAL) */}
                <button
                  type="button"
                  id="btn-editar-perfil-publicado"
                  onClick={() => setShowEditModal(true)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-orange-500" />
                  <span>Editar Perfil</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              Voltar para a Vitrine
            </button>
          </div>

          {/* MODAL DE EDIÇÃO DE PERFIL PÓS-PUBLICAÇÃO */}
          {showEditModal && createdProfile && (
            <EditarPerfilModal
              isOpen={showEditModal}
              onClose={() => setShowEditModal(false)}
              profile={createdProfile}
              onSaveProfile={(updatedProfile) => {
                setCreatedProfile(updatedProfile);
                setFormData((prev) => ({
                  ...prev,
                  nome_comercial: updatedProfile.nome_comercial,
                  categoria: updatedProfile.categoria,
                  cidade: updatedProfile.cidade,
                  bairro: updatedProfile.bairro,
                  whatsapp: updatedProfile.whatsapp,
                  descricao: updatedProfile.descricao,
                  foto_url: updatedProfile.foto_url || prev.foto_url,
                }));
                setShowEditModal(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};