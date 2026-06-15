/**
 * Vite 库模式构建配置
 *
 * 用于 npm 发布。产出 ESM / CJS 双入口 + UMD 主入口 + .d.ts 类型声明。
 * 开发服务器请继续使用 vite.config.ts。
 *
 * 用法：vite build -c vite.config.lib.ts
 *
 * 说明：Vite 不支持多入口 + UMD 同时配置，因此分两步构建：
 *   1. ESM + CJS（多入口：index.ts + compiler.ts）
 *   2. UMD（单入口：index.ts）
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// 第一步：ESM + CJS 多入口构建
export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.lib.json',
      outDir: './dist',
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: {
        'print-design': resolve(__dirname, 'src/index.ts'),
        compiler: resolve(__dirname, 'src/compiler.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'print-design.css'
          return assetInfo.name!
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    // UMD 单独构建，这里先清空 dist
    emptyOutDir: true,
  },
})
