import React from "react";


/* =========================================================
   TEXT HELPERS
========================================================= */

export const titleCase = (
    value = ""
) =>
    String(
        value || ""
    )
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            (
                character
            ) =>
                character.toUpperCase()
        );


export const money = (
    value,
    currency = "BDT"
) => {

    const amount =
        Number(
            value || 0
        );


    try {

        return new Intl.NumberFormat(
            "en-BD",
            {
                style:
                    "currency",

                currency,

                minimumFractionDigits:
                    0,

                maximumFractionDigits:
                    2,
            }
        )
            .format(
                amount
            );

    } catch {

        return `৳${amount.toLocaleString(
            "en-BD",
            {
                maximumFractionDigits:
                    2,
            }
        )}`;

    }

};


export const formatDate = (
    value,
    dateOnly = false
) => {

    if (
        !value
    ) {

        return "—";

    }


    try {

        return new Intl.DateTimeFormat(
            "en-BD",
            dateOnly
                ? {
                    timeZone:
                        "Asia/Dhaka",

                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric",
                }
                : {
                    timeZone:
                        "Asia/Dhaka",

                    day:
                        "2-digit",

                    month:
                        "short",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",
                }
        )
            .format(
                new Date(
                    value
                )
            );

    } catch {

        return String(
            value
        );

    }

};


export const firstError = (
    error,
    fallback = "Request failed."
) => {

    if (
        error?.data?.errors
    ) {

        const first =
            Object.values(
                error.data.errors
            )
                .flat()
                .find(
                    Boolean
                );


        if (
            first
        ) {

            return String(
                first
            );

        }

    }


    return (
        error?.message ||
        fallback
    );

};


/* =========================================================
   PAGE HEADER
========================================================= */

export function SellerSuiteHeader({
    eyebrow = "SELLER CENTER",
    title,
    description = "",
    actions = null,
}) {

    return (

        <div className="ss-page-header">

            <div>

                <span>
                    {eyebrow}
                </span>

                <h1>
                    {title}
                </h1>

                {description && (

                    <p>
                        {description}
                    </p>

                )}

            </div>


            {actions && (

                <div className="ss-page-actions">
                    {actions}
                </div>

            )}

        </div>

    );

}


/* =========================================================
   STAT
========================================================= */

export function SellerSuiteStat({
    icon,
    label,
    value,
    subtext = "",
    tone = "orange",
}) {

    return (

        <article className={`ss-stat ss-stat-${tone}`}>

            <div className="ss-stat-icon">

                <i className={icon} />

            </div>


            <div>

                <span>
                    {label}
                </span>

                <strong>
                    {value}
                </strong>

                {subtext && (

                    <small>
                        {subtext}
                    </small>

                )}

            </div>

        </article>

    );

}


/* =========================================================
   CARD
========================================================= */

export function SellerSuiteCard({
    title = "",
    description = "",
    actions = null,
    children,
    className = "",
}) {

    return (

        <section className={`ss-card ${className}`}>

            {(title ||
                description ||
                actions) && (

                <div className="ss-card-head">

                    <div>

                        {title && (

                            <h2>
                                {title}
                            </h2>

                        )}

                        {description && (

                            <p>
                                {description}
                            </p>

                        )}

                    </div>


                    {actions && (

                        <div className="ss-card-actions">
                            {actions}
                        </div>

                    )}

                </div>

            )}


            <div className="ss-card-body">
                {children}
            </div>

        </section>

    );

}


/* =========================================================
   LOADER
========================================================= */

export function SellerSuiteLoader({
    text = "Loading...",
}) {

    return (

        <div className="ss-loader">

            <i className="fa-solid fa-spinner fa-spin" />

            <span>
                {text}
            </span>

        </div>

    );

}


/* =========================================================
   EMPTY
========================================================= */

export function SellerSuiteEmpty({
    icon = "fa-regular fa-folder-open",
    title = "Nothing here yet",
    description = "",
}) {

    return (

        <div className="ss-empty">

            <i className={icon} />

            <strong>
                {title}
            </strong>

            {description && (

                <p>
                    {description}
                </p>

            )}

        </div>

    );

}


/* =========================================================
   ALERT
========================================================= */

export function SellerSuiteAlert({
    type = "info",
    children,
}) {

    const icon =
        type === "error"
            ? "fa-solid fa-circle-exclamation"
            : type === "success"
                ? "fa-solid fa-circle-check"
                : type === "warning"
                    ? "fa-solid fa-triangle-exclamation"
                    : "fa-solid fa-circle-info";


    return (

        <div className={`ss-alert ss-alert-${type}`}>

            <i className={icon} />

            <div>
                {children}
            </div>

        </div>

    );

}


/* =========================================================
   BADGE
========================================================= */

export function SellerSuiteBadge({
    value = "",
}) {

    const normalized =
        String(
            value || ""
        )
            .toLowerCase();


    const positive =
        [
            "active",
            "approved",
            "paid",
            "completed",
            "delivered",
            "verified",
            "success",
            "received",
        ]
            .includes(
                normalized
            );


    const negative =
        [
            "rejected",
            "failed",
            "cancelled",
            "canceled",
            "suspended",
            "blocked",
            "deleted",
            "out_of_stock",
        ]
            .includes(
                normalized
            );


    const warning =
        [
            "pending",
            "requested",
            "processing",
            "approved_pending",
            "unpaid",
            "partial",
            "low_stock",
            "pending_approval",
        ]
            .includes(
                normalized
            );


    const tone =
        positive
            ? "success"
            : negative
                ? "danger"
                : warning
                    ? "warning"
                    : "neutral";


    return (

        <span className={`ss-badge ss-badge-${tone}`}>
            {titleCase(value)}
        </span>

    );

}


/* =========================================================
   MODAL
========================================================= */

export function SellerSuiteModal({
    open,
    title,
    children,
    onClose,
    size = "medium",
}) {

    if (
        !open
    ) {

        return null;

    }


    return (

        <div
            className="ss-modal-backdrop"

            onMouseDown={(
                event
            ) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    onClose?.();

                }

            }}
        >

            <div className={`ss-modal ss-modal-${size}`}>

                <div className="ss-modal-head">

                    <h3>
                        {title}
                    </h3>


                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                    >

                        <i className="fa-solid fa-xmark" />

                    </button>

                </div>


                <div className="ss-modal-body">
                    {children}
                </div>

            </div>

        </div>

    );

}


/* =========================================================
   TOAST
========================================================= */

export function SellerSuiteToast({
    toast,
}) {

    if (
        !toast
    ) {

        return null;

    }


    return (

        <div className={`ss-toast ${toast.type || "success"}`}>
            {toast.message}
        </div>

    );

}
