import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminBadge, AdminCard, AdminEmpty, AdminLoader, AdminPageHeader,
    AdminPagination, AdminToast, firstError, formatDate,
} from "../../components/admin/AdminUI";
import { mediaUrl } from "../../config/api";
import "./admin.css";

export default function AdminReviews() {
    const [type, setType] = useState("product");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
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

    const notify = useCallback((message, t = "success") => {
        setToast({ message, type: t });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminService.reviews({
                type,
                status,
                per_page: perPage,
                page,
            });
            setRows(response.data || []);
            const nextMeta = response.meta || {};
            const total = Number(nextMeta.total || 0);
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
    }, [type, status, page, perPage, notify]);

    useEffect(() => {
        load();
    }, [load]);

    const moderate = async (row, next) => {
        try {
            const response = await adminService.moderateReview(row.type, row.id, next);
            notify(response.message);
            await load();
        } catch (error) {
            notify(firstError(error), "error");
        }
    };

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Review Moderation"
                description="Approve or reject customer product reviews and seller/store reviews."
            />
            <div className="adm-tabs">
                <button
                    className={type === "product" ? "active" : ""}
                    onClick={() => {
                        setType("product");
                        setPage(1);
                    }}
                >
                    Product Reviews
                </button>
                <button
                    className={type === "vendor" ? "active" : ""}
                    onClick={() => {
                        setType("vendor");
                        setPage(1);
                    }}
                >
                    Store Reviews
                </button>
            </div>
            <div style={{ height: 10 }} />
            <AdminCard>
                <div className="adm-toolbar">
                    <select
                        className="adm-select"
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
                {loading ? (
                    <AdminLoader />
                ) : !rows.length ? (
                    <AdminEmpty title="No reviews found" />
                ) : (
                    <>
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Review</th>
                                        <th>Seller</th>
                                        <th>{type === "product" ? "Product" : "Order"}</th>
                                        <th>Rating</th>
                                        <th>Verified</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row) => (
                                        <tr key={`${row.type}-${row.id}`}>
                                            <td data-label="Review">
                                                <strong>{row.name || "Customer"}</strong>
                                                <span className="adm-table-sub">
                                                    {row.review || "No review text"}
                                                </span>
                                                {row.images?.length ? (
                                                    <div style={{ display: "flex", gap: 4, marginTop: 5 }}>
                                                        {row.images.slice(0, 3).map((img) => (
                                                            <span className="adm-thumb" key={img.id}>
                                                                <img src={mediaUrl(img.image)} alt="Review" />
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td data-label="Seller">{row.vendor || "—"}</td>
                                            <td data-label={type === "product" ? "Product" : "Order"}>
                                                {type === "product" ? row.product || "—" : row.order_number || "—"}
                                                {row.sku && <span className="adm-table-sub">{row.sku}</span>}
                                            </td>
                                            <td data-label="Rating">
                                                {"★".repeat(Math.max(0, Math.min(5, row.rating || 0)))} {row.rating}/5
                                            </td>
                                            <td data-label="Verified">
                                                <AdminBadge value={row.is_verified_purchase ? "verified" : "unverified"} />
                                            </td>
                                            <td data-label="Status">
                                                <AdminBadge value={row.status} />
                                            </td>
                                            <td data-label="Date">{formatDate(row.created_at)}</td>
                                            <td data-label="Action">
                                                <div className="adm-table-actions">
                                                    <button
                                                        className="adm-btn adm-btn-success"
                                                        onClick={() => moderate(row, "approved")}
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="adm-btn adm-btn-danger"
                                                        onClick={() => moderate(row, "rejected")}
                                                    >
                                                        Reject
                                                    </button>
                                                    {row.status !== "pending" && (
                                                        <button
                                                            className="adm-btn"
                                                            onClick={() => moderate(row, "pending")}
                                                        >
                                                            Pending
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <AdminPagination
                            meta={meta}
                            perPage={perPage}
                            onPerPageChange={(size) => {
                                setPerPage(size);
                                setPage(1);
                            }}
                            onPageChange={setPage}
                        />
                    </>
                )}
            </AdminCard>
            <AdminToast toast={toast} />
        </AdminLayout>
    );
}
