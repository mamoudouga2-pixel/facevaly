import {
    BACKEND_URL,
} from "../config/api";

let csrfReady = false;
let csrfPromise: Promise<boolean> | null = null;
/** Token from X-XSRF-TOKEN response header (works when document.cookie cannot). */
let memoryToken: string | null = null;

export const getCookie = (name: string): string | null => {
    const cookies = document.cookie
        ? document.cookie.split("; ")
        : [];

    // Prefer the last matching cookie — browsers can retain duplicates from
    // older hosts/paths; the newest Set-Cookie tends to appear last.
    let matched: string | null = null;

    for (const cookie of cookies) {
        const [key, ...parts] = cookie.split("=");

        if (key === name) {
            try {
                matched = decodeURIComponent(parts.join("="));
            } catch {
                matched = parts.join("=");
            }
        }
    }

    return matched;
};

const metaCsrfToken = (): string | null =>
    document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content")
    || null;

const isCrossOriginBackend = (): boolean => {
    if (typeof window === "undefined") return false;
    if (!BACKEND_URL) return false;
    try {
        return new URL(BACKEND_URL).origin !== window.location.origin;
    } catch {
        return false;
    }
};

const csrfUrl = (): string => {
    // Same-origin relative path so XSRF-TOKEN is readable on the page host
    // (Vite proxies /sanctum → backend in development).
    if (
        typeof window !== "undefined" &&
        (!BACKEND_URL ||
            BACKEND_URL === window.location.origin)
    ) {
        return "/sanctum/csrf-cookie";
    }

    return `${BACKEND_URL.replace(/\/+$/, "")}/sanctum/csrf-cookie`;
};

/** Prefer memory (from API header), then readable cookie, then meta tag. */
export const getCsrfToken = (): string | null =>
    memoryToken
    || getCookie("XSRF-TOKEN")
    || metaCsrfToken();

export const hasCsrfToken = (): boolean => Boolean(getCsrfToken());

export const resetCsrf = (): void => {
    csrfReady = false;
    csrfPromise = null;
    memoryToken = null;
};

/** Sync token captured from API response headers (CORS-exposed). */
export const rememberCsrfToken = (token: string | null | undefined): void => {
    if (typeof token === "string" && token.trim()) {
        memoryToken = token.trim();
    }
};

/**
 * Ensure CSRF cookie/session are in sync.
 * Pass force=true before login/register/logout/mutations so stale browser
 * cookies cannot skip a refresh (common outside incognito).
 *
 * Cross-origin: SPA may not read XSRF via document.cookie. Backend exposes
 * X-XSRF-TOKEN on bootstrap; we keep it in memory and send as a header.
 * Cookie is still sent with credentials:include for server-side checks.
 */
export const ensureCsrf = async (force = false): Promise<boolean> => {
    if (
        !force
        && csrfReady
        && (hasCsrfToken() || isCrossOriginBackend())
    ) {
        return true;
    }

    if (csrfPromise) {
        if (!force) {
            return csrfPromise;
        }

        // Wait for any in-flight bootstrap, then force a fresh one.
        try {
            await csrfPromise;
        } catch {
            // ignore — we will retry below
        }
        csrfPromise = null;
    }

    if (force) {
        csrfReady = false;
        // Drop stale memory so we never reuse a token from a previous jar.
        memoryToken = null;
    }

    csrfPromise = fetch(csrfUrl(), {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Could not initialize CSRF protection. Server returned ${response.status}.`
                );
            }

            const fromHeader =
                response.headers.get("X-XSRF-TOKEN")
                || response.headers.get("x-xsrf-token");

            // Header is authoritative on cross-origin; cookie may be unreadable
            // or a leftover twin from an older Domain= setting.
            rememberCsrfToken(fromHeader || getCookie("XSRF-TOKEN"));

            if (!getCsrfToken() && !isCrossOriginBackend()) {
                throw new Error("Could not initialize CSRF protection.");
            }

            csrfReady = true;
            return true;
        })
        .finally(() => {
            csrfPromise = null;
        });

    return csrfPromise;
};

export const requiresCsrf = (method?: string): boolean =>
    ["POST", "PUT", "PATCH", "DELETE"].includes(
        String(method || "GET").toUpperCase()
    );
