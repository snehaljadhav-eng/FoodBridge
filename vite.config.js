import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standard Vite + React setup. Nothing FoodBridge-specific lives here.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
