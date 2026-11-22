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
            Object.values(data?.errors || {}).flat()[0] ||
            "Homepage could not be loaded.";

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

const homepageService = {
    show: async (): Promise<any> => {
        const response = await fetch(apiUrl("storefront/homepage"), {
            method: "GET",
            credentials: "same-origin",
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
        });

        return readJson(response);
    },
};

export default homepageService;
