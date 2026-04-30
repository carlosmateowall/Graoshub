import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          // Framer Motion — pesado, só carrega em telas que animam
          if (id.includes("framer-motion")) return "vendor-motion";

          // Supabase — usado globalmente mas em chunk separado para cache
          if (id.includes("@supabase")) return "vendor-supabase";

          // TanStack React Query
          if (id.includes("@tanstack")) return "vendor-query";

          // React Router
          if (id.includes("react-router")) return "vendor-router";

          // Formulários
          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("/zod/")
          )
            return "vendor-forms";

          // Radix UI + componentes shadcn auxiliares
          if (
            id.includes("@radix-ui") ||
            id.includes("/cmdk/") ||
            id.includes("/vaul/") ||
            id.includes("/sonner/") ||
            id.includes("embla-carousel")
          )
            return "vendor-ui";

          // Lucide icons — tree-shaken mas ainda compartilhado entre chunks
          if (id.includes("lucide-react")) return "vendor-icons";
        },
      },
    },
  },
});
