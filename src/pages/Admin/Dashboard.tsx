import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import AdminLayout from "./Layout";
import adminService from "../../services/adminService";

import {
    AdminBadge,
    AdminCard,
    AdminEmpty,
    AdminLoader,
    AdminMetric,
    AdminPageHeader,
    firstError,
    formatDate,
    money,
} from "../../components/admin/AdminUI";

// নতুন ড্যাশবোর্ড CSS ইম্পোর্ট করা হলো
import "./dashboard.css";


function TrendChart({
    rows = [],
}) {
    const width = 800;
    const height = 260;
    const pad = {
        top: 18,
        right: 22,
        bottom: 36,
        left: 52,
    };

    const max = Math.max(
        1,
        ...rows.map((row) =>
            Math.max(
                Number(row.sales || 0),
                Number(row.commission || 0)
            )
        )
    );

    const innerWidth = width - pad.left - pad.right;
    const innerHeight = height - pad.top - pad.bottom;

    const points = (key) =>
        rows.map((row, index) => ({
            x: pad.left +
                (rows.length > 1
                    ? index / (rows.length - 1)
                    : 0.5) * innerWidth,
            y: pad.top +
                innerHeight -
                (Number(row[key] || 0) / max) * innerHeight,
        }));

    const sales = points("sales");
    const commission = points("commission");

    const path = (items) =>
        items
            .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
            .join(" ");

    const area = sales.length
        ? `${path(sales)} L ${sales[sales.length - 1].x} ${
            pad.top + innerHeight
        } L ${sales[0].x} ${pad.top + innerHeight} Z`
        : "";

    return (
        <div className="cus_admin_chart-scroll">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="cus_admin_chart"
            >
                {/* Gradient Definition for Area Chart */}
                <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255, 98, 13, 0.25)" />
                        <stop offset="100%" stopColor="rgba(255, 98, 13, 0.01)" />
                    </linearGradient>
                </defs>

                {[0, .25, .5, .75, 1].map((ratio) => {
                    const y = pad.top + innerHeight - ratio * innerHeight;

                    return (
                        <g key={ratio}>
                            <line
                                x1={pad.left}
                                y1={y}
                                x2={width - pad.right}
                                y2={y}
                                className="cus_admin_chart-grid"
                            />
                            <text
                                x={pad.left - 12}
                                y={y + 4}
                                textAnchor="end"
                                className="cus_admin_chart-axis"
                            >
                                {Math.round(max * ratio).toLocaleString(
                                    "en-BD",
                                    {
                                        notation: "compact",
                                        maximumFractionDigits: 1,
                                    }
                                )}
                            </text>
                        </g>
                    );
                })}

                {area && (
                    <path
                        d={area}
                        className="cus_admin_chart-area"
                        fill="url(#salesGradient)"
                    />
                )}

                <path
                    d={path(sales)}
                    className="cus_admin_chart-sales"
                />

                <path
                    d={path(commission)}
                    className="cus_admin_chart-commission"
                />

                {/* Data Points / Circles for sales */}
                {sales.map((point, index) => (
                    <circle
                        key={`circle-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r="3"
                        className="cus_admin_chart-point-sales"
                    />
                ))}

                {rows.map((row, index) => {
                    if (index % 2 !== 0 && index !== rows.length - 1) {
                        return null;
                    }

                    return (
                        <text
                            key={row.date}
                            x={sales[index]?.x || pad.left}
                            y={height - 5}
                            textAnchor="middle"
                            className="cus_admin_chart-axis"
                        >
                            {row.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}


function StatusBars({
    rows = [],
}) {
    const max = Math.max(
        1,
        ...rows.map((row) => Number(row.count || 0))
    );

    if (!rows.length) {
        return (
            <AdminEmpty
                title="No order status data"
            />
        );
    }

    return (
        <div className="cus_admin_bars">
            {rows.slice(0, 8).map((row) => (
                <div key={row.status} className="cus_admin_bar-item">
                    <div className="cus_admin_bar-head">
                        <span>{row.label}</span>
                        <strong>{row.count}</strong>
                    </div>

                    <span className="cus_admin_bar-track">
                        <i
                            style={{
                                width: `${Math.max(
                                    2,
                                    (Number(row.count || 0) / max) * 100
                                )}%`,
                            }}
                        />
                    </span>
                </div>
            ))}
        </div>
    );
}


export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        adminService
            .dashboard()
            .then((response) => {
                if (mounted) {
                    setData(response.data || {});
                }
            })
            .catch((exception) => {
                if (mounted) {
                    setError(firstError(exception));
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false);
                }
            });

        return () => {
            mounted = false;
        };
    }, []);

    const stats = data?.stats || {};

    const cards = useMemo(
        () => [
            {
                label: "Active Sellers",
                value: stats.vendors_active || 0,
                icon: "fa-solid fa-store",
                tone: "green",
                to: "/admin/sellers?status=active",
            },
            {
                label: "Pending Sellers",
                value: stats.vendors_pending || 0,
                icon: "fa-solid fa-user-clock",
                tone: "amber",
                to: "/admin/sellers?status=pending",
            },
            {
                label: "Total Products",
                value: stats.products_total || 0,
                icon: "fa-solid fa-boxes-stacked",
                tone: "blue",
                to: "/admin/products",
            },
            {
                label: "Pending Products",
                value: stats.products_pending || 0,
                icon: "fa-solid fa-hourglass-half",
                tone: "purple",
                to: "/admin/products?approval_status=pending",
            },
            {
                label: "Total Orders",
                value: stats.orders_total || 0,
                icon: "fa-solid fa-cart-shopping",
                tone: "orange",
                to: "/admin/orders",
            },
            {
                label: "Pending Orders",
                value: stats.orders_new || 0,
                icon: "fa-solid fa-clock",
                tone: "amber",
                to: "/admin/orders?status=pending",
            },
            {
                label: "Gross Sales",
                value: money(stats.gross_sales),
                icon: "fa-solid fa-money-bill-trend-up",
                tone: "green",
                to: "/admin/reports",
            },
            {
                label: "Commission",
                value: money(stats.platform_commission),
                icon: "fa-solid fa-percent",
                tone: "blue",
                to: "/admin/finance",
            },
            {
                label: "Pending Payouts",
                value: stats.withdrawals_pending || 0,
                icon: "fa-solid fa-money-bill-transfer",
                tone: "amber",
                to: "/admin/finance",
            },
            {
                label: "Pending Refunds",
                value: stats.refunds_pending || 0,
                icon: "fa-solid fa-rotate-left",
                tone: "red",
                to: "/admin/finance",
            },
            {
                label: "Customers",
                value: stats.customers_total || 0,
                icon: "fa-solid fa-users",
                tone: "blue",
                to: "/admin/customers",
            },
            {
                label: "Pending Reviews",
                value: stats.reviews_pending || 0,
                icon: "fa-solid fa-star",
                tone: "purple",
                to: "/admin/reviews",
            },
            {
                label: "Open Support",
                value: stats.support_open || 0,
                icon: "fa-solid fa-headset",
                tone: "orange",
                to: "/admin/support",
            },
        ],
        [stats]
    );

    if (loading) {
        return (
            <AdminLayout>
                <AdminLoader text="Loading marketplace dashboard..." />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Admin Dashboard"
                description="Marketplace-wide sellers, catalog, orders, finance and operational signals."
                actions={
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link
                            className="cus_admin_btn"
                            to="/admin/pricing"
                        >
                            <i className="fa-solid fa-tags" />
                            Price Control
                        </Link>

                        <Link
                            className="cus_admin_btn cus_admin_btn-primary"
                            to="/admin/products?approval_status=pending"
                        >
                            <i className="fa-solid fa-list-check" />
                            Pending Products
                        </Link>
                    </div>
                }
            />

            {error && (
                <div className="cus_admin_alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                </div>
            )}

            <div className="cus_admin_metric-grid">
                {cards.map((card) => (
                    <Link
                        to={card.to}
                        key={card.label}
                        style={{ textDecoration: "none" }}
                    >
                        <AdminMetric
                            icon={card.icon}
                            label={card.label}
                            value={card.value}
                            tone={card.tone}
                        />
                    </Link>
                ))}
            </div>

            <div className="cus_admin_two-col">
                <AdminCard
                    title="Marketplace Sales"
                    description="Last 14 days: gross sales and platform commission."
                    actions={
                        <Link
                            className="cus_admin_btn"
                            to="/admin/reports"
                        >
                            Full report
                        </Link>
                    }
                >
                    <TrendChart
                        rows={data?.analytics?.sales_trend || []}
                    />
                </AdminCard>

                <AdminCard
                    title="Order Status"
                    description="Current marketplace order distribution."
                >
                    <StatusBars
                        rows={data?.analytics?.order_status || []}
                    />
                </AdminCard>
            </div>

            <AdminCard
                title="Pending Seller Applications"
                actions={
                    <Link
                        className="cus_admin_btn"
                        to="/admin/sellers?status=pending"
                    >
                        All sellers
                    </Link>
                }
            >
                {!data?.recent_vendors?.length ? (
                    <AdminEmpty title="No sellers found" />
                ) : (
                    <div className="cus_admin_table-wrap">
                        <table className="cus_admin_table">
                            <thead>
                                <tr>
                                    <th>Seller</th>
                                    <th>Owner</th>
                                    <th>Status</th>
                                    <th>Products</th>
                                    <th>Orders</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>

                            <tbody>
                                {data.recent_vendors.map((row) => (
                                    <tr key={row.id}>
                                        <td data-label="Seller">
                                            <strong>{row.name}</strong>
                                            <span className="cus_admin_table-sub">
                                                {row.slug}
                                            </span>
                                        </td>
                                        <td data-label="Owner">
                                            {row.owner?.name || "—"}
                                            <span className="cus_admin_table-sub">
                                                {row.owner?.email || "—"}
                                            </span>
                                        </td>
                                        <td data-label="Status">
                                            <AdminBadge value={row.status} />
                                        </td>
                                        <td data-label="Products">
                                            {row.products_count || 0}
                                        </td>
                                        <td data-label="Orders">
                                            {row.orders_count || 0}
                                        </td>
                                        <td data-label="Joined">
                                            {formatDate(row.created_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminCard>

            <div className="cus_admin_two-col">
                <AdminCard
                    title="Products Awaiting Review"
                    actions={
                        <Link
                            className="cus_admin_btn"
                            to="/admin/products?approval_status=pending"
                        >
                            Review queue
                        </Link>
                    }
                >
                    {!data?.pending_products?.length ? (
                        <AdminEmpty title="No pending products" />
                    ) : (
                        <div className="cus_admin_table-wrap">
                            <table className="cus_admin_table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Seller</th>
                                        <th>Price</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.pending_products.map((row) => (
                                        <tr key={row.id}>
                                            <td data-label="Product">
                                                <strong>{row.name}</strong>
                                                <span className="cus_admin_table-sub">
                                                    {row.sku}
                                                </span>
                                            </td>
                                            <td data-label="Seller">
                                                {row.vendor || "—"}
                                            </td>
                                            <td data-label="Price">
                                                {money(
                                                    row.sale_price ??
                                                    row.regular_price
                                                )}
                                            </td>
                                            <td data-label="Submitted">
                                                {formatDate(row.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AdminCard>

                <AdminCard
                    title="Pending Withdrawals"
                    actions={
                        <Link
                            className="cus_admin_btn"
                            to="/admin/finance"
                        >
                            Finance
                        </Link>
                    }
                >
                    {!data?.pending_withdrawals?.length ? (
                        <AdminEmpty title="No pending withdrawals" />
                    ) : (
                        <div className="cus_admin_table-wrap">
                            <table className="cus_admin_table">
                                <thead>
                                    <tr>
                                        <th>Request</th>
                                        <th>Seller</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.pending_withdrawals.map((row) => (
                                        <tr key={row.id}>
                                            <td data-label="Request">
                                                <strong>
                                                    {row.withdrawal_number}
                                                </strong>
                                            </td>
                                            <td data-label="Seller">
                                                {row.vendor}
                                            </td>
                                            <td data-label="Amount">
                                                <span style={{ color: '#10b981', fontWeight: '600' }}>
                                                    {money(row.amount)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AdminCard>
            </div>
        </AdminLayout>
    );
}