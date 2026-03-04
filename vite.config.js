/**
 * vite.config.js
 *
 * Vite 7 build configuration.
 *
 * Features:
 *   - ES2023 output target
 *   - LightningCSS for transform + minification
 *   - Brotli compression of all text assets ≥ 1 kB
 *   - Auto-detects GitHub Pages base path from $GITHUB_REPOSITORY
 */

import { defineConfig } from 'vite';
import { compression }  from 'vite-plugin-compression2';
import zlib              from 'node:zlib';

// ---------------------------------------------------------------------------
// Base path resolution
//
// In GitHub Actions, $GITHUB_REPOSITORY = "<owner>/<repo>".
// GitHub Pages serves the site at "https://<owner>.github.io/<repo>/",
// so Vite's `base` must be "/<repo>/".
// Locally (or when the variable is absent) base stays "/".
// ---------------------------------------------------------------------------
const resolveBase = () => {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) return '/';
  const [, name] = repo.split('/');
  return `/${name}/`;
};

export default defineConfig({
  // ---------------------------------------------------------------------------
  // Public / static assets
  // Directory is served as-is at the root of the dev server and copied to dist.
  // ---------------------------------------------------------------------------
  publicDir: 'assets',

  base: resolveBase(),

  // ---------------------------------------------------------------------------
  // CSS
  // ---------------------------------------------------------------------------
  css: {
    /**
     * Use LightningCSS instead of PostCSS for:
     *   - vendor prefixing
     *   - CSS nesting (if ever used)
     *   - draft syntax down-levelling
     *   - minification (also set build.cssMinify below)
     */
    transformer: 'lightningcss',
    lightningcss: {
      // Target the same browser set as the JS build.
      // `undefined` lets LightningCSS default to broad modern-browser support.
      targets: undefined,
      // Enable draft CSS features that LightningCSS can safely down-level.
      drafts: {
        customMedia: true,
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------
  build: {
    /**
     * ES2023: ships native class fields, top-level await, `at()`, etc.
     * All major browsers released after 2023 support this target natively.
     */
    target: 'es2023',

    outDir:    'dist',
    assetsDir: 'assets',

    /**
     * esbuild is Vite 7's default JS minifier (fast, tree-shakes well).
     * Keep it; only override the CSS minifier.
     */
    minify: 'esbuild',

    /**
     * Delegate CSS minification to LightningCSS (same engine used above).
     * Produces smaller output than esbuild's CSS minifier.
     */
    cssMinify: 'lightningcss',

    rollupOptions: {
      output: {
        /**
         * Single chunk for this small SPA.
         * Revisit if the bundle grows significantly.
         */
        manualChunks: undefined,

        // Content-hash filenames for long-lived caching.
        entryFileNames:  'assets/[name]-[hash].js',
        chunkFileNames:  'assets/[name]-[hash].js',
        assetFileNames:  'assets/[name]-[hash][extname]',
      },
    },
  },

  // ---------------------------------------------------------------------------
  // Plugins
  // ---------------------------------------------------------------------------
  plugins: [
    /**
     * Brotli: compress every text asset ≥ 1 kB at the highest quality (11).
     * Produces `.br` siblings alongside the original files so servers can
     * serve pre-compressed responses with `Content-Encoding: br`.
     *
     * The original, uncompressed files are kept (deleteOriginalAssets: false)
     * so the build also works against servers without Brotli support.
     */
    compression({
      algorithm: 'brotliCompress',
      compressionOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
        },
      },
      // Skip files that are already compressed.
      exclude: [/\.(br|gz|png|jpg|jpeg|gif|webp|avif|woff2)$/],
      threshold: 1_024,
      deleteOriginalAssets: false,
    }),
  ],

  // ---------------------------------------------------------------------------
  // Dev server
  // ---------------------------------------------------------------------------
  server: {
    port: 8080,
    strictPort: true,
  },

  preview: {
    port: 8080,
    strictPort: true,
  },
});
