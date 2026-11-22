import apiClient from "./apiClient";

export const sellerRegistrationService = {
    requestOtp(payload: Record<string, unknown>): Promise<any> {
        return apiClient
            .post("/seller-registration/request-otp", payload)
            .then((response) => response.data);
    },

    verifyOtp(payload: Record<string, unknown>): Promise<any> {
        return apiClient
            .post("/seller-registration/verify-otp", payload)
            .then((response) => response.data);
    },

    complete(payload: Record<string, unknown>): Promise<any> {
        return apiClient
            .post("/seller-registration/complete", payload)
            .then((response) => response.data);
    },
};

export default sellerRegistrationService;
