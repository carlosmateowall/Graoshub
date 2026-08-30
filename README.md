# GraoHub

> Logística agrícola conectando embarcadores e motoristas de frete.

**No ar:** [graoshub.com](https://graoshub.com)

---

## O problema

Frete agrícola no Brasil ainda se resolve por telefone e grupo de WhatsApp. O embarcador não sabe onde está a carga, o motorista não sabe se vai receber, e quando dá problema não existe registro de quem prometeu o quê.

O GraoHub coloca esse ciclo inteiro em um lugar só: da publicação da carga até a avaliação depois da entrega.

## O que o app faz

| Módulo | O que resolve |
|---|---|
| **Cargas e propostas** | Embarcador publica a carga, motoristas enviam propostas, o embarcador aceita a que preferir |
| **Rastreamento** | Mapa ao vivo acompanhando a carga em trânsito |
| **Avaliações** | Nota nos dois sentidos ao fim do frete, cobrada automaticamente quando a carga é marcada como entregue |
| **Disputas** | Fluxo formal para quando algo dá errado, com registro do histórico |
| **Notificações** | Push no celular, com link direto para a tela que originou o aviso |
| **Perfis e permissões** | Embarcador, motorista e administrador, cada um com sua rota e seu acesso |

## Stack

**Front-end**
- React 18 + TypeScript, build com Vite
- Tailwind CSS + shadcn/ui (Radix UI) como base de componentes
- TanStack Query para estado de servidor e cache
- React Router para as rotas
- React Leaflet para o mapa de rastreamento
- React Hook Form + Zod para formulário e validação

**Back-end**
- Supabase: Postgres, autenticação e políticas de acesso por linha
- Migrations versionadas em `supabase/migrations`
- Gatilhos em PL/pgSQL cuidando do fluxo pós-entrega

**Mobile**
- Capacitor, gerando os apps Android e iOS a partir do mesmo código

**Qualidade**
- Vitest para teste unitário
- Playwright para teste de ponta a ponta

**Infra**
- Vercel, com deploy automático

## Decisões de projeto que valem explicar

**Uma base de código, três superfícies.** Web, Android e iOS saem do mesmo projeto via Capacitor. A navegação se adapta sozinha: `BottomNav` no celular e `DesktopSidebar` no computador.

**Permissão resolvida na rota, não na tela.** `ProtectedRoute`, `AdminRoute` e `RoleRedirect` decidem o acesso antes de renderizar, em vez de esconder botão na interface.

**O app assume que a internet vai cair.** Motorista de frete passa por região sem sinal, então existe `OfflineBanner` e o cache do TanStack Query segura a navegação.

**Quem cobra a avaliação é o banco, não a tela.** Um gatilho em Postgres dispara no momento em que o frete vira `entregue` e cria a notificação para as duas pontas, motorista e contratante, já com link direto para a tela de avaliação. Se dependesse do front, bastaria o app fechar na hora errada para o frete ficar sem nota.

## Rodando local

```bash
npm install
npm run dev
```

Antes do primeiro `dev`, crie um `.env` na raiz com a URL e a chave pública do seu projeto Supabase. Os nomes das variáveis estão em `src/integrations/`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run test` | Testes |
| `npm run lint` | Lint |

### Mobile

```bash
npm run build
npx cap sync
npx cap open android    # ou: npx cap open ios
```

## Estrutura

```
src/
├── components/     # UI, layouts, telas e componentes de domínio
├── pages/          # Rotas
├── contexts/       # Estado global (sessão, perfil)
├── hooks/          # Hooks de domínio
├── integrations/   # Cliente Supabase e tipos gerados
├── routes/         # Guardas de rota por perfil
└── test/           # Testes
supabase/migrations/  # Schema versionado
```

## Status

Em produção, em evolução ativa.

---

Feito por [Carlos Mateo Wall Bruno](https://portfolio-two-wheat-73.vercel.app) · [LinkedIn](https://www.linkedin.com/in/mateowall/)
