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
                    data?.errors || {}
                )
                    .flat()
                    .find(
                        Boolean
                    )
                ||
                "Products could not be loaded.";

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


type JustForYouParams = {
    page?: number | string;
    per_page?: number | string;
};

const justForYouService = {
    async products({
        page = 1,
        per_page = 18,
    }: JustForYouParams = {}): Promise<any> {
        const params =
            new URLSearchParams();

        params.set(
            "page",
            String(page)
        );

        params.set(
            "per_page",
            String(per_page)
        );

        const response =
            await fetch(
                apiUrl(
                    `storefront/just-for-you?${params.toString()}`
                ),
                {
                    method:
                        "GET",

                    credentials:
                        "same-origin",

                    cache:
                        "no-store",

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
    },
};


export default justForYouService;
