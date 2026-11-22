import {
    apiUrl,
} from "../config/api";


let csrfReady =
    false;


/*
|--------------------------------------------------------------------------
| COOKIE
|--------------------------------------------------------------------------
*/

const getCookie = (
    name: string
): string | null => {
    const cookies =
        document.cookie
            ? document.cookie
                .split("; ")
            : [];

    for (
        const cookie
        of cookies
    ) {
        const [
            key,
            ...parts
        ] =
            cookie.split("=");

        if (
            key === name
        ) {
            return decodeURIComponent(
                parts.join("=")
            );
        }
    }

    return null;
};


/*
|--------------------------------------------------------------------------
| CSRF
|--------------------------------------------------------------------------
*/

const ensureCsrf =
    async (): Promise<void> => {
        if (
            csrfReady
            &&
            getCookie(
                "XSRF-TOKEN"
            )
        ) {
            return;
        }

        const response =
            await fetch(
                "/sanctum/csrf-cookie",
                {
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


        if (
            !response.ok
        ) {
            throw new Error(
                "Could not initialize CSRF protection."
            );
        }


        csrfReady =
            true;
    };


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
                await response
                    .json();
        } catch {
            data = {};
        }


        if (
            !response.ok
        ) {
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
                "Store request failed.";


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
| REQUEST
|--------------------------------------------------------------------------
*/

const request =
    async (
        path: string,
        options: RequestInit & {
            headers?: Record<string, string>;
        } = {}
    ): Promise<any> => {
        const method =
            String(
                options.method
                ||
                "GET"
            )
                .toUpperCase();


        const mutating =
            [
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
            ]
                .includes(
                    method
                );


        if (
            mutating
        ) {
            await ensureCsrf();
        }


        const headers: Record<string, string> = {
            Accept:
                "application/json",

            "X-Requested-With":
                "XMLHttpRequest",

            ...(options.headers
                ||
                {}),
        };


        if (
            mutating
        ) {
            const token =
                getCookie(
                    "XSRF-TOKEN"
                );


            if (
                token
            ) {
                headers[
                    "X-XSRF-TOKEN"
                ] =
                    token;
            }
        }


        const response =
            await fetch(
                apiUrl(
                    path
                ),
                {
                    ...options,

                    method,

                    credentials:
                        "same-origin",

                    cache:
                        "no-store",

                    headers,
                }
            );


        return readJson(
            response
        );
    };


/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

type StoreShowOptions = {
    page?: number | string;
    per_page?: number | string;
    q?: string;
};

const vendorStoreService = {
    show(
        slug: string,
        {
            page = 1,
            per_page = 20,
            q = "",
        }: StoreShowOptions = {}
    ): Promise<any> {
        const params =
            new URLSearchParams();

        params.set(
            "page",
            String(
                page
            )
        );

        params.set(
            "per_page",
            String(
                per_page
            )
        );

        if (
            q
        ) {
            params.set(
                "q",
                q
            );
        }


        return request(
            `storefront/stores/${encodeURIComponent(
                slug
            )}?${params.toString()}`
        );
    },


    follow(
        slug: string
    ): Promise<any> {
        return request(
            `storefront/stores/${encodeURIComponent(
                slug
            )}/follow`,
            {
                method:
                    "POST",
            }
        );
    },


    unfollow(
        slug: string
    ): Promise<any> {
        return request(
            `storefront/stores/${encodeURIComponent(
                slug
            )}/follow`,
            {
                method:
                    "DELETE",
            }
        );
    },
};


export default vendorStoreService;
