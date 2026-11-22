import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    NavLink,
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    useAdminAuth,
} from "../../admin/AdminAuthContext";

import "./admin.css";


/*
 | Flat, one-click admin nav.
 | Short labels + icons. Soft section captions only — no accordion.
 */
const MENU_SECTIONS = [
    {
        key: "market",
        label: "Market",
        items: [
            {
                label: "Sellers",
                to: "/admin/sellers",
                icon: "fa-solid fa-store",
                permission: "sellers.view",
            },
            {
                label: "Customers",
                to: "/admin/customers",
                icon: "fa-solid fa-users",
                permission: "customers.view",
            },
        ],
    },
    {
        key: "catalog",
        label: "Catalog",
        items: [
            {
                label: "Products",
                to: "/admin/products",
                icon: "fa-solid fa-box",
                permission: "products.view",
            },
            {
                label: "Pricing",
                to: "/admin/pricing",
                icon: "fa-solid fa-tags",
                permission: "pricing.manage",
            },
            {
                label: "Taxonomy",
                to: "/admin/catalog",
                icon: "fa-solid fa-layer-group",
                permission: null,
                anyOf: [
                    "categories.manage",
                    "brands.manage",
                ],
            },
        ],
    },
    {
        key: "fulfill",
        label: "Fulfill",
        items: [
            {
                label: "Orders",
                to: "/admin/orders",
                icon: "fa-solid fa-bag-shopping",
                permission: "orders.view",
            },
            {
                label: "Returns",
                to: "/admin/returns",
                icon: "fa-solid fa-rotate-left",
                permission: "returns.manage",
            },
            {
                label: "Courier",
                to: "/admin/courier",
                icon: "fa-solid fa-truck",
                permission: "courier.manage",
            },
        ],
    },
    {
        key: "grow",
        label: "Grow",
        items: [
            {
                label: "Finance",
                to: "/admin/finance",
                icon: "fa-solid fa-wallet",
                permission: "finance.view",
            },
            {
                label: "Offers",
                to: "/admin/promotions",
                icon: "fa-solid fa-ticket",
                permission: "promotions.manage",
            },
            {
                label: "Content",
                to: "/admin/content",
                icon: "fa-solid fa-newspaper",
                permission: "content.manage",
            },
            {
                label: "Banners",
                to: "/admin/banners",
                icon: "fa-solid fa-image",
                permission: "banners.manage",
            },
            {
                label: "Landing Page",
                to: "/admin/landing-pages",
                icon: "fa-solid fa-layer-group",
                permission: "landing_pages.manage",
            },
        ],
    },
    {
        key: "care",
        label: "Care",
        items: [
            {
                label: "Reviews",
                to: "/admin/reviews",
                icon: "fa-solid fa-star",
                permission: "reviews.manage",
            },
            {
                label: "Support",
                to: "/admin/support",
                icon: "fa-solid fa-headset",
                permission: "support.manage",
            },
            {
                label: "Reports",
                to: "/admin/reports",
                icon: "fa-solid fa-chart-simple",
                permission: "reports.view",
            },
        ],
    },
    {
        key: "system",
        label: "System",
        items: [
            {
                label: "Admins",
                to: "/admin/administrators",
                icon: "fa-solid fa-user-shield",
                permission: "admins.manage",
            },
            {
                label: "Audit",
                to: "/admin/audit-logs",
                icon: "fa-solid fa-clock-rotate-left",
                permission: "audit.view",
            },
            {
                label: "Settings",
                to: "/admin/settings",
                icon: "fa-solid fa-sliders",
                permission: "settings.manage",
            },
        ],
    },
];


function itemAllowed(item, can) {
    if (item.anyOf) {
        return item.anyOf.some((permission) => can(permission));
    }

    return can(item.permission);
}


function resolvePageMeta(pathname) {
    if (
        pathname === "/admin/dashboard"
        || pathname === "/admin"
        || pathname === "/admin/"
    ) {
        return {
            title: "Dashboard",
            caption: "Overview",
        };
    }

    if (pathname.startsWith("/admin/profile")) {
        return {
            title: "Account",
            caption: "Profile",
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
        title: "Admin",
        caption: "Facevaly",
    };
}


export default function AdminLayout({
    children,
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        admin,
        can,
        logout,
    } = useAdminAuth();

    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    const page = resolvePageMeta(location.pathname);

    const sections = MENU_SECTIONS
        .map((section) => ({
            ...section,
            items: section.items.filter((item) => itemAllowed(item, can)),
        }))
        .filter((section) => section.items.length > 0);

    useEffect(() => {
        setMobileOpen(false);
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

    const doLogout = async () => {
        await logout();

        navigate("/admin/login", {
            replace: true,
        });
    };

    return (
        <div className="adm-shell">
            <div
                className={`adm-mobile-overlay ${mobileOpen ? "open" : ""}`}
                onClick={() => setMobileOpen(false)}
            />

            <aside className={`adm-sidebar ${mobileOpen ? "open" : ""}`}>
                <Link
                    to="/admin/dashboard"
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
                        <small>Admin</small>
                    </span>
                </Link>

                <nav className="adm-nav" aria-label="Admin">
                    {can("dashboard.view") ? (
                        <NavLink
                            to="/admin/dashboard"
                            end
                            className={({ isActive }) =>
                                `adm-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                            <span>Dashboard</span>
                        </NavLink>
                    ) : null}

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
                                    className={({ isActive }) =>
                                        `adm-nav-link ${isActive ? "active" : ""}`
                                    }
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
                        {can("support.manage") ? (
                            <Link
                                to="/admin/support"
                                className="adm-topbar-icon"
                                aria-label="Support"
                                title="Support"
                            >
                                <i className="fa-solid fa-headset" />
                            </Link>
                        ) : null}

                        {can("audit.view") ? (
                            <Link
                                to="/admin/audit-logs"
                                className="adm-topbar-icon"
                                aria-label="Audit logs"
                                title="Audit"
                            >
                                <i className="fa-solid fa-clock-rotate-left" />
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
                                <span className="adm-avatar">A</span>

                                <span className="adm-profile-copy">
                                    <strong>Admin</strong>
                                </span>

                                <i className={`fa-solid fa-chevron-down ${profileOpen ? "rotate" : ""}`} />
                            </button>

                            {profileOpen ? (
                                <div className="adm-profile-menu">
                                    <div className="adm-profile-menu-head">
                                        <strong>
                                            {admin?.user?.email || "Account"}
                                        </strong>
                                        <small>
                                            {admin?.user?.is_super_admin
                                                ? "Super Admin"
                                                : admin?.roles?.[0]?.name || "Admin"}
                                        </small>
                                    </div>

                                    <Link to="/admin/profile">
                                        <i className="fa-regular fa-user" />
                                        My Account
                                    </Link>

                                    <Link to="/admin/settings">
                                        <i className="fa-solid fa-sliders" />
                                        Settings
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

                <main className="adm-content">
                    {children}
                </main>
            </section>
        </div>
    );
}
