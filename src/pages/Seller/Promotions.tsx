import {
    useCallback,
    useEffect,
    useMemo,
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
    formatDate,
    money,
    titleCase,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


const EMPTY_OFFER = {
    name: "",
    scope: "products",
    discount_type: "percentage",
    discount_value: 10,
    maximum_discount: "",
    description: "",
    starts_at: "",
    ends_at: "",
    is_active: true,
    product_ids: [],
};


const EMPTY_COUPON = {
    code: "",
    scope: "store",
    discount_type: "percentage",
    discount_value: 10,
    minimum_order_amount: "",
    maximum_discount: "",
    usage_limit: "",
    usage_limit_per_user: "",
    starts_at: "",
    ends_at: "",
    is_active: true,
    product_ids: [],
    category_ids: [],
};


const toLocalInput = (value) => {
    if (!value) return "";

    try {
        const date = new Date(value);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset)
            .toISOString()
            .slice(0, 16);
    } catch {
        return "";
    }
};


const toggleNumber = (array, id) => {
    const numeric = Number(id);

    return array.includes(numeric)
        ? array.filter((value) => value !== numeric)
        : [...array, numeric];
};


export default function SellerPromotions() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("offers");
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState(null);
    const [offer, setOffer] = useState(EMPTY_OFFER);
    const [coupon, setCoupon] = useState(EMPTY_COUPON);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.promotions();
            setData(response.data || {});
        } catch (exception) {
            notify(firstError(exception, "Promotions could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        load();
    }, [load]);

    const products = data?.products || [];
    const categories = data?.categories || [];

    const filteredProducts = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return products;

        return products.filter((product) =>
            `${product.name} ${product.sku || ""}`
                .toLowerCase()
                .includes(term)
        );
    }, [products, search]);

    const openOffer = (row = null) => {
        setEditingId(row?.id || null);
        setOffer(
            row
                ? {
                    name: row.name || "",
                    scope: row.scope || "products",
                    discount_type: row.discount_type || "percentage",
                    discount_value: Number(row.discount_value || 0),
                    maximum_discount: row.maximum_discount ?? "",
                    description: row.description || "",
                    starts_at: toLocalInput(row.starts_at),
                    ends_at: toLocalInput(row.ends_at),
                    is_active: Boolean(row.is_active),
                    product_ids: (row.product_ids || []).map(Number),
                }
                : EMPTY_OFFER
        );
        setSearch("");
        setModal("offer");
    };

    const openCoupon = (row = null) => {
        setEditingId(row?.id || null);
        setCoupon(
            row
                ? {
                    code: row.code || "",
                    scope: row.scope || "store",
                    discount_type: row.discount_type || "percentage",
                    discount_value: Number(row.discount_value || 0),
                    minimum_order_amount: row.minimum_order_amount ?? "",
                    maximum_discount: row.maximum_discount ?? "",
                    usage_limit: row.usage_limit ?? "",
                    usage_limit_per_user: row.usage_limit_per_user ?? "",
                    starts_at: toLocalInput(row.starts_at),
                    ends_at: toLocalInput(row.ends_at),
                    is_active: Boolean(row.is_active),
                    product_ids: (row.product_ids || []).map(Number),
                    category_ids: (row.category_ids || []).map(Number),
                }
                : EMPTY_COUPON
        );
        setSearch("");
        setModal("coupon");
    };

    const saveOffer = async () => {
        setSaving(true);

        try {
            const response = await sellerSuiteService.saveOffer(
                {
                    ...offer,
                    discount_value: Number(offer.discount_value || 0),
                    maximum_discount:
                        offer.maximum_discount === ""
                            ? null
                            : Number(offer.maximum_discount),
                    starts_at: offer.starts_at || null,
                    ends_at: offer.ends_at || null,
                },
                editingId
            );

            notify(response.message || "Offer saved.");
            setModal(null);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const saveCoupon = async () => {
        setSaving(true);

        try {
            const response = await sellerSuiteService.saveCoupon(
                {
                    ...coupon,
                    discount_value: Number(coupon.discount_value || 0),
                    minimum_order_amount:
                        coupon.minimum_order_amount === ""
                            ? null
                            : Number(coupon.minimum_order_amount),
                    maximum_discount:
                        coupon.maximum_discount === ""
                            ? null
                            : Number(coupon.maximum_discount),
                    usage_limit:
                        coupon.usage_limit === ""
                            ? null
                            : Number(coupon.usage_limit),
                    usage_limit_per_user:
                        coupon.usage_limit_per_user === ""
                            ? null
                            : Number(coupon.usage_limit_per_user),
                    starts_at: coupon.starts_at || null,
                    ends_at: coupon.ends_at || null,
                },
                editingId
            );

            notify(response.message || "Coupon saved.");
            setModal(null);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const removeOffer = async (id) => {
        if (!window.confirm("Delete this seller offer?")) return;

        try {
            const response = await sellerSuiteService.deleteOffer(id);
            notify(response.message || "Offer deleted.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    const removeCoupon = async (id) => {
        if (!window.confirm("Delete this seller coupon?")) return;

        try {
            const response = await sellerSuiteService.deleteCoupon(id);
            notify(response.message || "Coupon deleted.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    const ProductChooser = ({ values, onChange }) => (
        <div style={{ marginTop: 10 }}>
            <div className="ss-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                    placeholder="Filter seller products..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                />
            </div>

            <div
                style={{
                    maxHeight: 210,
                    overflow: "auto",
                    marginTop: 8,
                    border: "1px solid #e5e8ee",
                    borderRadius: 8,
                    padding: 8,
                }}
            >
                {filteredProducts.map((product) => (
                    <label
                        className="ss-check"
                        style={{
                            display: "flex",
                            padding: "7px 5px",
                        }}
                        key={product.id}
                    >
                        <input
                            type="checkbox"
                            checked={values.includes(Number(product.id))}
                            onChange={() =>
                                onChange(toggleNumber(values, product.id))
                            }
                        />
                        <span>
                            {product.name}
                            <small className="ss-table-sub">
                                {product.sku || ""}
                            </small>
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Promotions"
                    description="Create seller-owned offers and coupon campaigns without touching another vendor's products."
                    actions={
                        <button
                            type="button"
                            className="ss-btn ss-btn-primary"
                            onClick={() =>
                                tab === "offers"
                                    ? openOffer()
                                    : openCoupon()
                            }
                        >
                            <i className="fa-solid fa-plus" />
                            {tab === "offers" ? "Create Offer" : "Create Coupon"}
                        </button>
                    }
                />

                <div className="ss-tabs">
                    <button
                        type="button"
                        className={tab === "offers" ? "ss-tab active" : "ss-tab"}
                        onClick={() => setTab("offers")}
                    >
                        Offers
                    </button>
                    <button
                        type="button"
                        className={tab === "coupons" ? "ss-tab active" : "ss-tab"}
                        onClick={() => setTab("coupons")}
                    >
                        Coupons
                    </button>
                </div>

                {loading ? (
                    <SellerSuiteLoader text="Loading promotions..." />
                ) : tab === "offers" ? (
                    <SellerSuiteCard
                        title="Seller Offers"
                        description="Offers can target selected products or the whole seller catalog."
                    >
                        {(data?.offers || []).length === 0 ? (
                            <SellerSuiteEmpty
                                icon="fa-solid fa-tags"
                                title="No seller offers yet"
                            />
                        ) : (
                            <div className="ss-table-wrap">
                                <table className="ss-table">
                                    <thead>
                                        <tr>
                                            <th>Offer</th>
                                            <th>Scope</th>
                                            <th>Discount</th>
                                            <th>Products</th>
                                            <th>Schedule</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.offers.map((row) => (
                                            <tr key={row.id}>
                                                <td>
                                                    <strong>{row.name}</strong>
                                                    <span className="ss-table-sub">
                                                        {row.description || row.slug}
                                                    </span>
                                                </td>
                                                <td>{titleCase(row.scope)}</td>
                                                <td>
                                                    {row.discount_type === "percentage"
                                                        ? `${row.discount_value}%`
                                                        : money(row.discount_value)}
                                                </td>
                                                <td>{row.products_count}</td>
                                                <td>
                                                    {formatDate(row.starts_at, true)}
                                                    <span className="ss-table-sub">
                                                        to {formatDate(row.ends_at, true)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <SellerSuiteBadge
                                                        value={
                                                            row.deleted_at
                                                                ? "deleted"
                                                                : row.is_active
                                                                    ? "active"
                                                                    : "inactive"
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    {!row.deleted_at && (
                                                        <div className="ss-page-actions">
                                                            <button
                                                                type="button"
                                                                className="ss-btn"
                                                                onClick={() =>
                                                                    openOffer(row)
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="ss-btn ss-btn-danger"
                                                                onClick={() =>
                                                                    removeOffer(
                                                                        row.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SellerSuiteCard>
                ) : (
                    <SellerSuiteCard
                        title="Seller Coupons"
                        description="Coupon scope can be the whole store, selected products or selected categories."
                    >
                        {(data?.coupons || []).length === 0 ? (
                            <SellerSuiteEmpty
                                icon="fa-solid fa-ticket"
                                title="No seller coupons yet"
                            />
                        ) : (
                            <div className="ss-table-wrap">
                                <table className="ss-table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Scope</th>
                                            <th>Discount</th>
                                            <th>Usage</th>
                                            <th>Minimum</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.coupons.map((row) => (
                                            <tr key={row.id}>
                                                <td>
                                                    <strong>{row.code}</strong>
                                                </td>
                                                <td>{titleCase(row.scope)}</td>
                                                <td>
                                                    {row.discount_type === "percentage"
                                                        ? `${row.discount_value}%`
                                                        : money(row.discount_value)}
                                                </td>
                                                <td>
                                                    {row.used_count}
                                                    <span className="ss-table-sub">
                                                        limit {row.usage_limit || "∞"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {row.minimum_order_amount
                                                        ? money(
                                                            row.minimum_order_amount
                                                        )
                                                        : "None"}
                                                </td>
                                                <td>
                                                    <SellerSuiteBadge
                                                        value={
                                                            row.deleted_at
                                                                ? "deleted"
                                                                : row.is_active
                                                                    ? "active"
                                                                    : "inactive"
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    {!row.deleted_at && (
                                                        <div className="ss-page-actions">
                                                            <button
                                                                type="button"
                                                                className="ss-btn"
                                                                onClick={() =>
                                                                    openCoupon(row)
                                                                }
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="ss-btn ss-btn-danger"
                                                                onClick={() =>
                                                                    removeCoupon(
                                                                        row.id
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
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
            </div>

            <SellerSuiteModal
                open={modal === "offer"}
                title={editingId ? "Edit Offer" : "Create Offer"}
                onClose={() => setModal(null)}
                size="large"
            >
                <div className="ss-form-grid ss-form-grid-3">
                    <label>
                        <span>Offer Name</span>
                        <input
                            className="ss-input"
                            value={offer.name}
                            onChange={(event) =>
                                setOffer((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Scope</span>
                        <select
                            className="ss-select"
                            value={offer.scope}
                            onChange={(event) =>
                                setOffer((current) => ({
                                    ...current,
                                    scope: event.target.value,
                                }))
                            }
                        >
                            <option value="products">Selected Products</option>
                            <option value="store">Whole Store</option>
                        </select>
                    </label>

                    <label>
                        <span>Discount Type</span>
                        <select
                            className="ss-select"
                            value={offer.discount_type}
                            onChange={(event) =>
                                setOffer((current) => ({
                                    ...current,
                                    discount_type: event.target.value,
                                }))
                            }
                        >
                            <option value="percentage">Percentage</option>
                            <option value="flat">Flat</option>
                        </select>
                    </label>

                    <label>
                        <span>Discount Value</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            value={offer.discount_value}
                            onChange={(event) =>
                                setOffer((current) => ({
                                    ...current,
                                    discount_value: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Maximum Discount</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            value={offer.maximum_discount}
                            onChange={(event) =>
                                setOffer((current) => ({
                                    ...current,
                                    maximum_discount: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Active</span>
                        <span className="ss-check">
                            <input
                                type="checkbox"
                                checked={offer.is_active}
                                onChange={(event) =>
                                    setOffer((current) => ({
                                        ...current,
                                        is_active: event.target.checked,
                                    }))
                                }
                            />
                            Enable offer
                        </span>
                    </label>

                    <label>
                        <span>Starts At</span>
                        <input
                            className="ss-input"
                            type="datetime-local"
                            value={offer.starts_at}
                            onChange={(event) =>
                                setOffer((current) => ({
                                    ...current,
                                    starts_at: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Ends At</span>
                        <input
                            className="ss-input"
                            type="datetime-local"
                            value={offer.ends_at}
                            onChange={(event) =>
                                setOffer((current) => ({
                                    ...current,
                                    ends_at: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="full">
                        <span>Description</span>
                        <textarea
                            className="ss-textarea"
                            value={offer.description}
                            onChange={(event) =>
                                setOffer((current) => ({
                                    ...current,
                                    description: event.target.value,
                                }))
                            }
                        />
                    </label>
                </div>

                {offer.scope === "products" && (
                    <ProductChooser
                        values={offer.product_ids}
                        onChange={(product_ids) =>
                            setOffer((current) => ({
                                ...current,
                                product_ids,
                            }))
                        }
                    />
                )}

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
                        onClick={saveOffer}
                    >
                        Save Offer
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteModal
                open={modal === "coupon"}
                title={editingId ? "Edit Coupon" : "Create Coupon"}
                onClose={() => setModal(null)}
                size="large"
            >
                <div className="ss-form-grid ss-form-grid-3">
                    <label>
                        <span>Coupon Code</span>
                        <input
                            className="ss-input"
                            value={coupon.code}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    code: event.target.value.toUpperCase(),
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Scope</span>
                        <select
                            className="ss-select"
                            value={coupon.scope}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    scope: event.target.value,
                                }))
                            }
                        >
                            <option value="store">Whole Store</option>
                            <option value="products">Selected Products</option>
                            <option value="categories">
                                Selected Categories
                            </option>
                        </select>
                    </label>

                    <label>
                        <span>Discount Type</span>
                        <select
                            className="ss-select"
                            value={coupon.discount_type}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    discount_type: event.target.value,
                                }))
                            }
                        >
                            <option value="percentage">Percentage</option>
                            <option value="flat">Flat</option>
                        </select>
                    </label>

                    <label>
                        <span>Discount Value</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            value={coupon.discount_value}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    discount_value: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Minimum Order</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            value={coupon.minimum_order_amount}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    minimum_order_amount: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Maximum Discount</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            value={coupon.maximum_discount}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    maximum_discount: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Total Usage Limit</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="1"
                            value={coupon.usage_limit}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    usage_limit: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Per User Limit</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="1"
                            value={coupon.usage_limit_per_user}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    usage_limit_per_user: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span className="ss-check">
                            <input
                                type="checkbox"
                                checked={coupon.is_active}
                                onChange={(event) =>
                                    setCoupon((current) => ({
                                        ...current,
                                        is_active: event.target.checked,
                                    }))
                                }
                            />
                            Coupon active
                        </span>
                    </label>

                    <label>
                        <span>Starts At</span>
                        <input
                            className="ss-input"
                            type="datetime-local"
                            value={coupon.starts_at}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    starts_at: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Ends At</span>
                        <input
                            className="ss-input"
                            type="datetime-local"
                            value={coupon.ends_at}
                            onChange={(event) =>
                                setCoupon((current) => ({
                                    ...current,
                                    ends_at: event.target.value,
                                }))
                            }
                        />
                    </label>
                </div>

                {coupon.scope === "products" && (
                    <ProductChooser
                        values={coupon.product_ids}
                        onChange={(product_ids) =>
                            setCoupon((current) => ({
                                ...current,
                                product_ids,
                            }))
                        }
                    />
                )}

                {coupon.scope === "categories" && (
                    <div style={{ marginTop: 12 }}>
                        <strong style={{ fontSize: 11 }}>
                            Eligible Categories
                        </strong>
                        <div
                            style={{
                                marginTop: 8,
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fill,minmax(180px,1fr))",
                                gap: 7,
                            }}
                        >
                            {categories.map((category) => (
                                <label className="ss-check" key={category.id}>
                                    <input
                                        type="checkbox"
                                        checked={coupon.category_ids.includes(
                                            Number(category.id)
                                        )}
                                        onChange={() =>
                                            setCoupon((current) => ({
                                                ...current,
                                                category_ids: toggleNumber(
                                                    current.category_ids,
                                                    category.id
                                                ),
                                            }))
                                        }
                                    />
                                    {category.name}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

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
                        onClick={saveCoupon}
                    >
                        Save Coupon
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
