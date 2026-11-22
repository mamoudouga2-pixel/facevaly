import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import SellerLayout from "./Layout";
import sellerSuiteService from "../../services/sellerSuiteService";

import {
    SellerSuiteCard,
    SellerSuiteEmpty,
    SellerSuiteHeader,
    SellerSuiteLoader,
    SellerSuiteStat,
    SellerSuiteToast,
    firstError,
    money,
    titleCase,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


const today = new Date();
const thirtyDaysAgo = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - 29
);

const dateValue = (date) =>
    date.toISOString().slice(0, 10);


export default function SellerReports() {
    const [filters, setFilters] = useState({
        date_from: dateValue(thirtyDaysAgo),
        date_to: dateValue(today),
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.reports(filters);
            setData(response.data || {});
        } catch (exception) {
            notify(firstError(exception, "Reports could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [filters, notify]);

    useEffect(() => {
        load();
    }, [load]);

    const maxStatus = useMemo(
        () =>
            Math.max(
                1,
                ...(data?.status_breakdown || []).map((row) =>
                    Number(row.count || 0)
                )
            ),
        [data]
    );

    if (loading && !data) {
        return (
            <SellerLayout>
                <SellerSuiteLoader text="Loading seller reports..." />
            </SellerLayout>
        );
    }

    const summary = data?.summary || {};

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Reports & Analytics"
                    description="Vendor-scoped sales, earnings, commissions, refunds, order statuses and top-selling product performance."
                    actions={
                        <button
                            type="button"
                            className="ss-btn"
                            onClick={load}
                        >
                            <i className="fa-solid fa-rotate-right" />
                            Refresh
                        </button>
                    }
                />

                <SellerSuiteCard>
                    <div className="ss-toolbar">
                        <label>
                            <span className="ss-form-hint">From</span>
                            <input
                                type="date"
                                className="ss-input"
                                value={filters.date_from}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        date_from: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label>
                            <span className="ss-form-hint">To</span>
                            <input
                                type="date"
                                className="ss-input"
                                value={filters.date_to}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        date_to: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    </div>
                </SellerSuiteCard>

                <div className="ss-stat-grid">
                    <SellerSuiteStat
                        icon="fa-solid fa-cart-shopping"
                        label="Orders"
                        value={summary.orders_total || 0}
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-money-bill-trend-up"
                        label="Gross Sales"
                        value={money(summary.gross_sales || 0)}
                        tone="green"
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-wallet"
                        label="Seller Earnings"
                        value={money(summary.vendor_earnings || 0)}
                        tone="blue"
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-arrow-rotate-left"
                        label="Refunds"
                        value={money(summary.refunds_total || 0)}
                        tone="red"
                    />
                </div>

                <SellerSuiteCard
                    title="Order Status Breakdown"
                    description={`Completed: ${summary.completed_orders || 0} · Cancelled: ${summary.cancelled_orders || 0} · Platform commission: ${money(summary.commission || 0)}`}
                >
                    {(data?.status_breakdown || []).length === 0 ? (
                        <SellerSuiteEmpty title="No orders in this date range" />
                    ) : (
                        <div className="ss-bars">
                            {data.status_breakdown.map((row) => (
                                <div className="ss-bar-row" key={row.status}>
                                    <strong>{titleCase(row.status)}</strong>
                                    <span className="ss-bar-track">
                                        <i
                                            style={{
                                                width: `${Math.max(
                                                    2,
                                                    Math.round(
                                                        (Number(row.count || 0) /
                                                            maxStatus) *
                                                            100
                                                    )
                                                )}%`,
                                            }}
                                        />
                                    </span>
                                    <strong>
                                        {row.count} · {money(row.total)}
                                    </strong>
                                </div>
                            ))}
                        </div>
                    )}
                </SellerSuiteCard>

                <SellerSuiteCard title="Daily Sales">
                    {(data?.daily || []).length === 0 ? (
                        <SellerSuiteEmpty title="No completed sales in this range" />
                    ) : (
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Orders</th>
                                        <th>Sales</th>
                                        <th>Seller Earnings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.daily.map((row) => (
                                        <tr key={row.date}>
                                            <td>{row.date}</td>
                                            <td>{row.orders}</td>
                                            <td>{money(row.sales)}</td>
                                            <td>{money(row.earnings)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SellerSuiteCard>

                <SellerSuiteCard title="Top Products">
                    {(data?.top_products || []).length === 0 ? (
                        <SellerSuiteEmpty title="No product sales found" />
                    ) : (
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Quantity Sold</th>
                                        <th>Sales</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.top_products.map((row) => (
                                        <tr
                                            key={`${row.product_id}-${row.sku || ""}`}
                                        >
                                            <td>
                                                <strong>{row.product_name}</strong>
                                            </td>
                                            <td>{row.sku || "—"}</td>
                                            <td>{row.quantity_sold}</td>
                                            <td>{money(row.sales)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SellerSuiteCard>
            </div>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
