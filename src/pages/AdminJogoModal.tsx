import React, { useEffect, useState } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Save, Loader2, Gamepad2, Image as ImageIcon, Star, Zap, TrendingUp, Tag, Info, Sparkles } from 'lucide-react';
import { criarJogoAdmin, atualizarJogoAdmin, listarJogosAdmin, listarPlataformas, listarCategorias, api } from '@/services/api';
import { toast } from 'sonner';

const jogoSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  slug: z.string().min(3, 'Slug inválido').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hifens'),
  descricao: z.string().min(10, 'Descrição muito curta'),
  descricaoCurta: z.string().optional(),
  imagemCapa: z.string().optional(),
  imagemCapaBase64: z.string().optional(),
  precoOriginal: z.string().refine(v => !v || !isNaN(Number(v)), 'Preço inválido'),
  precoComCupom: z.string().refine(v => !v || !isNaN(Number(v)), 'Preço inválido'),
  percentualDesconto: z.string().refine(v => !isNaN(Number(v)), 'Percentual inválido'),
  desenvolvedor: z.string().optional(),
  publicadora: z.string().optional(),
  dataLancamento: z.string().optional(),
  classificacaoEtaria: z.string().default('Livre'),
  destaque: z.boolean().default(false),
  lancamento: z.boolean().default(false),
  maisVendido: z.boolean().default(false),
  emPromocao: z.boolean().default(false),
  destaqueHoje: z.boolean().default(false),
  ativo: z.boolean().default(true),
  cliquesAfiliado: z.string().refine(v => !isNaN(Number(v)), 'Quantidade inválida'),
  tags: z.string().optional(),
});

type JogoFormValues = z.infer<typeof jogoSchema>;

interface Props {
  jogoId?: number;
  onClose: () => void;
}

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const AdminJogoModal: React.FC<Props> = ({ jogoId, onClose }) => {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [ajustandoIA, setAjustandoIA] = useState(false);

  const handleIA = async () => {
    const titulo = watch('titulo');
    if (!titulo || titulo.length < 3) {
      toast.error('Insira o título do jogo primeiro');
      return;
    }

    setAjustandoIA(true);
    try {
      const res = await api.post('/api/admin/automacao/ajustar-ia', 
        { titulo, descricao: watch('descricao') },
        { headers: { Authorization: `Bearer ${localStorage.getItem('gs_token')}` } }
      );
      
      const dados = res.data;
      if (dados.tituloLimpo) setValue('titulo', dados.tituloLimpo);
      if (dados.descricaoLonga) setValue('descricao', dados.descricaoLonga);
      if (dados.descricaoCurta) setValue('descricaoCurta', dados.descricaoCurta);
      if (dados.classificacaoEtaria) setValue('classificacaoEtaria', dados.classificacaoEtaria);
      if (dados.tags) setValue('tags', dados.tags.join(', '));
      
      toast.success('Dados ajustados com IA!');
    } catch (e) {
      toast.error('Falha ao processar com IA. Verifique sua chave API.');
    } finally {
      setAjustandoIA(false);
    }
  };

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<JogoFormValues>({
    resolver: zodResolver(jogoSchema),
    defaultValues: {
      titulo: '', slug: '', descricao: '', descricaoCurta: '', imagemCapa: '',
      imagemCapaBase64: '',
      precoOriginal: '', precoComCupom: '', percentualDesconto: '0',
      desenvolvedor: '', publicadora: '', dataLancamento: '',
      classificacaoEtaria: 'Livre', destaque: false, lancamento: false,
      maisVendido: false, emPromocao: false, destaqueHoje: false, ativo: true,
      cliquesAfiliado: '0',
      tags: '',
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit before compression
        toast.error('Imagem muito pesada! Máximo 5MB para processamento.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Criar canvas para redimensionamento e compressão
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Limitar tamanho máximo (ex: 800px de altura para capas 3:4)
          const MAX_HEIGHT = 800;
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Converter para JPEG com 80% de qualidade para reduzir drasticamente o tamanho
            const base64 = canvas.toDataURL('image/jpeg', 0.8);
            setValue('imagemCapaBase64', base64);
            setPreviewImagem(base64);
            
            // Log do tamanho para debug (opcional)
            const sizeInKb = Math.round(base64.length * 0.75 / 1024);
            console.log(`Imagem processada: ${sizeInKb}KB`);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const tituloWatch = watch('titulo');
  const imagemCapaBase64Watch = watch('imagemCapaBase64');
  const imagemCapaWatch = watch('imagemCapa');

  const { data: plataformas = [] } = useQuery({ queryKey: ['plataformas'], queryFn: listarPlataformas });
  const { data: categorias = [] } = useQuery({ queryKey: ['categorias'], queryFn: listarCategorias });

  useEffect(() => {
    if (jogoId) {
      listarJogosAdmin().then((lista: any) => {
        if (!Array.isArray(lista)) return;
        const j = lista.find((x: any) => x.id === jogoId);
        if (j) {
          setValue('titulo', j.titulo || '');
          setValue('slug', j.slug || '');
          setValue('descricao', j.descricao || '');
          setValue('descricaoCurta', j.descricao_curta || '');
          setValue('imagemCapa', j.imagem_capa || '');
          setValue('imagemCapaBase64', j.imagem_capa_base64 || '');
          setPreviewImagem(j.imagem_capa_base64 || j.imagem_capa || null);
          setValue('precoOriginal', String(j.preco_original || ''));
          setValue('precoComCupom', String(j.preco_com_cupom || ''));
          setValue('percentualDesconto', String(j.percentual_desconto || '0'));
          setValue('desenvolvedor', j.desenvolvedor || '');
          setValue('publicadora', j.publicadora || '');
          setValue('dataLancamento', j.data_lancamento?.split('T')[0] || '');
          setValue('classificacaoEtaria', j.classificacao_etaria || 'Livre');
          setValue('destaque', Boolean(j.destaque));
          setValue('lancamento', Boolean(j.lancamento));
          setValue('maisVendido', Boolean(j.mais_vendido));
          setValue('emPromocao', Boolean(j.em_promocao));
          setValue('destaqueHoje', Boolean(j.destaque_hoje));
          setValue('ativo', Boolean(j.ativo));
          setValue('cliquesAfiliado', String(j.cliques_afiliado || '0'));
          setValue('tags', (j.tags || []).join(', '));

          // Carregar categorias selecionadas com segurança
          if (Array.isArray(j.categorias)) {
            setSelectedCategorias(j.categorias.map((c: any) => c.id));
          }
        }
      });
    }
  }, [jogoId, setValue]);

  useEffect(() => {
    if (!jogoId && tituloWatch) {
      setValue('slug', slugify(tituloWatch));
    }
  }, [tituloWatch, jogoId, setValue]);

  const toggleCategoria = (id: number) => {
    setSelectedCategorias(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const onSubmit = async (data: JogoFormValues) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        precoOriginal: data.precoOriginal ? Number(data.precoOriginal) : null,
        precoComCupom: data.precoComCupom ? Number(data.precoComCupom) : null,
        percentualDesconto: Number(data.percentualDesconto),
        cliquesAfiliado: Number(data.cliquesAfiliado || 0),
        tags: data.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
        categorias: selectedCategorias,
      };

      if (jogoId) await atualizarJogoAdmin(jogoId, payload);
      else await criarJogoAdmin(payload);

      qc.invalidateQueries({ queryKey: ['admin-jogos'] });
      qc.invalidateQueries({ queryKey: ['jogos'] });
      toast.success(jogoId ? 'Jogo atualizado com sucesso!' : 'Jogo criado com sucesso!');
      onClose();
    } catch (err) {
      toast.error('Erro ao salvar o jogo. Verifique os dados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-0 border border-white/10 shadow-2xl">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-white/5 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase tracking-tight">
                {jogoId ? 'Editar Jogo' : 'Novo Registro'}
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Gerenciamento de Catálogo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" /> Informações Principais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Título do Jogo</label>
                    <input {...register('titulo')} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all" placeholder="Ex: Elden Ring" />
                    {errors.titulo && <span className="text-red-400 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.titulo.message}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={handleIA}
                    disabled={ajustandoIA}
                    className="h-12 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all flex items-center gap-2 group disabled:opacity-50"
                    title="Ajustar dados com IA"
                  >
                    {ajustandoIA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">IA</span>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">URL Slug (Identificador)</label>
                <input {...register('slug')} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono" placeholder="elden-ring" />
                {errors.slug && <span className="text-red-400 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.slug.message}</span>}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Classificação Etária</label>
                <select {...register('classificacaoEtaria')} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all">
                  {['Livre', '10+', '12+', '14+', '16+', '18+'].map(v => <option key={v} value={v} className="bg-background">{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Descrição e Mídia */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <span className="w-1 h-4 bg-primary rounded-full" /> Conteúdo e Mídia
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Descrição Curta (Cards)</label>
                <input {...register('descricaoCurta')} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all" placeholder="Resumo rápido para o catálogo..." />
              </div>
              
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Descrição Completa</label>
                <textarea {...register('descricao')} rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-all resize-none" placeholder="Texto detalhado sobre o jogo..." />
                {errors.descricao && <span className="text-red-400 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.descricao.message}</span>}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1 items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Imagem de Capa (3:4)
                </label>
                
                <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4">
                  {/* Preview */}
                  <div className="aspect-[3/4] bg-white/5 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center relative group">
                    {previewImagem ? (
                      <img src={previewImagem} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-white/10" />
                    )}
                    <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">Trocar Imagem</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="sr-only" />
                    </label>
                  </div>

                  {/* Opções de Imagem */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Upload de Arquivo (Recomendado)</p>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all" />
                      <p className="text-[8px] text-muted-foreground mt-2 uppercase tracking-tighter">* A imagem será armazenada diretamente no banco de dados (Máx 1MB).</p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/2 border border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Ou URL Externa</p>
                      <input {...register('imagemCapa')} className="w-full h-10 bg-white/5 border border-white/10 rounded-lg px-4 text-xs focus:outline-none focus:border-primary/50 transition-all" placeholder="https://exemplo.com/imagem.jpg" onChange={(e) => {
                        setValue('imagemCapa', e.target.value);
                        if (!imagemCapaBase64Watch) setPreviewImagem(e.target.value);
                      }} />
                    </div>
                  </div>
                </div>
                {errors.imagemCapa && <span className="text-red-400 text-[10px] font-bold mt-1 ml-1 uppercase">{errors.imagemCapa.message}</span>}
              </div>
            </div>
          </div>

          {/* Preços Removidos - Agora gerenciados por loja */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">Gestão de Preços Dinâmica</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                  Os preços agora são definidos individualmente por loja. O sistema calculará automaticamente o 
                  melhor preço para exibição no catálogo. Após salvar o jogo, gerencie as lojas e seus respectivos valores.
                </p>
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" /> Destaques e Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'destaque', label: 'Destaque', icon: <Star className="w-3 h-3" /> },
                  { key: 'lancamento', label: 'Lançamento', icon: <Zap className="w-3 h-3" /> },
                  { key: 'maisVendido', label: 'Top Vendas', icon: <TrendingUp className="w-3 h-3" /> },
                  { key: 'emPromocao', label: 'Promoção', icon: <Tag className="w-3 h-3" /> },
                  { key: 'destaqueHoje', label: 'Destaque de Hoje (Hero)', icon: <Star className="w-3 h-3 fill-primary" /> },
                ].map(flag => (
                  <label key={flag.key} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer border transition-all ${
                    watch(flag.key as any) ? 'bg-primary/10 border-primary/30 text-primary shadow-sm' : 'bg-white/2 border-white/5 text-muted-foreground hover:bg-white/5'
                  }`}>
                    <input type="checkbox" {...register(flag.key as any)} className="sr-only" />
                    {flag.icon}
                    <span className="text-[10px] font-black uppercase tracking-tight">{flag.label}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 block ml-1">Cliques no Link (Simula Vendas)</label>
                <input type="number" {...register('cliquesAfiliado')} className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all" />
                <p className="text-[9px] text-muted-foreground mt-1 ml-1 uppercase">* O ranking de Mais Vendidos é baseado neste número.</p>
              </div>
              <p className="text-[10px] text-muted-foreground italic px-1 leading-tight mt-4">
                * O "Destaque de Hoje" é exibido com exclusividade no banner principal da Home Page. 
                Apenas um jogo pode possuir este status por vez. O jogo deve estar como "Ativo" para aparecer.
              </p>
            </div>
          </div>

          {/* Taxonomia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full" /> Categorias
              </h3>
              <div className="flex flex-wrap gap-2">
                {categorias.map(c => (
                  <button type="button" key={c.id} onClick={() => toggleCategoria(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                      selectedCategorias.includes(c.id) ? 'bg-secondary border-secondary text-white shadow-lg' : 'bg-white/5 border-white/10 text-muted-foreground hover:border-white/20'
                    }`}>
                    {c.nome}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 self-start">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Mapeamento Automático</p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    As <strong>plataformas</strong> deste jogo serão identificadas automaticamente com base nos links que você cadastrar.
                    Não é necessário selecioná-las manualmente aqui.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer fixo do form */}
          <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="px-6 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-white/5 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-8 py-3 rounded-xl btn-neon text-white text-xs font-black uppercase tracking-widest min-w-[160px] justify-center">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminJogoModal;
