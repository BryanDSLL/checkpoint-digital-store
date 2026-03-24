import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Zap, Loader2, CheckCircle2, AlertCircle, ExternalLink, ListPlus } from 'lucide-react';
import { api } from '@/services/api'; // Precisamos exportar a instância do axios no api.ts
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
}

const AdminAutomacaoModal: React.FC<Props> = ({ onClose }) => {
  const qc = useQueryClient();
  const [linksText, setLinksText] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);

  const mutation = useMutation({
    mutationFn: async (links: string[]) => {
      const res = await api.post('/api/admin/automacao/importar-links', { links }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('gs_token')}` }
      });
      return res.data.resultados;
    },
    onSuccess: (data) => {
      setResultados(data);
      const sucessos = data.filter((r: any) => r.status === 'sucesso').length;
      if (sucessos > 0) {
        toast.success(`${sucessos} link(s) processados com sucesso!`);
        qc.invalidateQueries({ queryKey: ['jogos-admin'] });
      }
    },
    onError: () => {
      toast.error('Erro ao processar automação');
    }
  });

  const handleProcessar = () => {
    const links = linksText.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (links.length === 0) {
      toast.error('Insira pelo menos um link válido (http...)');
      return;
    }
    mutation.mutate(links);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-0 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-white/5 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="font-display text-xl font-black uppercase tracking-tight">Automação de Posts</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Importação Automática via Link</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {/* Instruções */}
          <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3">
            <ListPlus className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
                Como funciona
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed opacity-80">
                Cole um ou mais links de parceiros (um por linha). O sistema irá acessar a página, extrair título, descrição e imagem automaticamente para criar o post. 
                Se o jogo já existir, apenas o novo link de afiliado será adicionado.
              </p>
            </div>
          </div>

          {/* Input */}
          {!mutation.isSuccess ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block ml-1">
                  Links de Afiliados (Lote)
                </label>
                <textarea
                  value={linksText}
                  onChange={(e) => setLinksText(e.target.value)}
                  placeholder="https://www.nuuvem.com/item/game-1&#10;https://www.amazon.com.br/game-2"
                  className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono resize-none"
                />
              </div>

              <button
                onClick={handleProcessar}
                disabled={mutation.isPending}
                className="w-full h-14 rounded-2xl btn-neon text-white font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processando Links...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 fill-current" />
                    Iniciar Importação
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Resultados do Processamento</h3>
                <button 
                  onClick={() => { setLinksText(''); mutation.reset(); }}
                  className="text-[10px] font-black uppercase text-primary hover:underline"
                >
                  Processar Novos Links
                </button>
              </div>

              <div className="space-y-3">
                {resultados.map((res, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${res.status === 'sucesso' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {res.status === 'sucesso' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="font-bold text-sm truncate block">{res.jogo || res.url}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">{res.url}</p>
                        {res.status === 'sucesso' && (
                          <div className="flex gap-2 mt-2">
                            <span className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-[8px] font-black uppercase text-muted-foreground">Parceiro: {res.parceiro}</span>
                            {res.novoJogo && <span className="px-1.5 py-0.5 rounded-[4px] bg-primary/20 text-[8px] font-black uppercase text-primary">Novo Jogo Criado</span>}
                          </div>
                        )}
                        {res.status === 'erro' && (
                          <p className="text-[10px] text-red-400 font-bold mt-1 uppercase">{res.mensagem}</p>
                        )}
                      </div>
                      <a href={res.url} target="_blank" rel="noreferrer" className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full h-12 rounded-xl border border-white/10 text-muted-foreground hover:bg-white/5 font-black uppercase tracking-widest text-[10px]"
              >
                Fechar Automação
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAutomacaoModal;
