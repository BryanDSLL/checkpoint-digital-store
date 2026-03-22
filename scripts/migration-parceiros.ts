import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Iniciando migração...');
    
    // 1. Criar tabela de parceiros
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loja.parceiros (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        logo_url TEXT,
        ativo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tabela loja.parceiros garantida.');

    // 2. Adicionar colunas em links_afiliado
    await pool.query(`
      ALTER TABLE loja.links_afiliado 
      ADD COLUMN IF NOT EXISTS parceiro_id INTEGER REFERENCES loja.parceiros(id),
      ADD COLUMN IF NOT EXISTS url_scraping TEXT;
    `);
    console.log('Colunas parceiro_id e url_scraping adicionadas em loja.links_afiliado.');

    // 3. Migrar dados existentes (opcional, mas bom para consistência)
    // Tenta criar parceiros baseados nos nomes de lojas já existentes
    const lojasExistentes = await pool.query('SELECT DISTINCT nome_loja FROM loja.links_afiliado WHERE parceiro_id IS NULL');
    for (const row of lojasExistentes.rows) {
      const nome = row.nome_loja;
      const slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
      try {
        const res = await pool.query(
          'INSERT INTO loja.parceiros (nome, slug) VALUES ($1, $2) ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING id',
          [nome, slug]
        );
        const parceiroId = res.rows[0].id;
        await pool.query('UPDATE loja.links_afiliado SET parceiro_id = $1 WHERE nome_loja = $2', [parceiroId, nome]);
        console.log(`Parceiro "${nome}" criado e links vinculados.`);
      } catch (e) {
        console.error(`Erro ao migrar loja ${nome}:`, e);
      }
    }

    console.log('Migração concluída com sucesso!');
  } catch (err) {
    console.error('Erro na migração:', err);
  } finally {
    await pool.end();
  }
}

run();
