import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content.ts'),
      name: 'Content',
      fileName: () => 'content.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    minify: false,
  },
  plugins: [
    {
      name: 'copy-files',
      closeBundle() {
        // 复制 CSS 文件
        const cssSource = resolve(__dirname, 'src/drawer/drawer.css');
        const cssTarget = resolve(__dirname, 'dist/drawer.css');
        
        try {
          copyFileSync(cssSource, cssTarget);
          console.log('✓ 已复制 drawer.css');
        } catch (err) {
          console.error('复制 CSS 失败:', err);
        }

        // 复制 manifest.json
        const manifestSource = resolve(__dirname, 'public/manifest.json');
        const manifestTarget = resolve(__dirname, 'dist/manifest.json');
        
        try {
          copyFileSync(manifestSource, manifestTarget);
          console.log('✓ 已复制 manifest.json');
        } catch (err) {
          console.error('复制 manifest.json 失败:', err);
        }

        // 复制 icons 目录（如果存在）
        const iconsSource = resolve(__dirname, 'public/icons');
        const iconsTarget = resolve(__dirname, 'dist/icons');
        
        if (existsSync(iconsSource)) {
          try {
            if (!existsSync(iconsTarget)) {
              mkdirSync(iconsTarget, { recursive: true });
            }
            console.log('✓ 已创建 icons 目录');
          } catch (err) {
            console.error('创建 icons 目录失败:', err);
          }
        }
      },
    },
  ],
});

