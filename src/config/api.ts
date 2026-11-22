const runtimeConfig = window.APP_CONFIG || {};

const trimTrailingSlash = (value?: string | null): string =>
  String(value || "").replace(/\/+$/, "");

/** Local absolute API hosts break CSRF (cookie host ≠ page host). Prefer Vite proxy. */
const isLocalDevBackend = (url: string): boolean => {
  if (!url || !import.meta.env.DEV) return false;
  try {
    const { hostname, port } = new URL(url);
    return (
      (hostname === "127.0.0.1" || hostname === "localhost") &&
      (port === "5000" || port === "8000")
    );
  } catch {
    return false;
  }
};

const rawEnvBackend = trimTrailingSlash(import.meta.env.VITE_BACKEND_URL);
const rawEnvApi = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL);
const rawEnvMedia = trimTrailingSlash(import.meta.env.VITE_MEDIA_BASE_URL);
const envForceMedia = import.meta.env.VITE_FORCE_MEDIA_ORIGIN;

const pageOrigin =
  typeof window !== "undefined" ? window.location.origin : "";

const envBackend = isLocalDevBackend(rawEnvBackend) ? "" : rawEnvBackend;
const envApi = isLocalDevBackend(rawEnvApi) ? "" : rawEnvApi;
const envMedia = isLocalDevBackend(rawEnvMedia) ? "" : rawEnvMedia;

/**
 * Prefer Vite env, then window.APP_CONFIG, then same-origin (Vite proxy → Node :5000).
 */
export const BACKEND_URL = trimTrailingSlash(
  envBackend ||
    runtimeConfig.BACKEND_URL ||
    pageOrigin
);

export const API_BASE_URL = trimTrailingSlash(
  envApi ||
    runtimeConfig.API_BASE_URL ||
    (BACKEND_URL ? `${BACKEND_URL}/api` : "/api")
);

export const MEDIA_BASE_URL = trimTrailingSlash(
  envMedia || runtimeConfig.MEDIA_BASE_URL || BACKEND_URL || pageOrigin
);

export const FORCE_MEDIA_ORIGIN =
  envForceMedia != null
    ? !["0", "false", "no"].includes(String(envForceMedia).toLowerCase())
    : (runtimeConfig.FORCE_MEDIA_ORIGIN ?? true);

const OWN_MEDIA_HOSTS = (() => {
  const hosts = new Set<string>([
    "facevaly.com",
    "www.facevaly.com",
    "backbone.facevaly.com",
    "localhost",
    "127.0.0.1",
  ]);

  for (const raw of [MEDIA_BASE_URL, BACKEND_URL, pageOrigin, API_BASE_URL]) {
    if (!raw) continue;
    try {
      const host = new URL(
        raw.includes("://") ? raw : `https://${raw}`
      ).hostname.toLowerCase();
      if (host) hosts.add(host);
    } catch {
      // ignore
    }
  }

  return hosts;
})();

const isOwnMediaHost = (hostname: string): boolean => {
  const host = String(hostname || "").toLowerCase();
  if (!host) return false;
  if (OWN_MEDIA_HOSTS.has(host)) return true;
  // Treat sibling subdomains of configured apex as own media.
  for (const known of OWN_MEDIA_HOSTS) {
    if (known.startsWith(".") && host.endsWith(known)) return true;
    if (host.endsWith(`.${known}`)) return true;
  }
  return false;
};

export const apiUrl = (path = ""): string => {
  const cleanPath = String(path).replace(/^\/+/, "");
  return cleanPath ? `${API_BASE_URL}/${cleanPath}` : API_BASE_URL;
};

export const backendUrl = (path = ""): string => {
  const cleanPath = String(path).replace(/^\/+/, "");
  return cleanPath ? `${BACKEND_URL}/${cleanPath}` : BACKEND_URL;
};

/**
 * Resolve a media/document URL for <img src>.
 *
 * - External CDNs (Amazon, etc.) are NEVER rewritten (FORCE_MEDIA_ORIGIN
 *   used to strip their host onto facevaly/backbone → broken images).
 * - Own absolute URLs may be rebased onto MEDIA_BASE_URL.
 * - /api/... private document routes are rooted on BACKEND_URL.
 * - Relative /storage and bare public paths use MEDIA_BASE_URL.
 */
export const mediaUrl = (path?: string | null): string => {
  if (!path) {
    return "";
  }

  const value = String(path).trim();
  if (!value) {
    return "";
  }

  if (value.startsWith("//")) {
    return mediaUrl(`https:${value}`);
  }

  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      if (!isOwnMediaHost(parsed.hostname)) {
        // Amazon CDN / third-party — keep as-is.
        return value;
      }

      if (FORCE_MEDIA_ORIGIN) {
        return `${MEDIA_BASE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }

      return value;
    } catch {
      return value;
    }
  }

  // Authenticated document download routes must hit the API host, not the SPA.
  if (value.startsWith("/api/") || value.startsWith("api/")) {
    const apiPath = value.replace(/^\/?api\//, "");
    return apiUrl(apiPath);
  }

  const clean = value.replace(/^\/+/, "");

  // Public disk paths are always served under /storage/* (Laravel/Node parity).
  // DB stores relative keys like "landing-pages/x.jpg" or "products/.../x.png".
  if (clean.startsWith("storage/")) {
    return `${MEDIA_BASE_URL}/${clean}`;
  }

  return `${MEDIA_BASE_URL}/storage/${clean}`;
};

const apiConfig = {
  BACKEND_URL,
  API_BASE_URL,
  MEDIA_BASE_URL,
  FORCE_MEDIA_ORIGIN,
  apiUrl,
  backendUrl,
  mediaUrl,
};

export default apiConfig;
