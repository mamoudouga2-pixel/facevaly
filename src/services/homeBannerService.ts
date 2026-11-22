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
                "Home banner could not be loaded.";

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


const homeBannerService = {
    async show(): Promise<any> {
        const response =
            await fetch(
                apiUrl(
                    "storefront/home-banner"
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


export default homeBannerService;
