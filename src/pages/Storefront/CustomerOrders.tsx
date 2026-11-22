import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import customerAccountService from "../../services/customerAccountService";
import "../../styles/storefront-commerce.css";
import "../../components/frontend/shop/ShopFilters.css";
import "./CustomerOrders.css";

export default function CustomerOrders() {
    const location = useLocation();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });
    const [summary, setSummary] = useState({
        all: 0,
        "to-pay": 0,
        "to-ship": 0,
        "to-receive": 0,
        completed: 0,
        cancelled: 0,
    });

    const params = useMemo(
        () => new URLSearchParams(location.search),
        [location.search]
    );

    const status = params.get("status") || "all";
    const currentPage = Number(params.get("page") || 1);

    const statusTabs = [
        { key: "all", label: "All Orders" },
        { key: "to-pay", label: "To Pay" },
        { key: "to-ship", label: "To Ship" },
        { key: "to-receive", label: "To Receive" },
        { key: "completed", label: "Completed" },
        { key: "cancelled", label: "Cancelled" },
    ];

    const openTab = (nextStatus) => {
        const next = new URLSearchParams(location.search);
        if (!nextStatus || nextStatus === "all") {
            next.delete("status");
        } else {
            next.set("status", nextStatus);
        }
        next.delete("page");
        navigate(`/account/orders?${next.toString()}`);
    };

    const openPage = (page) => {
        const next = new URLSearchParams(location.search);
        if (page <= 1) {
            next.delete("page");
        } else {
            next.set("page", String(page));
        }
        navigate(`/account/orders?${next.toString()}`);
    };

    const statusPill = (value) => {
        const map = {
            pending: "to-pay",
            new_order: "to-pay",
            confirmed: "to-ship",
            processing: "to-ship",
            ready_to_ship: "to-ship",
            in_courier: "to-receive",
            shipped: "to-receive",
            out_for_delivery: "to-receive",
            delivered: "completed",
            completed: "completed",
            cancelled: "cancelled",
        };

        return map[value] || "neutral";
    };

    const statusLabel = (value) =>
        String(value || "")
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());

    const money = (value) =>
        Number(value || 0).toLocaleString("en-BD", {
            maximumFractionDigits: 2,
        });

    useEffect(() => {
        let active = true;
        const activeStatus = params.get("status") || undefined;
        const page = Number(params.get("page") || 1);

        setLoading(true);
        setError("");

        customerAccountService
            .orders({
                status: activeStatus,
                page,
                per_page: 10,
            })
            .then((response) => {
                if (active) {
                    setOrders(response?.data || []);
                    setMeta(
                        response?.meta || {
                            current_page: 1,
                            last_page: 1,
                            total: 0,
                        }
                    );
                    setSummary(
                        response?.summary || {
                            all: 0,
                            "to-pay": 0,
                            "to-ship": 0,
                            "to-receive": 0,
                            completed: 0,
                            cancelled: 0,
                        }
                    );
                }
            })
            .catch((exception) => {
                if (active) {
                    setError(
                        exception?.response?.status === 401
                            ? "Please login to view your orders."
                            : (exception?.message || "Could not load orders.")
                    );
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [location.search, params]);

    return (
        <div className="fv-orders-page">
            <div className="fv-orders-container">
                <header className="fv-orders-hero">
                    <div>
                        <span>ACCOUNT ORDERS</span>
                        <h1>Track every order from one desk</h1>
                        <p>
                            Follow payment, shipping, and delivery progress in real time.
                        </p>
                    </div>

                    <div className="fv-orders-hero-meta">
                        <strong>{meta.total || 0}</strong>
                        <small>Total orders</small>
                    </div>
                </header>

                <nav className="fv-orders-tabs" aria-label="Order status filters">
                    {statusTabs.map((tab) => (
                        <button
                            type="button"
                            key={tab.key}
                            className={status === tab.key ? "active" : ""}
                            onClick={() => openTab(tab.key)}
                        >
                            <span>{tab.label}</span>
                            <b>{summary[tab.key] || 0}</b>
                        </button>
                    ))}
                </nav>

                {loading ? (
                    <div className="fv-orders-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Loading your orders...
                    </div>
                ) : null}

                {error ? (
                    <div className="fv-orders-error">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error} <Link to="/login">Login</Link>
                    </div>
                ) : null}

                {!loading && !error && orders.length === 0 ? (
                    <div className="fv-orders-empty">
                        <i className="fa-regular fa-box-open" />
                        <p>No orders found in this status.</p>
                    </div>
                ) : null}

                <div className="fv-orders-list">
                    {orders.map((order) => (
                        <article
                            key={order.id}
                            className={`fv-order-card fv-order-${statusPill(order.status)}`}
                        >
                            <div className="fv-order-card-head">
                                <strong>{order.order_number || `#${order.id}`}</strong>
                                <span>{statusLabel(order.status)}</span>
                            </div>

                            <div className="fv-order-card-grid">
                                <div>
                                    <small>Payment</small>
                                    <p>{statusLabel(order.payment_status || "pending")}</p>
                                </div>

                                <div>
                                    <small>Items</small>
                                    <p>{order.items_count}</p>
                                </div>

                                <div>
                                    <small>Total</small>
                                    <p>৳ {money(order.total_amount)}</p>
                                </div>

                                <div>
                                    <small>Placed on</small>
                                    <p>
                                        {order.created_at
                                            ? new Date(order.created_at).toLocaleDateString()
                                            : "-"}
                                    </p>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>

                {!loading && !error && meta.last_page > 1 ? (
                    <nav className="fv-shop-pagination" aria-label="Order pagination">
                        <button
                            type="button"
                            disabled={currentPage <= 1}
                            onClick={() => openPage(currentPage - 1)}
                        >
                            <i className="fa-solid fa-chevron-left" />
                        </button>

                        <button type="button" className="active">
                            {currentPage}
                        </button>

                        <button
                            type="button"
                            disabled={currentPage >= meta.last_page}
                            onClick={() => openPage(currentPage + 1)}
                        >
                            <i className="fa-solid fa-chevron-right" />
                        </button>
                    </nav>
                ) : null}
            </div>
        </div>
    );
}
