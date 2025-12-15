// Fix: "Cannot find type definition file for 'vite/client'" by declaring env types manually.
// This is a workaround for an environment where tsconfig.json might be misconfigured.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
