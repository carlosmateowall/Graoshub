import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, MapPin, Scale, CalendarDays, Truck, User, RefreshCcw } from "lucide-react";
import { useAppLayout } from "@/hooks/useAppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";

type Carga = Tables<"cargas">;

const FreteDetalhe = () => {
  const { id: cargaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const { user } = useAuth();
  const [carga, setCarga] = useState<Carga | null>(null);
  const [contratanteNome, setContratanteNome] = useState("");
  const [contratanteAvatar, setContratanteAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [retornoCargas, setRetornoCargas] = useState<Carga[]>([]);
  const [retornoLoading, setRetornoLoading] = useState(false);

  useEffect(() => {
    if (!cargaId) return;
    const load = async () => {
      const { data } = await supabase.from("cargas").select("*").eq("id", cargaId).single();
      if (data) {
        setCarga(data);
        const { data: prof } = await supabase.from("profiles").select("nome, avatar_url").eq("id", data.contratante_id).single();
        setContratanteNome(prof?.nome || "Contratante");
        setContratanteAvatar(prof?.avatar_url || null);
      }
    };
    load();
  }, [cargaId]);

  useEffect(() => {
    if (!carga?.destino || !carga?.id) return;
    setRetornoLoading(true);
    const fetchRetorno = async () => {
      const { data } = await supabase
        .from("cargas")
        .select("*")
        .eq("status", "disponivel")
        .eq("origem", carga.destino)
        .neq("id", carga.id)
        .limit(3);
      setRetornoCargas(data || []);
      setRetornoLoading(false);
    };
    fetchRetorno();
  }, [carga?.destino, carga?.id]);

  const handleAceitar = async () => {
    if (!user || !carga) return;
    setLoading(true);
    try {
      const { data: freteId, error } = await supabase.rpc("accept_frete", {
        _carga_id: carga.id,
        _motorista_id: user.id,
      });
      if (error) {
        toast(friendlyError(error.message));
      } else {
        toast("Frete aceito! O contratante foi notificado.");
        navigate(`/fretes/${freteId}/status`);
      }
    } catch {
      toast("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  if (!carga) return (
    <div className="absolute inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col gap-3 w-full px-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    </div>
  );

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("pt-BR") : "A combinar";

  return (
    <div className="absolute inset-0 overflow-y-auto phone-scroll bg-background">
      <div className="rounded-b-3xl px-5 pt-14 pb-8 text-primary-foreground gradient-hero relative overflow-hidden">
        <button onClick={() => navigate("/fretes")} className="absolute top-14 left-5 flex items-center gap-1.5 bg-transparent border-none text-sm font-semibold text-primary-foreground/70 cursor-pointer p-0" aria-label="Voltar"><ArrowLeft size={18} /></button>
        <div className="mt-8">
          <span className="text-[11px] text-white/35 font-medium tracking-widest uppercase">{carga.veiculo}</span>
          <h1 className="text-[28px] font-extrabold tracking-tight mb-2">{carga.tipo_grao}</h1>
          <span className="text-[32px] font-extrabold text-accent">R${Number(carga.valor).toLocaleString("pt-BR")}</span>
          <div className="flex items-center gap-2 mt-3 text-[13px] text-white/60"><MapPin size={14} /><span>{carga.origem}</span><span>→</span><span>{carga.destino}</span></div>
        </div>
      </div>

      <div className="px-5 pt-5 pb-28">
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Scale, label: "Quantidade", val: `${carga.quantidade}t` },
            { icon: CalendarDays, label: "Coleta", val: fmtDate(carga.data_coleta) },
            { icon: Truck, label: "Veículo", val: carga.veiculo || "—" },
            { icon: MapPin, label: "Destino", val: carga.destino },
          ].map((i) => (
            <div key={i.label} className="bg-card rounded-2xl p-4 shadow-card-soft">
              <div className="flex items-center gap-2 mb-2"><i.icon size={14} className="text-muted-foreground/60" /><span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{i.label}</span></div>
              <span className="text-[15px] font-bold text-foreground">{i.val}</span>
            </div>
          ))}
        </div>

        <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Contratante</h3>
        <div className="bg-card rounded-2xl p-4 flex items-center gap-4 mb-6 shadow-card-soft">
          <div className="w-12 h-12 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {contratanteAvatar ? <img src={contratanteAvatar} alt="" className="w-full h-full object-cover" /> : <User size={20} className="text-primary" />}
          </div>
          <span className="text-[15px] font-bold text-foreground">{contratanteNome}</span>
        </div>

        {carga.observacoes && (
          <>
            <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Observações</h3>
            <div className="bg-card rounded-2xl p-4 shadow-card-soft mb-6">
              <p className="text-sm text-muted-foreground leading-relaxed">{carga.observacoes}</p>
            </div>
          </>
        )}

        {retornoLoading && <Skeleton className="h-24 w-full rounded-2xl mb-6" />}

        {!retornoLoading && retornoCargas.length > 0 && (
          <div className="rounded-2xl border-2 border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/5 p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--success))]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <RefreshCcw size={20} className="text-[hsl(var(--success))]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-foreground mb-1">Garanta sua Volta 🚛</p>
                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  Encontramos <span className="font-bold text-[hsl(var(--success))]">{retornoCargas.length} carga(s)</span> saindo de <span className="font-semibold text-foreground">{carga.destino}</span>. Aceite este frete e já engate a viagem de volta!
                </p>
                <button onClick={() => navigate(`/fretes?origem=${encodeURIComponent(carga.destino)}`)}
                  className="mt-3 px-4 py-2 rounded-lg text-[12px] font-bold bg-[hsl(var(--success))] text-primary-foreground cursor-pointer border-none active:scale-[0.97] transition-all">
                  Ver fretes de retorno
                </button>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleAceitar} disabled={loading}
          className="w-full h-12 border-none rounded-xl text-[15px] font-bold cursor-pointer active:scale-[0.98] transition-all mb-3 disabled:opacity-50 bg-accent text-accent-foreground shadow-md hover:opacity-90">
          {loading ? "Aceitando..." : "Aceitar Frete"}
        </button>
        <button onClick={() => { toast("Frete recusado."); navigate("/fretes"); }}
          className="w-full h-12 border-2 border-border/50 rounded-xl text-[15px] font-semibold cursor-pointer text-muted-foreground bg-transparent active:scale-[0.98] transition-all">
          Recusar
        </button>
      </div>
    </div>
  );
};

export default FreteDetalhe;
