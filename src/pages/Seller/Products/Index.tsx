import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import SellerLayout from "../Layout";
import sellerProductService from "../../../services/sellerProductService";
import { mediaUrl } from "../../../config/api";
import { Toggle } from "./ProductWidgets";
import "./seller-products.css";

const money = (value) =>
    Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

export default function SellerProductsIndex() {
    const navigate = useNavigate();
    const location = useLocation();

    const [products, setProducts] = useState([]);
    const [summary, setSummary] = useState({});
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });
    const [filters, setFilters] = useState({
        q: "",
        per_page: 10,
        page: 1,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [busy, setBusy] = useState({});

    const notify = (message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (typeof location.state?.notice !== "string" || !location.state.notice) {
            return;
        }

        notify(location.state.notice, "success");
        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    const loadProducts = async (nextFilters = filters) => {
        setLoading(true);
        setError("");

        try {
            const response = await sellerProductService.list(nextFilters);
            const nextMeta = response.meta || {};
            const requestedPage = Number(nextFilters.page || 1);
            const lastPage = Math.max(1, Number(nextMeta.last_page || 1));

            if (requestedPage > lastPage) {
                const clamped = { ...nextFilters, page: lastPage };
                setFilters(clamped);
                const retry = await sellerProductService.list(clamped);
                setProducts(retry.data || []);
                setSummary(retry.summary || {});
                setMeta(retry.meta || {});
                return;
            }

            setProducts(response.data || []);
            setSummary(response.summary || {});
            setMeta(nextMeta);
            if (Number(nextMeta.current_page || requestedPage) !== requestedPage) {
                setFilters((current) => ({
                    ...current,
                    page: Number(nextMeta.current_page || 1),
                }));
            }
        } catch (exception) {
            setError(exception.message || "Products could not be loaded.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts(filters);
    }, [filters.page, filters.per_page]);

    const submitSearch = (event) => {
        event.preventDefault();
        const next = {
            ...filters,
            page: 1,
        };
        setFilters(next);
        loadProducts(next);
    };

    const toggle = async (product, field, value) => {
        setBusy((current) => ({ ...current, [product.id]: true }));

        const old = product[field];
        setProducts((current) =>
            current.map((row) =>
                row.id === product.id
                    ? {
                          ...row,
                          [field]: value,
                      }
                    : row
            )
        );

        try {
            const response = await sellerProductService.toggle(
                product.id,
                field,
                value
            );

            setProducts((current) =>
                current.map((row) =>
                    row.id === product.id
                        ? {
                              ...row,
                              ...response.data,
                              approval_label:
                                  response.data?.approval_status === "approved"
                                      ? "Approved"
                                      : response.data?.approval_status === "pending"
                                        ? "Pending Review"
                                        : response.data?.approval_status === "draft"
                                          ? "Draft"
                                          : row.approval_label,
                          }
                        : row
                )
            );

            notify(response.message || "Product status updated.");
        } catch (exception) {
            setProducts((current) =>
                current.map((row) =>
                    row.id === product.id
                        ? {
                              ...row,
                              [field]: old,
                          }
                        : row
                )
            );

            notify(exception.message, "error");
        } finally {
            setBusy((current) => ({ ...current, [product.id]: false }));
        }
    };

    const destroy = async (product) => {
        if (!window.confirm(`Delete “${product.name}”?`)) return;

        try {
            setBusy((current) => ({ ...current, [product.id]: true }));
            const response = await sellerProductService.destroy(product.id);
            notify(response.message || "Product deleted.");
            await loadProducts(filters);
        } catch (exception) {
            notify(exception.message, "error");
        } finally {
            setBusy((current) => ({ ...current, [product.id]: false }));
        }
    };

    const pageNumbers = useMemo(() => {
        const current = Number(meta.current_page || 1);
        const last = Number(meta.last_page || 1);
        const start = Math.max(1, current - 2);
        const end = Math.min(last, current + 2);

        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [meta.current_page, meta.last_page]);

    return (
        <SellerLayout>
            <div className="sp-index-page">
                <div className="sp-index-header">
                    <div>
                        <h1>All Products</h1>
                        <p>Manage your store’s product catalog</p>
                    </div>

                    <span className="sp-product-count">
                        <i className="fa-solid fa-circle" />
                        {summary.total ?? meta.total ?? 0} Products
                    </span>
                </div>

                {error && (
                    <div className="sp-alert error">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error}
                    </div>
                )}

                <section className="sp-index-search-card">
                    <form onSubmit={submitSearch}>
                        <div className="sp-index-search">
                            <i className="fa-solid fa-magnifying-glass" />
                            <input
                                type="search"
                                placeholder="Search by name or SKU"
                                value={filters.q}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        q: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <button type="submit" className="sp-search-btn">
                            Search
                        </button>

                        <Link
                            to="/seller/products/create"
                            className="sp-add-product-btn"
                        >
                            <i className="fa-solid fa-plus" /> Add Product
                        </Link>
                    </form>

                    <p>
                        Searches published and unpublished products. Use the status
                        controls on each card for quick updates.
                    </p>
                </section>

                <div className="sp-index-meta-row">
                    <span>
                        Showing {meta.from || 0} to {meta.to || 0} of {meta.total || 0}{" "}
                        products · Page {meta.current_page || 1} of {meta.last_page || 1}
                    </span>

                    <label>
                        Per page:
                        <select
                            value={filters.per_page}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    per_page: Number(event.target.value),
                                    page: 1,
                                }))
                            }
                        >
                            {[10, 20, 40, 80].map((size) => (
                                <option value={size} key={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {loading ? (
                    <div className="sp-loading sp-index-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Loading products...
                    </div>
                ) : products.length === 0 ? (
                    <div className="sp-empty-products">
                        <i className="fa-solid fa-box-open" />
                        <h3>No products found</h3>
                        <Link to="/seller/products/create">Add your first product</Link>
                    </div>
                ) : (
                    <div className="sp-product-card-grid">
                        {products.map((product) => {
                            const isLive =
                                Boolean(product.is_published)
                                && product.approval_status === "approved";
                            const statusLabel = isLive
                                ? "Live"
                                : product.approval_status === "pending"
                                  ? "Pending Review"
                                  : product.approval_status === "rejected"
                                    ? "Rejected"
                                    : product.approval_status === "draft"
                                      ? "Draft"
                                      : product.approval_label || "Draft";
                            const publishToggleChecked = isLive;
                            const publishToggleLabel = isLive
                                ? "Published"
                                : "Publish";

                            return (
                                <article
                                    className={`sp-product-card${
                                        isLive ? " is-live" : ""
                                    }`}
                                    key={product.id}
                                >
                                    <div className="sp-card-image">
                                        {product.image ? (
                                            /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(
                                                String(product.image)
                                            ) ? (
                                                <video
                                                    src={mediaUrl(product.image)}
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <img
                                                    src={mediaUrl(product.image)}
                                                    alt={product.name}
                                                />
                                            )
                                        ) : (
                                            <span className="sp-card-image-empty">
                                                <i className="fa-regular fa-image" />
                                            </span>
                                        )}

                                        <span
                                            className={`sp-card-badge sp-card-badge-${
                                                isLive
                                                    ? "live"
                                                    : product.approval_status
                                                      || "draft"
                                            }`}
                                        >
                                            {statusLabel}
                                        </span>
                                    </div>

                                    <div className="sp-card-body">
                                        <h3>{product.name}</h3>

                                        <div className="sp-card-meta">
                                            <button
                                                type="button"
                                                className="sp-card-sku"
                                                title="Copy SKU"
                                                onClick={() => {
                                                    navigator.clipboard
                                                        ?.writeText(product.sku)
                                                        .then(() =>
                                                            notify("SKU copied.")
                                                        );
                                                }}
                                            >
                                                {product.sku}
                                                <i className="fa-regular fa-copy" />
                                            </button>

                                            {product.track_stock ? (
                                                <span className="sp-card-stock">
                                                    {product.stock_quantity} in stock
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="sp-card-price-row">
                                            <strong>
                                                ৳{money(product.final_price)}
                                            </strong>
                                            {product.sale_price !== null
                                                && Number(product.sale_price)
                                                    < Number(product.regular_price) ? (
                                                <del>
                                                    ৳{money(product.regular_price)}
                                                </del>
                                            ) : null}
                                            {product.has_variants ? (
                                                <em>
                                                    {product.variants_count} variant
                                                    {product.variants_count === 1
                                                        ? ""
                                                        : "s"}
                                                </em>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="sp-card-footer">
                                        <div className="sp-card-switches">
                                            <label className="sp-card-switch">
                                                <Toggle
                                                    checked={publishToggleChecked}
                                                    disabled={
                                                        Boolean(busy[product.id])
                                                    }
                                                    onChange={(value) =>
                                                        toggle(
                                                            product,
                                                            "is_published",
                                                            value
                                                        )
                                                    }
                                                />
                                                <span>{publishToggleLabel}</span>
                                            </label>

                                            <label className="sp-card-switch">
                                                <Toggle
                                                    checked={product.track_stock}
                                                    disabled={Boolean(
                                                        busy[product.id]
                                                    )}
                                                    onChange={(value) =>
                                                        toggle(
                                                            product,
                                                            "track_stock",
                                                            value
                                                        )
                                                    }
                                                />
                                                <span>Track stock</span>
                                            </label>
                                        </div>

                                        <div className="sp-card-actions">
                                            <button
                                                type="button"
                                                title="Edit"
                                                onClick={() =>
                                                    navigate(
                                                        `/seller/products/${product.id}/edit`
                                                    )
                                                }
                                            >
                                                <i className="fa-solid fa-pencil" />
                                            </button>

                                            <button
                                                type="button"
                                                title="View"
                                                onClick={() =>
                                                    navigate(
                                                        `/seller/products/${product.id}`
                                                    )
                                                }
                                            >
                                                <i className="fa-regular fa-eye" />
                                            </button>

                                            <button
                                                type="button"
                                                className="danger"
                                                title="Delete"
                                                disabled={Boolean(
                                                    busy[product.id]
                                                )}
                                                onClick={() => destroy(product)}
                                            >
                                                <i className="fa-regular fa-trash-can" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {meta.last_page > 1 && (
                    <div className="sp-product-pagination">
                        <button
                            type="button"
                            disabled={meta.current_page <= 1}
                            onClick={() =>
                                setFilters((current) => ({
                                    ...current,
                                    page: meta.current_page - 1,
                                }))
                            }
                        >
                            ‹
                        </button>

                        {pageNumbers.map((page) => (
                            <button
                                type="button"
                                key={page}
                                className={page === meta.current_page ? "active" : ""}
                                onClick={() =>
                                    setFilters((current) => ({
                                        ...current,
                                        page,
                                    }))
                                }
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={meta.current_page >= meta.last_page}
                            onClick={() =>
                                setFilters((current) => ({
                                    ...current,
                                    page: meta.current_page + 1,
                                }))
                            }
                        >
                            ›
                        </button>
                    </div>
                )}
            </div>

            {toast && (
                <div className={`sp-toast ${toast.type}`}>{toast.message}</div>
            )}
        </SellerLayout>
    );
}
