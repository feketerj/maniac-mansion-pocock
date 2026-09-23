import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5177,
    host: true,
  },
  preview: {
    port: 5177,
    host: true,
  },
});
