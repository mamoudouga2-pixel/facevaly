import { apiUrl } from "../config/api";

const readJson = async (response: Response): Promise<any> => {
    let data: any = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const message =
            data?.message ||
            Object.values(data?.errors || {}).flat()[0] ||
            "Request failed.";

        const error = new Error(String(message)) as Error & {
            status?: number;
            data?: any;
        };
        error.status = response.status;
        error.data = data;

        throw error;
    }

    return data;
};

const request = async (path: string): Promise<any> => {
    const response = await fetch(apiUrl(path), {
        method: "GET",
        credentials: "same-origin",
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
        },
    });

    return readJson(response);
};

const appendArray = (
    params: URLSearchParams,
    key: string,
    values: unknown[] = []
): void => {
    values.forEach((value) => {
        params.append(`${key}[]`, String(value));
    });
};

type ProductFilters = {
    q?: string;
    sort?: string;
    page?: number | string;
    per_page?: number | string;
    min_price?: number | string | null;
    max_price?: number | string | null;
    in_stock?: boolean | number | string;
    brands?: unknown[];
    flags?: unknown[];
    attributes?: Record<string, unknown[]>;
    [key: string]: unknown;
};

const buildProductQuery = (filters: ProductFilters = {}): string => {
    const params = new URLSearchParams();

    if (filters.q) params.set("q", String(filters.q));
    if (filters.sort) params.set("sort", String(filters.sort));
    if (filters.page) params.set("page", String(filters.page));
    if (filters.per_page) params.set("per_page", String(filters.per_page));

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

type CategoryOptions = {
    limit?: number | string;
    parent?: number | string | null;
};

const categoryStorefrontService = {
    categories(options: CategoryOptions = {}): Promise<any> {
        const params = new URLSearchParams();

        if (options.limit) {
            params.set("limit", String(options.limit));
        }

        if (options.parent !== undefined) {
            params.set("parent", String(options.parent));
        }

        const query = params.toString();

        return request(
            query
                ? `storefront/categories?${query}`
                : "storefront/categories"
        );
    },

    tree(): Promise<any> {
        return request("storefront/category-tree");
    },

    products(slug: string, filters: ProductFilters = {}): Promise<any> {
        const query = buildProductQuery(filters);

        return request(
            query
                ? `storefront/categories/${encodeURIComponent(slug)}/products?${query}`
                : `storefront/categories/${encodeURIComponent(slug)}/products`
        );
    },
};

export default categoryStorefrontService;
