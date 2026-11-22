import {
    apiUrl,
} from "../config/api";


let csrfReady = false;


const getCookie =
    (
        name: string
    ): string | null => {
        const cookies =
            document.cookie
                ? document.cookie.split("; ")
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

        if (!response.ok) {
            throw new Error(
                "Could not initialize CSRF protection."
            );
        }

        csrfReady =
            true;
    };


const readJson =
    async (
        response: Response
    ): Promise<any> => {
        let data = {};

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
                "Request failed.";

            throw new Error(
                message
            );
        }

        return data;
    };


const request =
    async (
        path: string,
        options: any = {}
    ): Promise<any> => {
        const method =
            String(
                options.method
                ||
                "GET"
            ).toUpperCase();

        const mutating =
            [
                "POST",
                "PATCH",
                "PUT",
                "DELETE",
            ].includes(
                method
            );

        if (
            mutating
        ) {
            await ensureCsrf();
        }

        const headers = {
            Accept:
                "application/json",

            "X-Requested-With":
                "XMLHttpRequest",

            ...(options.headers || {}),
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

        if (
            options.body
            &&
            !(
                options.body
                instanceof FormData
            )
        ) {
            headers[
                "Content-Type"
            ] =
                "application/json";
        }

        const response =
            await fetch(
                apiUrl(path),
                {
                    ...options,

                    method,
                    headers,

                    credentials:
                        "same-origin",

                    cache:
                        "no-store",
                }
            );

        if (
            response.status ===
            419
        ) {
            csrfReady =
                false;

            await ensureCsrf();

            return request(
                path,
                options
            );
        }

        return readJson(
            response
        );
    };


const homeBannerAdminService = {
    index(): Promise<any> {
        return request(
            "admin/home-banner"
        );
    },

    createSlide(
        data: any
    ): Promise<any> {
        return request(
            "admin/home-banner/slides",
            {
                method:
                    "POST",

                body:
                    data,
            }
        );
    },

    updateSlide(
        id: any,
        data: any
    ): Promise<any> {
        return request(
            `admin/home-banner/slides/${id}`,
            {
                method:
                    "POST",

                body:
                    data,
            }
        );
    },

    toggleSlide(
        id: any,
        isActive: any
    ): Promise<any> {
        return request(
            `admin/home-banner/slides/${id}/toggle`,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify({
                        is_active:
                            isActive,
                    }),
            }
        );
    },

    deleteSlide(
        id: any
    ): Promise<any> {
        return request(
            `admin/home-banner/slides/${id}`,
            {
                method:
                    "DELETE",
            }
        );
    },

    reorder(
        ids: any
    ): Promise<any> {
        return request(
            "admin/home-banner/reorder",
            {
                method:
                    "POST",

                body:
                    JSON.stringify({
                        slide_ids:
                            ids,
                    }),
            }
        );
    },

    updateSettings(
        data: any
    ): Promise<any> {
        return request(
            "admin/home-banner/settings",
            {
                method:
                    "POST",

                body:
                    data,
            }
        );
    },
};


export default homeBannerAdminService;
