import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
    if (lancamento === 'true') { where += ` AND j.lancamento = TRUE`; }
    if (emPromocao === 'true') { where += ` AND j.em_promocao = TRUE`; }
    if (destaqueHoje === 'true') { where += ` AND j.destaque_hoje = TRUE`; }

    if (plataforma) {
      where += ` AND EXISTS (
        SELECT 1 FROM loja.links_afiliado la2
        JOIN loja.plataformas p2 ON la2.plataforma_id = p2.id
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
             JOIN loja.plataformas p ON la.plataforma_id = p.id
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
             JOIN loja.plataformas p ON la.plataforma_id = p.id
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
            'plataformaId', la.plataforma_id,
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
      COALESCE(
        (SELECT json_agg(jsonb_build_object('id', p.id, 'nome', p.nome))
         FROM loja.jogos_plataformas jp
         JOIN loja.plataformas p ON p.id = jp.plataforma_id
         WHERE jp.jogo_id = j.id), '[]'
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
    SELECT la.*, p.nome as plataforma_nome, par.nome as parceiro_nome 
    FROM loja.links_afiliado la
    LEFT JOIN loja.plataformas p ON p.id = la.plataforma_id
    LEFT JOIN loja.parceiros par ON par.id = la.parceiro_id
    WHERE la.jogo_id = $1 ORDER BY la.ordem
  `, [req.params.jogoId]);
  res.json(r.rows);
});

app.post('/api/admin/jogos/:jogoId/links', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { jogoId } = req.params;
  const { plataformaId, parceiroId, urlAfiliado, urlScraping, codigoCupom, precoLoja, precoLojaComCupom, destaque, ordem, tipoMidia } = req.body;

  try {
    const pRes = await pool.query('SELECT nome FROM loja.parceiros WHERE id = $1', [parceiroId]);
    const nomeLoja = pRes.rows[0]?.nome || 'Loja';

    const r = await pool.query(`
      INSERT INTO loja.links_afiliado (jogo_id, plataforma_id, parceiro_id, nome_loja, url_afiliado, url_scraping, codigo_cupom, preco_loja, preco_lo_ja_com_cupom, destaque, ordem, tipo_midia)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id
    `, [jogoId, plataformaId, parceiroId, nomeLoja, urlAfiliado, urlScraping, codigoCupom, precoLoja, precoLojaComCupom, destaque || false, ordem || 0, tipoMidia || 'Mídia digital']);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao criar link' });
  }
});

app.put('/api/admin/links/:id', authMiddleware, async (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { urlAfiliado, urlScraping, codigoCupom, precoLoja, precoLojaComCupom, destaque, ativo, ordem, tipoMidia, parceiroId } = req.body;
  
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
        nome_loja = COALESCE($11, nome_loja)
      WHERE id = $12
    `, [urlAfiliado, urlScraping, codigoCupom, precoLoja, precoLojaComCupom, destaque, ativo, ordem, tipoMidia, parceiroId, nomeLoja, id]);
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

// No Vercel, exportamos o app para que ele seja tratado como Serverless Function
export default app;

// Mantemos o listen apenas para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🎮 Checkpoint Digital Server rodando na porta ${port}`);
  });
}
