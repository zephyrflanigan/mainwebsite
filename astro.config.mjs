import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://zephyrflanigan.com',
  vite: {
    plugins: [tailwindcss()]
  }
});
