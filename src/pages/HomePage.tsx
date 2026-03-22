import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Zap, Tag, Shield, ChevronRight, Gamepad2, Star, TrendingUp, ArrowRight } from 'lucide-react';
import { listarJogos, listarPlataformas } from '@/services/api';
import GameCard from '@/components/GameCard';

const HomePage: React.FC = () => {
  const { data: destaquesHoje = [], isLoading: loadingHoje } = useQuery({
    queryKey: ['jogos', 'destaqueHoje'],
    queryFn: () => listarJogos({ destaqueHoje: true }),
  });

  const { data: destaques = [], isLoading: loadingDestaques } = useQuery({
    queryKey: ['jogos', 'destaque'],
    queryFn: () => listarJogos({ destaque: true }),
  });

  // Usar o destaque de hoje específico, ou o primeiro da lista de destaques gerais se não houver um marcado
  // Esperar o carregamento para decidir qual usar
  const destaquePrincipal = destaquesHoje.length > 0 ? destaquesHoje[0] : (loadingHoje ? null : destaques[0]);

  const { data: lancamentos = [] } = useQuery({
    queryKey: ['jogos', 'lancamento'],
    queryFn: () => listarJogos({ lancamento: true }),
  });

  const { data: promocoes = [] } = useQuery({
    queryKey: ['jogos', 'promocao'],
    queryFn: () => listarJogos({ emPromocao: true }),
  });

  const { data: maisVendidos = [] } = useQuery({
    queryKey: ['jogos', 'maisVendido'],
    queryFn: () => listarJogos({ maisVendido: true }),
  });

  const { data: todos = [] } = useQuery({
    queryKey: ['jogos', 'todos'],
    queryFn: () => listarJogos(),
  });

  const { data: plataformas = [] } = useQuery({
    queryKey: ['plataformas'],
    queryFn: listarPlataformas,
  });

  return (
    <div className="min-h-screen">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-[#030712] border-b border-white/5">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 pt-16 relative z-10">
          <div className="relative">
            {/* Texto de Fundo (Agora à frente do jogo) */}
            <div className="animate-fade-in relative z-20 pointer-events-none">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 mt-4 pointer-events-auto uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>Cupons exclusivos de parceiro</span>
              </div>

              <h1 className="font-display text-6xl md:text-7xl lg:text-[8rem] font-black leading-[0.85] mb-6 select-none">
                <span className="text-white opacity-90">OS MELHORES</span>
                <br />
                <span className="text-gradient-orange text-shadow-orange">JOGOS</span>
                <br />
                <span className="text-white opacity-90">COM DESCONTO</span>
              </h1>
            </div>

            {/* Jogo em Destaque (Atrás do texto) */}
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-full lg:w-3/5 h-full flex items-center justify-end pointer-events-none z-0">
              {destaquePrincipal ? (
                <div className="relative group pointer-events-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <img 
                    src={destaquePrincipal.imagemCapa} 
                    alt={destaquePrincipal.titulo}
                    className="w-[280px] md:w-[400px] lg:w-[480px] aspect-[3/4] object-cover rounded-2xl shadow-2xl rotate-2 group-hover:rotate-0 transition-transform duration-500 border border-white/10 opacity-50 lg:opacity-70"
                  />
                  {/* Badge de preço flutuante */}
                  <div className="absolute -bottom-4 -left-4 glass p-3 rounded-xl shadow-2xl border-primary/30 rotate-[-4deg] group-hover:rotate-0 transition-transform duration-500">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Oferta de Hoje</div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-white">R$ {destaquePrincipal.precoComCupom?.toFixed(2)}</span>
                      <span className="text-xs line-through text-muted-foreground">R$ {destaquePrincipal.precoOriginal?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Placeholder do Hero */
                <div className="relative animate-pulse">
                  <div className="w-[280px] md:w-[400px] lg:w-[480px] aspect-[3/4] bg-white/5 rounded-2xl border border-white/10 rotate-2 flex items-center justify-center">
                    <Gamepad2 className="w-20 h-20 text-white/5" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 glass p-3 rounded-xl shadow-2xl border-white/10 rotate-[-4deg] min-w-[140px]">
                    <div className="h-3 w-16 bg-white/10 rounded mb-2" />
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-20 bg-white/10 rounded" />
                      <div className="h-4 w-12 bg-white/5 rounded" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Descrição e Botões */}
            <div className="relative z-30 mt-8 max-w-lg">
              <p className="text-base text-muted-foreground leading-relaxed mb-6">
                Encontre seu próximo jogo favorito no <strong>Checkpoint Digital</strong>. Ao clicar em comprar, você é redirecionado 
                à loja oficial já com o produto no carrinho e nosso cupom aplicado automaticamente.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/jogos"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl btn-neon text-white font-bold text-base">
                  <Gamepad2 className="w-5 h-5" />
                  Explorar Catálogo
                </Link>
                <Link to="/jogos?emPromocao=true"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-primary/30 text-primary font-bold text-base hover:bg-primary/10 transition-colors glass">
                  <Tag className="w-5 h-5" />
                  Promoções
                </Link>
              </div>

              {/* Features com espaçamento centralizado */}
              <div className="flex gap-5 mt-10 mb-10">
                {[
                  { icon: <Shield className="w-4 h-4 text-green-400" />, label: 'Compra Segura' },
                  { icon: <Tag className="w-4 h-4 text-primary" />, label: 'Cupom Auto' },
                  { icon: <Zap className="w-4 h-4 text-secondary" />, label: 'Link Direto' },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg glass flex items-center justify-center">
                      {f.icon}
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section className="py-16 border-y border-white/5 bg-[#030712]/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                icon: <Gamepad2 className="w-6 h-6 text-primary" />,
                title: 'Escolha seu Jogo',
                desc: 'Navegue pelo catálogo e encontre o jogo que deseja comprar.',
              },
              {
                step: '02',
                icon: <Tag className="w-6 h-6 text-primary" />,
                title: 'Clique em Comprar',
                desc: 'Selecione a loja de sua preferência e clique no botão de comprar.',
              },
              {
                step: '03',
                icon: <Shield className="w-6 h-6 text-primary" />,
                title: 'Cupom Já Aplicado',
                desc: 'Você é redirecionado à loja com o jogo no carrinho e nosso cupom de desconto já aplicado.',
              },
            ].map(item => (
              <div key={item.step} className="glass-card p-6 relative overflow-hidden group hover:border-primary/20 transition-colors">
                <div className="absolute top-4 right-4 font-display text-5xl font-black text-white/5 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:glow-blue transition-all">
                  {item.icon}
                </div>
                <h3 className="font-display text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LANÇAMENTOS ─── */}
      <Section title="Lançamentos" icon={<Zap className="w-5 h-5 text-primary" />}
        linkHref="/jogos?lancamento=true" 
        jogos={lancamentos.length > 0 ? lancamentos.slice(0, 6) : [undefined, undefined, undefined, undefined, undefined, undefined] as any} />

      {/* ─── PROMOÇÕES ─── */}
      <Section title="Em Promoção" icon={<Tag className="w-5 h-5 text-primary" />}
        linkHref="/jogos?emPromocao=true" 
        jogos={promocoes.length > 0 ? promocoes.slice(0, 6) : [undefined, undefined, undefined, undefined, undefined, undefined] as any} />

      {/* ─── MAIS VENDIDOS ─── */}
      <Section title="Mais Vendidos" icon={<TrendingUp className="w-5 h-5 text-primary" />}
        linkHref="/jogos?maisVendido=true" 
        jogos={maisVendidos.length > 0 ? maisVendidos.slice(0, 6) : [undefined, undefined, undefined, undefined, undefined, undefined] as any} />

      {/* ─── PLATAFORMAS ─── */}
      {plataformas.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <h2 className="font-display text-2xl font-black uppercase tracking-wide mb-6 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            Por Plataforma
          </h2>
          <div className="flex flex-wrap gap-3">
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
                  <Link key={p.id} to={`/jogos?plataforma=${p.slug}`}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass hover:border-primary/30 hover:text-primary transition-all font-semibold text-sm font-ui uppercase tracking-wide">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.corHex }} />
                    {p.nomeSimplificado}
                  </Link>
                ));
            })()}
          </div>
        </section>
      )}

      {/* ─── CTA BANNER ─── */}
      <section className="container mx-auto px-4 pb-16">
        <div className="relative rounded-2xl overflow-hidden glass-card p-10 text-center grid-bg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-black mb-4 uppercase">
              PRONTO PARA <span className="text-gradient-orange">ECONOMIZAR</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Nossos cupons de parceiro garantem que você sempre pague menos nas lojas oficiais.
            </p>
            <Link to="/jogos"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl btn-neon text-white font-black text-lg">
              Explorar Catálogo <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Section component helper
const Section: React.FC<{
  title: string;
  icon: React.ReactNode;
  linkHref: string;
  jogos: import('@/types').Jogo[];
}> = ({ title, icon, linkHref, jogos = [] }) => (
  <section className="py-12 container mx-auto px-4">
    <div className="flex items-center justify-between mb-6">
      <h2 className="font-display text-2xl font-black uppercase tracking-wide flex items-center gap-2">
        {icon}{title}
      </h2>
      <Link to={linkHref}
        className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-semibold transition-colors link-hover">
        Ver todos <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.isArray(jogos) && jogos.map((j, idx) => <GameCard key={j?.id || idx} jogo={j} />)}
    </div>
  </section>
);

export default HomePage;
