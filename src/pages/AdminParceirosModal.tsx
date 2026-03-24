import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Plus, Trash2, Building2, Loader2, Info, CheckCircle2, AlertCircle, Edit2, Image as ImageIcon } from 'lucide-react';
import { listarParceiros, criarParceiro, atualizarParceiro, excluirParceiro } from '@/services/api';
import { toast } from 'sonner';
import { Parceiro } from '@/types';

const parceiroSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  logoBase64: z.string().optional(),
  temScraping: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

type ParceiroFormValues = z.infer<typeof parceiroSchema>;

interface Props {
  onClose: () => void;
}

const AdminParceirosModal: React.FC<Props> = ({ onClose }) => {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const { data: parceiros = [], isLoading } = useQuery<Parceiro[]>({
    queryKey: ['parceiros'],
    queryFn: listarParceiros
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ParceiroFormValues>({
    resolver: zodResolver(parceiroSchema),
    defaultValues: {
      nome: '', logoUrl: '', logoBase64: '', temScraping: false, ativo: true
    }
  });

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Imagem muito pesada! Máximo 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setValue('logoBase64', base64);
        setPreviewLogo(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: ParceiroFormValues) => {
      if (editingId) {
        await atualizarParceiro(editingId, data);
        return null;
      }
      return criarParceiro({
        nome: data.nome,
        logoUrl: data.logoUrl,
        logoBase64: data.logoBase64,
        temScraping: data.temScraping
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parceiros'] });
      toast.success(editingId ? 'Parceiro atualizado!' : 'Parceiro criado!');
      reset();
      setEditingId(null);
      setMostrarForm(false);
      setPreviewLogo(null);
    },
    onError: () => {
      toast.error('Erro ao salvar parceiro');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: excluirParceiro,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parceiros'] });
      toast.success('Parceiro removido');
    }
  });

  const handleEdit = (p: Parceiro) => {
    setEditingId(p.id);
    setValue('nome', p.nome);
    setValue('logoUrl', p.logoUrl || '');
    setValue('logoBase64', p.logoBase64 || '');
    setValue('temScraping', p.temScraping);
    setValue('ativo', p.ativo);
    setPreviewLogo(p.logoBase64 || p.logoUrl || null);
    setMostrarForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Excluir este parceiro? Isso pode afetar links vinculados.')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-0 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-white/5 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase tracking-tight">Gerenciar Parceiros</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Lojas e Automação de Preços</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {/* Info Captura */}
          <div className="mb-8 p-4 rounded-xl bg-secondary/5 border border-secondary/20 flex gap-3">
            <Info className="w-5 h-5 text-secondary flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
                Status de Captura (Scraping)
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Parceiros marcados com "Captura Ativa" possuem scripts automatizados que buscam o preço em tempo real. 
                Novos parceiros iniciam sem captura até que o script correspondente seja implementado.
              </p>
            </div>
          </div>

          {/* Formulário */}
          {mostrarForm ? (
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="mb-10 glass-card p-6 rounded-2xl border border-primary/20 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {editingId ? 'Editar Parceiro' : 'Novo Parceiro'}
                </h4>
                <button type="button" onClick={() => { setMostrarForm(false); setEditingId(null); reset(); }} className="text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">Nome da Loja</label>
                  <input {...register('nome')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all" placeholder="Ex: Amazon" />
                  {errors.nome && <span className="text-red-400 text-[9px] font-bold uppercase ml-1">{errors.nome.message}</span>}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">URL da Logo (Opcional)</label>
                  <input {...register('logoUrl')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-primary/50 transition-all" placeholder="https://..." onChange={(e) => {
                    setValue('logoUrl', e.target.value);
                    if (!watch('logoBase64')) setPreviewLogo(e.target.value);
                  }} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Logo do Parceiro
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4">
                  <div className="w-20 h-20 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center relative group">
                    {previewLogo ? (
                      <img src={previewLogo} alt="Preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-white/10" />
                    )}
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-[8px] font-bold uppercase text-white">Upload</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
                    </label>
                  </div>

                  <div className="flex flex-col justify-center">
                    <div className="p-3 rounded-xl bg-white/2 border border-white/5">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Upload de Logo</p>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-[10px] text-muted-foreground file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${watch('temScraping') ? 'bg-secondary/10 border-secondary/30 text-secondary' : 'bg-white/2 border-white/5 text-muted-foreground'}`}>
                  <input type="checkbox" {...register('temScraping')} className="sr-only" />
                  {watch('temScraping') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">Captura Ativa</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer border transition-all ${watch('ativo') ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/2 border-white/5 text-muted-foreground'}`}>
                  <input type="checkbox" {...register('ativo')} className="sr-only" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{watch('ativo') ? 'Parceiro Ativo' : 'Parceiro Inativo'}</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setMostrarForm(false); setEditingId(null); reset(); }} className="flex-1 h-10 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] h-10 rounded-lg btn-neon text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingId ? <Edit2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {editingId ? 'Atualizar Parceiro' : 'Cadastrar Parceiro'}
                </button>
              </div>
            </form>
          ) : (
            <button onClick={() => setMostrarForm(true)} className="w-full py-4 mb-8 rounded-xl border border-dashed border-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Cadastrar Novo Parceiro
            </button>
          )}

          {/* Lista */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 mb-4">
              <span className="w-1 h-3 bg-muted-foreground/30 rounded-full" /> Parceiros Cadastrados
            </h3>

            {isLoading ? (
              <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
            ) : parceiros.length === 0 ? (
              <div className="py-12 text-center glass rounded-xl border-dashed border-white/5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Nenhum parceiro encontrado.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {parceiros.map((p: Parceiro) => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden border border-white/5">
                        {(p.logoBase64 || p.logoUrl) ? <img src={p.logoBase64 || p.logoUrl} alt={p.nome} className="w-full h-full object-contain p-1" /> : <Building2 className="w-5 h-5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${!p.ativo ? 'text-muted-foreground line-through' : 'text-white'}`}>{p.nome}</span>
                          {!p.ativo && <span className="text-[8px] font-black bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded uppercase">Inativo</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {p.temScraping ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-secondary uppercase tracking-tighter">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Captura Ativa
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-muted-foreground/50 uppercase tracking-tighter">
                              <AlertCircle className="w-2.5 h-2.5" /> Sem Captura
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(p)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminParceirosModal;
