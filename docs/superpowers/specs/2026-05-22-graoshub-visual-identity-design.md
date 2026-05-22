# GrãoHub — Migração de Identidade Visual (BoyHub Port)

**Data:** 2026-05-22  
**Escopo:** Tokens + componentes-chave (shell completo + landing page)  
**Referência:** `/c/Projects/Boi Hub` — design system do BoyHub  

---

## Objetivo

Aplicar a identidade visual do BoyHub ao GrãoHub, mantendo a arquitetura shadcn/ui + Tailwind existente. Os dois apps pertencem ao mesmo ecossistema agrícola e devem ter aparência coesa: mesma paleta, mesma tipografia, mesmo padrão de componentes.

---

## Seção 1 — Tokens de Cor e Tipografia

### Paleta de Cores

Substituição das CSS variables em `src/index.css` (modo claro):

| Token shadcn | Novo valor hex | Semântica BoyHub |
|---|---|---|
| `--background` | `#f2ede0` | canvas-soft (creme quente) |
| `--card` | `#ffffff` | canvas |
| `--foreground` | `#1a2a1e` | ink |
| `--muted` | `#faf5e7` | canvas-warm |
| `--muted-foreground` | `#41534a` | body |
| `--border` | `#e6dec9` | border |
| `--input` | `#e6dec9` | border |
| `--primary` | `#0d2818` | verde-900 |
| `--primary-foreground` | `#f7f0e0` | creme |
| `--secondary` | `#1a4f2e` | verde-700 |
| `--secondary-foreground` | `#f7f0e0` | creme |
| `--accent` | `#c8992a` | ouro |
| `--accent-foreground` | `#5a4408` | warning-content |
| `--ring` | `#4ade80` | verde-400 (focus ring) |
| `--destructive` | `#c54a3d` | negative |
| `--sidebar-background` | `#0d2818` | verde-900 |
| `--sidebar-foreground` | `#f7f0e0` | creme |
| `--sidebar-primary` | `#c8992a` | ouro |
| `--sidebar-primary-foreground` | `#5a4408` | warning-content |
| `--sidebar-accent` | `#1f3a26` | border-dark |
| `--sidebar-accent-foreground` | `#f7f0e0` | creme |
| `--sidebar-border` | `#1f3a26` | border-dark |
| `--sidebar-ring` | `#c8992a` | ouro |

**Variáveis extras a adicionar:**
```css
--verde-400: #4ade80;
--verde-700: #1a4f2e;
--verde-900: #0d2818;
--ouro: #c8992a;
--canvas-soft: #f2ede0;
--canvas-warm: #faf5e7;
--ink: #1a2a1e;
--border-dark: #1f3a26;
--ink-on-dark: #f7f0e0;
--body-color: #41534a;
```

**Sombras** (substituir sombras neutras atuais por sombras com tom verde-escuro):
```css
--shadow-xs: 0 1px 0 rgba(26, 42, 30, 0.04);
--shadow-sm: 0 1px 2px rgba(26, 42, 30, 0.05), 0 1px 1px rgba(26, 42, 30, 0.03);
--shadow-md: 0 6px 16px -8px rgba(26, 42, 30, 0.18), 0 2px 4px rgba(26, 42, 30, 0.04);
--shadow-lg: 0 18px 36px -18px rgba(13, 40, 24, 0.32), 0 4px 8px rgba(26, 42, 30, 0.04);
```

### Tailwind Config (`tailwind.config.ts`)

Adicionar no `extend.colors`:
```ts
'verde-900': '#0d2818',
'verde-700': '#1a4f2e',
'verde-500': '#2f7a4a',
'verde-400': '#4ade80',
'verde-200': '#c7e9d2',
'ouro':      '#c8992a',
'ouro-soft': '#f3e4b8',
'canvas-soft': '#f2ede0',
'canvas-warm': '#faf5e7',
'ink':       '#1a2a1e',
'border-warm': '#e6dec9',
```

### Tipografia

**`index.html` — substituir import Google Fonts:**

Remover: `Plus Jakarta Sans`  
Adicionar:
```html
<!-- Fraunces (variable: opsz, SOFT, wght) -->
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&display=swap" rel="stylesheet">
<!-- DM Sans (400, 500, 600, 700) -->
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**`src/index.css` — atualizar base e adicionar classes utilitárias:**
```css
body {
  font-family: 'DM Sans', sans-serif;
  font-feature-settings: "ss01", "cv11";
}

.bh-display {
  font-family: 'Fraunces', serif;
  font-variation-settings: 'opsz' 144, 'SOFT' 50;
  font-weight: 500;
}

.bh-eyebrow {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
```

**Utilitários CSS a adicionar:**
```css
.gradient-hero {
  background: linear-gradient(135deg, #0d2818 0%, #1a4f2e 100%);
}

.card-sage {
  background: #faf5e7;
  border: 1px solid #e6dec9;
}

.glass {
  backdrop-filter: blur(12px);
  background: rgba(242, 237, 224, 0.7);
  border: 1px solid rgba(230, 222, 201, 0.5);
}
```

---

## Seção 2 — Componentes-Chave

### 2.1 Botões (`src/components/ui/button.tsx`)

**Variante `default` (primary):**
- Background: `#0d2818` (verde-900)
- Texto: `#f7f0e0` (creme)
- Hover: `#1a4f2e` (verde-700)

**Variante `accent` (nova):**
- Background: `#c8992a` (ouro)
- Texto: `#5a4408` (warning-content)
- Hover: `#a07d1c` (ouro escurecido)

**Variante `outline`:**
- Borda: `#e6dec9`
- Texto: `#1a2a1e` (ink)
- Hover background: `#faf5e7` (canvas-warm)

**Variante `ghost`:**
- Texto: `#41534a` (body)
- Hover background: `#faf5e7`

### 2.2 Cards (`src/components/ui/card.tsx`)

**Variante `default`:**
- Background: `#ffffff`
- Borda: `1px solid #e6dec9`
- Border-radius: `12px`
- Sombra: `var(--shadow-sm)`

**Variante `sage` (nova):**
- Background: `#faf5e7` (canvas-warm)
- Borda: `1px solid #e6dec9`
- Border-radius: `12px`

**Variante `dark` (nova):**
- Background: `#0d2818` (verde-900)
- Texto: `#f7f0e0` (creme)
- Borda: `1px solid #1f3a26` (border-dark)
- Border-radius: `12px`

### 2.3 Desktop Sidebar (`src/components/layout/DesktopSidebar.tsx`)

- Background: `#0d2818`
- Texto padrão: `#f7f0e0`
- **Logo:** `<span style="color: #4ade80">Grão</span><span style="color: #c8992a">Hub</span>`
- Link ativo: background `#1a4f2e`, indicador lateral `3px solid #c8992a`
- Link hover: background `#1f3a26`
- Ícones: cor `#8aa498` (mute on dark), ativo: `#f7f0e0`

### 2.4 Bottom Nav (`src/components/layout/BottomNav.tsx`)

- Background: `#0d2818`
- Ícone/label ativo: `#c8992a` (ouro)
- Ícone/label inativo: `#8aa498`
- Separador superior: `1px solid #1f3a26`

### 2.5 Landing Page (`src/pages/LandingPage.tsx`)

**Hero section:**
- Background: classe `.gradient-hero` (`#0d2818` → `#1a4f2e`)
- Headline principal: classe `.bh-display` (Fraunces, ~56–64px, weight 500)
- Eyebrow text: classe `.bh-eyebrow` (uppercase, verde-400 `#4ade80`)
- CTA primário: botão variante `default` (verde-900 + creme)
- CTA secundário: botão variante `accent` (ouro)
- Texto corpo: DM Sans, `#f7f0e0` sobre fundo escuro

**Seções de features/cards:**
- Background da página: `#f2ede0` (canvas-soft)
- Cards: variante `default` (branco + borda creme)
- Títulos de seção: `.bh-display`, `#0d2818`

**Focus ring global:**
- `outline: 2px solid #4ade80; outline-offset: 2px;`

---

## Arquivos a Alterar

| Arquivo | O que muda |
|---|---|
| `index.html` | Troca Google Fonts (rm Plus Jakarta Sans, add Fraunces + DM Sans) |
| `src/index.css` | CSS variables, tipografia base, utilitários (.bh-display, .bh-eyebrow, .gradient-hero, .card-sage, .glass, sombras) |
| `tailwind.config.ts` | Adicionar cores nomeadas (verde-900, ouro, canvas-soft, etc.) |
| `src/components/ui/button.tsx` | Variante accent + atualização das cores default/outline/ghost |
| `src/components/ui/card.tsx` | Variantes sage e dark |
| `src/components/layout/DesktopSidebar.tsx` | Paleta escura + logo split verde-400/ouro |
| `src/components/layout/BottomNav.tsx` | Paleta escura + ouro ativo |
| `src/pages/LandingPage.tsx` | Hero com Fraunces + gradiente + novos botões |

---

## Critérios de Sucesso

- A landing page tem hero com gradiente verde-escuro, headline em Fraunces serif, CTA em ouro
- Sidebar e bottom nav usam fundo `#0d2818` com logo split Grão (verde) + Hub (dourado)
- Cards sobre fundo creme `#f2ede0` com borda `#e6dec9`
- Focus ring verde-400 `#4ade80` em todos os elementos interativos
- Nenhuma referência visual ao Plus Jakarta Sans ou às cores HSL genéricas anteriores

---

## O que NÃO muda

- Arquitetura de rotas e componentes
- Lógica de negócio (Supabase, React Query, Zod)
- Telas internas do app além do shell (dashboard, fretes, marketplace, etc.) — ficam para fase futura
- Modo escuro (dark mode) — mantido como está, refinamento futuro
