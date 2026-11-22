import {
    apiUrl,
} from "../config/api";


/*
|--------------------------------------------------------------------------
| READ JSON
|--------------------------------------------------------------------------
*/

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
                    .find(Boolean)
                ||
                "Categories could not be loaded.";

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


/*
|--------------------------------------------------------------------------
| MOBILE CATEGORY SERVICE
|--------------------------------------------------------------------------
*/

const mobileCategoryService = {
    async menu(): Promise<any> {
        const response =
            await fetch(
                apiUrl(
                    "storefront/mobile-category-menu"
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


export default mobileCategoryService;
