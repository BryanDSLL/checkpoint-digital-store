import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adicionando coluna imagem_capa_base64...');
    await pool.query('ALTER TABLE loja.jogos ADD COLUMN IF NOT EXISTS imagem_capa_base64 TEXT;');
    console.log('Coluna imagem_capa_base64 adicionada com sucesso.');
  } catch (err) {
    console.error('Erro ao adicionar coluna:', err);
  } finally {
    await pool.end();
  }
}

run();
