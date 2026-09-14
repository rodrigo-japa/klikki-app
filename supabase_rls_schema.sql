-- ============================================================================
-- KLIKKI - AUDITORIA E ATUALIZAÇÃO DE POLÍTICAS DE SEGURANÇA (RLS) E ESQUEMA
-- ============================================================================
-- Este script garante:
-- 1. Visibilidade pública irrestrita (SELECT) para visitantes anônimos e qualquer usuário.
-- 2. Restrição estrita de edição/exclusão (UPDATE/DELETE) apenas ao criador/dono (auth.uid()).
-- 3. Criação ou atualização idempotente das tabelas 'perfil_anunciante', 'perfis_anunciantes' e 'anuncios_itens'.
-- ============================================================================

-- Habilitar extensão para geração de UUID se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELA DE PERFIS DE ANUNCIANTES (perfil_anunciante)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.perfil_anunciante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT,
    nome_comercial TEXT NOT NULL,
    titulo TEXT,
    descricao TEXT,
    categoria TEXT NOT NULL,
    subcategoria TEXT,
    tipo_perfil TEXT NOT NULL DEFAULT 'comercio',
    cidade TEXT NOT NULL DEFAULT 'São Paulo',
    bairro TEXT NOT NULL DEFAULT 'Centro',
    logradouro TEXT,
    numero TEXT,
    endereco_numero TEXT,
    cep TEXT,
    estado TEXT DEFAULT 'SP',
    whatsapp TEXT NOT NULL,
    telefone TEXT,
    plano_atual TEXT NOT NULL DEFAULT 'gratis',
    foto_url TEXT,
    logo_url TEXT,
    logo TEXT,
    banner_url TEXT,
    cnpj TEXT,
    cnpj_verificado BOOLEAN DEFAULT FALSE,
    avaliacao NUMERIC(3, 2) DEFAULT 5.0,
    total_avaliacoes INTEGER DEFAULT 1,
    destaque BOOLEAN DEFAULT FALSE,
    verificado BOOLEAN DEFAULT TRUE,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir colunas adicionais caso a tabela já exista com estrutura resumida
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS nome_comercial TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS subcategoria TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS tipo_perfil TEXT DEFAULT 'comercio';
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS cidade TEXT DEFAULT 'São Paulo';
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS bairro TEXT DEFAULT 'Centro';
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS endereco_numero TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'SP';
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS plano_atual TEXT DEFAULT 'gratis';
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS cnpj_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS avaliacao NUMERIC(3, 2) DEFAULT 5.0;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 1;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT FALSE;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT TRUE;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.perfil_anunciante ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Compatibilidade com tabela plural 'perfis_anunciantes'
CREATE TABLE IF NOT EXISTS public.perfis_anunciantes (
    LIKE public.perfil_anunciante INCLUDING ALL
);
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS nome_comercial TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS categoria TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS subcategoria TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS tipo_perfil TEXT DEFAULT 'comercio';
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS cidade TEXT DEFAULT 'São Paulo';
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS bairro TEXT DEFAULT 'Centro';
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS endereco_numero TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'SP';
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS plano_atual TEXT DEFAULT 'gratis';
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS cnpj_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS avaliacao NUMERIC(3, 2) DEFAULT 5.0;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS total_avaliacoes INTEGER DEFAULT 1;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT FALSE;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT TRUE;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.perfis_anunciantes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 2. TABELA DE ITENS / OFERTAS / SERVIÇOS (anuncios_itens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.anuncios_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    anunciante_id UUID NOT NULL,
    perfil_id UUID,
    titulo TEXT NOT NULL,
    descricao TEXT,
    preco TEXT,
    preco_promocional TEXT,
    imagem_url TEXT,
    fotos JSONB DEFAULT '[]'::jsonb,
    categoria TEXT DEFAULT 'Oferta',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS perfil_id UUID;
ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS preco TEXT;
ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS preco_promocional TEXT;
ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS imagem_url TEXT;
ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Oferta';
ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.anuncios_itens ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.perfil_anunciante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis_anunciantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anuncios_itens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. POLÍTICAS DE RLS PARA 'perfil_anunciante'
-- ============================================================================

-- LEITURA PÚBLICA (CRUCIAL: Visitantes anônimos e qualquer usuário autenticado podem ler)
DROP POLICY IF EXISTS "Permitir leitura pública de perfis de anunciantes" ON public.perfil_anunciante;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.perfil_anunciante;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.perfil_anunciante;

CREATE POLICY "Permitir leitura pública de perfis de anunciantes"
ON public.perfil_anunciante
FOR SELECT
TO public
USING (true);

-- CRIAÇÃO: Apenas usuário autenticado criando para si mesmo
DROP POLICY IF EXISTS "Permitir criação de perfil por usuário autenticado" ON public.perfil_anunciante;
CREATE POLICY "Permitir criação de perfil por usuário autenticado"
ON public.perfil_anunciante
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- EDIÇÃO: Apenas o dono do anúncio pode editar
DROP POLICY IF EXISTS "Permitir atualização pelo proprietário do perfil" ON public.perfil_anunciante;
CREATE POLICY "Permitir atualização pelo proprietário do perfil"
ON public.perfil_anunciante
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- EXCLUSÃO: Apenas o dono do anúncio pode excluir
DROP POLICY IF EXISTS "Permitir exclusão pelo proprietário do perfil" ON public.perfil_anunciante;
CREATE POLICY "Permitir exclusão pelo proprietário do perfil"
ON public.perfil_anunciante
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 5. POLÍTICAS DE RLS PARA 'perfis_anunciantes' (Compatibilidade Plural)
-- ============================================================================
DROP POLICY IF EXISTS "Permitir leitura pública de perfis_anunciantes" ON public.perfis_anunciantes;
DROP POLICY IF EXISTS "Public perfis_anunciantes are viewable by everyone." ON public.perfis_anunciantes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.perfis_anunciantes;

CREATE POLICY "Permitir leitura pública de perfis_anunciantes"
ON public.perfis_anunciantes
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Permitir criação de perfis_anunciantes por usuário autenticado" ON public.perfis_anunciantes;
CREATE POLICY "Permitir criação de perfis_anunciantes por usuário autenticado"
ON public.perfis_anunciantes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir atualização de perfis_anunciantes pelo proprietário" ON public.perfis_anunciantes;
CREATE POLICY "Permitir atualização de perfis_anunciantes pelo proprietário"
ON public.perfis_anunciantes
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir exclusão de perfis_anunciantes pelo proprietário" ON public.perfis_anunciantes;
CREATE POLICY "Permitir exclusão de perfis_anunciantes pelo proprietário"
ON public.perfis_anunciantes
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 6. POLÍTICAS DE RLS PARA 'anuncios_itens'
-- ============================================================================

-- LEITURA PÚBLICA: Qualquer visitante ou cliente pode ver as ofertas/serviços
DROP POLICY IF EXISTS "Permitir leitura pública de itens de anúncios" ON public.anuncios_itens;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.anuncios_itens;

CREATE POLICY "Permitir leitura pública de itens de anúncios"
ON public.anuncios_itens
FOR SELECT
TO public
USING (true);

-- CRIAÇÃO: Usuário autenticado
DROP POLICY IF EXISTS "Permitir inserção de itens por usuário autenticado" ON public.anuncios_itens;
CREATE POLICY "Permitir inserção de itens por usuário autenticado"
ON public.anuncios_itens
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfil_anunciante
        WHERE (id = anunciante_id OR id = perfil_id) AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.perfis_anunciantes
        WHERE (id = anunciante_id OR id = perfil_id) AND user_id = auth.uid()
    )
    OR
    auth.uid() IS NOT NULL
);

-- ATUALIZAÇÃO: Apenas o dono do anunciante correspondente
DROP POLICY IF EXISTS "Permitir atualização de itens pelo proprietário" ON public.anuncios_itens;
CREATE POLICY "Permitir atualização de itens pelo proprietário"
ON public.anuncios_itens
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfil_anunciante
        WHERE (id = anunciante_id OR id = perfil_id) AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.perfis_anunciantes
        WHERE (id = anunciante_id OR id = perfil_id) AND user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.perfil_anunciante
        WHERE (id = anunciante_id OR id = perfil_id) AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.perfis_anunciantes
        WHERE (id = anunciante_id OR id = perfil_id) AND user_id = auth.uid()
    )
);

-- EXCLUSÃO: Apenas o dono do anunciante correspondente
DROP POLICY IF EXISTS "Permitir exclusão de itens pelo proprietário" ON public.anuncios_itens;
CREATE POLICY "Permitir exclusão de itens pelo proprietário"
ON public.anuncios_itens
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfil_anunciante
        WHERE (id = anunciante_id OR id = perfil_id) AND user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM public.perfis_anunciantes
        WHERE (id = anunciante_id OR id = perfil_id) AND user_id = auth.uid()
    )
);

-- ============================================================================
-- 7. TABELA E POLÍTICAS DE FAVORITOS (favoritos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.favoritos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anunciante_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, anunciante_id)
);

ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de favoritos pelo próprio usuário" ON public.favoritos;
CREATE POLICY "Permitir leitura de favoritos pelo próprio usuário"
ON public.favoritos
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir criação de favoritos pelo próprio usuário" ON public.favoritos;
CREATE POLICY "Permitir criação de favoritos pelo próprio usuário"
ON public.favoritos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir remoção de favoritos pelo próprio usuário" ON public.favoritos;
CREATE POLICY "Permitir remoção de favoritos pelo próprio usuário"
ON public.favoritos
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Fim do script de auditoria e segurança RLS
