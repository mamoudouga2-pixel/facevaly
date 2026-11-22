import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import AdminLayout from "./Layout";
import adminService from "../../services/adminService";

import {
    AdminBadge,
    AdminCard,
    AdminEmpty,
    AdminLoader,
    AdminMetric,
    AdminModal,
    AdminToast,
    firstError,
    formatDate,
    money,
    titleCase,
} from "../../components/admin/AdminUI";

import {
    mediaUrl,
} from "../../config/api";

import "./admin.css";


const initialForm = {
    scope: "selected",
    direction: "decrease",
    adjustment_type: "percentage",
    value: "",
    include_variants: true,
    vendor_id: "",
    category_id: "",
    note: "",
};


export default function AdminPriceAdjustments() {
    const [
        rows,
        setRows,
    ] =
        useState([]);

    const [
        options,
        setOptions,
    ] =
        useState({
            vendors: [],
            categories: [],
        });

    const [
        history,
        setHistory,
    ] =
        useState([]);

    const [
        selectedIds,
        setSelectedIds,
    ] =
        useState([]);

    const [
        filters,
        setFilters,
    ] =
        useState({
            q: "",
            vendor_id: "",
            category_id: "",
            per_page: 50,
        });

    const [
        form,
        setForm,
    ] =
        useState(
            initialForm
        );

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        applying,
        setApplying,
    ] =
        useState(false);

    const [
        toast,
        setToast,
    ] =
        useState(null);

    const [
        detailOpen,
        setDetailOpen,
    ] =
        useState(false);

    const [
        adjustmentDetail,
        setAdjustmentDetail,
    ] =
        useState(null);


    const notify =
        useCallback(
            (
                message,
                type = "success"
            ) => {
                setToast({
                    message,
                    type,
                });

                window.setTimeout(
                    () =>
                        setToast(
                            null
                        ),
                    3500
                );
            },
            []
        );


    const loadProducts =
        useCallback(
            async () => {
                const response =
                    await adminService
                        .pricingProducts(
                            filters
                        );

                setRows(
                    response.data ||
                    []
                );

                setOptions(
                    response.filters ||
                    {
                        vendors: [],
                        categories: [],
                    }
                );
            },
            [
                filters,
            ]
        );


    const loadHistory =
        useCallback(
            async () => {
                const response =
                    await adminService
                        .pricingHistory({
                            per_page:
                                30,
                        });

                setHistory(
                    response.data ||
                    []
                );
            },
            []
        );


    useEffect(
        () => {
            let mounted =
                true;

            setLoading(
                true
            );

            Promise
                .all([
                    loadProducts(),
                    loadHistory(),
                ])
                .catch(
                    (
                        exception
                    ) => {
                        if (
                            mounted
                        ) {
                            notify(
                                firstError(
                                    exception
                                ),
                                "error"
                            );
                        }
                    }
                )
                .finally(
                    () => {
                        if (
                            mounted
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                );

            return () => {
                mounted =
                    false;
            };
        },
        [
            loadProducts,
            loadHistory,
            notify,
        ]
    );


    const currentPageIds =
        useMemo(
            () =>
                rows.map(
                    (
                        row
                    ) =>
                        row.id
                ),
            [
                rows,
            ]
        );


    const allCurrentSelected =
        currentPageIds.length >
            0 &&
        currentPageIds.every(
            (
                id
            ) =>
                selectedIds.includes(
                    id
                )
        );


    const toggleAllCurrent =
        () => {
            setSelectedIds(
                (
                    current
                ) => {
                    if (
                        allCurrentSelected
                    ) {
                        return current.filter(
                            (
                                id
                            ) =>
                                !currentPageIds.includes(
                                    id
                                )
                        );
                    }

                    return Array.from(
                        new Set([
                            ...current,
                            ...currentPageIds,
                        ])
                    );
                }
            );
        };


    const toggleProduct =
        (
            id
        ) => {
            setSelectedIds(
                (
                    current
                ) =>
                    current.includes(
                        id
                    )
                        ? current.filter(
                            (
                                value
                            ) =>
                                value !==
                                id
                        )
                        : [
                            ...current,
                            id,
                        ]
            );
        };


    const affectedLabel =
        useMemo(
            () => {
                if (
                    form.scope ===
                    "all"
                ) {
                    return "Every product in the marketplace";
                }

                if (
                    form.scope ===
                    "vendor"
                ) {
                    const vendor =
                        options.vendors.find(
                            (
                                row
                            ) =>
                                String(
                                    row.id
                                ) ===
                                String(
                                    form.vendor_id
                                )
                        );

                    return vendor
                        ? `All products from ${vendor.name}`
                        : "Select a seller";
                }

                if (
                    form.scope ===
                    "category"
                ) {
                    const category =
                        options.categories.find(
                            (
                                row
                            ) =>
                                String(
                                    row.id
                                ) ===
                                String(
                                    form.category_id
                                )
                        );

                    return category
                        ? `All products in ${category.name}`
                        : "Select a category";
                }

                return `${selectedIds.length} selected product(s)`;
            },
            [
                form.scope,
                form.vendor_id,
                form.category_id,
                options,
                selectedIds.length,
            ]
        );


    const adjustmentText =
        useMemo(
            () => {
                if (
                    !form.value
                ) {
                    return "No adjustment value entered";
                }

                const sign =
                    form.direction ===
                    "increase"
                        ? "+"
                        : "-";

                return form.adjustment_type ===
                    "percentage"
                    ? `${sign}${form.value}%`
                    : `${sign}${money(
                        form.value
                    )}`;
            },
            [
                form.value,
                form.direction,
                form.adjustment_type,
            ]
        );


    const applyAdjustment =
        async () => {
            if (
                !Number(
                    form.value
                )
            ) {
                notify(
                    "Enter an adjustment value.",
                    "error"
                );

                return;
            }

            if (
                form.scope ===
                    "selected"
                && !selectedIds.length
            ) {
                notify(
                    "Select at least one product.",
                    "error"
                );

                return;
            }

            if (
                form.scope ===
                    "vendor"
                && !form.vendor_id
            ) {
                notify(
                    "Select a seller.",
                    "error"
                );

                return;
            }

            if (
                form.scope ===
                    "category"
                && !form.category_id
            ) {
                notify(
                    "Select a category.",
                    "error"
                );

                return;
            }

            const warning =
                form.scope ===
                    "all"
                    ? "This will change the price of EVERY matched marketplace product. Continue?"
                    : `Apply ${adjustmentText} to ${affectedLabel}?`;

            if (
                !window.confirm(
                    warning
                )
            ) {
                return;
            }

            setApplying(
                true
            );

            try {
                const response =
                    await adminService
                        .applyPriceAdjustment({
                            scope:
                                form.scope,
                            direction:
                                form.direction,
                            adjustment_type:
                                form.adjustment_type,
                            value:
                                Number(
                                    form.value
                                ),
                            include_variants:
                                Boolean(
                                    form.include_variants
                                ),
                            product_ids:
                                form.scope ===
                                "selected"
                                    ? selectedIds
                                    : [],
                            vendor_id:
                                form.scope ===
                                "vendor"
                                    ? Number(
                                        form.vendor_id
                                    )
                                    : null,
                            category_id:
                                form.scope ===
                                "category"
                                    ? Number(
                                        form.category_id
                                    )
                                    : null,
                            note:
                                form.note.trim()
                                || null,
                        });

                notify(
                    response.message
                );

                setSelectedIds(
                    []
                );

                setForm(
                    initialForm
                );

                await Promise.all([
                    loadProducts(),
                    loadHistory(),
                ]);
            } catch (
                exception
            ) {
                notify(
                    firstError(
                        exception
                    ),
                    "error"
                );
            } finally {
                setApplying(
                    false
                );
            }
        };


    const openHistory =
        async (
            id
        ) => {
            setDetailOpen(
                true
            );

            setAdjustmentDetail(
                null
            );

            try {
                const response =
                    await adminService
                        .pricingAdjustment(
                            id
                        );

                setAdjustmentDetail(
                    response.data
                );
            } catch (
                exception
            ) {
                notify(
                    firstError(
                        exception
                    ),
                    "error"
                );

                setDetailOpen(
                    false
                );
            }
        };


    const rollback =
        async (
            id
        ) => {
            if (
                !window.confirm(
                    "Rollback this price adjustment? Later manual price edits will be protected and reported as conflicts."
                )
            ) {
                return;
            }

            try {
                const response =
                    await adminService
                        .rollbackPriceAdjustment(
                            id
                        );

                notify(
                    response.message,
                    response
                        ?.data
                        ?.conflict_count >
                        0
                        ? "warning"
                        : "success"
                );

                const fresh =
                    await adminService
                        .pricingAdjustment(
                            id
                        );

                setAdjustmentDetail(
                    fresh.data
                );

                await Promise.all([
                    loadProducts(),
                    loadHistory(),
                ]);
            } catch (
                exception
            ) {
                notify(
                    firstError(
                        exception
                    ),
                    "error"
                );
            }
        };


    return (
        <AdminLayout>
            <div className="adm-price-builder">
                <AdminCard
                    title="Build Price Adjustment"
                    description="Choose scope, direction and adjustment method."
                >
                    <div className="adm-form-grid">
                        <label className="adm-field">
                            <span>
                                Adjustment Scope
                            </span>

                            <select
                                className="adm-select"
                                value={
                                    form.scope
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            scope:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            >
                                <option value="selected">
                                    Selected Product(s)
                                </option>
                                <option value="vendor">
                                    All Products of One Seller
                                </option>
                                <option value="category">
                                    All Products in One Category
                                </option>
                                <option value="all">
                                    Every Marketplace Product
                                </option>
                            </select>
                        </label>

                        <label className="adm-field">
                            <span>
                                Direction
                            </span>

                            <select
                                className="adm-select"
                                value={
                                    form.direction
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            direction:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            >
                                <option value="decrease">
                                    Decrease Price
                                </option>
                                <option value="increase">
                                    Increase Price
                                </option>
                            </select>
                        </label>

                        <label className="adm-field">
                            <span>
                                Adjustment Type
                            </span>

                            <select
                                className="adm-select"
                                value={
                                    form.adjustment_type
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            adjustment_type:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                            >
                                <option value="percentage">
                                    Percentage (%)
                                </option>
                                <option value="flat">
                                    Flat BDT Amount
                                </option>
                            </select>
                        </label>

                        <label className="adm-field">
                            <span>
                                Value
                            </span>

                            <input
                                className="adm-input"
                                type="number"
                                min="0.01"
                                step={
                                    form.adjustment_type ===
                                    "percentage"
                                        ? "0.01"
                                        : "0.01"
                                }
                                value={
                                    form.value
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            value:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                                placeholder={
                                    form.adjustment_type ===
                                    "percentage"
                                        ? "e.g. 10"
                                        : "e.g. 100"
                                }
                            />
                        </label>

                        {form.scope ===
                            "vendor" && (
                            <label className="adm-field full">
                                <span>
                                    Seller
                                </span>

                                <select
                                    className="adm-select"
                                    value={
                                        form.vendor_id
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                vendor_id:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                >
                                    <option value="">
                                        Select seller
                                    </option>

                                    {options.vendors.map(
                                        (
                                            vendor
                                        ) => (
                                            <option
                                                key={
                                                    vendor.id
                                                }
                                                value={
                                                    vendor.id
                                                }
                                            >
                                                {
                                                    vendor.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>
                        )}

                        {form.scope ===
                            "category" && (
                            <label className="adm-field full">
                                <span>
                                    Category
                                </span>

                                <select
                                    className="adm-select"
                                    value={
                                        form.category_id
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                category_id:
                                                    event
                                                        .target
                                                        .value,
                                            })
                                        )
                                    }
                                >
                                    <option value="">
                                        Select category
                                    </option>

                                    {options.categories.map(
                                        (
                                            category
                                        ) => (
                                            <option
                                                key={
                                                    category.id
                                                }
                                                value={
                                                    category.id
                                                }
                                            >
                                                {
                                                    category.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>
                        )}

                        <label className="adm-check full">
                            <input
                                type="checkbox"
                                checked={
                                    form.include_variants
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            include_variants:
                                                event
                                                    .target
                                                    .checked,
                                        })
                                    )
                                }
                            />

                            Include all product variants
                        </label>

                        <label className="adm-field full">
                            <span>
                                Admin Note
                            </span>

                            <textarea
                                className="adm-textarea"
                                value={
                                    form.note
                                }
                                onChange={(
                                    event
                                ) =>
                                    setForm(
                                        (
                                            current
                                        ) => ({
                                            ...current,
                                            note:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                                }
                                placeholder="Why is this price adjustment being made?"
                            />
                        </label>
                    </div>
                </AdminCard>

                <div>
                    <div className="adm-price-summary">
                        <h3>
                            Adjustment Preview
                        </h3>

                        <p>
                            <strong>
                                Scope:
                            </strong>{" "}
                            {
                                affectedLabel
                            }
                        </p>

                        <p>
                            <strong>
                                Change:
                            </strong>{" "}
                            {
                                adjustmentText
                            }
                        </p>

                        <p>
                            <strong>
                                Variants:
                            </strong>{" "}
                            {
                                form.include_variants
                                    ? "Included"
                                    : "Parent product only"
                            }
                        </p>

                        <p>
                            Price changes store old/new regular and sale price snapshots before writing the catalog.
                        </p>

                        <button
                            type="button"
                            className="adm-btn adm-btn-primary"
                            disabled={
                                applying
                            }
                            onClick={
                                applyAdjustment
                            }
                            style={{
                                width:
                                    "100%",
                                marginTop:
                                    10,
                            }}
                        >
                            {applying ? (
                                <>
                                    <span className="adm-spinner small" />
                                    Applying...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-tags" />
                                    Apply Price Adjustment
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <AdminCard
                title="Select Products"
                description="Use this table for single or multi-select price changes."
            >
                <div className="adm-toolbar">
                    <input
                        className="adm-input grow"
                        value={
                            filters.q
                        }
                        onChange={(
                            event
                        ) =>
                            setFilters(
                                (
                                    current
                                ) => ({
                                    ...current,
                                    q:
                                        event
                                            .target
                                            .value,
                                })
                            )
                        }
                        placeholder="Search product or SKU..."
                    />

                    <select
                        className="adm-select"
                        value={
                            filters.vendor_id
                        }
                        onChange={(
                            event
                        ) =>
                            setFilters(
                                (
                                    current
                                ) => ({
                                    ...current,
                                    vendor_id:
                                        event
                                            .target
                                            .value,
                                })
                            )
                        }
                    >
                        <option value="">
                            All sellers
                        </option>

                        {options.vendors.map(
                            (
                                vendor
                            ) => (
                                <option
                                    key={
                                        vendor.id
                                    }
                                    value={
                                        vendor.id
                                    }
                                >
                                    {
                                        vendor.name
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <select
                        className="adm-select"
                        value={
                            filters.category_id
                        }
                        onChange={(
                            event
                        ) =>
                            setFilters(
                                (
                                    current
                                ) => ({
                                    ...current,
                                    category_id:
                                        event
                                            .target
                                            .value,
                                })
                            )
                        }
                    >
                        <option value="">
                            All categories
                        </option>

                        {options.categories.map(
                            (
                                category
                            ) => (
                                <option
                                    key={
                                        category.id
                                    }
                                    value={
                                        category.id
                                    }
                                >
                                    {
                                        category.name
                                    }
                                </option>
                            )
                        )}
                    </select>
                </div>

                <div className="adm-selected-strip">
                    <strong>
                        {
                            selectedIds.length
                        }
                    </strong>
                    product(s) selected

                    {selectedIds.length >
                        0 && (
                        <button
                            type="button"
                            className="adm-btn"
                            onClick={() =>
                                setSelectedIds(
                                    []
                                )
                            }
                        >
                            Clear Selection
                        </button>
                    )}
                </div>

                {loading ? (
                    <AdminLoader />
                ) : !rows.length ? (
                    <AdminEmpty
                        title="No products found"
                    />
                ) : (
                    <div
                        className="adm-table-wrap"
                        style={{
                            marginTop:
                                10,
                        }}
                    >
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={
                                                allCurrentSelected
                                            }
                                            onChange={
                                                toggleAllCurrent
                                            }
                                        />
                                    </th>
                                    <th>
                                        Product
                                    </th>
                                    <th>
                                        Seller
                                    </th>
                                    <th>
                                        Regular
                                    </th>
                                    <th>
                                        Sale
                                    </th>
                                    <th>
                                        Categories
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map(
                                    (
                                        row
                                    ) => (
                                        <tr
                                            key={
                                                row.id
                                            }
                                        >
                                            <td
                                                data-label="Select"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selectedIds.includes(
                                                            row.id
                                                        )
                                                    }
                                                    onChange={() =>
                                                        toggleProduct(
                                                            row.id
                                                        )
                                                    }
                                                />
                                            </td>

                                            <td
                                                data-label="Product"
                                            >
                                                <div className="adm-product-cell">
                                                    <span className="adm-thumb">
                                                        {row.cover_image ? (
                                                            <img
                                                                src={
                                                                    mediaUrl(
                                                                        row.cover_image
                                                                    )
                                                                }
                                                                alt={
                                                                    row.name
                                                                }
                                                            />
                                                        ) : (
                                                            <i className="fa-regular fa-image" />
                                                        )}
                                                    </span>

                                                    <div>
                                                        <strong>
                                                            {
                                                                row.name
                                                            }
                                                        </strong>

                                                        <span className="adm-table-sub">
                                                            {
                                                                row.sku
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td
                                                data-label="Seller"
                                            >
                                                {
                                                    row.vendor ||
                                                    "—"
                                                }
                                            </td>

                                            <td
                                                data-label="Regular"
                                            >
                                                {
                                                    money(
                                                        row.regular_price
                                                    )
                                                }
                                            </td>

                                            <td
                                                data-label="Sale"
                                            >
                                                {
                                                    row.sale_price !==
                                                    null
                                                        ? money(
                                                            row.sale_price
                                                        )
                                                        : "—"
                                                }
                                            </td>

                                            <td
                                                data-label="Categories"
                                            >
                                                {row.categories
                                                    ?.map(
                                                        (
                                                            category
                                                        ) =>
                                                            category.name
                                                    )
                                                    .join(
                                                        ", "
                                                    ) ||
                                                    "—"}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminCard>

            <AdminCard
                title="Price Adjustment History"
                description="Every batch keeps a full audit snapshot and can be reviewed or rolled back."
            >
                {!history.length ? (
                    <AdminEmpty
                        title="No price adjustments yet"
                    />
                ) : (
                    <div className="adm-table-wrap">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>
                                        Batch
                                    </th>
                                    <th>
                                        Scope
                                    </th>
                                    <th>
                                        Adjustment
                                    </th>
                                    <th>
                                        Items
                                    </th>
                                    <th>
                                        Result
                                    </th>
                                    <th />
                                </tr>
                            </thead>

                            <tbody>
                                {history.map(
                                    (
                                        row
                                    ) => (
                                        <tr
                                            key={
                                                row.id
                                            }
                                        >
                                            <td
                                                data-label="Batch"
                                            >
                                                <strong>
                                                    {
                                                        row.batch_number
                                                    }
                                                </strong>
                                            </td>

                                            <td
                                                data-label="Scope"
                                            >
                                                {
                                                    titleCase(
                                                        row.scope
                                                    )
                                                }

                                                <span className="adm-table-sub">
                                                    {
                                                        row.include_variants
                                                            ? "Variants included"
                                                            : "No variants"
                                                    }
                                                </span>
                                            </td>

                                            <td
                                                data-label="Adjustment"
                                            >
                                                {
                                                    titleCase(
                                                        row.direction
                                                    )
                                                }{" "}
                                                {row.adjustment_type ===
                                                "flat"
                                                    ? money(
                                                        row.flat_amount
                                                    )
                                                    : `${row.percentage}%`}
                                            </td>

                                            <td
                                                data-label="Items"
                                            >
                                                {
                                                    row.total_items
                                                }
                                            </td>

                                            <td
                                                data-label="Result"
                                            >
                                                <AdminBadge
                                                    value={
                                                        row.status
                                                    }
                                                />

                                                <span className="adm-table-sub">
                                                    {
                                                        row.applied_count
                                                    }{" "}
                                                    applied ·{" "}
                                                    {
                                                        row.failed_count
                                                    }{" "}
                                                    failed
                                                </span>
                                            </td>

                                            <td
                                                data-label="Action"
                                            >
                                                <button
                                                    className="adm-btn"
                                                    onClick={() =>
                                                        openHistory(
                                                            row.id
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminCard>

            <AdminModal
                open={
                    detailOpen
                }
                title={
                    adjustmentDetail
                        ? `Price Batch · ${adjustmentDetail.batch_number}`
                        : "Price Adjustment"
                }
                size="xl"
                bodyClassName="adm-modal-body--fill"
                onClose={() =>
                    setDetailOpen(
                        false
                    )
                }
            >
                {!adjustmentDetail ? (
                    <AdminLoader />
                ) : (
                    <div className="adm-batch-detail">
                        <div className="adm-metric-grid">
                            <AdminMetric
                                icon="fa-solid fa-box"
                                label="Products"
                                value={
                                    adjustmentDetail.total_products
                                }
                            />
                            <AdminMetric
                                icon="fa-solid fa-layer-group"
                                label="Variants"
                                value={
                                    adjustmentDetail.total_variants
                                }
                                tone="blue"
                            />
                            <AdminMetric
                                icon="fa-solid fa-check"
                                label="Applied"
                                value={
                                    adjustmentDetail.applied_count
                                }
                                tone="green"
                            />
                            <AdminMetric
                                icon="fa-solid fa-triangle-exclamation"
                                label="Failed"
                                value={
                                    adjustmentDetail.failed_count
                                }
                                tone="red"
                            />
                        </div>

                        <section className="adm-batch-panel">
                            <div className="adm-batch-panel-head">
                                <h4>Batch Details</h4>

                                {![
                                    "rolled_back",
                                    "rollback_partial",
                                ].includes(
                                    adjustmentDetail.status
                                ) ? (
                                    <button
                                        type="button"
                                        className="adm-btn adm-btn-danger"
                                        onClick={() =>
                                            rollback(
                                                adjustmentDetail.id
                                            )
                                        }
                                    >
                                        <i className="fa-solid fa-rotate-left" />
                                        Rollback Batch
                                    </button>
                                ) : null}
                            </div>

                            <div className="adm-batch-panel-body">
                                <div className="adm-batch-meta">
                                    <div className="adm-batch-meta__item">
                                        <span>Status</span>
                                        <AdminBadge
                                            value={
                                                adjustmentDetail.status
                                            }
                                        />
                                    </div>

                                    <div className="adm-batch-meta__item">
                                        <span>Adjustment</span>
                                        <strong>
                                            {
                                                titleCase(
                                                    adjustmentDetail.direction
                                                )
                                            }{" "}
                                            {adjustmentDetail.adjustment_type ===
                                            "flat"
                                                ? money(
                                                    adjustmentDetail.flat_amount
                                                )
                                                : `${adjustmentDetail.percentage}%`}
                                        </strong>
                                    </div>

                                    <div className="adm-batch-meta__item">
                                        <span>Created By</span>
                                        <strong>
                                            {
                                                adjustmentDetail.creator
                                                    ?.name ||
                                                "—"
                                            }
                                        </strong>
                                    </div>

                                    <div className="adm-batch-meta__item">
                                        <span>Created</span>
                                        <strong>
                                            {
                                                formatDate(
                                                    adjustmentDetail.created_at
                                                )
                                            }
                                        </strong>
                                    </div>

                                    <div className="adm-batch-meta__item adm-batch-meta__item--full">
                                        <span>Note</span>
                                        <strong>
                                            {
                                                adjustmentDetail.note ||
                                                "—"
                                            }
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="adm-batch-panel adm-batch-panel--items">
                            <div className="adm-batch-panel-head">
                                <h4>Changed Items</h4>
                            </div>

                            <div className="adm-batch-panel-body">
                                <div className="adm-table-wrap">
                                    <table className="adm-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    Item
                                                </th>
                                                <th>
                                                    SKU
                                                </th>
                                                <th>
                                                    Old Regular
                                                </th>
                                                <th>
                                                    New Regular
                                                </th>
                                                <th>
                                                    Old Sale
                                                </th>
                                                <th>
                                                    New Sale
                                                </th>
                                                <th>
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {adjustmentDetail.items?.map(
                                                (
                                                    item
                                                ) => (
                                                    <tr
                                                        key={
                                                            item.id
                                                        }
                                                    >
                                                        <td
                                                            data-label="Item"
                                                        >
                                                            <strong>
                                                                {
                                                                    item.product_name
                                                                }
                                                            </strong>

                                                            {item.variant_name && (
                                                                <span className="adm-table-sub">
                                                                    {
                                                                        item.variant_name
                                                                    }
                                                                </span>
                                                            )}
                                                        </td>

                                                        <td
                                                            data-label="SKU"
                                                        >
                                                            {
                                                                item.sku ||
                                                                "—"
                                                            }
                                                        </td>

                                                        <td
                                                            data-label="Old Regular"
                                                        >
                                                            {
                                                                money(
                                                                    item.old_regular_price
                                                                )
                                                            }
                                                        </td>

                                                        <td
                                                            data-label="New Regular"
                                                        >
                                                            {
                                                                money(
                                                                    item.new_regular_price
                                                                )
                                                            }
                                                        </td>

                                                        <td
                                                            data-label="Old Sale"
                                                        >
                                                            {
                                                                item.old_sale_price !==
                                                                null
                                                                    ? money(
                                                                        item.old_sale_price
                                                                    )
                                                                    : "—"
                                                            }
                                                        </td>

                                                        <td
                                                            data-label="New Sale"
                                                        >
                                                            {
                                                                item.new_sale_price !==
                                                                null
                                                                    ? money(
                                                                        item.new_sale_price
                                                                    )
                                                                    : "—"
                                                            }
                                                        </td>

                                                        <td
                                                            data-label="Status"
                                                        >
                                                            <AdminBadge
                                                                value={
                                                                    item.status
                                                                }
                                                            />

                                                            {item.message && (
                                                                <span className="adm-table-sub">
                                                                    {
                                                                        item.message
                                                                    }
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </AdminModal>

            <AdminToast
                toast={
                    toast
                }
            />
        </AdminLayout>
    );
}
