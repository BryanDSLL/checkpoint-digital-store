-- Schema da GameStore Revenda (Checkpoint Digital)
CREATE SCHEMA IF NOT EXISTS loja;

-- 1. Parceiros (Lojas Oficiais)
-- Cada parceiro terá um slug que identificará seu script de scraping.
CREATE TABLE IF NOT EXISTS loja.parceiros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE, -- Ex: "Amazon", "Nuuvem", "PlayStation Store"
    slug VARCHAR(100) NOT NULL UNIQUE, -- Ex: "amazon", "nuuvem", "ps-store"
    logo_url TEXT,
    logo_base64 TEXT, -- Armazenamento direto da imagem
    tem_scraping BOOLEAN DEFAULT FALSE, -- Identifica se o parceiro suporta scraping de preços
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Plataformas (PS5, Xbox, PC, Switch, etc.)
CREATE TABLE IF NOT EXISTS loja.plataformas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icone_url TEXT,
    cor_hex VARCHAR(7) DEFAULT '#0EA5E9',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categorias/Gêneros de jogos
CREATE TABLE IF NOT EXISTS loja.categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

-- 4. Jogos
CREATE TABLE IF NOT EXISTS loja.jogos (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    titulo_original VARCHAR(255),
    descricao TEXT NOT NULL,
    descricao_curta VARCHAR(500),
    imagem_capa TEXT NOT NULL,
    imagens_galeria TEXT[], -- Array de URLs
    trailer_url TEXT,
    
    -- Preços (Pode ser o preço global ou o menor preço encontrado nas lojas)
    preco_original NUMERIC(10,2),
    preco_com_cupom NUMERIC(10,2),
    percentual_desconto INTEGER DEFAULT 0,
    
    -- Metadados
    desenvolvedor VARCHAR(255),
    publicadora VARCHAR(255),
    data_lancamento DATE,
    classificacao_etaria VARCHAR(10) DEFAULT 'Livre',
    
    -- Flags
    destaque BOOLEAN DEFAULT FALSE,
    lancamento BOOLEAN DEFAULT FALSE,
    mais_vendido BOOLEAN DEFAULT FALSE,
    em_promocao BOOLEAN DEFAULT FALSE,
    destaque_hoje BOOLEAN DEFAULT FALSE, -- Banner Principal (Hero)
    imagem_capa_base64 TEXT, -- Armazenamento direto da imagem
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Stats
    visualizacoes INTEGER DEFAULT 0,
    cliques_afiliado INTEGER DEFAULT 0,
    vendas INTEGER DEFAULT 0, -- Quantidade vendida
    
    -- SEO
    meta_descricao TEXT,
    tags TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Links de Afiliado por Jogo + Plataforma + Parceiro
-- Cada jogo pode ter vários links para a mesma ou diferentes lojas.
CREATE TABLE IF NOT EXISTS loja.links_afiliado (
    id SERIAL PRIMARY KEY,
    jogo_id INTEGER REFERENCES loja.jogos(id) ON DELETE CASCADE,
    plataforma_id INTEGER REFERENCES loja.plataformas(id),
    parceiro_id INTEGER REFERENCES loja.parceiros(id), -- Vínculo com a loja oficial
    
    -- Campos legados (Mantidos para compatibilidade inicial)
    nome_loja VARCHAR(100),
    logo_loja TEXT,
    
    -- URLs
    url_afiliado TEXT NOT NULL, -- Link que o cliente clica (redirecionamento com cupom)
    url_scraping TEXT,        -- URL onde o robô buscará o preço original
    
    -- Cupom
    codigo_cupom VARCHAR(50), -- Ex: "CP-DIGITAL"
    
    -- Preço exibido nessa loja específica
    preco_loja NUMERIC(10,2),
    preco_loja_com_cupom NUMERIC(10,2),
    
    -- Configuração
    tipo_midia VARCHAR(20) DEFAULT 'Mídia digital' CHECK (tipo_midia IN ('Mídia digital', 'Mídia física', 'Key')),
    destaque BOOLEAN DEFAULT FALSE, -- Loja principal sugerida
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Relações (N para N)
CREATE TABLE IF NOT EXISTS loja.jogos_plataformas (
    jogo_id INTEGER REFERENCES loja.jogos(id) ON DELETE CASCADE,
    plataforma_id INTEGER REFERENCES loja.plataformas(id),
    PRIMARY KEY (jogo_id, plataforma_id)
);

CREATE TABLE IF NOT EXISTS loja.jogos_categorias (
    jogo_id INTEGER REFERENCES loja.jogos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES loja.categorias(id),
    PRIMARY KEY (jogo_id, categoria_id)
);

-- 7. Usuários Admin
CREATE TABLE IF NOT EXISTS loja.usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Log de cliques em links afiliados
CREATE TABLE IF NOT EXISTS loja.log_cliques (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES loja.links_afiliado(id),
    jogo_id INTEGER REFERENCES loja.jogos(id),
    ip_origem VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Índices para performance
CREATE INDEX IF NOT EXISTS idx_jogos_destaque ON loja.jogos(destaque) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_jogos_lancamento ON loja.jogos(lancamento) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_jogos_mais_vendido ON loja.jogos(mais_vendido) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_jogos_slug ON loja.jogos(slug);
CREATE INDEX IF NOT EXISTS idx_links_jogo ON loja.links_afiliado(jogo_id) WHERE ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_links_parceiro ON loja.links_afiliado(parceiro_id);
