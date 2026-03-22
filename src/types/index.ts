// Tipos principais da GameStore Revenda

export interface Plataforma {
  id: number;
  nome: string;
  slug: string;
  iconeUrl?: string;
  corHex: string;
  ativo: boolean;
}

export interface Categoria {
  id: number;
  nome: string;
  slug: string;
  descricao?: string;
}

export interface Parceiro {
  id: number;
  nome: string;
  slug: string;
  logoUrl?: string;
  temScraping: boolean;
  ativo: boolean;
}

export interface LinkAfiliado {
  id: number;
  jogoId: number;
  plataformaId: number;
  plataforma?: Plataforma;
  parceiroId: number;
  parceiro?: Parceiro;
  nomeLoja: string; // Mantido por compatibilidade
  logoLoja?: string;
  urlAfiliado: string;
  urlScraping?: string;
  codigoCupom?: string;
  precoLoja?: number;
  precoLojaComCupom?: number;
  tipoMidia: 'Mídia digital' | 'Mídia física' | 'Key';
  destaque: boolean;
  ativo: boolean;
  ordem: number;
}

export interface Jogo {
  id: number;
  slug: string;
  titulo: string;
  tituloOriginal?: string;
  descricao: string;
  descricaoCurta?: string;
  imagemCapa: string;
  imagemCapaBase64?: string;
  imagensGaleria?: string[];
  trailerUrl?: string;
  
  precoOriginal?: number;
  precoComCupom?: number;
  percentualDesconto: number;
  
  desenvolvedor?: string;
  publicadora?: string;
  dataLancamento?: string;
  classificacaoEtaria: string;
  
  destaque: boolean;
  destaqueHoje?: boolean;
  lancamento: boolean;
  maisVendido: boolean;
  emPromocao: boolean;
  ativo: boolean;
  
  visualizacoes: number;
  cliquesAfiliado: number;
  vendas: number;
  
  tags: string[];
  
  plataformas?: Plataforma[];
  categorias?: Categoria[];
  linksAfiliado?: LinkAfiliado[];
}

export interface FiltrosJogo {
  plataforma?: string;
  categoria?: string;
  busca?: string;
  destaque?: boolean;
  lancamento?: boolean;
  maisVendido?: boolean;
  emPromocao?: boolean;
  destaqueHoje?: boolean;
}
