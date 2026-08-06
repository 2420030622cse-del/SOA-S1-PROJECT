import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT: change this to match your GitHub repository name exactly
// (case-sensitive), including the leading and trailing slashes.
// Example: if your repo is https://github.com/yourname/employee-performance-tracker
// then base should be '/employee-performance-tracker/'.
// If you're deploying to a *user/organization* Pages site (yourname.github.io),
// set base back to '/' instead.
export default defineConfig({
  plugins: [react()],
  base: '/employee-performance-tracker/',
  build: {
    outDir: 'dist',
  },
});
