import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import AdminLayout from "./Layout";
import adminProductService from "../../services/adminProductService";
import { mediaUrl } from "../../config/api";
import "./admin-products.css";

const APPROVAL_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const BULK_ACTIONS = [
    { value: "approve", label: "Approve" },
    { value: "approve_publish", label: "Approve + Publish" },
    { value: "pending", label: "Set Pending" },
    { value: "draft", label: "Set Draft" },
    { value: "reject", label: "Reject" },
    { value: "publish", label: "Publish" },
    { value: "unpublish", label: "Unpublish" },
    { value: "delete", label: "Delete" },
    { value: "restore", label: "Restore" },
];

const TAB_ITEMS = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "draft", label: "Draft" },
    { key: "rejected", label: "Rejected" },
    { key: "published", label: "Published" },
    { key: "unpublished", label: "Unpublished" },
    { key: "deleted", label: "Deleted" },
];

function firstError(error, fallback = "Something went wrong.") {
    const errors = error?.response?.data?.errors;

    if (errors) {
        const first = Object.values(errors)?.[0];

        if (Array.isArray(first) && first[0]) {
            return first[0];
        }
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
}

function money(value) {
    return Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat("en-BD", {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    } catch {
        return value;
    }
}

function titleCase(value = "") {
    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function plainText(value = "") {
    if (!value) {
        return "";
    }

    return String(value)
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizePhone(value = "") {
    let phone = String(value).replace(/\D+/g, "");

    if (phone.startsWith("880")) {
        phone = `0${phone.slice(3)}`;
    } else if (phone.startsWith("88") && phone.length === 13) {
        phone = phone.slice(2);
    }

    return phone;
}

function whatsappPhone(value = "") {
    const local = normalizePhone(value);

    if (!/^01[3-9]\d{8}$/.test(local)) {
        return "";
    }

    return `88${local}`;
}

function resolveImage(image) {
    return (
        image?.path ||
        image?.image ||
        image?.url ||
        image?.file_path ||
        null
    );
}

function Modal({ open, title, children, onClose, size = "medium" }) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="apm-modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <section className={`apm-modal apm-modal-${size}`}>
                <header className="apm-modal-head">
                    <div>
                        <span>Products</span>
                        <h3>{title}</h3>
                    </div>

                    <button
                        type="button"
                        className="apm-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </header>

                <div className="apm-modal-body">{children}</div>
            </section>
        </div>
    );
}

function StatusBadge({ value }) {
    return (
        <span className={`apm-status apm-status-${value || "unknown"}`}>
            {titleCase(value || "unknown")}
        </span>
    );
}

function YesNoBadge({ value, yes = "Yes", no = "No" }) {
    return (
        <span className={`apm-mini-badge ${value ? "yes" : "no"}`}>
            {value ? yes : no}
        </span>
    );
}

export default function AdminProducts() {
    const url = new URLSearchParams(window.location.search);

    const [filters, setFilters] = useState({
        q: "",
        approval_status: url.get("approval_status") || "",
        vendor_id: "",
        category_id: "",
        published: "",
        deleted: "",
        per_page: 25,
        page: 1,
    });

    const [searchText, setSearchText] = useState("");
    const [activeTab, setActiveTab] = useState(
        url.get("approval_status") || "all"
    );
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [options, setOptions] = useState({
        vendors: [],
        categories: [],
        approval_statuses: APPROVAL_OPTIONS,
    });
    const filtersLoadedRef = useRef(false);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 25,
        from: 0,
        to: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [busyRows, setBusyRows] = useState({});

    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detail, setDetail] = useState(null);

    const [shopOpen, setShopOpen] = useState(false);
    const [shop, setShop] = useState(null);

    const [bulkAction, setBulkAction] = useState("");
    const [bulkBusy, setBulkBusy] = useState(false);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmState, setConfirmState] = useState({
        mode: "single",
        action: "",
        product: null,
        ids: [],
    });
    const [actionReason, setActionReason] = useState("");

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });

        window.setTimeout(() => {
            setToast(null);
        }, 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await adminProductService.list({
                ...filters,
                include_filters: filtersLoadedRef.current ? 0 : 1,
                include_summary: 1,
            });

            setRows(response.data || []);

            if (response.summary) {
                setSummary(response.summary);
            }

            if (
                response.filters?.vendors?.length
                || response.filters?.categories?.length
            ) {
                filtersLoadedRef.current = true;
                setOptions(
                    response.filters || {
                        vendors: [],
                        categories: [],
                        approval_statuses: APPROVAL_OPTIONS,
                    }
                );
            }

            setMeta(
                response.meta || {
                    current_page: 1,
                    last_page: 1,
                    total: 0,
                    per_page: 25,
                    from: 0,
                    to: 0,
                }
            );
            setSelectedIds([]);
        } catch (exception) {
            const message = firstError(
                exception,
                "Products could not be loaded."
            );

            setError(message);
            notify(message, "error");
        } finally {
            setLoading(false);
        }
    }, [filters, notify]);

    useEffect(() => {
        load();
    }, [load]);

    const activeIds = useMemo(() => rows.map((row) => row.id), [rows]);

    const allSelected =
        activeIds.length > 0 &&
        activeIds.every((id) => selectedIds.includes(id));

    const toggleAll = () => {
        setSelectedIds(allSelected ? [] : activeIds);
    };

    const toggleSelected = (id) => {
        setSelectedIds((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id]
        );
    };

    const patchRow = (id, patch) => {
        setRows((current) =>
            current.map((row) =>
                row.id === id
                    ? {
                          ...row,
                          ...patch,
                      }
                    : row
            )
        );
    };

    const changeFilter = (name, value) => {
        setFilters((current) => ({
            ...current,
            [name]: value,
            page: name === "page" ? Number(value) : 1,
        }));
    };

    const applyTab = (key) => {
        setActiveTab(key);
        setSelectedIds([]);

        setFilters((current) => {
            const next = {
                ...current,
                approval_status: "",
                published: "",
                deleted: "",
                page: 1,
            };

            if (["pending", "approved", "draft", "rejected"].includes(key)) {
                next.approval_status = key;
            }

            if (key === "published") {
                next.published = "1";
            }

            if (key === "unpublished") {
                next.published = "0";
            }

            if (key === "deleted") {
                next.deleted = "1";
            }

            return next;
        });
    };

    const submitSearch = (event) => {
        event.preventDefault();

        setFilters((current) => ({
            ...current,
            q: searchText.trim(),
            page: 1,
        }));
    };

    const resetFilters = () => {
        setSearchText("");
        setActiveTab("all");
        setFilters({
            q: "",
            approval_status: "",
            vendor_id: "",
            category_id: "",
            published: "",
            deleted: "",
            per_page: 25,
            page: 1,
        });
    };

    const openProduct = async (id) => {
        setDetailOpen(true);
        setDetail(null);
        setDetailLoading(true);

        try {
            const response = await adminProductService.show(id);
            setDetail(response.data);
        } catch (exception) {
            notify(firstError(exception), "error");
            setDetailOpen(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const refreshDetail = async () => {
        if (!detail?.id) {
            return;
        }

        try {
            const response = await adminProductService.show(detail.id);
            setDetail(response.data);
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    const openShop = (vendor) => {
        if (!vendor) {
            return;
        }

        setShop(vendor);
        setShopOpen(true);
    };

    const runSingleAction = async (row, action, reason = null) => {
        if (!row?.id) {
            return;
        }

        setBusyRows((current) => ({
            ...current,
            [row.id]: true,
        }));

        try {
            let response;

            if (action === "delete") {
                response = await adminProductService.destroy(row.id);
            } else if (action === "restore") {
                response = await adminProductService.restore(row.id);
            } else {
                response = await adminProductService.moderate(row.id, {
                    action,
                    reason: reason || null,
                });
            }

            notify(response.message || "Product updated.");

            if (detail?.id === row.id && action !== "delete") {
                await refreshDetail();
            }

            if (detail?.id === row.id && action === "delete") {
                setDetailOpen(false);
                setDetail(null);
            }

            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setBusyRows((current) => ({
                ...current,
                [row.id]: false,
            }));
        }
    };

    const requestSingleApproval = (row, status) => {
        const actionMap = {
            approved: "approve",
            pending: "pending",
            draft: "draft",
            rejected: "reject",
        };

        const action = actionMap[status];

        if (!action || status === row.approval_status) {
            return;
        }

        if (action === "reject") {
            setConfirmState({
                mode: "single",
                action,
                product: row,
                ids: [],
            });
            setActionReason("");
            setConfirmOpen(true);
            return;
        }

        runSingleAction(row, action);
    };

    const requestDelete = (row) => {
        setConfirmState({
            mode: "single",
            action: "delete",
            product: row,
            ids: [],
        });
        setActionReason("");
        setConfirmOpen(true);
    };

    const requestBulk = () => {
        if (!selectedIds.length) {
            notify("Select at least one product.", "error");
            return;
        }

        if (!bulkAction) {
            notify("Choose a bulk action.", "error");
            return;
        }

        if (["reject", "delete"].includes(bulkAction)) {
            setConfirmState({
                mode: "bulk",
                action: bulkAction,
                product: null,
                ids: selectedIds,
            });
            setActionReason("");
            setConfirmOpen(true);
            return;
        }

        executeBulk(bulkAction, null);
    };

    const executeBulk = async (action, reason = null) => {
        if (!selectedIds.length) {
            return;
        }

        setBulkBusy(true);

        try {
            const response = await adminProductService.bulk({
                product_ids: selectedIds,
                action,
                reason: reason || null,
            });

            notify(
                response.message || `${selectedIds.length} product(s) updated.`,
                response.failed?.length ? "warning" : "success"
            );

            setBulkAction("");
            setSelectedIds([]);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setBulkBusy(false);
        }
    };

    const submitConfirm = async () => {
        const { mode, action, product } = confirmState;

        if (action === "reject" && !actionReason.trim()) {
            notify("Enter a rejection reason.", "error");
            return;
        }

        setConfirmOpen(false);

        if (mode === "single" && product) {
            await runSingleAction(
                product,
                action,
                actionReason.trim() || null
            );
        } else {
            await executeBulk(action, actionReason.trim() || null);
        }

        setActionReason("");
    };

    const tabCount = (key) => {
        if (key === "all") {
            return Number(summary.active || 0);
        }

        return Number(summary[key] || 0);
    };

    const productImages = useMemo(() => {
        if (!detail) {
            return [];
        }

        const list = [];

        if (detail.cover_image) {
            list.push(detail.cover_image);
        }

        (detail.images || []).forEach((image) => {
            const path = resolveImage(image);

            if (path && !list.includes(path)) {
                list.push(path);
            }
        });

        return list;
    }, [detail]);

    const vendorPhone = shop?.phone || "";
    const shopWhatsapp = whatsappPhone(vendorPhone);

    return (
        <AdminLayout>
            <div className="apm-page">
                <header className="apm-page-head">
                    <div>
                        <span>Catalog</span>
                        <h1>Products</h1>
                        <p>
                            Approve, publish, and moderate seller listings in one place.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="apm-refresh"
                        onClick={load}
                        disabled={loading}
                    >
                        <i className={`fa-solid fa-rotate-right ${loading ? "fa-spin" : ""}`} />
                        Refresh
                    </button>
                </header>

                <section className="apm-metrics">
                    <article>
                        <span className="apm-metric-icon blue">
                            <i className="fa-solid fa-boxes-stacked" />
                        </span>
                        <div>
                            <small>All Products</small>
                            <strong>{summary.total || 0}</strong>
                            <span>{summary.active || 0} active</span>
                        </div>
                    </article>

                    <article>
                        <span className="apm-metric-icon green">
                            <i className="fa-solid fa-circle-check" />
                        </span>
                        <div>
                            <small>Approved</small>
                            <strong>{summary.approved || 0}</strong>
                            <span>Ready for publishing</span>
                        </div>
                    </article>

                    <article>
                        <span className="apm-metric-icon amber">
                            <i className="fa-solid fa-hourglass-half" />
                        </span>
                        <div>
                            <small>Pending Review</small>
                            <strong>{summary.pending || 0}</strong>
                            <span>Needs admin review</span>
                        </div>
                    </article>

                    <article>
                        <span className="apm-metric-icon purple">
                            <i className="fa-solid fa-eye" />
                        </span>
                        <div>
                            <small>Published</small>
                            <strong>{summary.published || 0}</strong>
                            <span>Visible catalog items</span>
                        </div>
                    </article>

                    <article>
                        <span className="apm-metric-icon red">
                            <i className="fa-solid fa-ban" />
                        </span>
                        <div>
                            <small>Rejected</small>
                            <strong>{summary.rejected || 0}</strong>
                            <span>Requires correction</span>
                        </div>
                    </article>

                    <article>
                        <span className="apm-metric-icon slate">
                            <i className="fa-solid fa-trash-can" />
                        </span>
                        <div>
                            <small>Deleted</small>
                            <strong>{summary.deleted || 0}</strong>
                            <span>Soft-deleted products</span>
                        </div>
                    </article>
                </section>

                <section className="apm-card apm-control-card">
                    <form className="apm-filters" onSubmit={submitSearch}>
                        <div className="apm-search">
                            <i className="fa-solid fa-magnifying-glass" />
                            <input
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search product, SKU, slug or seller..."
                            />
                        </div>

                        <select
                            value={filters.vendor_id}
                            onChange={(event) => changeFilter("vendor_id", event.target.value)}
                        >
                            <option value="">All Sellers</option>
                            {(options.vendors || []).map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                    {vendor.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.category_id}
                            onChange={(event) => changeFilter("category_id", event.target.value)}
                        >
                            <option value="">All Categories</option>
                            {(options.categories || []).map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        <button type="submit" className="apm-primary-btn">
                            <i className="fa-solid fa-filter" />
                            Filter
                        </button>

                        <button
                            type="button"
                            className="apm-secondary-btn"
                            onClick={resetFilters}
                        >
                            Reset
                        </button>
                    </form>

                    <div className="apm-tabs">
                        {TAB_ITEMS.map((tab) => (
                            <button
                                type="button"
                                key={tab.key}
                                className={`apm-tab ${activeTab === tab.key ? "active" : ""}`}
                                onClick={() => applyTab(tab.key)}
                            >
                                {tab.label}
                                <span>{tabCount(tab.key)}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {selectedIds.length > 0 && (
                    <section className="apm-bulk-bar">
                        <div className="apm-bulk-count">
                            <strong>{selectedIds.length}</strong>
                            <span>selected</span>
                        </div>

                        <button
                            type="button"
                            className="apm-clear-selection"
                            onClick={() => setSelectedIds([])}
                        >
                            Clear
                        </button>

                        <div className="apm-bulk-controls">
                            <select
                                value={bulkAction}
                                onChange={(event) => setBulkAction(event.target.value)}
                            >
                                <option value="">Bulk Action</option>
                                {BULK_ACTIONS.filter((action) => {
                                    if (activeTab === "deleted") {
                                        return action.value === "restore";
                                    }

                                    return action.value !== "restore";
                                }).map((action) => (
                                    <option key={action.value} value={action.value}>
                                        {action.label}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className="apm-primary-btn"
                                onClick={requestBulk}
                                disabled={bulkBusy}
                            >
                                {bulkBusy ? (
                                    <i className="fa-solid fa-spinner fa-spin" />
                                ) : (
                                    <i className="fa-solid fa-bolt" />
                                )}
                                Apply
                            </button>
                        </div>
                    </section>
                )}

                {error && (
                    <div className="apm-error">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error}
                    </div>
                )}

                <section className="apm-card apm-table-card">
                    <div className="apm-table-wrap">
                        <table className="apm-table">
                            <thead>
                                <tr>
                                    <th className="check-col">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                            aria-label="Select all products"
                                        />
                                    </th>
                                    <th>Product</th>
                                    <th>Seller</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Stock</th>
                                    <th>Approval</th>
                                    <th>Published</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="10" className="apm-empty">
                                            <i className="fa-solid fa-spinner fa-spin" />
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : rows.length ? (
                                    rows.map((row) => {
                                        const vendor = row.vendor_detail;
                                        const phone = vendor?.phone || "";
                                        const wa = whatsappPhone(phone);
                                        const deleted = Boolean(row.deleted_at);

                                        return (
                                            <tr key={row.id} className={deleted ? "deleted-row" : ""}>
                                                <td data-label="Select" className="check-col">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(row.id)}
                                                        onChange={() => toggleSelected(row.id)}
                                                        aria-label={`Select ${row.name}`}
                                                    />
                                                </td>

                                                <td data-label="Product">
                                                    <button
                                                        type="button"
                                                        className="apm-product-cell"
                                                        onClick={() => openProduct(row.id)}
                                                    >
                                                        <span className="apm-product-thumb">
                                                            {row.cover_image ? (
                                                                <img
                                                                    src={mediaUrl(row.cover_image)}
                                                                    alt={row.name}
                                                                />
                                                            ) : (
                                                                <i className="fa-regular fa-image" />
                                                            )}
                                                        </span>

                                                        <span>
                                                            <strong>{row.name}</strong>
                                                            <small>{row.sku || "No SKU"}</small>
                                                            <em>#{row.id}</em>
                                                        </span>
                                                    </button>
                                                </td>

                                                <td data-label="Seller">
                                                    {vendor ? (
                                                        <div className="apm-seller-cell">
                                                            <button
                                                                type="button"
                                                                className="apm-seller-main"
                                                                onClick={() => openShop(vendor)}
                                                            >
                                                                <span className="apm-shop-avatar">
                                                                    {vendor.logo ? (
                                                                        <img
                                                                            src={mediaUrl(vendor.logo)}
                                                                            alt={vendor.name}
                                                                        />
                                                                    ) : (
                                                                        String(vendor.name || "S")
                                                                            .trim()
                                                                            .charAt(0)
                                                                            .toUpperCase()
                                                                    )}
                                                                </span>

                                                                <span>
                                                                    <strong>{vendor.name}</strong>
                                                                    <small>Seller #{vendor.id}</small>
                                                                </span>
                                                            </button>

                                                            <div className="apm-shop-phone-row">
                                                                <a href={phone ? `tel:${phone}` : undefined}>
                                                                    {phone || "No phone"}
                                                                </a>

                                                                {wa && (
                                                                    <a
                                                                        className="apm-wa"
                                                                        href={`https://wa.me/${wa}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        title="WhatsApp seller"
                                                                        aria-label="WhatsApp seller"
                                                                    >
                                                                        <i className="fa-brands fa-whatsapp" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>

                                                <td data-label="Category">
                                                    <div className="apm-category-list">
                                                        {(row.categories || []).length ? (
                                                            row.categories.slice(0, 2).map((category) => (
                                                                <span key={category.id}>{category.name}</span>
                                                            ))
                                                        ) : (
                                                            <span className="muted">Uncategorized</span>
                                                        )}

                                                        {(row.categories || []).length > 2 && (
                                                            <small>
                                                                +{row.categories.length - 2} more
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>

                                                <td data-label="Price">
                                                    <strong className="apm-price">
                                                        ৳{money(row.sale_price ?? row.regular_price)}
                                                    </strong>

                                                    {row.sale_price !== null && (
                                                        <small className="apm-regular-price">
                                                            ৳{money(row.regular_price)}
                                                        </small>
                                                    )}
                                                </td>

                                                <td data-label="Stock">
                                                    <strong className="apm-stock">
                                                        {row.track_stock
                                                            ? row.stock_quantity
                                                            : "∞"}
                                                    </strong>
                                                    <small>{titleCase(row.availability || "available")}</small>
                                                </td>

                                                <td data-label="Approval">
                                                    {deleted ? (
                                                        <StatusBadge value={row.approval_status} />
                                                    ) : (
                                                        <select
                                                            className={`apm-approval-select ${row.approval_status}`}
                                                            value={row.approval_status || "draft"}
                                                            disabled={Boolean(busyRows[row.id])}
                                                            onChange={(event) =>
                                                                requestSingleApproval(
                                                                    row,
                                                                    event.target.value
                                                                )
                                                            }
                                                        >
                                                            {APPROVAL_OPTIONS.map((status) => (
                                                                <option
                                                                    key={status.value}
                                                                    value={status.value}
                                                                >
                                                                    {status.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </td>

                                                <td data-label="Published">
                                                    {deleted ? (
                                                        <span className="apm-mini-badge no">Deleted</span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className={`apm-publish-toggle ${row.is_published ? "on" : "off"}`}
                                                            disabled={Boolean(busyRows[row.id])}
                                                            onClick={() =>
                                                                runSingleAction(
                                                                    row,
                                                                    row.is_published
                                                                        ? "unpublish"
                                                                        : "publish"
                                                                )
                                                            }
                                                        >
                                                            <span />
                                                            {row.is_published
                                                                ? "Published"
                                                                : "Unpublished"}
                                                        </button>
                                                    )}
                                                </td>

                                                <td data-label="Created">
                                                    <span className="apm-date">
                                                        {formatDate(row.created_at)}
                                                    </span>
                                                </td>

                                                <td data-label="Actions">
                                                    <div className="apm-actions">
                                                        <button
                                                            type="button"
                                                            title="Review product"
                                                            onClick={() => openProduct(row.id)}
                                                        >
                                                            <i className="fa-regular fa-eye" />
                                                        </button>

                                                        {!deleted && row.approval_status !== "approved" && (
                                                            <button
                                                                type="button"
                                                                className="success"
                                                                title="Approve & publish to shop"
                                                                disabled={Boolean(busyRows[row.id])}
                                                                onClick={() => runSingleAction(row, "approve")}
                                                            >
                                                                <i className="fa-solid fa-check" />
                                                            </button>
                                                        )}

                                                        {deleted ? (
                                                            <button
                                                                type="button"
                                                                className="restore"
                                                                title="Restore"
                                                                disabled={Boolean(busyRows[row.id])}
                                                                onClick={() => runSingleAction(row, "restore")}
                                                            >
                                                                <i className="fa-solid fa-rotate-left" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="danger"
                                                                title="Delete"
                                                                disabled={Boolean(busyRows[row.id])}
                                                                onClick={() => requestDelete(row)}
                                                            >
                                                                <i className="fa-regular fa-trash-can" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="apm-empty">
                                            <i className="fa-regular fa-folder-open" />
                                            No products found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <footer className="apm-pagination">
                        <div>
                            <span>Rows</span>
                            <select
                                value={filters.per_page}
                                onChange={(event) =>
                                    changeFilter("per_page", Number(event.target.value))
                                }
                            >
                                {[10, 25, 50, 100].map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span>
                                {meta.from || 0}–{meta.to || 0} of {meta.total || 0}
                            </span>
                        </div>

                        <div>
                            <button
                                type="button"
                                disabled={Number(meta.current_page || 1) <= 1}
                                onClick={() =>
                                    changeFilter(
                                        "page",
                                        Number(meta.current_page || 1) - 1
                                    )
                                }
                            >
                                <i className="fa-solid fa-chevron-left" />
                            </button>

                            <strong>{meta.current_page || 1}</strong>
                            <span>/ {meta.last_page || 1}</span>

                            <button
                                type="button"
                                disabled={
                                    Number(meta.current_page || 1) >=
                                    Number(meta.last_page || 1)
                                }
                                onClick={() =>
                                    changeFilter(
                                        "page",
                                        Number(meta.current_page || 1) + 1
                                    )
                                }
                            >
                                <i className="fa-solid fa-chevron-right" />
                            </button>
                        </div>
                    </footer>
                </section>

                <Modal
                    open={detailOpen}
                    title={detail ? `Product Review · ${detail.name}` : "Product Review"}
                    size="large"
                    onClose={() => setDetailOpen(false)}
                >
                    {detailLoading || !detail ? (
                        <div className="apm-modal-loading">
                            <i className="fa-solid fa-spinner fa-spin" />
                            Loading product details...
                        </div>
                    ) : (
                        <div className="apm-product-detail">
                            <section className="apm-detail-hero">
                                <div className="apm-detail-gallery">
                                    <div className="apm-main-image">
                                        {productImages[0] ? (
                                            <img
                                                src={mediaUrl(productImages[0])}
                                                alt={detail.name}
                                            />
                                        ) : (
                                            <i className="fa-regular fa-image" />
                                        )}
                                    </div>

                                    {productImages.length > 1 && (
                                        <div className="apm-thumb-strip">
                                            {productImages.slice(0, 5).map((image, index) => (
                                                <span key={`${image}-${index}`}>
                                                    <img
                                                        src={mediaUrl(image)}
                                                        alt={`${detail.name} ${index + 1}`}
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="apm-detail-summary">
                                    <div className="apm-detail-badges">
                                        <StatusBadge value={detail.approval_status} />
                                        <span
                                            className={`apm-mini-badge ${detail.is_published ? "yes" : "no"}`}
                                        >
                                            {detail.is_published
                                                ? "Published"
                                                : "Unpublished"}
                                        </span>
                                        {detail.deleted_at && (
                                            <span className="apm-mini-badge no">Deleted</span>
                                        )}
                                    </div>

                                    <h2>{detail.name}</h2>
                                    <p className="apm-detail-sku">
                                        {detail.sku || "No SKU"} · Product #{detail.id}
                                    </p>

                                    <div className="apm-detail-price">
                                        <strong>
                                            ৳{money(detail.sale_price ?? detail.regular_price)}
                                        </strong>
                                        {detail.sale_price !== null && (
                                            <span>৳{money(detail.regular_price)}</span>
                                        )}
                                    </div>

                                    {detail.vendor_detail && (
                                        <button
                                            type="button"
                                            className="apm-detail-seller"
                                            onClick={() => openShop(detail.vendor_detail)}
                                        >
                                            <span className="apm-shop-avatar large">
                                                {detail.vendor_detail.logo ? (
                                                    <img
                                                        src={mediaUrl(detail.vendor_detail.logo)}
                                                        alt={detail.vendor_detail.name}
                                                    />
                                                ) : (
                                                    String(detail.vendor_detail.name || "S")
                                                        .trim()
                                                        .charAt(0)
                                                        .toUpperCase()
                                                )}
                                            </span>
                                            <span>
                                                <small>Seller</small>
                                                <strong>{detail.vendor_detail.name}</strong>
                                                <em>
                                                    {detail.vendor_detail.phone || "No phone"}
                                                </em>
                                            </span>
                                            <i className="fa-solid fa-chevron-right" />
                                        </button>
                                    )}
                                </div>
                            </section>

                            <section className="apm-detail-grid">
                                <article className="apm-detail-card">
                                    <h4>Product Information</h4>

                                    <dl>
                                        <div>
                                            <dt>Brand</dt>
                                            <dd>{detail.brand || "—"}</dd>
                                        </div>
                                        <div>
                                            <dt>Availability</dt>
                                            <dd>{titleCase(detail.availability || "—")}</dd>
                                        </div>
                                        <div>
                                            <dt>Delivery</dt>
                                            <dd>
                                                <select
                                                    value={
                                                        detail.delivery_type || "rate_by_weight"
                                                    }
                                                    onChange={async (event) => {
                                                        const next = event.target.value;
                                                        try {
                                                            const response =
                                                                await adminProductService.updateDelivery(
                                                                    detail.id,
                                                                    next
                                                                );
                                                            const updated =
                                                                response?.data || response;
                                                            setDetail((current) =>
                                                                current
                                                                    ? {
                                                                          ...current,
                                                                          ...updated,
                                                                          delivery_type: next,
                                                                      }
                                                                    : current
                                                            );
                                                        } catch (exception) {
                                                            window.alert(
                                                                firstError(
                                                                    exception,
                                                                    "Could not update delivery."
                                                                )
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <option value="free_shipping">
                                                        Free Shipping
                                                    </option>
                                                    <option value="rate_by_weight">
                                                        Paid shipping (area rates)
                                                    </option>
                                                </select>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Stock</dt>
                                            <dd>
                                                {detail.track_stock
                                                    ? detail.stock_quantity
                                                    : "Not tracked"}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt>Variants</dt>
                                            <dd>
                                                {detail.has_variants
                                                    ? `${detail.variants?.length || 0} variant(s)`
                                                    : "No variants"}
                                            </dd>
                                        </div>
                                        <div className="full">
                                            <dt>Categories</dt>
                                            <dd>
                                                {(detail.categories || [])
                                                    .map((category) => category.name)
                                                    .join(", ") || "—"}
                                            </dd>
                                        </div>
                                    </dl>
                                </article>

                                <article className="apm-detail-card moderation">
                                    <h4>Moderation Control</h4>

                                    {!detail.deleted_at ? (
                                        <>
                                            <label>
                                                <span>Approval Status</span>
                                                <select
                                                    value={detail.approval_status || "draft"}
                                                    onChange={(event) => {
                                                        const next = event.target.value;
                                                        requestSingleApproval(detail, next);
                                                    }}
                                                >
                                                    {APPROVAL_OPTIONS.map((status) => (
                                                        <option key={status.value} value={status.value}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>

                                            <div className="apm-detail-actions">
                                                <button
                                                    type="button"
                                                    className="apm-primary-btn"
                                                    onClick={() =>
                                                        runSingleAction(
                                                            detail,
                                                            detail.is_published
                                                                ? "unpublish"
                                                                : "publish"
                                                        )
                                                    }
                                                >
                                                    <i
                                                        className={`fa-solid ${
                                                            detail.is_published
                                                                ? "fa-eye-slash"
                                                                : "fa-eye"
                                                        }`}
                                                    />
                                                    {detail.is_published
                                                        ? "Unpublish"
                                                        : "Publish"}
                                                </button>

                                                {detail.approval_status !== "approved" && (
                                                    <button
                                                        type="button"
                                                        className="apm-success-btn"
                                                        onClick={() =>
                                                            runSingleAction(
                                                                detail,
                                                                "approve_publish"
                                                            )
                                                        }
                                                    >
                                                        <i className="fa-solid fa-check-double" />
                                                        Approve + Publish
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    className="apm-danger-btn"
                                                    onClick={() => requestDelete(detail)}
                                                >
                                                    <i className="fa-regular fa-trash-can" />
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            className="apm-success-btn full-width"
                                            onClick={() => runSingleAction(detail, "restore")}
                                        >
                                            <i className="fa-solid fa-rotate-left" />
                                            Restore Product
                                        </button>
                                    )}

                                    {detail.rejection_reason && (
                                        <div className="apm-rejection-box">
                                            <strong>Rejection reason</strong>
                                            <p>{detail.rejection_reason}</p>
                                        </div>
                                    )}
                                </article>
                            </section>

                            <section className="apm-description-grid">
                                <article className="apm-detail-card">
                                    <h4>Short Description</h4>
                                    <p>
                                        {plainText(detail.short_description) ||
                                            "No short description."}
                                    </p>
                                </article>

                                <article className="apm-detail-card">
                                    <h4>Description</h4>
                                    <p>
                                        {plainText(detail.description) ||
                                            "No product description."}
                                    </p>
                                </article>
                            </section>

                            <section className="apm-detail-card">
                                <div className="apm-section-title-row">
                                    <h4>Variants</h4>
                                    <span>{detail.variants?.length || 0}</span>
                                </div>

                                {detail.variants?.length ? (
                                    <div className="apm-variant-table-wrap">
                                        <table className="apm-variant-table">
                                            <thead>
                                                <tr>
                                                    <th>Variant</th>
                                                    <th>SKU</th>
                                                    <th>Regular</th>
                                                    <th>Sale</th>
                                                    <th>Stock</th>
                                                    <th>Deleted</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detail.variants.map((variant) => (
                                                    <tr key={variant.id}>
                                                        <td>{variant.name || "—"}</td>
                                                        <td>{variant.sku || "—"}</td>
                                                        <td>৳{money(variant.regular_price)}</td>
                                                        <td>
                                                            {variant.sale_price !== null
                                                                ? `৳${money(variant.sale_price)}`
                                                                : "—"}
                                                        </td>
                                                        <td>{variant.stock_quantity ?? "—"}</td>
                                                        <td>
                                                            <YesNoBadge value={Boolean(variant.deleted_at)} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="apm-muted">No variants.</div>
                                )}
                            </section>
                        </div>
                    )}
                </Modal>

                <Modal
                    open={shopOpen}
                    title="Shop Details"
                    size="small"
                    onClose={() => setShopOpen(false)}
                >
                    {shop && (
                        <div className="apm-shop-modal">
                            <div className="apm-shop-modal-head">
                                <span className="apm-shop-avatar xlarge">
                                    {shop.logo ? (
                                        <img src={mediaUrl(shop.logo)} alt={shop.name} />
                                    ) : (
                                        String(shop.name || "S")
                                            .trim()
                                            .charAt(0)
                                            .toUpperCase()
                                    )}
                                </span>

                                <div>
                                    <h3>{shop.name}</h3>
                                    <p>Seller #{shop.id}</p>
                                    <StatusBadge value={shop.status || "unknown"} />
                                </div>
                            </div>

                            <div className="apm-shop-info-grid">
                                <div className="wide">
                                    <span>Shop Phone</span>
                                    <strong>{shop.phone || "—"}</strong>
                                    <div className="apm-shop-contact-actions">
                                        {shop.phone && (
                                            <a href={`tel:${shop.phone}`}>
                                                <i className="fa-solid fa-phone" />
                                                Call
                                            </a>
                                        )}

                                        {shopWhatsapp && (
                                            <a
                                                className="whatsapp"
                                                href={`https://wa.me/${shopWhatsapp}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <i className="fa-brands fa-whatsapp" />
                                                WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>

                                <div className="wide">
                                    <span>Email</span>
                                    <strong>{shop.email || "—"}</strong>
                                </div>

                                <div>
                                    <span>Currency</span>
                                    <strong>{shop.currency || "BDT"}</strong>
                                </div>

                                <div>
                                    <span>Onboarding</span>
                                    <strong>{titleCase(shop.onboarding_status || "—")}</strong>
                                </div>

                                <div>
                                    <span>Active</span>
                                    <YesNoBadge value={Boolean(shop.is_active)} />
                                </div>

                                <div>
                                    <span>Featured</span>
                                    <YesNoBadge value={Boolean(shop.is_featured)} />
                                </div>

                                <div className="wide">
                                    <span>Slug</span>
                                    <strong>{shop.slug || "—"}</strong>
                                </div>

                                <div className="wide">
                                    <span>Approved At</span>
                                    <strong>{formatDate(shop.approved_at)}</strong>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal
                    open={confirmOpen}
                    title={
                        confirmState.action === "reject"
                            ? "Reject Product"
                            : confirmState.action === "delete"
                              ? "Delete Product"
                              : "Confirm Action"
                    }
                    size="small"
                    onClose={() => setConfirmOpen(false)}
                >
                    <div className="apm-confirm">
                        <span
                            className={`apm-confirm-icon ${
                                confirmState.action === "delete" ? "danger" : "warning"
                            }`}
                        >
                            <i
                                className={`fa-solid ${
                                    confirmState.action === "delete"
                                        ? "fa-trash-can"
                                        : "fa-triangle-exclamation"
                                }`}
                            />
                        </span>

                        <h4>
                            {confirmState.mode === "bulk"
                                ? `${confirmState.ids.length} product(s)`
                                : confirmState.product?.name || "Product"}
                        </h4>

                        <p>
                            {confirmState.action === "delete"
                                ? "The selected product(s) will be moved to Deleted Items. You can restore them later."
                                : "Rejected products are automatically unpublished. Add a clear reason for the seller."}
                        </p>

                        {confirmState.action === "reject" && (
                            <textarea
                                rows="4"
                                value={actionReason}
                                onChange={(event) => setActionReason(event.target.value)}
                                placeholder="Write rejection reason..."
                            />
                        )}

                        <div className="apm-confirm-actions">
                            <button
                                type="button"
                                className="apm-secondary-btn"
                                onClick={() => setConfirmOpen(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className={
                                    confirmState.action === "delete"
                                        ? "apm-danger-btn"
                                        : "apm-primary-btn"
                                }
                                onClick={submitConfirm}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </Modal>

                {toast && (
                    <div className={`apm-toast ${toast.type || "success"}`}>
                        <i
                            className={`fa-solid ${
                                toast.type === "error"
                                    ? "fa-circle-exclamation"
                                    : toast.type === "warning"
                                      ? "fa-triangle-exclamation"
                                      : "fa-circle-check"
                            }`}
                        />
                        {toast.message}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
