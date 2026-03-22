import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adicionando coluna tem_scraping...');
    await pool.query('ALTER TABLE loja.parceiros ADD COLUMN IF NOT EXISTS tem_scraping BOOLEAN DEFAULT FALSE;');
    console.log('Coluna tem_scraping adicionada com sucesso.');
  } catch (err) {
    console.error('Erro ao adicionar coluna:', err);
  } finally {
    await pool.end();
  }
}

run();
