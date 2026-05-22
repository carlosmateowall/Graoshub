# GrãoHub Visual Identity Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the BoyHub visual identity (Fraunces + DM Sans fonts, warm creme palette, verde-900/ouro tokens) into GrãoHub, updating CSS variables, shell components, and landing page.

**Architecture:** Update CSS variables in `index.css` from generic HSL values to BoyHub-matched HSL equivalents, add Fraunces/DM Sans fonts via `@import`, then refactor 6 component files (button, card, sidebar, bottom nav, landing page) to use the new tokens. No logic changes — purely visual.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, shadcn/ui (CVA), Vite

**Reference spec:** `docs/superpowers/specs/2026-05-22-graoshub-visual-identity-design.md`

---

## File Map

| File | Change |
|------|--------|
| `src/index.css` | Font @import, all CSS variables, utilities, gradient, glass |
| `tailwind.config.ts` | fontFamily (DM Sans + Fraunces), named colors, shadows |
| `src/components/ui/button.tsx` | Add `accent` variant |
| `src/components/ui/card.tsx` | Add `sage` and `dark` variants via CVA |
| `src/components/DesktopSidebar.tsx` | Logo split (ring/sidebar-primary), active bg + ouro indicator |
| `src/components/BottomNav.tsx` | Container bg → sidebar dark, active → sidebar-primary (ouro) |
| `src/components/screens/LandingPage.tsx` | Hero: gradient-hero + Fraunces + eyebrow + updated buttons |

---

## Task 1: Foundation — fonts, CSS variables, utilities

**Files:**
- Modify: `src/index.css`
- Modify: `tailwind.config.ts`

### HSL reference table (BoyHub hex → Tailwind HSL format)

| Hex | Semantic name | HSL for CSS var |
|-----|---------------|-----------------|
| `#0d2818` | verde-900 / primary | `144 51% 10%` |
| `#1a4f2e` | verde-700 / secondary | `143 50% 21%` |
| `#4ade80` | verde-400 / ring | `142 69% 58%` |
| `#c8992a` | ouro / accent | `42 65% 47%` |
| `#f2ede0` | canvas-soft / background | `43 41% 91%` |
| `#faf5e7` | canvas-warm / muted | `44 66% 94%` |
| `#f7f0e0` | creme / primary-foreground | `42 59% 92%` |
| `#1a2a1e` | ink / foreground | `135 24% 13%` |
| `#41534a` | ink-soft / muted-foreground | `150 12% 29%` |
| `#e6dec9` | border | `43 37% 85%` |
| `#1f3a26` | border-dark / sidebar-border | `136 30% 17%` |
| `#5a4408` | ouro-content / accent-foreground | `44 84% 19%` |

- [ ] **Step 1.1: Replace font @import and update CSS variables in `src/index.css`**

Replace the entire file content from line 1 through the closing `}` of `:root` and `.dark` blocks:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..700&family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* — GrãoHub · BoyHub Identity Port — */
    --primary: 144 51% 10%;              /* #0d2818 verde-900 */
    --primary-foreground: 42 59% 92%;    /* #f7f0e0 creme */
    --secondary: 143 50% 21%;            /* #1a4f2e verde-700 */
    --secondary-foreground: 42 59% 92%;  /* #f7f0e0 creme */

    --background: 43 41% 91%;            /* #f2ede0 canvas-soft */
    --foreground: 135 24% 13%;           /* #1a2a1e ink */

    --card: 0 0% 100%;                   /* #ffffff */
    --card-foreground: 135 24% 13%;      /* #1a2a1e ink */

    --popover: 0 0% 100%;
    --popover-foreground: 135 24% 13%;

    --muted: 44 66% 94%;                 /* #faf5e7 canvas-warm */
    --muted-foreground: 150 12% 29%;     /* #41534a ink-soft */

    --accent: 42 65% 47%;                /* #c8992a ouro */
    --accent-foreground: 44 84% 19%;     /* #5a4408 ouro-content */

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --success: 143 50% 21%;
    --info: 210 80% 56%;

    --border: 43 37% 85%;                /* #e6dec9 */
    --input: 43 37% 85%;
    --ring: 142 69% 58%;                 /* #4ade80 verde-400 */

    --radius: 0.75rem;

    --sidebar-background: 144 51% 10%;         /* #0d2818 verde-900 */
    --sidebar-foreground: 42 59% 92%;          /* #f7f0e0 creme */
    --sidebar-primary: 42 65% 47%;             /* #c8992a ouro */
    --sidebar-primary-foreground: 44 84% 19%;  /* #5a4408 */
    --sidebar-accent: 143 50% 21%;             /* #1a4f2e verde-700 — active bg */
    --sidebar-accent-foreground: 42 59% 92%;   /* #f7f0e0 creme */
    --sidebar-border: 136 30% 17%;             /* #1f3a26 border-dark */
    --sidebar-ring: 42 65% 47%;                /* #c8992a ouro */

    --shadow-sm: 0 1px 2px rgba(26,42,30,.05), 0 1px 1px rgba(26,42,30,.03);
    --shadow-md: 0 6px 16px -8px rgba(26,42,30,.18), 0 2px 4px rgba(26,42,30,.04);
    --shadow-lg: 0 18px 36px -18px rgba(13,40,24,.32), 0 4px 8px rgba(26,42,30,.04);
  }

  .dark {
    --background: 222 47% 6%;
    --foreground: 210 40% 92%;
    --card: 222 40% 10%;
    --card-foreground: 210 40% 92%;
    --popover: 222 40% 10%;
    --popover-foreground: 210 40% 92%;
    --muted: 222 30% 14%;
    --muted-foreground: 215 16% 56%;
    --border: 222 25% 18%;
    --input: 222 25% 18%;
    --ring: 42 65% 47%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  html {
    font-size: 16px;
  }
  body {
    @apply bg-background text-foreground antialiased;
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    font-feature-settings: "ss01", "cv11";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

@layer utilities {
  /* Typography */
  .bh-display {
    font-family: 'Fraunces', serif;
    font-optical-sizing: auto;
    font-weight: 500;
    line-height: 1.0;
    letter-spacing: -0.01em;
  }
  .bh-eyebrow {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  /* Shadows */
  .shadow-bh-sm { box-shadow: var(--shadow-sm); }
  .shadow-bh-md { box-shadow: var(--shadow-md); }
  .shadow-bh-lg { box-shadow: var(--shadow-lg); }

  /* Gradients */
  .gradient-hero {
    background: linear-gradient(135deg, #0d2818 0%, #1a4f2e 100%);
  }
  .gradient-marketplace {
    background: linear-gradient(168deg, hsl(30 60% 14%) 0%, hsl(35 50% 22%) 50%, hsl(38 45% 28%) 100%);
  }
  .gradient-amber {
    background: linear-gradient(135deg, #c8992a, #e0b040);
  }
  .text-gradient-gold {
    background: linear-gradient(135deg, #c8992a, #e0b040);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Glass */
  .glass {
    background: rgba(242, 237, 224, 0.72);
    backdrop-filter: blur(16px) saturate(1.8);
    -webkit-backdrop-filter: blur(16px) saturate(1.8);
  }

  /* Cards */
  .card-shadow {
    box-shadow: var(--shadow-sm);
  }
  .card-shadow-lg {
    box-shadow: var(--shadow-md);
  }
}

/* Scrollbar hiding */
.phone-scroll::-webkit-scrollbar { display: none; }
.phone-scroll { -ms-overflow-style: none; scrollbar-width: none; }

/* Native safe area */
.safe-area-container {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Animations */
@keyframes fade-in {
  0% { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes slide-up {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes scale-fade {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16,1,0.3,1); }
.animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.16,1,0.3,1); }
.animate-scale-fade { animation: scale-fade 0.5s cubic-bezier(0.16,1,0.3,1); }

@keyframes float {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-10px); }
}
.animate-float { animation: float 4s ease-in-out infinite; }

@keyframes tl-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(200,153,42,0.4); }
  50% { box-shadow: 0 0 0 8px rgba(200,153,42,0); }
}
.animate-tl-pulse { animation: tl-pulse 2s infinite; }

@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton-shimmer {
  background: linear-gradient(90deg, hsl(43 37% 88%) 25%, hsl(43 37% 92%) 50%, hsl(43 37% 88%) 75%);
  background-size: 800px 100%;
  animation: shimmer 1.8s infinite;
  border-radius: 12px;
}

@keyframes checkmark-draw {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}
```

- [ ] **Step 1.2: Update `tailwind.config.ts`**

Replace the full file content:

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "-apple-system", "sans-serif"],
        display: ["Fraunces", "serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: "hsl(var(--success))",
        info: "hsl(var(--info))",
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        /* Named semantic colors for direct usage */
        "verde-900": "#0d2818",
        "verde-700": "#1a4f2e",
        "verde-500": "#2f7a4a",
        "verde-400": "#4ade80",
        "verde-200": "#c7e9d2",
        "ouro":      "#c8992a",
        "ouro-soft": "#f3e4b8",
        "canvas-soft": "#f2ede0",
        "canvas-warm": "#faf5e7",
        "ink":       "#1a2a1e",
        "ink-soft":  "#41534a",
        "border-warm": "#e6dec9",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        "card-soft": "0 1px 2px rgba(26,42,30,.05), 0 1px 1px rgba(26,42,30,.03)",
        "float":     "0 18px 36px -18px rgba(13,40,24,.32), 0 4px 8px rgba(26,42,30,.04)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

- [ ] **Step 1.3: Start dev server and verify foundation**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected:
- Page background is warm creme (`#f2ede0`), not white
- Body text is dark olive-green (`#1a2a1e`), not cold dark blue
- Borders on cards/inputs are warm beige (`#e6dec9`)
- Font throughout is DM Sans (check in DevTools → Elements → Computed → font-family)

- [ ] **Step 1.4: Commit foundation**

```bash
git add src/index.css tailwind.config.ts
git commit -m "feat: port BoyHub color tokens and DM Sans/Fraunces to GrãoHub"
```

---

## Task 2: Button — accent variant

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 2.1: Add `accent` variant to button**

Replace the full file:

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-secondary",
        accent:      "bg-accent text-accent-foreground hover:bg-[#a07d1c]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:     "border border-border bg-background hover:bg-muted text-foreground",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:       "text-muted-foreground hover:bg-muted hover:text-foreground",
        link:        "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm:      "h-9 rounded-md px-3",
        lg:      "h-11 rounded-md px-8",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 2.2: Verify in browser**

In DevTools console, paste and run:
```js
// Quick check: primary button should be verde-900 bg
document.querySelector('[data-radix-collection-item]') // not needed — just look at any Button in the app
```

Navigate to `/login` or `/` and inspect any primary Button. Expected:
- Background color computed = `rgb(13, 40, 24)` (verde-900)
- Hover → `rgb(26, 79, 46)` (verde-700)

- [ ] **Step 2.3: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat: add accent variant to Button, update default/outline/ghost colors"
```

---

## Task 3: Card — sage and dark variants

**Files:**
- Modify: `src/components/ui/card.tsx`

- [ ] **Step 3.1: Add CVA variant support to Card**

Replace the full file:

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "rounded-lg border",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border shadow-sm",
        sage:    "bg-muted text-foreground border-border",
        dark:    "bg-primary text-primary-foreground border-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

- [ ] **Step 3.2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to card.tsx.

- [ ] **Step 3.3: Commit**

```bash
git add src/components/ui/card.tsx
git commit -m "feat: add sage and dark variants to Card component"
```

---

## Task 4: DesktopSidebar — logo split + active indicator

**Files:**
- Modify: `src/components/DesktopSidebar.tsx`

Changes:
1. Logo: `<span className="text-ring">Grão</span><span className="text-sidebar-primary">Hub</span>`
2. Active nav item: `bg-sidebar-accent text-sidebar-accent-foreground` + absolute ouro left indicator
3. Hover: `hover:bg-sidebar-accent/50 hover:text-sidebar-foreground`

- [ ] **Step 4.1: Update DesktopSidebar**

Replace the full file:

```tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Package, Truck, ShoppingCart, Map, User, Settings, MapPin, Wheat, Bell, LogOut } from "lucide-react";

interface DesktopSidebarProps {
  items: { path: string; icon: string; label: string }[];
  active: string;
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  "package": Package,
  truck: Truck,
  "shopping-cart": ShoppingCart,
  map: Map,
  user: User,
  settings: Settings,
  "map-pin": MapPin,
};

const DesktopSidebar = ({ items, active, onNavigate, onLogout }: DesktopSidebarProps) => {
  const { user, profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("lida", false);
      setUnreadCount(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("sidebar-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-sidebar border-r border-sidebar-border flex-shrink-0">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center">
            <Wheat size={22} className="text-sidebar-primary" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight leading-none">
              <span className="text-ring">Grão</span>
              <span className="text-sidebar-primary">Hub</span>
            </h1>
            <p className="text-[10px] text-sidebar-foreground/40 tracking-widest uppercase mt-0.5">Logística Agrícola</p>
          </div>
        </div>
      </div>

      {/* Profile mini */}
      {profile && (
        <div className="mx-4 mb-6 px-3 py-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={16} className="text-sidebar-foreground/50" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{profile.nome?.split(" ")[0] || "Usuário"}</p>
              <p className="text-[11px] text-sidebar-foreground/40 truncate">{profile.cidade || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        <p className="text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-widest px-3 mb-2">Menu</p>
        {items.map((item) => {
          const isActive = active === item.path;
          const showBadge = item.path === "/perfil" && unreadCount > 0;
          const IconComp = iconMap[item.icon] || Home;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border-none transition-all text-left relative ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "bg-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-sidebar-primary" />
              )}
              <div className="relative">
                <IconComp size={18} strokeWidth={isActive ? 2.2 : 1.6} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[13px] font-semibold">{item.label}</span>
            </button>
          );
        })}

        {/* Notifications shortcut */}
        <button
          onClick={() => onNavigate("/notificacoes")}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border-none bg-transparent text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all text-left"
        >
          <div className="relative">
            <Bell size={18} strokeWidth={1.6} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[13px] font-semibold">Notificações</span>
        </button>
      </nav>

      {/* Logout */}
      {onLogout && (
        <div className="px-3 pb-6 pt-4 border-t border-sidebar-border mt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer border-none bg-transparent text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-all text-left"
          >
            <LogOut size={18} />
            <span className="text-[13px] font-semibold">Sair</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default DesktopSidebar;
```

- [ ] **Step 4.2: Verify sidebar in browser**

Log in and navigate to any protected route (or check desktop layout). Expected:
- Sidebar background is verde-900 (`#0d2818`, very dark green)
- Logo shows lime-green "Grão" + gold "Hub"
- Active item has verde-700 background (`#1a4f2e`) and a 3px gold left border indicator
- Hover state is verde-700 at 50% opacity

- [ ] **Step 4.3: Commit**

```bash
git add src/components/DesktopSidebar.tsx
git commit -m "feat: update DesktopSidebar with split logo and ouro active indicator"
```

---

## Task 5: BottomNav — dark background + ouro active

**Files:**
- Modify: `src/components/BottomNav.tsx`

Changes:
- Container: `bg-sidebar border-t border-sidebar-border` (dark verde-900 + dark border)
- Active icon/label: `text-sidebar-primary` (ouro)
- Inactive: `text-sidebar-foreground/40` (creme at 40%)
- Active pill: `bg-sidebar-primary/15`
- Remove `opacity-40/60` approach — use color classes instead

- [ ] **Step 5.1: Update BottomNav**

Replace the full file:

```tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Home, Package, Truck, ShoppingCart, Map, User, Settings, Bell, MapPin } from "lucide-react";

interface BottomNavProps {
  items: { path: string; icon: string; label: string }[];
  active: string;
  onNavigate: (path: string) => void;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  home: Home,
  "package": Package,
  truck: Truck,
  "shopping-cart": ShoppingCart,
  map: Map,
  user: User,
  settings: Settings,
  "map-pin": MapPin,
};

const BottomNav = ({ items, active, onNavigate }: BottomNavProps) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { count } = await supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("lida", false);
      setUnreadCount(count ?? 0);
    };
    load();
    const channel = supabase
      .channel("nav-notifs")
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <div className="bg-sidebar border-t border-sidebar-border flex items-center justify-around px-1 pb-6 pt-2.5 flex-shrink-0 relative z-[100]">
      {items.map((item) => {
        const isActive = active === item.path;
        const showBadge = item.path === "/perfil" && unreadCount > 0;
        const IconComp = iconMap[item.icon] || Home;
        return (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            aria-label={item.label}
            className="flex flex-col items-center gap-1 px-3 py-1.5 border-none bg-transparent cursor-pointer rounded-xl flex-1 transition-all duration-200 relative min-h-[48px]"
          >
            <div className={`relative flex items-center justify-center w-10 h-8 rounded-full transition-all duration-300 ${isActive ? "bg-sidebar-primary/15" : ""}`}>
              <IconComp
                size={20}
                strokeWidth={isActive ? 2.2 : 1.6}
                className={`transition-colors duration-200 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40"}`}
              />
              {showBadge && (
                <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${isActive ? "text-sidebar-primary" : "text-sidebar-foreground/40"}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
```

- [ ] **Step 5.2: Verify on mobile viewport**

In DevTools, switch to mobile viewport (375px). Expected:
- Bottom nav background is verde-900 (`#0d2818`)
- Active tab icon and label are gold (`#c8992a`)
- Inactive tabs are creme at low opacity (visible but subdued)

- [ ] **Step 5.3: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: update BottomNav to dark verde-900 bg with ouro active state"
```

---

## Task 6: LandingPage — Fraunces hero + gradient + updated buttons

**Files:**
- Modify: `src/components/screens/LandingPage.tsx`

Changes:
1. **Navbar logo**: `text-primary` (verde-900) for "Grão" + `text-accent` (ouro) for "Hub". Remove the icon box.
2. **Hero section**: Replace background-image + overlay with `gradient-hero` class on the section. Apply `bh-display font-display` to h1. Add eyebrow. Update button variants.
3. **Stats bar**: Add below the hero CTAs (social proof already exists, just keeping consistent)
4. **Section eyebrows**: Update existing section labels to use `bh-eyebrow` style

- [ ] **Step 6.1: Update the Navbar and Hero in LandingPage.tsx**

Find and replace the `<nav>` block (lines 22–55) with:

```tsx
      {/* ─── Navbar ─── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight">
              <span className="text-primary">Grão</span>
              <span className="text-accent">Hub</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("como-funciona")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
              Como Funciona
            </button>
            <button onClick={() => scrollTo("marketplace")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
              Marketplace
            </button>
            <button onClick={() => scrollTo("beneficios")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer">
              Benefícios
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/login")} className="font-semibold">
              Entrar
            </Button>
            <Button variant="accent" size="sm" onClick={() => navigate("/cadastro")} className="font-semibold">
              Criar Conta
            </Button>
          </div>
        </div>
      </nav>
```

- [ ] **Step 6.2: Replace Hero section (lines 57–107)**

Replace the entire `{/* ─── Hero ─── */}` section with:

```tsx
      {/* ─── Hero ─── */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 70% 50%, rgba(74,222,128,.06) 0%, transparent 70%)" }} />

        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-36">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <span className="block w-6 h-[2px] rounded bg-verde-400" />
                <span className="bh-eyebrow text-verde-400">Plataforma de Fretes e Insumos Agrícolas</span>
              </div>

              <h1 className="bh-display text-4xl sm:text-5xl lg:text-[62px] text-primary-foreground mb-6 max-w-xl">
                Conectando o Campo à Estrada com Inteligência
              </h1>

              <p className="text-lg text-sidebar-foreground/70 leading-relaxed mb-10 max-w-xl">
                A plataforma definitiva para produtores rurais encontrarem motoristas confiáveis, e transportadores acharem as melhores cargas.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={() => handleCTA("contratante")}
                  className="text-base font-bold px-8 rounded-xl"
                >
                  <Wheat size={20} />
                  Sou Produtor / Armazém
                  <ArrowRight size={18} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleCTA("motorista")}
                  className="text-base font-bold px-8 rounded-xl border-sidebar-border text-primary-foreground bg-transparent hover:bg-sidebar-accent"
                >
                  <Truck size={20} />
                  Sou Motorista
                  <ArrowRight size={18} />
                </Button>
              </div>

              <div className="flex items-center gap-8 mt-10 text-sm text-sidebar-foreground/50">
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-verde-400" /> 100% Seguro</div>
                <div className="flex items-center gap-2"><TrendingUp size={16} className="text-verde-400" /> Sem taxas ocultas</div>
              </div>
            </div>

            <div className="hidden lg:block flex-1" />
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-x-12 gap-y-6 mt-16 pt-10 border-t border-sidebar-border">
            <div>
              <div className="bh-display text-3xl text-primary-foreground">12 mil</div>
              <div className="text-sm text-sidebar-foreground/50 mt-1">produtores ativos</div>
            </div>
            <div>
              <div className="bh-display text-3xl text-primary-foreground">R$ 480 M</div>
              <div className="text-sm text-sidebar-foreground/50 mt-1">em fretes negociados</div>
            </div>
            <div>
              <div className="bh-display text-3xl text-primary-foreground">98%</div>
              <div className="text-sm text-sidebar-foreground/50 mt-1">fretes concluídos</div>
            </div>
            <div>
              <div className="bh-display text-3xl text-ouro">4.9★</div>
              <div className="text-sm text-sidebar-foreground/50 mt-1">avaliação média</div>
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 6.3: Update the section eyebrows (the `<span>` labels like "Feito para o agro")**

Find every `<span className="text-xs font-bold uppercase tracking-wider text-primary">` and replace with `<span className="bh-eyebrow text-primary">` (applies throughout the remaining sections). This is a find-and-replace in the file.

- [ ] **Step 6.4: Verify full landing page in browser**

Open `http://localhost:5173`. Expected:
- Navbar: creme background, dark verde "Grão" + gold "Hub" logo, "Criar Conta" button is gold (accent variant)
- Hero: dark gradient verde-900 → verde-700, headline in Fraunces serif, eyebrow in lime verde-400, stats row at bottom
- Sections below hero: creme/warm backgrounds, cards white with warm borders
- Buttons throughout: primary (verde-900), accent (gold), outline (warm border)

- [ ] **Step 6.5: Commit**

```bash
git add src/components/screens/LandingPage.tsx
git commit -m "feat: redesign LandingPage hero with Fraunces, gradient-hero, and BoyHub identity"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 8 files from spec are covered in tasks 1–6.
- [x] **No placeholders:** Every step has complete code.
- [x] **Type consistency:** `CardProps extends VariantProps<typeof cardVariants>` — consistent across Task 3. `buttonVariants` — `accent` variant added, no conflicts with existing `variant` prop usage. `DesktopSidebar` and `BottomNav` prop interfaces unchanged.
- [x] **Import check:** `cva` and `VariantProps` already available in the project (used in button.tsx). `verde-400` and `ouro` colors added to tailwind config, so `text-verde-400` and `text-ouro` will work. `bh-display`, `bh-eyebrow`, `gradient-hero` are utility classes defined in `index.css @layer utilities`.
- [x] **Tailwind purge:** All new class names (`text-ring`, `bg-sidebar-accent`, `text-sidebar-primary`, `text-verde-400`, `text-ouro`, `bh-display`, `bh-eyebrow`, `gradient-hero`) appear as string literals in source files, so Tailwind will include them.
