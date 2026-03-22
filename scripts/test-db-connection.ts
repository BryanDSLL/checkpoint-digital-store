import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const res = await pool.query<{ table_name: string }>("SELECT table_name FROM information_schema.tables WHERE table_schema = 'loja'");
    console.log('Tabelas encontradas no schema loja:', res.rows.map(r => r.table_name).join(', '));
  } catch (err) {
    console.error('Erro ao conectar ou buscar tabelas:', err);
  } finally {
    await pool.end();
  }
}

checkTables();
