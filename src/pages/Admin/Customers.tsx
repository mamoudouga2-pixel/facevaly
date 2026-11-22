import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import { useAdminAuth } from "../../admin/AdminAuthContext";
import {
    AdminBadge, AdminCard, AdminEmpty, AdminLoader, AdminPageHeader,
    AdminPagination, AdminToast, firstError, formatDate, money,
} from "../../components/admin/AdminUI";
import "./admin.css";

export default function AdminCustomers() {
    const { can } = useAdminAuth();
    const canManage = can("customers.manage");

    const [filters, setFilters] = useState({
        q: "",
        status: "",
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
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.customers(filters);
            setRows(response.data || []);
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

    const changeStatus = async (row, status) => {
        if (!canManage) {
            notify("You do not have permission to change customer status.", "error");
            return;
        }

        if (!window.confirm(`Change ${row.name}'s account status to ${status}?`)) {
            return;
        }

        try {
            const response = await adminService.customerStatus(row.id, status);
            notify(response.message);
            await load();
        } catch (error) {
            notify(firstError(error), "error");
        }
    };

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Customers"
                description="Customer accounts, order activity, spend and account status controls."
            />
            <AdminCard>
                <div className="adm-toolbar">
                    <input
                        className="adm-input grow"
                        placeholder="Search name, email or phone..."
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
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>

                {loading ? (
                    <AdminLoader />
                ) : !rows.length ? (
                    <AdminEmpty title="No customers found" />
                ) : (
                    <>
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th>Orders</th>
                                        <th>Completed</th>
                                        <th>Spend</th>
                                        <th>Seller Link</th>
                                        <th>Joined</th>
                                        {canManage ? <th /> : null}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td data-label="Customer">
                                                <strong>{row.name}</strong>
                                                <span className="adm-table-sub">
                                                    {row.email || row.phone || "—"}
                                                </span>
                                            </td>
                                            <td data-label="Status">
                                                <AdminBadge value={row.status} />
                                            </td>
                                            <td data-label="Orders">{row.orders_count}</td>
                                            <td data-label="Completed">{row.completed_orders}</td>
                                            <td data-label="Spend">{money(row.total_spend)}</td>
                                            <td data-label="Seller Link">
                                                {row.seller_memberships
                                                    ? `${row.seller_memberships} membership(s)`
                                                    : "No"}
                                            </td>
                                            <td data-label="Joined">{formatDate(row.created_at)}</td>
                                            {canManage ? (
                                                <td data-label="Action">
                                                    <select
                                                        className="adm-select"
                                                        value={row.status}
                                                        onChange={(event) =>
                                                            changeStatus(row, event.target.value)
                                                        }
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="suspended">Suspended</option>
                                                        <option value="blocked">Blocked</option>
                                                    </select>
                                                </td>
                                            ) : null}
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
            <AdminToast toast={toast} />
        </AdminLayout>
    );
}
