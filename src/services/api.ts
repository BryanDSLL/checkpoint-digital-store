import axios from 'axios';
import { Jogo, Plataforma, Categoria, FiltrosJogo, Parceiro } from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Mapear snake_case → camelCase do jogo
function mapJogo(raw: Record<string, unknown>): Jogo {
  return {
    id: raw.id as number,
    slug: raw.slug as string,
    titulo: raw.titulo as string,
    tituloOriginal: raw.titulo_original as string | undefined,
    descricao: raw.descricao as string,
    descricaoCurta: raw.descricao_curta as string | undefined,
    imagemCapa: (raw.imagem_capa_base64 as string) || (raw.imagem_capa as string),
    imagemCapaBase64: raw.imagem_capa_base64 as string | undefined,
    imagensGaleria: raw.imagens_galeria as string[] | undefined,
    trailerUrl: raw.trailer_url as string | undefined,
    precoOriginal: raw.preco_original ? Number(raw.preco_original) : undefined,
    precoComCupom: raw.preco_com_cupom ? Number(raw.preco_com_cupom) : undefined,
    percentualDesconto: Number(raw.percentual_desconto) || 0,
    desenvolvedor: raw.desenvolvedor as string | undefined,
    publicadora: raw.publicadora as string | undefined,
    dataLancamento: raw.data_lancamento as string | undefined,
    classificacaoEtaria: (raw.classificacao_etaria as string) || 'Livre',
    destaque: Boolean(raw.destaque),
    destaqueHoje: Boolean(raw.destaque_hoje),
    lancamento: Boolean(raw.lancamento),
    maisVendido: Boolean(raw.mais_vendido),
    emPromocao: Boolean(raw.em_promocao),
    ativo: Boolean(raw.ativo),
    visualizacoes: Number(raw.visualizacoes) || 0,
    cliquesAfiliado: Number(raw.cliques_afiliado) || 0,
    vendas: Number(raw.vendas) || 0,
    tags: (raw.tags as string[]) || [],
    plataformas: (raw.plataformas as Plataforma[]) || [],
    categorias: (raw.categorias as Categoria[]) || [],
    linksAfiliado: raw.links_afiliado as Jogo['linksAfiliado'],
  };
}

export async function listarJogos(filtros?: FiltrosJogo): Promise<Jogo[]> {
  const params = new URLSearchParams();
  if (filtros?.plataforma) params.set('plataforma', filtros.plataforma);
  if (filtros?.categoria) params.set('categoria', filtros.categoria);
  if (filtros?.busca) params.set('busca', filtros.busca);
  if (filtros?.destaque) params.set('destaque', 'true');
  if (filtros?.lancamento) params.set('lancamento', 'true');
  if (filtros?.maisVendido) params.set('maisVendido', 'true');
  if (filtros?.emPromocao) params.set('emPromocao', 'true');
  if (filtros?.destaqueHoje) params.set('destaqueHoje', 'true');

  const res = await api.get(`/api/jogos?${params}`);
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map(mapJogo);
}

export async function obterJogo(slug: string): Promise<Jogo> {
  const res = await api.get(`/api/jogos/${slug}`);
  return mapJogo(res.data);
}

export async function registrarClique(jogoId: number, linkId: number): Promise<string> {
  const res = await api.post(`/api/jogos/${jogoId}/clique/${linkId}`);
  return res.data.url;
}

export async function listarPlataformas(): Promise<Plataforma[]> {
  const res = await api.get('/api/plataformas');
  const data = Array.isArray(res.data) ? res.data : [];
  return data.map((p: Record<string, any>) => ({
    id: p.id as number,
    nome: p.nome as string,
    slug: p.slug as string,
    iconeUrl: p.icone_url as string | undefined,
    corHex: p.cor_hex as string,
    ativo: p.ativo as boolean,
  }));
}

export async function listarCategorias(): Promise<Categoria[]> {
  const res = await api.get('/api/categorias');
  return Array.isArray(res.data) ? res.data : [];
}

// Admin
export function getToken() { return localStorage.getItem('gs_token'); }

export async function loginAdmin(email: string, senha: string) {
  const res = await api.post('/api/auth/login', { email, senha });
  localStorage.setItem('gs_token', res.data.token);
  localStorage.setItem('gs_user', JSON.stringify(res.data.usuario));
  return res.data;
}

const adminApi = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

export async function listarJogosAdmin() {
  const res = await api.get('/api/admin/jogos', adminApi());
  return Array.isArray(res.data) ? res.data : [];
}

export async function criarJogoAdmin(payload: Record<string, unknown>) {
  const res = await api.post('/api/admin/jogos', payload, adminApi());
  return res.data;
}

export async function atualizarJogoAdmin(id: number, payload: Record<string, unknown>) {
  await api.put(`/api/admin/jogos/${id}`, payload, adminApi());
}

export async function excluirJogoAdmin(id: number) {
  await api.delete(`/api/admin/jogos/${id}`, adminApi());
}

export async function listarLinksAdmin(jogoId: number): Promise<import('@/types').LinkAfiliado[]> {
  const res = await api.get(`/api/admin/jogos/${jogoId}/links`, adminApi());
  return Array.isArray(res.data) ? res.data : [];
}

export async function listarParceiros(): Promise<Parceiro[]> {
  const res = await api.get('/api/admin/parceiros', adminApi());
  return Array.isArray(res.data) ? res.data : [];
}

export async function criarParceiro(data: { nome: string; logoUrl?: string; logoBase64?: string; temScraping?: boolean }): Promise<Parceiro> {
  const res = await api.post('/api/admin/parceiros', data, adminApi());
  return res.data;
}

export async function atualizarParceiro(id: number, data: { nome?: string; logoUrl?: string; logoBase64?: string; temScraping?: boolean; ativo?: boolean }): Promise<void> {
  await api.put(`/api/admin/parceiros/${id}`, data, adminApi());
}

export async function excluirParceiro(id: number): Promise<void> {
  await api.delete(`/api/admin/parceiros/${id}`, adminApi());
}

export async function criarLinkAdmin(jogoId: number, payload: Record<string, unknown>) {
  const res = await api.post(`/api/admin/jogos/${jogoId}/links`, payload, adminApi());
  return res.data;
}

export async function atualizarLinkAdmin(id: number, payload: Record<string, unknown>) {
  await api.put(`/api/admin/links/${id}`, payload, adminApi());
}

export async function excluirLinkAdmin(id: number) {
  await api.delete(`/api/admin/links/${id}`, adminApi());
}

export async function obterStats() {
  const res = await api.get('/api/admin/stats', adminApi());
  return res.data;
}

export async function criarPlataformaAdmin(payload: Record<string, unknown>) {
  const res = await api.post('/api/admin/plataformas', payload, adminApi());
  return res.data;
}

export async function excluirPlataformaAdmin(id: number) {
  await api.delete(`/api/admin/plataformas/${id}`, adminApi());
}

export async function criarCategoriaAdmin(payload: Record<string, unknown>) {
  const res = await api.post('/api/admin/categorias', payload, adminApi());
  return res.data;
}

export async function excluirCategoriaAdmin(id: number) {
  await api.delete(`/api/admin/categorias/${id}`, adminApi());
}
