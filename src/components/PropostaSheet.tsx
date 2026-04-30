import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { notificar } from "@/lib/notificar";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface PropostaSheetProps {
  open: boolean;
  onClose: () => void;
  carga: {
    id: string;
    valor: number;
    tipo_grao: string;
    origem: string;
    destino: string;
    contratante_id: string;
  };
  onSuccess: () => void;
}

export default function PropostaSheet({ open, onClose, carga, onSuccess }: PropostaSheetProps) {
  const { user } = useAuth();
  const [valor, setValor] = useState(String(carga.valor));
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valorNum = parseFloat(valor.replace(",", ".")) || 0;
  const diff = valorNum - carga.valor;
  const diffPct = carga.valor > 0 ? (diff / carga.valor) * 100 : 0;

  const DiffIcon = diff < 0 ? TrendingDown : diff > 0 ? TrendingUp : Minus;
  const diffColor = diff < 0 ? "text-success" : diff > 0 ? "text-destructive" : "text-muted-foreground";

  const handleSubmit = async () => {
    if (!user) return;
    if (valorNum < 100) { setError("Valor mínimo é R$ 100."); return; }
    if (valorNum === carga.valor) { setError("Informe um valor diferente do original para negociar."); return; }

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from("propostas").insert({
      carga_id: carga.id,
      motorista_id: user.id,
      valor_proposta: valorNum,
      mensagem: mensagem.trim() || null,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        setError("Você já tem uma proposta pendente para este frete.");
      } else {
        setError("Erro ao enviar proposta. Tente novamente.");
      }
      setLoading(false);
      return;
    }

    await notificar({
      user_id: carga.contratante_id,
      titulo: "Nova proposta de valor",
      mensagem: `Motorista propôs R$ ${valorNum.toLocaleString("pt-BR")} para o frete de ${carga.tipo_grao} (${carga.origem} → ${carga.destino}).`,
      url: "/painel",
    });

    setLoading(false);
    onSuccess();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl pb-10">
        <SheetHeader className="mb-5">
          <SheetTitle>Negociar Valor</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {carga.tipo_grao} · {carga.origem} → {carga.destino}
          </p>
        </SheetHeader>

        <div className="flex items-center justify-between bg-muted/50 rounded-xl px-4 py-3 mb-5">
          <span className="text-sm text-muted-foreground">Valor publicado</span>
          <span className="text-base font-bold text-foreground">
            R$ {carga.valor.toLocaleString("pt-BR")}
          </span>
        </div>

        <div className="mb-2">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Sua proposta (R$)
          </label>
          <input
            type="number"
            min={100}
            step={50}
            value={valor}
            onChange={(e) => { setValor(e.target.value); setError(null); }}
            className="w-full h-12 px-4 rounded-xl bg-card border border-border text-[18px] font-bold text-foreground outline-none focus:border-primary transition-colors"
            placeholder="0"
          />
        </div>

        {valorNum > 0 && valorNum !== carga.valor && (
          <div className={`flex items-center gap-1.5 mb-4 text-sm font-semibold ${diffColor}`}>
            <DiffIcon size={14} />
            <span>
              {diff > 0 ? "+" : ""}R$ {Math.abs(diff).toLocaleString("pt-BR")} ({diffPct > 0 ? "+" : ""}{diffPct.toFixed(1)}%)
            </span>
          </div>
        )}

        <div className="mb-5">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
            Mensagem (opcional)
          </label>
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value.slice(0, 200))}
            placeholder="Ex: Tenho disponibilidade imediata, posso partir hoje."
            className="w-full h-20 px-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
          />
          <span className="text-xs text-muted-foreground/60 float-right">{mensagem.length}/200</span>
        </div>

        {error && <p className="text-sm text-destructive mb-3 font-medium">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || valorNum < 100}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold text-[15px] border-none cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-all shadow-md hover:opacity-90"
        >
          {loading ? "Enviando..." : "Enviar Proposta"}
        </button>
      </SheetContent>
    </Sheet>
  );
}
