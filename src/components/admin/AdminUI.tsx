import React from "react";


export function AdminPageHeader({
    eyebrow = "FACEVALY ADMIN",
    title,
    description,
    actions,
}) {
    return (
        <header className="adm-page-header">
            <div>
                <span className="adm-eyebrow">
                    {eyebrow}
                </span>

                <h1>{title}</h1>

                {description && (
                    <p>{description}</p>
                )}
            </div>

            {actions && (
                <div className="adm-page-actions">
                    {actions}
                </div>
            )}
        </header>
    );
}


export function AdminCard({
    title,
    description,
    actions,
    children,
    className = "",
}) {
    return (
        <section className={`adm-card ${className}`}>
            {(title || actions) && (
                <div className="adm-card-head">
                    <div>
                        {title && <h2>{title}</h2>}
                        {description && <p>{description}</p>}
                    </div>

                    {actions && (
                        <div className="adm-card-actions">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            <div className="adm-card-body">
                {children}
            </div>
        </section>
    );
}


export function AdminMetric({
    icon,
    label,
    value,
    sub = "",
    tone = "orange",
}) {
    return (
        <div className={`adm-metric adm-metric-${tone}`}>
            <span>
                <i className={icon} />
            </span>

            <div>
                <small>{label}</small>
                <strong>{value}</strong>
                {sub && <em>{sub}</em>}
            </div>
        </div>
    );
}


export function AdminBadge({
    value = "",
}) {
    const normalized =
        String(value || "").toLowerCase();

    const success = [
        "active",
        "approved",
        "completed",
        "delivered",
        "paid",
        "verified",
        "connected",
        "published",
    ].includes(normalized);

    const danger = [
        "rejected",
        "cancelled",
        "failed",
        "blocked",
        "suspended",
        "deleted",
        "out_of_stock",
    ].includes(normalized);

    const warning = [
        "pending",
        "processing",
        "new_order",
        "requested",
        "approved_pending",
        "unpaid",
        "partial",
        "waiting_support",
        "waiting_seller",
    ].includes(normalized);

    const tone =
        success
            ? "success"
            : danger
                ? "danger"
                : warning
                    ? "warning"
                    : "neutral";

    return (
        <span className={`adm-badge adm-badge-${tone}`}>
            {titleCase(value)}
        </span>
    );
}


export function AdminModal({
    open,
    title,
    children,
    onClose,
    size = "medium",
    className = "",
    bodyClassName = "",
}) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="adm-modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose?.();
                }
            }}
        >
            <div
                className={[
                    "adm-modal",
                    `adm-modal-${size}`,
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                <div className="adm-modal-head">
                    <h3>{title}</h3>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div
                    className={[
                        "adm-modal-body",
                        bodyClassName,
                    ]
                        .filter(Boolean)
                        .join(" ")}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}


export function AdminLoader({
    text = "Loading...",
}) {
    return (
        <div className="adm-loader">
            <span className="adm-spinner" />
            <strong>{text}</strong>
        </div>
    );
}


export function AdminEmpty({
    icon = "fa-regular fa-folder-open",
    title = "No records found",
    description = "",
}) {
    return (
        <div className="adm-empty">
            <i className={icon} />
            <strong>{title}</strong>
            {description && <span>{description}</span>}
        </div>
    );
}


export function AdminToast({
    toast,
}) {
    if (!toast) {
        return null;
    }

    return (
        <div className={`adm-toast ${toast.type || "success"}`}>
            {toast.message}
        </div>
    );
}


export function firstError(
    error,
    fallback = "Something went wrong."
) {
    const errors =
        error?.response?.data?.errors;

    if (errors) {
        const key =
            Object.keys(errors)[0];

        if (
            key
            && errors[key]?.[0]
        ) {
            return errors[key][0];
        }
    }

    return (
        error?.response?.data?.message
        || error?.message
        || fallback
    );
}


export function titleCase(
    value = ""
) {
    return String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}


export function formatDate(
    value
) {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat(
            "en-BD",
            {
                timeZone: "Asia/Dhaka",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        ).format(new Date(value));
    } catch {
        return value;
    }
}


export function money(
    value,
    currency = "BDT"
) {
    try {
        return new Intl.NumberFormat(
            "en-BD",
            {
                style: "currency",
                currency,
                maximumFractionDigits: 2,
            }
        ).format(Number(value || 0));
    } catch {
        return `BDT ${Number(value || 0).toLocaleString("en-BD")}`;
    }
}


export function AdminPagination({
    meta = {},
    onPageChange,
    perPage,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
}) {
    const currentPage = Number(meta.current_page || 1);
    const lastPage = Number(meta.last_page || 1);
    const total = Number(meta.total || 0);
    const from = Number(meta.from || 0);
    const to = Number(meta.to || 0);

    if (total <= 0 && lastPage <= 1) {
        return null;
    }

    return (
        <footer className="adm-pagination">
            <div className="adm-pagination-meta">
                {typeof onPerPageChange === "function" && (
                    <>
                        <span>Rows</span>
                        <select
                            className="adm-select"
                            value={perPage || 25}
                            onChange={(event) =>
                                onPerPageChange(Number(event.target.value))
                            }
                        >
                            {perPageOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </>
                )}
                <span>
                    {from || 0}–{to || 0} of {total || 0}
                </span>
            </div>

            <div className="adm-pagination-controls">
                <button
                    type="button"
                    className="adm-btn"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <i className="fa-solid fa-chevron-left" />
                </button>

                <strong>{currentPage}</strong>
                <span>/ {lastPage}</span>

                <button
                    type="button"
                    className="adm-btn"
                    disabled={currentPage >= lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <i className="fa-solid fa-chevron-right" />
                </button>
            </div>
        </footer>
    );
}
