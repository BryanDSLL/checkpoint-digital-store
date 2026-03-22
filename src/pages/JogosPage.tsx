import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, X, Tag, Zap, TrendingUp, Star, ChevronDown } from 'lucide-react';
import { listarJogos, listarPlataformas, listarCategorias } from '@/services/api';
import { FiltrosJogo } from '@/types';
import GameCard from '@/components/GameCard';

const JogosPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [busca, setBusca] = useState(searchParams.get('busca') || '');

  const filtros: FiltrosJogo = {
    plataforma: searchParams.get('plataforma') || undefined,
    categoria: searchParams.get('categoria') || undefined,
    busca: searchParams.get('busca') || undefined,
    destaque: searchParams.get('destaque') === 'true' || undefined,
    lancamento: searchParams.get('lancamento') === 'true' || undefined,
    maisVendido: searchParams.get('maisVendido') === 'true' || undefined,
    emPromocao: searchParams.get('emPromocao') === 'true' || undefined,
  };

  const { data: jogos = [], isLoading } = useQuery({
    queryKey: ['jogos', filtros],
    queryFn: () => listarJogos(filtros),
  });

  const { data: plataformas = [] } = useQuery({ queryKey: ['plataformas'], queryFn: listarPlataformas });
  const { data: categorias = [] } = useQuery({ queryKey: ['categorias'], queryFn: listarCategorias });

  const setFiltro = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    setSearchParams(p);
  };

  const limparFiltros = () => {
    setSearchParams({});
    setBusca('');
  };

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltro('busca', busca || null);
  };

  const temFiltros = Array.from(searchParams.keys()).length > 0;

  const quickFilters = [
    { label: 'Todos', key: null },
    { label: 'Destaques', key: 'destaque', icon: <Star className="w-3 h-3" /> },
    { label: 'Lançamentos', key: 'lancamento', icon: <Zap className="w-3 h-3" /> },
    { label: 'Mais Vendidos', key: 'maisVendido', icon: <TrendingUp className="w-3 h-3" /> },
    { label: 'Promoções', key: 'emPromocao', icon: <Tag className="w-3 h-3" /> },
  ];

  const activeQuickFilter = quickFilters.find(f => f.key && searchParams.get(f.key) === 'true');

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-wide mb-2">
            {searchParams.get('busca') ? (
              <>Resultados para: <span className="text-primary">"{searchParams.get('busca')}"</span></>
            ) : searchParams.get('plataforma') ? (
              <>Jogos para <span className="text-primary capitalize">{searchParams.get('plataforma')}</span></>
            ) : searchParams.get('emPromocao') ? (
              <><span className="text-primary">Promoções</span> Imperdíveis</>
            ) : searchParams.get('lancamento') ? (
              <>Últimos <span className="text-primary">Lançamentos</span></>
            ) : (
              <>Catálogo <span className="text-primary">Completo</span></>
            )}
          </h1>
          <p className="text-muted-foreground">
            {jogos.length} {jogos.length === 1 ? 'jogo encontrado' : 'jogos encontrados'}
            {' '}com os melhores preços e cupons exclusivos
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className={`
            ${showFilters ? 'fixed inset-0 z-50 p-4 overflow-auto' : 'hidden'}
            lg:block lg:static lg:z-auto lg:p-0 lg:overflow-visible
            w-full lg:w-64 flex-shrink-0
          `}>
            {showFilters && (
              <div className="fixed inset-0 bg-black/80 lg:hidden" onClick={() => setShowFilters(false)} />
            )}
            <div className="relative glass-card p-5 rounded-xl lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-base uppercase tracking-wide flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" /> Filtros
                </h3>
                <button onClick={() => setShowFilters(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {temFiltros && (
                <button onClick={limparFiltros} className="w-full mb-4 py-2 rounded-lg border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wide hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5">
                  <X className="w-3 h-3" /> Limpar Filtros
                </button>
              )}

              {/* Plataformas */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Plataforma</h4>
                <div className="space-y-1">
                  <button onClick={() => setFiltro('plataforma', null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      !searchParams.get('plataforma') ? 'bg-primary/15 text-primary border border-primary/25' : 'text-muted-foreground hover:bg-white/5'
                    }`}>
                    Todas as Plataformas
                  </button>
                  {(() => {
                    const seen = new Set<string>();
                    return plataformas
                      .map(p => ({
                        ...p,
                        nomeSimplificado: p.nome
                          .split('(')[0]
                          .replace(/Personal Computer/i, 'PC')
                          .replace(/Computador/i, 'PC')
                          .trim()
                      }))
                      .filter(p => {
                        if (seen.has(p.nomeSimplificado)) return false;
                        seen.add(p.nomeSimplificado);
                        return true;
                      })
                      .map(p => (
                        <button key={p.id} onClick={() => setFiltro('plataforma', p.slug)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            searchParams.get('plataforma') === p.slug ? 'bg-primary/15 text-primary border border-primary/25' : 'text-muted-foreground hover:bg-white/5'
                          }`}>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.corHex }} />
                          {p.nomeSimplificado}
                        </button>
                      ));
                  })()}
                </div>
              </div>

              {/* Categorias */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Gênero</h4>
                <div className="space-y-1">
                  <button onClick={() => setFiltro('categoria', null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      !searchParams.get('categoria') ? 'bg-primary/15 text-primary border border-primary/25' : 'text-muted-foreground hover:bg-white/5'
                    }`}>
                    Todos os Gêneros
                  </button>
                  {categorias.map(c => (
                    <button key={c.id} onClick={() => setFiltro('categoria', c.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        searchParams.get('categoria') === c.slug ? 'bg-primary/15 text-primary border border-primary/25' : 'text-muted-foreground hover:bg-white/5'
                      }`}>
                      {c.nome}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Tipo</h4>
                <div className="space-y-1">
                  {[
                    { label: 'Em Promoção', key: 'emPromocao' },
                    { label: 'Lançamentos', key: 'lancamento' },
                    { label: 'Mais Vendidos', key: 'maisVendido' },
                    { label: 'Destaques', key: 'destaque' },
                  ].map(item => (
                    <button key={item.key}
                      onClick={() => setFiltro(item.key, searchParams.get(item.key) === 'true' ? null : 'true')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        searchParams.get(item.key) === 'true' ? 'bg-primary/15 text-primary border border-primary/25' : 'text-muted-foreground hover:bg-white/5'
                      }`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Search + filter bar */}
            <div className="flex gap-3 mb-6">
              <form onSubmit={handleBusca} className="flex-1 relative">
                <input value={busca} onChange={e => setBusca(e.target.value)}
                  placeholder="Buscar jogo por nome..."
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all" />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </form>
              <button onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 h-11 rounded-xl border border-white/10 text-sm font-semibold hover:border-primary/30 hover:text-primary transition-all">
                <SlidersHorizontal className="w-4 h-4" /> Filtros
                {temFiltros && <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">!</span>}
              </button>
            </div>

            {/* Quick filters */}
            <div className="flex gap-2 flex-wrap mb-6">
              {quickFilters.map(f => (
                <button key={f.label}
                  onClick={() => {
                    if (!f.key) { limparFiltros(); return; }
                    setFiltro(f.key, searchParams.get(f.key) === 'true' ? null : 'true');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    (!f.key && !activeQuickFilter) || (f.key && searchParams.get(f.key) === 'true')
                      ? 'bg-primary text-white glow-blue'
                      : 'glass text-muted-foreground hover:text-foreground hover:border-primary/20'
                  }`}>
                  {f.icon}{f.label}
                </button>
              ))}
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="glass-card rounded-xl aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : jogos.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🎮</div>
                <h3 className="font-display text-2xl font-bold mb-2">Nenhum jogo encontrado</h3>
                <p className="text-muted-foreground mb-6">Tente outros filtros ou limpe a busca</p>
                <button onClick={limparFiltros} className="px-6 py-3 rounded-xl btn-neon text-white font-bold">
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {jogos.map(j => <GameCard key={j.id} jogo={j} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JogosPage;
