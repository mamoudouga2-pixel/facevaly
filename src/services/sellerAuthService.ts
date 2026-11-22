import apiClient, {
    initializeCsrf,
} from "./apiClient";


const sellerAuthService = {

    /* =====================================================
       LOGIN
    ===================================================== */

    async login(payload: Record<string, unknown>): Promise<any> {
        /*
         * Fresh CSRF cookie/token
         */
        await initializeCsrf();

        const response =
            await apiClient.post(
                "/seller/login",
                payload,
                {
                    headers: {
                        Accept:
                            "application/json",
                    },
                }
            );

        return response.data;
    },


    /* =====================================================
       CURRENT SELLER
    ===================================================== */

    async me(): Promise<any> {
        /*
         * Timestamp prevents any accidental cached
         * authentication response.
         *
         * 401/403 are expected when no seller session exists;
         * treat them as a normal logged-out state (no axios error).
         */
        const response =
            await apiClient.get(
                "/seller/me",
                {
                    params: {
                        _seller_auth_check:
                            Date.now(),
                    },

                    headers: {
                        Accept:
                            "application/json",

                        "Cache-Control":
                            "no-cache",

                        Pragma:
                            "no-cache",
                    },

                    validateStatus:
                        (status: number) =>
                            (
                                status >= 200
                                && status < 300
                            )
                            || status === 401
                            || status === 403,
                }
            );

        if (
            response.status === 401
            || response.status === 403
        ) {
            return null;
        }

        return response.data;
    },


    /* =====================================================
       DASHBOARD
    ===================================================== */

    async dashboard(): Promise<any> {
        const response =
            await apiClient.get(
                "/seller/dashboard",
                {
                    headers: {
                        Accept:
                            "application/json",
                    },
                }
            );

        return response.data;
    },


    /* =====================================================
       LOGOUT
    ===================================================== */

    async logout(): Promise<any> {
        /*
         * IMPORTANT:
         * Login-এর মতো logout-এর আগেও CSRF refresh.
         *
         * তোমার পুরোনো code-এ এটা ছিল না।
         */
        await initializeCsrf();

        const response =
            await apiClient.post(
                "/seller/logout",
                {},
                {
                    headers: {
                        Accept:
                            "application/json",

                        "Cache-Control":
                            "no-cache",
                    },
                }
            );

        return response.data;
    },


    /* =====================================================
       FORGOT PASSWORD
    ===================================================== */

    async forgotPasswordRequest(payload: Record<string, unknown>): Promise<any> {
        await initializeCsrf();
        const response = await apiClient.post(
            "/seller/forgot-password/request",
            payload,
            { headers: { Accept: "application/json" } }
        );
        return response.data;
    },

    async forgotPasswordVerifyOtp(payload: Record<string, unknown>): Promise<any> {
        await initializeCsrf();
        const response = await apiClient.post(
            "/seller/forgot-password/verify-otp",
            payload,
            { headers: { Accept: "application/json" } }
        );
        return response.data;
    },

    async forgotPasswordReset(payload: Record<string, unknown>): Promise<any> {
        await initializeCsrf();
        const response = await apiClient.post(
            "/seller/forgot-password/reset",
            payload,
            { headers: { Accept: "application/json" } }
        );
        return response.data;
    },
};


export default sellerAuthService;
