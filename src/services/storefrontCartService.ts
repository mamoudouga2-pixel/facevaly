import {
    apiUrl,
} from "../config/api";

import {
    ensureCsrf as ensureSharedCsrf,
    getCsrfToken,
    rememberCsrfToken,
    resetCsrf,
} from "./csrfBootstrap";


/* =========================================================================
   HELPERS
========================================================================= */

function hasWindow(): boolean {
    return (
        typeof window !== "undefined"
    );
}


function hasDocument(): boolean {
    return (
        typeof document !== "undefined"
    );
}


function trimSlash(
    value: unknown
): string {
    return String(
        value || ""
    )
        .trim()
        .replace(
            /\/+$/,
            ""
        );
}


/* =========================================================================
   BACKEND BASE URL
========================================================================= */

function backendBaseUrl(): string {
    if (!hasWindow()) {
        return "";
    }


    try {
        /*
         * apiUrl("storefront/cart") may return:
         *
         * /api/storefront/cart
         *
         * OR
         *
         * https://api.example.com/api/storefront/cart
         *
         * OR
         *
         * https://example.com/backend/api/storefront/cart
         */

        const url =
            new URL(
                apiUrl(
                    "storefront/cart"
                ),
                window.location.origin
            );


        const apiMarker =
            "/api/";


        const markerIndex =
            url.pathname.indexOf(
                apiMarker
            );


        if (
            markerIndex >= 0
        ) {
            const prefix =
                url.pathname.slice(
                    0,
                    markerIndex
                );


            return trimSlash(
                `${url.origin}${prefix}`
            );
        }


        if (
            url.pathname.endsWith(
                "/api"
            )
        ) {
            return trimSlash(
                `${url.origin}${url.pathname.slice(0, -4)}`
            );
        }


        return trimSlash(
            url.origin
        );
    } catch {
        return trimSlash(
            window.location.origin
        );
    }
}


/* =========================================================================
   CSRF ENDPOINT
========================================================================= */

function csrfUrl(): string {
    return (
        `${backendBaseUrl()}/sanctum/csrf-cookie`
    );
}


/* =========================================================================
   COOKIE
========================================================================= */

function getCookie(
    name: string
): string | null {
    if (
        !hasDocument()
        ||
        !document.cookie
    ) {
        return null;
    }


    const cookies =
        document.cookie.split(
            "; "
        );


    for (
        const cookie
        of cookies
    ) {
        const [
            key,
            ...parts
        ] =
            cookie.split(
                "="
            );


        if (
            key !== name
        ) {
            continue;
        }


        const value =
            parts.join(
                "="
            );


        try {
            return decodeURIComponent(
                value
            );
        } catch {
            return value;
        }
    }


    return null;
}


/* =========================================================================
   META CSRF FALLBACK
========================================================================= */

function metaCsrfToken(): string {
    if (!hasDocument()) {
        return "";
    }


    const element =
        document.querySelector(
            'meta[name="csrf-token"]'
        );


    return (
        element?.getAttribute(
            "content"
        )
        || ""
    );
}


/* =========================================================================
   RESET CSRF
========================================================================= */

export function resetStorefrontCartCsrf(): void {
    resetCsrf();
}

async function ensureCsrf(
    force = false
): Promise<boolean> {
    if (force) {
        resetCsrf();
    }

    return ensureSharedCsrf(force);
}


/* =========================================================================
   ERROR MESSAGE
========================================================================= */

function errorMessage(
    data: any,
    status = 0
): string {
    if (
        data?.errors
        &&
        typeof data.errors ===
            "object"
    ) {
        const first =
            Object.values(
                data.errors
            )
                .flat()
                .find(
                    Boolean
                );


        if (first) {
            return String(
                first
            );
        }
    }


    if (
        data?.message
    ) {
        return String(
            data.message
        );
    }


    switch (
        Number(
            status
        )
    ) {
        case 401:
            return "Please sign in and try again.";

        case 403:
            return "You are not allowed to perform this action.";

        case 404:
            return "The requested product or cart item could not be found.";

        case 419:
            return "Your security session expired. Please refresh the page and try again.";

        case 422:
            return "The selected product could not be added to the cart.";

        case 429:
            return "Too many requests. Please wait a moment and try again.";

        default:
            return "Something went wrong. Please try again.";
    }
}


/* =========================================================================
   RESPONSE PARSER
========================================================================= */

async function parseResponse(
    response: Response
): Promise<any> {
    if (
        response.status ===
        204
    ) {
        return {};
    }


    const contentType =
        response.headers.get(
            "content-type"
        )
        || "";


    if (
        contentType.includes(
            "application/json"
        )
    ) {
        try {
            return await response.json();
        } catch {
            return {};
        }
    }


    let text = "";


    try {
        text =
            await response.text();
    } catch {
        text =
            "";
    }


    /*
     * Avoid displaying an entire nginx/Laravel HTML
     * error page inside a toast.
     */

    const cleanText =
        text
            .replace(
                /<[^>]*>/g,
                " "
            )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .slice(
                0,
                500
            );


    return {
        message:
            cleanText
            ||
            `Server returned status ${response.status}.`,
    };
}


/* =========================================================================
   CREATE ERROR
========================================================================= */

function createRequestError(
    response: Response,
    data: any
): Error & {
    status?: number;
    data?: any;
    errors?: any;
    response?: { status: number; data: any };
} {
    const error =
        new Error(
            errorMessage(
                data,
                response.status
            )
        ) as Error & {
            status?: number;
            data?: any;
            errors?: any;
            response?: { status: number; data: any };
            cause?: unknown;
        };


    error.status =
        response.status;


    error.data =
        data || {};


    error.errors =
        data?.errors || {};


    error.response = {
        status:
            response.status,

        data:
            data || {},
    };


    return error;
}


/* =========================================================================
   MAIN REQUEST
========================================================================= */

async function request(
    path: string,
    options: RequestInit = {},
    retried = false
): Promise<any> {
    const method =
        String(
            options.method
            || "GET"
        ).toUpperCase();


    const mutating =
        [
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
        ].includes(
            method
        );


    /*
    |--------------------------------------------------------------------------
    | CSRF
    |--------------------------------------------------------------------------
    */

    if (
        mutating
    ) {
        await ensureCsrf();
    }


    /*
    |--------------------------------------------------------------------------
    | HEADERS
    |--------------------------------------------------------------------------
    */

    const headers =
        new Headers(
            options.headers
            || {}
        );


    headers.set(
        "Accept",
        "application/json"
    );


    headers.set(
        "X-Requested-With",
        "XMLHttpRequest"
    );


    if (
        mutating
    ) {
        const xsrf = getCsrfToken();

        if (
            xsrf
        ) {
            headers.set(
                "X-XSRF-TOKEN",
                xsrf
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CONTENT TYPE
    |--------------------------------------------------------------------------
    */

    const body =
        options.body;


    if (
        body !== undefined
        &&
        body !== null
        &&
        !(
            typeof FormData !==
                "undefined"
            &&
            body instanceof FormData
        )
        &&
        !headers.has(
            "Content-Type"
        )
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }


    /*
    |--------------------------------------------------------------------------
    | FETCH
    |--------------------------------------------------------------------------
    */

    let response;


    try {
        response =
            await fetch(
                apiUrl(
                    path
                ),
                {
                    ...options,

                    method,

                    headers,

                    /*
                     * CRITICAL PRODUCTION FIX
                     */

                    credentials:
                        "include",

                    /*
                     * Cart data must never be served
                     * from stale browser cache.
                     */

                    cache:
                        options.cache
                        || "no-store",
                }
            );
    } catch (
        error
    ) {
        const networkError =
            new Error(
                "Could not connect to the server. Please check your internet connection and try again."
            ) as Error & {
                status?: number;
                cause?: unknown;
            };


        networkError.status =
            0;

        networkError.cause =
            error;


        throw networkError;
    }

    rememberCsrfToken(
        response.headers.get("X-XSRF-TOKEN")
        || response.headers.get("x-xsrf-token")
    );


    /*
    |--------------------------------------------------------------------------
    | ONE-TIME 419 RECOVERY
    |--------------------------------------------------------------------------
    */

    if (
        response.status ===
            419
        &&
        !retried
        &&
        mutating
    ) {
        resetStorefrontCartCsrf();


        await ensureCsrf(
            true
        );


        return request(
            path,
            options,
            true
        );
    }


    const data =
        await parseResponse(
            response
        );


    if (
        !response.ok
    ) {
        throw createRequestError(
            response,
            data
        );
    }


    return data;
}


/* =========================================================================
   NORMALIZE NUMBER
========================================================================= */

function positiveInteger(
    value: unknown,
    fallback = 1
): number {
    const number =
        Number(
            value
        );


    if (
        !Number.isInteger(
            number
        )
        ||
        number < 1
    ) {
        return fallback;
    }


    return number;
}


/* =========================================================================
   SERVICE
========================================================================= */

const storefrontCartService = {

    /*
    |--------------------------------------------------------------------------
    | GET CART
    |--------------------------------------------------------------------------
    */

    get(): Promise<any> {
        return request(
            "storefront/cart",
            {
                method:
                    "GET",
            }
        );
    },


    /*
    |--------------------------------------------------------------------------
    | ADD
    |--------------------------------------------------------------------------
    */

    add({
        product_id,
        variant_id = null,
        quantity = 1,
    }: {
        product_id: unknown;
        variant_id?: unknown;
        quantity?: unknown;
    }): Promise<any> {
        const productId =
            positiveInteger(
                product_id,
                0
            );


        if (
            productId <= 0
        ) {
            return Promise.reject(
                new Error(
                    "A valid product is required."
                )
            );
        }


        let variantId =
            null;


        if (
            variant_id !== null
            &&
            variant_id !== undefined
            &&
            variant_id !== ""
        ) {
            variantId =
                positiveInteger(
                    variant_id,
                    0
                );


            if (
                variantId <= 0
            ) {
                return Promise.reject(
                    new Error(
                        "The selected product option is invalid."
                    )
                );
            }
        }


        return request(
            "storefront/cart/items",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        product_id:
                            productId,

                        variant_id:
                            variantId,

                        quantity:
                            positiveInteger(
                                quantity,
                                1
                            ),
                    }),
            }
        );
    },


    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    update(
        itemId: string | number,
        quantity: unknown
    ): Promise<any> {
        return request(
            `storefront/cart/items/${encodeURIComponent(
                String(
                    itemId
                )
            )}`,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify({
                        quantity:
                            positiveInteger(
                                quantity,
                                1
                            ),
                    }),
            }
        );
    },


    /*
    |--------------------------------------------------------------------------
    | REMOVE
    |--------------------------------------------------------------------------
    */

    remove(
        itemId: string | number
    ): Promise<any> {
        return request(
            `storefront/cart/items/${encodeURIComponent(
                String(
                    itemId
                )
            )}`,
            {
                method:
                    "DELETE",
            }
        );
    },


    /*
    |--------------------------------------------------------------------------
    | REMOVE SELECTED
    |--------------------------------------------------------------------------
    */

    removeSelected(
        itemIds: unknown
    ): Promise<any> {
        const ids =
            Array.from(
                new Set(
                    (
                        Array.isArray(
                            itemIds
                        )
                            ? itemIds
                            : []
                    )
                        .map(
                            Number
                        )
                        .filter(
                            (
                                id
                            ) =>
                                Number.isInteger(
                                    id
                                )
                                &&
                                id > 0
                        )
                )
            );


        if (
            ids.length === 0
        ) {
            return Promise.reject(
                new Error(
                    "Select at least one cart item."
                )
            );
        }


        return request(
            "storefront/cart/delete-selected",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        item_ids:
                            ids,
                    }),
            }
        );
    },


    /*
    |--------------------------------------------------------------------------
    | MOVE TO WISHLIST
    |--------------------------------------------------------------------------
    */

    moveToWishlist(
        itemId: string | number
    ): Promise<any> {
        return request(
            `storefront/cart/items/${encodeURIComponent(
                String(
                    itemId
                )
            )}/move-to-wishlist`,
            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        {}
                    ),
            }
        );
    },


    /*
    |--------------------------------------------------------------------------
    | COUPON PREVIEW
    |--------------------------------------------------------------------------
    */

    couponPreview(
        code: unknown,
        itemIds: unknown[] = []
    ): Promise<any> {
        const ids =
            (
                Array.isArray(
                    itemIds
                )
                    ? itemIds
                    : []
            )
                .map(
                    Number
                )
                .filter(
                    (
                        id
                    ) =>
                        Number.isInteger(
                            id
                        )
                        &&
                        id > 0
                );


        return request(
            "storefront/cart/coupon-preview",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        code:
                            String(
                                code || ""
                            )
                                .trim()
                                .toUpperCase(),

                        item_ids:
                            ids,
                    }),
            }
        );
    },
};


export {
    request as storefrontCartRequest,
    ensureCsrf as initializeStorefrontCartCsrf,
};


export default storefrontCartService;