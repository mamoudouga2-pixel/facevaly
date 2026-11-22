import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminBadge, AdminCard, AdminEmpty, AdminLoader, AdminModal,
    AdminPagination, AdminToast, firstError, formatDate,
} from "../../components/admin/AdminUI";
import "./admin.css";

export default function AdminSupport() {
    const [filters, setFilters] = useState({
        status: "",
        priority: "",
        per_page: 25,
        page: 1,
    });
    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
    });
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [modal, setModal] = useState(false);
    const [message, setMessage] = useState("");
    const [attachment, setAttachment] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = useCallback((m, t = "success") => {
        setToast({ message: m, type: t });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.support(filters);
            setRows(response.data || []);
            setSummary(response.summary || {});

            const nextMeta = response.meta || {};
            const total = Number(nextMeta.total || 0);
            const perPage = Number(filters.per_page || 25);
            const currentPage = Number(nextMeta.current_page || 1);
            const lastPage = Number(nextMeta.last_page || 1);
            const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
            const to = total === 0 ? 0 : Math.min(currentPage * perPage, total);

            setMeta({
                current_page: currentPage,
                last_page: lastPage,
                total,
                from,
                to,
            });
        } catch (error) {
            notify(firstError(error), "error");
        } finally {
            setLoading(false);
        }
    }, [filters, notify]);

    useEffect(() => {
        load();
    }, [load]);

    const open = async (id) => {
        setModal(true);
        setDetail(null);
        setMessage("");
        setAttachment(null);
        try {
            const response = await adminService.supportTicket(id);
            setDetail(response.data);
        } catch (error) {
            notify(firstError(error), "error");
            setModal(false);
        }
    };

    const refresh = async () => {
        if (!detail?.ticket?.id) {
            return;
        }

        const response = await adminService.supportTicket(detail.ticket.id);
        setDetail(response.data);
    };

    const reply = async () => {
        if (!message.trim()) {
            return;
        }

        const payload = new FormData();
        payload.append("message", message.trim());
        if (attachment instanceof File) {
            payload.append("attachment", attachment);
        }

        try {
            const response = await adminService.replySupport(detail.ticket.id, payload);
            notify(response.message);
            setMessage("");
            setAttachment(null);
            await refresh();
            await load();
        } catch (error) {
            notify(firstError(error), "error");
        }
    };

    const setStatus = async (status) => {
        try {
            const response = await adminService.supportStatus(detail.ticket.id, status);
            notify(response.message);
            await refresh();
            await load();
        } catch (error) {
            notify(firstError(error), "error");
        }
    };

    return (
        <AdminLayout>
            <div className="adm-metric-grid">
                <AdminMetricLite label="Open" value={summary.open || 0} />
                <AdminMetricLite label="Waiting Support" value={summary.waiting_support || 0} />
                <AdminMetricLite label="Waiting Seller" value={summary.waiting_seller || 0} />
                <AdminMetricLite label="Closed" value={summary.closed || 0} />
            </div>
            <AdminCard>
                <div className="adm-toolbar">
                    <select
                        className="adm-select"
                        value={filters.status}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                status: event.target.value,
                                page: 1,
                            }))
                        }
                    >
                        <option value="">All statuses</option>
                        <option value="open">Open</option>
                        <option value="waiting_support">Waiting Support</option>
                        <option value="waiting_seller">Waiting Seller</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        className="adm-select"
                        value={filters.priority}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                priority: event.target.value,
                                page: 1,
                            }))
                        }
                    >
                        <option value="">All priorities</option>
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                {loading ? (
                    <AdminLoader />
                ) : !rows.length ? (
                    <AdminEmpty title="No support tickets" />
                ) : (
                    <>
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Seller</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Last Activity</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td data-label="Ticket">
                                                <strong>{row.ticket_number}</strong>
                                                <span className="adm-table-sub">{row.subject}</span>
                                            </td>
                                            <td data-label="Seller">
                                                {row.vendor_name}
                                                <span className="adm-table-sub">
                                                    {row.creator_name || row.creator_email || "—"}
                                                </span>
                                            </td>
                                            <td data-label="Category">{row.category}</td>
                                            <td data-label="Priority">
                                                <AdminBadge value={row.priority} />
                                            </td>
                                            <td data-label="Status">
                                                <AdminBadge value={row.status} />
                                            </td>
                                            <td data-label="Last Activity">
                                                {formatDate(row.last_reply_at || row.updated_at || row.created_at)}
                                            </td>
                                            <td data-label="Action">
                                                <button className="adm-btn" onClick={() => open(row.id)}>
                                                    Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <AdminPagination
                            meta={meta}
                            perPage={filters.per_page}
                            onPerPageChange={(perPage) =>
                                setFilters((current) => ({
                                    ...current,
                                    per_page: perPage,
                                    page: 1,
                                }))
                            }
                            onPageChange={(page) =>
                                setFilters((current) => ({
                                    ...current,
                                    page,
                                }))
                            }
                        />
                    </>
                )}
            </AdminCard>

            <AdminModal
                open={modal}
                title={
                    detail?.ticket
                        ? `${detail.ticket.ticket_number} · ${detail.ticket.subject}`
                        : "Support Ticket"
                }
                size="xl"
                onClose={() => setModal(false)}
            >
                {!detail ? (
                    <AdminLoader />
                ) : (
                    <>
                        <div className="adm-toolbar">
                            <AdminBadge value={detail.ticket.status} />
                            <AdminBadge value={detail.ticket.priority} />
                            <span style={{ fontSize: 8, color: "#667085" }}>
                                {detail.ticket.vendor_name}
                            </span>
                            {detail.ticket.status !== "closed" && (
                                <button
                                    className="adm-btn adm-btn-danger"
                                    onClick={() => setStatus("closed")}
                                >
                                    Close Ticket
                                </button>
                            )}
                            {detail.ticket.status === "closed" && (
                                <button className="adm-btn" onClick={() => setStatus("open")}>
                                    Reopen
                                </button>
                            )}
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gap: 8,
                                maxHeight: 420,
                                overflow: "auto",
                                padding: "4px 1px",
                            }}
                        >
                            {detail.messages?.map((m) => (
                                <div
                                    key={m.id}
                                    style={{
                                        maxWidth: "82%",
                                        justifySelf: m.sender_type === "support" ? "end" : "start",
                                        border: "1px solid #e2e7ed",
                                        borderRadius: 9,
                                        padding: 10,
                                        background: m.sender_type === "support" ? "#fff8f4" : "#f8fafc",
                                    }}
                                >
                                    <strong style={{ fontSize: 8, color: "#344054" }}>
                                        {m.user_name
                                            || (m.sender_type === "support" ? "Admin Support" : "Seller")}
                                    </strong>
                                    <p
                                        style={{
                                            fontSize: 8,
                                            color: "#667085",
                                            lineHeight: 1.6,
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {m.message}
                                    </p>
                                    {m.attachment_url && (
                                        <a
                                            className="adm-btn"
                                            href={m.attachment_url}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Attachment
                                        </a>
                                    )}
                                    <small
                                        style={{
                                            display: "block",
                                            marginTop: 5,
                                            color: "#98a2b3",
                                            fontSize: 6.5,
                                        }}
                                    >
                                        {formatDate(m.created_at)}
                                    </small>
                                </div>
                            ))}
                        </div>
                        {detail.ticket.status !== "closed" && (
                            <div style={{ marginTop: 12 }}>
                                <textarea
                                    className="adm-textarea"
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    placeholder="Write support reply..."
                                />
                                <div className="adm-toolbar" style={{ marginTop: 7 }}>
                                    <input
                                        className="adm-input grow"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.txt,.csv"
                                        onChange={(event) =>
                                            setAttachment(event.target.files?.[0] || null)
                                        }
                                    />
                                    <button className="adm-btn adm-btn-primary" onClick={reply}>
                                        Send Reply
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </AdminModal>
            <AdminToast toast={toast} />
        </AdminLayout>
    );
}

function AdminMetricLite({ label, value }) {
    return (
        <div className="adm-metric">
            <span>
                <i className="fa-solid fa-ticket" />
            </span>
            <div>
                <small>{label}</small>
                <strong>{value}</strong>
            </div>
        </div>
    );
}
