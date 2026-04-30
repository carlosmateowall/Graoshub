// GrãoHub Stripe product/price mapping
export const STRIPE_PLANS = {
  profissional: {
    name: "Profissional",
    description: "Cargas ilimitadas, analytics e suporte prioritário",
    price_id: "price_1TFheLDHwvoo8jQWmewDU1fs",
    product_id: "prod_UE9yFkucSVhlnR",
    amount: 149,
    interval: "month" as const,
    icon: "📊",
    target: "contratante" as const,
    features: [
      "Cargas ilimitadas por mês",
      "Analytics de operação",
      "Suporte prioritário",
      "Destaque nos anúncios",
    ],
  },
  motorista_pro: {
    name: "Motorista Pro",
    description: "Acesso antecipado a cargas, filtros avançados e selo verificado",
    price_id: "price_1TFheuDHwvoo8jQWdSEXyIaN",
    product_id: "prod_UE9ygLjwZd42zw",
    amount: 79,
    interval: "month" as const,
    icon: "🚛",
    target: "motorista" as const,
    features: [
      "Ver cargas antes dos free",
      "Filtros avançados de busca",
      "Selo verificado no perfil",
      "Suporte prioritário",
    ],
  },
  galpao: {
    name: "Galpão / Armazém",
    description: "Mensalidade por galpão cadastrado",
    price_id: "price_1TBMAwGyt55W2nPZPP4q54qR",
    product_id: "prod_U9fV8qURQEGrXs",
    amount: 2000,
    interval: "month" as const,
    icon: "🏭",
    target: "armazem" as const,
    features: [
      "Visibilidade para motoristas e contratantes",
      "Destaque no mapa de armazéns",
      "Dashboard com métricas",
      "Suporte prioritário",
    ],
  },
} as const;

export type StripePlanKey = keyof typeof STRIPE_PLANS;

// Free plan limits
export const FREE_LIMITS = {
  cargas_por_mes: 3,
  anuncios_ativos: 2,
} as const;

// Boost product
export const BOOST_PRODUCT = {
  name: "Boost de Anúncio - 7 dias",
  price_id: "price_1TG0aoDHwvoo8jQWzrEewx7z",
  product_id: "prod_UETXVngXWA8IGn",
  amount: 29,
  duration_days: 7,
} as const;

// Helper to find plan by product_id
export function getPlanByProductId(productId: string): StripePlanKey | null {
  for (const [key, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.product_id === productId) return key as StripePlanKey;
  }
  return null;
}
