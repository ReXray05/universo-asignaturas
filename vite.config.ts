import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Relative assets support both user sites and repository-prefixed GitHub Pages.
export default defineConfig({plugins:[react()],base:'./'});
