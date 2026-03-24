import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingCart, Tag, Shield, ExternalLink, ArrowLeft, Star,
  Clock, Users, ChevronRight, Zap, Info, Copy, Check,
} from 'lucide-react';
import { obterJogo, registrarClique, listarJogos } from '@/services/api';
import { LinkAfiliado } from '@/types';
import GameCard from '@/components/GameCard';

const JogoPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [cupomCopiado, setCupomCopiado] = useState<number | null>(null);
  const [carregandoLink, setCarregandoLink] = useState<number | null>(null);

  const { data: jogo, isLoading, isError } = useQuery({
    queryKey: ['jogo', slug],
    queryFn: () => obterJogo(slug!),
    enabled: !!slug,
  });

  const { data: relacionados = [] } = useQuery({
    queryKey: ['jogos', 'todos'],
    queryFn: () => listarJogos(),
    select: data => data.filter(j => j.slug !== slug).slice(0, 4),
  });

  const formatPreco = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleComprar = async (link: LinkAfiliado) => {
    if (!jogo) return;
    setCarregandoLink(link.id);
    try {
      const url = await registrarClique(jogo.id, link.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(link.urlAfiliado, '_blank', 'noopener,noreferrer');
    } finally {
      setCarregandoLink(null);
    }
  };

  const copiarCupom = (linkId: number, cupom: string) => {
    navigator.clipboard.writeText(cupom).then(() => {
      setCupomCopiado(linkId);
      setTimeout(() => setCupomCopiado(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="aspect-[3/4] rounded-xl glass-card animate-pulse" />
            <div className="lg:col-span-2 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-10 rounded-xl glass-card animate-pulse" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !jogo) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="font-display text-3xl font-black mb-4">Jogo não encontrado</h2>
          <button onClick={() => navigate('/jogos')} className="px-6 py-3 rounded-xl btn-neon text-white font-bold">
            Ver Catálogo
          </button>
        </div>
      </div>
    );
  }

  const linksOrdenados = [...(jogo.linksAfiliado || [])].sort((a, b) => {
    if (a.destaque && !b.destaque) return -1;
    if (!a.destaque && b.destaque) return 1;
    return (a.ordem || 0) - (b.ordem || 0);
  });

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Início</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/jogos" className="hover:text-primary transition-colors">Jogos</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium line-clamp-1">{jogo.titulo}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* LEFT: Cover + gallery */}
          <div>
            <div className="sticky top-24">
              <div className="relative rounded-xl overflow-hidden glass-card">
                <img src={jogo.imagemCapa} alt={jogo.titulo}
                  className="w-full aspect-[3/4] object-cover" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {jogo.lancamento && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/90 text-white text-xs font-bold backdrop-blur-sm">
                      <Zap className="w-3 h-3" /> Lançamento
                    </span>
                  )}
                  {jogo.maisVendido && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/90 text-white text-xs font-bold backdrop-blur-sm">
                      <Star className="w-3 h-3" /> Mais Vendido
                    </span>
                  )}
                </div>

                {jogo.emPromocao && jogo.percentualDesconto > 0 && (
                  <div className="absolute top-4 right-4">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center font-black text-white text-sm glow-blue animate-pulse-glow">
                      -{jogo.percentualDesconto}%
                    </div>
                  </div>
                )}
              </div>

              {/* Plataformas */}
              {jogo.plataformas && jogo.plataformas.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {jogo.plataformas.map(p => (
                    <Link key={p.id} to={`/jogos?plataforma=${p.slug}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-xs font-semibold hover:border-primary/30 hover:text-primary transition-all">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.corHex }} />
                      {p.nome}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CENTER + RIGHT: Info + buy buttons */}
          <div className="lg:col-span-2">
            {/* Title */}
            <div className="mb-6">
              {jogo.categorias && jogo.categorias.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {jogo.categorias.map(c => (
                    <Link key={c.id} to={`/jogos?categoria=${c.slug}`}
                      className="text-xs font-bold uppercase tracking-wide text-primary hover:text-primary/80 transition-colors">
                      {c.nome}
                    </Link>
                  ))}
                </div>
              )}
              <h1 className="font-display text-4xl md:text-5xl font-black leading-tight mb-3">{jogo.titulo}</h1>
              {jogo.tituloOriginal && jogo.tituloOriginal !== jogo.titulo && (
                <p className="text-muted-foreground text-sm">{jogo.tituloOriginal}</p>
              )}
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Desenvolvedora', value: jogo.desenvolvedor || '—' },
                { label: 'Publicadora', value: jogo.publicadora || '—' },
                { label: 'Lançamento', value: jogo.dataLancamento ? new Date(jogo.dataLancamento).toLocaleDateString('pt-BR') : '—' },
                { label: 'Classificação', value: jogo.classificacaoEtaria },
              ].map(m => (
                <div key={m.label} className="glass-card p-3 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="text-sm font-semibold line-clamp-1">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="glass-card rounded-xl p-5 mb-6">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">Sobre o Jogo</h3>
              <div 
                className="text-sm text-foreground/80 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: jogo.descricao }}
              />
              {jogo.tags && jogo.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {jogo.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded text-xs bg-white/5 text-muted-foreground border border-white/10">#{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* AFFILIATE LINKS - the main section */}
            <div className="glass-card rounded-xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h3 className="font-display font-bold uppercase tracking-wide">Onde Comprar</h3>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3 text-green-400" />
                  Lojas oficiais parceiras
                </div>
              </div>

              {linksOrdenados.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Links em breve. Volte mais tarde!
                </p>
              ) : (
                <div className="space-y-3">
                  {linksOrdenados.map(link => {
                    return (
                      <div key={link.id}
                        className={`rounded-xl border p-4 transition-all ${
                          link.destaque
                            ? 'border-primary/30 bg-primary/5 shadow-lg shadow-primary/10'
                            : 'border-white/10 bg-white/2 hover:border-white/20'
                        }`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Store info & Prices */}
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div 
                                onClick={(e) => { e.preventDefault(); handleComprar(link); }}
                                className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner cursor-pointer hover:opacity-80 transition-opacity"
                                title="Ir à Loja"
                              >
                                {link.parceiro?.logoBase64 || link.parceiro?.logoUrl ? (
                                  <img 
                                    src={link.parceiro.logoBase64 || link.parceiro.logoUrl} 
                                    alt={link.parceiro.nome} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <ShoppingCart className="w-5 h-5 text-muted-foreground/30" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <span className="font-black text-sm tracking-tight text-white uppercase">
                                    {link.parceiro?.nome || link.nomeLoja || 'Loja Oficial'}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {link.destaque && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-primary/20 text-primary border border-primary/30 uppercase tracking-tighter">
                                        ⭐ MELHOR OFERTA
                                      </span>
                                    )}
                                    {link.plataformasInfo && link.plataformasInfo.map((p: any) => (
                                      <span key={p.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-white/5 text-muted-foreground/70 uppercase tracking-tighter border border-white/5">
                                        <div className="w-1 h-1 rounded-full" style={{ background: p.corHex }} />
                                        {p.nome}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Prices */}
                                <div className="flex items-baseline gap-2">
                                  {link.precoLoja && link.precoLojaComCupom && link.precoLoja !== link.precoLojaComCupom && (
                                    <span className="text-xs text-muted-foreground/50 line-through font-medium">{formatPreco(link.precoLoja)}</span>
                                  )}
                                  {link.precoLojaComCupom ? (
                                    <span className="text-xl font-black text-primary font-display tracking-tight">{formatPreco(link.precoLojaComCupom)}</span>
                                  ) : link.precoLoja ? (
                                    <span className="text-xl font-black font-display tracking-tight text-white">{formatPreco(link.precoLoja)}</span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            {/* Coupon & CTA Section */}
                            <div className="flex flex-row items-center gap-4">
                              {/* Coupon code */}
                              {link.codigoCupom && (
                                <div className="flex flex-col items-center gap-0.5 min-w-[120px]">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25 border-dashed">
                                    <Tag className="w-3 h-3 text-primary" />
                                    <span className="text-xs font-black text-primary tracking-widest">{link.codigoCupom}</span>
                                    <button
                                      onClick={() => copiarCupom(link.id, link.codigoCupom!)}
                                      className="ml-1 text-primary/60 hover:text-primary transition-all">
                                      {cupomCopiado === link.id
                                        ? <Check className="w-3 h-3 text-green-400" />
                                        : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                  <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Cupom já no link!</span>
                                </div>
                              )}

                              {/* CTA Button */}
                              <button
                                onClick={() => handleComprar(link)}
                                disabled={carregandoLink === link.id}
                                className={`h-11 min-w-[150px] flex items-center justify-center gap-2 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                                  link.destaque
                                    ? 'btn-neon text-white shadow-lg shadow-primary/20'
                                    : 'bg-white/5 border border-white/10 hover:border-primary/40 hover:text-primary hover:bg-primary/5'
                                } ${carregandoLink === link.id ? 'opacity-70 cursor-wait' : ''}`}>
                                {carregandoLink === link.id ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <ExternalLink className="w-4 h-4" />
                                )}
                                {link.destaque ? 'Comprar' : 'Ir à Loja'}
                              </button>
                            </div>
                          </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disclaimer */}
              <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-white/3 border border-white/5">
                <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Ao clicar, você é redirecionado à loja oficial parceira já com o produto no carrinho e o cupom de desconto aplicado automaticamente. 
                  A compra é realizada diretamente na loja oficial, com segurança total.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Users className="w-4 h-4 text-blue-400" />, label: 'Visualizações', value: jogo.visualizacoes.toLocaleString('pt-BR') },
                { icon: <ShoppingCart className="w-4 h-4 text-green-400" />, label: 'Cliques p/ loja', value: jogo.cliquesAfiliado.toLocaleString('pt-BR') },
              ].map(s => (
                <div key={s.label} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  {s.icon}
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className="font-bold text-sm">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related games */}
        {relacionados.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-black uppercase tracking-wide mb-6">
              Você Também Pode <span className="text-primary">Gostar</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relacionados.map(j => <GameCard key={j.id} jogo={j} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JogoPage;
