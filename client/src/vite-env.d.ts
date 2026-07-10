/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL in production (e.g. Railway) — dev uses the Vite proxy instead, see vite.config.ts */
  readonly VITE_API_URL?: string
}
