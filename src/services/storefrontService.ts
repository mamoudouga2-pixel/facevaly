import { apiUrl } from "../config/api";
import {
    ensureCsrf,
    getCsrfToken,
    rememberCsrfToken,
    requiresCsrf,
    resetCsrf,
} from "./csrfBootstrap";

type ApiErrorData = {
    message?: string;
    errors?: Record<string, unknown>;
    [key: string]: unknown;
};

type RequestOptions = RequestInit & {
    headers?: Record<string, string>;
    body?: BodyInit | null;
};

type ProductFilters = {
    q?: string;
    search?: string;
    sort?: string;
    page?: number | string;
    per_page?: number | string;
    category?: string;
    category_id?: number | string;
    vendor_id?: number | string;
    min_price?: number | string | null;
    max_price?: number | string | null;
    in_stock?: boolean | number | string;
    brands?: unknown[];
    flags?: unknown[];
    attributes?: Record<string, unknown[]>;
    [key: string]: unknown;
};

const errorMessage = (data: ApiErrorData | null): string => {
    if (
        data?.errors &&
        typeof data.errors === "object"
    ) {
        const first = Object.values(data.errors)
            .flat()
            .find(Boolean);

        if (first) {
            return String(first);
        }
    }

    return data?.message || "Something went wrong.";
};

const request = async (
    path: string,
    options: RequestOptions = {},
    retried = false
): Promise<any> => {
    const method = String(
        options.method || "GET"
    ).toUpperCase();

    if (requiresCsrf(method)) {
        await ensureCsrf(true);
    }

    const headers: Record<string, string> = {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...(options.headers || {}),
    };

    if (
        options.body !== undefined &&
        options.body !== null
    ) {
        headers["Content-Type"] = "application/json";
    }

    if (requiresCsrf(method)) {
        const xsrfToken = getCsrfToken();

        if (xsrfToken) {
            headers["X-XSRF-TOKEN"] = xsrfToken;
        }
    }

    const response = await fetch(apiUrl(path), {
        ...options,
        method,
        headers,
        credentials: "include",
        cache: "no-store",
    });

    rememberCsrfToken(
        response.headers.get("X-XSRF-TOKEN")
        || response.headers.get("x-xsrf-token")
    );

    if (
        response.status === 419 &&
        !retried
    ) {
        resetCsrf();
        await ensureCsrf(true);

        return request(path, options, true);
    }

    let data: any = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    if (!response.ok) {
        const error = new Error(errorMessage(data)) as Error & {
            status?: number;
            data?: any;
        };
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

/* =========================================================================
   STOREFRONT
============================================================================ */

const appendArray = (
    params: URLSearchParams,
    key: string,
    values: unknown[] = []
): void => {
    values.forEach((value) => {
        params.append(`${key}[]`, String(value));
    });
};

const buildProductQuery = (filters: ProductFilters = {}): string => {
    const params = new URLSearchParams();

    if (filters.q) params.set("q", String(filters.q));
    if (filters.search) params.set("search", String(filters.search));
    if (filters.sort) params.set("sort", String(filters.sort));
    if (filters.page) params.set("page", String(filters.page));

    params.set(
        "per_page",
        String(filters.per_page || 20)
    );
    if (filters.category) params.set("category", String(filters.category));
    if (filters.category_id) {
        params.set("category_id", String(filters.category_id));
    }
    if (filters.vendor_id) {
        params.set("vendor_id", String(filters.vendor_id));
    }

    if (
        filters.min_price !== "" &&
        filters.min_price !== null &&
        filters.min_price !== undefined
    ) {
        params.set("min_price", String(filters.min_price));
    }

    if (
        filters.max_price !== "" &&
        filters.max_price !== null &&
        filters.max_price !== undefined
    ) {
        params.set("max_price", String(filters.max_price));
    }

    if (filters.in_stock) {
        params.set("in_stock", "1");
    }

    appendArray(params, "brands", filters.brands || []);
    appendArray(params, "flags", filters.flags || []);

    Object.entries(filters.attributes || {}).forEach(
        ([attributeId, valueIds]) => {
            (valueIds || []).forEach((valueId) => {
                params.append(
                    `attributes[${attributeId}][]`,
                    String(valueId)
                );
            });
        }
    );

    return params.toString();
};

const storefrontService = {
    products(filters: ProductFilters = {}): Promise<any> {
        const query = buildProductQuery(filters);

        return request(
            query
                ? `storefront/products?${query}`
                : "storefront/products"
        );
    },

    product(id: string | number): Promise<any> {
        return request(`storefront/products/${id}`);
    },

    startBuyNow(payload: Record<string, unknown>): Promise<any> {
        return request("storefront/checkout/buy-now", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    startCartCheckout(
        itemIds: unknown[],
        couponCode: string | null = null
    ): Promise<any> {
        return request("storefront/checkout/cart", {
            method: "POST",
            body: JSON.stringify({
                item_ids: itemIds,
                coupon_code: couponCode || null,
            }),
        });
    },

    checkout(token: string): Promise<any> {
        return request(
            `storefront/checkout/${encodeURIComponent(token)}`
        );
    },

    saveDraft(token: string, payload: Record<string, unknown>): Promise<any> {
        return request(
            `storefront/checkout/${encodeURIComponent(token)}/draft`,
            {
                method: "PATCH",
                body: JSON.stringify(payload),
            }
        );
    },

    updateCheckoutItem(
        token: string,
        itemId: string | number,
        quantity: number
    ): Promise<any> {
        return request(
            `storefront/checkout/${encodeURIComponent(
                token
            )}/items/${itemId}`,
            {
                method: "PATCH",
                body: JSON.stringify({
                    quantity,
                }),
            }
        );
    },

    removeCheckoutItem(
        token: string,
        itemId: string | number
    ): Promise<any> {
        return request(
            `storefront/checkout/${encodeURIComponent(
                token
            )}/items/${itemId}`,
            {
                method: "DELETE",
            }
        );
    },

    applyCoupon(token: string, code: string): Promise<any> {
        return request(
            `storefront/checkout/${encodeURIComponent(token)}/coupon`,
            {
                method: "POST",
                body: JSON.stringify({
                    code,
                }),
            }
        );
    },

    removeCoupon(token: string): Promise<any> {
        return request(
            `storefront/checkout/${encodeURIComponent(token)}/coupon`,
            {
                method: "DELETE",
            }
        );
    },

    placeOrder(token: string, payload: Record<string, unknown>): Promise<any> {
        return request(
            `storefront/checkout/${encodeURIComponent(token)}/place`,
            {
                method: "POST",
                body: JSON.stringify(payload),
            }
        );
    },

    success(token: string): Promise<any> {
        return request(
            `storefront/order-success/${encodeURIComponent(token)}`
        );
    },

    initializeCsrf(): Promise<boolean> {
        return ensureCsrf();
    },
};

export default storefrontService;
