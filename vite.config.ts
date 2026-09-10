import { sites } from '@openai/sites-vite-plugin';
import tailwindcss from '@tailwindcss/postcss';
import { nitro } from 'nitro/vite';
import { fileURLToPath } from 'node:url';
import vinext from 'vinext';
import { defineConfig } from 'vite';
import hostingConfig from './.openai/hosting.json';

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  '00000000-0000-4000-8000-000000000000';

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === 'seatbelt';
// Vercel only consumes this path while building the isolated visual-preview
// branch. Cloudflare remains the production runtime and keeps its bindings.
const isVercelPreview = process.env.VERCEL === '1';
const previewPath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const localBindingConfig = {
  main: 'vinext/server/fetch-handler',
  compatibility_flags: ['nodejs_compat'],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: 'site-creator-d1',
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: 'site-creator-r2',
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  // Nitro turns Vinext's Vite build into a Vercel handler for preview deploys.
  const platformPlugin = isVercelPreview
    ? nitro()
    : (
        await import('@cloudflare/vite-plugin')
      ).cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        config: localBindingConfig,
      });

  return {
    // Discover the context controls before the first render, avoiding a late
    // optimizer pass that can mix old and new React runtime modules in preview.
    optimizeDeps: {
      include: ['@base-ui/react/button', '@base-ui/react/dialog', '@base-ui/react/radio', '@base-ui/react/radio-group', 'clsx', 'tailwind-merge', 'class-variance-authority'],
    },
    css: { postcss: { plugins: [tailwindcss()] } },
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    resolve: isVercelPreview
      ? {
          // Preview pages can render without D1/R2; the runtime-dependent
          // server helpers already surface their no-storage fallback.
          alias: {
            'cloudflare:workers': previewPath('./preview/cloudflare-workers-shim.ts'),
            // Nitro's server environment does not resolve CSS package export
            // conditions, so provide the same stylesheet entry points Vite
            // normally obtains from each package manifest.
            tailwindcss: previewPath('./node_modules/tailwindcss/index.css'),
            'tw-animate-css': previewPath(
              './node_modules/tw-animate-css/dist/tw-animate.css',
            ),
            'shadcn/tailwind.css': previewPath(
              './node_modules/shadcn/dist/tailwind.css',
            ),
          },
        }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      platformPlugin,
    ],
  };
});
