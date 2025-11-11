import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // 不清空目录，与其他构建配合
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    minify: false, // 开发时不压缩，便于调试
  },
});

