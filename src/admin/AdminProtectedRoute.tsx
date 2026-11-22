import type { ReactNode } from "react";
import {
    Navigate,
    useLocation,
} from "react-router-dom";

import {
    useAdminAuth,
} from "./AdminAuthContext";


export default function AdminProtectedRoute({
    children,
    permission = null,
    anyOf = null,
}: {
    children: ReactNode;
    permission?: string | null;
    anyOf?: string[] | null;
}) {
    const location =
        useLocation();

    const {
        loading,
        isAuthenticated,
        admin,
        can,
    } =
        useAdminAuth();


    // Only block the first auth resolve. After that, keep the admin shell
    // mounted across route changes (no remounted provider / false logout).
    if (loading && !admin) {
        return (
            <div className="adm-route-loading">
                <span className="adm-spinner" />
                <strong>
                    Checking administrator access...
                </strong>
            </div>
        );
    }


    if (!isAuthenticated) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{
                    from:
                        location.pathname
                        + location.search,
                }}
            />
        );
    }


    const allowedByAnyOf =
        Array.isArray(anyOf)
        && anyOf.length > 0
            ? anyOf.some((item) => can(item))
            : true;

    const allowedByPermission =
        permission
            ? can(permission)
            : true;

    if (
        !allowedByAnyOf
        || !allowedByPermission
    ) {
        return (
            <div className="adm-route-loading">
                <i className="fa-solid fa-lock" />
                <strong>
                    You do not have permission to open this admin page.
                </strong>
            </div>
        );
    }


    return children;
}
