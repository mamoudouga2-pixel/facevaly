import productDetailService from "../services/productDetailService";

const STORAGE_PREFIX = "fv-product-v1:";
const MAX_AGE_MS = 5 * 60 * 1000;

const inflight = new Set<string>();


export function readEmbeddedProductBootstrap(
    expectedSlug: string | null = null
): any | null {
    const element = document.getElementById(
        "product-bootstrap"
    );

    if (!element?.textContent) {
        return null;
    }

    try {
        const parsed = JSON.parse(
            element.textContent
        );

        if (
            expectedSlug
            && parsed?.slug !== expectedSlug
        ) {
            return null;
        }

        return parsed;
    } catch {
        return null;
    }
}


export function readStoredProduct(slug: string): any | null {
    if (!slug) {
        return null;
    }

    try {
        const raw = sessionStorage.getItem(
            STORAGE_PREFIX + slug
        );

        if (!raw) {
            return null;
        }

        const cached = JSON.parse(raw);

        if (
            !cached?.data
            || Date.now() - cached.ts > MAX_AGE_MS
        ) {
            return null;
        }

        return cached.data;
    } catch {
        return null;
    }
}


export function readProductBootstrap(slug: string): any | null {
    return (
        readEmbeddedProductBootstrap(slug)
        ?? readStoredProduct(slug)
    );
}


export function persistProduct(slug: string, data: unknown): void {
    if (!slug || !data) {
        return;
    }

    try {
        sessionStorage.setItem(
            STORAGE_PREFIX + slug,
            JSON.stringify({
                ts: Date.now(),
                data,
            })
        );
    } catch {
        // Ignore quota / private mode errors.
    }
}


export function prefetchProduct(slug: string): void {
    if (
        !slug
        || inflight.has(slug)
        || readStoredProduct(slug)
    ) {
        return;
    }

    inflight.add(slug);

    productDetailService
        .show(slug)
        .then((response: any) => {
            persistProduct(
                slug,
                response?.data ?? null
            );
        })
        .catch(() => {
            // Ignore prefetch failures.
        })
        .finally(() => {
            inflight.delete(slug);
        });
}
