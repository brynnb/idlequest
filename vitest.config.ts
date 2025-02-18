import { defineConfig } from "vitest/config";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
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
