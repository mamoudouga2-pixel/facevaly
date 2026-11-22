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
            Object.values(
                data?.errors || {}
            )
                .flat()
                .find(Boolean) ||
            "Flash sale could not be loaded.";

        const error = new Error(
            String(message)
        ) as Error & {
            status?: number;
            data?: any;
        };

        error.status =
            response.status;

        error.data =
            data;

        throw error;
    }

    return data;
};

const request = async (
    path: string
): Promise<any> => {
    const response =
        await fetch(
            apiUrl(path),
            {
                method: "GET",

                credentials:
                    "same-origin",

                headers: {
                    Accept:
                        "application/json",

                    "X-Requested-With":
                        "XMLHttpRequest",
                },
            }
        );

    return readJson(
        response
    );
};

const buildQuery = (
    values: Record<string, unknown> = {}
): string => {
    const params =
        new URLSearchParams();

    Object.entries(
        values
    ).forEach(
        ([
            key,
            value,
        ]) => {
            if (
                value === undefined ||
                value === null ||
                value === ""
            ) {
                return;
            }

            params.set(
                key,
                String(value)
            );
        }
    );

    return params.toString();
};

type FlashSaleHomeParams = {
    slug?: string;
    limit?: number | string;
};

type FlashSaleProductsParams = {
    slug?: string;
    page?: number | string;
    per_page?: number | string;
};

const flashSaleService = {
    /*
    |--------------------------------------------------------------------------
    | HOME FLASH SALE
    |--------------------------------------------------------------------------
    */

    home({
        slug = "flash-sale",
        limit = 6,
    }: FlashSaleHomeParams = {}): Promise<any> {
        const query =
            buildQuery({
                slug,
                limit,
            });

        return request(
            query
                ? `storefront/flash-sale?${query}`
                : "storefront/flash-sale"
        );
    },


    /*
    |--------------------------------------------------------------------------
    | FULL FLASH SALE PRODUCT PAGE
    |--------------------------------------------------------------------------
    */

    products({
        slug = "flash-sale",
        page = 1,
        per_page = 24,
    }: FlashSaleProductsParams = {}): Promise<any> {
        const query =
            buildQuery({
                slug,
                page,
                per_page,
            });

        return request(
            `storefront/flash-sale/products?${query}`
        );
    },
};

export default flashSaleService;
