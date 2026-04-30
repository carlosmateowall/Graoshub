import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { ArrowLeft, Lock, BarChart3, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface AnalyticsData {
  cargas_por_mes: { mes: string; total: number }[] | null;
  fretes_por_mes: { mes: string; total: number }[] | null;
  valor_por_mes: { mes: string; total: number }[] | null;
}

const formatMonth = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
};

const AnalyticsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro, loading: subLoading } = useSubscription();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isPro) { setLoading(false); return; }
    (supabase as any).rpc("get_analytics_data", { _user_id: user.id }).then(({ data: d }: any) => {
      if (d) setData(d);
      setLoading(false);
    });
  }, [user, isPro]);

  if (subLoading) return <div className="absolute inset-0 flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!isPro) {
    return (
      <div className="absolute inset-0 overflow-y-auto phone-scroll bg-background">
        <div className="px-5 pt-14 pb-28 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-8">
            <ArrowLeft size={18} /> Voltar
          </button>
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center mx-auto mb-4"><Lock size={32} className="text-primary" /></div>
            <h2 className="text-xl font-extrabold text-foreground mb-2">Analytics Pro</h2>
            <p className="text-sm text-muted-foreground mb-6">Disponível apenas para assinantes Pro. Veja gráficos de cargas, fretes e valor movimentado.</p>
            <button onClick={() => navigate("/planos")} className="px-8 py-3.5 rounded-xl font-bold text-sm border-none cursor-pointer bg-primary text-primary-foreground shadow-md">Ver Planos</button>
          </div>
        </div>
      </div>
    );
  }

  const charts = [
    { title: "Cargas por Mês", icon: BarChart3, data: data?.cargas_por_mes, color: "hsl(var(--primary))" },
    { title: "Fretes por Mês", icon: TrendingUp, data: data?.fretes_por_mes, color: "hsl(var(--accent))" },
    { title: "Valor Movimentado (R$)", icon: DollarSign, data: data?.valor_por_mes, color: "hsl(var(--primary))" },
  ];

  return (
    <div className="absolute inset-0 overflow-y-auto phone-scroll bg-background">
      <div className="px-5 lg:px-8 pt-14 pb-28 lg:pb-12 max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-6">
          <ArrowLeft size={18} /> Voltar
        </button>
        <h1 className="text-[24px] font-extrabold text-foreground tracking-tight mb-6">📊 Analytics</h1>

        {loading ? (
          <div className="flex flex-col gap-4">{[1, 2, 3].map(i => <div key={i} className="h-52 skeleton-shimmer" />)}</div>
        ) : (
          <div className="flex flex-col gap-5">
            {charts.map((chart) => (
              <div key={chart.title} className="bg-card rounded-2xl p-5 card-shadow-lg border border-border">
                <div className="flex items-center gap-2 mb-4">
                  <chart.icon size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-foreground">{chart.title}</h3>
                </div>
                {chart.data && chart.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chart.data.map(d => ({ ...d, label: formatMonth(d.mes) }))}>
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Bar dataKey="total" fill={chart.color} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsScreen;
