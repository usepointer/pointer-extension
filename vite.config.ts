import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'dev' || process.env.NODE_ENV === 'development';
  return {
    plugins: [
      viteStaticCopy({
        targets: [
          {
            src: 'manifest.json',
            dest: '.',
          },
          {
            src: 'icons',
            dest:'.'
          }
        ],
      }),
    ],
    build: {
      outDir: 'dist',
      minify: !isDev,
      rollupOptions: {
        input: {
          main: './sidepanel/index.html',
        },
        output: isDev ? {
          entryFileNames: '[name].js',
          chunkFileNames: '[name].js',
          assetFileNames: '[name][extname]',
        } : undefined,
      },
    },
  };
});