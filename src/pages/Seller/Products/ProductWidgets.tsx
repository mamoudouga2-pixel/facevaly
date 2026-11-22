import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";

export function Toggle({ checked, onChange, label, disabled = false }) {
    return (
        <button
            type="button"
            className={`sp-toggle ${checked ? "on" : ""}`}
            disabled={disabled}
            aria-pressed={checked}
            onClick={() => onChange(!checked)}
        >
            <span className="sp-toggle-track">
                <i />
            </span>

            {label && <span className="sp-toggle-label">{label}</span>}
        </button>
    );
}

const COMMANDS = [
    ["bold", "fa-solid fa-bold", "Bold"],
    ["italic", "fa-solid fa-italic", "Italic"],
    ["underline", "fa-solid fa-underline", "Underline"],
    ["strikeThrough", "fa-solid fa-strikethrough", "Strike"],
    ["formatBlock", "fa-solid fa-quote-right", "Quote", "blockquote"],
    ["insertUnorderedList", "fa-solid fa-list-ul", "Bullet list"],
    ["insertOrderedList", "fa-solid fa-list-ol", "Numbered list"],
    ["justifyLeft", "fa-solid fa-align-left", "Align left"],
    ["justifyCenter", "fa-solid fa-align-center", "Align center"],
];

export const RichTextEditor = forwardRef(function RichTextEditor(
    {
        value = "",
        onChange,
        placeholder = "",
        minHeight = 190,
    },
    forwardedRef
) {
    const editorRef = useRef(null);
    const lastExternalValue = useRef(value);

    useImperativeHandle(forwardedRef, () => editorRef.current);

    useEffect(() => {
        if (!editorRef.current) return;

        if (value !== lastExternalValue.current) {
            editorRef.current.innerHTML = value || "";
            lastExternalValue.current = value;
        }
    }, [value]);

    const emit = () => {
        const html = editorRef.current?.innerHTML || "";
        lastExternalValue.current = html;
        onChange?.(html);
    };

    const command = (name, argument = null) => {
        editorRef.current?.focus();
        document.execCommand(name, false, argument);
        emit();
    };

    const addLink = () => {
        const url = window.prompt("Enter link URL:", "https://");
        if (!url) return;
        command("createLink", url);
    };

    const clearFormat = () => {
        command("removeFormat");
    };

    return (
        <div className="sp-rich-editor">
            <div className="sp-rich-toolbar">
                {COMMANDS.slice(0, 5).map(([name, icon, title, arg]) => (
                    <button
                        key={title}
                        type="button"
                        title={title}
                        onClick={() => command(name, arg || null)}
                    >
                        <i className={icon} />
                    </button>
                ))}

                <button
                    type="button"
                    title="Link"
                    onClick={addLink}
                >
                    <i className="fa-solid fa-link" />
                </button>

                <button
                    type="button"
                    title="Heading 1"
                    className="sp-text-tool"
                    onClick={() => command("formatBlock", "h1")}
                >
                    H1
                </button>

                <button
                    type="button"
                    title="Heading 2"
                    className="sp-text-tool"
                    onClick={() => command("formatBlock", "h2")}
                >
                    H2
                </button>

                {COMMANDS.slice(5).map(([name, icon, title, arg]) => (
                    <button
                        key={title}
                        type="button"
                        title={title}
                        onClick={() => command(name, arg || null)}
                    >
                        <i className={icon} />
                    </button>
                ))}

                <button
                    type="button"
                    title="Superscript"
                    className="sp-text-tool"
                    onClick={() => command("superscript")}
                >
                    X²
                </button>

                <button
                    type="button"
                    title="Subscript"
                    className="sp-text-tool"
                    onClick={() => command("subscript")}
                >
                    X₂
                </button>

                <button
                    type="button"
                    title="Clear formatting"
                    onClick={clearFormat}
                >
                    <i className="fa-solid fa-text-slash" />
                </button>
            </div>

            <div
                ref={editorRef}
                className="sp-rich-content"
                contentEditable
                suppressContentEditableWarning
                data-placeholder={placeholder}
                style={{ minHeight }}
                onInput={emit}
                onBlur={emit}
                dangerouslySetInnerHTML={{ __html: value || "" }}
            />
        </div>
    );
});

export function ImageSlots({
    existing = [],
    files = {},
    removedSlots = [],
    onFile,
    onRemove,
    maxSlots = 5,
}) {
    const previews = useMemo(() => {
        const next = {};

        Object.entries(files).forEach(([slot, file]) => {
            if (file instanceof File) {
                next[slot] = {
                    url: URL.createObjectURL(file),
                    isVideo: String(file.type || "").startsWith("video/"),
                };
            }
        });

        return next;
    }, [files]);

    useEffect(() => {
        return () => {
            Object.values(previews).forEach((preview) => {
                if (preview?.url) URL.revokeObjectURL(preview.url);
            });
        };
    }, [previews]);

    const existingBySlot = useMemo(() => {
        const map = {};
        existing.forEach((image) => {
            map[image.slot] = image;
        });
        return map;
    }, [existing]);

    const isVideoMedia = (file, existingItem) => {
        if (file instanceof File) {
            return String(file.type || "").startsWith("video/");
        }
        if (existingItem?.is_video || existingItem?.media_type === "video") {
            return true;
        }
        return /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(
            String(existingItem?.url || existingItem?.path || "")
        );
    };

    const acceptMediaFile = (file) => {
        if (!(file instanceof File)) return "Choose an image or video file.";
        const type = String(file.type || "").toLowerCase();
        const name = String(file.name || "").toLowerCase();
        const okMime =
            /^(image\/(jpeg|jpg|png|webp)|video\/(mp4|webm|quicktime|x-m4v))$/.test(
                type
            );
        const okExt = /\.(jpe?g|png|webp|mp4|webm|mov|m4v)$/.test(name);
        if (!okMime && !okExt) {
            return "Use JPG, PNG, WEBP, MP4, WEBM, or MOV.";
        }
        const maxBytes = 50 * 1024 * 1024;
        if (file.size > maxBytes) {
            return "Each file must be 50MB or smaller.";
        }
        return "";
    };

    const renderSlot = (slot) => {
        const localPreview = previews[String(slot)] || previews[slot];
        const current = existingBySlot[slot];
        const removed = removedSlots.includes(slot);
        const localFile = files[String(slot)] || files[slot];
        const src = localPreview?.url || (!removed ? current?.url : null);
        const isVideo = localPreview
            ? localPreview.isVideo
            : isVideoMedia(localFile, current);

        return (
            <label
                className={`sp-image-slot ${slot === 1 ? "cover" : ""} ${
                    src ? "has-image" : ""
                } ${isVideo ? "is-video" : ""}`}
                key={slot}
            >
                <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mov,.mp4,.webm,.m4v"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) {
                            event.target.value = "";
                            return;
                        }
                        const error = acceptMediaFile(file);
                        if (error) {
                            window.alert(error);
                            event.target.value = "";
                            return;
                        }
                        onFile(slot, file);
                        event.target.value = "";
                    }}
                />

                <span className="sp-slot-number">{slot}</span>

                {src ? (
                    <>
                        {isVideo ? (
                            <video
                                src={src}
                                muted
                                playsInline
                                preload="metadata"
                            />
                        ) : (
                            <img src={src} alt={`Product slot ${slot}`} />
                        )}

                        <button
                            type="button"
                            className="sp-image-remove"
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onRemove(slot);
                            }}
                        >
                            ×
                        </button>
                    </>
                ) : (
                    <div className="sp-image-empty">
                        <i className="fa-regular fa-image" />
                        {slot === 1 && <strong>Cover media</strong>}
                        <span>Image or video</span>
                        <small>JPG / PNG / WEBP / MP4</small>
                    </div>
                )}
            </label>
        );
    };

    return (
        <div className="sp-image-layout">
            {renderSlot(1)}

            <div className="sp-image-grid">
                {Array.from({ length: Math.max(0, maxSlots - 1) }, (_, index) =>
                    renderSlot(index + 2)
                )}
            </div>
        </div>
    );
}


function VariantPreview({ file, fallback, alt }) {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (!(file instanceof File)) {
            setPreview(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const src = preview || fallback || null;

    return src ? (
        <img src={src} alt={alt || "Variant"} />
    ) : (
        <i className="fa-regular fa-image" />
    );
}

export function VariantEditor({
    variants,
    attributes,
    units,
    weightUnits,
    baseSku,
    onChange,
    imageFiles,
    onImageFile,
}) {
    const addVariant = () => {
        const nextIndex = variants.length + 1;
        const next = [
            ...variants,
            {
                id: null,
                name: "",
                sku: `${baseSku || "SKU"}-V${nextIndex}`,
                barcode: "",
                unit_id: "",
                unit_value: 1,
                weight_unit_id: "",
                weight_value: "",
                regular_price: "",
                discount_type: "flat",
                discount_value: 0,
                sale_price: null,
                track_stock: true,
                stock_quantity: 0,
                stock_alert_quantity: 5,
                availability: "out_of_stock",
                image: null,
                image_path: null,
                is_default: variants.length === 0,
                is_active: true,
                attributes: {},
            },
        ];

        onChange(next);
    };

    const setVariant = (index, patch) => {
        onChange(
            variants.map((variant, variantIndex) =>
                variantIndex === index
                    ? {
                          ...variant,
                          ...patch,
                      }
                    : variant
            )
        );
    };

    const removeVariant = (index) => {
        const next = variants.filter((_, variantIndex) => variantIndex !== index);

        if (next.length && !next.some((variant) => variant.is_default)) {
            next[0] = {
                ...next[0],
                is_default: true,
            };
        }

        onChange(next);
    };

    const setDefault = (index) => {
        onChange(
            variants.map((variant, variantIndex) => ({
                ...variant,
                is_default: variantIndex === index,
            }))
        );
    };

    if (!variants.length) {
        return (
            <div className="sp-variant-empty">
                <i className="fa-solid fa-layer-group" />
                <p>No variants added yet.</p>
                <button
                    type="button"
                    className="sp-outline-btn"
                    onClick={addVariant}
                >
                    + Add First Variant
                </button>
            </div>
        );
    }

    return (
        <div className="sp-variant-list">
            {variants.map((variant, index) => {
                const localImage = imageFiles?.[index];

                return (
                    <div className="sp-variant-card" key={variant.id || `new-${index}`}>
                        <div className="sp-variant-head">
                            <div>
                                <strong>Variant {index + 1}</strong>
                                {variant.is_default && <span>Default</span>}
                            </div>

                            <div>
                                <button
                                    type="button"
                                    className="sp-small-btn"
                                    onClick={() => setDefault(index)}
                                >
                                    Set Default
                                </button>

                                <button
                                    type="button"
                                    className="sp-small-btn danger"
                                    onClick={() => removeVariant(index)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        <div className="sp-variant-fields">
                            <label>
                                <span>Variant Name</span>
                                <input
                                    value={variant.name || ""}
                                    onChange={(event) =>
                                        setVariant(index, { name: event.target.value })
                                    }
                                    placeholder="e.g. Red / Large"
                                />
                            </label>

                            <label>
                                <span>SKU *</span>
                                <input
                                    value={variant.sku || ""}
                                    onChange={(event) =>
                                        setVariant(index, { sku: event.target.value })
                                    }
                                />
                            </label>

                            <label>
                                <span>Regular Price *</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={variant.regular_price ?? ""}
                                    onChange={(event) =>
                                        setVariant(index, {
                                            regular_price: event.target.value,
                                        })
                                    }
                                />
                            </label>

                            <label className="sp-two-control">
                                <span>Discount</span>
                                <div>
                                    <select
                                        value={variant.discount_type || "flat"}
                                        onChange={(event) =>
                                            setVariant(index, {
                                                discount_type: event.target.value,
                                            })
                                        }
                                    >
                                        <option value="flat">Flat</option>
                                        <option value="percentage">Percentage</option>
                                    </select>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={variant.discount_value ?? 0}
                                        onChange={(event) =>
                                            setVariant(index, {
                                                discount_value: event.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </label>

                            <label>
                                <span>
                                    Stock Quantity <b>*</b>
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    required
                                    value={variant.stock_quantity ?? 0}
                                    onChange={(event) =>
                                        setVariant(index, {
                                            stock_quantity: Number(event.target.value || 0),
                                        })
                                    }
                                />
                            </label>

                            <label>
                                <span>Stock Alert</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={variant.stock_alert_quantity ?? 0}
                                    onChange={(event) =>
                                        setVariant(index, {
                                            stock_alert_quantity: Number(
                                                event.target.value || 0
                                            ),
                                        })
                                    }
                                />
                            </label>

                            <label>
                                <span>Unit</span>
                                <select
                                    value={variant.unit_id || ""}
                                    onChange={(event) =>
                                        setVariant(index, { unit_id: event.target.value })
                                    }
                                >
                                    <option value="">Use product unit</option>
                                    {units.map((unit) => (
                                        <option value={unit.id} key={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Weight Unit</span>
                                <select
                                    value={variant.weight_unit_id || ""}
                                    onChange={(event) =>
                                        setVariant(index, {
                                            weight_unit_id: event.target.value,
                                        })
                                    }
                                >
                                    <option value="">Use product weight unit</option>
                                    {weightUnits.map((unit) => (
                                        <option value={unit.id} key={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                <span>Weight Value</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.001"
                                    value={variant.weight_value ?? ""}
                                    onChange={(event) =>
                                        setVariant(index, {
                                            weight_value: event.target.value,
                                        })
                                    }
                                />
                            </label>

                            <label>
                                <span>Variant Image</span>
                                <div className="sp-variant-image-input">
                                    <VariantPreview
                                        file={localImage}
                                        fallback={variant.image || null}
                                        alt={variant.name || "Variant"}
                                    />

                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            if (file) onImageFile(index, file);
                                            event.target.value = "";
                                        }}
                                    />
                                </div>
                            </label>
                        </div>

                        {attributes.length > 0 && (
                            <div className="sp-variant-attributes">
                                <strong>Attributes</strong>

                                <div>
                                    {attributes.map((attribute) => (
                                        <label key={attribute.id}>
                                            <span>{attribute.name}</span>
                                            <select
                                                value={
                                                    variant.attributes?.[
                                                        String(attribute.id)
                                                    ] || ""
                                                }
                                                onChange={(event) =>
                                                    setVariant(index, {
                                                        attributes: {
                                                            ...(variant.attributes || {}),
                                                            [String(attribute.id)]:
                                                                event.target.value
                                                                    ? Number(event.target.value)
                                                                    : "",
                                                        },
                                                    })
                                                }
                                            >
                                                <option value="">Not selected</option>
                                                {attribute.values.map((value) => (
                                                    <option
                                                        value={value.id}
                                                        key={value.id}
                                                    >
                                                        {value.value}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <button
                type="button"
                className="sp-outline-btn sp-add-variant-btn"
                onClick={addVariant}
            >
                + Add Variant
            </button>
        </div>
    );
}

const CATEGORY_TONES = [
    "#ff620d",
    "#0f766e",
    "#2563eb",
    "#7c3aed",
    "#be185d",
    "#b45309",
    "#0369a1",
    "#15803d",
];

const categoryTone = (id) =>
    CATEGORY_TONES[Number(id) % CATEGORY_TONES.length];

/**
 * Multi-select category shelf picker.
 * First selected category is treated as primary.
 */
export function CategoryMultiPicker({
    categories = [],
    value = [],
    onChange,
    placeholder = "Choose categories",
}) {
    const rootRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const selectedIds = useMemo(
        () => (Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : []),
        [value]
    );

    const selectedRows = useMemo(
        () =>
            selectedIds
                .map((id) => categories.find((row) => Number(row.id) === id))
                .filter(Boolean),
        [categories, selectedIds]
    );

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        if (!needle) return categories;
        return categories.filter((row) =>
            String(row.name || "").toLowerCase().includes(needle)
        );
    }, [categories, query]);

    useEffect(() => {
        const onPointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, []);

    const toggle = (id) => {
        const numericId = Number(id);
        if (!Number.isFinite(numericId)) return;

        if (selectedIds.includes(numericId)) {
            onChange?.(selectedIds.filter((row) => row !== numericId));
            return;
        }

        onChange?.([...selectedIds, numericId]);
    };

    const clearAll = () => onChange?.([]);

    return (
        <div className="spe-cat" ref={rootRef}>
            {selectedRows.length ? (
                <div className="spe-cat-chips">
                    {selectedRows.map((row, index) => (
                        <button
                            type="button"
                            key={row.id}
                            className={`spe-cat-chip${index === 0 ? " is-primary" : ""}`}
                            onClick={() => toggle(row.id)}
                            title={
                                index === 0
                                    ? "Primary category — click to remove"
                                    : "Click to remove"
                            }
                        >
                            <span
                                className="spe-cat-mark"
                                style={{ background: categoryTone(row.id) }}
                            >
                                {String(row.name || "?")
                                    .slice(0, 1)
                                    .toUpperCase()}
                            </span>
                            <span className="spe-cat-chip-label">{row.name}</span>
                            {index === 0 ? (
                                <em>Primary</em>
                            ) : null}
                            <i className="fa-solid fa-xmark" />
                        </button>
                    ))}
                </div>
            ) : null}

            <button
                type="button"
                className={`spe-cat-trigger${open ? " is-open" : ""}`}
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                <span>
                    {selectedRows.length
                        ? `${selectedRows.length} categor${
                              selectedRows.length === 1 ? "y" : "ies"
                          } selected`
                        : placeholder}
                </span>
                <i className="fa-solid fa-chevron-down" />
            </button>

            {open ? (
                <div className="spe-cat-panel">
                    <div className="spe-cat-search">
                        <i className="fa-solid fa-magnifying-glass" />
                        <input
                            type="text"
                            value={query}
                            placeholder="Search shelves"
                            autoFocus
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        {selectedIds.length ? (
                            <button
                                type="button"
                                className="spe-cat-clear"
                                onClick={clearAll}
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>

                    <div className="spe-cat-list">
                        {filtered.length ? (
                            filtered.map((category) => {
                                const active = selectedIds.includes(
                                    Number(category.id)
                                );
                                const primary =
                                    active
                                    && selectedIds[0] === Number(category.id);

                                return (
                                    <button
                                        type="button"
                                        key={category.id}
                                        className={`spe-cat-option${
                                            active ? " is-active" : ""
                                        }${primary ? " is-primary" : ""}`}
                                        onClick={() => toggle(category.id)}
                                    >
                                        <span
                                            className="spe-cat-mark"
                                            style={{
                                                background: categoryTone(
                                                    category.id
                                                ),
                                            }}
                                        >
                                            {String(category.name || "?")
                                                .slice(0, 1)
                                                .toUpperCase()}
                                        </span>
                                        <span className="spe-cat-option-copy">
                                            <strong>{category.name}</strong>
                                            {primary ? (
                                                <em>Saved as primary</em>
                                            ) : active ? (
                                                <em>Selected</em>
                                            ) : null}
                                        </span>
                                        <i
                                            className={`fa-solid ${
                                                active
                                                    ? "fa-circle-check"
                                                    : "fa-circle"
                                            }`}
                                        />
                                    </button>
                                );
                            })
                        ) : (
                            <p className="spe-cat-empty">
                                No categories match that search.
                            </p>
                        )}
                    </div>
                </div>
            ) : null}

            <p className="spe-cat-hint">
                First selected category is saved as the primary shelf.
            </p>
        </div>
    );
}
