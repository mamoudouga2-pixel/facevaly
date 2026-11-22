import {
    useCallback,
    useEffect,
    useState,
} from "react";

import SellerLayout from "./Layout";
import sellerSuiteService from "../../services/sellerSuiteService";

import {
    SellerSuiteCard,
    SellerSuiteEmpty,
    SellerSuiteHeader,
    SellerSuiteLoader,
    firstError,
    formatDate,
    money,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


export default function SellerCustomers() {
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filters, setFilters] = useState({
        q: "",
        page: 1,
        per_page: 25,
    });

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await sellerSuiteService.customers(filters);
            setRows(response.data || []);
            setMeta(response.meta || {});
        } catch (exception) {
            setError(firstError(exception, "Customer list could not be loaded."));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Customers"
                    description="Customers are generated only from orders placed with your store. No other vendor's customer data is exposed."
                />

                <SellerSuiteCard>
                    <form
                        className="ss-toolbar"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setFilters((current) => ({
                                ...current,
                                page: 1,
                            }));
                        }}
                    >
                        <div className="ss-search ss-grow">
                            <i className="fa-solid fa-magnifying-glass" />
                            <input
                                placeholder="Search name, phone or email..."
                                value={filters.q}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        q: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <button type="submit" className="ss-btn ss-btn-primary">
                            Search
                        </button>
                    </form>

                    {error && (
                        <div className="ss-alert ss-alert-error">
                            <i className="fa-solid fa-circle-exclamation" />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <SellerSuiteLoader text="Loading customers..." />
                    ) : rows.length === 0 ? (
                        <SellerSuiteEmpty
                            icon="fa-solid fa-users"
                            title="No customers found"
                            description="Customers will appear after orders are associated with this seller."
                        />
                    ) : (
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Address</th>
                                        <th>Orders</th>
                                        <th>Completed</th>
                                        <th>Cancelled</th>
                                        <th>Total Spend</th>
                                        <th>Seller Earnings</th>
                                        <th>Last Order</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.key}>
                                            <td>
                                                <strong>{row.name || "Guest"}</strong>
                                                <span className="ss-table-sub">
                                                    {row.phone || row.email || "No contact"}
                                                </span>
                                            </td>
                                            <td>
                                                {row.address || "—"}
                                                <span className="ss-table-sub">
                                                    {[row.thana, row.district]
                                                        .filter(Boolean)
                                                        .join(", ")}
                                                </span>
                                            </td>
                                            <td>{row.orders_count}</td>
                                            <td>{row.completed_orders}</td>
                                            <td>{row.cancelled_orders}</td>
                                            <td>{money(row.total_spent)}</td>
                                            <td>{money(row.seller_earnings)}</td>
                                            <td>{formatDate(row.last_order_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {Number(meta.last_page || 1) > 1 && (
                        <div className="ss-toolbar" style={{ marginTop: 14 }}>
                            <button
                                className="ss-btn"
                                type="button"
                                disabled={Number(meta.current_page || 1) <= 1}
                                onClick={() =>
                                    setFilters((current) => ({
                                        ...current,
                                        page: Number(meta.current_page) - 1,
                                    }))
                                }
                            >
                                Previous
                            </button>

                            <span className="ss-form-hint">
                                Page {meta.current_page} of {meta.last_page}
                            </span>

                            <button
                                className="ss-btn"
                                type="button"
                                disabled={
                                    Number(meta.current_page || 1) >=
                                    Number(meta.last_page || 1)
                                }
                                onClick={() =>
                                    setFilters((current) => ({
                                        ...current,
                                        page: Number(meta.current_page) + 1,
                                    }))
                                }
                            >
                                Next
                            </button>
                        </div>
                    )}
                </SellerSuiteCard>
            </div>
        </SellerLayout>
    );
}
