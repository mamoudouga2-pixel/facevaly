import {
    apiUrl,
} from "../config/api";


const readJson =
    async (
        response: Response
    ): Promise<any> => {
        let data: any = {};

        try {
            data =
                await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            const message =
                data?.message
                ||
                Object.values(
                    data?.errors
                    ||
                    {}
                )
                    .flat()
                    .find(
                        Boolean
                    )
                ||
                "Search request failed.";

            const error =
                new Error(
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


const get =
    async (
        path: string,
        signal?: AbortSignal
    ): Promise<any> => {
        const response =
            await fetch(
                apiUrl(path),
                {
                    method:
                        "GET",

                    credentials:
                        "same-origin",

                    cache:
                        "no-store",

                    signal,

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


type SearchResultsParams = {
    q?: string;
    brand?: string;
    category?: string;
    page?: number | string;
    per_page?: number | string;
};

const searchService = {
    suggestions(
        query: string,
        signal?: AbortSignal
    ): Promise<any> {
        const params =
            new URLSearchParams();

        params.set(
            "q",
            query
        );

        return get(
            `storefront/search/suggestions?${params.toString()}`,
            signal
        );
    },


    results({
        q = "",
        brand = "",
        category = "",
        page = 1,
        per_page = 20,
    }: SearchResultsParams = {}): Promise<any> {
        const params =
            new URLSearchParams();

        if (q) {
            params.set(
                "q",
                q
            );
        }

        if (brand) {
            params.set(
                "brand",
                brand
            );
        }

        if (category) {
            params.set(
                "category",
                category
            );
        }

        params.set(
            "page",
            String(page)
        );

        params.set(
            "per_page",
            String(per_page)
        );

        return get(
            `storefront/search?${params.toString()}`
        );
    },
};


export default searchService;
