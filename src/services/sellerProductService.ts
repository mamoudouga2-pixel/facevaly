import { apiUrl } from "../config/api";
import {
    ensureCsrf as ensureSharedCsrf,
    getCsrfToken,
    rememberCsrfToken,
    resetCsrf,
} from "./csrfBootstrap";

const ensureCsrf = async (force = false): Promise<void> => {
    await ensureSharedCsrf(force);
};


/* ========================================================================
   ERROR HANDLING
======================================================================== */

const extractError = (data: any): any => {
    if (
        data?.errors &&
        typeof data.errors === "object"
    ) {
        const first =
            Object.values(
                data.errors
            )
                .flat()
                .find(Boolean);

        if (first) {
            return first;
        }
    }

    return (
        data?.message ||
        "Request failed."
    );
};


/* ========================================================================
   API REQUEST
======================================================================== */

const request = async (
    path: string,
    options: RequestInit = {},
    retried = false
): Promise<any> => {
    const method =
        String(
            options.method ||
            "GET"
        ).toUpperCase();

    const mutating =
        [
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
        ].includes(method);

    if (mutating) {
        await ensureCsrf(true);
    }

    const headers: Record<string, string> = {
        Accept: "application/json",

        "X-Requested-With":
            "XMLHttpRequest",

        ...((options.headers as Record<string, string>) || {}),
    };

    const vendorId =
        window.localStorage.getItem(
            "seller_vendor_id"
        );

    if (vendorId) {
        headers["X-Vendor-ID"] =
            vendorId;
    }

    if (mutating) {
        const xsrf = getCsrfToken();

        if (xsrf) {
            headers[
                "X-XSRF-TOKEN"
            ] = xsrf;
        }
    }

    if (
        options.body !==
            undefined &&
        !(
            options.body
            instanceof FormData
        )
    ) {
        headers[
            "Content-Type"
        ] = "application/json";
    }

    const response =
        await fetch(
            apiUrl(path),
            {
                ...options,

                method,
                headers,

                credentials:
                    "include",

                /*
                 * The Edit page must read the DB state after a save.
                 * This prevents a cached GET from making Offer / Flag toggles
                 * look as if the update failed.
                 */
                cache: "no-store",
            }
        );

    rememberCsrfToken(
        response.headers.get("X-XSRF-TOKEN")
        || response.headers.get("x-xsrf-token")
    );

    if (
        response.status === 419 &&
        !retried
    ) {
        resetCsrf();

        await ensureCsrf(
            true
        );

        return request(
            path,
            options,
            true
        );
    }

    let data: any = {};

    try {
        data =
            await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const error: any =
            new Error(
                extractError(
                    data
                )
            );

        error.status =
            response.status;

        error.data =
            data;

        throw error;
    }

    return data;
};


/* ========================================================================
   QUERY STRING
======================================================================== */

const queryString = (
    values: Record<string, any> = {}
): string => {
    const search =
        new URLSearchParams();

    Object.entries(
        values
    ).forEach(
        ([
            key,
            value,
        ]) => {
            if (
                value !==
                    undefined &&
                value !==
                    null &&
                value !==
                    ""
            ) {
                search.set(
                    key,
                    value
                );
            }
        }
    );

    return search.toString();
};


/* ========================================================================
   VALUE NORMALIZATION
======================================================================== */

const appendBoolean = (
    data: FormData,
    key: string,
    value: any
): void => {
    data.append(
        key,
        value
            ? "1"
            : "0"
    );
};


const numericOr = (
    value: any,
    fallback = 0
): number => {
    if (
        value === "" ||
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : fallback;
};


const normalizeVariants = (
    variants: any[] = []
): any[] =>
    variants.map(
        (variant: any) => ({
            ...variant,

            discount_type:
                variant?.discount_type ||
                "flat",

            discount_value:
                numericOr(
                    variant?.discount_value,
                    0
                ),

            stock_quantity:
                numericOr(
                    variant?.stock_quantity,
                    0
                ),

            stock_alert_quantity:
                numericOr(
                    variant?.stock_alert_quantity,
                    0
                ),
        })
    );


const normalizeIdArray = (
    values: any[] = []
): number[] =>
    Array.from(
        new Set(
            (values || [])
                .map(Number)
                .filter(
                    (id: number) =>
                        Number.isInteger(
                            id
                        ) &&
                        id > 0
                )
        )
    );


/* ========================================================================
   PRODUCT FORM DATA
======================================================================== */

const buildProductFormData = (
    form: any,
    action: string
): FormData => {
    const data =
        new FormData();

    data.append(
        "action",
        action
    );

    data.append(
        "name",
        form.name || ""
    );

    data.append(
        "sku",
        form.sku || ""
    );

    data.append(
        "slug",
        form.slug || ""
    );

    data.append(
        "barcode",
        form.barcode || ""
    );

    data.append(
        "brand_id",
        form.brand_id || ""
    );

    data.append(
        "brand_name",
        form.brand_name || ""
    );

    data.append(
        "unit_id",
        form.unit_id || ""
    );

    data.append(
        "unit_value",
        form.unit_value ?? 1
    );

    data.append(
        "weight_unit_id",
        form.weight_unit_id || ""
    );

    data.append(
        "weight_value",
        form.weight_value ?? ""
    );

    appendBoolean(
        data,
        "is_published",
        action === "publish"
    );

    appendBoolean(
        data,
        "pre_order_enabled",
        form.pre_order_enabled
    );

    data.append(
        "pre_order_message",
        form.pre_order_message || ""
    );

    data.append(
        "video_embed",
        form.video_embed || ""
    );

    data.append(
        "video_position",
        form.video_position || ""
    );

    appendBoolean(
        data,
        "track_stock",
        form.track_stock
    );

    data.append(
        "stock_alert_quantity",
        form.stock_alert_quantity ??
            0
    );

    data.append(
        "stock_quantity",
        form.stock_quantity ?? 0
    );

    data.append(
        "condition",
        form.condition || "new"
    );

    data.append(
        "availability",
        form.availability ||
            "in_stock"
    );

    data.append(
        "regular_price",
        form.regular_price ?? ""
    );

    data.append(
        "discount_type",
        form.discount_type ||
            "flat"
    );

    data.append(
        "discount_value",
        String(
            numericOr(
                form.discount_value,
                0
            )
        )
    );

    appendBoolean(
        data,
        "has_variants",
        form.has_variants
    );

    data.append(
        "short_description",
        form.description || form.short_description || ""
    );

    data.append(
        "long_description",
        form.description || form.long_description || ""
    );

    data.append(
        "description",
        form.description || form.long_description || ""
    );

    data.append(
        "delivery_type",
        form.delivery_type ||
            "rate_by_weight"
    );

    appendBoolean(
        data,
        "is_digital",
        false
    );

    data.append(
        "download_limit",
        ""
    );

    data.append(
        "download_expiry_days",
        ""
    );

    appendBoolean(
        data,
        "seo_enabled",
        false
    );

    data.append(
        "meta_title",
        ""
    );

    data.append(
        "meta_keywords",
        ""
    );

    data.append(
        "meta_description",
        ""
    );

    data.append(
        "canonical_url",
        ""
    );


    /*
    |--------------------------------------------------------------------------
    | CATEGORY / FLAG / OFFER ARRAYS
    |--------------------------------------------------------------------------
    |
    | These are the fields involved in your current issue.
    | Always normalize them to positive integer IDs before FormData.
    |
    */

    normalizeIdArray(
        form.category_ids
    ).forEach((id) => {
        data.append(
            "category_ids[]",
            String(id)
        );
    });

    data.append(
        "variants",
        JSON.stringify(
            normalizeVariants(
                form.variants || []
            )
        )
    );

    data.append(
        "remove_image_slots",
        JSON.stringify(
            form.remove_image_slots ||
                []
        )
    );

    data.append(
        "remove_digital_file_ids",
        JSON.stringify([])
    );


    Object.entries(
        form.image_files || {}
    ).forEach(
        ([
            slot,
            file,
        ]) => {
            if (
                file instanceof
                File
            ) {
                data.append(
                    `images[${slot}]`,
                    file
                );
            }
        }
    );


    Object.entries(
        form.variant_image_files ||
            {}
    ).forEach(
        ([
            index,
            file,
        ]) => {
            if (
                file instanceof
                File
            ) {
                data.append(
                    `variant_images[${index}]`,
                    file
                );
            }
        }
    );


    (
        form.digital_file_uploads ||
        []
    ).forEach(
        (file) => {
            if (
                file instanceof
                File
            ) {
                data.append(
                    "digital_files[]",
                    file
                );
            }
        }
    );

    return data;
};


const hasProductUploadFiles = (form: any = {}): boolean => {
    const imageFiles = Object.values(form.image_files || {});
    const variantFiles = Object.values(form.variant_image_files || {});
    const digitalFiles = form.digital_file_uploads || [];

    return (
        imageFiles.some((file) => file instanceof File)
        || variantFiles.some((file) => file instanceof File)
        || digitalFiles.some((file: any) => file instanceof File)
    );
};


const buildProductJsonPayload = (
    form: any,
    action: string
): Record<string, any> => ({
    action,
    name: form.name || "",
    sku: form.sku || "",
    slug: form.slug || "",
    barcode: form.barcode || "",
    brand_id: form.brand_id || "",
    brand_name: form.brand_name || "",
    unit_id: form.unit_id || "",
    unit_value: form.unit_value ?? 1,
    weight_unit_id: form.weight_unit_id || "",
    weight_value: form.weight_value ?? "",
    is_published: action === "publish",
    pre_order_enabled: Boolean(form.pre_order_enabled),
    pre_order_message: form.pre_order_message || "",
    video_embed: form.video_embed || "",
    video_position: form.video_position || "",
    track_stock: Boolean(form.track_stock),
    stock_alert_quantity: form.stock_alert_quantity ?? 0,
    stock_quantity: form.stock_quantity ?? 0,
    condition: form.condition || "new",
    availability: form.availability || "in_stock",
    regular_price: form.regular_price ?? "",
    discount_type: form.discount_type || "flat",
    discount_value: numericOr(form.discount_value, 0),
    has_variants: Boolean(form.has_variants),
    short_description: form.description || form.short_description || "",
    long_description: form.description || form.long_description || "",
    description: form.description || form.long_description || "",
    delivery_type: form.delivery_type || "rate_by_weight",
    is_digital: false,
    download_limit: "",
    download_expiry_days: "",
    seo_enabled: false,
    meta_title: "",
    meta_keywords: "",
    meta_description: "",
    canonical_url: "",
    category_ids: normalizeIdArray(form.category_ids),
    flag_ids: [],
    offer_ids: [],
    variants: normalizeVariants(form.variants || []),
    remove_image_slots: form.remove_image_slots || [],
    remove_digital_file_ids: [],
});


/* ========================================================================
   SERVICE
======================================================================== */

const sellerProductService = {
    list(
        filters: Record<string, any> = {}
    ): Promise<any> {
        const query =
            queryString(
                filters
            );

        return request(
            query
                ? `seller/products?${query}`
                : "seller/products"
        );
    },


    formOptions(): Promise<any> {
        return request(
            "seller/products/form-options"
        );
    },


    /*
     * `options.fresh` is accepted for readability at the call site.
     * request() itself already uses fetch cache: "no-store".
     */
    show(
        id: string | number,
        options: Record<string, any> = {}
    ): Promise<any> {
        void options;

        return request(
            `seller/products/${Number(
                id
            )}`
        );
    },


    create(
        form: any,
        action = "draft"
    ): Promise<any> {
        if (hasProductUploadFiles(form)) {
            return request(
                "seller/products",
                {
                    method: "POST",
                    body: buildProductFormData(form, action),
                }
            );
        }

        return request(
            "seller/products",
            {
                method: "POST",
                body: JSON.stringify(
                    buildProductJsonPayload(form, action)
                ),
            }
        );
    },


    update(
        id: string | number,
        form: any,
        action = "draft"
    ): Promise<any> {
        if (hasProductUploadFiles(form)) {
            return request(
                `seller/products/${Number(id)}`,
                {
                    method: "POST",
                    body: buildProductFormData(form, action),
                }
            );
        }

        return request(
            `seller/products/${Number(id)}`,
            {
                method: "POST",
                body: JSON.stringify(
                    buildProductJsonPayload(form, action)
                ),
            }
        );
    },


    toggle(
        id: string | number,
        field: string,
        value: any
    ): Promise<any> {
        return request(
            `seller/products/${Number(
                id
            )}/toggle`,
            {
                method: "PATCH",

                body:
                    JSON.stringify({
                        field,
                        value,
                    }),
            }
        );
    },


    destroy(id: string | number): Promise<any> {
        return request(
            `seller/products/${Number(
                id
            )}`,
            {
                method: "DELETE",
            }
        );
    },


    restore(id: string | number): Promise<any> {
        return request(
            `seller/products/${Number(
                id
            )}/restore`,
            {
                method: "POST",

                body:
                    JSON.stringify(
                        {}
                    ),
            }
        );
    },
};

export default sellerProductService;
