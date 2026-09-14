import { PerfilAnunciante, AnuncioItem } from '../types';

export const DEMO_ADVERTISERS: PerfilAnunciante[] = [
  {
    id: 'demo-1',
    nome: 'Carlos Eduardo Santos',
    nome_comercial: 'EletroPrime Instalações Elétricas',
    titulo: 'Eletricista Residencial e Comercial 24h',
    descricao:
      'Mais de 12 anos de experiência em instalações e manutenções elétricas residenciais, comerciais e prediais. Especialista em quadros de distribuição, iluminação LED e laudos técnicos com pontualidade e segurança.',
    categoria: 'Eletricistas',
    subcategoria: 'Manutenção & Instalações',
    cidade: 'São Paulo',
    bairro: 'Vila Mariana',
    estado: 'SP',
    telefone: '(11) 98765-4321',
    whatsapp: '5511987654321',
    foto_url:
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
    banner_url:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    avaliacao: 4.9,
    total_avaliacoes: 38,
    verificado: true,
    plano_atual: 'diamante',
  },
  {
    id: 'demo-2',
    nome: 'Juliana Castro',
    nome_comercial: 'Ateliê Doce Sabor & Café',
    titulo: 'Bolos Artesanais, Doces Finos e Salgados',
    descricao:
      'Confeitaria artesanal produzindo bolos temáticos para festas, cafés especiais e salgados gourmet com ingredientes selecionados. Encomendas com entrega garantida na região.',
    categoria: 'Alimentação & Lojas',
    subcategoria: 'Confeitaria',
    cidade: 'São Paulo',
    bairro: 'Pinheiros',
    estado: 'SP',
    telefone: '(11) 97654-3210',
    whatsapp: '5511976543210',
    foto_url:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
    banner_url:
      'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=1200&q=80',
    avaliacao: 4.8,
    total_avaliacoes: 24,
    verificado: true,
    plano_atual: 'ouro',
  },
  {
    id: 'demo-3',
    nome: 'Roberto Silva',
    nome_comercial: 'Hidráulica Express Silva',
    titulo: 'Encanador e Desentupimentos Rápidos',
    descricao:
      'Serviços hidráulicos em geral, conserto de vazamentos, substituição de tubulações, instalação de louças e torneiras. Atendimento rápido e orçamento sem compromisso.',
    categoria: 'Encanadores',
    subcategoria: 'Reparos Hidráulicos',
    cidade: 'São Paulo',
    bairro: 'Moema',
    estado: 'SP',
    telefone: '(11) 96543-2109',
    whatsapp: '5511965432109',
    foto_url:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
    avaliacao: 4.6,
    total_avaliacoes: 15,
    verificado: false,
    plano_atual: 'gratis',
  },
];

export const DEMO_ITEMS: Record<string, AnuncioItem[]> = {
  'demo-1': [
    {
      id: 'item-1',
      anunciante_id: 'demo-1',
      titulo: 'Instalação de Quadro Elétrico e Disjuntores',
      descricao:
        'Montagem completa e balanceamento de circuitos elétricos com cabos e componentes antichamas.',
      preco: 'R$ 380,00',
      preco_promocional: 'R$ 320,00',
      imagem_url:
        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
      categoria: 'Serviço',
    },
    {
      id: 'item-2',
      anunciante_id: 'demo-1',
      titulo: 'Troca de Fiação Residencial (por cômodo)',
      descricao:
        'Substituição de fios antigos por cabos normatizados e instalação de tomadas novas.',
      preco: 'R$ 220,00',
      imagem_url:
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80',
      categoria: 'Serviço',
    },
    {
      id: 'item-3',
      anunciante_id: 'demo-1',
      titulo: 'Instalação de Chuveiro Elétrico ou Torneira',
      descricao:
        'Fixação com fiação dedicada, disjuntor apropriado e teste de aquecimento.',
      preco: 'R$ 90,00',
      categoria: 'Serviço Rápido',
    },
    {
      id: 'item-4',
      anunciante_id: 'demo-1',
      titulo: 'Laudo Técnico e Inspeção de Segurança',
      descricao:
        'Vistoria técnica detalhada para seguro ou vistoria predial com relatório.',
      preco: 'R$ 450,00',
      categoria: 'Consultoria',
    },
  ],
  'demo-2': [
    {
      id: 'item-201',
      anunciante_id: 'demo-2',
      titulo: 'Bolo Festivo Red Velvet Artesanal (1,5kg)',
      descricao:
        'Massa fofinha com recheio autêntico de cream cheese e frutas vermelhas frescas.',
      preco: 'R$ 135,00',
      preco_promocional: 'R$ 119,00',
      imagem_url:
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80',
      categoria: 'Confeitaria',
    },
    {
      id: 'item-202',
      anunciante_id: 'demo-2',
      titulo: 'Cento de Brigadeiros Gourmet Sortidos',
      descricao:
        'Sabores tradicionais, pistache, ninho com nutella e chocolate belga 70%.',
      preco: 'R$ 180,00',
      imagem_url:
        'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=400&q=80',
      categoria: 'Doces Finos',
    },
  ],
  'demo-3': [
    {
      id: 'item-301',
      anunciante_id: 'demo-3',
      titulo: 'Desentupimento de Ralo ou Pia',
      descricao: 'Desobstrução rápida com equipamento mecânico sem quebrar piso.',
      preco: 'R$ 150,00',
      categoria: 'Serviço',
    },
  ],
};
