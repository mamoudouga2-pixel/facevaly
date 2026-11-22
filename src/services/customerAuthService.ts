import apiClient from "./apiClient";
import { ensureCsrf } from "./csrfBootstrap";

const customerAuthService = {
    async register(payload: Record<string, unknown>): Promise<any> {
        await ensureCsrf(true);
        const response = await apiClient.post(
            "/storefront/auth/register",
            payload
        );
        return response.data;
    },

    async login(payload: Record<string, unknown>): Promise<any> {
        await ensureCsrf(true);
        const response = await apiClient.post(
            "/storefront/auth/login",
            payload
        );
        return response.data;
    },

    async me(): Promise<any> {
        const response = await apiClient.get(
            "/storefront/auth/me",
            {
                params: {
                    _account_auth_check: Date.now(),
                },
                validateStatus: (status: number) =>
                    (status >= 200 && status < 300)
                    || status === 401
                    || status === 403,
            }
        );

        if (response.status === 401 || response.status === 403) {
            const error = new Error("Unauthenticated.") as Error & {
                status?: number;
                response?: typeof response;
            };
            error.status = response.status;
            error.response = response;
            throw error;
        }

        return response.data;
    },

    async logout(): Promise<any> {
        await ensureCsrf(true);
        const response = await apiClient.post(
            "/storefront/auth/logout",
            {}
        );
        return response.data;
    },
};

export default customerAuthService;
