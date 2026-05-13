import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ out: "build" }),
    experimental: {
      remoteFunctions: true,
    },
    csrf: {
      checkOrigin: false,
    },
  },
  compilerOptions: {
    experimental: {
      async: true,
    },
  },
};

export default config;
