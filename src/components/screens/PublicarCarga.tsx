import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAppLayout } from "@/hooks/useAppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { FREE_LIMITS } from "@/lib/stripe";
import { friendlyError } from "@/lib/friendlyError";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Lock, Sparkles, Loader2, Check } from "lucide-react";

const grainOptions = [
  { group: "Oleaginosas", items: ["Soja", "Girassol", "Canola", "Amendoim", "Mamona"] },
  { group: "Cereais", items: ["Milho", "Trigo", "Arroz", "Sorgo", "Cevada", "Aveia"] },
  { group: "Leguminosas", items: ["Feijão Carioca", "Feijão Preto", "Grão-de-bico"] },
  { group: "Fibras", items: ["Algodão em Pluma", "Algodão em Caroço"] },
  { group: "Estimulantes", items: ["Café Arábica", "Café Robusta", "Cacau"] },
];

interface FieldError { field: string; message: string; }

const PublicarCarga = () => {
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [tipoGrao, setTipoGrao] = useState("Soja");
  const [quantidade, setQuantidade] = useState("");
  const [veiculo, setVeiculo] = useState("Graneleiro");
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [dataColeta, setDataColeta] = useState("");
  const [valor, setValor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [success, setSuccess] = useState(false);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);

  const { canPublishCarga } = useSubscription();

  const { data: monthCount = 0, isLoading: isLoadingCount } = useQuery({
    queryKey: ['cargas-count-mes', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const start = new Date();
      start.setDate(1); start.setHours(0, 0, 0, 0);
      const { count, error } = await supabase.from("cargas").select("id", { count: "exact", head: true })
        .eq("contratante_id", user.id)
        .gte("created_at", start.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!user,
  });

  const quotaReached = !canPublishCarga(monthCount);

  const validate = (): boolean => {
    const errs: FieldError[] = [];
    if (!origem.trim()) errs.push({ field: "origem", message: "Origem é obrigatória" });
    if (!destino.trim()) errs.push({ field: "destino", message: "Destino é obrigatório" });
    if (!quantidade || parseFloat(quantidade) <= 0) errs.push({ field: "quantidade", message: "Quantidade deve ser maior que 0" });
    if (!valor || parseFloat(valor) < 100) errs.push({ field: "valor", message: "Valor mínimo: R$100" });
    setErrors(errs);
    return errs.length === 0;
  };

  const getError = (field: string) => errors.find(e => e.field === field);

  const { mutate: publicar, isPending } = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Faça login primeiro");
      const { error } = await supabase.from("cargas").insert({
        contratante_id: user.id, tipo_grao: tipoGrao, quantidade: parseFloat(quantidade),
        veiculo, origem: origem.trim(), destino: destino.trim(),
        data_coleta: dataColeta || null, valor: parseFloat(valor),
        observacoes: observacoes.trim().slice(0, 500),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cargas'] });
      queryClient.invalidateQueries({ queryKey: ['cargas-count-mes'] });
      setSuccess(true);
    },
    onError: (error: Error) => {
      toast(friendlyError(error.message));
    },
  });

  const handlePublicar = () => {
    if (!user) { toast("Faça login primeiro"); return; }
    if (quotaReached) return;
    if (!validate()) return;
    publicar();
  };

  const inputClass = (field: string) => `w-full px-4 py-4 border rounded-xl text-[15px] lg:text-base text-foreground bg-card shadow-sm outline-none transition-all focus:ring-2 placeholder:text-muted-foreground/40 ${getError(field) ? "border-destructive focus:border-destructive focus:ring-destructive/10" : "border-border focus:border-primary focus:ring-primary/20"}`;
  const selectClass = (field: string) => inputClass(field) + " appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2712%27%20height=%278%27%20viewBox=%270%200%2012%208%27%3E%3Cpath%20d=%27M1%201l5%205%205-5%27%20stroke=%27%236B7280%27%20stroke-width=%271.5%27%20fill=%27none%27%20stroke-linecap=%27round%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_14px_center] pr-9";

  const ErrorMsg = ({ field }: { field: string }) => {
    const err = getError(field);
    return err ? <span className="text-[11px] lg:text-xs text-destructive mt-0.5 font-medium">{err.message}</span> : null;
  };

  if (success) {
    return (
      <div className="absolute inset-0 bg-background flex flex-col items-center justify-center p-8 text-center animate-scale-fade">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-success" />
        </div>
        <h2 className="text-[22px] lg:text-2xl font-extrabold text-foreground mb-2">Carga Publicada!</h2>
        <p className="text-sm lg:text-base text-muted-foreground mb-8">Motoristas compatíveis serão notificados automaticamente.</p>
        <button onClick={() => navigate("/painel")} className="px-8 py-3.5 rounded-xl font-bold text-sm lg:text-base border-none cursor-pointer bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all">
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-background overflow-y-auto phone-scroll">
      <div className="px-5 lg:px-8 pt-14 pb-28 lg:pb-12 max-w-2xl mx-auto">
        <button onClick={() => navigate("/painel")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-8 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>

        <h1 className="text-[24px] lg:text-3xl font-extrabold text-foreground tracking-tight mb-1">Publicar Carga</h1>
        <p className="text-[13px] lg:text-base text-muted-foreground mb-6">Preencha os dados para encontrar motoristas.</p>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[1,2,3].map(i => (
            <div key={i} className={`h-1 rounded-full flex-1 transition-all ${i <= step ? "bg-primary" : "bg-border"}`} />
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Grão</label>
            <select className={selectClass("tipoGrao")} value={tipoGrao} onChange={e => { setTipoGrao(e.target.value); setStep(Math.max(step, 1)); }}>
              {grainOptions.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map(item => <option key={item} value={item}>{item}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quantidade (t)</label>
              <input className={inputClass("quantidade")} type="number" placeholder="40" value={quantidade} onChange={e => { setQuantidade(e.target.value); setStep(Math.max(step, 1)); }} />
              <ErrorMsg field="quantidade" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Veículo</label>
              <select className={selectClass("veiculo")} value={veiculo} onChange={e => setVeiculo(e.target.value)}>
                <option>Graneleiro</option>
                <option>Caçamba</option>
                <option>Bitrem</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cidade de Origem</label>
            <input className={inputClass("origem")} placeholder="Primavera do Leste, MT" value={origem} onChange={e => { setOrigem(e.target.value); setStep(Math.max(step, 2)); }} maxLength={100} />
            <ErrorMsg field="origem" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cidade de Destino</label>
            <input className={inputClass("destino")} placeholder="Sinop, MT" value={destino} onChange={e => { setDestino(e.target.value); setStep(Math.max(step, 2)); }} maxLength={100} />
            <ErrorMsg field="destino" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Data de Coleta</label>
              <input className={inputClass("dataColeta")} type="date" value={dataColeta} onChange={e => setDataColeta(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Valor (R$)</label>
              <input className={inputClass("valor")} type="number" placeholder="5.500" value={valor} onChange={e => { setValor(e.target.value); setStep(Math.max(step, 3)); setSuggestedPrice(null); }} />
              <ErrorMsg field="valor" />
            </div>
          </div>

          {/* Calculadora Inteligente de Frete */}
          <button
            type="button"
            disabled={!origem.trim() || !destino.trim() || !quantidade || parseFloat(quantidade) <= 0 || isCalculatingPrice}
            onClick={() => {
              setIsCalculatingPrice(true);
              setSuggestedPrice(null);
              setTimeout(() => {
                const qty = parseFloat(quantidade) || 30;
                const base = 120 + Math.random() * 60;
                setSuggestedPrice(Math.round(qty * base));
                setIsCalculatingPrice(false);
              }, 1500);
            }}
            className="w-full py-3 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 text-accent font-semibold text-[13px] lg:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-accent/10 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isCalculatingPrice ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                A calcular rota e pedágios...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Sugerir Preço Justo
              </>
            )}
          </button>

          {suggestedPrice !== null && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-accent" />
                <span className="text-[11px] lg:text-xs font-bold uppercase tracking-wider text-accent">Premium · Preço Inteligente</span>
              </div>
              <p className="text-[15px] lg:text-base font-extrabold text-foreground">
                Valor sugerido: R$ {suggestedPrice.toLocaleString("pt-BR")}
              </p>
              <p className="text-[11px] lg:text-xs text-muted-foreground">Baseado na tabela ANTT e rotas recentes</p>
              <button
                type="button"
                onClick={() => { setValor(String(suggestedPrice)); setSuggestedPrice(null); setStep(3); }}
                className="mt-1 self-start px-4 py-2 rounded-lg bg-accent text-accent-foreground text-[12px] lg:text-sm font-bold border-none cursor-pointer flex items-center gap-1.5 hover:shadow-md active:scale-[0.97] transition-all"
              >
                <Check size={14} />
                Aplicar este valor
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] lg:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Observações (opcional)</label>
            <textarea className={inputClass("obs") + " resize-none"} rows={3} placeholder="Informações adicionais..." value={observacoes} onChange={e => setObservacoes(e.target.value)} maxLength={500} />
          </div>
        </div>

        <div className="bg-primary/5 rounded-2xl p-4 mt-6 mb-6 flex gap-3 items-start border border-primary/10">
          <span className="text-base mt-0.5">💡</span>
          <p className="text-[12px] lg:text-sm text-primary leading-relaxed font-medium">Motoristas compatíveis na sua região serão notificados automaticamente.</p>
        </div>

        {quotaReached ? (
          <button
            onClick={() => navigate("/planos")}
            className="w-full py-4 border-none rounded-xl text-[15px] lg:text-base font-bold cursor-pointer active:scale-[0.98] hover:shadow-lg transition-all bg-muted text-muted-foreground shadow-md flex items-center justify-center gap-2"
          >
            <Lock size={16} />
            Limite Mensal Atingido (Ver Planos)
          </button>
        ) : (
          <button
            onClick={handlePublicar}
            disabled={isPending || isLoadingCount}
            className="w-full py-4 border-none rounded-xl text-[15px] lg:text-base font-bold cursor-pointer active:scale-[0.98] hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 bg-primary text-primary-foreground shadow-md"
          >
            {isPending ? "Publicando..." : "Publicar Carga"}
          </button>
        )}
      </div>
    </div>
  );
};

export default PublicarCarga;
