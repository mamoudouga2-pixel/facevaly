import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
    NavLink,
    useLocation,
    useNavigate,
} from "react-router-dom";

import useSellerAuth from "../../hooks/useSellerAuth";
import sellerSuiteService from "../../services/sellerSuiteService";
import { mediaUrl } from "../../config/api";

import "../Admin/admin.css";
import "./seller-type.css";
import "./seller.css";
import "./seller-suite-layout-patch.css";


/*
 | Flat seller nav — same chalk-rail chrome as admin.
 | Short labels + icons. Soft section captions only — no accordion.
 */
const MENU_SECTIONS = [
    {
        key: "catalog",
        label: "Catalog",
        items: [
            {
                label: "Products",
                to: "/seller/products",
                icon: "fa-solid fa-box-open",
                permission: "products.manage",
            },
            {
                label: "Add Product",
                to: "/seller/products/create",
                icon: "fa-solid fa-plus",
                permission: "products.manage",
            },
        ],
    },
    {
        key: "fulfill",
        label: "Fulfill",
        items: [
            {
                label: "Orders",
                to: "/seller/orders",
                icon: "fa-solid fa-cart-shopping",
                permission: "orders.manage",
            },
            {
                label: "Inventory",
                to: "/seller/inventory",
                icon: "fa-solid fa-warehouse",
                permission: "inventory.view",
            },
            {
                label: "Returns",
                to: "/seller/returns",
                icon: "fa-solid fa-rotate-left",
                permission: "returns.view",
            },
        ],
    },
    {
        key: "grow",
        label: "Grow",
        items: [
            {
                label: "Customers",
                to: "/seller/customers",
                icon: "fa-solid fa-users",
                permission: "customers.view",
            },
            {
                label: "Wallet",
                to: "/seller/wallet",
                icon: "fa-solid fa-wallet",
                permission: "wallet.view",
            },
            {
                label: "Offers",
                to: "/seller/promotions",
                icon: "fa-solid fa-tags",
                permission: "promotions.view",
            },
            {
                label: "Reviews",
                to: "/seller/reviews",
                icon: "fa-solid fa-star",
                permission: "reviews.view",
            },
            {
                label: "Reports",
                to: "/seller/reports",
                icon: "fa-solid fa-chart-line",
                permission: "reports.view",
            },
        ],
    },
    {
        key: "store",
        label: "Store",
        items: [
            {
                label: "Settings",
                to: "/seller/store",
                icon: "fa-solid fa-store",
                permission: "store.view",
            },
            {
                label: "Staff",
                to: "/seller/staff",
                icon: "fa-solid fa-user-shield",
                permission: "staff.manage",
                ownerOnly: true,
            },
        ],
    },
    {
        key: "care",
        label: "Care",
        items: [
            {
                label: "Support",
                to: "/seller/support",
                icon: "fa-solid fa-headset",
                permission: "support.view",
            },
        ],
    },
];


function itemAllowed(item, can, isOwner) {
    if (item.ownerOnly && !isOwner) {
        return false;
    }

    return can(item.permission);
}


function resolvePageMeta(pathname) {
    if (
        pathname === "/seller/dashboard"
        || pathname === "/seller"
        || pathname === "/seller/"
    ) {
        return {
            title: "Dashboard",
            caption: "Overview",
        };
    }

    if (pathname.startsWith("/seller/complete-profile")) {
        return {
            title: "Complete Profile",
            caption: "Verification",
        };
    }

    if (pathname.startsWith("/seller/profile")) {
        return {
            title: "Account",
            caption: "Profile",
        };
    }

    if (pathname.startsWith("/seller/notifications")) {
        return {
            title: "Notifications",
            caption: "Account",
        };
    }

    for (const section of MENU_SECTIONS) {
        for (const item of section.items) {
            if (
                pathname === item.to
                || pathname.startsWith(`${item.to}/`)
            ) {
                return {
                    title: item.label,
                    caption: section.label,
                };
            }
        }
    }

    return {
        title: "Seller",
        caption: "Facevaly",
    };
}


export default function SellerLayout({
    children,
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        seller,
        logout,
    } = useSellerAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const profileRef = useRef(null);

    const vendor = seller?.vendor || {};
    const membership = seller?.membership || {};
    const vendorName = vendor.name || "Seller";
    const vendorLogo = vendor.logo ? mediaUrl(vendor.logo) : "";
    const sellerName = seller?.user?.name || vendorName;
    const page = resolvePageMeta(location.pathname);
    const isPendingApproval =
        String(vendor.status || "").toLowerCase() === "pending";
    const canManageProducts = Boolean(
        vendor.can_manage_products
        ?? (String(vendor.status || "").toLowerCase() === "active"
            && Boolean(vendor.is_active ?? true))
    );
    const needsOnboardingDocs = Boolean(
        vendor.needs_onboarding_docs
        ?? (isPendingApproval
            && (vendor.needs_nid_upload || vendor.needs_business_address))
    );
    const awaitingAdminApproval = Boolean(
        vendor.awaiting_admin_approval
        ?? (isPendingApproval && !needsOnboardingDocs)
    );
    const needsNidUpload = Boolean(
        vendor.needs_nid_upload ?? needsOnboardingDocs
    );

    const permissionSet = useMemo(() => {
        if (membership.is_owner) {
            return new Set(["*"]);
        }

        const permissions = membership.permissions || [];

        if (Array.isArray(permissions)) {
            return new Set(permissions);
        }

        return new Set(
            Object.keys(permissions).filter((key) => Boolean(permissions[key]))
        );
    }, [membership.is_owner, membership.permissions]);

    const can = (permission) => {
        if (!permission) {
            return true;
        }

        return permissionSet.has("*") || permissionSet.has(permission);
    };

    const sections = MENU_SECTIONS
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => {
                if (
                    !canManageProducts
                    && (item.to.startsWith("/seller/products")
                        || item.permission === "products.manage")
                ) {
                    return false;
                }
                return itemAllowed(item, can, Boolean(membership.is_owner));
            }),
        }))
        .filter((section) => section.items.length > 0);

    useEffect(() => {
        setMobileOpen(false);
        setProfileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const close = (event) => {
            if (
                profileRef.current
                && !profileRef.current.contains(event.target)
            ) {
                setProfileOpen(false);
            }
        };

        document.addEventListener("mousedown", close);

        return () => {
            document.removeEventListener("mousedown", close);
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadCount = async () => {
            try {
                const response = await sellerSuiteService.notificationSummary();

                if (active) {
                    setUnreadNotifications(Number(response?.data?.unread || 0));
                }
            } catch {
                if (active) {
                    setUnreadNotifications(0);
                }
            }
        };

        loadCount();

        const timer = window.setInterval(loadCount, 60000);

        return () => {
            active = false;
            window.clearInterval(timer);
        };
    }, []);

    const doLogout = async () => {
        await logout();

        navigate("/seller/login", {
            replace: true,
        });
    };

    const avatarLetter = String(vendorName || "S")
        .charAt(0)
        .toUpperCase();

    return (
        <div className="adm-shell seller-layout">
            <div
                className={`adm-mobile-overlay ${mobileOpen ? "open" : ""}`}
                onClick={() => setMobileOpen(false)}
            />

            <aside className={`adm-sidebar ${mobileOpen ? "open" : ""}`}>
                <Link
                    to="/seller/dashboard"
                    className="adm-brand"
                >
                    <span className="adm-brand-logo-box">
                        <img
                            src="/frontend/logo.png"
                            alt="Facevaly"
                            className="adm-brand-logo-img"
                        />
                    </span>

                    <span className="adm-brand-copy">
                        <strong>Facevaly</strong>
                        <small>Seller</small>
                    </span>
                </Link>

                <nav className="adm-nav" aria-label="Seller">
                    <NavLink
                        to="/seller/dashboard"
                        end
                        className={({ isActive }) =>
                            `adm-nav-link ${isActive ? "active" : ""}`
                        }
                    >
                        <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                        <span>Dashboard</span>
                    </NavLink>

                    {sections.map((section) => (
                        <div
                            className="adm-nav-section"
                            key={section.key}
                        >
                            <p className="adm-nav-caption">{section.label}</p>

                            {section.items.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === "/seller/products/create"}
                                    className={({ isActive }) => {
                                        if (item.to === "/seller/products") {
                                            const path = location.pathname;
                                            const productActive =
                                                path === "/seller/products"
                                                || (
                                                    path.startsWith("/seller/products/")
                                                    && !path.startsWith("/seller/products/create")
                                                );

                                            return `adm-nav-link ${productActive ? "active" : ""}`;
                                        }

                                        return `adm-nav-link ${isActive ? "active" : ""}`;
                                    }}
                                >
                                    <i className={item.icon} aria-hidden="true" />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="adm-sidebar-bottom">
                    <Link
                        to="/"
                        target="_blank"
                        rel="noreferrer"
                        className="adm-storefront-link"
                    >
                        <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
                        <span>Storefront</span>
                    </Link>
                </div>
            </aside>

            <section className="adm-main">
                <header className="adm-topbar">
                    <div className="adm-topbar-left">
                        <button
                            type="button"
                            className="adm-mobile-toggle"
                            onClick={() => setMobileOpen(true)}
                            aria-label="Open menu"
                        >
                            <i className="fa-solid fa-bars" />
                        </button>

                        <div className="adm-topbar-title">
                            <strong>{page.title}</strong>
                        </div>
                    </div>

                    <div className="adm-topbar-right">
                        <Link
                            to="/seller/notifications"
                            className="adm-topbar-icon seller-notification-link"
                            aria-label="Notifications"
                            title="Notifications"
                        >
                            <i className="fa-regular fa-bell" />

                            {unreadNotifications > 0 ? (
                                <span className="seller-notification-count">
                                    {unreadNotifications > 99
                                        ? "99+"
                                        : unreadNotifications}
                                </span>
                            ) : null}
                        </Link>

                        {can("support.view") ? (
                            <Link
                                to="/seller/support"
                                className="adm-topbar-icon"
                                aria-label="Support"
                                title="Support"
                            >
                                <i className="fa-solid fa-headset" />
                            </Link>
                        ) : null}

                        <div
                            className="adm-profile-wrap"
                            ref={profileRef}
                        >
                            <button
                                type="button"
                                className="adm-profile-button"
                                onClick={() => setProfileOpen((value) => !value)}
                                aria-expanded={profileOpen}
                                aria-label="Account menu"
                            >
                                <span className="adm-avatar">
                                    {vendorLogo ? (
                                        <img
                                            src={vendorLogo}
                                            alt={vendorName}
                                        />
                                    ) : (
                                        avatarLetter
                                    )}
                                </span>

                                <span className="adm-profile-copy">
                                    <strong>{sellerName}</strong>
                                </span>

                                <i className={`fa-solid fa-chevron-down ${profileOpen ? "rotate" : ""}`} />
                            </button>

                            {profileOpen ? (
                                <div className="adm-profile-menu">
                                    <div className="adm-profile-menu-head">
                                        <strong>{sellerName}</strong>
                                        <small>{vendorName}</small>
                                    </div>

                                    <Link to="/seller/profile">
                                        <i className="fa-regular fa-user" />
                                        My Account
                                    </Link>

                                    {can("store.view") ? (
                                        <Link to="/seller/store">
                                            <i className="fa-solid fa-store" />
                                            Store Settings
                                        </Link>
                                    ) : null}

                                    <Link to="/seller/notifications">
                                        <i className="fa-regular fa-bell" />
                                        Notifications
                                        {unreadNotifications > 0 ? (
                                            <strong style={{ marginLeft: "auto", color: "#ff620d" }}>
                                                {unreadNotifications}
                                            </strong>
                                        ) : null}
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={doLogout}
                                    >
                                        <i className="fa-solid fa-right-from-bracket" />
                                        Log out
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </header>

                <main className="adm-content page-content">
                    {isPendingApproval ? (
                        <div
                            className="seller-store-setup-banner is-warning"
                            role="status"
                        >
                            <div className="seller-store-setup-banner-copy">
                                <strong>
                                    {awaitingAdminApproval
                                        ? "Pending for Approval"
                                        : "Complete verification to continue"}
                                </strong>
                                <p>
                                    {needsOnboardingDocs
                                        ? "Submit your store address and National ID (NID) details. Product listing stays locked until admin approval."
                                        : "Your documents are under review. You cannot upload or list products until an admin approves your account."}
                                </p>
                            </div>

                            <Link
                                to={
                                    needsOnboardingDocs
                                        ? "/seller/complete-profile"
                                        : "/seller/pending-approval"
                                }
                                className="seller-store-setup-banner-action"
                            >
                                {needsOnboardingDocs
                                    ? "Complete profile"
                                    : "View status"}
                                <i className="fa-solid fa-arrow-right" />
                            </Link>
                        </div>
                    ) : null}

                    {children}
                </main>
            </section>
        </div>
    );
}
