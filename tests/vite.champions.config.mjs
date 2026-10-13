// Mocked acceptance only: excludes the MCP generator and real API credentials.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL("..", import.meta.url)),
  base: "/",
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) } },
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://champions.example.test"),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("acceptance-public-key"),
  },
  server: { host: "127.0.0.1", port: 4174, strictPort: true },
});
