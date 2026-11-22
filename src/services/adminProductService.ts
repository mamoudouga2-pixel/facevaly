import apiClient from "./apiClient";

const cleanParams = (params: any = {}): any => {
    const next: any = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) {
            return;
        }

        next[key] = value;
    });

    return next;
};

const adminProductService = {
    async list(params: any = {}): Promise<any> {
        const response = await apiClient.get("/admin/products", {
            params: cleanParams(params),
        });

        return response.data;
    },

    async show(id: any): Promise<any> {
        const response = await apiClient.get(`/admin/products/${id}`);

        return response.data;
    },

    async moderate(id: any, payload: any): Promise<any> {
        const response = await apiClient.post(
            `/admin/products/${id}/moderate`,
            payload
        );

        return response.data;
    },

    async updateDelivery(id: any, delivery_type: string): Promise<any> {
        const response = await apiClient.post(
            `/admin/products/${id}/delivery`,
            { delivery_type }
        );

        return response.data;
    },

    async bulk(payload: any): Promise<any> {
        const response = await apiClient.post(
            "/admin/products/bulk",
            payload
        );

        return response.data;
    },

    async destroy(id: any): Promise<any> {
        const response = await apiClient.delete(
            `/admin/products/${id}`
        );

        return response.data;
    },

    async restore(id: any): Promise<any> {
        const response = await apiClient.post(
            `/admin/products/${id}/restore`
        );

        return response.data;
    },
};

export default adminProductService;
