import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAppLayout } from "@/hooks/useAppLayout";
import { useSubscription } from "@/hooks/useSubscription";
import { STRIPE_PLANS, type StripePlanKey } from "@/lib/stripe";
import { friendlyError } from "@/lib/friendlyError";
import { ArrowLeft, Check, Crown, Zap, Star } from "lucide-react";

const planOrder: StripePlanKey[] = ["profissional", "motorista_pro", "galpao"];

const planColors: Record<StripePlanKey, { gradient: string; badge: string; icon: typeof Crown }> = {
  profissional: { gradient: "from-primary/10 to-primary/5", badge: "bg-primary text-primary-foreground", icon: Crown },
  motorista_pro: { gradient: "from-accent/20 to-accent/5", badge: "bg-accent text-accent-foreground", icon: Zap },
  galpao: { gradient: "from-secondary/20 to-secondary/5", badge: "bg-secondary text-secondary-foreground", icon: Star },
};

const PlanosScreen = () => {
  const navigate = useNavigate();
  const { toast } = useAppLayout();
  const [loading, setLoading] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const { subscribed, planKey: activePlan, subscriptionEnd, refresh } = useSubscription();

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast("✅ Assinatura realizada com sucesso!");
      refresh();
    } else if (searchParams.get("checkout") === "cancel") {
      toast("Checkout cancelado.");
    }
  }, [searchParams, toast, refresh]);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast("Faça login primeiro."); navigate("/login"); return; }
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast(friendlyError(err.message || "Falha ao criar checkout"));
    } finally { setLoading(null); }
  };

  const handleManageSubscription = async () => {
    setLoading("portal");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast("Faça login primeiro."); return; }
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast(friendlyError(err.message || "Erro ao abrir portal"));
    } finally { setLoading(null); }
  };

  return (
    <div className="absolute inset-0 overflow-y-auto phone-scroll bg-background">
      <div className="px-5 pt-14 pb-28 max-w-3xl mx-auto">
        <button onClick={() => navigate("/perfil")} className="flex items-center gap-1.5 bg-transparent border-none text-sm font-medium text-muted-foreground cursor-pointer p-0 mb-8 hover:text-primary transition-colors">
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold text-foreground tracking-tight mb-2">Planos GrãoHub</h1>
          <p className="text-muted-foreground">Escolha o melhor plano para sua operação</p>
        </div>

        {/* Free plan card */}
        <div className="bg-card rounded-2xl p-5 mb-4 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🆓</span>
            <span className="text-lg font-extrabold text-foreground">Grátis</span>
            {!subscribed && (
              <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                Seu plano atual
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">Funcionalidades básicas para começar</p>
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-3xl font-extrabold text-foreground">R$ 0</span>
            <span className="text-sm text-muted-foreground">/mês</span>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Check size={14} className="text-muted-foreground flex-shrink-0" />Até 3 cargas por mês</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-muted-foreground flex-shrink-0" />Até 2 anúncios ativos</li>
            <li className="flex items-center gap-2"><Check size={14} className="text-muted-foreground flex-shrink-0" />Funcionalidades básicas</li>
          </ul>
        </div>

        {/* Paid plans */}
        {planOrder.map((key) => {
          const plan = STRIPE_PLANS[key];
          const colors = planColors[key];
          const isActive = subscribed && activePlan === key;
          const IconComponent = colors.icon;

          return (
            <div
              key={key}
              className={`relative rounded-2xl p-5 mb-4 border-2 transition-all ${
                isActive
                  ? "border-primary bg-gradient-to-br " + colors.gradient + " shadow-lg"
                  : "border-border bg-card card-shadow-lg"
              }`}
            >
              {isActive && (
                <span className="absolute -top-3 right-4 text-xs font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground shadow-sm">
                  ✅ Seu plano
                </span>
              )}

              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{plan.icon}</span>
                <span className="text-lg font-extrabold text-foreground">{plan.name}</span>
                <IconComponent size={16} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-primary">
                  R$ {plan.amount.toLocaleString("pt-BR")}
                </span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check size={14} className="text-primary flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>

              {isActive ? (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Ativo até {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString("pt-BR") : "—"}
                  </p>
                  <button
                    onClick={handleManageSubscription}
                    disabled={loading === "portal"}
                    className="w-full py-3 rounded-xl font-bold text-sm border border-border bg-card text-foreground cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-all"
                  >
                    {loading === "portal" ? "Abrindo..." : "Gerenciar assinatura"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.price_id)}
                  disabled={loading === plan.price_id}
                  className="w-full py-4 rounded-xl font-bold text-[15px] border-none cursor-pointer bg-primary text-primary-foreground disabled:opacity-50 active:scale-[0.98] transition-all shadow-md min-h-[52px]"
                >
                  {loading === plan.price_id ? "Processando..." : "Assinar agora"}
                </button>
              )}
            </div>
          );
        })}

        {subscribed && (
          <button
            onClick={handleManageSubscription}
            disabled={loading === "portal"}
            className="w-full py-3.5 rounded-xl font-bold text-sm border border-border bg-card text-foreground cursor-pointer disabled:opacity-50 active:scale-[0.98] transition-all min-h-[48px] mt-2"
          >
            {loading === "portal" ? "Abrindo..." : "Gerenciar assinatura existente"}
          </button>
        )}

        <p className="text-xs text-muted-foreground text-center mt-4">
          Pagamento seguro via Stripe. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
};

export default PlanosScreen;
