import {
    apiUrl,
} from "../config/api";


const footerService = {
    async load(): Promise<any> {
        const response =
            await fetch(
                apiUrl(
                    "storefront/footer"
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

        let data: any = {};

        try {
            data =
                await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            throw new Error(
                data?.message
                ||
                "Footer data could not be loaded."
            );
        }

        return data;
    },
};


export default footerService;
