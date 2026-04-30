import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Truck, MapPin, ArrowRight, Package } from "lucide-react";

interface FreteAtivo { id: string; status: string; carga: { tipo_grao: string; quantidade: number; origem: string; destino: string; valor: number }; }
const statusLabel: Record<string, string> = { aceito: "Aceito", em_coleta: "Em Coleta", em_transito: "Em Transporte" };
const statusColor: Record<string, string> = { aceito: "bg-primary/10 text-primary", em_coleta: "bg-accent/15 text-accent-foreground", em_transito: "bg-info/15 text-info" };

const MotoristaFretesAtivos = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [fretes, setFretes] = useState<FreteAtivo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("fretes").select("id, status, carga:cargas(tipo_grao, quantidade, origem, destino, valor)").eq("motorista_id", user.id).in("status", ["aceito", "em_coleta", "em_transito"]).order("created_at", { ascending: false });
    if (data) setFretes(data.filter((f: any) => f.carga).map((f: any) => ({ id: f.id, status: f.status, carga: f.carga })));
    setLoading(false);
  };

  useEffect(() => { if (!user) return; load(); const channel = supabase.channel("motorista-ativos").on("postgres_changes", { event: "*", schema: "public", table: "fretes", filter: `motorista_id=eq.${user.id}` }, () => load()).subscribe(); return () => { supabase.removeChannel(channel); }; }, [user]);

  return (
    <div className="absolute inset-0 flex flex-col bg-background">
      <div className="rounded-b-3xl px-5 pt-3 pb-6 flex-shrink-0 gradient-hero">
        <div className="relative z-10"><p className="text-[11px] text-white/35 font-medium tracking-widest uppercase mb-0.5">GrãoHub</p><h1 className="text-[22px] font-extrabold text-white tracking-tight">Fretes Em Curso</h1><p className="text-[13px] text-white/40 mt-0.5">{fretes.length} frete{fretes.length !== 1 ? "s" : ""} ativo{fretes.length !== 1 ? "s" : ""}</p></div>
      </div>
      <div className="flex-1 overflow-y-auto phone-scroll px-4 pt-4 pb-6">
        {loading ? (<div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton-shimmer" />)}</div>) : fretes.length === 0 ? (
          <div className="text-center py-16 animate-fade-in"><div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4"><Package size={32} className="text-primary" /></div><h3 className="text-lg font-bold text-foreground mb-1">Nenhum frete em andamento</h3><p className="text-sm text-muted-foreground mb-6">Aceite um frete para começar</p><button onClick={() => navigate("/fretes")} className="px-8 py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer bg-primary text-primary-foreground shadow-md active:scale-[0.98] transition-all">Ver Fretes Disponíveis</button></div>
        ) : (
          <div className="space-y-3 animate-slide-up">
            {fretes.map(f => (<button key={f.id} onClick={() => navigate(`/fretes/${f.id}/status`)} className="w-full bg-card rounded-2xl p-4 text-left cursor-pointer active:scale-[0.99] transition-all shadow-card-soft hover:shadow-float hover:-translate-y-0.5 duration-300">
              <div className="flex justify-between items-start mb-2.5"><span className="text-[15px] font-bold text-foreground">{f.carga.tipo_grao} — {f.carga.quantidade}t</span><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor[f.status] || "bg-muted text-muted-foreground"}`}>{statusLabel[f.status] || f.status}</span></div>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground mb-2"><MapPin size={12} className="text-primary/60" /><span>{f.carga.origem}</span><ArrowRight size={12} className="text-primary/40" /><span>{f.carga.destino}</span></div>
              <span className="text-[15px] font-extrabold text-primary">R${Number(f.carga.valor).toLocaleString("pt-BR")}</span>
            </button>))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MotoristaFretesAtivos;
