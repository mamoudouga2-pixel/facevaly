import { apiUrl } from "../config/api";
import {
    ensureCsrf as ensureSharedCsrf,
    getCsrfToken,
    rememberCsrfToken,
    resetCsrf,
} from "./csrfBootstrap";

const ensureCsrf = async (force = false): Promise<void> => {
    await ensureSharedCsrf(force);
};

const extractError = (data: any): any => {
    if (data?.errors && typeof data.errors === "object") {
        const first = Object.values(data.errors).flat()[0];
        if (first) return first;
    }

    return data?.message || "Request failed.";
};

const request = async (
    path: string,
    options: RequestInit = {},
    retried = false
): Promise<any> => {
    const method = String(options.method || "GET").toUpperCase();
    const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (mutating) {
        await ensureCsrf(true);
    }

    const headers: Record<string, string> = {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...((options.headers as Record<string, string>) || {}),
    };

    // Optional: useful if one user belongs to more than one vendor.
    const vendorId = window.localStorage.getItem("seller_vendor_id");
    if (vendorId) {
        headers["X-Vendor-ID"] = vendorId;
    }

    if (options.body !== undefined && !(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    if (mutating) {
        const token = getCsrfToken();
        if (token) {
            headers["X-XSRF-TOKEN"] = token;
        }
    }

    const response = await fetch(apiUrl(path), {
        ...options,
        method,
        headers,
        credentials: "include",
        cache: "no-store",
    });

    rememberCsrfToken(
        response.headers.get("X-XSRF-TOKEN")
        || response.headers.get("x-xsrf-token")
    );

    if (response.status === 419 && !retried) {
        resetCsrf();
        await ensureCsrf(true);
        return request(path, options, true);
    }

    let data: any = {};
    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        const error: any = new Error(extractError(data));
        error.status = response.status;
        error.data = data;
        throw error;
    }

    return data;
};

const queryString = (values: Record<string, any> = {}): string => {
    const params = new URLSearchParams();

    Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, value);
        }
    });

    return params.toString();
};

const sellerOrderService = {
    list(filters: Record<string, any> = {}): Promise<any> {
        const query = queryString(filters);
        return request(query ? `seller/orders?${query}` : "seller/orders");
    },

    show(id: string | number): Promise<any> {
        return request(`seller/orders/${id}`);
    },

    products(search = ""): Promise<any> {
        const query = queryString({ q: search });
        return request(query ? `seller/orders/products/search?${query}` : "seller/orders/products/search");
    },

    create(payload: any): Promise<any> {
        return request("seller/orders", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    update(id: string | number, payload: any): Promise<any> {
        return request(`seller/orders/${id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    updateStatus(id: string | number, status: any, message = ""): Promise<any> {
        return request(`seller/orders/${id}/status`, {
            method: "POST",
            body: JSON.stringify({ status, message }),
        });
    },

    addNote(id: string | number, note: any, type = "internal"): Promise<any> {
        return request(`seller/orders/${id}/notes`, {
            method: "POST",
            body: JSON.stringify({ note, type }),
        });
    },

    blockCustomer(id: string | number, type = "phone", reason = ""): Promise<any> {
        return request(`seller/orders/${id}/block`, {
            method: "POST",
            body: JSON.stringify({ type, reason }),
        });
    },

    bulkAction(payload: any): Promise<any> {
        return request("seller/orders/bulk-action", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    destroy(id: string | number): Promise<any> {
        return request(`seller/orders/${id}`, {
            method: "DELETE",
        });
    },

    restore(id: string | number): Promise<any> {
        return request(`seller/orders/${id}/restore`, {
            method: "POST",
            body: JSON.stringify({}),
        });
    },

    courierAccounts(): Promise<any> {
        return request("seller/orders/courier-accounts");
    },

    sendCourier(id: string | number, courierAccountId: any = null): Promise<any> {
        return request(`seller/orders/${id}/courier`, {
            method: "POST",
            body: JSON.stringify({
                courier_account_id: courierAccountId || null,
            }),
        });
    },

    courierDetails(id: string | number): Promise<any> {
        return request(`seller/orders/${id}/courier`);
    },

    fraudCheck(phone: any, vendorOrderId: any = null, force = false): Promise<any> {
        return request("seller/orders/intelligence/fraud-check", {
            method: "POST",
            body: JSON.stringify({
                phone,
                vendor_order_id: vendorOrderId,
                force,
            }),
        });
    },

    customerCheck(phone: any, excludeVendorOrderId: any = null): Promise<any> {
        return request("seller/orders/intelligence/customer-check", {
            method: "POST",
            body: JSON.stringify({
                phone,
                exclude_vendor_order_id: excludeVendorOrderId,
            }),
        });
    },

    districts(): Promise<any> {
        return request("seller/orders/intelligence/districts");
    },

    upazilas(district: any): Promise<any> {
        const query = queryString({ district });
        return request(`seller/orders/intelligence/upazilas?${query}`);
    },

    bdCourierConnection(): Promise<any> {
        return request("seller/orders/intelligence/bd-courier/connection");
    },

    bdCourierPlan(): Promise<any> {
        return request("seller/orders/intelligence/bd-courier/plan");
    },
};

export default sellerOrderService;
