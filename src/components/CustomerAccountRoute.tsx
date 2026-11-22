import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";

import useSellerAuth from "../hooks/useSellerAuth";
import adminService from "../services/adminService";
import sellerAuthService from "../services/sellerAuthService";

import "../pages/Storefront/Account.css";

type StaffRole = "admin" | "seller" | "both";

function isSellerPayload(payload: unknown) {
    if (!payload || typeof payload !== "object") {
        return false;
    }

    const root = payload as { data?: unknown; id?: unknown; vendor?: unknown };
    const seller =
        root.data && typeof root.data === "object"
            ? (root.data as { id?: unknown; vendor?: unknown })
            : root;

    return Boolean(seller?.id || seller?.vendor);
}

function isAdminPayload(payload: unknown) {
    if (!payload || typeof payload !== "object") {
        return false;
    }

    const data = (payload as { data?: { id?: unknown; email?: unknown } }).data;
    return Boolean(data?.id || data?.email);
}

function StaffBlockedAccount({ role }: { role: StaffRole }) {
    const signedInAs =
        role === "admin"
            ? "an administrator"
            : role === "seller"
              ? "a seller"
              : "a seller and an administrator";

    const dashboardTo =
        role === "seller" ? "/seller/dashboard" : "/admin/dashboard";
    const dashboardLabel =
        role === "seller" ? "Go to seller dashboard" : "Go to admin dashboard";

    return (
        <div className="fv-account-page">
            <div className="fv-account-container">
                <div className="fv-account-blocked">
                    <span>Access restricted</span>
                    <h1>Sellers and admins can&apos;t access the customer dashboard</h1>
                    <p>
                        You&apos;re signed in as {signedInAs}. The customer
                        account area is only for Facevaly shoppers.
                    </p>
                    <div className="fv-account-blocked-actions">
                        <Link to={dashboardTo}>{dashboardLabel}</Link>
                        {role === "both" ? (
                            <Link to="/seller/dashboard">
                                Go to seller dashboard
                            </Link>
                        ) : null}
                        <Link to="/" className="fv-account-blocked-ghost">
                            Continue shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CustomerAccountRoute() {
    const { seller, isAuthenticated } = useSellerAuth();
    const sellerKnown = Boolean(isAuthenticated && seller);

    const [role, setRole] = useState<StaffRole | null>(
        sellerKnown ? "seller" : null
    );
    const [checking, setChecking] = useState(!sellerKnown);

    useEffect(() => {
        let active = true;

        async function probe() {
            try {
                const [adminResult, sellerResult] = await Promise.allSettled([
                    adminService.me(),
                    sellerKnown
                        ? Promise.resolve({ data: seller })
                        : sellerAuthService.me(),
                ]);

                if (!active) {
                    return;
                }

                const adminOk =
                    adminResult.status === "fulfilled" &&
                    isAdminPayload(adminResult.value);
                const sellerOk =
                    sellerKnown ||
                    (sellerResult.status === "fulfilled" &&
                        isSellerPayload(sellerResult.value));

                if (adminOk && sellerOk) {
                    setRole("both");
                } else if (adminOk) {
                    setRole("admin");
                } else if (sellerOk) {
                    setRole("seller");
                } else {
                    setRole(null);
                }
            } catch {
                if (active && !sellerKnown) {
                    setRole(null);
                }
            } finally {
                if (active) {
                    setChecking(false);
                }
            }
        }

        probe();

        return () => {
            active = false;
        };
    }, [seller, sellerKnown]);

    if (checking) {
        return (
            <div className="fv-account-page">
                <div className="fv-account-container">
                    <div className="fv-account-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Checking account access...
                    </div>
                </div>
            </div>
        );
    }

    if (role) {
        return <StaffBlockedAccount role={role} />;
    }

    return <Outlet />;
}
