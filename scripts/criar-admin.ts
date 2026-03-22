import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function criarAdmin(nome: string, email: string, senha: string) {
  try {
    const hash = await bcrypt.hash(senha, 10);
    const res = await pool.query(
      `INSERT INTO loja.usuarios (nome, email, senha_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO UPDATE SET senha_hash = $3
       RETURNING id, nome, email, role`,
      [nome, email, hash]
    );
    console.log('✅ Admin criado/atualizado:', res.rows[0]);
  } catch (err) {
    console.error('❌ Erro:', err);
  } finally {
    await pool.end();
  }
}

const [, , nome, email, senha] = process.argv;

if (!nome || !email || !senha) {
  console.log('Uso: npx tsx scripts/criar-admin.ts "Nome" "email@exemplo.com" "senha123"');
  process.exit(1);
}

criarAdmin(nome, email, senha);
