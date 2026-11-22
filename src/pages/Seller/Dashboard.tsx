import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import SellerLayout from "./Layout";
import useSellerAuth from "../../hooks/useSellerAuth";
import sellerAuthService from "../../services/sellerAuthService";
import {
    mediaUrl,
} from "../../config/api";

import "./seller-dashboard.css";


/* =========================================================
   BASIC HELPERS
========================================================= */

const titleCase = (
    value = ""
) =>
    String(
        value || ""
    )
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            (
                character
            ) =>
                character.toUpperCase()
        );


const formatDate = (
    value
) => {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat(
            "en-BD",
            {
                timeZone:
                    "Asia/Dhaka",

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",
            }
        )
            .format(
                new Date(
                    value
                )
            );
    } catch {
        return String(
            value
        );
    }
};


const badgeClass = (
    status
) => {
    const value =
        String(
            status || ""
        )
            .toLowerCase();

    if (
        [
            "active",
            "approved",
            "paid",
            "delivered",
            "completed",
            "success",
            "in_stock",
            "verified",
        ]
            .includes(
                value
            )
    ) {
        return "sdb-badge sdb-badge-success";
    }

    if (
        [
            "pending",
            "pending_approval",
            "new_order",
            "processing",
            "confirmed",
            "ready_to_ship",
            "dispatched",
            "unpaid",
            "partial",
            "requested",
            "low_stock",
        ]
            .includes(
                value
            )
    ) {
        return "sdb-badge sdb-badge-warning";
    }

    if (
        [
            "rejected",
            "failed",
            "cancelled",
            "out_of_stock",
            "suspended",
            "blocked",
        ]
            .includes(
                value
            )
    ) {
        return "sdb-badge sdb-badge-danger";
    }

    return "sdb-badge sdb-badge-neutral";
};


/* =========================================================
   CLEAN CLICKABLE KPI CARD
========================================================= */

function MetricCard({
    to,
    icon,
    label,
    value,
    note = "",
    tone = "orange",
}) {
    return (
        <Link
            to={to}
            className={`sdb-metric-card sdb-tone-${tone}`}
        >
            <span className="sdb-metric-accent" />

            <div className="sdb-metric-top">
                <div className="sdb-metric-top-left">
                    <span className="sdb-metric-icon">
                        <i className={icon} />
                    </span>

                    <strong className="sdb-metric-value">
                        {value}
                    </strong>
                </div>

                <span className="sdb-metric-open">
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                </span>
            </div>

            <span className="sdb-metric-label">
                {label}
            </span>

            <small>
                {note}
            </small>
        </Link>
    );
}


/* =========================================================
   SALES + EARNINGS LINE GRAPH
========================================================= */

function SalesTrendChart({
    rows = [],
    money,
}) {
    const width =
        860;

    const height =
        285;

    const padding = {
        top:
            24,

        right:
            24,

        bottom:
            44,

        left:
            66,
    };

    const maxValue =
        Math.max(
            1,
            ...rows.map(
                (
                    row
                ) =>
                    Math.max(
                        Number(
                            row.sales || 0
                        ),
                        Number(
                            row.earnings || 0
                        )
                    )
            )
        );

    const innerWidth =
        width -
        padding.left -
        padding.right;

    const innerHeight =
        height -
        padding.top -
        padding.bottom;

    const pointsFor =
        (
            key
        ) =>
            rows.map(
                (
                    row,
                    index
                ) => {
                    const x =
                        padding.left +
                        (
                            rows.length > 1
                                ? index /
                                    (
                                        rows.length -
                                        1
                                    )
                                : 0.5
                        ) *
                            innerWidth;

                    const y =
                        padding.top +
                        innerHeight -
                        (
                            Number(
                                row[
                                    key
                                ] || 0
                            ) /
                            maxValue
                        ) *
                            innerHeight;

                    return {
                        x,
                        y,
                    };
                }
            );

    const salesPoints =
        pointsFor(
            "sales"
        );

    const earningPoints =
        pointsFor(
            "earnings"
        );

    const linePath =
        (
            points
        ) =>
            points
                .map(
                    (
                        point,
                        index
                    ) =>
                        `${
                            index === 0
                                ? "M"
                                : "L"
                        } ${point.x.toFixed(
                            2
                        )} ${point.y.toFixed(
                            2
                        )}`
                )
                .join(
                    " "
                );

    const salesArea =
        salesPoints.length
            ? `${linePath(
                salesPoints
            )} L ${
                salesPoints[
                    salesPoints.length -
                    1
                ].x
            } ${
                padding.top +
                innerHeight
            } L ${
                salesPoints[0].x
            } ${
                padding.top +
                innerHeight
            } Z`
            : "";

    const gridRatios = [
        0,
        0.25,
        0.5,
        0.75,
        1,
    ];

    const salesTotal =
        rows.reduce(
            (
                total,
                row
            ) =>
                total +
                Number(
                    row.sales || 0
                ),
            0
        );

    const earningsTotal =
        rows.reduce(
            (
                total,
                row
            ) =>
                total +
                Number(
                    row.earnings || 0
                ),
            0
        );

    return (
        <>
            <div className="sdb-chart-summary">
                <div>
                    <span>
                        14-Day Sales
                    </span>

                    <strong>
                        {money(
                            salesTotal
                        )}
                    </strong>
                </div>

                <div>
                    <span>
                        Seller Earnings
                    </span>

                    <strong>
                        {money(
                            earningsTotal
                        )}
                    </strong>
                </div>

                <div className="sdb-chart-legend">
                    <span>
                        <i className="sales" />
                        Sales
                    </span>

                    <span>
                        <i className="earnings" />
                        Earnings
                    </span>
                </div>
            </div>

            <div className="sdb-chart-scroll">
                <svg
                    className="sdb-line-chart"
                    viewBox={`0 0 ${width} ${height}`}
                    role="img"
                    aria-label="Sales and seller earnings over the last 14 days"
                >
                    {gridRatios.map(
                        (
                            ratio
                        ) => {
                            const y =
                                padding.top +
                                innerHeight -
                                ratio *
                                    innerHeight;

                            return (
                                <g
                                    key={
                                        ratio
                                    }
                                >
                                    <line
                                        x1={
                                            padding.left
                                        }
                                        y1={
                                            y
                                        }
                                        x2={
                                            width -
                                            padding.right
                                        }
                                        y2={
                                            y
                                        }
                                        className="sdb-chart-grid-line"
                                    />

                                    <text
                                        x={
                                            padding.left -
                                            12
                                        }
                                        y={
                                            y +
                                            4
                                        }
                                        textAnchor="end"
                                        className="sdb-chart-axis"
                                    >
                                        {Math.round(
                                            maxValue *
                                            ratio
                                        )
                                            .toLocaleString(
                                                "en-BD",
                                                {
                                                    notation:
                                                        "compact",

                                                    maximumFractionDigits:
                                                        1,
                                                }
                                            )}
                                    </text>
                                </g>
                            );
                        }
                    )}

                    {salesArea && (
                        <path
                            d={
                                salesArea
                            }
                            className="sdb-sales-area"
                        />
                    )}

                    <path
                        d={
                            linePath(
                                salesPoints
                            )
                        }
                        className="sdb-chart-line sdb-chart-line-sales"
                    />

                    <path
                        d={
                            linePath(
                                earningPoints
                            )
                        }
                        className="sdb-chart-line sdb-chart-line-earnings"
                    />

                    {salesPoints.map(
                        (
                            point,
                            index
                        ) => (
                            <g
                                key={`sales-${index}`}
                            >
                                <circle
                                    cx={
                                        point.x
                                    }
                                    cy={
                                        point.y
                                    }
                                    r="5"
                                    className="sdb-chart-point sdb-chart-point-sales"
                                />

                                <title>
                                    {rows[
                                        index
                                    ]?.label}
                                    {" · "}
                                    Sales:{" "}
                                    {money(
                                        rows[
                                            index
                                        ]?.sales
                                    )}
                                </title>
                            </g>
                        )
                    )}

                    {earningPoints.map(
                        (
                            point,
                            index
                        ) => (
                            <g
                                key={`earnings-${index}`}
                            >
                                <circle
                                    cx={
                                        point.x
                                    }
                                    cy={
                                        point.y
                                    }
                                    r="4.5"
                                    className="sdb-chart-point sdb-chart-point-earnings"
                                />

                                <title>
                                    {rows[
                                        index
                                    ]?.label}
                                    {" · "}
                                    Earnings:{" "}
                                    {money(
                                        rows[
                                            index
                                        ]?.earnings
                                    )}
                                </title>
                            </g>
                        )
                    )}

                    {rows.map(
                        (
                            row,
                            index
                        ) => {
                            if (
                                index % 2 !== 0 &&
                                index !==
                                    rows.length -
                                        1
                            ) {
                                return null;
                            }

                            return (
                                <text
                                    key={
                                        row.date
                                    }
                                    x={
                                        salesPoints[
                                            index
                                        ]?.x ||
                                        padding.left
                                    }
                                    y={
                                        height -
                                        15
                                    }
                                    textAnchor="middle"
                                    className="sdb-chart-axis"
                                >
                                    {
                                        row.label
                                    }
                                </text>
                            );
                        }
                    )}
                </svg>
            </div>
        </>
    );
}


/* =========================================================
   ORDER STATUS DONUT GRAPH
========================================================= */

const DONUT_COLORS = [
    "#ff620d",
    "#2563eb",
    "#10b981",
    "#7c3aed",
    "#e11d48",
    "#d97706",
    "#0891b2",
    "#64748b",
];


function OrderStatusDonut({
    rows = [],
}) {
    const total =
        rows.reduce(
            (
                sum,
                row
            ) =>
                sum +
                Number(
                    row.count || 0
                ),
            0
        );

    const radius =
        62;

    const circumference =
        2 *
        Math.PI *
        radius;

    let offset =
        0;

    if (!total) {
        return (
            <div className="sdb-empty-mini">
                No order status data yet.
            </div>
        );
    }

    return (
        <div className="sdb-donut-layout">
            <div className="sdb-donut-wrap">
                <svg
                    viewBox="0 0 180 180"
                    className="sdb-donut"
                    role="img"
                    aria-label="Order status distribution"
                >
                    <circle
                        cx="90"
                        cy="90"
                        r={
                            radius
                        }
                        className="sdb-donut-base"
                    />

                    {rows
                        .slice(
                            0,
                            8
                        )
                        .map(
                            (
                                row,
                                index
                            ) => {
                                const value =
                                    Number(
                                        row.count || 0
                                    );

                                const length =
                                    (
                                        value /
                                        total
                                    ) *
                                    circumference;

                                const dashOffset =
                                    -offset;

                                offset +=
                                    length;

                                return (
                                    <circle
                                        key={
                                            row.status
                                        }
                                        cx="90"
                                        cy="90"
                                        r={
                                            radius
                                        }
                                        fill="none"
                                        stroke={
                                            DONUT_COLORS[
                                                index %
                                                DONUT_COLORS.length
                                            ]
                                        }
                                        strokeWidth="18"
                                        strokeLinecap="butt"
                                        strokeDasharray={`${length} ${
                                            circumference -
                                            length
                                        }`}
                                        strokeDashoffset={
                                            dashOffset
                                        }
                                        transform="rotate(-90 90 90)"
                                    >
                                        <title>
                                            {
                                                row.label
                                            }
                                            :{" "}
                                            {
                                                row.count
                                            }
                                        </title>
                                    </circle>
                                );
                            }
                        )}

                    <text
                        x="90"
                        y="84"
                        textAnchor="middle"
                        className="sdb-donut-total"
                    >
                        {
                            total
                        }
                    </text>

                    <text
                        x="90"
                        y="103"
                        textAnchor="middle"
                        className="sdb-donut-caption"
                    >
                        Orders
                    </text>
                </svg>
            </div>

            <div className="sdb-donut-legend">
                {rows
                    .slice(
                        0,
                        8
                    )
                    .map(
                        (
                            row,
                            index
                        ) => (
                            <div
                                key={
                                    row.status
                                }
                            >
                                <span
                                    className="sdb-donut-dot"
                                    style={{
                                        background:
                                            DONUT_COLORS[
                                                index %
                                                DONUT_COLORS.length
                                            ],
                                    }}
                                />

                                <span>
                                    {
                                        row.label
                                    }
                                </span>

                                <strong>
                                    {
                                        row.count
                                    }
                                </strong>
                            </div>
                        )
                    )}
            </div>
        </div>
    );
}


/* =========================================================
   TOP PRODUCT BARS
========================================================= */

function TopProductsChart({
    rows = [],
    money,
}) {
    const max =
        Math.max(
            1,
            ...rows.map(
                (
                    row
                ) =>
                    Number(
                        row.quantity_sold || 0
                    )
            )
        );

    if (!rows.length) {
        return (
            <div className="sdb-empty-mini">
                No completed product sales in the last 30 days.
            </div>
        );
    }

    return (
        <div className="sdb-top-products">
            {rows.map(
                (
                    row,
                    index
                ) => {
                    const percent =
                        Math.max(
                            4,
                            Math.round(
                                (
                                    Number(
                                        row.quantity_sold || 0
                                    ) /
                                    max
                                ) *
                                    100
                            )
                        );

                    return (
                        <div
                            className="sdb-top-product-row"
                            key={`${row.product_id}-${index}`}
                        >
                            <span className="sdb-rank">
                                {
                                    index +
                                    1
                                }
                            </span>

                            <div className="sdb-top-product-main">
                                <div className="sdb-top-product-head">
                                    <div>
                                        <strong>
                                            {
                                                row.product_name
                                            }
                                        </strong>

                                        <span>
                                            {
                                                row.sku ||
                                                "No SKU"
                                            }
                                        </span>
                                    </div>

                                    <div>
                                        <strong>
                                            {
                                                row.quantity_sold
                                            }{" "}
                                            sold
                                        </strong>

                                        <span>
                                            {
                                                money(
                                                    row.sales
                                                )
                                            }
                                        </span>
                                    </div>
                                </div>

                                <span className="sdb-product-track">
                                    <i
                                        style={{
                                            width:
                                                `${percent}%`,
                                        }}
                                    />
                                </span>
                            </div>
                        </div>
                    );
                }
            )}
        </div>
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

export default function SellerDashboard() {
    const {
        seller,
    } =
        useSellerAuth();

    const [
        dashboard,
        setDashboard,
    ] =
        useState(null);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    useEffect(
        () => {
            let mounted =
                true;

            const load =
                async () => {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );

                    try {
                        const response =
                            await sellerAuthService
                                .dashboard();

                        if (
                            mounted
                        ) {
                            setDashboard(
                                response?.data ||
                                {}
                            );
                        }
                    } catch (
                        exception
                    ) {
                        if (
                            mounted
                        ) {
                            setError(
                                exception
                                    ?.response
                                    ?.data
                                    ?.message ||
                                exception
                                    ?.message ||
                                "Dashboard data could not be loaded."
                            );
                        }
                    } finally {
                        if (
                            mounted
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                };

            load();

            return () => {
                mounted =
                    false;
            };
        },
        []
    );

    const vendor =
        dashboard?.vendor ||
        seller?.vendor ||
        {};

    const membership =
        dashboard?.membership ||
        seller?.membership ||
        {};

    const stats =
        dashboard?.stats ||
        {};

    const wallet =
        dashboard?.wallet ||
        {};

    const analytics =
        dashboard?.analytics ||
        {};

    const recentOrders =
        Array.isArray(
            dashboard?.recent_orders
        )
            ? dashboard.recent_orders
            : [];

    const lowStock =
        Array.isArray(
            dashboard?.low_stock
        )
            ? dashboard.low_stock
            : [];

    const currency =
        wallet.currency ||
        vendor.currency ||
        "BDT";

    const numberFormatter =
        useMemo(
            () =>
                new Intl.NumberFormat(
                    "en-BD",
                    {
                        maximumFractionDigits:
                            2,
                    }
                ),
            []
        );

    const currencyFormatter =
        useMemo(
            () => {
                try {
                    return new Intl.NumberFormat(
                        "en-BD",
                        {
                            style:
                                "currency",

                            currency,

                            minimumFractionDigits:
                                0,

                            maximumFractionDigits:
                                2,
                        }
                    );
                } catch {
                    return null;
                }
            },
            [
                currency,
            ]
        );

    const money =
        (
            value
        ) => {
            const amount =
                Number(
                    value || 0
                );

            if (
                currencyFormatter
            ) {
                return currencyFormatter
                    .format(
                        amount
                    );
            }

            return `৳${numberFormatter.format(
                amount
            )}`;
        };

    const permissionSet =
        useMemo(
            () => {
                if (
                    membership?.is_owner
                ) {
                    return new Set([
                        "*",
                    ]);
                }

                const permissions =
                    membership?.permissions ||
                    [];

                if (
                    Array.isArray(
                        permissions
                    )
                ) {
                    return new Set(
                        permissions
                    );
                }

                return new Set(
                    Object.keys(
                        permissions
                    )
                        .filter(
                            (
                                key
                            ) =>
                                Boolean(
                                    permissions[
                                        key
                                    ]
                                )
                        )
                );
            },
            [
                membership?.is_owner,
                membership?.permissions,
            ]
        );

    const can =
        (
            permission
        ) =>
            !permission ||
            permissionSet.has(
                "*"
            ) ||
            permissionSet.has(
                permission
            );

    const cards =
        [
            {
                label:
                    "Total Products",
                value:
                    numberFormatter.format(
                        stats.products_total ||
                        0
                    ),
                icon:
                    "fa-solid fa-box-open",
                to:
                    "/seller/products",
                tone:
                    "orange",
                note:
                    "Entire catalog",
                permission:
                    "products.manage",
            },
            {
                label:
                    "Live Products",
                value:
                    numberFormatter.format(
                        stats.products_live ||
                        0
                    ),
                icon:
                    "fa-solid fa-store",
                to:
                    "/seller/products?published=1",
                tone:
                    "teal",
                note:
                    "Approved & published",
                permission:
                    "products.manage",
            },
            {
                label:
                    "Available Balance",
                value:
                    money(
                        wallet.available_balance
                    ),
                icon:
                    "fa-solid fa-wallet",
                to:
                    "/seller/wallet",
                tone:
                    "lime",
                note:
                    `Pending ${money(
                        wallet.pending_balance
                    )}`,
                permission:
                    "wallet.view",
            },
            {
                label:
                    "Pending Approval",
                value:
                    numberFormatter.format(
                        stats.products_pending ||
                        0
                    ),
                icon:
                    "fa-solid fa-hourglass-half",
                to:
                    "/seller/products?approval_status=pending",
                tone:
                    "purple",
                note:
                    "Waiting review",
                permission:
                    "products.manage",
            },
            {
                label:
                    "Total Orders",
                value:
                    numberFormatter.format(
                        stats.orders_total ||
                        0
                    ),
                icon:
                    "fa-solid fa-cart-shopping",
                to:
                    "/seller/orders",
                tone:
                    "blue",
                note:
                    "All seller orders",
                permission:
                    "orders.manage",
            },
            {
                label:
                    "Confirmed Orders",
                value:
                    numberFormatter.format(
                        stats.orders_new ||
                        0
                    ),
                icon:
                    "fa-solid fa-bag-shopping",
                to:
                    "/seller/orders?status=confirmed",
                tone:
                    "pink",
                note:
                    "Awaiting fulfillment",
                permission:
                    "orders.manage",
            },
            {
                label:
                    "Processing",
                value:
                    numberFormatter.format(
                        stats.orders_processing ||
                        0
                    ),
                icon:
                    "fa-solid fa-gears",
                to:
                    "/seller/orders?status=processing",
                tone:
                    "indigo",
                note:
                    "Confirmed to courier",
                permission:
                    "orders.manage",
            },
            {
                label:
                    "Completed",
                value:
                    numberFormatter.format(
                        stats.orders_completed ||
                        0
                    ),
                icon:
                    "fa-solid fa-circle-check",
                to:
                    "/seller/orders?status=completed",
                tone:
                    "green",
                note:
                    `${numberFormatter.format(
                        stats.orders_cancelled ||
                        0
                    )} cancelled`,
                permission:
                    "orders.manage",
            },
            {
                label:
                    "Customers",
                value:
                    numberFormatter.format(
                        stats.customers_total ||
                        0
                    ),
                icon:
                    "fa-solid fa-users",
                to:
                    "/seller/customers",
                tone:
                    "cyan",
                note:
                    "Unique store customers",
                permission:
                    "customers.view",
            },
            {
                label:
                    "Returns",
                value:
                    numberFormatter.format(
                        stats.returns_open ||
                        0
                    ),
                icon:
                    "fa-solid fa-rotate-left",
                to:
                    "/seller/returns",
                tone:
                    "amber",
                note:
                    "Open requests",
                permission:
                    "returns.view",
            },
            {
                label:
                    "Seller Earnings",
                value:
                    money(
                        stats.vendor_earnings
                    ),
                icon:
                    "fa-solid fa-sack-dollar",
                to:
                    "/seller/wallet",
                tone:
                    "navy",
                note:
                    "After marketplace deductions",
                permission:
                    "wallet.view",
            },
            {
                label:
                    "Today's Sales",
                value:
                    money(
                        stats.today_sales
                    ),
                icon:
                    "fa-solid fa-bolt",
                to:
                    "/seller/reports",
                tone:
                    "orange",
                note:
                    `${numberFormatter.format(
                        stats.today_orders ||
                        0
                    )} orders today`,
                permission:
                    "reports.view",
            },
        ]
            .filter(
                (
                    card
                ) =>
                    can(
                        card.permission
                    )
            );

    const quickActions =
        [
            {
                to:
                    "/seller/products/create",
                icon:
                    "fa-solid fa-plus",
                label:
                    "Add Product",
                permission:
                    "products.manage",
            },
            {
                to:
                    "/seller/orders",
                icon:
                    "fa-solid fa-cart-shopping",
                label:
                    "Manage Orders",
                permission:
                    "orders.manage",
            },
            {
                to:
                    "/seller/inventory",
                icon:
                    "fa-solid fa-warehouse",
                label:
                    "Adjust Stock",
                permission:
                    "inventory.manage",
            },
            {
                to:
                    "/seller/promotions",
                icon:
                    "fa-solid fa-tags",
                label:
                    "Create Promotion",
                permission:
                    "promotions.manage",
            },
            {
                to:
                    "/seller/wallet",
                icon:
                    "fa-solid fa-money-bill-transfer",
                label:
                    "Request Payout",
                permission:
                    "wallet.manage",
            },
            {
                to:
                    "/seller/returns",
                icon:
                    "fa-solid fa-rotate-left",
                label:
                    "Review Returns",
                permission:
                    "returns.manage",
            },
            {
                to:
                    "/seller/store",
                icon:
                    "fa-solid fa-store",
                label:
                    "Store Settings",
                permission:
                    "store.manage",
            },
            {
                to:
                    "/seller/support",
                icon:
                    "fa-solid fa-headset",
                label:
                    "Seller Support",
                permission:
                    "support.view",
            },
        ]
            .filter(
                (
                    action
                ) =>
                    can(
                        action.permission
                    )
            );

    if (
        loading &&
        !dashboard
    ) {
        return (
            <SellerLayout>
                <div className="sdb-loading">
                    <div className="sdb-spinner" />

                    <strong>
                        Loading seller dashboard...
                    </strong>
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="sdb-page">

                {error && (
                    <div className="sdb-error">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error}
                    </div>
                )}


                {/* =================================================
                    FACEVALY SELLER CENTER HERO BANNER (MATCHING DESIGN 100%)
                ================================================= */}

                <section className="sdb-hero-banner">
                    {/* Decorative Background Shapes */}
                    <div className="sdb-hero-bg-shapes">
                        <div className="sdb-hero-wave-glow" />
                        <div className="sdb-hero-dots-grid">
                            <span /><span /><span /><span />
                            <span /><span /><span /><span />
                            <span /><span /><span /><span />
                        </div>
                        <div className="sdb-hero-sparkle">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                                <path d="M12 2C12 7.5 16.5 12 22 12C16.5 12 12 16.5 12 22C12 16.5 7.5 12 2 12C7.5 12 12 7.5 12 2Z" fill="#fb923c" fillOpacity="0.4" />
                            </svg>
                        </div>
                    </div>

                    {/* Banner Main Section */}
                    <div className="sdb-hero-body">
                        <div className="sdb-hero-content">
                            <div className="sdb-hero-headings">
                                <h1 className="sdb-hero-brand-name">Facevaly</h1>
                                <h2 className="sdb-hero-center-name">Seller Center</h2>
                            </div>

                            <p className="sdb-hero-bengali-tagline">
                                সহজে বিক্রি করুন, বাড়ুক আপনার ব্যবসা
                            </p>

                            <div className="sdb-hero-accent-bar" />
                        </div>

                        <div className="sdb-hero-illustration">
                            <img
                                src="/img/seller-hero-illustration.png"
                                alt="Facevaly Seller Center Store"
                                className="sdb-hero-img"
                            />
                        </div>
                    </div>

                    {/* Bottom Action Cards: Add Product & Orders */}
                    <div className="sdb-hero-action-cards">
                        <Link
                            to="/seller/products/create"
                            className="sdb-hero-action-card sdb-hero-action-primary"
                        >
                            <span className="sdb-action-icon-circle">
                                <i className="fa-solid fa-plus" />
                            </span>

                            <div className="sdb-action-text-group">
                                <strong className="sdb-action-heading">
                                    Add Product
                                </strong>
                                <span className="sdb-action-subheading">
                                    নতুন প্রোডাক্ট যোগ করুন
                                </span>
                            </div>
                        </Link>

                        <Link
                            to="/seller/orders"
                            className="sdb-hero-action-card sdb-hero-action-secondary"
                        >
                            <span className="sdb-action-icon-circle">
                                <i className="fa-solid fa-cart-shopping" />
                            </span>

                            <div className="sdb-action-text-group">
                                <strong className="sdb-action-heading">
                                    Orders
                                </strong>
                                <span className="sdb-action-subheading">
                                    অর্ডারগুলো দেখুন
                                </span>
                            </div>
                        </Link>
                    </div>
                </section>


                {/* =================================================
                    KPI CARDS / BUSINESS OVERVIEW (Desktop View)
                ================================================= */}

                <section className="sdb-business-overview-section">
                    <div className="sdb-section-heading">
                        <div>
                            <h2>
                                Business Overview
                            </h2>

                            <p>
                                Click a card to open the related
                                seller module.
                            </p>
                        </div>

                        <span>
                            {
                                cards.length
                            } metrics
                        </span>
                    </div>

                    <div className="sdb-metric-grid">
                        {cards.map(
                            (
                                card
                            ) => (
                                <MetricCard
                                    key={
                                        card.label
                                    }
                                    {...card}
                                />
                            )
                        )}
                    </div>
                </section>


                {/* =================================================
                    QUICK ACTIONS
                ================================================= */}

                {quickActions.length >
                    0 && (
                    <section className="sdb-panel">
                        <div className="sdb-panel-header">
                            <div>
                                <h2>
                                    Quick Actions
                                </h2>

                                <p>
                                    Common seller tasks.
                                </p>
                            </div>
                        </div>

                        <div className="sdb-quick-grid">
                            {quickActions.map(
                                (
                                    action
                                ) => (
                                    <Link
                                        to={
                                            action.to
                                        }
                                        key={
                                            action.label
                                        }
                                        className="sdb-quick-action"
                                    >
                                        <span>
                                            <i
                                                className={
                                                    action.icon
                                                }
                                            />
                                        </span>

                                        <strong>
                                            {
                                                action.label
                                            }
                                        </strong>

                                        <i className="fa-solid fa-chevron-right" />
                                    </Link>
                                )
                            )}
                        </div>
                    </section>
                )}


                {/* =================================================
                    SALES GRAPH + DONUT
                ================================================= */}

                <section className="sdb-analytics-grid">
                    <article className="sdb-panel sdb-sales-panel">
                        <div className="sdb-panel-header">
                            <div>
                                <h2>
                                    Sales & Earnings
                                </h2>

                                <p>
                                    Last 14 days · completed and
                                    delivered orders.
                                </p>
                            </div>

                            {can(
                                "reports.view"
                            ) && (
                                <Link
                                    to="/seller/reports"
                                    className="sdb-panel-link"
                                >
                                    Reports
                                    <i className="fa-solid fa-arrow-right" />
                                </Link>
                            )}
                        </div>

                        <div className="sdb-panel-body">
                            <SalesTrendChart
                                rows={
                                    analytics.sales_trend ||
                                    []
                                }
                                money={
                                    money
                                }
                            />
                        </div>
                    </article>

                    <article className="sdb-panel">
                        <div className="sdb-panel-header">
                            <div>
                                <h2>
                                    Order Status
                                </h2>

                                <p>
                                    Current distribution.
                                </p>
                            </div>

                            {can(
                                "orders.manage"
                            ) && (
                                <Link
                                    to="/seller/orders"
                                    className="sdb-panel-link"
                                >
                                    View orders
                                </Link>
                            )}
                        </div>

                        <div className="sdb-panel-body">
                            <OrderStatusDonut
                                rows={
                                    analytics.order_status ||
                                    []
                                }
                            />
                        </div>
                    </article>
                </section>


                {/* =================================================
                    TOP PRODUCT GRAPH
                ================================================= */}

                <section className="sdb-panel">
                    <div className="sdb-panel-header">
                        <div>
                            <h2>
                                Top Products
                            </h2>

                            <p>
                                Highest quantities sold in the last
                                30 days.
                            </p>
                        </div>

                        {can(
                            "reports.view"
                        ) && (
                            <Link
                                to="/seller/reports"
                                className="sdb-panel-link"
                            >
                                Full analytics
                                <i className="fa-solid fa-arrow-right" />
                            </Link>
                        )}
                    </div>

                    <div className="sdb-panel-body">
                        <TopProductsChart
                            rows={
                                analytics.top_products ||
                                []
                            }
                            money={
                                money
                            }
                        />
                    </div>
                </section>


                {/* =================================================
                    RECENT ORDERS
                ================================================= */}

                {can(
                    "orders.manage"
                ) && (
                    <section className="sdb-panel">
                        <div className="sdb-panel-header">
                            <div>
                                <h2>
                                    Recent Orders
                                </h2>

                                <p>
                                    Latest seller orders.
                                </p>
                            </div>

                            <Link
                                to="/seller/orders"
                                className="sdb-panel-link"
                            >
                                View all
                                <i className="fa-solid fa-arrow-right" />
                            </Link>
                        </div>

                        <div className="sdb-table-shell">
                            {!recentOrders.length ? (
                                <div className="sdb-empty">
                                    <i className="fa-solid fa-cart-shopping" />

                                    <strong>
                                        No seller orders yet.
                                    </strong>
                                </div>
                            ) : (
                                <table className="sdb-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                Order
                                            </th>
                                            <th>
                                                Customer
                                            </th>
                                            <th>
                                                Items
                                            </th>
                                            <th>
                                                Total
                                            </th>
                                            <th>
                                                Earning
                                            </th>
                                            <th>
                                                Payment
                                            </th>
                                            <th>
                                                Status
                                            </th>
                                            <th>
                                                Date
                                            </th>
                                            <th />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {recentOrders.map(
                                            (
                                                order
                                            ) => (
                                                <tr
                                                    key={
                                                        order.id
                                                    }
                                                >
                                                    <td
                                                        data-label="Order"
                                                    >
                                                        <div className="sdb-order-cell">
                                                            <span className="sdb-row-icon">
                                                                <i className="fa-solid fa-bag-shopping" />
                                                            </span>

                                                            <div>
                                                                <strong>
                                                                    {
                                                                        order.vendor_order_number
                                                                    }
                                                                </strong>

                                                                <small>
                                                                    {
                                                                        order.parent_order_number ||
                                                                        "—"
                                                                    }
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td
                                                        data-label="Customer"
                                                    >
                                                        <strong>
                                                            {
                                                                order.customer_name ||
                                                                "Guest"
                                                            }
                                                        </strong>

                                                        <small>
                                                            {
                                                                order.customer_phone ||
                                                                "—"
                                                            }
                                                        </small>
                                                    </td>

                                                    <td
                                                        data-label="Items"
                                                    >
                                                        {
                                                            order.items_count ||
                                                            0
                                                        }
                                                    </td>

                                                    <td
                                                        data-label="Total"
                                                    >
                                                        <strong>
                                                            {
                                                                money(
                                                                    order.total_amount
                                                                )
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td
                                                        data-label="Earning"
                                                    >
                                                        {
                                                            money(
                                                                order.vendor_earning
                                                            )
                                                        }
                                                    </td>

                                                    <td
                                                        data-label="Payment"
                                                    >
                                                        <span
                                                            className={
                                                                badgeClass(
                                                                    order.payment_status
                                                                )
                                                            }
                                                        >
                                                            {
                                                                titleCase(
                                                                    order.payment_status
                                                                )
                                                            }
                                                        </span>
                                                    </td>

                                                    <td
                                                        data-label="Status"
                                                    >
                                                        <span
                                                            className={
                                                                badgeClass(
                                                                    order.status
                                                                )
                                                            }
                                                        >
                                                            {
                                                                titleCase(
                                                                    order.status
                                                                )
                                                            }
                                                        </span>
                                                    </td>

                                                    <td
                                                        data-label="Date"
                                                    >
                                                        {
                                                            formatDate(
                                                                order.created_at
                                                            )
                                                        }
                                                    </td>

                                                    <td
                                                        data-label="Action"
                                                    >
                                                        <Link
                                                            to="/seller/orders"
                                                            className="sdb-icon-button"
                                                            aria-label="Open order management"
                                                        >
                                                            <i className="fa-solid fa-arrow-right" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                )}


                {/* =================================================
                    LOW STOCK
                ================================================= */}

                {can(
                    "inventory.view"
                ) && (
                    <section className="sdb-panel">
                        <div className="sdb-panel-header">
                            <div>
                                <h2>
                                    Low Stock
                                </h2>

                                <p>
                                    Items at or below the configured
                                    stock alert level.
                                </p>
                            </div>

                            <Link
                                to="/seller/inventory?low_stock=1"
                                className="sdb-panel-link"
                            >
                                Inventory
                                <i className="fa-solid fa-arrow-right" />
                            </Link>
                        </div>

                        <div className="sdb-table-shell">
                            {!lowStock.length ? (
                                <div className="sdb-empty sdb-empty-success">
                                    <i className="fa-solid fa-circle-check" />

                                    <strong>
                                        Stock levels look good.
                                    </strong>
                                </div>
                            ) : (
                                <table className="sdb-table sdb-stock-table">
                                    <thead>
                                        <tr>
                                            <th>
                                                Product
                                            </th>
                                            <th>
                                                SKU
                                            </th>
                                            <th>
                                                Current
                                            </th>
                                            <th>
                                                Alert At
                                            </th>
                                            <th>
                                                Availability
                                            </th>
                                            <th />
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {lowStock.map(
                                            (
                                                row
                                            ) => (
                                                <tr
                                                    key={
                                                        row.key
                                                    }
                                                >
                                                    <td
                                                        data-label="Product"
                                                    >
                                                        <div className="sdb-product-cell">
                                                            <span className="sdb-product-image">
                                                                {row.image ? (
                                                                    <img
                                                                        src={
                                                                            mediaUrl(
                                                                                row.image
                                                                            )
                                                                        }
                                                                        alt={
                                                                            row.name
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <i className="fa-regular fa-image" />
                                                                )}
                                                            </span>

                                                            <div>
                                                                <strong>
                                                                    {
                                                                        row.name
                                                                    }
                                                                </strong>

                                                                {row.variant_name && (
                                                                    <small>
                                                                        {
                                                                            row.variant_name
                                                                        }
                                                                    </small>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td
                                                        data-label="SKU"
                                                    >
                                                        {
                                                            row.sku ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td
                                                        data-label="Current"
                                                    >
                                                        <strong className="sdb-danger-text">
                                                            {
                                                                row.stock_quantity
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td
                                                        data-label="Alert At"
                                                    >
                                                        {
                                                            row.stock_alert_quantity
                                                        }
                                                    </td>

                                                    <td
                                                        data-label="Availability"
                                                    >
                                                        <span
                                                            className={
                                                                badgeClass(
                                                                    row.availability
                                                                )
                                                            }
                                                        >
                                                            {
                                                                titleCase(
                                                                    row.availability
                                                                )
                                                            }
                                                        </span>
                                                    </td>

                                                    <td
                                                        data-label="Action"
                                                    >
                                                        <Link
                                                            to="/seller/inventory?low_stock=1"
                                                            className="sdb-icon-button"
                                                            aria-label="Open inventory"
                                                        >
                                                            <i className="fa-solid fa-sliders" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                )}
            </div>
        </SellerLayout>
    );
}
