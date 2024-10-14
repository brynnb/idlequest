import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    "import.meta.env.REACT_APP_OPENAI_API_KEY": JSON.stringify(
      process.env.REACT_APP_OPENAI_API_KEY
    ),
    "import.meta.env.REACT_APP_OPENAI_PROJECT_ID": JSON.stringify(
      process.env.REACT_APP_OPENAI_PROJECT_ID
    ),
  },
  resolve: {
    alias: {
      "/src": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./tests/testSetup.ts"],
    environment: "jsdom",
    include: ["./tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
});
