import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: parseInt(process.env.PGPORT || '5432'),
  ssl: { rejectUnauthorized: false },
});

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET not found in environment variables.');
  // No Vercel, não queremos dar exit(1) no build, mas sim logar o erro
}

function extrairToken(auth?: string) {
  if (!auth) return null;
  const [tipo, token] = auth.split(' ');
  return tipo === 'Bearer' && token ? token : null;
}

// ──────────────────────────────────────────────
// JOGOS
// ──────────────────────────────────────────────

app.get('/api/jogos', async (req: express.Request, res: express.Response) => {
  const { plataforma, categoria, busca, destaque, lancamento, maisVendido, emPromocao, destaqueHoje } = req.query;

  try {
    let where = `WHERE j.ativo = TRUE`;
    const params: unknown[] = [];
    let i = 1;

    if (destaque === 'true') { where += ` AND j.destaque = TRUE`; }
    if (destaqueHoje === 'true') { where += ` AND j.destaque_hoje = TRUE`; }

    if (plataforma) {
      where += ` AND EXISTS (
        SELECT 1 FROM loja.links_afiliado la2
        JOIN loja.plataformas p2 ON p2.id = ANY(la2.plataformas_ids)
        WHERE la2.jogo_id = j.id AND p2.slug = $${i++} AND la2.ativo = TRUE
      )`;
      params.push(plataforma);
    }

    if (categoria) {
      where += ` AND EXISTS (
        SELECT 1 FROM loja.jogos_categorias jc2
        JOIN loja.categorias c2 ON jc2.categoria_id = c2.id
        WHERE jc2.jogo_id = j.id AND c2.slug = $${i++}
      )`;
      params.push(categoria);
    }

    if (busca) {
      where += ` AND (j.titulo ILIKE $${i} OR j.descricao_curta ILIKE $${i} OR $${i} = ANY(j.tags))`;
      params.push(`%${busca}%`);
      i++;
    }

    let order = `j.destaque DESC, j.cliques_afiliado DESC, j.created_at DESC`;
    if (maisVendido === 'true') {
      order = `j.cliques_afiliado DESC, ` + order;
    }
    
    // Se for requisição de lançamentos, não filtra pela flag, mas ordena pela data de lançamento
    if (lancamento === 'true') {
      order = `j.data_lancamento DESC NULLS LAST, ` + order;
    }
    
    // Se for requisição de em promoção, não filtra pela flag, mas ordena pelos que tem maior percentual de desconto
    if (emPromocao === 'true') {
      order = `j.percentual_desconto DESC NULLS LAST, ` + order;
    }

    if (!destaque && !lancamento && !maisVendido && !emPromocao && !destaqueHoje) {
      order = `j.destaque_hoje DESC, ` + order;
    }

    const resultado = await pool.query(`
      SELECT
        j.*,
        (SELECT MIN(preco_loja_com_cupom) FROM loja.links_afiliado WHERE jogo_id = j.id AND ativo = TRUE) as preco_com_cupom,
        (SELECT preco_loja FROM loja.links_afiliado WHERE jogo_id = j.id AND ativo = TRUE ORDER BY preco_loja_com_cupom ASC LIMIT 1) as preco_original,
        COALESCE(
          (SELECT json_agg(jsonb_build_object('id', sub.id, 'nome', sub.nome, 'slug', sub.slug, 'corHex', sub.cor_hex))
           FROM (
             SELECT DISTINCT p.id, p.nome, p.slug, p.cor_hex
             FROM loja.links_afiliado la
             JOIN loja.plataformas p ON p.id = ANY(la.plataformas_ids)
             WHERE la.jogo_id = j.id AND la.ativo = TRUE
           ) sub), '[]'
        ) AS plataformas,
        COALESCE(
          (SELECT json_agg(jsonb_build_object('id', sub_c.id, 'nome', sub_c.nome, 'slug', sub_c.slug))
           FROM (
             SELECT DISTINCT c.id, c.nome, c.slug
             FROM loja.jogos_categorias jc
             JOIN loja.categorias c ON c.id = jc.categoria_id
             WHERE jc.jogo_id = j.id
           ) sub_c), '[]'
        ) AS categorias
      FROM loja.jogos j
      ${where}
      ORDER BY ${order}
    `, params);

    res.json(resultado.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao buscar jogos' });
  }
});

app.get('/api/jogos/:slug', async (req: express.Request, res: express.Response) => {
  const { slug } = req.params;

  try {
    await pool.query(`UPDATE loja.jogos SET visualizacoes = visualizacoes + 1 WHERE slug = $1`, [slug]);

    const resultado = await pool.query(`
      SELECT
        j.*,
        (SELECT MIN(preco_loja_com_cupom) FROM loja.links_afiliado WHERE jogo_id = j.id AND ativo = TRUE) as preco_com_cupom,
        (SELECT preco_loja FROM loja.links_afiliado WHERE jogo_id = j.id AND ativo = TRUE ORDER BY preco_loja_com_cupom ASC LIMIT 1) as preco_original,
        COALESCE(
          (SELECT json_agg(jsonb_build_object('id', sub.id, 'nome', sub.nome, 'slug', sub.slug, 'corHex', sub.cor_hex))
           FROM (
             SELECT DISTINCT p.id, p.nome, p.slug, p.cor_hex
             FROM loja.links_afiliado la
             JOIN loja.plataformas p ON p.id = ANY(la.plataformas_ids)
             WHERE la.jogo_id = j.id AND la.ativo = TRUE
           ) sub), '[]'
        ) AS plataformas,
        COALESCE(
          (SELECT json_agg(jsonb_build_object('id', sub_c.id, 'nome', sub_c.nome, 'slug', sub_c.slug))
           FROM (
             SELECT DISTINCT c.id, c.nome, c.slug
             FROM loja.jogos_categorias jc
             JOIN loja.categorias c ON c.id = jc.categoria_id
             WHERE jc.jogo_id = j.id
           ) sub_c), '[]'
        ) AS categorias,
        COALESCE(
          (SELECT json_agg(jsonb_build_object(
            'id', la.id,
            'nomeLoja', COALESCE(par.nome, la.nome_loja),
            'logoLoja', COALESCE(par.logo_url, la.logo_loja),
            'urlAfiliado', la.url_afiliado,
            'urlScraping', la.url_scraping,
            'codigoCupom', la.codigo_cupom,
            'precoLoja', la.preco_loja,
            'precoLojaComCupom', la.preco_loja_com_cupom,
            'tipoMidia', la.tipo_midia,
            'destaque', la.destaque,
            'plataformasIds', la.plataformas_ids,
            'plataformasInfo', (SELECT json_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'slug', p.slug, 'corHex', p.cor_hex)) FROM loja.plataformas p WHERE p.id = ANY(la.plataformas_ids)),
            'parceiroId', la.parceiro_id,
            'ordem', la.ordem,
            'parceiro', CASE WHEN par.id IS NOT NULL THEN 
              jsonb_build_object('id', par.id, 'nome', par.nome, 'slug', par.slug, 'logoUrl', par.logo_url, 'logoBase64', par.logo_base64)
            ELSE NULL END
          )) FROM loja.links_afiliado la 
          LEFT JOIN loja.parceiros par ON par.id = la.parceiro_id
          WHERE la.jogo_id = j.id AND la.ativo = TRUE), '[]'
        ) AS links_afiliado
      FROM loja.jogos j
      WHERE j.slug = $1 AND j.ativo = TRUE
    `, [slug]);

    if (!resultado.rows[0]) {
      res.status(404).json({ erro: 'Jogo não encontrado' });
      return;
    }

    res.json(resultado.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao buscar jogo' });
  }
});

app.post('/api/jogos/:jogoId/clique/:linkId', async (req: express.Request, res: express.Response) => {
  const { jogoId, linkId } = req.params;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'];

  try {
    await pool.query(`UPDATE loja.jogos SET cliques_afiliado = cliques_afiliado + 1 WHERE id = $1`, [jogoId]);
    await pool.query(`
      INSERT INTO loja.log_cliques (link_id, jogo_id, ip_origem, user_agent)
      VALUES ($1, $2, $3, $4)
    `, [linkId, jogoId, ip, ua]);

    const link = await pool.query(`SELECT url_afiliado FROM loja.links_afiliado WHERE id = $1`, [linkId]);
    if (link.rows[0]) {
      res.json({ url: link.rows[0].url_afiliado });
    } else {
      res.status(404).json({ erro: 'Link não encontrado' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao registrar clique' });
  }
});

// ──────────────────────────────────────────────
// PLATAFORMAS E CATEGORIAS
// ──────────────────────────────────────────────

app.get('/api/plataformas', async (_req: express.Request, res: express.Response) => {
  const r = await pool.query(`SELECT * FROM loja.plataformas WHERE ativo = TRUE ORDER BY nome`);
  res.json(r.rows);
});

app.get('/api/categorias', async (_req: express.Request, res: express.Response) => {
  const r = await pool.query(`SELECT * FROM loja.categorias WHERE ativo = TRUE ORDER BY nome`);
  res.json(r.rows);
});

// ──────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────

app.post('/api/auth/login', async (req: express.Request, res: express.Response) => {
  const { email, senha } = req.body as { email?: string; senha?: string };
  if (!email || !senha) { res.status(400).json({ erro: 'Email e senha obrigatórios' }); return; }

  try {
    const r = await pool.query(`SELECT * FROM loja.usuarios WHERE email = $1`, [email]);
    if (!r.rows[0]) { res.status(401).json({ erro: 'Credenciais inválidas' }); return; }
    const user = r.rows[0];
    const ok = await bcrypt.compare(senha, user.senha_hash);
    if (!ok) { res.status(401).json({ erro: 'Credenciais inválidas' }); return; }
    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET as string, { expiresIn: '8h' });
    res.json({ token, usuario: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
  } catch (e) {
    res.status(500).json({ erro: 'Erro interno' });
  }
});

// ──────────────────────────────────────────────
// ADMIN – JOGOS
// ──────────────────────────────────────────────

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = extrairToken(req.headers.authorization);
  if (!token) { res.status(401).json({ erro: 'Não autorizado' }); return; }
  try { jwt.verify(token as string, JWT_SECRET as string); next(); }
  catch { res.status(401).json({ erro: 'Token inválido' }); }
}

app.get('/api/admin/jogos', authMiddleware, async (_req: express.Request, res: express.Response) => {
  const r = await pool.query(`
    SELECT 
      j.*, 
      COUNT(la.id) as total_links,
      (SELECT MIN(preco_loja_com_cupom) FROM loja.links_afiliado WHERE jogo_id = j.id AND ativo = TRUE) as preco_com_cupom,
      (SELECT preco_loja FROM loja.links_afiliado WHERE jogo_id = j.id AND ativo = TRUE ORDER BY preco_loja_com_cupom ASC LIMIT 1) as preco_original,
      COALESCE(
        (SELECT json_agg(jsonb_build_object('id', sub.id, 'nome', sub.nome))
         FROM (
           SELECT DISTINCT p.id, p.nome
           FROM loja.links_afiliado sub_la
           JOIN loja.plataformas p ON p.id = ANY(sub_la.plataformas_ids)
           WHERE sub_la.jogo_id = j.id
         ) sub), '[]'
      ) as plataformas,
      COALESCE(
        (SELECT json_agg(jsonb_build_object('id', c.id, 'nome', c.nome))
         FROM loja.jogos_categorias jc
         JOIN loja.categorias c ON c.id = jc.categoria_id
         WHERE jc.jogo_id = j.id), '[]'
      ) as categorias
    FROM loja.jogos j 
    LEFT JOIN loja.links_afiliado la ON la.jogo_id = j.id 
    GROUP BY j.id 
    ORDER BY j.id DESC
  `);
  res.json(r.rows);
});

app.post('/api/admin/jogos', authMiddleware, async (req: express.Request, res: express.Response) => {
  const {
    slug, titulo, tituloOriginal, descricao, descricaoCurta, imagemCapa, imagensGaleria,
    trailerUrl, precoOriginal, precoComCupom, percentualDesconto, desenvolvedor, publicadora,
    dataLancamento, classificacaoEtaria, destaque, lancamento, maisVendido, emPromocao, tags,
    plataformas, categorias, destaqueHoje, imagemCapaBase64
  } = req.body;

  try {
    if (destaqueHoje) {
      await pool.query(`UPDATE loja.jogos SET destaque_hoje = FALSE`);
    }

    const r = await pool.query(`
      INSERT INTO loja.jogos (
        slug, titulo, titulo_original, descricao, descricao_curta, imagem_capa, imagens_galeria,
        trailer_url, preco_original, preco_com_cupom, percentual_desconto, desenvolvedor, publicadora,
        data_lancamento, classificacao_etaria, destaque, lancamento, mais_vendido, em_promocao, tags,
        destaque_hoje, imagem_capa_base64
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING id
    `, [slug, titulo, tituloOriginal, descricao, descricaoCurta, imagemCapa || '', imagensGaleria,
        trailerUrl, precoOriginal, precoComCupom, percentualDesconto || 0, desenvolvedor, publicadora,
        dataLancamento, classificacaoEtaria || 'Livre', destaque || false, lancamento || false,
        maisVendido || false, emPromocao || false, tags || [], destaqueHoje || false, imagemCapaBase64]);

    const jogoId = r.rows[0].id;

    if (categorias?.length) {
      for (const cid of categorias) {
        await pool.query(`INSERT INTO loja.jogos_categorias (jogo_id, categoria_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [jogoId, cid]);
      }
    }

    res.status(201).json({ id: jogoId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao criar jogo' });
  }
});

app.put('/api/admin/jogos/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const fields = req.body;

  try {
    if (fields.destaqueHoje === true || fields.destaqueHoje === 'true') {
      await pool.query(`UPDATE loja.jogos SET destaque_hoje = FALSE`);
    }

    await pool.query(`
      UPDATE loja.jogos SET
        slug = $1, titulo = $2,
        descricao = $3, descricao_curta = $4,
        imagem_capa = $5, preco_original = $6,
        preco_com_cupom = $7, percentual_desconto = $8,
        desenvolvedor = $9, publicadora = $10,
        classificacao_etaria = $11,
        destaque = $12, lancamento = $13,
        mais_vendido = $14, em_promocao = $15,
        ativo = $16, tags = $17,
        destaque_hoje = $18,
        imagem_capa_base64 = $19,
        cliques_afiliado = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21
    `, [
      fields.slug, fields.titulo, fields.descricao, fields.descricaoCurta, fields.imagemCapa,
      fields.precoOriginal, fields.precoComCupom, fields.percentualDesconto, fields.desenvolvedor,
      fields.publicadora, fields.classificacaoEtaria, 
      fields.destaque || false, 
      fields.lancamento || false,
      fields.maisVendido || false, 
      fields.emPromocao || false, 
      fields.ativo ?? true, 
      fields.tags || [], 
      fields.destaqueHoje || false, 
      fields.imagemCapaBase64,
      fields.cliquesAfiliado || 0,
      id
    ]);

    if (fields.categorias) {
      await pool.query(`DELETE FROM loja.jogos_categorias WHERE jogo_id = $1`, [id]);
      for (const cid of fields.categorias) {
        await pool.query(`INSERT INTO loja.jogos_categorias (jogo_id, categoria_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id, cid]);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao atualizar' });
  }
});

app.delete('/api/admin/jogos/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM loja.log_cliques WHERE jogo_id = $1`, [id]);
    await pool.query(`DELETE FROM loja.links_afiliado WHERE jogo_id = $1`, [id]);
    await pool.query(`DELETE FROM loja.jogos_plataformas WHERE jogo_id = $1`, [id]);
    await pool.query(`DELETE FROM loja.jogos_categorias WHERE jogo_id = $1`, [id]);
    await pool.query(`DELETE FROM loja.jogos WHERE id = $1`, [id]);
    res.status(204).send();
  } catch (e) {
    console.error('Erro ao excluir jogo:', e);
    res.status(500).json({ erro: 'Erro ao excluir jogo. Verifique se existem dependências.' });
  }
});

// ──────────────────────────────────────────────
// ADMIN – PARCEIROS
// ──────────────────────────────────────────────

app.get('/api/admin/parceiros', authMiddleware, async (_req: express.Request, res: express.Response) => {
  const r = await pool.query(`SELECT *, tem_scraping as "temScraping", logo_base64 as "logoBase64" FROM loja.parceiros ORDER BY nome`);
  res.json(r.rows);
});

app.post('/api/admin/parceiros', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { nome, logoUrl, logoBase64, temScraping } = req.body;
  const slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-');
  try {
    const r = await pool.query(
      `INSERT INTO loja.parceiros (nome, slug, logo_url, logo_base64, tem_scraping) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [nome, slug, logoUrl, logoBase64, temScraping || false]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao criar parceiro' });
  }
});

app.put('/api/admin/parceiros/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { nome, logoUrl, logoBase64, temScraping, ativo } = req.body;
  try {
    let slug = undefined;
    if (nome) slug = nome.toLowerCase().replace(/[^a-z0-9]/g, '-');

    await pool.query(
      `UPDATE loja.parceiros SET 
        nome = COALESCE($1, nome), 
        slug = COALESCE($2, slug), 
        logo_url = COALESCE($3, logo_url), 
        logo_base64 = COALESCE($4, logo_base64), 
        tem_scraping = COALESCE($5, tem_scraping), 
        ativo = COALESCE($6, ativo) 
      WHERE id = $7`,
      [nome, slug, logoUrl, logoBase64, temScraping, ativo, id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao atualizar parceiro' });
  }
});

app.delete('/api/admin/parceiros/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    await pool.query(`DELETE FROM loja.parceiros WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao excluir parceiro' });
  }
});

// ──────────────────────────────────────────────
// ADMIN – LINKS AFILIADO
// ──────────────────────────────────────────────

app.get('/api/admin/jogos/:jogoId/links', authMiddleware, async (req: express.Request, res: express.Response) => {
  const r = await pool.query(`
    SELECT la.*, 
      (SELECT json_agg(jsonb_build_object('id', p.id, 'nome', p.nome, 'slug', p.slug, 'corHex', p.cor_hex)) FROM loja.plataformas p WHERE p.id = ANY(la.plataformas_ids)) as plataformas_info,
      par.nome as parceiro_nome 
    FROM loja.links_afiliado la
    LEFT JOIN loja.parceiros par ON par.id = la.parceiro_id
    WHERE la.jogo_id = $1 ORDER BY la.ordem
  `, [req.params.jogoId]);
  res.json(r.rows);
});

app.post('/api/admin/jogos/:jogoId/links', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { jogoId } = req.params;
  const { plataformasIds, parceiroId, urlAfiliado, urlScraping, codigoCupom, precoLoja, precoLojaComCupom, destaque, ordem, tipoMidia } = req.body;

  try {
    const pRes = await pool.query('SELECT nome FROM loja.parceiros WHERE id = $1', [parceiroId]);
    const nomeLoja = pRes.rows[0]?.nome || 'Loja';

    const r = await pool.query(`
      INSERT INTO loja.links_afiliado (jogo_id, plataformas_ids, parceiro_id, nome_loja, url_afiliado, url_scraping, codigo_cupom, preco_loja, preco_lo_ja_com_cupom, destaque, ordem, tipo_midia)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id
    `, [jogoId, plataformasIds || [], parceiroId, nomeLoja, urlAfiliado, urlScraping, codigoCupom, precoLoja, precoLojaComCupom, destaque || false, ordem || 0, tipoMidia || 'Mídia digital']);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao criar link' });
  }
});

app.put('/api/admin/links/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { urlAfiliado, urlScraping, codigoCupom, precoLoja, precoLojaComCupom, destaque, ativo, ordem, tipoMidia, parceiroId, plataformasIds } = req.body;
  
  try {
    let nomeLoja = undefined;
    if (parceiroId) {
      const pRes = await pool.query('SELECT nome FROM loja.parceiros WHERE id = $1', [parceiroId]);
      nomeLoja = pRes.rows[0]?.nome;
    }

    await pool.query(`
      UPDATE loja.links_afiliado SET
        url_afiliado = COALESCE($1, url_afiliado),
        url_scraping = COALESCE($2, url_scraping),
        codigo_cupom = COALESCE($3, codigo_cupom), 
        preco_loja = COALESCE($4, preco_loja),
        preco_loja_com_cupom = COALESCE($5, preco_loja_com_cupom),
        destaque = COALESCE($6, destaque), 
        ativo = COALESCE($7, ativo), 
        ordem = COALESCE($8, ordem),
        tipo_midia = COALESCE($9, tipo_midia),
        parceiro_id = COALESCE($10, parceiro_id),
        nome_loja = COALESCE($11, nome_loja),
        plataformas_ids = COALESCE($12, plataformas_ids)
      WHERE id = $13
    `, [urlAfiliado, urlScraping, codigoCupom, precoLoja, precoLojaComCupom, destaque, ativo, ordem, tipoMidia, parceiroId, nomeLoja, plataformasIds, id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao atualizar link' });
  }
});

app.delete('/api/admin/links/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  await pool.query(`DELETE FROM loja.links_afiliado WHERE id = $1`, [req.params.id]);
  res.status(204).send();
});

// ──────────────────────────────────────────────
// ADMIN – STATS
// ──────────────────────────────────────────────

app.get('/api/admin/stats', authMiddleware, async (_req: express.Request, res: express.Response) => {
  try {
    const [jogos, links, cliques, top] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM loja.jogos WHERE ativo = TRUE`),
      pool.query(`SELECT COUNT(*) FROM loja.links_afiliado WHERE ativo = TRUE`),
      pool.query(`SELECT COUNT(*) FROM loja.log_cliques WHERE created_at > NOW() - INTERVAL '30 days'`),
      pool.query(`SELECT titulo, cliques_afiliado, visualizacoes FROM loja.jogos ORDER BY cliques_afiliado DESC LIMIT 5`),
    ]);
    res.json({
      totalJogos: jogos.rows[0].count,
      totalLinks: links.rows[0].count,
      cliques30Dias: cliques.rows[0].count,
      topJogos: top.rows,
    });
  } catch (e) {
    res.status(500).json({ erro: 'Erro ao buscar stats' });
  }
});

// ──────────────────────────────────────────────
// ADMIN – PLATAFORMAS & CATEGORIAS
// ──────────────────────────────────────────────

app.post('/api/admin/plataformas', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { nome, slug, corHex, icone } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO loja.plataformas (nome, slug, cor_hex, icone) VALUES ($1, $2, $3, $4) RETURNING id`,
      [nome, slug, corHex, icone]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ erro: 'Erro ao criar plataforma' }); }
});

app.delete('/api/admin/plataformas/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    await pool.query(`DELETE FROM loja.plataformas WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (e) { res.status(500).json({ erro: 'Erro ao excluir plataforma' }); }
});

app.post('/api/admin/categorias', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { nome, slug, icone } = req.body;
  try {
    const r = await pool.query(
      `INSERT INTO loja.categorias (nome, slug, icone) VALUES ($1, $2, $3) RETURNING id`,
      [nome, slug, icone]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ erro: 'Erro ao criar categoria' }); }
});

app.delete('/api/admin/categorias/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  try {
    await pool.query(`DELETE FROM loja.categorias WHERE id = $1`, [req.params.id]);
    res.status(204).send();
  } catch (e) { res.status(500).json({ erro: 'Erro ao excluir categoria' }); }
});

// ──────────────────────────────────────────────
// ADMIN – AUTOMACAO
// ──────────────────────────────────────────────

async function enriquecerComIA(titulo: string, descricaoOriginal: string, url: string = '', precoSugerido: number | null = null, dataSugerida: string | null = null, produtoraSugerida: string | null = null) {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  
  if (!openaiKey && !openrouterKey && !geminiKey) return null;

  try {
    const prompt = `
      Você é um especialista em games para a loja "Checkpoint Digital".
      Com base no título "${titulo}", na descrição bruta "${descricaoOriginal}", na URL "${url}", no preço extraído "${precoSugerido || 'não identificado'}" e na data de lançamento encontrada na página "${dataSugerida || 'não identificada'}", gere um JSON estritamente no formato abaixo:
      {
        "tituloLimpo": "Apenas o nome do jogo (ex: Resident Evil Requiem)",
        "descricaoLonga": "Uma descrição envolvente, completa e profissional do jogo em HTML (use apenas <p>, <br>, <strong>)",
        "descricaoCurta": "Um resumo de no máximo 150 caracteres para chamar atenção",
        "classificacaoEtaria": "Livre, 10+, 12+, 14+, 16+ ou 18+",
        "tags": ["tag1", "tag2", "tag3", "tag4"],
        "desenvolvedor": "${produtoraSugerida || 'Nome da empresa desenvolvedora'}",
        "publicadora": "Nome da empresa publicadora",
        "plataformaSugerida": "PC (Steam), PlayStation 5, Xbox Series X/S ou Nintendo Switch",
        "precoOriginal": ${precoSugerido || 299.90},
        "precoComCupom": ${(precoSugerido ? (precoSugerido * 0.95) : 284.90).toFixed(2)}
      }
      Regras CRÍTICAS:
      1. Título: DEVE conter APENAS o nome do jogo.
      2. Preço: Use o "precoOriginal" de ${precoSugerido || 299.90} e o "precoComCupom" com EXATAMENTE 5% de desconto.
      3. Descrição: Use PT-BR e HTML básico.
      4. IMPORTANTE: NÃO INVENTE ou sugira qualquer "dataLancamento" no seu retorno. Ignore datas se não for solicitado explicitamente.
      5. PUBLICADORA: Se a desenvolvedora for conhecida (ex: Rockstar), infira a publicadora correta (ex: Take Two). Se não tiver certeza absoluta, repita o nome da desenvolvedora no campo publicadora.
    `;

    let texto = '';

    if (openaiKey) {
      // Usar a API nativa da OpenAI com o modelo mais econômico (gpt-4o-mini)
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      texto = response.data.choices[0].message.content;
    } else if (openrouterKey) {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'Checkpoint Digital'
          }
        }
      );
      texto = response.data.choices[0].message.content;
      texto = texto.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    } else {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        }
      );
      texto = response.data.candidates[0].content.parts[0].text;
    }

    return JSON.parse(texto);
  } catch (e: any) {
    if (e.response) {
      console.error('Erro Gemini API:', e.response.status, JSON.stringify(e.response.data));
    } else {
      console.error('Erro ao chamar IA:', e.message);
    }
    return null;
  }
}

async function extrairMetadados(url: string) {
  try {
    const { data: html } = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
      timeout: 5000
    });

    const getMeta = (prop: string) => {
      const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
      return match ? match[1] : null;
    };

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    
    // Tentar extrair preço do HTML caso não esteja em meta tags
    const precoMatch = html.match(/R\$\s?(\d+[.,]\d{2})/i) || html.match(/price["']?\s*:\s*["']?(\d+[.,]\d{2})/i);
    let precoExtraido = precoMatch ? precoMatch[1].replace(',', '.') : null;

    const meses: { [key: string]: string } = {
      janeiro: '01', fevereiro: '02', março: '03', abril: '04', maio: '05', junho: '06',
      julho: '07', agosto: '08', setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
    };

    // Extração de ESPECIFICAÇÕES convertendo HTML para texto limpo
    const labels = ['Plataforma', 'Gênero', 'Genero', 'Produtora', 'Publicadora', 'Idioma', 'Legenda', 'Tamanho', 'Data de Lançamento', 'Desenvolvedora', 'Classificação'];
    const labelPattern = labels.join('|');

    const plainText = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<[^>]+>/g, ' ') // remove todas as outras tags
      .replace(/&nbsp;/g, ' ')
      .replace(/[ \t]+/g, ' '); // colapsa múltiplos espaços horizontais

    const getSpec = (label: string) => {
      const regex = new RegExp(`${label}:\\s*(.*?)(?=\\s*(?:${labelPattern}):|\\n|$)`, 'i');
      const match = plainText.match(regex);
      if (match) {
        let val = match[1].trim();
        if (val.length > 100) val = val.substring(0, 100).trim();
        return val;
      }
      return null;
    };

    const plataformaPagina = getSpec('Plataforma');
    const produtoraPagina = getSpec('Produtora') || getSpec('Desenvolvedora');
    const publicadoraPagina = getSpec('Publicadora');
    const generoPagina = getSpec('Gênero') || getSpec('Genero');
    const dataPaginaLabel = getSpec('Data de Lançamento');

    let dataExtraida = null;
    
    // PRIORIDADE ÚNICA: Data de Lançamento explícita na seção de especificações
    if (dataPaginaLabel) {
      const dMatchSpec = dataPaginaLabel.match(/(\d{1,2})(?:\s|&nbsp;)+(?:de(?:\s|&nbsp;)+)?(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s|&nbsp;)+(?:de(?:\s|&nbsp;)+)?(\d{4})/i);
      if (dMatchSpec) {
        const dia = dMatchSpec[1].padStart(2, '0');
        const mes = meses[dMatchSpec[2].toLowerCase()];
        const ano = dMatchSpec[3];
        dataExtraida = `${ano}-${mes}-${dia}`;
      } else {
        // Tenta formato DD/MM/YYYY dentro do label
        const dMatchSimple = dataPaginaLabel.match(/(\d{2})\/(\d{2})\/(\d{4})/);
        if (dMatchSimple) dataExtraida = `${dMatchSimple[3]}-${dMatchSimple[2]}-${dMatchSimple[1]}`;
      }
    }

    return {
      titulo: getMeta('og:title') || getMeta('twitter:title') || (titleMatch ? titleMatch[1] : 'Jogo sem título'),
      descricao: getMeta('og:description') || getMeta('twitter:description') || getMeta('description') || '',
      imagem: getMeta('og:image') || getMeta('twitter:image') || null,
      preco: precoExtraido ? parseFloat(precoExtraido) : (getMeta('product:price:amount') ? parseFloat(getMeta('product:price:amount')!) : null),
      dataLancamento: dataExtraida,
      plataforma: plataformaPagina,
      produtora: produtoraPagina,
      publicadora: publicadoraPagina,
      genero: generoPagina
    };
  } catch (e) {
    return null;
  }
}

app.post('/api/admin/automacao/importar-links', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { links } = req.body as { links: string[] };
  
  if (!links || !Array.isArray(links) || links.length === 0) {
    res.status(400).json({ erro: 'Forneça uma lista de links' });
    return;
  }

  const resultados = [];
  const parceirosRes = await pool.query('SELECT * FROM loja.parceiros WHERE ativo = TRUE');
  const parceiros = parceirosRes.rows;

  for (const url of links) {
    try {
      const urlClean = url.trim();
      if (!urlClean) continue;

      const urlObj = new URL(urlClean);
      const dominio = urlObj.hostname.replace('www.', '');
      
      const parceiro = parceiros.find(p => 
        urlClean.includes(p.slug) || 
        (p.logo_url && p.logo_url.includes(dominio)) ||
        dominio.includes(p.nome.toLowerCase().replace(/\s/g, ''))
      );

      if (!parceiro) {
        resultados.push({ url: urlClean, status: 'erro', mensagem: 'Parceiro não cadastrado' });
        continue;
      }

      const meta = await extrairMetadados(urlClean);
      if (!meta) {
        resultados.push({ url: urlClean, status: 'erro', mensagem: 'Não foi possível acessar a página do jogo' });
        continue;
      }

      // Enriquecer com IA (Sempre chamamos para obter preços e metadados, mesmo se o jogo já existir)
      const dadosIA = await enriquecerComIA(meta.titulo, meta.descricao, urlClean, meta.preco, meta.dataLancamento, meta.produtora);
      const tituloFinal = dadosIA?.tituloLimpo || meta.titulo;

      // Dados prioritários da página (conforme solicitado pelo usuário)
      // Se encontramos na página, usamos o da página. NADA de IA para data de lançamento.
      const dataLancamentoFinal = meta.dataLancamento || null;
      const publicadoraFinal = meta.publicadora || dadosIA?.publicadora || meta.produtora || '';
      
      // -- NOVO: Inferência por URL (muito útil para Rafa Gamer e similares) --
      let plataformasDaUrl: string[] = [];
      const urlLower = urlClean.toLowerCase();
      if (urlLower.includes('-ps5') || urlLower.includes('playstation-5')) plataformasDaUrl.push('PlayStation 5');
      if (urlLower.includes('-ps4') || urlLower.includes('playstation-4')) plataformasDaUrl.push('PlayStation 4');
      if (urlLower.includes('-xbox-series') || urlLower.includes('-xsx')) plataformasDaUrl.push('Xbox Series');
      if (urlLower.includes('-xbox-one')) plataformasDaUrl.push('Xbox One');
      if (urlLower.includes('-nintendo-switch') || urlLower.includes('-switch')) plataformasDaUrl.push('Nintendo Switch');
      if (urlLower.includes('-pc') || urlLower.includes('steam')) plataformasDaUrl.push('PC');

      // Prioridade: URL > Página (Scraping) > IA
      let plataformasSugeridas: string[] = [];
      if (plataformasDaUrl.length > 0) {
        plataformasSugeridas = plataformasDaUrl;
      } else {
        const fall = meta.plataforma || dadosIA?.plataformaSugerida;
        if (fall) plataformasSugeridas.push(fall);
      }

      // Criar Slug único baseado no título limpo
      let baseSlug = tituloFinal.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Verificar se jogo já existe pelo slug ou título
      const jogoExistente = await pool.query('SELECT id, slug FROM loja.jogos WHERE slug = $1 OR titulo ILIKE $2', [baseSlug, tituloFinal]);
      
      let jogoId;
      let novoJogo = false;
      if (jogoExistente.rows.length > 0) {
        jogoId = jogoExistente.rows[0].id;
        
        // Se já existe, vamos atualizar o título e data de lançamento caso a IA tenha encontrado algo melhor
        const updateFields = [];
        const updateParams = [];
        let paramIdx = 1;

        if (dadosIA?.tituloLimpo) {
          updateFields.push(`titulo = $${paramIdx++}`);
          updateParams.push(dadosIA.tituloLimpo);
        }
        if (dataLancamentoFinal) {
          updateFields.push(`data_lancamento = $${paramIdx++}`);
          updateParams.push(dataLancamentoFinal);
        }
        if (publicadoraFinal) {
          updateFields.push(`publicadora = $${paramIdx++}`);
          updateParams.push(publicadoraFinal);
        }

        if (updateFields.length > 0) {
          updateParams.push(jogoId);
          await pool.query(`UPDATE loja.jogos SET ${updateFields.join(', ')} WHERE id = $${paramIdx}`, updateParams);
        }
      } else {
        const descricaoFinal = dadosIA?.descricaoLonga || meta.descricao;
        const descricaoCurtaFinal = dadosIA?.descricaoCurta || meta.descricao.substring(0, 150);
        const classificacaoFinal = dadosIA?.classificacaoEtaria || 'Livre';
        const tagsFinal = dadosIA?.tags || [];
        // Se temos produtora da página, usamos como desenvolvedor também caso a IA não traga
        const desenvolvedorFinal = meta.produtora || dadosIA?.desenvolvedor || '';

        // Criar novo jogo usando o título limpo
        const insJogo = await pool.query(
          `INSERT INTO loja.jogos (
            slug, titulo, descricao, descricao_curta, imagem_capa, 
            classificacao_etaria, tags, desenvolvedor, publicadora, data_lancamento, ativo
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE) RETURNING id`,
          [
            baseSlug, tituloFinal, descricaoFinal, descricaoCurtaFinal, meta.imagem || '', 
            classificacaoFinal, tagsFinal, desenvolvedorFinal, publicadoraFinal, dataLancamentoFinal
          ]
        );
        jogoId = insJogo.rows[0].id;
        novoJogo = true;

        // Tentar associar plataforma sugerida (prioridade para o que veio da página)
        if (plataformasSugeridas.length > 0) {
          for (const plat of plataformasSugeridas) {
            let buscaPlat = plat;
            if (buscaPlat.toLowerCase().includes('xbox series')) buscaPlat = 'Xbox Series';
            else if (buscaPlat.toLowerCase().includes('ps5') || buscaPlat.toLowerCase() === 'playstation 5') buscaPlat = 'PlayStation 5';
            else if (buscaPlat.toLowerCase().includes('ps4') || buscaPlat.toLowerCase() === 'playstation 4') buscaPlat = 'PlayStation 4';

            const platRes = await pool.query('SELECT id FROM loja.plataformas WHERE nome ILIKE $1 OR slug ILIKE $1', [`%${buscaPlat}%`]);
            if (platRes.rows.length > 0) {
              await pool.query('INSERT INTO loja.jogos_plataformas (jogo_id, plataforma_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [jogoId, platRes.rows[0].id]);
            }
          }
        }
      }

      // Descobrir a plataforma final para salvar no link de afiliado
      let plataformasIdsParaLink: number[] = [];
      if (plataformasSugeridas.length > 0) {
        for (const plat of plataformasSugeridas) {
          let buscaPlat = plat;
          if (buscaPlat.toLowerCase().includes('xbox series')) buscaPlat = 'Xbox Series';
          else if (buscaPlat.toLowerCase().includes('ps5') || buscaPlat.toLowerCase() === 'playstation 5') buscaPlat = 'PlayStation 5';
          else if (buscaPlat.toLowerCase().includes('ps4') || buscaPlat.toLowerCase() === 'playstation 4') buscaPlat = 'PlayStation 4';

          const platRes = await pool.query('SELECT id FROM loja.plataformas WHERE nome ILIKE $1 OR slug ILIKE $1', [`%${buscaPlat}%`]);
          if (platRes.rows.length > 0 && !plataformasIdsParaLink.includes(platRes.rows[0].id)) {
            plataformasIdsParaLink.push(platRes.rows[0].id);
          }
        }
      }

      // Preços vindos da IA
      const precoOriginal = dadosIA?.precoOriginal || 0;
      const precoComCupom = dadosIA?.precoComCupom || 0;

      // Configuração de Destaque e Cupom para Rafa Gamer
      const isRafaGamer = parceiro.nome.toLowerCase().includes('rafa gamer') || urlClean.includes('rafagamer.com');
      const destaqueFinal = isRafaGamer ? true : false;
      const cupomFinal = isRafaGamer ? 'CP-DIGITAL' : null;

      // Adicionar Link de Afiliado com preços
      // Primeiro verificamos se o link já existe para este jogo e parceiro (evita duplicatas e erro de constraint)
      const linkExistente = await pool.query(
        'SELECT id FROM loja.links_afiliado WHERE jogo_id = $1 AND parceiro_id = $2 AND url_afiliado = $3',
        [jogoId, parceiro.id, urlClean]
      );

      if (linkExistente.rows.length > 0) {
        await pool.query(
          `UPDATE loja.links_afiliado SET 
            preco_loja = $1, 
            preco_loja_com_cupom = $2, 
            codigo_cupom = COALESCE($3, codigo_cupom), 
            destaque = $4,
            plataformas_ids = COALESCE($5, plataformas_ids)
          WHERE id = $6`,
          [precoOriginal, precoComCupom, cupomFinal, destaqueFinal, plataformasIdsParaLink.length ? plataformasIdsParaLink : null, linkExistente.rows[0].id]
        );
      } else {
        await pool.query(
          `INSERT INTO loja.links_afiliado (jogo_id, parceiro_id, plataformas_ids, url_afiliado, nome_loja, preco_loja, preco_loja_com_cupom, codigo_cupom, destaque, ativo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)`,
          [jogoId, parceiro.id, plataformasIdsParaLink, urlClean, parceiro.nome, precoOriginal, precoComCupom, cupomFinal, destaqueFinal]
        );
      }

      resultados.push({ 
        url: urlClean, 
        status: 'sucesso', 
        jogo: meta.titulo,
        parceiro: parceiro.nome,
        novoJogo: novoJogo
      });

    } catch (e) {
      console.error(e);
      resultados.push({ url, status: 'erro', mensagem: 'Erro interno ao processar link' });
    }
  }

  res.json({ resultados });
});

app.post('/api/admin/automacao/ajustar-ia', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { titulo, descricao } = req.body;
  if (!titulo) {
    res.status(400).json({ erro: 'Título é obrigatório' });
    return;
  }
  const dadosIA = await enriquecerComIA(titulo, descricao || '');
  if (!dadosIA) {
    res.status(500).json({ erro: 'Falha ao processar com IA' });
    return;
  }
  res.json(dadosIA);
});

// No Vercel, exportamos o app para que ele seja tratado como Serverless Function
export default app;

// Mantemos o listen apenas para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🎮 Checkpoint Digital Server rodando na porta ${port}`);
  });
}
