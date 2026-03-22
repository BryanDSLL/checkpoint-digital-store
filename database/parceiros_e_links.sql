-- Atualização do Schema: Parceiros e Automação de Preços
-- Este script adiciona o suporte a Parceiros (Lojas) e URLs específicas para Scraping

-- 1. Tabela de Parceiros (Lojas Oficiais)
-- O slug será usado para identificar qual script de captura (scraping) rodar para esta loja.
CREATE TABLE IF NOT EXISTS loja.parceiros (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE, -- Ex: "Amazon", "Nuuvem", "PlayStation Store"
    slug VARCHAR(100) NOT NULL UNIQUE, -- Ex: "amazon", "nuuvem", "ps-store"
    logo_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Atualização da tabela de Links de Afiliado
-- Adiciona o vínculo com o Parceiro e a URL de Captura (Scraping)
ALTER TABLE loja.links_afiliado 
ADD COLUMN IF NOT EXISTS parceiro_id INTEGER REFERENCES loja.parceiros(id),
ADD COLUMN IF NOT EXISTS url_scraping TEXT, -- URL onde o robô buscará o preço original
ADD COLUMN IF NOT EXISTS tipo_midia VARCHAR(20) DEFAULT 'Mídia digital' CHECK (tipo_midia IN ('Mídia digital', 'Mídia física', 'Key'));

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_links_parceiro ON loja.links_afiliado(parceiro_id);

-- 4. Inserção de Parceiros Padrão (Exemplos)
INSERT INTO loja.parceiros (nome, slug) VALUES 
('Amazon', 'amazon'),
('Nuuvem', 'nuuvem'),
('PlayStation Store', 'ps-store'),
('Xbox Store', 'xbox-store'),
('Steam', 'steam'),
('Epic Games Store', 'epic-games')
ON CONFLICT (nome) DO NOTHING;
