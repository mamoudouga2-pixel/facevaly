/**
 * Shared seller dashboard HTTP helper.
 * Production SPA is on facevaly.com while API is on backbone.facevaly.com —
 * credentials MUST be "include" (never "same-origin") or session cookies are dropped.
 */
import { apiUrl } from "../config/api";
import {
    ensureCsrf,
    getCsrfToken,
    rememberCsrfToken,
    resetCsrf,
} from "./csrfBootstrap";

const extractError = (data: any): string => {
    if (data?.errors && typeof data.errors === "object") {
        const first = Object.values(data.errors).flat().find(Boolean);
        if (first) return String(first);
    }
    return String(data?.message || "Request failed.");
};

export const sellerRequest = async (
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
        return sellerRequest(path, options, true);
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
        error.response = { status: response.status, data };
        throw error;
    }

    return data;
};

export default sellerRequest;
