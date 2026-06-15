/**
 * Vite UMD 单独构建配置
 *
 * UMD 格式不支持多入口，因此从主入口 index.ts 单独构建。
 * 编译器函数已包含在主入口中，UMD 用户通过 window.PrintDesign 访问。
 *
 * 用法：vite build -c vite.config.umd.ts
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PrintDesign',
      formats: ['umd'],
      fileName: 'print-design',
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    // 不清空 dist，追加 UMD 产物
    emptyOutDir: false,
  },
})
