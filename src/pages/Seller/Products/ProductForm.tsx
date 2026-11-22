import {
    useEffect,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import SellerLayout from "../Layout";
import sellerProductService from "../../../services/sellerProductService";
import {
    ImageSlots,
    RichTextEditor,
    Toggle,
    VariantEditor,
    CategoryMultiPicker,
} from "./ProductWidgets";
import "./seller-products.css";
import "./product-edit.css";

const emptyForm = {
    name: "",
    sku: "",
    slug: "",
    barcode: "",
    category_ids: [],
    brand_id: "",
    brand_name: "",
    unit_id: "",
    unit_value: 1,
    weight_unit_id: "",
    weight_value: "",
    pre_order_enabled: false,
    pre_order_message: "",
    images: [],
    image_files: {},
    remove_image_slots: [],
    video_embed: "",
    video_position: "",
    track_stock: true,
    stock_alert_quantity: 5,
    stock_quantity: 0,
    condition: "new",
    availability: "in_stock",
    regular_price: "",
    discount_type: "flat",
    discount_value: 0,
    has_variants: false,
    variants: [],
    variant_image_files: {},
    description: "",
    delivery_type: "free_shipping",
    offer_ids: [],
    flag_ids: [],
    is_digital: false,
    download_limit: "",
    download_expiry_days: "",
    digital_files: [],
    digital_file_uploads: [],
    remove_digital_file_ids: [],
    seo_enabled: false,
    meta_title: "",
    meta_keywords: "",
    meta_description: "",
    canonical_url: "",
    approval_status: "draft",
    is_published: false,
    rejection_reason: "",
};

const PRODUCT_IMAGE_SLOTS = 5;

const slugify = (value) =>
    String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

/*
 * Convert API detail payload into the exact form state used by Create/Edit.
 * Keeping this in one place prevents initial-load and post-save state drift.
 */
const hydrateProductForm = (data = {}) => ({
    ...emptyForm,
    ...data,

    brand_name: data.brand || data.brand_name || "",
    brand_id: data.brand_id || "",
    delivery_type: data.delivery_type || "free_shipping",
    condition: "new",
    track_stock: true,
    description:
        data.description
        || data.long_description
        || data.short_description
        || "",

    image_files: {},
    remove_image_slots: [],

    variant_image_files: {},
    digital_file_uploads: [],
    remove_digital_file_ids: [],

    category_ids: (data.category_ids || data.categories || [])
        .map((item) => (typeof item === "object" ? Number(item.id) : Number(item)))
        .filter(Number.isFinite),

    offer_ids: [],
    flag_ids: [],
    is_digital: false,
    seo_enabled: false,

    variants: (data.variants || []).map((variant) => ({
        ...variant,
        attributes: variant.attributes || {},
    })),
});

export default function ProductForm({ productId = null }) {
    const navigate = useNavigate();
    const location = useLocation();
    const editing = Boolean(productId);

    const [form, setForm] = useState(emptyForm);
    const [options, setOptions] = useState({
        categories: [],
        brands: [],
        units: [],
        weight_units: [],
        flags: [],
        offers: [],
        attributes: [],
        conditions: [],
        availability: [],
        delivery_types: [],
        video_positions: [],
        max_image_slots: PRODUCT_IMAGE_SLOTS,
        vendor: null,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(
        typeof location.state?.notice === "string" ? location.state.notice : ""
    );

    useEffect(() => {
        if (!location.state?.notice) return;

        navigate(location.pathname, { replace: true, state: null });
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setError("");

            try {
                const [optionsResponse, productResponse] = await Promise.all([
                    sellerProductService.formOptions(),
                    editing
                        ? sellerProductService.show(productId)
                        : Promise.resolve(null),
                ]);

                if (!active) return;

                const nextOptions = optionsResponse.data || {};
                setOptions(nextOptions);

                if (editing && productResponse?.data) {
                    setForm(
                        hydrateProductForm(
                            productResponse.data
                        )
                    );
                } else {
                    setForm((current) => ({
                        ...current,
                        sku: nextOptions.next_sku || current.sku,
                        unit_id:
                            nextOptions.units?.[0]?.id || current.unit_id,
                        weight_unit_id: "",
                    }));
                }
            } catch (exception) {
                if (active) {
                    setError(exception.message || "Product form could not be loaded.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        load();

        return () => {
            active = false;
        };
    }, [editing, productId]);

    const setField = (name, value) => {
        setNotice("");
        setError("");

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const setName = (value) => {
        setForm((current) => ({
            ...current,
            name: value,
            slug: slugify(value),
        }));
    };

    const setBrandInput = (value) => {
        const trimmed = String(value || "");
        const matched = (options.brands || []).find(
            (brand) =>
                String(brand.name).toLowerCase() === trimmed.trim().toLowerCase()
        );

        setForm((current) => ({
            ...current,
            brand_name: trimmed,
            brand_id: matched ? matched.id : "",
        }));
    };

    const imageFile = (slot, file) => {
        setForm((current) => ({
            ...current,
            image_files: {
                ...current.image_files,
                [slot]: file,
            },
            remove_image_slots: current.remove_image_slots.filter(
                (value) => value !== slot
            ),
        }));
    };

    const removeImage = (slot) => {
        setForm((current) => {
            const nextFiles = { ...current.image_files };
            delete nextFiles[slot];

            const hasExisting = (current.images || []).some(
                (image) => image.slot === slot && image.url
            );

            return {
                ...current,
                image_files: nextFiles,
                remove_image_slots: hasExisting
                    ? Array.from(new Set([...current.remove_image_slots, slot]))
                    : current.remove_image_slots,
            };
        });
    };

    const variantImage = (index, file) => {
        setForm((current) => ({
            ...current,
            variant_image_files: {
                ...current.variant_image_files,
                [index]: file,
            },
        }));
    };

    const selectCategories = (ids) => {
        setField(
            "category_ids",
            (Array.isArray(ids) ? ids : [])
                .map(Number)
                .filter(Number.isFinite)
        );
    };

    const validateClient = (action) => {
        // Match /seller/products/create essentials:
        // name + price always; cover image only when publishing.
        // Everything else on this edit page stays optional.
        if (!form.name.trim()) return "Give your product a name.";
        if (!Number(form.regular_price || 0)) {
            return "Enter a selling price greater than zero.";
        }

        if (
            form.discount_type === "percentage" &&
            Number(form.discount_value || 0) > 100
        ) {
            return "Percentage discount cannot exceed 100%.";
        }

        if (form.has_variants && !form.variants.length) {
            return "Add at least one variant or disable variants.";
        }

        if (form.has_variants) {
            const missingStock = form.variants.findIndex(
                (variant) => !Number(variant.stock_quantity)
            );
            if (missingStock !== -1) {
                return `Enter stock quantity for variant ${missingStock + 1}.`;
            }
        } else if (!Number(form.stock_quantity)) {
            return "Stock quantity is required.";
        }

        if (action === "publish") {
            const coverExisting = (form.images || []).some(
                (image) =>
                    image.slot === 1 &&
                    image.url &&
                    !form.remove_image_slots.includes(1)
            );
            const coverNew = form.image_files?.[1] instanceof File;

            if (!coverExisting && !coverNew) {
                return "Add a cover image or video before publishing.";
            }
        }

        return "";
    };

    const submit = async (action) => {
        const validationError = validateClient(action);

        if (validationError) {
            setError(validationError);
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
            return;
        }

        try {
            setSaving(true);
            setError("");
            setNotice("");

            const response = editing
                ? await sellerProductService.update(
                    productId,
                    form,
                    action
                )
                : await sellerProductService.create(
                    form,
                    action
                );

            const id =
                Number(
                    response.data?.id ||
                    productId
                );

            /*
             * CREATE:
             * move to the newly-created Edit page.
             */
            if (!editing) {
                navigate(
                    `/seller/products/${id}/edit`,
                    {
                        replace: true,
                        state: {
                            notice:
                                response.message ||
                                "Product saved.",
                        },
                    }
                );

                return;
            }

            /*
             * EDIT:
             * immediately read the product back from the API.
             *
             * This verifies that Offer Setup / Product Flags were really
             * persisted in offer_product / product_flag instead of leaving
             * the UI in a local-only state.
             */
            const freshResponse =
                await sellerProductService.show(
                    id,
                    {
                        fresh: true,
                    }
                );

            if (freshResponse?.data) {
                setForm(
                    hydrateProductForm(
                        freshResponse.data
                    )
                );
            } else {
                /*
                 * Fallback to IDs returned by the save endpoint.
                 */
                setForm((current) => ({
                    ...current,

                    offer_ids:
                        (
                            response.data
                                ?.offer_ids ||
                            current.offer_ids
                        )
                            .map(Number)
                            .filter(
                                Number.isFinite
                            ),

                    flag_ids:
                        (
                            response.data
                                ?.flag_ids ||
                            current.flag_ids
                        )
                            .map(Number)
                            .filter(
                                Number.isFinite
                            ),
                }));
            }

            setNotice(
                response.message ||
                "Product updated successfully."
            );
        } catch (exception) {
            setError(
                exception.message ||
                "Product could not be saved."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <SellerLayout>
                <div className="sp-loading">
                    <i className="fa-solid fa-spinner fa-spin" />
                    Loading product form...
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="spe-page sp-form-page">
                <header className="spe-topbar sp-form-topbar">
                    <div className="spe-topbar-copy">
                        <p className="spe-kicker">
                            {editing ? "Catalog editor" : "New listing"}
                        </p>
                        <div className="spe-title-row">
                            <h1>
                                {editing
                                    ? form.name?.trim() || "Edit product"
                                    : "Add product"}
                            </h1>
                            {editing && (
                                <span
                                    className={`sp-approval sp-${form.approval_status}`}
                                >
                                    {String(form.approval_status || "draft")
                                        .replaceAll("_", " ")
                                        .replace(/\b\w/g, (char) =>
                                            char.toUpperCase()
                                        )}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="spe-actions sp-form-actions">
                        <button
                            type="button"
                            className="spe-btn-ghost sp-outline-btn"
                            disabled={saving}
                            onClick={() => navigate("/seller/products")}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="spe-btn-secondary sp-outline-btn"
                            disabled={saving}
                            onClick={() => submit("draft")}
                        >
                            {saving ? (
                                <i className="fa-solid fa-spinner fa-spin" />
                            ) : null}
                            Save draft
                        </button>

                        <button
                            type="button"
                            className="spe-btn-primary sp-primary-btn"
                            disabled={saving}
                            onClick={() => submit("publish")}
                        >
                            {saving ? (
                                <i className="fa-solid fa-spinner fa-spin" />
                            ) : null}
                            Publish
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="sp-alert error">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error}
                    </div>
                )}

                {notice && (
                    <div className="sp-alert success">
                        <i className="fa-solid fa-circle-check" />
                        {notice}
                    </div>
                )}

                {form.rejection_reason && (
                    <div className="sp-alert warning">
                        <strong>Rejection reason:</strong> {form.rejection_reason}
                    </div>
                )}

                <Section title="Product information" hint="Core listing details">
                    <FieldRow label="Product name" required>
                        <input
                            value={form.name}
                            placeholder="Enter title"
                            onChange={(event) => setName(event.target.value)}
                        />
                    </FieldRow>

                    <FieldRow label="Category">
                        <CategoryMultiPicker
                            categories={options.categories || []}
                            value={form.category_ids}
                            onChange={selectCategories}
                            placeholder="Pick one or more shelves"
                        />
                    </FieldRow>

                    <FieldRow label="Brand" optional>
                        <input
                            type="text"
                            value={form.brand_name || ""}
                            placeholder="Brand name"
                            autoComplete="off"
                            onChange={(event) => setBrandInput(event.target.value)}
                        />
                    </FieldRow>

                    <FieldRow label="Unit">
                        <div className="sp-inline-controls">
                            <select
                                value={form.unit_id || ""}
                                onChange={(event) => setField("unit_id", event.target.value)}
                            >
                                <option value="">Select unit</option>
                                {options.units.map((unit) => (
                                    <option value={unit.id} key={unit.id}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={form.unit_value}
                                onChange={(event) => setField("unit_value", event.target.value)}
                            />
                        </div>
                    </FieldRow>

                    <FieldRow label="Weight">
                        <div className="sp-inline-controls">
                            <select
                                value={form.weight_unit_id || ""}
                                onChange={(event) =>
                                    setField("weight_unit_id", event.target.value)
                                }
                            >
                                <option value="">Select weight unit</option>
                                {options.weight_units.map((unit) => (
                                    <option value={unit.id} key={unit.id}>
                                        {unit.name}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                min="0"
                                step="0.001"
                                placeholder="Weight value"
                                value={form.weight_value}
                                onChange={(event) => setField("weight_value", event.target.value)}
                            />
                        </div>
                    </FieldRow>

                    <FieldRow label="Listing status">
                        <Toggle
                            checked={Boolean(
                                form.approval_status === "approved" && form.is_published
                            )}
                            label={
                                form.approval_status === "approved" && form.is_published
                                    ? "Live on shop"
                                    : form.approval_status === "rejected"
                                      ? "Rejected — edit and publish again"
                                      : "Publish to go live on the shop"
                            }
                            disabled
                            onChange={() => {}}
                        />
                    </FieldRow>
                </Section>

                <Section title="Media" hint="Cover needed to publish; image or video in any slot">
                    <FieldRow label="Product media">
                        <ImageSlots
                            existing={form.images || []}
                            files={form.image_files || {}}
                            removedSlots={form.remove_image_slots || []}
                            maxSlots={PRODUCT_IMAGE_SLOTS}
                            onFile={imageFile}
                            onRemove={removeImage}
                        />
                    </FieldRow>
                </Section>

                <Section title="Inventory, price & variants" hint="How this item sells">
                    <FieldRow label="Stock Quantity" required>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            required={!form.has_variants}
                            disabled={form.has_variants}
                            value={form.stock_quantity}
                            onChange={(event) =>
                                setField("stock_quantity", Number(event.target.value || 0))
                            }
                        />
                    </FieldRow>

                    <FieldRow label="Product Availability">
                        <select
                            value={form.availability}
                            onChange={(event) =>
                                setField("availability", event.target.value)
                            }
                        >
                            {options.availability.map((availability) => (
                                <option value={availability.value} key={availability.value}>
                                    {availability.label}
                                </option>
                            ))}
                        </select>
                    </FieldRow>

                    <FieldRow label="Delivery / Shipping">
                        <select
                            value={form.delivery_type || "free_shipping"}
                            onChange={(event) =>
                                setField("delivery_type", event.target.value)
                            }
                        >
                            {(options.delivery_types?.length
                                ? options.delivery_types
                                : [
                                      { value: "free_shipping", label: "Free Shipping" },
                                      {
                                          value: "rate_by_weight",
                                          label: "Paid shipping (area rates)",
                                      },
                                  ]
                            ).map((option) => (
                                <option value={option.value} key={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </FieldRow>

                    <FieldRow label="Regular Price" required>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Regular price"
                            value={form.regular_price}
                            onChange={(event) =>
                                setField("regular_price", event.target.value)
                            }
                        />
                    </FieldRow>

                    <FieldRow label="Discount">
                        <div className="sp-inline-controls sp-discount-controls">
                            <select
                                value={form.discount_type}
                                onChange={(event) =>
                                    setField("discount_type", event.target.value)
                                }
                            >
                                <option value="flat">Flat</option>
                                <option value="percentage">Percentage</option>
                            </select>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.discount_value}
                                onChange={(event) =>
                                    setField("discount_value", event.target.value)
                                }
                            />
                        </div>
                    </FieldRow>

                    <FieldRow label="Add Variant">
                        <Toggle
                            checked={form.has_variants}
                            label="Enable product variants"
                            onChange={(value) => {
                                setField("has_variants", value);
                                if (value && !form.variants.length) {
                                    setForm((current) => ({
                                        ...current,
                                        has_variants: true,
                                        variants: [
                                            {
                                                id: null,
                                                name: "",
                                                sku: `${current.sku || "SKU"}-V1`,
                                                barcode: "",
                                                unit_id: "",
                                                unit_value: 1,
                                                weight_unit_id: "",
                                                weight_value: "",
                                                regular_price: current.regular_price || "",
                                                discount_type: current.discount_type || "flat",
                                                discount_value: current.discount_value || 0,
                                                track_stock: true,
                                                stock_quantity: 0,
                                                stock_alert_quantity:
                                                    current.stock_alert_quantity || 5,
                                                availability: "out_of_stock",
                                                is_default: true,
                                                is_active: true,
                                                attributes: {},
                                            },
                                        ],
                                    }));
                                }
                            }}
                        />
                    </FieldRow>

                    {form.has_variants && (
                        <div className="sp-full-section-row">
                            <VariantEditor
                                variants={form.variants}
                                attributes={options.attributes || []}
                                units={options.units || []}
                                weightUnits={options.weight_units || []}
                                baseSku={form.sku}
                                onChange={(variants) => setField("variants", variants)}
                                imageFiles={form.variant_image_files || {}}
                                onImageFile={variantImage}
                            />
                        </div>
                    )}
                </Section>

                <Section title="Description">
                    <div className="sp-editor-block">
                        <label>Description</label>
                        <RichTextEditor
                            value={form.description}
                            minHeight={220}
                            placeholder="Write the product description..."
                            onChange={(value) => setField("description", value)}
                        />
                    </div>
                </Section>

                <div className="sp-mobile-bottom-actions">
                    <button
                        type="button"
                        className="sp-outline-btn"
                        disabled={saving}
                        onClick={() => submit("draft")}
                    >
                        Save Draft
                    </button>

                    <button
                        type="button"
                        className="sp-primary-btn"
                        disabled={saving}
                        onClick={() => submit("publish")}
                    >
                        Publish
                    </button>
                </div>
            </div>
        </SellerLayout>
    );
}

function Section({ title, children, hint = "" }) {
    return (
        <section className="spe-section sp-section-card">
            <div className="spe-section-head sp-section-title">
                <span>{title}</span>
                {hint ? <small>{hint}</small> : null}
            </div>
            <div className="spe-section-body sp-section-content">{children}</div>
        </section>
    );
}

function FieldRow({ label, required = false, optional = false, children }) {
    return (
        <div className="spe-field sp-field-row">
            <label className="spe-field-label sp-field-label">
                <span>
                    {label}
                    {required ? <b> *</b> : null}
                    {optional && !required ? <small> optional</small> : null}
                </span>
            </label>
            <div className="spe-field-control sp-field-control">{children}</div>
        </div>
    );
}
