import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminCard, AdminEmpty, AdminLoader, AdminModal, AdminPageHeader,
    AdminPagination, AdminToast, firstError, formatDate, titleCase,
} from "../../components/admin/AdminUI";
import "./admin.css";

export default function AdminAuditLogs() {
    const [filters, setFilters] = useState({
        q: "",
        module: "",
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
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = useCallback((m, t = "success") => {
        setToast({ message: m, type: t });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.auditLogs(filters);
            setRows(response.data || []);
            setModules(response.filters?.modules || []);

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

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Admin Audit Logs"
                description="Trace sensitive administrative actions, actor, target, IP, and before/after snapshots."
            />
            <AdminCard>
                <div className="adm-toolbar">
                    <input
                        className="adm-input grow"
                        placeholder="Search action or description..."
                        value={filters.q}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                q: event.target.value,
                                page: 1,
                            }))
                        }
                    />
                    <select
                        className="adm-select"
                        value={filters.module}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                module: event.target.value,
                                page: 1,
                            }))
                        }
                    >
                        <option value="">All modules</option>
                        {modules.map((module) => (
                            <option key={module} value={module}>
                                {titleCase(module)}
                            </option>
                        ))}
                    </select>
                </div>
                {loading ? (
                    <AdminLoader />
                ) : !rows.length ? (
                    <AdminEmpty title="No audit events" />
                ) : (
                    <>
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Admin</th>
                                        <th>Module</th>
                                        <th>Action</th>
                                        <th>Target</th>
                                        <th>IP</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td data-label="Date">{formatDate(row.created_at)}</td>
                                            <td data-label="Admin">
                                                <strong>{row.admin || "System"}</strong>
                                                <span className="adm-table-sub">
                                                    {row.admin_email || "—"}
                                                </span>
                                            </td>
                                            <td data-label="Module">{titleCase(row.module)}</td>
                                            <td data-label="Action">
                                                {titleCase(row.action)}
                                                <span className="adm-table-sub">
                                                    {row.description || ""}
                                                </span>
                                            </td>
                                            <td data-label="Target">
                                                {row.auditable_type
                                                    ? `${String(row.auditable_type).split("\\").pop()} #${row.auditable_id || "—"}`
                                                    : "—"}
                                            </td>
                                            <td data-label="IP">{row.ip_address || "—"}</td>
                                            <td data-label="Action">
                                                <button className="adm-btn" onClick={() => setDetail(row)}>
                                                    Details
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
                open={Boolean(detail)}
                title="Audit Event Details"
                size="large"
                onClose={() => setDetail(null)}
            >
                {detail && (
                    <div className="adm-form-grid">
                        <div className="adm-field">
                            <span>Admin</span>
                            <strong>{detail.admin || "System"}</strong>
                        </div>
                        <div className="adm-field">
                            <span>Date</span>
                            <strong>{formatDate(detail.created_at)}</strong>
                        </div>
                        <div className="adm-field">
                            <span>Module</span>
                            <strong>{titleCase(detail.module)}</strong>
                        </div>
                        <div className="adm-field">
                            <span>Action</span>
                            <strong>{titleCase(detail.action)}</strong>
                        </div>
                        <div className="adm-field full">
                            <span>Description</span>
                            <strong>{detail.description || "—"}</strong>
                        </div>
                        <div className="adm-field full">
                            <span>Old Values</span>
                            <pre
                                style={{
                                    whiteSpace: "pre-wrap",
                                    fontSize: 7,
                                    background: "#f8fafc",
                                    padding: 9,
                                    borderRadius: 7,
                                }}
                            >
                                {JSON.stringify(detail.old_values, null, 2)}
                            </pre>
                        </div>
                        <div className="adm-field full">
                            <span>New Values</span>
                            <pre
                                style={{
                                    whiteSpace: "pre-wrap",
                                    fontSize: 7,
                                    background: "#f8fafc",
                                    padding: 9,
                                    borderRadius: 7,
                                }}
                            >
                                {JSON.stringify(detail.new_values, null, 2)}
                            </pre>
                        </div>
                        <div className="adm-field full">
                            <span>Metadata</span>
                            <pre
                                style={{
                                    whiteSpace: "pre-wrap",
                                    fontSize: 7,
                                    background: "#f8fafc",
                                    padding: 9,
                                    borderRadius: 7,
                                }}
                            >
                                {JSON.stringify(detail.metadata, null, 2)}
                            </pre>
                        </div>
                        <div className="adm-field full">
                            <span>User Agent</span>
                            <small>{detail.user_agent || "—"}</small>
                        </div>
                    </div>
                )}
            </AdminModal>
            <AdminToast toast={toast} />
        </AdminLayout>
    );
}
