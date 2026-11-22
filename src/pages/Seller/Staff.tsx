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
    SellerSuiteToast,
    firstError,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


export default function SellerStaff() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        login: "",
        role: "staff",
        permissions: [],
        status: "active",
    });

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.staff();
            setData({
                ...(response.data || {}),
                membership: response.membership || {},
            });
        } catch (exception) {
            notify(firstError(exception, "Seller staff could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        load();
    }, [load]);

    const owner = Boolean(data?.membership?.is_owner);

    const openCreate = () => {
        setEditing(null);
        setForm({
            login: "",
            role: "staff",
            permissions: [
                "dashboard.view",
                "orders.manage",
                "products.manage",
            ],
            status: "active",
        });
        setModal(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setForm({
            login: row.email || row.phone || "",
            role: row.role || "staff",
            permissions: Array.isArray(row.permissions)
                ? row.permissions
                : Object.keys(row.permissions || {}).filter(
                    (key) => row.permissions[key]
                ),
            status: row.status || "active",
        });
        setModal(true);
    };

    const togglePermission = (permission) => {
        setForm((current) => ({
            ...current,
            permissions: current.permissions.includes(permission)
                ? current.permissions.filter((row) => row !== permission)
                : [...current.permissions, permission],
        }));
    };

    const save = async () => {
        setSaving(true);

        try {
            const response = editing
                ? await sellerSuiteService.updateStaff(editing.id, {
                    role: form.role,
                    permissions: form.permissions,
                    status: form.status,
                })
                : await sellerSuiteService.addStaff({
                    login: form.login,
                    role: form.role,
                    permissions: form.permissions,
                });

            notify(response.message || "Seller staff saved.");
            setModal(false);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Remove this staff member from the seller store?")) {
            return;
        }

        try {
            const response = await sellerSuiteService.deleteStaff(id);
            notify(response.message || "Staff removed.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Staff & Permissions"
                    description="Delegate seller work without exposing every store feature. Only the store owner can add/remove staff or change staff permissions."
                    actions={
                        owner && (
                            <button
                                type="button"
                                className="ss-btn ss-btn-primary"
                                onClick={openCreate}
                            >
                                <i className="fa-solid fa-user-plus" />
                                Add Staff
                            </button>
                        )
                    }
                />

                <SellerSuiteCard>
                    {loading ? (
                        <SellerSuiteLoader text="Loading seller staff..." />
                    ) : (data?.staff || []).length === 0 ? (
                        <SellerSuiteEmpty
                            icon="fa-solid fa-user-group"
                            title="No seller staff"
                        />
                    ) : (
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Permissions</th>
                                        <th>Status</th>
                                        <th>Owner</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.staff.map((row) => {
                                        const permissions = Array.isArray(
                                            row.permissions
                                        )
                                            ? row.permissions
                                            : Object.keys(
                                                row.permissions || {}
                                            ).filter(
                                                (key) =>
                                                    row.permissions[key]
                                            );

                                        return (
                                            <tr key={row.id}>
                                                <td>
                                                    <strong>{row.name}</strong>
                                                    <span className="ss-table-sub">
                                                        {row.email || row.phone}
                                                    </span>
                                                </td>
                                                <td>{row.role}</td>
                                                <td>
                                                    {permissions.length
                                                        ? `${permissions.length} permission(s)`
                                                        : "No permissions"}
                                                </td>
                                                <td>
                                                    <SellerSuiteBadge
                                                        value={row.status}
                                                    />
                                                </td>
                                                <td>
                                                    {row.is_owner ? "Yes" : "No"}
                                                </td>
                                                <td>
                                                    {owner &&
                                                        !row.is_owner && (
                                                            <div className="ss-page-actions">
                                                                <button
                                                                    type="button"
                                                                    className="ss-btn"
                                                                    onClick={() =>
                                                                        openEdit(
                                                                            row
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="ss-btn ss-btn-danger"
                                                                    onClick={() =>
                                                                        remove(
                                                                            row.id
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SellerSuiteCard>
            </div>

            <SellerSuiteModal
                open={modal}
                title={editing ? "Edit Seller Staff" : "Add Seller Staff"}
                onClose={() => setModal(false)}
                size="large"
            >
                <div className="ss-form-grid">
                    {!editing && (
                        <label className="full">
                            <span>Existing Facevaly User Email or Phone</span>
                            <input
                                className="ss-input"
                                value={form.login}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        login: event.target.value,
                                    }))
                                }
                            />
                            <small className="ss-form-hint">
                                The user must already have a Facevaly user account.
                            </small>
                        </label>
                    )}

                    <label>
                        <span>Role Name</span>
                        <input
                            className="ss-input"
                            value={form.role}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    role: event.target.value,
                                }))
                            }
                        />
                    </label>

                    {editing && (
                        <label>
                            <span>Status</span>
                            <select
                                className="ss-select"
                                value={form.status}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        status: event.target.value,
                                    }))
                                }
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </label>
                    )}
                </div>

                <div style={{ marginTop: 16 }}>
                    <strong style={{ fontSize: 11 }}>Permissions</strong>
                    <div
                        style={{
                            marginTop: 9,
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill,minmax(210px,1fr))",
                            gap: 8,
                        }}
                    >
                        {(data?.allowed_permissions || []).map((permission) => (
                            <label
                                className="ss-check"
                                key={permission.value}
                            >
                                <input
                                    type="checkbox"
                                    checked={form.permissions.includes(
                                        permission.value
                                    )}
                                    onChange={() =>
                                        togglePermission(permission.value)
                                    }
                                />
                                {permission.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="ss-modal-footer">
                    <button
                        type="button"
                        className="ss-btn"
                        onClick={() => setModal(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="ss-btn ss-btn-primary"
                        disabled={saving}
                        onClick={save}
                    >
                        Save Staff
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
