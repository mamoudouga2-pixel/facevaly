/*
|--------------------------------------------------------------------------
| FACEVALY ADMIN API SERVICE
|--------------------------------------------------------------------------
|
| Session-cookie / Sanctum compatible.
|
*/

import {
    API_BASE_URL,
} from "../config/api";
import {
    ensureCsrf as ensureSharedCsrf,
    getCsrfToken,
    rememberCsrfToken,
    resetCsrf,
} from "./csrfBootstrap";

const apiUrl = (path: string = ""): string => {
    return `${API_BASE_URL.replace(/\/+$/, "")}/${String(path).replace(/^\/+/, "")}`;
};


async function ensureCsrf(force = false): Promise<void> {
    await ensureSharedCsrf(force);
}


function queryString(filters: any = {}): string {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
        if (
            value === undefined
            || value === null
            || value === ""
        ) {
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item) => params.append(`${key}[]`, String(item)));
            return;
        }

        params.set(key, String(value));
    });

    return params.toString();
}


async function request(
    path: string,
    options: any = {},
    csrfRetried = false
): Promise<any> {
    const method =
        String(options.method || "GET").toUpperCase();

    if (
        !["GET", "HEAD", "OPTIONS"].includes(method)
    ) {
        // Reuse an existing CSRF token when possible. Forcing a fresh
        // /sanctum/csrf-cookie on every mutation used to clear the session
        // cookie and intermittently logged admins out.
        await ensureCsrf(false);
    }

    const headers = new Headers(options.headers || {});

    headers.set("Accept", "application/json");
    headers.set("X-Requested-With", "XMLHttpRequest");

    // Prefer in-memory token from X-XSRF-TOKEN (cross-origin safe).
    // Never rely on document.cookie alone — duplicates/stale jars break login.
    const token = getCsrfToken();

    if (token) {
        headers.set("X-XSRF-TOKEN", token);
    }

    const body = options.body;

    if (
        body
        && !(body instanceof FormData)
        && !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(
        apiUrl(path),
        {
            ...options,
            method,
            headers,
            credentials: "include",
            cache: "no-store",
        }
    );

    rememberCsrfToken(
        response.headers.get("X-XSRF-TOKEN")
        || response.headers.get("x-xsrf-token")
    );

    /*
    |--------------------------------------------------------------------------
    | ONE-TIME 419 / CSRF RECOVERY
    |--------------------------------------------------------------------------
    |
    | Backend heals duplicate cookies on 419; refresh CSRF and replay once.
    |
    */

    if (
        response.status === 419
        && !csrfRetried
        && !["GET", "HEAD", "OPTIONS"].includes(method)
    ) {
        resetCsrf();
        await ensureCsrf(true);

        return request(
            path,
            options,
            true
        );
    }


    const contentType =
        response.headers.get("content-type") || "";

    const payload =
        contentType.includes("application/json")
            ? await response.json()
            : {
                message: await response.text(),
            };

    if (!response.ok) {
        let message =
            payload?.message
            || `Request failed with status ${response.status}.`;

        if (
            typeof message === "string"
            && (
                message.includes("Cannot PUT /api/")
                || message.includes("Cannot POST /api/")
            )
        ) {
            message =
                "This API endpoint is missing on the backend server. Restart the backend locally, or redeploy the latest backend code to production.";
        }

        const error: any = new Error(message);

        error.response = {
            status: response.status,
            data: payload,
        };

        throw error;
    }

    return payload;
}


const json = (value: any) => ({
    body: JSON.stringify(value),
});


const adminService: Record<string, (...args: any[]) => Promise<any>> = {
    /* Auth */
    login(payload: any): Promise<any> {
        resetCsrf();
        return ensureCsrf(true).then(() =>
            request("admin/login", {
                method: "POST",
                ...json(payload),
            })
        );
    },

    me(): Promise<any> {
        return request("admin/me");
    },

    logout(): Promise<any> {
        return request("admin/logout", {
            method: "POST",
            ...json({}),
        }).finally(() => {
            resetCsrf();
        });
    },

    /* Admin Profile & Security */
    profile() {
        return request("admin/profile");
    },

    saveProfile(payload) {
        return request("admin/profile", {
            method: "PUT",
            ...json(payload),
        });
    },

    changePassword(payload) {
        return request("admin/profile/password", {
            method: "POST",
            ...json(payload),
        });
    },

    revokeOtherSessions() {
        return request("admin/profile/revoke-other-sessions", {
            method: "POST",
            ...json({}),
        });
    },

    /* Dashboard */
    dashboard() {
        return request("admin/dashboard");
    },

    /* Sellers */
    sellers(filters = {}) {
        const query = queryString(filters);
        return request(query ? `admin/sellers?${query}` : "admin/sellers");
    },

    seller(id) {
        return request(`admin/sellers/${id}`);
    },

    sellerStatus(id, payload) {
        return request(`admin/sellers/${id}/status`, {
            method: "POST",
            ...json(payload),
        });
    },

    sellerCommercial(id, payload) {
        return request(`admin/sellers/${id}/commercial`, {
            method: "PUT",
            ...json(payload),
        });
    },

    verifySellerDocument(id, payload) {
        return request(`admin/seller-documents/${id}/verify`, {
            method: "POST",
            ...json(payload),
        });
    },

    verifySellerBank(id, isVerified) {
        return request(`admin/seller-bank-accounts/${id}/verify`, {
            method: "POST",
            ...json({
                is_verified: isVerified,
            }),
        });
    },

    /* Products */
    products(filters = {}) {
        const query = queryString(filters);
        return request(query ? `admin/products?${query}` : "admin/products");
    },

    product(id) {
        return request(`admin/products/${id}`);
    },

    moderateProduct(id, payload) {
        return request(`admin/products/${id}/moderate`, {
            method: "POST",
            ...json(payload),
        });
    },

    /* Pricing */
    pricingProducts(filters = {}) {
        const query = queryString(filters);
        return request(
            query
                ? `admin/pricing/products?${query}`
                : "admin/pricing/products"
        );
    },

    pricingHistory(filters = {}) {
        const query = queryString(filters);
        return request(
            query
                ? `admin/pricing/history?${query}`
                : "admin/pricing/history"
        );
    },

    pricingAdjustment(id) {
        return request(`admin/pricing/history/${id}`);
    },

    applyPriceAdjustment(payload) {
        return request("admin/pricing/apply", {
            method: "POST",
            ...json(payload),
        });
    },

    rollbackPriceAdjustment(id) {
        return request(`admin/pricing/${id}/rollback`, {
            method: "POST",
            ...json({}),
        });
    },

    /* Catalog */
    categories() {
        return request("admin/categories");
    },

    saveCategory(id, formData) {
        return request(
            id ? `admin/categories/${id}` : "admin/categories",
            {
                method: "POST",
                body: formData,
            }
        );
    },

    deleteCategory(id) {
        return request(`admin/categories/${id}`, {
            method: "DELETE",
        });
    },

    restoreCategory(id) {
        return request(`admin/categories/${id}/restore`, {
            method: "POST",
            ...json({}),
        });
    },

    brands() {
        return request("admin/brands");
    },

    saveBrand(id, formData) {
        return request(
            id ? `admin/brands/${id}` : "admin/brands",
            {
                method: "POST",
                body: formData,
            }
        );
    },

    deleteBrand(id) {
        return request(`admin/brands/${id}`, {
            method: "DELETE",
        });
    },

    restoreBrand(id) {
        return request(`admin/brands/${id}/restore`, {
            method: "POST",
            ...json({}),
        });
    },

    /* Orders */
    orders(filters = {}) {
        const query = queryString(filters);
        return request(query ? `admin/orders?${query}` : "admin/orders");
    },

    order(id) {
        return request(`admin/orders/${id}`);
    },

    orderStatus(id, payload) {
        return request(`admin/orders/${id}/status`, {
            method: "POST",
            ...json(payload),
        });
    },

    orderNote(id, payload) {
        return request(`admin/orders/${id}/notes`, {
            method: "POST",
            ...json(payload),
        });
    },

    /* Finance */
    finance() {
        return request("admin/finance");
    },

    withdrawals(filters = {}) {
        const query = queryString(filters);
        return request(
            query
                ? `admin/finance/withdrawals?${query}`
                : "admin/finance/withdrawals"
        );
    },

    reviewWithdrawal(id, payload) {
        return request(`admin/finance/withdrawals/${id}/review`, {
            method: "POST",
            ...json(payload),
        });
    },

    payWithdrawal(id, payload) {
        return request(`admin/finance/withdrawals/${id}/pay`, {
            method: "POST",
            ...json(payload),
        });
    },

    refunds(filters = {}) {
        const query = queryString(filters);
        return request(
            query
                ? `admin/finance/refunds?${query}`
                : "admin/finance/refunds"
        );
    },

    processRefund(id, payload) {
        return request(`admin/finance/refunds/${id}/process`, {
            method: "POST",
            ...json(payload),
        });
    },

    commissionRules() {
        return request("admin/finance/commission-rules");
    },

    saveCommissionRule(id, payload) {
        return request(
            id
                ? `admin/finance/commission-rules/${id}`
                : "admin/finance/commission-rules",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },

    deleteCommissionRule(id) {
        return request(`admin/finance/commission-rules/${id}`, {
            method: "DELETE",
        });
    },

    courier() {
        return request("admin/courier");
    },
    
    saveCourierProvider(id, payload) {
        return request(
            id
                ? `admin/courier/providers/${id}`
                : "admin/courier/providers",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },
    
    toggleCourierProvider(id, isActive) {
        return request(
            `admin/courier/providers/${id}/toggle`,
            {
                method: "POST",
                ...json({
                    is_active: isActive,
                }),
            }
        );
    },
    
    deleteCourierProvider(id) {
        return request(
            `admin/courier/providers/${id}`,
            {
                method: "DELETE",
            }
        );
    },
    
    saveCourierAccount(id, payload) {
        return request(
            id
                ? `admin/courier/accounts/${id}`
                : "admin/courier/accounts",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },
    
    toggleCourierAccount(id, isActive) {
        return request(
            `admin/courier/accounts/${id}/toggle`,
            {
                method: "POST",
                ...json({
                    is_active: isActive,
                }),
            }
        );
    },
    
    makeDefaultCourierAccount(id) {
        return request(
            `admin/courier/accounts/${id}/default`,
            {
                method: "POST",
                ...json({}),
            }
        );
    },
    
    testCourierAccount(id) {
        return request(
            `admin/courier/accounts/${id}/test`,
            {
                method: "POST",
                ...json({}),
            }
        );
    },
    
    deleteCourierAccount(id) {
        return request(
            `admin/courier/accounts/${id}`,
            {
                method: "DELETE",
            }
        );
    },
    
    restoreCourierAccount(id) {
        return request(
            `admin/courier/accounts/${id}/restore`,
            {
                method: "POST",
                ...json({}),
            }
        );
    },

    updateCourierShippingAreas(payload) {
        const body = {
            inside_dhaka_charge: payload.inside_dhaka_charge,
            outside_dhaka_charge: payload.outside_dhaka_charge,
            free_shipping: payload.free_shipping,
        };

        return request("admin/courier/shipping-areas", {
            method: "POST",
            ...json(body),
        }).catch(async (error) => {
            const status = Number(error?.response?.status || 0);
            const message = String(error?.message || "");

            if (
                status !== 404
                && !message.includes("Cannot POST /api/admin/courier/shipping-areas")
                && !message.includes("Cannot PUT /api/admin/courier/shipping-areas")
            ) {
                throw error;
            }

            return request("admin/settings", {
                method: "POST",
                ...json(body),
            });
        });
    },

    /* Marketing */
    promotions() {
        return request("admin/promotions");
    },

    saveOffer(id, payload) {
        return request(
            id
                ? `admin/promotions/offers/${id}`
                : "admin/promotions/offers",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },

    deleteOffer(id) {
        return request(`admin/promotions/offers/${id}`, {
            method: "DELETE",
        });
    },

    saveCoupon(id, payload) {
        return request(
            id
                ? `admin/promotions/coupons/${id}`
                : "admin/promotions/coupons",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },

    deleteCoupon(id) {
        return request(`admin/promotions/coupons/${id}`, {
            method: "DELETE",
        });
    },

    /* Content & Blog */
    content(filters = {}) {
        const query = queryString(filters);
        return request(query ? `admin/content?${query}` : "admin/content");
    },

    saveBlog(id, formData) {
        return request(
            id ? `admin/content/blogs/${id}` : "admin/content/blogs",
            {
                method: "POST",
                body: formData,
            }
        );
    },

    deleteBlog(id) {
        return request(`admin/content/blogs/${id}`, {
            method: "DELETE",
        });
    },

    restoreBlog(id) {
        return request(`admin/content/blogs/${id}/restore`, {
            method: "POST",
            ...json({}),
        });
    },

    saveBlogCategory(id, formData) {
        return request(
            id
                ? `admin/content/categories/${id}`
                : "admin/content/categories",
            {
                method: "POST",
                body: formData,
            }
        );
    },

    /* Banners */
    banners() {
        return request("admin/banners");
    },

    saveBanner(id, formData) {
        return request(
            id ? `admin/banners/slides/${id}` : "admin/banners/slides",
            {
                method: "POST",
                body: formData,
            }
        );
    },

    deleteBanner(id) {
        return request(`admin/banners/slides/${id}`, {
            method: "DELETE",
        });
    },

    restoreBanner(id) {
        return request(`admin/banners/slides/${id}/restore`, {
            method: "POST",
            ...json({}),
        });
    },

    saveBannerSettings(formData) {
        return request("admin/banners/settings", {
            method: "POST",
            body: formData,
        });
    },

    /* Landing Pages (Nebuloid-style product-linked builder) */
    landingPages(filters = {}) {
        const query = queryString(filters);
        return request(
            query
                ? `admin/landing-pages?${query}`
                : "admin/landing-pages"
        );
    },

    landingPageMeta() {
        return request("admin/landing-pages/meta");
    },

    landingPageDefaults(filters: Record<string, any> = {}) {
        const query = queryString(filters);
        return request(
            query
                ? `admin/landing-pages/defaults?${query}`
                : "admin/landing-pages/defaults"
        );
    },

    landingPage(id) {
        return request(`admin/landing-pages/${id}`);
    },

    saveLandingPage(id, payload) {
        return request(
            id
                ? `admin/landing-pages/${id}`
                : "admin/landing-pages",
            {
                method: "POST",
                ...json(payload),
            }
        );
    },

    uploadLandingImage(file: File | Blob) {
        const formData = new FormData();
        formData.append("image", file);
        return request("admin/landing-pages/upload-image", {
            method: "POST",
            body: formData,
        });
    },

    deleteLandingPage(id) {
        return request(`admin/landing-pages/${id}`, {
            method: "DELETE",
        });
    },

    restoreLandingPage(id) {
        return request(`admin/landing-pages/${id}/restore`, {
            method: "POST",
            ...json({}),
        });
    },

    publishLandingPage(id, publish) {
        return request(`admin/landing-pages/${id}/publish`, {
            method: "POST",
            ...json({
                publish,
                is_active: publish,
            }),
        });
    },

    /* Courier & Delivery */
    courier() {
        return request("admin/courier");
    },

    toggleCourierProvider(id, isActive) {
        return request(`admin/courier/providers/${id}/toggle`, {
            method: "POST",
            ...json({
                is_active: isActive,
            }),
        });
    },

    /* Customers */
    customers(filters = {}) {
        const query = queryString(filters);
        return request(
            query ? `admin/customers?${query}` : "admin/customers"
        );
    },

    customerStatus(id, status) {
        return request(`admin/customers/${id}/status`, {
            method: "POST",
            ...json({ status }),
        });
    },

    /* Returns */
    returns(filters = {}) {
        const query = queryString(filters);
        return request(query ? `admin/returns?${query}` : "admin/returns");
    },

    returnRequest(id) {
        return request(`admin/returns/${id}`);
    },

    updateReturn(id, payload) {
        return request(`admin/returns/${id}`, {
            method: "POST",
            ...json(payload),
        });
    },

    /* Reviews */
    reviews(filters = {}) {
        const query = queryString(filters);
        return request(query ? `admin/reviews?${query}` : "admin/reviews");
    },

    moderateReview(type, id, status) {
        return request(`admin/reviews/${type}/${id}/moderate`, {
            method: "POST",
            ...json({ status }),
        });
    },

    /* Support */
    support(filters = {}) {
        const query = queryString(filters);
        return request(query ? `admin/support?${query}` : "admin/support");
    },

    supportTicket(id) {
        return request(`admin/support/${id}`);
    },

    replySupport(id, formData) {
        return request(`admin/support/${id}/reply`, {
            method: "POST",
            body: formData,
        });
    },

    supportStatus(id, status) {
        return request(`admin/support/${id}/status`, {
            method: "POST",
            ...json({ status }),
        });
    },

    /* Reports */
    reports(filters = {}) {
        const query = queryString(filters);
        return request(query ? `admin/reports?${query}` : "admin/reports");
    },

    /* Administrators */
    administrators(filters = {}) {
        const query = queryString(filters);
        return request(
            query
                ? `admin/administrators?${query}`
                : "admin/administrators"
        );
    },

    saveAdministrator(id, payload) {
        return request(
            id ? `admin/administrators/${id}` : "admin/administrators",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },

    saveAdminRole(id, payload) {
        return request(
            id ? `admin/admin-roles/${id}` : "admin/admin-roles",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },

    /* Audit */
    auditLogs(filters = {}) {
        const query = queryString(filters);
        return request(
            query ? `admin/audit-logs?${query}` : "admin/audit-logs"
        );
    },

    /* Settings */
    settings() {
        return request("admin/settings");
    },

    saveSettings(formData) {
        return request("admin/settings", {
            method: "POST",
            body: formData,
        });
    },
};


export {
    request as adminRequest,
    queryString as adminQueryString,
};


export default adminService;
