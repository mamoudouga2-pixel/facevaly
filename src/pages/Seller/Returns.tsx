import {
    useCallback,
    useEffect,
    useState,
} from "react";

import SellerLayout from "./Layout";
import sellerSuiteService from "../../services/sellerSuiteService";
import { mediaUrl } from "../../config/api";

import {
    SellerSuiteAlert,
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
    money,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


export default function SellerReturns() {
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState("");
    const [toast, setToast] = useState(null);
    const [selected, setSelected] = useState(null);
    const [actionOpen, setActionOpen] = useState(false);
    const [actionForm, setActionForm] = useState({
        action: "approve",
        resolution: "refund",
        note: "",
        refund_amount: "",
    });
    const [saving, setSaving] = useState(false);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.returns({ status });
            setRows(response.data || []);
            setSummary(response.summary || {});
        } catch (exception) {
            notify(firstError(exception, "Return requests could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [notify, status]);

    useEffect(() => {
        load();
    }, [load]);

    const openAction = (row, action) => {
        const requestedAmount = (row.items || []).reduce(
            (sum, item) =>
                sum + Number(item.requested_refund_amount || 0),
            0
        );

        setSelected(row);
        setActionForm({
            action,
            resolution: row.resolution || "refund",
            note: row.note || "",
            refund_amount:
                requestedAmount > 0
                    ? requestedAmount
                    : row.order_total || "",
        });
        setActionOpen(true);
    };

    const submit = async () => {
        if (!selected) return;

        setSaving(true);

        try {
            const response = await sellerSuiteService.updateReturn(
                selected.id,
                {
                    ...actionForm,
                    refund_amount:
                        actionForm.refund_amount === ""
                            ? null
                            : Number(actionForm.refund_amount),
                }
            );

            notify(response.message || "Return request updated.");
            setActionOpen(false);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Returns & Refunds"
                    description="Review seller-owned return requests. Seller approval creates a pending refund request; final payment processing stays with the platform/admin."
                />

                <div className="ss-stat-grid">
                    <SellerSuiteStat
                        icon="fa-solid fa-rotate-left"
                        label="Requested"
                        value={summary.requested || 0}
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-circle-check"
                        label="Approved"
                        value={summary.approved || 0}
                        tone="blue"
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-box-open"
                        label="Received"
                        value={summary.received || 0}
                        tone="green"
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-money-bill-transfer"
                        label="Pending Refund"
                        value={money(summary.pending_refunds || 0)}
                        tone="red"
                    />
                </div>

                <SellerSuiteCard
                    actions={
                        <select
                            className="ss-select"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="">All statuses</option>
                            <option value="requested">Requested</option>
                            <option value="approved">Approved</option>
                            <option value="received">Received</option>
                            <option value="completed">Completed</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    }
                >
                    {loading ? (
                        <SellerSuiteLoader text="Loading return requests..." />
                    ) : rows.length === 0 ? (
                        <SellerSuiteEmpty
                            icon="fa-solid fa-rotate-left"
                            title="No return request found"
                        />
                    ) : (
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead>
                                    <tr>
                                        <th>Return</th>
                                        <th>Customer</th>
                                        <th>Items</th>
                                        <th>Reason</th>
                                        <th>Resolution</th>
                                        <th>Status</th>
                                        <th>Refunds</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                <strong>{row.return_number}</strong>
                                                <span className="ss-table-sub">
                                                    {row.vendor_order_number}
                                                </span>
                                                <span className="ss-table-sub">
                                                    {formatDate(row.requested_at)}
                                                </span>
                                            </td>

                                            <td>
                                                {row.order?.customer_name || "—"}
                                                <span className="ss-table-sub">
                                                    {row.order?.customer_phone || ""}
                                                </span>
                                            </td>

                                            <td>
                                                {(row.items || []).map((item) => (
                                                    <div
                                                        className="ss-product-cell"
                                                        style={{ marginBottom: 6 }}
                                                        key={item.id}
                                                    >
                                                        <span className="ss-product-thumb">
                                                            {item.image ? (
                                                                <img
                                                                    src={mediaUrl(
                                                                        item.image
                                                                    )}
                                                                    alt={
                                                                        item.product_name
                                                                    }
                                                                />
                                                            ) : (
                                                                <i className="fa-regular fa-image" />
                                                            )}
                                                        </span>
                                                        <div>
                                                            <strong>
                                                                {item.product_name}
                                                            </strong>
                                                            <span className="ss-table-sub">
                                                                Qty {item.quantity}
                                                                {item.variant_name
                                                                    ? ` · ${item.variant_name}`
                                                                    : ""}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </td>

                                            <td>
                                                {row.reason || "—"}
                                                <span className="ss-table-sub">
                                                    {row.details || ""}
                                                </span>
                                            </td>

                                            <td>{row.resolution || "—"}</td>

                                            <td>
                                                <SellerSuiteBadge
                                                    value={row.status}
                                                />
                                            </td>

                                            <td>
                                                {(row.refunds || []).length
                                                    ? row.refunds.map((refund) => (
                                                        <div key={refund.id}>
                                                            {money(refund.amount)}
                                                            <span className="ss-table-sub">
                                                                {refund.status}
                                                            </span>
                                                        </div>
                                                    ))
                                                    : "—"}
                                            </td>

                                            <td>
                                                <div className="ss-page-actions">
                                                    {["requested", "pending"].includes(
                                                        row.status
                                                    ) && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="ss-btn ss-btn-primary"
                                                                onClick={() =>
                                                                    openAction(
                                                                        row,
                                                                        "approve"
                                                                    )
                                                                }
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="ss-btn ss-btn-danger"
                                                                onClick={() =>
                                                                    openAction(
                                                                        row,
                                                                        "reject"
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {row.status === "approved" && (
                                                        <button
                                                            type="button"
                                                            className="ss-btn"
                                                            onClick={() =>
                                                                openAction(
                                                                    row,
                                                                    "received"
                                                                )
                                                            }
                                                        >
                                                            Mark Received
                                                        </button>
                                                    )}

                                                    {["approved", "received"].includes(
                                                        row.status
                                                    ) && (
                                                        <button
                                                            type="button"
                                                            className="ss-btn ss-btn-primary"
                                                            onClick={() =>
                                                                openAction(
                                                                    row,
                                                                    "complete"
                                                                )
                                                            }
                                                        >
                                                            Complete
                                                        </button>
                                                    )}
                                                </div>
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
                open={actionOpen}
                title="Update Return Request"
                onClose={() => setActionOpen(false)}
                size="small"
            >
                {selected && (
                    <>
                        <SellerSuiteAlert type="info">
                            <strong>{selected.return_number}</strong>
                            <br />
                            Current status: {selected.status}
                        </SellerSuiteAlert>

                        <div className="ss-form-grid">
                            <label>
                                <span>Action</span>
                                <select
                                    className="ss-select"
                                    value={actionForm.action}
                                    disabled
                                >
                                    <option value={actionForm.action}>
                                        {actionForm.action}
                                    </option>
                                </select>
                            </label>

                            {["approve", "complete"].includes(
                                actionForm.action
                            ) && (
                                <label>
                                    <span>Resolution</span>
                                    <select
                                        className="ss-select"
                                        value={actionForm.resolution}
                                        onChange={(event) =>
                                            setActionForm((current) => ({
                                                ...current,
                                                resolution: event.target.value,
                                            }))
                                        }
                                    >
                                        <option value="refund">Refund</option>
                                        <option value="replacement">
                                            Replacement
                                        </option>
                                        <option value="store_credit">
                                            Store Credit
                                        </option>
                                    </select>
                                </label>
                            )}

                            {actionForm.action === "complete" &&
                                actionForm.resolution === "refund" && (
                                    <label>
                                        <span>Requested Refund Amount</span>
                                        <input
                                            className="ss-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={actionForm.refund_amount}
                                            onChange={(event) =>
                                                setActionForm((current) => ({
                                                    ...current,
                                                    refund_amount:
                                                        event.target.value,
                                                }))
                                            }
                                        />
                                    </label>
                                )}

                            <label className="full">
                                <span>Seller / Admin Note</span>
                                <textarea
                                    className="ss-textarea"
                                    value={actionForm.note}
                                    onChange={(event) =>
                                        setActionForm((current) => ({
                                            ...current,
                                            note: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        </div>

                        {actionForm.action === "complete" &&
                            actionForm.resolution === "refund" && (
                                <SellerSuiteAlert type="warning">
                                    Completing this as a refund creates a pending
                                    Refund record. It does not mark customer money
                                    as paid; the platform/admin payout process must
                                    complete that step.
                                </SellerSuiteAlert>
                            )}

                        <div className="ss-modal-footer">
                            <button
                                type="button"
                                className="ss-btn"
                                onClick={() => setActionOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ss-btn ss-btn-primary"
                                disabled={saving}
                                onClick={submit}
                            >
                                Confirm
                            </button>
                        </div>
                    </>
                )}
            </SellerSuiteModal>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
