import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { unlink, writeFile } from 'node:fs/promises';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/',
  envDir: '..',
  server: {proxy: {'/api': 'http://127.0.0.1:8787', '/health': 'http://127.0.0.1:8787'}},
  publicDir: '../public',
  esbuild: { jsx: 'automatic' },
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [{ name: 'registration-public-files', async closeBundle() {
    // Reuse brand assets without publishing the presentation site's sitemap.
    await unlink(new URL('./dist/sitemap.xml', import.meta.url)).catch(error => { if(error.code !== 'ENOENT') throw error; });
    await writeFile(new URL('./dist/robots.txt', import.meta.url), 'User-agent: *\nDisallow: /\n');
  }}],
});
