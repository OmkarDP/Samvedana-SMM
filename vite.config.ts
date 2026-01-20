import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Default proxy target for n8n during development.
// You can override with the N8N_PROXY_TARGET environment variable when starting vite.
// Example: N8N_PROXY_TARGET="https://automation.mysamvedana.org" npm run dev
const N8N_PROXY_TARGET =
  process.env.N8N_PROXY_TARGET || "http://localhost:5678";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy only active in development mode
    proxy:
      mode === "development"
        ? {
            // forward any /webhook requests to your n8n instance
            "/webhook": {
              target: N8N_PROXY_TARGET,
              changeOrigin: true,
              secure: false,
              // preserve path (so /webhook/event-create -> target/webhook/event-create)
              rewrite: (path) => path,
              // optional: log level for debugging
              // configure on demand: cookieDomainRewrite, headers, etc.
            },
          }
        : undefined,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
