import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import SellerLayout from "./Layout";
import sellerSuiteService from "../../services/sellerSuiteService";

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
    titleCase,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


const EMPTY_BANK = {
    type: "bank",
    account_name: "",
    account_number: "",
    bank_name: "",
    branch_name: "",
    routing_number: "",
    mobile_provider: "",
    is_default: false,
};


export default function SellerWallet() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [tab, setTab] = useState("transactions");
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [bankOpen, setBankOpen] = useState(false);
    const [editingBankId, setEditingBankId] = useState(null);
    const [bank, setBank] = useState(EMPTY_BANK);
    const [withdrawal, setWithdrawal] = useState({
        amount: "",
        vendor_bank_account_id: "",
        note: "",
    });
    const [saving, setSaving] = useState(false);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.wallet();
            setData(response.data || {});
        } catch (exception) {
            notify(firstError(exception, "Wallet could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        load();
    }, [load]);

    const wallet = data?.wallet || {};
    const accounts = data?.bank_accounts || [];
    const verifiedAccounts = useMemo(
        () => accounts.filter((row) => row.is_verified),
        [accounts]
    );

    const submitWithdrawal = async () => {
        setSaving(true);

        try {
            const response = await sellerSuiteService.requestWithdrawal({
                amount: Number(withdrawal.amount || 0),
                vendor_bank_account_id: Number(
                    withdrawal.vendor_bank_account_id
                ),
                note: withdrawal.note,
            });

            notify(response.message || "Withdrawal submitted.");
            setWithdrawOpen(false);
            setWithdrawal({
                amount: "",
                vendor_bank_account_id: "",
                note: "",
            });
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const openBank = (row = null) => {
        setEditingBankId(row?.id || null);
        setBank(
            row
                ? {
                    type: row.type || "bank",
                    account_name: row.account_name || "",
                    account_number: row.account_number || "",
                    bank_name: row.bank_name || "",
                    branch_name: row.branch_name || "",
                    routing_number: row.routing_number || "",
                    mobile_provider: row.mobile_provider || "",
                    is_default: Boolean(row.is_default),
                }
                : EMPTY_BANK
        );
        setBankOpen(true);
    };

    const saveBank = async () => {
        setSaving(true);

        try {
            const response = await sellerSuiteService.saveBankAccount(
                bank,
                editingBankId
            );

            notify(response.message || "Payout account saved.");
            setBankOpen(false);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const deleteBank = async (id) => {
        if (!window.confirm("Remove this payout account?")) return;

        try {
            const response = await sellerSuiteService.deleteBankAccount(id);
            notify(response.message || "Account removed.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    const cancelWithdrawal = async (id) => {
        if (!window.confirm("Cancel this pending withdrawal request?")) return;

        try {
            const response =
                await sellerSuiteService.cancelWithdrawal(id);
            notify(response.message || "Withdrawal cancelled.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Wallet & Payouts"
                    description="Track seller earnings, wallet transactions, payout accounts, withdrawal requests and processed payouts."
                    actions={
                        <>
                            <button
                                type="button"
                                className="ss-btn"
                                onClick={() => openBank()}
                            >
                                <i className="fa-solid fa-building-columns" />
                                Add Payout Account
                            </button>

                            <button
                                type="button"
                                className="ss-btn ss-btn-primary"
                                onClick={() => setWithdrawOpen(true)}
                            >
                                <i className="fa-solid fa-money-bill-transfer" />
                                Request Withdrawal
                            </button>
                        </>
                    }
                />

                {loading ? (
                    <SellerSuiteLoader text="Loading wallet..." />
                ) : (
                    <>
                        <div className="ss-stat-grid">
                            <SellerSuiteStat
                                icon="fa-solid fa-wallet"
                                label="Available"
                                value={money(wallet.available_balance, wallet.currency)}
                            />
                            <SellerSuiteStat
                                icon="fa-solid fa-lock"
                                label="Pending"
                                value={money(wallet.pending_balance, wallet.currency)}
                                tone="blue"
                            />
                            <SellerSuiteStat
                                icon="fa-solid fa-hourglass-half"
                                label="Reserved"
                                value={money(
                                    wallet.reserved_for_withdrawal,
                                    wallet.currency
                                )}
                            />
                            <SellerSuiteStat
                                icon="fa-solid fa-sack-dollar"
                                label="Lifetime Paid"
                                value={money(
                                    wallet.lifetime_paid_out,
                                    wallet.currency
                                )}
                                tone="green"
                            />
                        </div>

                        {verifiedAccounts.length === 0 && (
                            <SellerSuiteAlert type="warning">
                                Add a payout account first. A newly added or changed
                                bank/mobile banking account must be verified by Facevaly
                                before it can receive withdrawals.
                            </SellerSuiteAlert>
                        )}

                        <div className="ss-tabs">
                            {[
                                ["transactions", "Transactions"],
                                ["withdrawals", "Withdrawal Requests"],
                                ["payouts", "Payout History"],
                                ["accounts", "Payout Accounts"],
                            ].map(([value, label]) => (
                                <button
                                    type="button"
                                    key={value}
                                    className={
                                        tab === value
                                            ? "ss-tab active"
                                            : "ss-tab"
                                    }
                                    onClick={() => setTab(value)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {tab === "transactions" && (
                            <SellerSuiteCard
                                title="Wallet Transactions"
                                description="Credits, debits, settlements and adjustments."
                            >
                                {(data?.transactions || []).length === 0 ? (
                                    <SellerSuiteEmpty
                                        icon="fa-solid fa-receipt"
                                        title="No wallet transactions yet"
                                    />
                                ) : (
                                    <div className="ss-table-wrap">
                                        <table className="ss-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Source</th>
                                                    <th>Bucket</th>
                                                    <th>Amount</th>
                                                    <th>Balance</th>
                                                    <th>Note</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.transactions.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>
                                                            {formatDate(row.created_at)}
                                                        </td>
                                                        <td>
                                                            <SellerSuiteBadge
                                                                value={row.type}
                                                            />
                                                        </td>
                                                        <td>{titleCase(row.source)}</td>
                                                        <td>{titleCase(row.bucket)}</td>
                                                        <td>
                                                            {money(
                                                                row.amount,
                                                                wallet.currency
                                                            )}
                                                        </td>
                                                        <td>
                                                            {money(
                                                                row.balance_after,
                                                                wallet.currency
                                                            )}
                                                        </td>
                                                        <td>{row.note || "—"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SellerSuiteCard>
                        )}

                        {tab === "withdrawals" && (
                            <SellerSuiteCard title="Withdrawal Requests">
                                {(data?.withdrawals || []).length === 0 ? (
                                    <SellerSuiteEmpty
                                        icon="fa-solid fa-money-bill-transfer"
                                        title="No withdrawal requests"
                                    />
                                ) : (
                                    <div className="ss-table-wrap">
                                        <table className="ss-table">
                                            <thead>
                                                <tr>
                                                    <th>Request</th>
                                                    <th>Account</th>
                                                    <th>Amount</th>
                                                    <th>Net</th>
                                                    <th>Status</th>
                                                    <th>Requested</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.withdrawals.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>
                                                            <strong>
                                                                {row.withdrawal_number}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            {row.bank_account
                                                                ?.masked_account_number ||
                                                                "—"}
                                                        </td>
                                                        <td>
                                                            {money(
                                                                row.amount,
                                                                wallet.currency
                                                            )}
                                                        </td>
                                                        <td>
                                                            {money(
                                                                row.net_amount,
                                                                wallet.currency
                                                            )}
                                                        </td>
                                                        <td>
                                                            <SellerSuiteBadge
                                                                value={row.status}
                                                            />
                                                            {row.rejection_reason && (
                                                                <span className="ss-table-sub">
                                                                    {
                                                                        row.rejection_reason
                                                                    }
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            {formatDate(
                                                                row.requested_at
                                                            )}
                                                        </td>
                                                        <td>
                                                            {row.status === "pending" && (
                                                                <button
                                                                    type="button"
                                                                    className="ss-btn ss-btn-danger"
                                                                    onClick={() =>
                                                                        cancelWithdrawal(
                                                                            row.id
                                                                        )
                                                                    }
                                                                >
                                                                    Cancel
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SellerSuiteCard>
                        )}

                        {tab === "payouts" && (
                            <SellerSuiteCard title="Payout History">
                                {(data?.payouts || []).length === 0 ? (
                                    <SellerSuiteEmpty
                                        icon="fa-solid fa-circle-dollar-to-slot"
                                        title="No payouts processed yet"
                                    />
                                ) : (
                                    <div className="ss-table-wrap">
                                        <table className="ss-table">
                                            <thead>
                                                <tr>
                                                    <th>Payout</th>
                                                    <th>Gross</th>
                                                    <th>Fee</th>
                                                    <th>Net</th>
                                                    <th>Method</th>
                                                    <th>Status</th>
                                                    <th>Transaction</th>
                                                    <th>Paid At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {data.payouts.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>
                                                            {row.payout_number}
                                                        </td>
                                                        <td>
                                                            {money(
                                                                row.gross_amount,
                                                                wallet.currency
                                                            )}
                                                        </td>
                                                        <td>
                                                            {money(
                                                                row.fee_amount,
                                                                wallet.currency
                                                            )}
                                                        </td>
                                                        <td>
                                                            {money(
                                                                row.net_amount,
                                                                wallet.currency
                                                            )}
                                                        </td>
                                                        <td>
                                                            {titleCase(
                                                                row.payment_method
                                                            )}
                                                        </td>
                                                        <td>
                                                            <SellerSuiteBadge
                                                                value={row.status}
                                                            />
                                                        </td>
                                                        <td>
                                                            {row.transaction_id || "—"}
                                                        </td>
                                                        <td>
                                                            {formatDate(row.paid_at)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SellerSuiteCard>
                        )}

                        {tab === "accounts" && (
                            <SellerSuiteCard
                                title="Payout Accounts"
                                description="Only verified accounts can be selected for a withdrawal request."
                            >
                                {accounts.length === 0 ? (
                                    <SellerSuiteEmpty
                                        icon="fa-solid fa-building-columns"
                                        title="No payout account added"
                                    />
                                ) : (
                                    <div className="ss-table-wrap">
                                        <table className="ss-table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Account</th>
                                                    <th>Bank / Provider</th>
                                                    <th>Default</th>
                                                    <th>Verification</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.map((row) => (
                                                    <tr key={row.id}>
                                                        <td>{titleCase(row.type)}</td>
                                                        <td>
                                                            <strong>
                                                                {row.account_name}
                                                            </strong>
                                                            <span className="ss-table-sub">
                                                                {
                                                                    row.masked_account_number
                                                                }
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {row.bank_name ||
                                                                row.mobile_provider ||
                                                                "—"}
                                                        </td>
                                                        <td>
                                                            {row.is_default
                                                                ? "Yes"
                                                                : "No"}
                                                        </td>
                                                        <td>
                                                            <SellerSuiteBadge
                                                                value={
                                                                    row.is_verified
                                                                        ? "verified"
                                                                        : "pending"
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <div className="ss-page-actions">
                                                                <button
                                                                    type="button"
                                                                    className="ss-btn"
                                                                    onClick={() =>
                                                                        openBank(row)
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="ss-btn ss-btn-danger"
                                                                    onClick={() =>
                                                                        deleteBank(
                                                                            row.id
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SellerSuiteCard>
                        )}
                    </>
                )}
            </div>

            <SellerSuiteModal
                open={withdrawOpen}
                title="Request Withdrawal"
                onClose={() => setWithdrawOpen(false)}
                size="small"
            >
                <SellerSuiteAlert type="info">
                    Withdrawable balance:{" "}
                    <strong>
                        {money(
                            wallet.withdrawable_balance,
                            wallet.currency
                        )}
                    </strong>
                    <br />
                    Minimum payout:{" "}
                    {money(
                        wallet.minimum_payout_amount,
                        wallet.currency
                    )}
                </SellerSuiteAlert>

                <div className="ss-form-grid">
                    <label>
                        <span>Amount</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="1"
                            step="0.01"
                            value={withdrawal.amount}
                            onChange={(event) =>
                                setWithdrawal((current) => ({
                                    ...current,
                                    amount: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Verified Payout Account</span>
                        <select
                            className="ss-select"
                            value={withdrawal.vendor_bank_account_id}
                            onChange={(event) =>
                                setWithdrawal((current) => ({
                                    ...current,
                                    vendor_bank_account_id:
                                        event.target.value,
                                }))
                            }
                        >
                            <option value="">Select account</option>
                            {verifiedAccounts.map((row) => (
                                <option value={row.id} key={row.id}>
                                    {row.account_name} ·{" "}
                                    {row.masked_account_number}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="full">
                        <span>Note</span>
                        <textarea
                            className="ss-textarea"
                            value={withdrawal.note}
                            onChange={(event) =>
                                setWithdrawal((current) => ({
                                    ...current,
                                    note: event.target.value,
                                }))
                            }
                        />
                    </label>
                </div>

                <div className="ss-modal-footer">
                    <button
                        type="button"
                        className="ss-btn"
                        onClick={() => setWithdrawOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="ss-btn ss-btn-primary"
                        disabled={
                            saving ||
                            !withdrawal.vendor_bank_account_id ||
                            !withdrawal.amount
                        }
                        onClick={submitWithdrawal}
                    >
                        Submit Request
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteModal
                open={bankOpen}
                title={editingBankId ? "Edit Payout Account" : "Add Payout Account"}
                onClose={() => setBankOpen(false)}
                size="medium"
            >
                <SellerSuiteAlert type="warning">
                    New accounts and accounts whose sensitive details are changed
                    become unverified until Facevaly verifies them.
                </SellerSuiteAlert>

                <div className="ss-form-grid">
                    <label>
                        <span>Account Type</span>
                        <select
                            className="ss-select"
                            value={bank.type}
                            onChange={(event) =>
                                setBank((current) => ({
                                    ...current,
                                    type: event.target.value,
                                }))
                            }
                        >
                            <option value="bank">Bank</option>
                            <option value="mobile_banking">
                                Mobile Banking
                            </option>
                        </select>
                    </label>

                    <label>
                        <span>Account Name</span>
                        <input
                            className="ss-input"
                            value={bank.account_name}
                            onChange={(event) =>
                                setBank((current) => ({
                                    ...current,
                                    account_name: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Account Number</span>
                        <input
                            className="ss-input"
                            value={bank.account_number}
                            onChange={(event) =>
                                setBank((current) => ({
                                    ...current,
                                    account_number: event.target.value,
                                }))
                            }
                        />
                    </label>

                    {bank.type === "bank" ? (
                        <>
                            <label>
                                <span>Bank Name</span>
                                <input
                                    className="ss-input"
                                    value={bank.bank_name}
                                    onChange={(event) =>
                                        setBank((current) => ({
                                            ...current,
                                            bank_name: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Branch Name</span>
                                <input
                                    className="ss-input"
                                    value={bank.branch_name}
                                    onChange={(event) =>
                                        setBank((current) => ({
                                            ...current,
                                            branch_name: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Routing Number</span>
                                <input
                                    className="ss-input"
                                    value={bank.routing_number}
                                    onChange={(event) =>
                                        setBank((current) => ({
                                            ...current,
                                            routing_number: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        </>
                    ) : (
                        <label>
                            <span>Provider</span>
                            <select
                                className="ss-select"
                                value={bank.mobile_provider}
                                onChange={(event) =>
                                    setBank((current) => ({
                                        ...current,
                                        mobile_provider: event.target.value,
                                    }))
                                }
                            >
                                <option value="">Select provider</option>
                                <option value="bkash">bKash</option>
                                <option value="nagad">Nagad</option>
                                <option value="rocket">Rocket</option>
                            </select>
                        </label>
                    )}

                    <label className="full">
                        <span className="ss-check">
                            <input
                                type="checkbox"
                                checked={bank.is_default}
                                onChange={(event) =>
                                    setBank((current) => ({
                                        ...current,
                                        is_default: event.target.checked,
                                    }))
                                }
                            />
                            Make default payout account
                        </span>
                    </label>
                </div>

                <div className="ss-modal-footer">
                    <button
                        type="button"
                        className="ss-btn"
                        onClick={() => setBankOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="ss-btn ss-btn-primary"
                        disabled={saving}
                        onClick={saveBank}
                    >
                        Save Account
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
