import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import type { Plugin } from "vite";

// Middleware to proxy /api/hash to the Go server (like eqrequiem)
// This avoids CORS/TLS issues by fetching from same origin
function hashProxyPlugin(): Plugin {
  return {
    name: "hash-proxy",
    configureServer({ middlewares }) {
      middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith("/api/hash")) {
          try {
            // Fetch from Go server's HTTP hash endpoint on port 7100
            const response = await fetch("http://127.0.0.1:7100/hash");
            if (response.ok) {
              const hash = await response.text();
              res.setHeader("Content-Type", "text/plain");
              res.end(hash);
            } else {
              res.statusCode = 502;
              res.end("Failed to fetch hash from Go server");
            }
          } catch (err) {
            console.error("Hash proxy error:", err);
            res.statusCode = 502;
            res.end("Failed to connect to Go server hash endpoint");
          }
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths(), hashProxyPlugin()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@data": path.resolve(__dirname, "./data"),
      "@stores": path.resolve(__dirname, "./src/stores"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@entities": path.resolve(__dirname, "./src/entities"),
      "@scripts": path.resolve(__dirname, "./src/scripts"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@interfaces": path.resolve(__dirname, "./src/interfaces"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./tests/testSetup.ts"],
    environment: "jsdom",
    include: ["./tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
});
