import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import SellerLayout from "./Layout";
import sellerSuiteService from "../../services/sellerSuiteService";

import {
    SellerSuiteBadge,
    SellerSuiteCard,
    SellerSuiteEmpty,
    SellerSuiteHeader,
    SellerSuiteLoader,
    SellerSuiteToast,
    firstError,
    formatDate,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


export default function SellerNotifications() {
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [toast, setToast] = useState(null);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.notifications({
                unread_only: unreadOnly ? 1 : "",
            });

            setRows(response.data || []);
            setSummary(response.summary || {});
        } catch (exception) {
            notify(firstError(exception, "Notifications could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [notify, unreadOnly]);

    useEffect(() => {
        load();
    }, [load]);

    const markRead = async (row) => {
        try {
            await sellerSuiteService.markNotificationRead(row.id);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    const markAll = async () => {
        try {
            const response =
                await sellerSuiteService.markAllNotificationsRead();
            notify(response.message || "Notifications marked as read.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Notifications"
                    description="Low-stock, return and seller-account alerts from your store."
                    actions={
                        <button
                            type="button"
                            className="ss-btn"
                            disabled={!summary.unread}
                            onClick={markAll}
                        >
                            <i className="fa-solid fa-check-double" />
                            Mark All Read
                        </button>
                    }
                />

                <SellerSuiteCard
                    actions={
                        <label className="ss-check">
                            <input
                                type="checkbox"
                                checked={unreadOnly}
                                onChange={(event) =>
                                    setUnreadOnly(event.target.checked)
                                }
                            />
                            Unread only ({summary.unread || 0})
                        </label>
                    }
                >
                    {loading ? (
                        <SellerSuiteLoader text="Loading notifications..." />
                    ) : rows.length === 0 ? (
                        <SellerSuiteEmpty
                            icon="fa-regular fa-bell"
                            title="No notification"
                            description="You're caught up."
                        />
                    ) : (
                        <div style={{ display: "grid", gap: 9 }}>
                            {rows.map((row) => (
                                <article
                                    key={row.id}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "42px 1fr auto",
                                        gap: 11,
                                        padding: 12,
                                        border: "1px solid #e5e8ee",
                                        borderRadius: 9,
                                        background: row.is_read
                                            ? "#fff"
                                            : "#fff8f3",
                                    }}
                                >
                                    <span
                                        className="ss-stat-icon"
                                        style={{ width: 38, height: 38 }}
                                    >
                                        <i
                                            className={
                                                row.type === "warning"
                                                    ? "fa-solid fa-triangle-exclamation"
                                                    : "fa-regular fa-bell"
                                            }
                                        />
                                    </span>

                                    <div>
                                        <strong>{row.title}</strong>
                                        <p
                                            style={{
                                                margin: "5px 0",
                                                color: "#667085",
                                                fontSize: 10,
                                            }}
                                        >
                                            {row.message}
                                        </p>
                                        <small style={{ color: "#98a2b3" }}>
                                            {formatDate(row.created_at)}
                                        </small>
                                    </div>

                                    <div className="ss-page-actions">
                                        <SellerSuiteBadge
                                            value={
                                                row.is_read
                                                    ? "read"
                                                    : "unread"
                                            }
                                        />

                                        {row.url && (
                                            <Link
                                                to={row.url}
                                                className="ss-btn"
                                                onClick={() =>
                                                    !row.is_read &&
                                                    markRead(row)
                                                }
                                            >
                                                Open
                                            </Link>
                                        )}

                                        {!row.is_read && (
                                            <button
                                                type="button"
                                                className="ss-btn"
                                                onClick={() => markRead(row)}
                                            >
                                                Read
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </SellerSuiteCard>
            </div>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
