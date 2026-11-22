import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import { mediaUrl } from "../../config/api";
import {
    TEMPLATES,
    blankDraft,
    defaultSections,
    defaultTheme,
    sectionsForTemplate,
    slugify,
} from "./landingStudioConfig";
import "./admin-landing-pages.css";

function firstError(error: any, fallback = "Request failed.") {
    const errors = error?.response?.data?.errors || error?.data?.errors;
    if (errors) {
        const first = Object.values(errors)?.[0];
        if (Array.isArray(first) && first[0]) return String(first[0]);
        }
    return (
        error?.response?.data?.message ||
        error?.data?.message ||
        error?.message ||
        fallback
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="lpb-field">
            <span>{label}</span>
            {children}
        </label>
    );
}

function TextInput({
    label,
    value,
    onChange,
    placeholder = "",
}: {
    label: string;
    value: any;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <Field label={label}>
            <input
                value={value ?? ""}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
            />
        </Field>
    );
}

function TextArea({
    label,
    value,
    onChange,
    rows = 3,
}: {
    label: string;
    value: any;
    onChange: (value: string) => void;
    rows?: number;
}) {
    return (
        <Field label={label}>
                    <textarea
                rows={rows}
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                    />
                </Field>
    );
}

function ListEditor({
    label,
    values,
    onChange,
}: {
    label: string;
    values: string[];
    onChange: (next: string[]) => void;
}) {
    const items = Array.isArray(values) ? values : [];
        return (
        <div className="lpb-list-editor">
            <div className="lpb-list-editor__head">
                <strong>{label}</strong>
                        <button
                            type="button"
                    className="adm-btn adm-btn-ghost"
                    onClick={() => onChange([...items, ""])}
                        >
                    Add item
                        </button>
                    </div>
            {items.map((item, index) => (
                <div className="lpb-list-editor__row" key={`${label}-${index}`}>
                    <input
                        value={item}
                        onChange={(event) => {
                            const next = [...items];
                            next[index] = event.target.value;
                            onChange(next);
                        }}
                    />
                        <button
                            type="button"
                        className="adm-btn adm-btn-ghost"
                    onClick={() =>
                            onChange(items.filter((_, i) => i !== index))
                        }
                    >
                        Remove
                        </button>
                    </div>
                ))}
                    </div>
    );
}

function ImageListEditor({
    label,
    values,
    onChange,
    onUpload,
}: {
    label: string;
    values: string[];
    onChange: (next: string[]) => void;
    onUpload: (file: File) => Promise<string>;
}) {
    const items = Array.isArray(values) ? values : [];
        return (
        <div className="lpb-list-editor">
            <div className="lpb-list-editor__head">
                <strong>{label}</strong>
                <label className="adm-btn adm-btn-ghost lpb-upload-btn">
                    Upload
                            <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={async (event) => {
                            const file = event.target.files?.[0];
                            event.target.value = "";
                            if (!file) return;
                            try {
                                const path = await onUpload(file);
                                if (path) onChange([...items, path]);
                            } catch (exception: any) {
                                window.alert(
                                    exception?.message || "Image upload failed."
                                );
                            }
                        }}
                    />
                </label>
                    </div>
            <div className="lpb-image-grid">
                {items.map((item, index) => (
                    <div className="lpb-image-card" key={`${item}-${index}`}>
                        <img
                            src={mediaUrl(item)}
                            alt=""
                            onError={(event) => {
                                const target = event.currentTarget;
                                target.style.opacity = "0.35";
                                target.alt = "Image missing";
                            }}
                        />
                        <button
                            type="button"
                            onClick={() =>
                                onChange(items.filter((_, i) => i !== index))
                            }
                        >
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AdminLandingPages() {
    const [rows, setRows] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<"list" | "edit">("list");
    const [draft, setDraft] = useState(() => blankDraft());
    const [openSection, setOpenSection] = useState("hero");

    const loadList = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [pagesRes, productsRes] = await Promise.all([
                adminService.landingPages(search ? { q: search } : {}),
                adminService.products({ per_page: 100 }),
            ]);
            setRows(pagesRes?.data || pagesRes || []);
            const productRows =
                productsRes?.data?.data ||
                productsRes?.data ||
                productsRes ||
                [];
            setProducts(Array.isArray(productRows) ? productRows : []);
        } catch (exception) {
            setError(firstError(exception, "Could not load landing pages."));
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const selectedProduct = useMemo(
        () => products.find((item) => Number(item.id) === Number(draft.product_id)),
        [products, draft.product_id]
    );

    const openCreate = () => {
        setDraft(blankDraft());
        setOpenSection("hero");
        setMode("edit");
        setError("");
    };

    const openEdit = async (id: number) => {
        setLoading(true);
        setError("");
        try {
            const response = await adminService.landingPage(id);
            const data = response?.data || response;
            setDraft({
                id: data.id,
                product_id: data.product_id,
                title: data.title || "",
                slug: data.slug || "",
                template: data.template || "classic-natural",
                is_active: Boolean(data.is_active),
                show_footer_products: Boolean(data.show_footer_products),
                theme: { ...defaultTheme(), ...(data.theme || {}) },
                seo: {
                    meta_title: "",
                    meta_description: "",
                    ...(data.seo || {}),
                },
                settings: data.settings || {},
                sections:
                    Array.isArray(data.sections) && data.sections.length
                        ? data.sections
                        : defaultSections(data.product_name || data.title),
            });
            setOpenSection(data.sections?.[0]?.type || "hero");
            setMode("edit");
        } catch (exception) {
            setError(firstError(exception, "Could not open landing page."));
        } finally {
            setLoading(false);
        }
    };

    const updateSectionContent = (type: string, key: string, value: any) => {
        setDraft((current) => ({
            ...current,
            sections: current.sections.map((section) =>
                section.type === type
                    ? {
                        ...section,
                        content: {
                            ...section.content,
                              [key]: value,
                        },
                    }
                    : section
            ),
        }));
    };

    const updateSectionMeta = (type: string, patch: Record<string, any>) => {
        setDraft((current) => ({
            ...current,
            sections: current.sections.map((section) =>
                section.type === type ? { ...section, ...patch } : section
            ),
        }));
    };

    const uploadImage = async (file: File) => {
        const response = await adminService.uploadLandingImage(file);
        const path =
            response?.data?.path ||
            response?.path ||
            response?.data?.url ||
            response?.url;
        if (!path) throw new Error("Upload failed.");
        // Prefer relative disk key so mediaUrl() can build /storage/... correctly.
        const normalized = String(path)
            .replace(/^https?:\/\/[^/]+/i, "")
            .replace(/^\/+/, "")
            .replace(/^storage\//, "");
        return normalized || path;
    };

    const save = async () => {
        if (!draft.product_id) {
            setError("Select a product first.");
            return;
        }
        if (!draft.title.trim()) {
            setError("Title is required.");
            return;
        }

        setSaving(true);
        setError("");
        try {
        const payload = {
                product_id: draft.product_id,
            title: draft.title.trim(),
                slug: draft.slug.trim() || slugify(draft.title),
                template: draft.template,
                is_active: draft.is_active,
                show_footer_products: draft.show_footer_products,
            theme: draft.theme,
                seo: draft.seo,
                settings: draft.settings,
                sections: draft.sections,
            };
            const response = await adminService.saveLandingPage(draft.id, payload);
            const saved = response?.data || response;
            setDraft((current) => ({ ...current, id: saved.id, slug: saved.slug }));
            await loadList();
            setMode("list");
        } catch (exception) {
            setError(firstError(exception, "Could not save landing page."));
        } finally {
            setSaving(false);
        }
    };

    const removePage = async (row: any) => {
        if (!window.confirm(`Delete “${row.title}”?`)) return;
        try {
            await adminService.deleteLandingPage(row.id);
            await loadList();
        } catch (exception) {
            setError(firstError(exception, "Could not delete landing page."));
        }
    };

    const togglePublish = async (row: any) => {
        try {
            await adminService.publishLandingPage(row.id, !row.is_active);
            await loadList();
        } catch (exception) {
            setError(firstError(exception, "Could not update publish state."));
        }
    };

    const renderSectionEditor = (section: any) => {
        const content = section.content || {};
        const type = section.type;

        if (type === "hero") {
            return (
                <>
                    <TextInput label="Brand name" value={content.brand_name} onChange={(v) => updateSectionContent(type, "brand_name", v)} />
                    <TextInput label="Title line 1" value={content.title_1} onChange={(v) => updateSectionContent(type, "title_1", v)} />
                    <TextInput label="Title line 2" value={content.title_2} onChange={(v) => updateSectionContent(type, "title_2", v)} />
                    <TextInput label="Title line 3" value={content.title_3} onChange={(v) => updateSectionContent(type, "title_3", v)} />
                    <TextInput label="Promise title" value={content.promise_title} onChange={(v) => updateSectionContent(type, "promise_title", v)} />
                    <TextArea label="Promise text" value={content.promise_text} onChange={(v) => updateSectionContent(type, "promise_text", v)} />
                    <TextInput label="Refund text" value={content.refund_text} onChange={(v) => updateSectionContent(type, "refund_text", v)} />
                    <TextInput label="Customer heading" value={content.customer_heading} onChange={(v) => updateSectionContent(type, "customer_heading", v)} />
                    <TextInput label="Customer count" value={content.customer_count} onChange={(v) => updateSectionContent(type, "customer_count", v)} />
                    <TextInput label="Rating" value={content.rating} onChange={(v) => updateSectionContent(type, "rating", v)} />
                    <ImageListEditor
                        label="Gallery images"
                        values={content.gallery_images || []}
                        onChange={(next) => updateSectionContent(type, "gallery_images", next)}
                        onUpload={uploadImage}
                    />
                    <ImageListEditor
                        label="Customer avatars"
                        values={content.customer_avatars || []}
                        onChange={(next) => updateSectionContent(type, "customer_avatars", next)}
                        onUpload={uploadImage}
                    />
                </>
            );
        }

        if (type === "benefits") {
            return (
                <>
                    <TextInput label="Heading" value={content.heading} onChange={(v) => updateSectionContent(type, "heading", v)} />
                    <TextInput label="Subheading" value={content.subheading} onChange={(v) => updateSectionContent(type, "subheading", v)} />
                    <TextInput label="Badge" value={content.badge} onChange={(v) => updateSectionContent(type, "badge", v)} />
                    <TextInput label="Left top label" value={content.left_top_label} onChange={(v) => updateSectionContent(type, "left_top_label", v)} />
                    <TextInput label="Right top label" value={content.right_top_label} onChange={(v) => updateSectionContent(type, "right_top_label", v)} />
                    <TextInput label="Certificate text" value={content.certificate_text} onChange={(v) => updateSectionContent(type, "certificate_text", v)} />
                    <ListEditor label="Benefit items (6)" values={content.items || []} onChange={(next) => updateSectionContent(type, "items", next)} />
                </>
            );
        }

        if (type === "promo") {
            return (
                <>
                    <TextInput label="Eyebrow" value={content.eyebrow} onChange={(v) => updateSectionContent(type, "eyebrow", v)} />
                    <TextInput label="Title" value={content.title} onChange={(v) => updateSectionContent(type, "title", v)} />
                    <TextArea label="Text" value={content.text} onChange={(v) => updateSectionContent(type, "text", v)} />
                    <TextInput label="Button text" value={content.button_text} onChange={(v) => updateSectionContent(type, "button_text", v)} />
                    <Field label="Promo image">
                        <div className="lpb-single-upload">
                            {content.image ? (
                                <img src={mediaUrl(content.image)} alt="" />
                            ) : null}
                            <label className="adm-btn adm-btn-ghost lpb-upload-btn">
                                Upload image
                        <input
                                    type="file"
                                    accept="image/*"
                                    hidden
                                    onChange={async (event) => {
                                        const file = event.target.files?.[0];
                                        event.target.value = "";
                                        if (!file) return;
                                        try {
                                            const path = await uploadImage(file);
                                            updateSectionContent(type, "image", path);
                                        } catch (exception: any) {
                                            window.alert(
                                                exception?.message || "Image upload failed."
                                            );
                                        }
                                    }}
                        />
                    </label>
                </div>
                    </Field>
                </>
            );
        }

        if (type === "usage") {
            return (
                <>
                    <TextInput label="Title" value={content.title} onChange={(v) => updateSectionContent(type, "title", v)} />
                    <TextArea label="Text" value={content.text} onChange={(v) => updateSectionContent(type, "text", v)} />
                    <TextInput label="Highlight" value={content.highlight} onChange={(v) => updateSectionContent(type, "highlight", v)} />
                    <ListEditor label="Features" values={content.features || []} onChange={(next) => updateSectionContent(type, "features", next)} />
                </>
            );
        }

        if (type === "reviews") {
            return (
                <>
                    <TextInput label="Heading" value={content.heading} onChange={(v) => updateSectionContent(type, "heading", v)} />
                    <TextInput label="Subheading" value={content.subheading} onChange={(v) => updateSectionContent(type, "subheading", v)} />
                    <ImageListEditor
                        label="Screenshots"
                        values={content.screenshots || []}
                        onChange={(next) => updateSectionContent(type, "screenshots", next)}
                        onUpload={uploadImage}
                    />
                </>
            );
        }

        if (type === "order") {
            return (
                <>
                    <TextInput label="Title" value={content.title} onChange={(v) => updateSectionContent(type, "title", v)} />
                    <TextArea label="Subtitle" value={content.subtitle} onChange={(v) => updateSectionContent(type, "subtitle", v)} />
                    <TextInput label="Refund text" value={content.refund_text} onChange={(v) => updateSectionContent(type, "refund_text", v)} />
                    <TextInput label="Name label" value={content.name_label} onChange={(v) => updateSectionContent(type, "name_label", v)} />
                    <TextInput label="Phone label" value={content.phone_label} onChange={(v) => updateSectionContent(type, "phone_label", v)} />
                    <TextInput label="Email label" value={content.email_label} onChange={(v) => updateSectionContent(type, "email_label", v)} />
                    <TextInput label="Address label" value={content.address_label} onChange={(v) => updateSectionContent(type, "address_label", v)} />
                    <TextInput label="Delivery heading" value={content.delivery_heading} onChange={(v) => updateSectionContent(type, "delivery_heading", v)} />
                    <TextInput label="Payment title" value={content.payment_title} onChange={(v) => updateSectionContent(type, "payment_title", v)} />
                    <TextArea label="Payment text" value={content.payment_text} onChange={(v) => updateSectionContent(type, "payment_text", v)} />
                    <TextInput label="Button text" value={content.button_text} onChange={(v) => updateSectionContent(type, "button_text", v)} />
                    <TextInput label="Success title" value={content.success_title} onChange={(v) => updateSectionContent(type, "success_title", v)} />
                    <TextArea label="Success text" value={content.success_text} onChange={(v) => updateSectionContent(type, "success_text", v)} />
                    <label className="lpb-check">
                        <input
                            type="checkbox"
                            checked={
                                content.free_shipping === true ||
                                content.free_shipping === 1 ||
                                content.free_shipping === "1" ||
                                content.free_shipping === "true"
                            }
                            onChange={(event) =>
                                updateSectionContent(type, "free_shipping", event.target.checked)
                            }
                        />
                        Free shipping on this landing page
                    </label>
                </>
            );
        }

        return (
            <>
                <TextArea label="Heading" value={content.heading} onChange={(v) => updateSectionContent(type, "heading", v)} />
                <TextInput label="WhatsApp number" value={content.whatsapp_number} onChange={(v) => updateSectionContent(type, "whatsapp_number", v)} />
                <TextInput label="Phone number" value={content.phone_number} onChange={(v) => updateSectionContent(type, "phone_number", v)} />
                <TextInput label="Address" value={content.address} onChange={(v) => updateSectionContent(type, "address", v)} />
                <TextInput label="Copyright" value={content.copyright} onChange={(v) => updateSectionContent(type, "copyright", v)} />
            </>
        );
    };

    return (
        <AdminLayout title="Landing Pages">
            <div className="lpb-shell">
                {error ? <div className="lpb-alert">{error}</div> : null}

                {mode === "list" ? (
                    <>
                        <div className="lpb-toolbar">
                            <div>
                                <h1>Landing Pages</h1>
                                <p>
                                    Nebuloid-style product campaign pages with fixed
                                    sections and an order form.
                                </p>
                            </div>
                            <button type="button" className="adm-btn adm-btn-primary" onClick={openCreate}>
                                Create landing page
                            </button>
                        </div>

                        <div className="lpb-toolbar lpb-toolbar--secondary">
                            <input
                                value={search}
                                placeholder="Search title or slug"
                                onChange={(event) => setSearch(event.target.value)}
                            />
                            <button type="button" className="adm-btn adm-btn-ghost" onClick={loadList}>
                                Refresh
                                        </button>
                                    </div>

                        {loading ? (
                            <div className="lpb-empty">Loading…</div>
                        ) : rows.length === 0 ? (
                            <div className="lpb-empty">
                                No landing pages yet. Create one linked to a product.
                                                        </div>
                        ) : (
                            <div className="lpb-table-wrap">
                                <table className="lpb-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Product</th>
                                            <th>Template</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row) => (
                                            <tr key={row.id}>
                                                <td>
                                                    <strong>{row.title}</strong>
                                                    <div className="lpb-muted">/{row.slug}</div>
                                                </td>
                                                <td>{row.product_name || `Product #${row.product_id || "—"}`}</td>
                                                <td>{TEMPLATES[row.template] || row.template}</td>
                                                <td>
                                                    <span className={row.is_active ? "lpb-pill lpb-pill--on" : "lpb-pill"}>
                                                        {row.is_active ? "Published" : "Draft"}
                                                                    </span>
                                                </td>
                                                <td className="lpb-actions">
                                                    <button type="button" className="adm-btn adm-btn-ghost" onClick={() => openEdit(row.id)}>
                                                        Edit
                                                                </button>
                                                    <Link className="adm-btn adm-btn-ghost" to={row.url || `/p/${row.slug}`} target="_blank">
                                                        View
                                                    </Link>
                                                    <button type="button" className="adm-btn adm-btn-ghost" onClick={() => togglePublish(row)}>
                                                        {row.is_active ? "Unpublish" : "Publish"}
                                                    </button>
                                                    <button type="button" className="adm-btn adm-btn-ghost" onClick={() => removePage(row)}>
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                        </div>
                                    )}
                    </>
                ) : (
                    <>
                        <div className="lpb-toolbar">
                            <div>
                                <button type="button" className="adm-btn adm-btn-ghost" onClick={() => setMode("list")}>
                                    ← Back
                                                    </button>
                                <h1>{draft.id ? "Edit landing page" : "Create landing page"}</h1>
                                <p>Product-linked builder with hero, benefits, promo, usage, reviews, order, footer.</p>
                                    </div>
                                                <button
                                                    type="button"
                                className="adm-btn adm-btn-primary"
                                disabled={saving}
                                onClick={save}
                            >
                                {saving ? "Saving…" : "Save page"}
                                                </button>
                                        </div>

                        <div className="lpb-editor-grid">
                            <section className="lpb-card">
                                <h2>Page setup</h2>
                                <Field label="Product">
                                    <select
                                        value={draft.product_id || ""}
                                        onChange={(event) => {
                                            const productId = Number(event.target.value) || null;
                                            const product = products.find((item) => Number(item.id) === productId);
                                            setDraft((current) => ({
                                                ...current,
                                                product_id: productId,
                                                title: current.title || product?.name || current.title,
                                                sections:
                                                    current.id
                                                        ? current.sections
                                                        : sectionsForTemplate(
                                                              current.template,
                                                              product?.name || current.title
                                                          ),
                                            }));
                                        }}
                                    >
                                        <option value="">Select product</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name}
                                            </option>
                                        ))}
                                    </select>
                                </Field>
                                {selectedProduct ? (
                                    <div className="lpb-muted">Selected: {selectedProduct.name}</div>
                                ) : null}
                                <TextInput
                                    label="Title"
                                                value={draft.title}
                                    onChange={(value) => setDraft((current) => ({ ...current, title: value }))}
                                />
                                <TextInput
                                    label="Slug"
                                                value={draft.slug}
                                    placeholder="auto-from-title"
                                    onChange={(value) => setDraft((current) => ({ ...current, slug: value }))}
                                />
                                <Field label="Template">
                                    <select
                                        value={draft.template}
                                                onChange={(event) => {
                                            const nextTemplate = event.target.value as keyof typeof TEMPLATES;
                                            setDraft((current) => {
                                                const productName =
                                                    products.find(
                                                        (item) =>
                                                            Number(item.id) === Number(current.product_id)
                                                    )?.name || current.title;
                                                const shouldResetSections = !current.id;
                                                return {
                                                    ...current,
                                                    template: nextTemplate,
                                                    theme: shouldResetSections
                                                        ? defaultTheme()
                                                        : current.theme,
                                                    sections: shouldResetSections
                                                        ? sectionsForTemplate(nextTemplate, productName)
                                                        : current.sections,
                                                };
                                            });
                                        }}
                                    >
                                        {Object.entries(TEMPLATES).map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                        </Field>
                                <label className="lpb-check">
                                            <input
                                                type="checkbox"
                                        checked={draft.is_active}
                                                onChange={(event) =>
                                            setDraft((current) => ({
                                                ...current,
                                                is_active: event.target.checked,
                                            }))
                                        }
                                    />
                                    Published
                                        </label>
                                <label className="lpb-check">
                                            <input
                                                type="checkbox"
                                        checked={draft.show_footer_products}
                                                onChange={(event) =>
                                            setDraft((current) => ({
                                                ...current,
                                                show_footer_products: event.target.checked,
                                            }))
                                                }
                                            />
                                    Show footer products
                                        </label>
                                <TextInput
                                    label="SEO title"
                                    value={draft.seo.meta_title}
                                    onChange={(value) =>
                                                            setDraft((current) => ({
                                                                ...current,
                                            seo: { ...current.seo, meta_title: value },
                                        }))
                                    }
                                />
                                <TextArea
                                    label="SEO description"
                                    value={draft.seo.meta_description}
                                    onChange={(value) =>
                                                            setDraft((current) => ({
                                                                ...current,
                                            seo: { ...current.seo, meta_description: value },
                                        }))
                                    }
                                />
                            </section>

                            <section className="lpb-card">
                                <h2>Theme</h2>
                                {Object.entries(draft.theme).map(([key, value]) => (
                                    <Field label={key.replace(/_/g, " ")} key={key}>
                                            <input
                                            type="color"
                                            value={String(value || "#000000")}
                                                onChange={(event) =>
                                                setDraft((current) => ({
                                                    ...current,
                                                    theme: {
                                                        ...current.theme,
                                                        [key]: event.target.value,
                                                    },
                                                }))
                                                }
                                            />
                                        </Field>
                                ))}
                            </section>
                        </div>

                        <section className="lpb-card lpb-sections">
                            <h2>Sections</h2>
                            <div className="lpb-section-tabs">
                                {draft.sections.map((section) => (
                                        <button
                                            type="button"
                                        key={section.type}
                                        className={openSection === section.type ? "is-active" : ""}
                                        onClick={() => setOpenSection(section.type)}
                                        >
                                        {section.label}
                                        </button>
                                ))}
                            </div>

                            {draft.sections
                                .filter((section) => section.type === openSection)
                                .map((section) => (
                                    <div key={section.type} className="lpb-section-panel">
                                        <label className="lpb-check">
                                                    <input
                                                type="checkbox"
                                                checked={section.is_enabled !== false}
                                                        onChange={(event) =>
                                                    updateSectionMeta(section.type, {
                                                        is_enabled: event.target.checked,
                                                            })
                                                        }
                                                    />
                                            Enabled
                                        </label>
                                        {renderSectionEditor(section)}
                                        </div>
                                ))}
                        </section>
                                    </>
                )}
            </div>
        </AdminLayout>
    );
}
