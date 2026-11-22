/*
|--------------------------------------------------------------------------
| REPLACE THE OLD COURIER METHODS INSIDE adminService
|--------------------------------------------------------------------------
|
| Reference module mirroring courier admin API helpers.
| Methods already live on adminService; this file keeps the snippet as a
| valid typed module for the Vite+TS app.
|
*/

import {
    adminRequest,
} from "./adminService";


const json = (value: any) => ({
    body: JSON.stringify(value),
});


const service_courier_methods = {
    courier(): Promise<any> {
        return adminRequest("admin/courier");
    },

    saveCourierProvider(id: any, payload: any): Promise<any> {
        return adminRequest(
            id
                ? `admin/courier/providers/${id}`
                : "admin/courier/providers",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },

    toggleCourierProvider(id: any, isActive: any): Promise<any> {
        return adminRequest(
            `admin/courier/providers/${id}/toggle`,
            {
                method: "POST",
                ...json({
                    is_active: isActive,
                }),
            }
        );
    },

    deleteCourierProvider(id: any): Promise<any> {
        return adminRequest(
            `admin/courier/providers/${id}`,
            {
                method: "DELETE",
            }
        );
    },

    saveCourierAccount(id: any, payload: any): Promise<any> {
        return adminRequest(
            id
                ? `admin/courier/accounts/${id}`
                : "admin/courier/accounts",
            {
                method: id ? "PUT" : "POST",
                ...json(payload),
            }
        );
    },

    toggleCourierAccount(id: any, isActive: any): Promise<any> {
        return adminRequest(
            `admin/courier/accounts/${id}/toggle`,
            {
                method: "POST",
                ...json({
                    is_active: isActive,
                }),
            }
        );
    },

    makeDefaultCourierAccount(id: any): Promise<any> {
        return adminRequest(
            `admin/courier/accounts/${id}/default`,
            {
                method: "POST",
                ...json({}),
            }
        );
    },

    testCourierAccount(id: any): Promise<any> {
        return adminRequest(
            `admin/courier/accounts/${id}/test`,
            {
                method: "POST",
                ...json({}),
            }
        );
    },

    deleteCourierAccount(id: any): Promise<any> {
        return adminRequest(
            `admin/courier/accounts/${id}`,
            {
                method: "DELETE",
            }
        );
    },

    restoreCourierAccount(id: any): Promise<any> {
        return adminRequest(
            `admin/courier/accounts/${id}/restore`,
            {
                method: "POST",
                ...json({}),
            }
        );
    },
};


export default service_courier_methods;
