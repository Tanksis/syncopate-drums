/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from GitHub Pages at https://tanksis.github.io/syncopate-drums/
export default defineConfig({
  base: '/syncopate-drums/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
})
