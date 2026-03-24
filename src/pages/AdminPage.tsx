import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  LayoutDashboard, LogOut, Plus, Trash2, Edit, ExternalLink,
  Gamepad2, Link2, MousePointer, Eye, TrendingUp, Settings,
  AlertCircle, Loader2, Building2, Zap
} from 'lucide-react';
import { listarJogosAdmin, excluirJogoAdmin, loginAdmin, obterStats } from '@/services/api';
import AdminJogoModal from './AdminJogoModal';
import AdminLinksModal from './AdminLinksModal';
import AdminParceirosModal from './AdminParceirosModal';
import AdminAutomacaoModal from './AdminAutomacaoModal';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [autenticado, setAutenticado] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [jogoModal, setJogoModal] = useState<{ open: boolean; id?: number }>({ open: false });
  const [linksModal, setLinksModal] = useState<{ open: boolean; jogoId?: number; jogoTitulo?: string }>({ open: false });
  const [parceirosModal, setParceirosModal] = useState(false);
  const [automacaoModal, setAutomacaoModal] = useState(false);
  const [busca, setBusca] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (localStorage.getItem('gs_token')) setAutenticado(true);
  }, []);

  const onLogin = async (data: LoginFormValues) => {
    setIsLoggingIn(true);
    try {
      await loginAdmin(data.email, data.senha);
      setAutenticado(true);
      toast.success('Bem-vindo de volta!');
    } catch (err: any) {
      toast.error(err.response?.data?.erro || 'Erro ao entrar no sistema');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gs_token');
    localStorage.removeItem('gs_user');
    setAutenticado(false);
    toast.info('Sessão encerrada');
  };

  const { data: jogos = [], isLoading } = useQuery({
    queryKey: ['admin-jogos'],
    queryFn: listarJogosAdmin,
    enabled: autenticado,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: obterStats,
    enabled: autenticado,
  });

  const excluirMut = useMutation({
    mutationFn: excluirJogoAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-jogos'] }),
  });

  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]" />
        </div>

        <div className="w-full max-w-md px-4 relative z-10">
          <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg glow-blue">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white">CHECKPOINT <span className="text-primary">DIGITAL</span></h1>
              <p className="text-xs text-muted-foreground mt-1 tracking-[0.2em] uppercase font-bold">Painel Administrativo</p>
            </div>

            <form onSubmit={handleSubmit(onLogin)} className="space-y-5">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5 ml-1">Email Corporativo</label>
                <div className="relative">
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="admin@checkpoint.com"
                    className={`w-full h-12 bg-white/5 border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10`}
                  />
                  {errors.email && (
                    <div className="flex items-center gap-1 mt-1 text-red-400 text-[10px] font-bold uppercase ml-1">
                      <AlertCircle className="w-3 h-3" /> {errors.email.message}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5 ml-1">Senha de Acesso</label>
                <div className="relative">
                  <input
                    {...register('senha')}
                    type="password"
                    placeholder="••••••••"
                    className={`w-full h-12 bg-white/5 border ${errors.senha ? 'border-red-500/50' : 'border-white/10'} rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10`}
                  />
                  {errors.senha && (
                    <div className="flex items-center gap-1 mt-1 text-red-400 text-[10px] font-bold uppercase ml-1">
                      <AlertCircle className="w-3 h-3" /> {errors.senha.message}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-12 rounded-xl btn-neon text-white font-bold flex items-center justify-center gap-2 group transition-all"
              >
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Entrar no Sistema
                    <ExternalLink className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                ← Voltar para o site principal
              </Link>
            </div>
          </div>
          
          <p className="text-center mt-6 text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
            Acesso Restrito a Colaboradores Autorizados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-display font-black text-sm">CHECKPOINT</span>
              <span className="text-muted-foreground text-sm"> / Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
              <ExternalLink className="w-3.5 h-3.5" /> Ver Site
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/5 transition-all">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <Gamepad2 className="w-5 h-5 text-primary" />, label: 'Total de Jogos', value: stats.totalJogos },
              { icon: <Link2 className="w-5 h-5 text-secondary" />, label: 'Links Afiliados', value: stats.totalLinks },
              { icon: <MousePointer className="w-5 h-5 text-green-400" />, label: 'Cliques (30 dias)', value: stats.cliques30Dias },
              { icon: <TrendingUp className="w-5 h-5 text-purple-400" />, label: 'Top Jogo', value: stats.topJogos?.[0]?.titulo || '—' },
            ].map(s => (
              <div key={s.label} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs text-muted-foreground">{s.label}</span></div>
                <p className="font-display font-black text-xl truncate">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-black uppercase tracking-wide flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" /> Gerenciar Jogos
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={() => setAutomacaoModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-sm font-bold shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]">
              <Zap className="w-4 h-4 fill-current" /> Automação
            </button>
            <button onClick={() => setParceirosModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/10 transition-all text-sm font-bold">
              <Building2 className="w-4 h-4" /> Parceiros
            </button>
            <button onClick={() => setJogoModal({ open: true })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl btn-neon text-white text-sm font-bold">
              <Plus className="w-4 h-4" /> Novo Jogo
            </button>
          </div>
        </div>

        {/* Games table */}
        <div className="glass-card rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : jogos.length === 0 ? (
            <div className="p-12 text-center">
              <Gamepad2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum jogo cadastrado.</p>
              <button onClick={() => setJogoModal({ open: true })}
                className="mt-4 px-4 py-2 rounded-lg btn-neon text-white text-sm font-bold">
                Adicionar Primeiro Jogo
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/5 bg-white/2">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-widest text-muted-foreground font-semibold">Jogo</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-widest text-muted-foreground font-semibold hidden md:table-cell">Status</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-widest text-muted-foreground font-semibold hidden lg:table-cell">Plataformas</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-widest text-muted-foreground font-semibold hidden xl:table-cell">Preço</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-widest text-muted-foreground font-semibold hidden lg:table-cell">Links</th>
                    <th className="py-3 px-4 text-left text-xs uppercase tracking-widest text-muted-foreground font-semibold hidden lg:table-cell">Views</th>
                    <th className="py-3 px-4 text-right text-xs uppercase tracking-widest text-muted-foreground font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/3">
                  {jogos.map((jogo: any) => (
                    <tr key={jogo.id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={jogo.imagem_capa} alt={jogo.titulo}
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          <div>
                            <p className="font-semibold line-clamp-1">{jogo.titulo}</p>
                            <p className="text-xs text-muted-foreground">{jogo.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex gap-1 flex-wrap">
                          {jogo.destaque_hoje && <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-500 font-bold border border-yellow-500/30">Destaque Hoje</span>}
                          {jogo.destaque && <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-bold">Destaque</span>}
                          {jogo.lancamento && <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 font-bold">Lançamento</span>}
                          {jogo.em_promocao && <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary/20 text-secondary font-bold">Promoção</span>}
                          {!jogo.ativo && <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 font-bold">Inativo</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {jogo.plataformas?.length > 0 ? jogo.plataformas.map((p: any) => (
                            <span key={p.id} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-muted-foreground whitespace-nowrap">{p.nome}</span>
                          )) : <span className="text-xs text-muted-foreground opacity-50">—</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden xl:table-cell whitespace-nowrap">
                        <div className="flex flex-col">
                          {jogo.preco_com_cupom && jogo.preco_com_cupom !== jogo.preco_original ? (
                            <>
                              <span className="text-[10px] text-muted-foreground line-through">R$ {Number(jogo.preco_original).toFixed(2).replace('.', ',')}</span>
                              <span className="text-xs font-bold text-green-400">R$ {Number(jogo.preco_com_cupom).toFixed(2).replace('.', ',')}</span>
                            </>
                          ) : (
                             <span className="text-xs font-bold text-white">R$ {Number(jogo.preco_original || 0).toFixed(2).replace('.', ',')}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                        {jogo.total_links || 0} link(s)
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                        {(jogo.visualizacoes || 0).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setLinksModal({ open: true, jogoId: jogo.id, jogoTitulo: jogo.titulo })}
                            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-secondary transition-colors"
                            title="Gerenciar Links">
                            <Link2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setJogoModal({ open: true, id: jogo.id })}
                            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
                            title="Editar">
                            <Edit className="w-4 h-4" />
                          </button>
                          <Link to={`/jogo/${jogo.slug}`} target="_blank"
                            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-green-400 transition-colors"
                            title="Ver na loja">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => { if (confirm('Excluir este jogo?')) excluirMut.mutate(jogo.id); }}
                            className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-red-400 transition-colors"
                            title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {jogoModal.open && (
        <AdminJogoModal
          jogoId={jogoModal.id}
          onClose={() => setJogoModal({ open: false })}
        />
      )}
      {linksModal.open && linksModal.jogoId && (
        <AdminLinksModal
          jogoId={linksModal.jogoId}
          jogoTitulo={linksModal.jogoTitulo || ''}
          onClose={() => setLinksModal({ open: false })}
          onOpenParceiros={() => setParceirosModal(true)}
        />
      )}
      {parceirosModal && (
        <AdminParceirosModal
          onClose={() => setParceirosModal(false)}
        />
      )}
      {automacaoModal && (
        <AdminAutomacaoModal
          onClose={() => setAutomacaoModal(false)}
        />
      )}
    </div>
  );
};

export default AdminPage;
