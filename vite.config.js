import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const browserVm = fileURLToPath(new URL('./src/runtime/browserVm.json', import.meta.url));

function mapCataloguePlugin() {
  function writeCatalogue(root) {
    const mapsDir = path.resolve(root, 'public/maps');
    if (!fs.existsSync(mapsDir)) fs.mkdirSync(mapsDir, { recursive: true });
    const pngs = fs.readdirSync(mapsDir)
      .filter(f => f.toLowerCase().endsWith('.png'))
      .sort((a, b) => a.localeCompare(b, 'pt-PT'));
    fs.writeFileSync(path.join(mapsDir, 'catalogue.json'), JSON.stringify(pngs));
    return pngs;
  }

  return {
    name: 'map-catalogue',
    configResolved(config) {
      writeCatalogue(config.root);
    },
    handleHotUpdate({ file, server }) {
      const sep = path.sep;
      if (file.includes(`${sep}public${sep}maps${sep}`) && file.toLowerCase().endsWith('.png')) {
        writeCatalogue(server.config.root);
        server.ws.send({ type: 'full-reload' });
      }
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: { port: 5173, open: true },
  // A throwing require poisons JS-Interpreter's internal module cache with {}.
  // JSON gives both the dev optimizer and production bundler a stable null value.
  resolve: { alias: [{ find: /^(?:node:)?vm$/, replacement: browserVm }] },
  build: {
    outDir: 'dist',
    sourcemap: true,
    commonjsOptions: { requireReturnsDefault: id => id === browserVm },
    // Blockly's upstream editor is one indivisible module (~558 kB minified).
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/js-interpreter/')) return 'interpreter';
          if (id.includes('/node_modules/blockly/blockly_compressed.js')) return 'blockly-core';
          if (id.includes('/node_modules/blockly/blocks_compressed.js')) return 'blockly-blocks';
          if (id.includes('/node_modules/blockly/javascript_compressed.js')) return 'blockly-javascript';
        },
      },
    },
  },
  plugins: [mapCataloguePlugin()],
});
