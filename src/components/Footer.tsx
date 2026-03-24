import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Zap, Shield, Tag, ExternalLink } from 'lucide-react';

const Footer: React.FC = () => (
  <footer className="border-t border-white/5 mt-20">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display text-xl font-black text-gradient-orange tracking-wide">CHECKPOINT</span>
              <span className="font-display text-xl font-black text-white tracking-wide ml-1">DIGITAL</span>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Seu portal definitivo para descontos em games e cultura geek. Quando você clica em "Comprar", é redirecionado à loja oficial 
            já com o produto no carrinho e nosso cupom de desconto aplicado automaticamente.
          </p>

          <div className="flex flex-col gap-2 mt-4">
            {[
              { icon: <Shield className="w-4 h-4 text-green-400" />, text: 'Compra 100% segura na loja oficial' },
              { icon: <Tag className="w-4 h-4 text-primary" />, text: 'Cupom de parceiro aplicado automaticamente' },
              { icon: <Zap className="w-4 h-4 text-secondary" />, text: 'Preços atualizados diariamente' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Navegação</h4>
          <ul className="space-y-2">
            {[
              { label: 'Início', href: '/' },
              { label: 'Todos os Jogos', href: '/jogos' },
              { label: 'Lançamentos', href: '/jogos?lancamento=true' },
              { label: 'Promoções', href: '/jogos?emPromocao=true' },
              { label: 'Mais Vendidos', href: '/jogos?maisVendido=true' },
            ].map(l => (
              <li key={l.label}>
                <Link to={l.href} className="text-sm text-muted-foreground hover:text-primary transition-colors link-hover">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
          <ul className="space-y-2">
            {[
              'Sobre Nós', 'Política de Privacidade', 'Como Funciona', 'Contato',
            ].map(label => (
              <li key={label}>
                <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors link-hover">
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs text-primary/80 font-semibold mb-1">⚠️ Aviso</p>
            <p className="text-xs text-muted-foreground">
              Somos uma plataforma de afiliados. As compras são realizadas diretamente nas lojas parceiras.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Checkpoint Digital. Todos os direitos reservados.
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          Parceiro afiliado das principais lojas de games do Brasil
          <ExternalLink className="w-3 h-3" />
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
