import { defineConfig } from 'vite';
export default defineConfig({ base: '/', esbuild: { jsx: 'automatic' }, server: {proxy: {'/api': 'http://127.0.0.1:8788', '/health': 'http://127.0.0.1:8788'}} });
