import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import useSellerAuth from "../hooks/useSellerAuth";

function vendorFlags(seller: any) {
    const vendor = seller?.vendor || {};
    const status = String(vendor.status || "").toLowerCase();
    const approved =
        status === "active" && Boolean(vendor.is_active ?? true);
    const needsOnboardingDocs = Boolean(
        vendor.needs_onboarding_docs
        ?? (status === "pending"
            && (vendor.needs_nid_upload || vendor.needs_business_address))
    );
    const awaitingAdminApproval = Boolean(
        vendor.awaiting_admin_approval
        ?? (status === "pending" && !needsOnboardingDocs && vendor.docs_submitted)
    );

    return {
        status,
        approved,
        needsOnboardingDocs,
        awaitingAdminApproval,
        pending: status === "pending",
    };
}

const ALLOWED_WHILE_PENDING = [
    "/seller/complete-profile",
    "/seller/pending-approval",
    "/seller/logout",
    "/seller/profile",
    "/seller/notifications",
];

function isAllowedPendingPath(pathname: string) {
    return ALLOWED_WHILE_PENDING.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

export default function SellerProtectedRoute({
    children,
}: {
    children: ReactNode;
    /** @deprecated Pending sellers are gated; kept for call-site compat. */
    allowPending?: boolean;
}) {
    const { loading, isAuthenticated, seller } = useSellerAuth();
    const location = useLocation();
    const flags = vendorFlags(seller);

    if (loading && !seller) {
        return (
            <div className="seller-route-loader">
                <div className="seller-route-spinner" />
                <p>Loading seller account...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/seller/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    if (flags.pending && !flags.approved) {
        if (flags.needsOnboardingDocs) {
            if (!location.pathname.startsWith("/seller/complete-profile")) {
                return <Navigate to="/seller/complete-profile" replace />;
            }
        } else if (flags.awaitingAdminApproval || flags.pending) {
            if (!isAllowedPendingPath(location.pathname)) {
                return <Navigate to="/seller/pending-approval" replace />;
            }
        }
    }

    if (
        !flags.approved
        && location.pathname.startsWith("/seller/products")
    ) {
        return (
            <Navigate
                to={
                    flags.needsOnboardingDocs
                        ? "/seller/complete-profile"
                        : "/seller/pending-approval"
                }
                replace
            />
        );
    }

    return children;
}
