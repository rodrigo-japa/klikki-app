export type PlanoTipo = 'gratis' | 'ouro' | 'diamante';

export interface PerfilAnunciante {
  id: string | number;
  user_id?: string;
  nome?: string;
  nome_comercial?: string;
  titulo?: string;
  descricao?: string;
  categoria?: string;
  subcategoria?: string;
  tipo_perfil?: 'prestador' | 'lojista' | string;
  cidade?: string;
  bairro?: string;
  logradouro?: string;
  numero?: string;
  endereco_numero?: string;
  cep?: string;
  estado?: string;
  telefone?: string;
  whatsapp?: string;
  foto_url?: string;
  logo_url?: string;
  banner_url?: string;
  avaliacao?: number;
  total_avaliacoes?: number;
  destaque?: boolean;
  verificado?: boolean;
  cnpj?: string;
  cnpj_verificado?: boolean;
  plano_atual?: PlanoTipo | string;
  created_at?: string;
}

export interface AnuncioItem {
  id: string | number;
  anunciante_id?: string | number;
  perfil_id?: string | number;
  titulo: string;
  descricao?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  imagem_url?: string;
  categoria?: string;
  ativo?: boolean;
  created_at?: string;
}

export interface Favorito {
  id?: string | number;
  user_id?: string;
  anunciante_id?: string | number;
  created_at?: string;
}

export type NavTab = 'inicio' | 'busca' | 'favoritos' | 'menu';
