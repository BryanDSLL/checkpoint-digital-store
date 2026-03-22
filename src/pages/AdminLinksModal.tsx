import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Plus, Trash2, Link2, Tag, Star, Loader2, ShoppingCart, Info, Globe, ExternalLink, Edit } from 'lucide-react';
import { listarLinksAdmin, criarLinkAdmin, atualizarLinkAdmin, excluirLinkAdmin, listarPlataformas, listarParceiros, criarParceiro } from '@/services/api';
import { toast } from 'sonner';

const linkSchema = z.object({
  parceiroId: z.string().min(1, 'Selecione um parceiro'),
  urlAfiliado: z.string().url('URL inválida'),
  urlScraping: z.string().url('URL de scraping inválida').optional().or(z.literal('')),
  codigoCupom: z.string().optional(),
  precoLoja: z.string().refine(v => !v || !isNaN(Number(v)), 'Preço inválido'),
  precoLojaComCupom: z.string().refine(v => !v || !isNaN(Number(v)), 'Preço inválido'),
  tipoMidia: z.enum(['Mídia digital', 'Mídia física', 'Key']).default('Mídia digital'),
  destaque: z.boolean().default(false),
  ordem: z.string().refine(v => !isNaN(Number(v)), 'Ordem inválida'),
  plataformaId: z.string().min(1, 'Selecione uma plataforma'),
});

type LinkFormValues = z.infer<typeof linkSchema>;

interface Props {
  jogoId: number;
  jogoTitulo: string;
  onClose: () => void;
  onOpenParceiros?: () => void;
}

const AdminLinksModal: React.FC<Props> = ({ jogoId, jogoTitulo, onClose, onOpenParceiros }) => {
  const qc = useQueryClient();
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editingLinkId, setEditingId] = useState<number | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['admin-links', jogoId],
    queryFn: () => listarLinksAdmin(jogoId)
  });

  const { data: plataformas = [] } = useQuery({
    queryKey: ['plataformas'],
    queryFn: () => listarPlataformas()
  });

  const { data: parceiros = [] } = useQuery({
    queryKey: ['parceiros'],
    queryFn: async () => {
      const data = await listarParceiros();
      return Array.isArray(data) ? data : [];
    }
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<LinkFormValues>({
    resolver: zodResolver(linkSchema),
    defaultValues: {
      parceiroId: '', urlAfiliado: '', urlScraping: '', codigoCupom: '',
      precoLoja: '', precoLojaComCupom: '', destaque: false,
      ordem: '0', plataformaId: '', tipoMidia: 'Mídia digital'
    }
  });

  const mutation = useMutation({
    mutationFn: (data: LinkFormValues) => {
      const payload = {
        ...data,
        parceiroId: Number(data.parceiroId),
        plataformaId: Number(data.plataformaId),
        precoLoja: data.precoLoja ? Number(data.precoLoja) : null,
        precoLojaComCupom: data.precoLojaComCupom ? Number(data.precoLojaComCupom) : null,
        codigoCupom: data.codigoCupom || null,
        urlScraping: data.urlScraping || null,
        ordem: Number(data.ordem)
      };

      return editingLinkId 
        ? atualizarLinkAdmin(editingLinkId, payload)
        : criarLinkAdmin(jogoId, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-links', jogoId] });
      toast.success(editingLinkId ? 'Link atualizado!' : 'Link adicionado!');
      reset();
      setMostrarForm(false);
      setEditingId(null);
    },
    onError: () => {
      toast.error('Erro ao salvar link');
    }
  });

  const handleEdit = (link: any) => {
    setEditingId(link.id);
    setValue('parceiroId', String(link.parceiro_id));
    setValue('plataformaId', String(link.plataforma_id));
    setValue('urlAfiliado', link.url_afiliado);
    setValue('urlScraping', link.url_scraping || '');
    setValue('codigoCupom', link.codigo_cupom || '');
    setValue('precoLoja', String(link.preco_loja || ''));
    setValue('precoLojaComCupom', String(link.preco_loja_com_cupom || ''));
    setValue('tipoMidia', link.tipo_midia);
    setValue('destaque', link.destaque);
    setValue('ordem', String(link.ordem));
    setMostrarForm(true);
  };

  const excluirMut = useMutation({
    mutationFn: excluirLinkAdmin,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-links', jogoId] });
      toast.success('Link removido');
    }
  });

  const handleExcluir = (id: number) => {
    if (confirm('Excluir este link?')) {
      excluirMut.mutate(id);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-0 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-white/5 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Link2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase tracking-tight">Canais de Venda</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold truncate max-w-[300px]">{jogoTitulo}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {/* Aviso */}
          <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong>Automação e Redirecionamento:</strong> Defina o link de redirecionamento para o cliente e o link de scraping para o robô capturar os preços. 
              Parceiros cadastrados garantem a compatibilidade com os scripts de captura.
            </p>
          </div>

          {/* Lista de Links */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <span className="w-1 h-3 bg-muted-foreground/30 rounded-full" /> Links Ativos
            </h3>
            
            {isLoading ? (
              <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
            ) : links.length === 0 ? (
              <div className="py-8 text-center glass rounded-xl border-dashed border-white/5">
                <p className="text-xs text-muted-foreground">Nenhum canal de venda configurado.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {links.map((link: any) => (
                  <div key={link.id} className={`rounded-xl border p-4 group transition-all ${link.destaque ? 'bg-primary/5 border-primary/20' : 'bg-white/2 border-white/5 hover:border-white/10'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{link.parceiro_nome || link.nome_loja}</span>
                          {link.destaque && <span className="text-[9px] font-black bg-primary text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">Melhor Oferta</span>}
                          <span className="text-[9px] font-bold text-primary/80 px-1.5 py-0.5 rounded bg-primary/5 border border-primary/10">{link.tipo_midia}</span>
                          {link.plataforma_nome && <span className="text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-white/5">{link.plataforma_nome}</span>}
                        </div>
                        <div className="flex flex-col gap-1 mb-2 max-w-[400px]">
                          <p className="text-[10px] text-muted-foreground truncate font-mono flex items-center gap-1" title={link.url_afiliado}>
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" /> Cliente: {link.url_afiliado}
                          </p>
                          {link.url_scraping && (
                            <p className="text-[10px] text-secondary truncate font-mono flex items-center gap-1" title={link.url_scraping}>
                              <Globe className="w-2.5 h-2.5 flex-shrink-0" /> Robô: {link.url_scraping}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          {link.codigo_cupom && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                              <Tag className="w-2.5 h-2.5" /> {link.codigo_cupom}
                            </div>
                          )}
                          {link.preco_loja_com_cupom && (
                            <span className="text-xs font-black text-green-400">R$ {Number(link.preco_loja_com_cupom).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(link)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleExcluir(link.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulário Novo Link */}
          {!mostrarForm ? (
            <button onClick={() => { setEditingId(null); reset(); setMostrarForm(true); }} className="w-full py-4 rounded-xl border border-dashed border-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Adicionar Novo Canal
            </button>
          ) : (
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="glass-card p-6 rounded-2xl border border-primary/20 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {editingLinkId ? 'Editar Canal de Venda' : 'Novo Canal de Venda'}
                </h4>
                <button type="button" onClick={() => { setMostrarForm(false); setEditingId(null); reset(); }} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1 justify-between">
                    Loja Parceira
                    <button 
                      type="button" 
                      onClick={onOpenParceiros} 
                      className="text-primary hover:underline text-[9px]"
                    >
                      + Novo Parceiro
                    </button>
                  </label>
                  
                  <select {...register('parceiroId')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all">
                    <option value="" className="bg-background">Selecione...</option>
                    {parceiros.map(p => <option key={p.id} value={String(p.id)} className="bg-background">{p.nome}</option>)}
                  </select>
                  {errors.parceiroId && <span className="text-red-400 text-[9px] font-bold uppercase ml-1">{errors.parceiroId.message}</span>}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">Classificação</label>
                  <select {...register('tipoMidia')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all">
                    <option value="Mídia digital" className="bg-background">Mídia digital</option>
                    <option value="Mídia física" className="bg-background">Mídia física</option>
                    <option value="Key" className="bg-background">Key</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">Plataforma</label>
                  <select {...register('plataformaId')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all">
                    <option value="" className="bg-background">Selecione...</option>
                    {plataformas.map(p => <option key={p.id} value={String(p.id)} className="bg-background">{p.nome}</option>)}
                  </select>
                  {errors.plataformaId && <span className="text-red-400 text-[9px] font-bold uppercase ml-1">{errors.plataformaId.message}</span>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">Link de Redirecionamento (Cliente)</label>
                  <input {...register('urlAfiliado')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono text-[10px]" placeholder="https://loja.com/produto?aff=123" />
                  {errors.urlAfiliado && <span className="text-red-400 text-[9px] font-bold uppercase ml-1">{errors.urlAfiliado.message}</span>}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">Link de Captura (Robô Scraping)</label>
                  <input {...register('urlScraping')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono text-[10px]" placeholder="https://loja.com/produto-direto" />
                  {errors.urlScraping && <span className="text-red-400 text-[9px] font-bold uppercase ml-1">{errors.urlScraping.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">Preço (R$)</label>
                  <input {...register('precoLoja')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">C/ Cupom (R$)</label>
                  <input {...register('precoLojaComCupom')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all" placeholder="0.00" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">Cupom</label>
                  <input {...register('codigoCupom')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all" placeholder="CHECK10" />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl cursor-pointer border transition-all ${watch('destaque') ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/2 border-white/5 text-muted-foreground'}`}>
                  <input type="checkbox" {...register('destaque')} className="sr-only" />
                  <Star className={`w-3.5 h-3.5 ${watch('destaque') ? 'fill-primary' : ''}`} />
                  <span className="text-[10px] font-black uppercase">Melhor Oferta</span>
                </label>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">Ordem</label>
                  <input type="number" {...register('ordem')} className="w-16 h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all text-center" />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setMostrarForm(false)} className="flex-1 h-10 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] h-10 rounded-lg btn-neon text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Cadastrar Link
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLinksModal;
