import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    // host: true lets an iPad on the same network open http://<your-ip>:5173
    host: true,
    // Same origin in the browser: no CORS to configure and the token never goes to a third origin.
    proxy: { "/api": "http://localhost:3000" },
  },
});
