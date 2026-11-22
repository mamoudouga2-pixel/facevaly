const STORAGE_PREFIX = "fv-page-v1:";
const MAX_AGE_MS = 5 * 60 * 1000;


export function readEmbeddedPageBootstrap(): any | null {
    const element = document.getElementById(
        "page-bootstrap"
    );

    if (!element?.textContent) {
        return null;
    }

    try {
        return JSON.parse(element.textContent);
    } catch {
        return null;
    }
}


export function readStoredPage(type: string, slug: string): any | null {
    if (!type || !slug) {
        return null;
    }

    try {
        const raw = sessionStorage.getItem(
            STORAGE_PREFIX + type + ":" + slug
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


export function readPageBootstrap(type: string, slug: string): any | null {
    const embedded = readEmbeddedPageBootstrap();

    if (
        embedded?.type === type
        && embedded?.slug === slug
        && embedded?.data
    ) {
        return embedded.data;
    }

    return readStoredPage(type, slug);
}


export function persistPage(type: string, slug: string, data: unknown): void {
    if (!type || !slug || !data) {
        return;
    }

    try {
        sessionStorage.setItem(
            STORAGE_PREFIX + type + ":" + slug,
            JSON.stringify({
                ts: Date.now(),
                data,
            })
        );
    } catch {
        // Ignore quota / private mode errors.
    }
}
