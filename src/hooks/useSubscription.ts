import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPlanByProductId, FREE_LIMITS, type StripePlanKey } from "@/lib/stripe";

interface SubscriptionState {
  loading: boolean;
  subscribed: boolean;
  planKey: StripePlanKey | null;
  productId: string | null;
  subscriptionEnd: string | null;
}

export function useSubscription() {
  const { session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    subscribed: false,
    planKey: null,
    productId: null,
    subscriptionEnd: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setState({ loading: false, subscribed: false, planKey: null, productId: null, subscriptionEnd: null });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      const planKey = data?.product_id ? getPlanByProductId(data.product_id) : null;
      setState({
        loading: false,
        subscribed: !!data?.subscribed,
        planKey,
        productId: data?.product_id ?? null,
        subscriptionEnd: data?.subscription_end ?? null,
      });
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [session?.access_token]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const isPro = state.subscribed;

  const canPublishCarga = (currentMonthCount: number) =>
    isPro || currentMonthCount < FREE_LIMITS.cargas_por_mes;

  const canPublishAnuncio = (activeCount: number) =>
    isPro || activeCount < FREE_LIMITS.anuncios_ativos;

  return { ...state, isPro, canPublishCarga, canPublishAnuncio, refresh: checkSubscription };
}
