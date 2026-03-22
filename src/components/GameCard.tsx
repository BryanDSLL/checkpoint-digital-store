import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Star, Zap, ShoppingCart, ExternalLink, Gamepad2 } from 'lucide-react';
import { Jogo } from '@/types';

interface GameCardProps {
  jogo?: Jogo;
  variant?: 'default' | 'compact' | 'featured';
}

const GameCard: React.FC<GameCardProps> = ({ jogo, variant = 'default' }) => {
  const formatPreco = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Skeleton/Placeholder State
  if (!jogo) {
    if (variant === 'compact') {
      return (
        <div className="flex gap-3 p-3 rounded-lg animate-pulse">
          <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-white/5" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        </div>
      );
    }

    return (
      <div className="card-game animate-pulse">
        <div className="aspect-[3/4] bg-white/5" />
        <div className="p-4 space-y-3">
          <div className="h-5 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/5 rounded w-full" />
          <div className="flex justify-between items-end pt-2">
            <div className="space-y-2">
              <div className="h-3 bg-white/5 rounded w-12" />
              <div className="h-6 bg-white/10 rounded w-20" />
            </div>
            <div className="h-8 bg-white/10 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  // From here on, 'jogo' is guaranteed to exist
  if (variant === 'featured') {
    return (
      <Link to={`/jogo/${jogo.slug}`} className="group block relative overflow-hidden rounded-xl card-game h-[420px]">
        <img src={jogo.imagemCapa} alt={jogo.titulo}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          {jogo.destaque && (
            <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-secondary text-white">
              <Star className="w-3 h-3 fill-white" /> Destaque
            </span>
          )}
          {jogo.lancamento && (
            <span className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-green-500 text-white">
              <Zap className="w-3 h-3" /> Novo
            </span>
          )}
          {jogo.emPromocao && jogo.percentualDesconto > 0 && (
            <span className="badge-desconto">-{jogo.percentualDesconto}%</span>
          )}
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-6">
          {/* Platforms */}
          {jogo.plataformas && jogo.plataformas.length > 0 && (
            <div className="flex gap-1 mb-3 flex-wrap">
              {jogo.plataformas.slice(0, 3).map(p => (
                <span key={p.id} className="platform-badge text-white/80">{p.nome}</span>
              ))}
            </div>
          )}
          <h3 className="font-display text-2xl font-black text-white mb-2 leading-tight">{jogo.titulo}</h3>
          <p className="text-sm text-white/70 line-clamp-2 mb-4">{jogo.descricaoCurta}</p>
          
          <div className="flex items-center justify-between">
            <div>
              {jogo.precoOriginal && (
                <p className="text-xs text-white/50 line-through">
                  {formatPreco(jogo.precoOriginal)}
                </p>
              )}
              {jogo.precoComCupom && (
                <p className="text-xl font-black text-primary font-display">
                  {formatPreco(jogo.precoComCupom)}
                  <span className="text-xs text-primary/70 ml-1 font-ui font-normal">com cupom</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg btn-neon text-white text-sm font-bold">
              <ShoppingCart className="w-4 h-4" />
              Ver Oferta
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link to={`/jogo/${jogo.slug}`} className="group flex gap-3 p-3 rounded-lg hover:bg-white/5 transition-all">
        <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
          <img src={jogo.imagemCapa} alt={jogo.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{jogo.titulo}</h4>
          <div className="flex gap-1 mt-1 flex-wrap">
            {jogo.plataformas?.slice(0, 2).map(p => (
              <span key={p.id} className="text-[10px] text-muted-foreground">{p.nome}</span>
            ))}
          </div>
          {jogo.precoComCupom && (
            <p className="text-sm font-black text-primary mt-1 font-display">
              {formatPreco(jogo.precoComCupom)}
            </p>
          )}
        </div>
      </Link>
    );
  }

  // Default card
  return (
    <Link to={`/jogo/${jogo.slug}`} className="card-game group block scale-[0.95] hover:scale-100 transition-transform duration-300">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl">
        <img src={jogo.imagemCapa} alt={jogo.titulo}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {jogo.lancamento && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-green-500/90 text-white backdrop-blur-sm">
              <Zap className="w-2 h-2" /> NOVO
            </span>
          )}
          {jogo.maisVendido && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black bg-secondary/90 text-white backdrop-blur-sm">
              <Star className="w-2 h-2" /> TOP
            </span>
          )}
        </div>

        {/* Discount badge */}
        {jogo.emPromocao && jogo.percentualDesconto > 0 && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center justify-center w-9 h-9 rounded-full font-black text-[10px] bg-primary text-white glow-blue">
              -{jogo.percentualDesconto}%
            </span>
          </div>
        )}

        {/* Platform tags bottom - MORE VISIBLE */}
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
          {jogo.plataformas?.slice(0, 3).map(p => {
            const nomeSimplificado = p.nome
              .split('(')[0] // Remove tudo após parênteses
              .replace(/PlayStation /i, 'PS') // PS5, PS4
              .replace(/Xbox Series .*/i, 'Xbox') // Simplifica Xbox
              .replace(/Personal Computer/i, 'PC') // PC
              .replace(/Computador/i, 'PC')
              .trim();
            
            return (
              <span key={p.id} 
                style={{ borderColor: `${p.corHex}40`, backgroundColor: `${p.corHex}20` }}
                className="px-1.5 py-0.5 rounded text-[9px] font-black text-white border backdrop-blur-md shadow-lg">
                {nomeSimplificado}
              </span>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-display font-black text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">
          {jogo.titulo}
        </h3>
        
        <div className="flex items-end justify-between mt-2">
          <div>
            {jogo.precoOriginal && jogo.emPromocao && (
              <p className="text-[10px] text-muted-foreground line-through">
                {formatPreco(jogo.precoOriginal)}
              </p>
            )}
            {jogo.precoComCupom ? (
              <div>
                <p className="text-base font-black text-primary font-display leading-tight">
                  {formatPreco(jogo.precoComCupom)}
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">Ver preço</p>
            )}
          </div>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[9px] font-black font-ui uppercase tracking-tighter group-hover:bg-primary/20 transition-colors">
            <ExternalLink className="w-2.5 h-2.5" />
            Oferta
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;
