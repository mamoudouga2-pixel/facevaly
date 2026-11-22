import apiClient from "./apiClient";

const adminOrderService = {
    async list(params: any = {}): Promise<any> {
        const response = await apiClient.get("/admin/orders", {
            params,
        });

        return response.data;
    },

    async show(id: any): Promise<any> {
        const response = await apiClient.get(`/admin/orders/${id}`);

        return response.data;
    },

    async products(term: any = "", vendorId: any = ""): Promise<any> {
        const response = await apiClient.get("/admin/orders/products", {
            params: {
                q: term,
                vendor_id: vendorId,
            },
        });

        return response.data;
    },

    async create(payload: any): Promise<any> {
        const response = await apiClient.post("/admin/orders", payload);

        return response.data;
    },

    async update(id: any, payload: any): Promise<any> {
        const response = await apiClient.put(
            `/admin/orders/${id}`,
            payload
        );

        return response.data;
    },

    async updateStatus(
        id: any,
        status: any,
        message: any = null,
        options: any = {}
    ): Promise<any> {
        const payload: Record<string, any> = {
            status,
            message,
        };

        if (options?.auto_courier != null) {
            payload.auto_courier = Boolean(options.auto_courier);
        }
        if (options?.send_courier != null) {
            payload.send_courier = Boolean(options.send_courier);
        }
        if (options?.courier_account_id) {
            payload.courier_account_id = Number(options.courier_account_id);
        }

        const response = await apiClient.patch(
            `/admin/orders/${id}/status`,
            payload
        );

        return response.data;
    },

    async addNote(id: any, note: any): Promise<any> {
        const response = await apiClient.post(
            `/admin/orders/${id}/notes`,
            {
                note,
                type: "internal",
                is_pinned: false,
            }
        );

        return response.data;
    },

    async fraudCheck(phone: any, orderId: any = null, force = false, vendorId: any = null): Promise<any> {
        const response = await apiClient.post(
            "/admin/orders/fraud-check",
            {
                phone,
                vendor_order_id: orderId,
                vendor_id: vendorId,
                force,
            }
        );

        return response.data;
    },

    async customerCheck(
        phone: any,
        excludeVendorOrderId: any = null,
        vendorId: any = null
    ): Promise<any> {
        const response = await apiClient.post(
            "/admin/orders/customer-check",
            {
                phone,
                exclude_vendor_order_id: excludeVendorOrderId,
                vendor_id: vendorId,
            }
        );

        return response.data;
    },

    async blockCustomer(id: any, type: any = "phone", reason: any = null): Promise<any> {
        const response = await apiClient.post(
            `/admin/orders/${id}/block-customer`,
            {
                type,
                reason,
            }
        );

        return response.data;
    },

    async bulkAction(payload: any): Promise<any> {
        const response = await apiClient.post(
            "/admin/orders/bulk",
            payload
        );

        return response.data;
    },

    async districts(): Promise<any> {
        const response = await apiClient.get(
            "/admin/orders/districts"
        );

        return response.data;
    },

    async upazilas(district: any): Promise<any> {
        const response = await apiClient.get(
            "/admin/orders/upazilas",
            {
                params: {
                    district,
                },
            }
        );

        return response.data;
    },

    async courierAccounts(vendorId: any = null): Promise<any> {
        const response = await apiClient.get(
            "/admin/orders/courier-accounts",
            {
                params: vendorId
                    ? {
                          vendor_id: vendorId,
                      }
                    : {},
            }
        );

        return response.data;
    },

    async sendCourier(id: any, courierAccountId: any = null): Promise<any> {
        const response = await apiClient.post(
            `/admin/orders/${id}/courier`,
            {
                courier_account_id: courierAccountId,
            }
        );

        return response.data;
    },

    async courierDetails(id: any): Promise<any> {
        const response = await apiClient.get(
            `/admin/orders/${id}/courier`
        );

        return response.data;
    },

    async destroy(id: any): Promise<any> {
        const response = await apiClient.delete(
            `/admin/orders/${id}`
        );

        return response.data;
    },

    async restore(id: any): Promise<any> {
        const response = await apiClient.post(
            `/admin/orders/${id}/restore`
        );

        return response.data;
    },
};

export default adminOrderService;
