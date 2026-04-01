/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UMAMI_SCRIPT_URL?: string
  readonly VITE_UMAMI_WEBSITE_ID_DEV?: string
  readonly VITE_UMAMI_WEBSITE_ID_PROD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
