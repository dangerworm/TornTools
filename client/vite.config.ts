import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, new URL("./", import.meta.url).pathname, "");
  const basePath = env.VITE_API_BASE_URL ?? "/";

  return {
    base: basePath,
    plugins: [react()],
  };
});