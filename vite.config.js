import { defineConfig, loadEnv } from "vite";
import { searchDiscoveryPlugin } from "./scripts/search-discovery.mjs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    base: mode === "pages" ? "/RuneFactory4SelphiaArchive/" : "/",
    plugins: [searchDiscoveryPlugin(env.VITE_SITE_URL)],
  };
});
