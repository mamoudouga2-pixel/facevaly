import {
    apiUrl,
} from "../config/api";

import apiClient, {
    initializeCsrf,
} from "./apiClient";


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
            Object.values(data?.errors || {}).flat().find(Boolean) ||
            "Product could not be loaded.";

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


const productDetailService = {
    async show(slug: string): Promise<any> {
        const response = await fetch(
            apiUrl(
                `storefront/product-details/${encodeURIComponent(slug)}`
            ),
            {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            }
        );

        return readJson(response);
    },

    async submitReview(
        slug: string,
        payload: Record<string, unknown>
    ): Promise<any> {
        await initializeCsrf();

        const response = await apiClient.post(
            `/storefront/products/${encodeURIComponent(slug)}/reviews`,
            payload
        );

        return response.data;
    },
};


export default productDetailService;
