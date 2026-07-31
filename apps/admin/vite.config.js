import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // Tailwind v4 runs as a Vite plugin — there is no postcss.config.cjs or
  // tailwind.config.ts any more; the theme lives in @elmariam/ui/app.css.
  plugins: [tailwindcss(), sveltekit()],
  server: { host: "0.0.0.0", port: 3000 },
});
