import {
    useCallback,
    useEffect,
    useState,
} from "react";

import SellerLayout from "./Layout";
import sellerSuiteService from "../../services/sellerSuiteService";

import {
    SellerSuiteBadge,
    SellerSuiteCard,
    SellerSuiteEmpty,
    SellerSuiteHeader,
    SellerSuiteLoader,
    SellerSuiteModal,
    SellerSuiteStat,
    SellerSuiteToast,
    firstError,
    formatDate,
    titleCase,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


const EMPTY_TICKET = {
    category: "technical",
    priority: "normal",
    subject: "",
    message: "",
    attachment: null,
};


export default function SellerSupport() {
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [ticketForm, setTicketForm] = useState(EMPTY_TICKET);

    const [detailOpen, setDetailOpen] = useState(false);
    const [detail, setDetail] = useState(null);
    const [reply, setReply] = useState({
        message: "",
        attachment: null,
    });
    const [saving, setSaving] = useState(false);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.supportTickets({
                status,
            });

            setRows(response.data || []);
            setSummary(response.summary || {});
        } catch (exception) {
            notify(
                firstError(exception, "Support tickets could not be loaded."),
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [notify, status]);

    useEffect(() => {
        load();
    }, [load]);

    const openTicket = async (row) => {
        setDetailOpen(true);
        setDetail(null);
        setReply({
            message: "",
            attachment: null,
        });

        try {
            const response =
                await sellerSuiteService.supportTicket(row.id);
            setDetail(response.data || null);
        } catch (exception) {
            notify(firstError(exception), "error");
            setDetailOpen(false);
        }
    };

    const createTicket = async () => {
        setSaving(true);

        try {
            const formData = new FormData();
            formData.append("category", ticketForm.category);
            formData.append("priority", ticketForm.priority);
            formData.append("subject", ticketForm.subject);
            formData.append("message", ticketForm.message);

            if (ticketForm.attachment) {
                formData.append("attachment", ticketForm.attachment);
            }

            const response =
                await sellerSuiteService.createSupportTicket(formData);

            notify(response.message || "Support ticket created.");
            setCreateOpen(false);
            setTicketForm(EMPTY_TICKET);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const sendReply = async () => {
        if (!detail || !reply.message.trim()) {
            return;
        }

        setSaving(true);

        try {
            const formData = new FormData();
            formData.append("message", reply.message.trim());

            if (reply.attachment) {
                formData.append("attachment", reply.attachment);
            }

            const response =
                await sellerSuiteService.replySupportTicket(
                    detail.id,
                    formData
                );

            notify(response.message || "Reply sent.");
            setReply({
                message: "",
                attachment: null,
            });

            const refreshed =
                await sellerSuiteService.supportTicket(detail.id);
            setDetail(refreshed.data || null);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const closeTicket = async () => {
        if (!detail) return;

        if (!window.confirm("Close this support ticket?")) return;

        try {
            const response =
                await sellerSuiteService.closeSupportTicket(detail.id);

            notify(response.message || "Support ticket closed.");

            const refreshed =
                await sellerSuiteService.supportTicket(detail.id);

            setDetail(refreshed.data || null);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Support Center"
                    description="Create and track seller support tickets for account, courier, payout, return, technical and marketplace issues."
                    actions={
                        <button
                            type="button"
                            className="ss-btn ss-btn-primary"
                            onClick={() => setCreateOpen(true)}
                        >
                            <i className="fa-solid fa-plus" />
                            New Ticket
                        </button>
                    }
                />

                <div className="ss-stat-grid">
                    <SellerSuiteStat
                        icon="fa-solid fa-envelope-open-text"
                        label="Open"
                        value={summary.open || 0}
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-headset"
                        label="Waiting Support"
                        value={summary.waiting_support || 0}
                        tone="blue"
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-user-clock"
                        label="Waiting Seller"
                        value={summary.waiting_seller || 0}
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-circle-check"
                        label="Closed"
                        value={summary.closed || 0}
                        tone="green"
                    />
                </div>

                <SellerSuiteCard
                    title="Support Tickets"
                    actions={
                        <select
                            className="ss-select"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">All statuses</option>
                            <option value="open">Open</option>
                            <option value="waiting_support">
                                Waiting Support
                            </option>
                            <option value="waiting_seller">
                                Waiting Seller
                            </option>
                            <option value="closed">Closed</option>
                        </select>
                    }
                >
                    {loading ? (
                        <SellerSuiteLoader text="Loading support tickets..." />
                    ) : rows.length === 0 ? (
                        <SellerSuiteEmpty
                            icon="fa-solid fa-headset"
                            title="No support tickets"
                            description="Create a ticket if you need help from Facevaly."
                        />
                    ) : (
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead>
                                    <tr>
                                        <th>Ticket</th>
                                        <th>Category</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                        <th>Last Message</th>
                                        <th>Last Activity</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <strong>
                                                    {row.ticket_number}
                                                </strong>
                                                <span className="ss-table-sub">
                                                    {row.subject}
                                                </span>
                                            </td>

                                            <td>{titleCase(row.category)}</td>

                                            <td>
                                                <SellerSuiteBadge
                                                    value={row.priority}
                                                />
                                            </td>

                                            <td>
                                                <SellerSuiteBadge
                                                    value={row.status}
                                                />
                                            </td>

                                            <td>
                                                {row.last_message || "—"}
                                            </td>

                                            <td>
                                                {formatDate(
                                                    row.last_reply_at ||
                                                        row.created_at
                                                )}
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="ss-btn"
                                                    onClick={() =>
                                                        openTicket(row)
                                                    }
                                                >
                                                    Open
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SellerSuiteCard>
            </div>

            <SellerSuiteModal
                open={createOpen}
                title="Create Support Ticket"
                onClose={() => setCreateOpen(false)}
                size="medium"
            >
                <div className="ss-form-grid">
                    <label>
                        <span>Category</span>
                        <select
                            className="ss-select"
                            value={ticketForm.category}
                            onChange={(event) =>
                                setTicketForm((current) => ({
                                    ...current,
                                    category: event.target.value,
                                }))
                            }
                        >
                            <option value="account">Account</option>
                            <option value="product">Product</option>
                            <option value="order">Order</option>
                            <option value="courier">Courier</option>
                            <option value="wallet">Wallet</option>
                            <option value="payout">Payout</option>
                            <option value="return">Return</option>
                            <option value="technical">Technical</option>
                            <option value="other">Other</option>
                        </select>
                    </label>

                    <label>
                        <span>Priority</span>
                        <select
                            className="ss-select"
                            value={ticketForm.priority}
                            onChange={(event) =>
                                setTicketForm((current) => ({
                                    ...current,
                                    priority: event.target.value,
                                }))
                            }
                        >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                        </select>
                    </label>

                    <label className="full">
                        <span>Subject</span>
                        <input
                            className="ss-input"
                            value={ticketForm.subject}
                            onChange={(event) =>
                                setTicketForm((current) => ({
                                    ...current,
                                    subject: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="full">
                        <span>Message</span>
                        <textarea
                            className="ss-textarea"
                            rows="7"
                            value={ticketForm.message}
                            onChange={(event) =>
                                setTicketForm((current) => ({
                                    ...current,
                                    message: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="full">
                        <span>Attachment (optional)</span>
                        <input
                            className="ss-input"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf,.txt,.csv"
                            onChange={(event) =>
                                setTicketForm((current) => ({
                                    ...current,
                                    attachment:
                                        event.target.files?.[0] || null,
                                }))
                            }
                        />
                    </label>
                </div>

                <div className="ss-modal-footer">
                    <button
                        type="button"
                        className="ss-btn"
                        onClick={() => setCreateOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="ss-btn ss-btn-primary"
                        disabled={
                            saving ||
                            !ticketForm.subject.trim() ||
                            !ticketForm.message.trim()
                        }
                        onClick={createTicket}
                    >
                        Create Ticket
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteModal
                open={detailOpen}
                title={
                    detail?.ticket_number
                        ? `${detail.ticket_number} · ${detail.subject}`
                        : "Support Ticket"
                }
                onClose={() => setDetailOpen(false)}
                size="large"
            >
                {!detail ? (
                    <SellerSuiteLoader text="Loading ticket..." />
                ) : (
                    <>
                        <div className="ss-toolbar">
                            <SellerSuiteBadge value={detail.status} />
                            <SellerSuiteBadge value={detail.priority} />
                            <span className="ss-form-hint">
                                {titleCase(detail.category)}
                            </span>

                            {detail.status !== "closed" && (
                                <button
                                    type="button"
                                    className="ss-btn ss-btn-danger"
                                    style={{ marginLeft: "auto" }}
                                    onClick={closeTicket}
                                >
                                    Close Ticket
                                </button>
                            )}
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gap: 10,
                                maxHeight: 410,
                                overflow: "auto",
                                paddingRight: 4,
                            }}
                        >
                            {(detail.messages || []).map((message) => (
                                <article
                                    key={message.id}
                                    style={{
                                        maxWidth: "88%",
                                        marginLeft:
                                            message.sender_type === "support"
                                                ? "auto"
                                                : 0,
                                        padding: 12,
                                        borderRadius: 10,
                                        border: "1px solid #e5e8ee",
                                        background:
                                            message.sender_type === "support"
                                                ? "#fff3ec"
                                                : "#f8fafc",
                                    }}
                                >
                                    <strong style={{ fontSize: 10 }}>
                                        {message.user_name}
                                    </strong>

                                    <p
                                        style={{
                                            color: "#4f596a",
                                            fontSize: 11,
                                            lineHeight: 1.6,
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {message.message}
                                    </p>

                                    {message.attachment_url && (
                                        <a
                                            href={message.attachment_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="seller-link"
                                        >
                                            <i className="fa-solid fa-paperclip" />{" "}
                                            Attachment
                                        </a>
                                    )}

                                    <small
                                        style={{
                                            display: "block",
                                            marginTop: 7,
                                            color: "#98a2b3",
                                        }}
                                    >
                                        {formatDate(message.created_at)}
                                    </small>
                                </article>
                            ))}
                        </div>

                        {detail.status !== "closed" && (
                            <div style={{ marginTop: 15 }}>
                                <textarea
                                    className="ss-textarea"
                                    rows="5"
                                    placeholder="Reply to Facevaly Support..."
                                    value={reply.message}
                                    onChange={(event) =>
                                        setReply((current) => ({
                                            ...current,
                                            message: event.target.value,
                                        }))
                                    }
                                />

                                <div
                                    className="ss-toolbar"
                                    style={{ marginTop: 8 }}
                                >
                                    <input
                                        className="ss-input"
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf,.txt,.csv"
                                        onChange={(event) =>
                                            setReply((current) => ({
                                                ...current,
                                                attachment:
                                                    event.target.files?.[0] ||
                                                    null,
                                            }))
                                        }
                                    />

                                    <button
                                        type="button"
                                        className="ss-btn ss-btn-primary"
                                        disabled={
                                            saving || !reply.message.trim()
                                        }
                                        onClick={sendReply}
                                    >
                                        Send Reply
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </SellerSuiteModal>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
