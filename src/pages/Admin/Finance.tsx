import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminBadge, AdminCard, AdminEmpty, AdminLoader, AdminMetric,
    AdminModal, AdminPageHeader, AdminToast, firstError, formatDate, money,
} from "../../components/admin/AdminUI";
import "./admin.css";

const emptyRule = {
    name: "", commission_type: "percentage", commission_value: "",
    priority: 0, is_active: true, starts_at: "", ends_at: "",
    vendor_id: "", category_id: "", product_id: "",
};

export default function AdminFinance() {
    const [tab, setTab] = useState("withdrawals");
    const [overview, setOverview] = useState(null);
    const [withdrawals, setWithdrawals] = useState([]);
    const [refunds, setRefunds] = useState([]);
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({});
    const [ruleId, setRuleId] = useState(null);
    const [rule, setRule] = useState(emptyRule);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [a, b, c, d] = await Promise.all([
                adminService.finance(),
                adminService.withdrawals({ per_page: 100 }),
                adminService.refunds({ per_page: 100 }),
                adminService.commissionRules(),
            ]);
            setOverview(a.data || null);
            setWithdrawals(b.data || []);
            setRefunds(c.data || []);
            setRules(d.data || []);
        } catch (e) {
            notify(firstError(e), "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => { load(); }, [load]);

    const reviewWithdrawal = async (row, action) => {
        const reason = action === "reject"
            ? window.prompt("Rejection reason:") || ""
            : null;
        if (action === "reject" && !reason.trim()) return;
        try {
            const r = await adminService.reviewWithdrawal(row.id, { action, reason });
            notify(r.message);
            await load();
        } catch (e) { notify(firstError(e), "error"); }
    };

    const openPayout = (row) => {
        setSelected(row);
        setForm({ payment_method: "bank_transfer", transaction_id: "", note: "" });
        setModal("payout");
    };

    const payWithdrawal = async () => {
        try {
            const r = await adminService.payWithdrawal(selected.id, form);
            notify(r.message);
            setModal(null);
            await load();
        } catch (e) { notify(firstError(e), "error"); }
    };

    const refundAction = async (row, action) => {
        if (action === "paid") {
            setSelected(row);
            setForm({
                action: "paid",
                method: row.method || "manual",
                transaction_id: row.transaction_id || "",
                reason: row.reason || "",
            });
            setModal("refund");
            return;
        }
        const reason = action === "reject"
            ? window.prompt("Refund rejection reason:") || ""
            : null;
        try {
            const r = await adminService.processRefund(row.id, { action, reason });
            notify(r.message);
            await load();
        } catch (e) { notify(firstError(e), "error"); }
    };

    const markRefundPaid = async () => {
        try {
            const r = await adminService.processRefund(selected.id, form);
            notify(r.message);
            setModal(null);
            await load();
        } catch (e) { notify(firstError(e), "error"); }
    };

    const openRule = (row = null) => {
        setRuleId(row?.id || null);
        setRule(row ? {
            name: row.name || "",
            commission_type: row.commission_type || "percentage",
            commission_value: row.commission_value ?? "",
            priority: row.priority || 0,
            is_active: Boolean(row.is_active),
            starts_at: row.starts_at ? String(row.starts_at).slice(0, 16) : "",
            ends_at: row.ends_at ? String(row.ends_at).slice(0, 16) : "",
            vendor_id: row.vendor_id || "",
            category_id: row.category_id || "",
            product_id: row.product_id || "",
        } : emptyRule);
        setModal("rule");
    };

    const saveRule = async () => {
        try {
            const payload = {
                ...rule,
                vendor_id: rule.vendor_id ? Number(rule.vendor_id) : null,
                category_id: rule.category_id ? Number(rule.category_id) : null,
                product_id: rule.product_id ? Number(rule.product_id) : null,
                commission_value: Number(rule.commission_value),
                priority: Number(rule.priority),
                starts_at: rule.starts_at || null,
                ends_at: rule.ends_at || null,
            };
            const r = await adminService.saveCommissionRule(ruleId, payload);
            notify(r.message);
            setModal(null);
            await load();
        } catch (e) { notify(firstError(e), "error"); }
    };

    const deleteRule = async (id) => {
        if (!window.confirm("Delete this commission rule?")) return;
        try {
            const r = await adminService.deleteCommissionRule(id);
            notify(r.message);
            await load();
        } catch (e) { notify(firstError(e), "error"); }
    };

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Finance Center"
                description="Seller balances, withdrawals, payouts, refunds and commission rules."
                actions={tab === "commissions" ? (
                    <button className="adm-btn adm-btn-primary" onClick={() => openRule()}>
                        <i className="fa-solid fa-plus" /> Commission Rule
                    </button>
                ) : null}
            />

            {overview && <div className="adm-metric-grid">
                <AdminMetric icon="fa-solid fa-clock" label="Pending Wallet"
                    value={money(overview.wallets?.pending)} tone="amber" />
                <AdminMetric icon="fa-solid fa-wallet" label="Available Wallet"
                    value={money(overview.wallets?.available)} tone="green" />
                <AdminMetric icon="fa-solid fa-money-bill-transfer" label="Pending Withdrawals"
                    value={overview.withdrawals?.pending_count || 0} tone="blue" />
                <AdminMetric icon="fa-solid fa-rotate-left" label="Pending Refunds"
                    value={overview.refunds?.pending_count || 0} tone="red" />
            </div>}

            <div className="adm-tabs">
                {[
                    ["withdrawals", "Withdrawals"],
                    ["refunds", "Refunds"],
                    ["commissions", "Commission Rules"],
                ].map(([key, label]) => (
                    <button key={key} className={tab === key ? "active" : ""}
                        onClick={() => setTab(key)}>{label}</button>
                ))}
            </div>
            <div style={{ height: 10 }} />

            <AdminCard>
                {loading ? <AdminLoader /> : tab === "withdrawals" ? (
                    !withdrawals.length ? <AdminEmpty title="No withdrawal requests" /> :
                    <div className="adm-table-wrap"><table className="adm-table">
                        <thead><tr><th>Request</th><th>Seller</th><th>Amount</th>
                            <th>Net</th><th>Payout Account</th><th>Status</th><th>Requested</th><th /></tr></thead>
                        <tbody>{withdrawals.map(row => <tr key={row.id}>
                            <td data-label="Request"><strong>{row.withdrawal_number}</strong></td>
                            <td data-label="Seller">{row.vendor}</td>
                            <td data-label="Amount">{money(row.amount, row.currency)}</td>
                            <td data-label="Net">{money(row.net_amount, row.currency)}</td>
                            <td data-label="Account">
                                <strong>{row.bank_account?.account_name || "—"}</strong>
                                <span className="adm-table-sub">{row.bank_account?.account_number || "—"}</span>
                                {row.bank_account && <AdminBadge value={row.bank_account.is_verified ? "verified" : "pending"} />}
                            </td>
                            <td data-label="Status"><AdminBadge value={row.status} /></td>
                            <td data-label="Requested">{formatDate(row.requested_at)}</td>
                            <td data-label="Action"><div className="adm-table-actions">
                                {row.status === "pending" && <>
                                    <button className="adm-btn adm-btn-success" onClick={() => reviewWithdrawal(row, "approve")}>Approve</button>
                                    <button className="adm-btn adm-btn-danger" onClick={() => reviewWithdrawal(row, "reject")}>Reject</button>
                                </>}
                                {row.status === "approved" &&
                                    <button className="adm-btn adm-btn-primary" onClick={() => openPayout(row)}>Mark Paid</button>}
                            </div></td>
                        </tr>)}</tbody>
                    </table></div>
                ) : tab === "refunds" ? (
                    !refunds.length ? <AdminEmpty title="No refund records" /> :
                    <div className="adm-table-wrap"><table className="adm-table">
                        <thead><tr><th>Refund</th><th>Order</th><th>Seller</th><th>Customer</th>
                            <th>Amount</th><th>Status</th><th /></tr></thead>
                        <tbody>{refunds.map(row => <tr key={row.id}>
                            <td data-label="Refund"><strong>{row.refund_number}</strong>
                                <span className="adm-table-sub">{formatDate(row.created_at)}</span></td>
                            <td data-label="Order">{row.order_number}
                                <span className="adm-table-sub">{row.vendor_order_number}</span></td>
                            <td data-label="Seller">{row.vendor || "—"}</td>
                            <td data-label="Customer">{row.customer || "—"}
                                <span className="adm-table-sub">{row.phone || "—"}</span></td>
                            <td data-label="Amount">{money(row.amount)}</td>
                            <td data-label="Status"><AdminBadge value={row.status} /></td>
                            <td data-label="Action"><div className="adm-table-actions">
                                {row.status === "pending" &&
                                    <button className="adm-btn adm-btn-success" onClick={() => refundAction(row, "approve")}>Approve</button>}
                                {["pending","approved","processing"].includes(row.status) &&
                                    <button className="adm-btn adm-btn-primary" onClick={() => refundAction(row, "paid")}>Mark Paid</button>}
                                {["pending","approved"].includes(row.status) &&
                                    <button className="adm-btn adm-btn-danger" onClick={() => refundAction(row, "reject")}>Reject</button>}
                            </div></td>
                        </tr>)}</tbody>
                    </table></div>
                ) : (
                    !rules.length ? <AdminEmpty title="No commission rules" /> :
                    <div className="adm-table-wrap"><table className="adm-table">
                        <thead><tr><th>Rule</th><th>Scope</th><th>Commission</th><th>Priority</th><th>Status</th><th /></tr></thead>
                        <tbody>{rules.map(row => <tr key={row.id}>
                            <td data-label="Rule"><strong>{row.name}</strong></td>
                            <td data-label="Scope">{row.product?.name || row.category?.name || row.vendor?.name || "Marketplace Default"}</td>
                            <td data-label="Commission">{row.commission_type === "percentage"
                                ? `${row.commission_value}%` : money(row.commission_value)}</td>
                            <td data-label="Priority">{row.priority}</td>
                            <td data-label="Status"><AdminBadge value={row.is_active ? "active" : "inactive"} /></td>
                            <td data-label="Action"><div className="adm-table-actions">
                                <button className="adm-btn" onClick={() => openRule(row)}>Edit</button>
                                <button className="adm-btn adm-btn-danger" onClick={() => deleteRule(row.id)}>Delete</button>
                            </div></td>
                        </tr>)}</tbody>
                    </table></div>
                )}
            </AdminCard>

            <AdminModal open={Boolean(modal)} title={
                modal === "payout" ? "Process Seller Payout"
                : modal === "refund" ? "Mark Refund Paid"
                : `${ruleId ? "Edit" : "Create"} Commission Rule`
            } size={modal === "rule" ? "large" : "small"} onClose={() => setModal(null)}>
                {modal === "payout" ? <>
                    <div className="adm-price-summary">
                        <h3>Payout Confirmation</h3>
                        <p>Seller: <strong>{selected?.vendor}</strong></p>
                        <p>Gross: <strong>{money(selected?.amount)}</strong></p>
                        <p>Net: <strong>{money(selected?.net_amount)}</strong></p>
                    </div>
                    <div className="adm-form-grid" style={{ marginTop: 12 }}>
                        <label className="adm-field"><span>Payment Method</span>
                            <input className="adm-input" value={form.payment_method || ""}
                                onChange={e => setForm(c => ({...c, payment_method:e.target.value}))}/></label>
                        <label className="adm-field"><span>Transaction ID</span>
                            <input className="adm-input" value={form.transaction_id || ""}
                                onChange={e => setForm(c => ({...c, transaction_id:e.target.value}))}/></label>
                        <label className="adm-field full"><span>Note</span>
                            <textarea className="adm-textarea" value={form.note || ""}
                                onChange={e => setForm(c => ({...c, note:e.target.value}))}/></label>
                    </div>
                    <div className="adm-modal-footer">
                        <button className="adm-btn adm-btn-primary" onClick={payWithdrawal}>Confirm Paid</button>
                    </div>
                </> : modal === "refund" ? <>
                    <div className="adm-form-grid">
                        <label className="adm-field"><span>Method</span>
                            <input className="adm-input" value={form.method || ""}
                                onChange={e => setForm(c=>({...c,method:e.target.value}))}/></label>
                        <label className="adm-field"><span>Transaction ID</span>
                            <input className="adm-input" value={form.transaction_id || ""}
                                onChange={e => setForm(c=>({...c,transaction_id:e.target.value}))}/></label>
                        <label className="adm-field full"><span>Reason / Note</span>
                            <textarea className="adm-textarea" value={form.reason || ""}
                                onChange={e => setForm(c=>({...c,reason:e.target.value}))}/></label>
                    </div>
                    <div className="adm-modal-footer">
                        <button className="adm-btn adm-btn-primary" onClick={markRefundPaid}>Mark Paid</button>
                    </div>
                </> : modal === "rule" ? <>
                    <div className="adm-form-grid">
                        <label className="adm-field full"><span>Rule Name</span>
                            <input className="adm-input" value={rule.name}
                                onChange={e=>setRule(c=>({...c,name:e.target.value}))}/></label>
                        <label className="adm-field"><span>Type</span>
                            <select className="adm-select" value={rule.commission_type}
                                onChange={e=>setRule(c=>({...c,commission_type:e.target.value}))}>
                                <option value="percentage">Percentage</option><option value="flat">Flat</option>
                            </select></label>
                        <label className="adm-field"><span>Value</span>
                            <input className="adm-input" type="number" min="0" step="0.01" value={rule.commission_value}
                                onChange={e=>setRule(c=>({...c,commission_value:e.target.value}))}/></label>
                        <label className="adm-field"><span>Priority</span>
                            <input className="adm-input" type="number" min="0" value={rule.priority}
                                onChange={e=>setRule(c=>({...c,priority:e.target.value}))}/></label>
                        <label className="adm-check"><input type="checkbox" checked={rule.is_active}
                            onChange={e=>setRule(c=>({...c,is_active:e.target.checked}))}/> Active</label>
                        <label className="adm-field"><span>Starts At</span>
                            <input className="adm-input" type="datetime-local" value={rule.starts_at}
                                onChange={e=>setRule(c=>({...c,starts_at:e.target.value}))}/></label>
                        <label className="adm-field"><span>Ends At</span>
                            <input className="adm-input" type="datetime-local" value={rule.ends_at}
                                onChange={e=>setRule(c=>({...c,ends_at:e.target.value}))}/></label>
                        <p className="adm-form-help full">
                            Leave Vendor, Category and Product IDs blank for the marketplace default rule.
                            Scoped IDs are supported by the API.
                        </p>
                    </div>
                    <div className="adm-modal-footer">
                        <button className="adm-btn adm-btn-primary" onClick={saveRule}>Save Rule</button>
                    </div>
                </> : null}
            </AdminModal>
            <AdminToast toast={toast} />
        </AdminLayout>
    );
}
