import apiClient from "./apiClient";
import { ensureCsrf } from "./csrfBootstrap";

const customerAccountService = {
    async orders(params: Record<string, unknown> = {}): Promise<any> {
        const response = await apiClient.get(
            "/storefront/account/orders",
            { params }
        );
        return response.data;
    },

    async wishlist(): Promise<any> {
        const response = await apiClient.get(
            "/storefront/account/wishlist"
        );
        return response.data;
    },

    async addToWishlist(productId: string | number): Promise<any> {
        await ensureCsrf();
        const response = await apiClient.post(
            `/storefront/account/wishlist/${productId}`,
            {}
        );
        return response.data;
    },

    async removeFromWishlist(productId: string | number): Promise<any> {
        await ensureCsrf();
        const response = await apiClient.delete(
            `/storefront/account/wishlist/${productId}`
        );
        return response.data;
    },

    async settings(): Promise<any> {
        const response = await apiClient.get(
            "/storefront/account/settings"
        );
        return response.data;
    },

    async updateSettings(payload: Record<string, unknown>): Promise<any> {
        await ensureCsrf();
        const response = await apiClient.put(
            "/storefront/account/settings",
            payload
        );
        return response.data;
    },

    async addresses(): Promise<any> {
        const response = await apiClient.get(
            "/storefront/account/addresses"
        );
        return response.data;
    },

    async createAddress(payload: Record<string, unknown>): Promise<any> {
        await ensureCsrf();
        const response = await apiClient.post(
            "/storefront/account/addresses",
            payload
        );
        return response.data;
    },

    async updateAddress(
        addressId: string | number,
        payload: Record<string, unknown>
    ): Promise<any> {
        await ensureCsrf();
        const response = await apiClient.put(
            `/storefront/account/addresses/${addressId}`,
            payload
        );
        return response.data;
    },

    async deleteAddress(addressId: string | number): Promise<any> {
        await ensureCsrf();
        const response = await apiClient.delete(
            `/storefront/account/addresses/${addressId}`
        );
        return response.data;
    },

    async vouchers(): Promise<any> {
        const response = await apiClient.get(
            "/storefront/account/vouchers"
        );
        return response.data;
    },
};

export default customerAccountService;
