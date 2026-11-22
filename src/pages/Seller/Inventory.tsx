import {
    useCallback,
    useEffect,
    useMemo,
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
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


export default function SellerInventory() {
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [meta, setMeta] = useState({});
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);

    const [filters, setFilters] = useState({
        q: "",
        low_stock: false,
        page: 1,
        per_page: 20,
    });

    const [modal, setModal] = useState(null);
    const [adjust, setAdjust] = useState({
        product_id: "",
        variant_id: "",
        mode: "set",
        quantity: 0,
        note: "",
    });
    const [saving, setSaving] = useState(false);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [inventoryResponse, transactionResponse] =
                await Promise.all([
                    sellerSuiteService.inventory(filters),
                    sellerSuiteService.inventoryTransactions({
                        per_page: 20,
                    }),
                ]);

            setRows(inventoryResponse.data || []);
            setSummary(inventoryResponse.summary || {});
            setMeta(inventoryResponse.meta || {});
            setTransactions(transactionResponse.data || []);
        } catch (exception) {
            setError(firstError(exception, "Inventory could not be loaded."));
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        load();
    }, [load]);

    const flattened = useMemo(() => {
        const output = [];

        rows.forEach((product) => {
            if (product.has_variants && product.variants?.length) {
                product.variants.forEach((variant) => {
                    output.push({
                        ...variant,
                        product_id: product.id,
                        product_name: product.name,
                        product_sku: product.sku,
                        image: variant.image || product.cover_image,
                        variant_id: variant.id,
                    });
                });

                return;
            }

            output.push({
                product_id: product.id,
                product_name: product.name,
                product_sku: product.sku,
                image: product.cover_image,
                variant_id: null,
                name: null,
                sku: product.sku,
                track_stock: product.track_stock,
                stock_quantity: product.stock_quantity,
                stock_alert_quantity: product.stock_alert_quantity,
                availability: product.availability,
                is_low_stock: product.is_low_stock,
            });
        });

        return output;
    }, [rows]);

    const openAdjust = (row) => {
        setAdjust({
            product_id: row.product_id,
            variant_id: row.variant_id || "",
            mode: "set",
            quantity: Number(row.stock_quantity || 0),
            note: "",
        });

        setModal(row);
    };

    const saveAdjustment = async () => {
        setSaving(true);

        try {
            const response = await sellerSuiteService.adjustInventory({
                ...adjust,
                product_id: Number(adjust.product_id),
                variant_id: adjust.variant_id
                    ? Number(adjust.variant_id)
                    : null,
                quantity: Math.max(0, Number(adjust.quantity || 0)),
            });

            notify(response.message || "Inventory updated.");
            setModal(null);
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
                    title="Inventory"
                    description="Track seller-owned stock, low-stock alerts, variants and manual inventory adjustments."
                    actions={
                        <button
                            type="button"
                            className="ss-btn"
                            onClick={load}
                        >
                            <i className="fa-solid fa-rotate-right" />
                            Refresh
                        </button>
                    }
                />

                {error && (
                    <SellerSuiteAlert type="error">
                        {error}
                    </SellerSuiteAlert>
                )}

                <div className="ss-stat-grid">
                    <SellerSuiteStat
                        icon="fa-solid fa-boxes-stacked"
                        label="Products"
                        value={summary.products || 0}
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-cubes"
                        label="Units In Stock"
                        value={summary.units_in_stock || 0}
                        tone="blue"
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-triangle-exclamation"
                        label="Low Stock"
                        value={summary.low_stock_products || 0}
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-circle-xmark"
                        label="Out Of Stock"
                        value={summary.out_of_stock_products || 0}
                        tone="red"
                    />
                </div>

                <SellerSuiteCard>
                    <form
                        className="ss-toolbar"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setFilters((current) => ({
                                ...current,
                                page: 1,
                            }));
                        }}
                    >
                        <div className="ss-search ss-grow">
                            <i className="fa-solid fa-magnifying-glass" />
                            <input
                                value={filters.q}
                                placeholder="Search product or SKU..."
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        q: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <label className="ss-check">
                            <input
                                type="checkbox"
                                checked={filters.low_stock}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        low_stock: event.target.checked,
                                        page: 1,
                                    }))
                                }
                            />
                            Low stock only
                        </label>

                        <button type="submit" className="ss-btn ss-btn-primary">
                            Search
                        </button>
                    </form>

                    {loading ? (
                        <SellerSuiteLoader text="Loading inventory..." />
                    ) : flattened.length === 0 ? (
                        <SellerSuiteEmpty
                            icon="fa-solid fa-warehouse"
                            title="No inventory rows found"
                        />
                    ) : (
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>SKU</th>
                                        <th>Stock</th>
                                        <th>Alert At</th>
                                        <th>Availability</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flattened.map((row) => (
                                        <tr
                                            key={`${row.product_id}-${row.variant_id || 0}`}
                                        >
                                            <td>
                                                <div className="ss-product-cell">
                                                    <span className="ss-product-thumb">
                                                        {row.image ? (
                                                            <img
                                                                src={mediaUrl(row.image)}
                                                                alt={row.product_name}
                                                            />
                                                        ) : (
                                                            <i className="fa-regular fa-image" />
                                                        )}
                                                    </span>

                                                    <div>
                                                        <strong>
                                                            {row.product_name}
                                                        </strong>
                                                        {row.name && (
                                                            <span className="ss-table-sub">
                                                                Variant: {row.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td>{row.sku || row.product_sku}</td>

                                            <td>
                                                <strong>
                                                    {row.stock_quantity}
                                                </strong>
                                                {row.is_low_stock && (
                                                    <span className="ss-table-sub">
                                                        Low stock
                                                    </span>
                                                )}
                                            </td>

                                            <td>{row.stock_alert_quantity}</td>

                                            <td>
                                                <SellerSuiteBadge
                                                    value={row.availability}
                                                />
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="ss-btn"
                                                    onClick={() =>
                                                        openAdjust(row)
                                                    }
                                                >
                                                    <i className="fa-solid fa-sliders" />
                                                    Adjust
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {Number(meta.last_page || 1) > 1 && (
                        <div className="ss-toolbar" style={{ marginTop: 14 }}>
                            <button
                                type="button"
                                className="ss-btn"
                                disabled={Number(meta.current_page || 1) <= 1}
                                onClick={() =>
                                    setFilters((current) => ({
                                        ...current,
                                        page: Number(meta.current_page) - 1,
                                    }))
                                }
                            >
                                Previous
                            </button>

                            <span className="ss-form-hint">
                                Page {meta.current_page} of {meta.last_page}
                            </span>

                            <button
                                type="button"
                                className="ss-btn"
                                disabled={
                                    Number(meta.current_page || 1) >=
                                    Number(meta.last_page || 1)
                                }
                                onClick={() =>
                                    setFilters((current) => ({
                                        ...current,
                                        page: Number(meta.current_page) + 1,
                                    }))
                                }
                            >
                                Next
                            </button>
                        </div>
                    )}
                </SellerSuiteCard>

                <SellerSuiteCard
                    title="Recent Inventory Activity"
                    description="Audit trail of stock openings and manual adjustments."
                >
                    {transactions.length === 0 ? (
                        <SellerSuiteEmpty
                            icon="fa-solid fa-clock-rotate-left"
                            title="No inventory transactions yet"
                        />
                    ) : (
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Product</th>
                                        <th>Type</th>
                                        <th>Change</th>
                                        <th>Before</th>
                                        <th>After</th>
                                        <th>By</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((row) => (
                                        <tr key={row.id}>
                                            <td>{formatDate(row.created_at)}</td>
                                            <td>
                                                <strong>{row.product}</strong>
                                                <span className="ss-table-sub">
                                                    {row.variant || row.product_sku}
                                                </span>
                                            </td>
                                            <td>
                                                <SellerSuiteBadge value={row.type} />
                                            </td>
                                            <td>{row.quantity > 0 ? "+" : ""}{row.quantity}</td>
                                            <td>{row.stock_before}</td>
                                            <td>{row.stock_after}</td>
                                            <td>{row.created_by}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </SellerSuiteCard>
            </div>

            <SellerSuiteModal
                open={Boolean(modal)}
                title="Adjust Inventory"
                onClose={() => setModal(null)}
                size="small"
            >
                {modal && (
                    <>
                        <SellerSuiteAlert type={modal.is_low_stock ? "warning" : "info"}>
                            <strong>{modal.product_name}</strong>
                            {modal.name ? ` · ${modal.name}` : ""}
                            <br />
                            Current stock: {modal.stock_quantity}
                        </SellerSuiteAlert>

                        <div className="ss-form-grid">
                            <label>
                                <span>Adjustment Type</span>
                                <select
                                    className="ss-select"
                                    value={adjust.mode}
                                    onChange={(event) =>
                                        setAdjust((current) => ({
                                            ...current,
                                            mode: event.target.value,
                                        }))
                                    }
                                >
                                    <option value="set">Set exact stock</option>
                                    <option value="increase">Increase stock</option>
                                    <option value="decrease">Decrease stock</option>
                                </select>
                            </label>

                            <label>
                                <span>Quantity</span>
                                <input
                                    className="ss-input"
                                    type="number"
                                    min="0"
                                    value={adjust.quantity}
                                    onChange={(event) =>
                                        setAdjust((current) => ({
                                            ...current,
                                            quantity: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label className="full">
                                <span>Reason / Note</span>
                                <textarea
                                    className="ss-textarea"
                                    value={adjust.note}
                                    onChange={(event) =>
                                        setAdjust((current) => ({
                                            ...current,
                                            note: event.target.value,
                                        }))
                                    }
                                    placeholder="Stock count correction, received inventory..."
                                />
                            </label>
                        </div>

                        <div className="ss-modal-footer">
                            <button
                                type="button"
                                className="ss-btn"
                                onClick={() => setModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="ss-btn ss-btn-primary"
                                disabled={saving}
                                onClick={saveAdjustment}
                            >
                                {saving ? "Saving..." : "Save Adjustment"}
                            </button>
                        </div>
                    </>
                )}
            </SellerSuiteModal>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
