import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // SPA fallback configuration for client-side routing
  preview: {
    port: 4173,
    strictPort: false,
    open: false,
  },
  server: {
    port: 5173,
    strictPort: false,
    // Enable HTML5 history API fallback for SPA routing
    // This ensures all routes are served with index.html
  },
});
