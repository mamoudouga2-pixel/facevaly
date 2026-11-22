/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MEDIA_BASE_URL?: string;
  readonly VITE_FORCE_MEDIA_ORIGIN?: string;
  readonly VITE_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface AppRuntimeConfig {
  BACKEND_URL?: string;
  API_BASE_URL?: string;
  MEDIA_BASE_URL?: string;
  FORCE_MEDIA_ORIGIN?: boolean;
}

interface Window {
  APP_CONFIG?: AppRuntimeConfig;
}
