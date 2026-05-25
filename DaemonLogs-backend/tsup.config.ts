import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  target: 'es2022',
  tsconfig: 'tsconfig.json',
  esbuildOptions(options) {
    options.alias = {
      '@': './src',
    }
  },
})
