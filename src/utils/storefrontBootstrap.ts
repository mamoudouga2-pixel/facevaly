const STORAGE_KEY = 'fv-storefront-bootstrap-v4';

const MAX_AGE_MS = 5 * 60 * 1000;


export function readEmbeddedStorefrontBootstrap(): any | null {
    const element = document.getElementById(
        'storefront-bootstrap'
    );

    if (!element?.textContent) {
        return null;
    }

    try {
        const parsed = JSON.parse(
            element.textContent
        );

        return parsed?.data ?? parsed ?? null;
    } catch {
        return null;
    }
}


export function readStoredStorefrontBootstrap(): any | null {
    try {
        const raw = sessionStorage.getItem(
            STORAGE_KEY
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


export function readStorefrontBootstrap(): any | null {
    return (
        readEmbeddedStorefrontBootstrap()
        ?? readStoredStorefrontBootstrap()
    );
}


export function persistStorefrontBootstrap(data: unknown): void {
    if (!data) {
        return;
    }

    try {
        sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                ts: Date.now(),
                data,
            })
        );
    } catch {
        // Ignore quota / private mode errors.
    }
}
