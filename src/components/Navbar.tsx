import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Gamepad2, Zap, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { listarPlataformas, listarCategorias } from '@/services/api';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busca, setBusca] = useState('');

  const { data: plataformas = [] } = useQuery({ queryKey: ['plataformas'], queryFn: listarPlataformas });
  const { data: categorias = [] } = useQuery({ queryKey: ['categorias'], queryFn: listarCategorias });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleBusca = (e: React.FormEvent) => {
    e.preventDefault();
    if (busca.trim()) { navigate(`/jogos?busca=${encodeURIComponent(busca)}`); setBusca(''); }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glass shadow-lg shadow-black/30' : 'bg-transparent'
    }`}>
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-secondary glow-blue group-hover:scale-110 transition-transform">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-xl font-black text-gradient-orange tracking-wide">CHECKPOINT</span>
              <span className="font-display text-xl font-black text-white tracking-wide ml-1">DIGITAL</span>
              <div className="text-[9px] text-muted-foreground tracking-[0.25em] uppercase -mt-1 flex items-center gap-1">
                <Zap className="w-2 h-2 text-primary" /> Revendas com cupom
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden lg:flex items-center gap-1">
            {[
              { label: 'Início', href: '/' },
              { label: 'Jogos', href: '/jogos' },
              { label: 'Lançamentos', href: '/jogos?lancamento=true' },
              { label: 'Promoções', href: '/jogos?emPromocao=true' },
            ].map(item => (
              <li key={item.label}>
                <Link to={item.href}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all link-hover font-ui uppercase tracking-wide">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Search + actions */}
          <div className="flex items-center gap-2">
            <form onSubmit={handleBusca} className="hidden md:flex relative">
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar jogo..."
                className="w-44 h-9 bg-white/5 border border-white/10 rounded-lg pl-3 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-white/8 transition-all"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <Link to="/admin" className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-ui border border-transparent hover:border-primary/20">
              Admin
            </Link>

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-80 pb-4' : 'max-h-0'}`}>
          <div className="glass rounded-xl p-3 space-y-1 mt-2">
            <form onSubmit={handleBusca} className="flex relative mb-2">
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar jogo..."
                className="w-full h-10 bg-white/5 border border-white/10 rounded-lg pl-3 pr-9 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </button>
            </form>
            {[
              { label: 'Início', href: '/' },
              { label: 'Todos os Jogos', href: '/jogos' },
              { label: 'Lançamentos', href: '/jogos?lancamento=true' },
              { label: 'Promoções', href: '/jogos?emPromocao=true' },
            ].map(item => (
              <Link key={item.label} to={item.href} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold font-ui uppercase tracking-wide text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
