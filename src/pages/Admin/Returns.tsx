import {
    useCallback,
    useEffect,
    useState,
} from "react";

import AdminLayout from "./Layout";
import adminService from "../../services/adminService";

import {
    AdminBadge,
    AdminCard,
    AdminEmpty,
    AdminLoader,
    AdminMetric,
    AdminModal,
    AdminPageHeader,
    AdminToast,
    firstError,
    formatDate,
    money,
    titleCase,
} from "../../components/admin/AdminUI";

import "./admin.css";


const actions = [
    "approve",
    "receive",
    "complete",
    "reject",
    "reopen",
];


export default function AdminReturns() {
    const [
        filters,
        setFilters,
    ] = useState({
        q: "",
        status: "",
        per_page: 50,
    });

    const [
        rows,
        setRows,
    ] = useState([]);

    const [
        summary,
        setSummary,
    ] = useState({});

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        detailOpen,
        setDetailOpen,
    ] = useState(false);

    const [
        detail,
        setDetail,
    ] = useState(null);

    const [
        action,
        setAction,
    ] = useState("approve");

    const [
        resolution,
        setResolution,
    ] = useState("refund");

    const [
        note,
        setNote,
    ] = useState("");

    const [
        toast,
        setToast,
    ] = useState(null);


    const notify = useCallback(
        (
            message,
            type = "success"
        ) => {
            setToast({
                message,
                type,
            });

            window.setTimeout(
                () => setToast(null),
                3200
            );
        },
        []
    );


    const load = useCallback(
        async () => {
            setLoading(true);

            try {
                const response =
                    await adminService
                        .returns(filters);

                setRows(
                    response.data || []
                );

                setSummary(
                    response.summary || {}
                );
            } catch (exception) {
                notify(
                    firstError(exception),
                    "error"
                );
            } finally {
                setLoading(false);
            }
        },
        [
            filters,
            notify,
        ]
    );


    useEffect(() => {
        load();
    }, [load]);


    const openReturn = async (id) => {
        setDetailOpen(true);
        setDetail(null);
        setNote("");

        try {
            const response =
                await adminService
                    .returnRequest(id);

            setDetail(response.data);

            setResolution(
                response.data?.resolution
                || "refund"
            );
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );

            setDetailOpen(false);
        }
    };


    const refreshDetail = async () => {
        if (!detail?.id) {
            return;
        }

        const response =
            await adminService
                .returnRequest(detail.id);

        setDetail(response.data);
    };


    const submitAction = async () => {
        if (!detail) {
            return;
        }

        if (
            action === "reject"
            && !note.trim()
        ) {
            notify(
                "Enter an admin note for rejection.",
                "error"
            );

            return;
        }

        if (
            !window.confirm(
                `Apply "${titleCase(action)}" to ${detail.return_number}?`
            )
        ) {
            return;
        }

        try {
            const response =
                await adminService
                    .updateReturn(
                        detail.id,
                        {
                            action,
                            resolution:
                                resolution || null,
                            admin_note:
                                note.trim() || null,
                        }
                    );

            notify(response.message);
            setNote("");

            await Promise.all([
                refreshDetail(),
                load(),
            ]);
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const statusCounts =
        summary.statuses || {};


    return (
        <AdminLayout>
            <AdminPageHeader
                title="Returns Management"
                description="Review marketplace return requests, update return lifecycle and hand refund payments to the Finance Center."
            />

            <div className="adm-metric-grid">
                <AdminMetric
                    icon="fa-solid fa-rotate-left"
                    label="All Returns"
                    value={summary.total || 0}
                />

                <AdminMetric
                    icon="fa-solid fa-clock"
                    label="Requested"
                    value={statusCounts.requested || 0}
                    tone="amber"
                />

                <AdminMetric
                    icon="fa-solid fa-circle-check"
                    label="Approved"
                    value={statusCounts.approved || 0}
                    tone="green"
                />

                <AdminMetric
                    icon="fa-solid fa-check-double"
                    label="Completed"
                    value={statusCounts.completed || 0}
                    tone="blue"
                />
            </div>

            <AdminCard>
                <div className="adm-toolbar">
                    <input
                        className="adm-input grow"
                        placeholder="Return number, order, customer or phone..."
                        value={filters.q}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                q: event.target.value,
                            }))
                        }
                    />

                    <select
                        className="adm-select"
                        value={filters.status}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                status: event.target.value,
                            }))
                        }
                    >
                        <option value="">
                            All statuses
                        </option>

                        {[
                            "requested",
                            "approved",
                            "received",
                            "completed",
                            "rejected",
                        ].map((value) => (
                            <option
                                key={value}
                                value={value}
                            >
                                {titleCase(value)}
                            </option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <AdminLoader />
                ) : !rows.length ? (
                    <AdminEmpty
                        title="No return requests found"
                    />
                ) : (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Return</th>
                                    <th>Order</th>
                                    <th>Seller</th>
                                    <th>Customer</th>
                                    <th>Reason</th>
                                    <th>Resolution</th>
                                    <th>Status</th>
                                    <th>Requested</th>
                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td data-label="Return">
                                            <strong>
                                                {row.return_number}
                                            </strong>

                                            <span className="adm-table-sub">
                                                {row.items_count || 0} item(s)
                                                {" · "}
                                                {row.refunds_count || 0} refund(s)
                                            </span>
                                        </td>

                                        <td data-label="Order">
                                            {row.order_number || "—"}

                                            <span className="adm-table-sub">
                                                {row.vendor_order_number || "—"}
                                            </span>
                                        </td>

                                        <td data-label="Seller">
                                            {row.vendor || "—"}
                                        </td>

                                        <td data-label="Customer">
                                            <strong>
                                                {row.customer?.name || "Guest"}
                                            </strong>

                                            <span className="adm-table-sub">
                                                {row.customer?.phone || "—"}
                                            </span>
                                        </td>

                                        <td data-label="Reason">
                                            {row.reason || "—"}
                                        </td>

                                        <td data-label="Resolution">
                                            {row.resolution
                                                ? titleCase(row.resolution)
                                                : "—"}
                                        </td>

                                        <td data-label="Status">
                                            <AdminBadge value={row.status} />
                                        </td>

                                        <td data-label="Requested">
                                            {formatDate(
                                                row.requested_at
                                                || row.created_at
                                            )}
                                        </td>

                                        <td data-label="Action">
                                            <button
                                                className="adm-btn"
                                                type="button"
                                                onClick={() =>
                                                    openReturn(row.id)
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
            </AdminCard>

            <AdminModal
                open={detailOpen}
                title={
                    detail
                        ? `Return · ${detail.return_number}`
                        : "Return Request"
                }
                size="xl"
                onClose={() => setDetailOpen(false)}
            >
                {!detail ? (
                    <AdminLoader />
                ) : (
                    <>
                        <div className="adm-metric-grid">
                            <AdminMetric
                                icon="fa-solid fa-bag-shopping"
                                label="Order Total"
                                value={money(
                                    detail.order_total,
                                    detail.currency || "BDT"
                                )}
                            />

                            <AdminMetric
                                icon="fa-solid fa-box"
                                label="Return Items"
                                value={
                                    detail.items?.length
                                    || detail.items_count
                                    || 0
                                }
                                tone="blue"
                            />

                            <AdminMetric
                                icon="fa-solid fa-money-bill-transfer"
                                label="Refund Records"
                                value={
                                    detail.refunds?.length
                                    || detail.refunds_count
                                    || 0
                                }
                                tone="amber"
                            />

                            <AdminMetric
                                icon="fa-solid fa-circle-info"
                                label="Current Status"
                                value={titleCase(detail.status)}
                                tone="green"
                            />
                        </div>

                        <div className="adm-two-col">
                            <AdminCard title="Return Information">
                                <div className="adm-form-grid">
                                    <div className="adm-field">
                                        <span>Seller</span>
                                        <strong>
                                            {detail.vendor || "—"}
                                        </strong>
                                    </div>

                                    <div className="adm-field">
                                        <span>Order</span>
                                        <strong>
                                            {detail.order_number || "—"}
                                        </strong>
                                    </div>

                                    <div className="adm-field">
                                        <span>Customer</span>
                                        <strong>
                                            {detail.customer?.name || "Guest"}
                                        </strong>
                                    </div>

                                    <div className="adm-field">
                                        <span>Phone</span>
                                        <strong>
                                            {detail.customer?.phone || "—"}
                                        </strong>
                                    </div>

                                    <div className="adm-field full">
                                        <span>Reason</span>
                                        <strong>
                                            {detail.reason || "—"}
                                        </strong>
                                    </div>

                                    <div className="adm-field full">
                                        <span>Customer Details</span>
                                        <strong>
                                            {detail.details || "—"}
                                        </strong>
                                    </div>

                                    <div className="adm-field full">
                                        <span>Current Admin Note</span>
                                        <strong>
                                            {detail.admin_note || "—"}
                                        </strong>
                                    </div>
                                </div>
                            </AdminCard>

                            <AdminCard title="Admin Decision">
                                <div className="adm-form-grid">
                                    <label className="adm-field">
                                        <span>Action</span>

                                        <select
                                            className="adm-select"
                                            value={action}
                                            onChange={(event) =>
                                                setAction(event.target.value)
                                            }
                                        >
                                            {actions.map((value) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {titleCase(value)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="adm-field">
                                        <span>Resolution</span>

                                        <select
                                            className="adm-select"
                                            value={resolution}
                                            onChange={(event) =>
                                                setResolution(event.target.value)
                                            }
                                        >
                                            <option value="refund">
                                                Refund
                                            </option>
                                            <option value="replacement">
                                                Replacement
                                            </option>
                                            <option value="store_credit">
                                                Store Credit
                                            </option>
                                        </select>
                                    </label>

                                    <label className="adm-field full">
                                        <span>Admin Note</span>

                                        <textarea
                                            className="adm-textarea"
                                            value={note}
                                            onChange={(event) =>
                                                setNote(event.target.value)
                                            }
                                            placeholder="Decision reason or internal return note..."
                                        />
                                    </label>
                                </div>

                                <button
                                    type="button"
                                    className="adm-btn adm-btn-primary"
                                    onClick={submitAction}
                                >
                                    Apply Return Action
                                </button>

                                <p className="adm-form-help">
                                    Marking a return approved/completed does not
                                    silently pay customer money. Refund payment
                                    remains under Finance → Refunds.
                                </p>
                            </AdminCard>
                        </div>

                        <AdminCard title="Return Items">
                            {!detail.items?.length ? (
                                <AdminEmpty
                                    title="No return item data"
                                />
                            ) : (
                                <div className="adm-table-wrap">
                                    <table className="adm-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Condition</th>
                                                <th>Reason</th>
                                                <th>Requested Refund</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {detail.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td data-label="Product">
                                                        <strong>
                                                            {
                                                                item.order_item
                                                                    ?.product_name
                                                                || "Order Item"
                                                            }
                                                        </strong>

                                                        <span className="adm-table-sub">
                                                            {
                                                                item.order_item
                                                                    ?.sku
                                                                || "—"
                                                            }
                                                        </span>
                                                    </td>

                                                    <td data-label="Qty">
                                                        {item.quantity}
                                                    </td>

                                                    <td data-label="Condition">
                                                        {item.condition || "—"}
                                                    </td>

                                                    <td data-label="Reason">
                                                        {item.reason || "—"}
                                                    </td>

                                                    <td data-label="Requested Refund">
                                                        {money(
                                                            item.requested_refund_amount,
                                                            detail.currency || "BDT"
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </AdminCard>

                        <AdminCard title="Refund Records">
                            {!detail.refunds?.length ? (
                                <AdminEmpty
                                    title="No refund record created yet"
                                />
                            ) : (
                                <div className="adm-table-wrap">
                                    <table className="adm-table">
                                        <thead>
                                            <tr>
                                                <th>Refund</th>
                                                <th>Amount</th>
                                                <th>Method</th>
                                                <th>Status</th>
                                                <th>Transaction</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {detail.refunds.map((refund) => (
                                                <tr key={refund.id}>
                                                    <td data-label="Refund">
                                                        <strong>
                                                            {refund.refund_number}
                                                        </strong>
                                                    </td>

                                                    <td data-label="Amount">
                                                        {money(
                                                            refund.amount,
                                                            detail.currency || "BDT"
                                                        )}
                                                    </td>

                                                    <td data-label="Method">
                                                        {refund.method || "—"}
                                                    </td>

                                                    <td data-label="Status">
                                                        <AdminBadge
                                                            value={refund.status}
                                                        />
                                                    </td>

                                                    <td data-label="Transaction">
                                                        {refund.transaction_id || "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </AdminCard>
                    </>
                )}
            </AdminModal>

            <AdminToast toast={toast} />
        </AdminLayout>
    );
}
