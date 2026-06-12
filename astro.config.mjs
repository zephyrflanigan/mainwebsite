import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://zephyrflanigan.github.io',
  base: '/websitedev',
  vite: {
    plugins: [tailwindcss()]
  }
});
