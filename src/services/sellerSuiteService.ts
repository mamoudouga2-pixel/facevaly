import {
    apiUrl,
} from "../config/api";
import {
    ensureCsrf as ensureSharedCsrf,
    getCsrfToken,
    rememberCsrfToken,
    resetCsrf,
} from "./csrfBootstrap";


/* =========================================================
   CSRF
========================================================= */

const ensureCsrf = async (
    force = false
): Promise<void> => {
    await ensureSharedCsrf(force);
};


/* =========================================================
   ERROR
========================================================= */

const extractError =
    (
        data: any
    ): any => {

    if (
        data?.errors &&
        typeof data.errors ===
            "object"
    ) {

        const first =
            Object.values(
                data.errors
            )
                .flat()
                .find(
                    Boolean
                );


        if (
            first
        ) {

            return String(
                first
            );

        }

    }


    return (
        data?.message ||
        "Request failed."
    );

};


/* =========================================================
   REQUEST
========================================================= */

const request = async (
    path: string,
    options: RequestInit = {},
    retried = false
): Promise<any> => {

        const method =
            String(
                options.method ||
                    "GET"
            )
                .toUpperCase();


        const mutating =
            [
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
            ]
                .includes(
                    method
                );


        if (
            mutating
        ) {

            await ensureCsrf(true);

        }


        const headers: Record<string, string> = {
            Accept:
                "application/json",

            "X-Requested-With":
                "XMLHttpRequest",

            ...((options.headers as Record<string, string>) || {}),
        };


        const vendorId =
            window.localStorage.getItem(
                "seller_vendor_id"
            );


        if (
            vendorId
        ) {

            headers[
                "X-Vendor-ID"
            ] =
                vendorId;

        }


        if (
            options.body !==
                undefined &&
            !(
                options.body
                instanceof
                FormData
            )
        ) {

            headers[
                "Content-Type"
            ] =
                "application/json";

        }


        if (
            mutating
        ) {

            const token =
                getCsrfToken();


            if (
                token
            ) {

                headers[
                    "X-XSRF-TOKEN"
                ] =
                    token;

            }

        }


        const response =
            await fetch(
                apiUrl(
                    path
                ),
                {
                    ...options,

                    method,

                    headers,

                    credentials:
                        "include",

                    cache:
                        "no-store",
                }
            );


        rememberCsrfToken(
            response.headers.get(
                "X-XSRF-TOKEN"
            )
            || response.headers.get(
                "x-xsrf-token"
            )
        );


        if (
            response.status ===
                419 &&
            !retried
        ) {

            resetCsrf();

            await ensureCsrf(
                true
            );


            return request(
                path,
                options,
                true
            );

        }


        let data: any =
            {};


        try {

            data =
                await response.json();

        } catch {

            data =
                {};

        }


        if (
            !response.ok
        ) {

            const error: any =
                new Error(
                    extractError(
                        data
                    )
                );


            error.status =
                response.status;


            error.data =
                data;


            throw error;

        }


        return data;

    };


/* =========================================================
   QUERY STRING
========================================================= */

const queryString =
    (
        values: Record<string, any> = {}
    ): string => {

    const params =
        new URLSearchParams();


    Object.entries(
        values
    )
        .forEach(
            ([
                key,
                value,
            ]) => {

                if (
                    value !==
                        undefined &&
                    value !==
                        null &&
                    value !==
                        ""
                ) {

                    params.set(
                        key,
                        value
                    );

                }

            }
        );


    return params.toString();

};


/* =========================================================
   HELPERS
========================================================= */

const jsonBody =
    (
        payload: any
    ) => ({
    body:
        JSON.stringify(
            payload
        ),
});


/* =========================================================
   SELLER SUITE SERVICE
========================================================= */

const sellerSuiteService = {


    /* =====================================================
       INVENTORY
    ===================================================== */

    inventory(
        filters: Record<string, any> = {}
    ): Promise<any> {

        const query =
            queryString(
                filters
            );


        return request(
            query
                ? `seller/inventory?${query}`
                : "seller/inventory"
        );

    },


    inventoryTransactions(
        filters: Record<string, any> = {}
    ): Promise<any> {

        const query =
            queryString(
                filters
            );


        return request(
            query
                ? `seller/inventory/transactions?${query}`
                : "seller/inventory/transactions"
        );

    },


    adjustInventory(
        payload: any
    ): Promise<any> {

        return request(
            "seller/inventory/adjust",
            {
                method:
                    "POST",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    /* =====================================================
       CUSTOMERS
    ===================================================== */

    customers(
        filters: Record<string, any> = {}
    ): Promise<any> {

        const query =
            queryString(
                filters
            );


        return request(
            query
                ? `seller/customers?${query}`
                : "seller/customers"
        );

    },


    /* =====================================================
       WALLET / PAYOUT
    ===================================================== */

    wallet(): Promise<any> {

        return request(
            "seller/wallet"
        );

    },


    requestWithdrawal(
        payload: any
    ): Promise<any> {

        return request(
            "seller/wallet/withdrawals",
            {
                method:
                    "POST",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    cancelWithdrawal(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/wallet/withdrawals/${id}/cancel`,
            {
                method:
                    "POST",

                ...jsonBody(
                    {}
                ),
            }
        );

    },


    saveBankAccount(
        payload: any,
        id: string | number | null = null
    ): Promise<any> {

        return request(
            id
                ? `seller/wallet/bank-accounts/${id}`
                : "seller/wallet/bank-accounts",
            {
                method:
                    id
                        ? "PUT"
                        : "POST",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    deleteBankAccount(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/wallet/bank-accounts/${id}`,
            {
                method:
                    "DELETE",
            }
        );

    },


    /* =====================================================
       PROMOTIONS
    ===================================================== */

    promotions(): Promise<any> {

        return request(
            "seller/promotions"
        );

    },


    saveOffer(
        payload: any,
        id: string | number | null = null
    ): Promise<any> {

        return request(
            id
                ? `seller/promotions/offers/${id}`
                : "seller/promotions/offers",
            {
                method:
                    id
                        ? "PUT"
                        : "POST",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    deleteOffer(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/promotions/offers/${id}`,
            {
                method:
                    "DELETE",
            }
        );

    },


    saveCoupon(
        payload: any,
        id: string | number | null = null
    ): Promise<any> {

        return request(
            id
                ? `seller/promotions/coupons/${id}`
                : "seller/promotions/coupons",
            {
                method:
                    id
                        ? "PUT"
                        : "POST",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    deleteCoupon(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/promotions/coupons/${id}`,
            {
                method:
                    "DELETE",
            }
        );

    },


    /* =====================================================
       REVIEWS
    ===================================================== */

    reviews(
        filters: Record<string, any> = {}
    ): Promise<any> {

        const query =
            queryString(
                filters
            );


        return request(
            query
                ? `seller/reviews?${query}`
                : "seller/reviews"
        );

    },


    replyProductReview(
        id: string | number,
        reply: any
    ): Promise<any> {

        return request(
            `seller/reviews/products/${id}/reply`,
            {
                method:
                    "POST",

                ...jsonBody({
                    reply,
                }),
            }
        );

    },


    replyStoreReview(
        id: string | number,
        reply: any
    ): Promise<any> {

        return request(
            `seller/reviews/store/${id}/reply`,
            {
                method:
                    "POST",

                ...jsonBody({
                    reply,
                }),
            }
        );

    },


    /* =====================================================
       RETURNS / REFUNDS
    ===================================================== */

    returns(
        filters: Record<string, any> = {}
    ): Promise<any> {

        const query =
            queryString(
                filters
            );


        return request(
            query
                ? `seller/returns?${query}`
                : "seller/returns"
        );

    },


    updateReturn(
        id: string | number,
        payload: any
    ): Promise<any> {

        return request(
            `seller/returns/${id}`,
            {
                method:
                    "PUT",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    /* =====================================================
       REPORTS
    ===================================================== */

    reports(
        filters: Record<string, any> = {}
    ): Promise<any> {

        const query =
            queryString(
                filters
            );


        return request(
            query
                ? `seller/reports?${query}`
                : "seller/reports"
        );

    },


    /* =====================================================
       STORE SETTINGS
    ===================================================== */

    storeSettings(): Promise<any> {

        return request(
            "seller/store-settings"
        );

    },


    updateStoreProfile(
        formData: FormData
    ): Promise<any> {

        return request(
            "seller/store-settings/profile",
            {
                method:
                    "POST",

                body:
                    formData,
            }
        );

    },


    updateStorePolicies(
        payload: any
    ): Promise<any> {

        return request(
            "seller/store-settings/policies",
            {
                method:
                    "PUT",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    updateShipping(
        payload: any
    ): Promise<any> {

        return request(
            "seller/store-settings/shipping",
            {
                method:
                    "PUT",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    saveShippingRate(
        payload: any,
        id: string | number | null = null
    ): Promise<any> {

        return request(
            id
                ? `seller/store-settings/shipping-rates/${id}`
                : "seller/store-settings/shipping-rates",
            {
                method:
                    id
                        ? "PUT"
                        : "POST",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    deleteShippingRate(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/store-settings/shipping-rates/${id}`,
            {
                method:
                    "DELETE",
            }
        );

    },


    uploadStoreDocument(
        formData: FormData
    ): Promise<any> {

        return request(
            "seller/store-settings/documents",
            {
                method:
                    "POST",

                body:
                    formData,
            }
        );

    },


    deleteStoreDocument(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/store-settings/documents/${id}`,
            {
                method:
                    "DELETE",
            }
        );

    },


    /* =====================================================
       STAFF
    ===================================================== */

    staff(): Promise<any> {

        return request(
            "seller/staff"
        );

    },


    addStaff(
        payload: any
    ): Promise<any> {

        return request(
            "seller/staff",
            {
                method:
                    "POST",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    updateStaff(
        id: string | number,
        payload: any
    ): Promise<any> {

        return request(
            `seller/staff/${id}`,
            {
                method:
                    "PUT",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    deleteStaff(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/staff/${id}`,
            {
                method:
                    "DELETE",
            }
        );

    },


    /* =====================================================
       ACCOUNT
    ===================================================== */

    account(): Promise<any> {

        return request(
            "seller/account"
        );

    },


    updateAccountProfile(
        formData: FormData
    ): Promise<any> {

        return request(
            "seller/account/profile",
            {
                method:
                    "POST",

                body:
                    formData,
            }
        );

    },


    changePassword(
        payload: any
    ): Promise<any> {

        return request(
            "seller/account/password",
            {
                method:
                    "PUT",

                ...jsonBody(
                    payload
                ),
            }
        );

    },


    /* =====================================================
       SUPPORT CENTER
    ===================================================== */

    supportTickets(
        filters: Record<string, any> = {}
    ): Promise<any> {

        const query =
            queryString(
                filters
            );


        return request(
            query
                ? `seller/support?${query}`
                : "seller/support"
        );

    },


    supportTicket(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/support/${id}`
        );

    },


    createSupportTicket(
        formData: FormData
    ): Promise<any> {

        return request(
            "seller/support",
            {
                method:
                    "POST",

                body:
                    formData,
            }
        );

    },


    replySupportTicket(
        id: string | number,
        formData: FormData
    ): Promise<any> {

        return request(
            `seller/support/${id}/reply`,
            {
                method:
                    "POST",

                body:
                    formData,
            }
        );

    },


    closeSupportTicket(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/support/${id}/close`,
            {
                method:
                    "POST",

                ...jsonBody(
                    {}
                ),
            }
        );

    },


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    notifications(
        filters: Record<string, any> = {}
    ): Promise<any> {

        const query =
            queryString(
                filters
            );


        return request(
            query
                ? `seller/notifications?${query}`
                : "seller/notifications"
        );

    },


    notificationSummary(): Promise<any> {

        return request(
            "seller/notifications/summary"
        );

    },


    markNotificationRead(
        id: string | number
    ): Promise<any> {

        return request(
            `seller/notifications/${id}/read`,
            {
                method:
                    "POST",

                ...jsonBody(
                    {}
                ),
            }
        );

    },


    markAllNotificationsRead(): Promise<any> {

        return request(
            "seller/notifications/read-all",
            {
                method:
                    "POST",

                ...jsonBody(
                    {}
                ),
            }
        );

    },

};


export default sellerSuiteService;
