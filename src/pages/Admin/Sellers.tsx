import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import AdminLayout
    from "./Layout";

import adminSellerService
    from "../../services/adminSellerService";

import {
    mediaUrl,
} from "../../config/api";

import "./admin-sellers.css";


/* =========================================================
   HELPERS
========================================================= */

const money = (
    value
) =>
    Number(
        value || 0
    ).toLocaleString(
        "en-BD",
        {
            maximumFractionDigits:
                2,
        }
    );


const formatDate = (
    value
) => {
    if (!value) {
        return "—";
    }

    try {
        return new Intl.DateTimeFormat(
            "en-BD",
            {
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
        ).format(
            new Date(value)
        );
    } catch {
        return value;
    }
};


const titleCase = (
    value = ""
) =>
    String(value)
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            (char) =>
                char.toUpperCase()
        );


const phoneOnly = (
    value
) => {
    let phone =
        String(
            value || ""
        )
            .replace(
                /\D+/g,
                ""
            );

    if (
        phone.startsWith(
            "880"
        )
    ) {
        phone =
            `0${phone.slice(3)}`;
    }

    if (
        phone.startsWith(
            "88"
        )
        &&
        phone.length === 13
    ) {
        phone =
            phone.slice(2);
    }

    return phone;
};


const whatsappNumber = (
    value
) => {
    const local =
        phoneOnly(
            value
        );

    if (!local) {
        return "";
    }

    return local.startsWith(
        "0"
    )
        ? `88${local}`
        : local;
};


const firstError = (
    error
) => {
    const errors =
        error?.response
            ?.data
            ?.errors;

    if (
        errors
        &&
        typeof errors ===
            "object"
    ) {
        const first =
            Object.values(
                errors
            )
                .flat()
                .find(Boolean);

        if (first) {
            return String(first);
        }
    }

    return (
        error?.response
            ?.data
            ?.message
        ||
        error?.message
        ||
        "Something went wrong."
    );
};


const ACTION_LABELS = {
    approve:
        "Approve Seller",

    activate:
        "Activate Seller",

    pending:
        "Move to Pending",

    suspend:
        "Suspend Seller",

    reject:
        "Reject Seller",

    feature:
        "Feature Seller",

    unfeature:
        "Remove Featured",

    delete:
        "Delete Seller",

    force_delete:
        "Permanently Delete Seller",

    restore:
        "Restore Seller",
};


/* =========================================================
   DOCUMENT PREVIEW + FULLSCREEN
========================================================= */

function DocumentPreview({
    document,
    onNotify,
}) {
    const [
        src,
        setSrc,
    ] = useState("");

    const [
        error,
        setError,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        fullscreen,
        setFullscreen,
    ] = useState(false);

    const [
        downloading,
        setDownloading,
    ] = useState(false);

    useEffect(() => {
        let active = true;
        let objectUrl = "";

        const load = async () => {
            setLoading(true);
            setError("");
            setSrc("");

            if (!document?.id) {
                setLoading(false);
                setError("No document.");
                return;
            }

            try {
                if (document.is_image === false) {
                    setLoading(false);
                    setError("file");
                    return;
                }

                const blob =
                    await adminSellerService.fetchDocumentBlob(
                        document.id
                    );

                if (!active) {
                    return;
                }

                objectUrl = URL.createObjectURL(blob);
                setSrc(objectUrl);
            } catch (exception) {
                if (!active) {
                    return;
                }

                setError(
                    exception?.response?.status === 404
                        ? "missing"
                        : "failed"
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        load();

        return () => {
            active = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [
        document?.id,
        document?.is_image,
        document?.file_path,
    ]);

    useEffect(() => {
        if (!fullscreen) {
            return undefined;
        }

        const onKey = (event) => {
            if (event.key === "Escape") {
                setFullscreen(false);
            }
        };

        window.addEventListener("keydown", onKey);
        const previous = window.document.body.style.overflow;
        window.document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKey);
            window.document.body.style.overflow = previous;
        };
    }, [fullscreen]);

    const download = async () => {
        if (downloading) {
            return;
        }

        setDownloading(true);

        try {
            if (src) {
                const filename =
                    String(document.file_path || "")
                        .split("/")
                        .pop()
                    || `${document.type || "document"}-${document.id}`;
                const link = window.document.createElement("a");
                link.href = src;
                link.download = filename;
                window.document.body.appendChild(link);
                link.click();
                link.remove();
            } else {
                await adminSellerService.downloadDocumentFile(document);
            }

            onNotify?.("Download started.");
        } catch (exception) {
            onNotify?.(
                exception?.message || "Unable to download document.",
                "error"
            );
        } finally {
            setDownloading(false);
        }
    };

    const label = titleCase(document.type);

    return (
        <>
            <div className="asm-doc-media">
                {loading ? (
                    <div className="asm-doc-preview is-loading">
                        <span className="adm-spinner" />
                    </div>
                ) : src ? (
                    <button
                        type="button"
                        className="asm-doc-preview is-ready"
                        onClick={() => setFullscreen(true)}
                        title="View full screen"
                    >
                        <img
                            src={src}
                            alt={label}
                        />
                        <span className="asm-doc-preview-hint">
                            <i className="fa-solid fa-expand" />
                            Full screen
                        </span>
                    </button>
                ) : (
                    <div className="asm-doc-preview is-empty">
                        <i className="fa-solid fa-id-card" />
                        <span>
                            {error === "missing"
                                ? "File missing"
                                : error === "file"
                                  ? "Not an image"
                                  : "Preview unavailable"}
                        </span>
                    </div>
                )}

                <div className="asm-doc-media-actions">
                    <button
                        type="button"
                        className="asm-btn asm-btn-light"
                        disabled={!src}
                        onClick={() => setFullscreen(true)}
                    >
                        <i className="fa-solid fa-expand" />
                        View
                    </button>

                    <button
                        type="button"
                        className="asm-btn asm-btn-light"
                        disabled={(!src && Boolean(error)) || downloading}
                        onClick={download}
                    >
                        <i className="fa-solid fa-download" />
                        {downloading ? "Saving…" : "Download"}
                    </button>
                </div>
            </div>

            {fullscreen && src ? (
                <div
                    className="asm-doc-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${label} full screen`}
                    onClick={() => setFullscreen(false)}
                >
                    <div
                        className="asm-doc-lightbox-panel"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <header className="asm-doc-lightbox-bar">
                            <strong>{label}</strong>

                            <div className="asm-doc-lightbox-actions">
                                <button
                                    type="button"
                                    className="asm-btn asm-btn-light"
                                    disabled={downloading}
                                    onClick={download}
                                >
                                    <i className="fa-solid fa-download" />
                                    Download
                                </button>

                                <button
                                    type="button"
                                    className="asm-btn asm-btn-light"
                                    onClick={() => setFullscreen(false)}
                                    aria-label="Close"
                                >
                                    <i className="fa-solid fa-xmark" />
                                    Close
                                </button>
                            </div>
                        </header>

                        <div className="asm-doc-lightbox-stage">
                            <img
                                src={src}
                                alt={label}
                            />
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
    value,
}) {
    return (
        <span
            className={
                `asm-status asm-status-${value || "unknown"}`
            }
        >
            <i />

            {titleCase(
                value || "unknown"
            )}
        </span>
    );
}


/* =========================================================
   MODAL
========================================================= */

function Modal({
    open,
    title,
    children,
    onClose,
    size = "medium",
}) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="asm-modal-backdrop"
            onMouseDown={
                (event) => {
                    if (
                        event.target ===
                        event.currentTarget
                    ) {
                        onClose();
                    }
                }
            }
        >
            <section
                className={
                    `asm-modal asm-modal-${size}`
                }
            >
                <header className="asm-modal-head">

                    <div>
                        <span>
                            FACEVALY ADMIN
                        </span>

                        <h3>
                            {title}
                        </h3>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>

                </header>

                <div className="asm-modal-body">
                    {children}
                </div>
            </section>
        </div>
    );
}


/* =========================================================
   MAIN PAGE
========================================================= */

export default function AdminSellers() {
    const params =
        new URLSearchParams(
            window.location.search
        );


    const [
        filters,
        setFilters,
    ] =
        useState({
            q: "",
            status:
                params.get(
                    "status"
                )
                || "",
            featured: "",
            per_page: 25,
            page: 1,
        });


    const [
        searchInput,
        setSearchInput,
    ] =
        useState("");


    const [
        rows,
        setRows,
    ] =
        useState([]);


    const [
        summary,
        setSummary,
    ] =
        useState({});


    const [
        meta,
        setMeta,
    ] =
        useState({
            current_page: 1,
            last_page: 1,
            total: 0,
        });


    const [
        loading,
        setLoading,
    ] =
        useState(true);


    const [
        selectedIds,
        setSelectedIds,
    ] =
        useState([]);


    const [
        toast,
        setToast,
    ] =
        useState(null);


    /* =====================================================
       DETAILS
    ===================================================== */

    const [
        detail,
        setDetail,
    ] =
        useState(null);


    const [
        detailOpen,
        setDetailOpen,
    ] =
        useState(false);


    const [
        detailLoading,
        setDetailLoading,
    ] =
        useState(false);


    /* =====================================================
       COMMERCIAL
    ===================================================== */

    const [
        commercial,
        setCommercial,
    ] =
        useState({
            commission_rate: "",
            minimum_payout_amount: 0,
            is_featured: false,
        });


    const [
        commercialSaving,
        setCommercialSaving,
    ] =
        useState(false);


    /* =====================================================
       ACTION DIALOG
    ===================================================== */

    const [
        actionDialog,
        setActionDialog,
    ] =
        useState({
            open: false,
            mode: "single",
            action: "",
            vendor: null,
            reason: "",
            busy: false,
        });


    /* =====================================================
       BULK
    ===================================================== */

    const [
        bulkAction,
        setBulkAction,
    ] =
        useState("");


    /* =====================================================
       DOCUMENT REJECTION
    ===================================================== */

    const [
        docDialog,
        setDocDialog,
    ] =
        useState({
            open: false,
            document: null,
            reason: "",
            busy: false,
        });


    /* =====================================================
       TOAST
    ===================================================== */

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
                    3200
                );
            },
            []
        );


    /* =====================================================
       LOAD
    ===================================================== */

    const load =
        useCallback(
            async () => {
                setLoading(
                    true
                );

                try {
                    const response =
                        await adminSellerService.list(
                            filters
                        );

                    setRows(
                        response.data
                        || []
                    );

                    setSummary(
                        response.summary
                        || {}
                    );

                    setMeta(
                        response.meta
                        || {}
                    );

                    setSelectedIds([]);
                } catch (
                    error
                ) {
                    notify(
                        firstError(
                            error
                        ),
                        "error"
                    );
                } finally {
                    setLoading(
                        false
                    );
                }
            },
            [
                filters,
                notify,
            ]
        );


    useEffect(
        () => {
            load();
        },
        [
            load,
        ]
    );


    /* =====================================================
       SEARCH
    ===================================================== */

    const submitSearch =
        (
            event
        ) => {
            event.preventDefault();

            setFilters(
                (
                    current
                ) => ({
                    ...current,

                    q:
                        searchInput.trim(),

                    page:
                        1,
                })
            );
        };


    /* =====================================================
       FILTER
    ===================================================== */

    const updateFilter =
        (
            name,
            value
        ) => {
            setFilters(
                (
                    current
                ) => ({
                    ...current,

                    [name]:
                        value,

                    page:
                        name ===
                        "page"
                            ? Number(
                                value
                            )
                            : 1,
                })
            );
        };


    /* =====================================================
       SELECTION
    ===================================================== */

    const allSelected =
        rows.length > 0
        &&
        rows.every(
            (row) =>
                selectedIds.includes(
                    row.id
                )
        );


    const toggleAll =
        () => {
            if (
                allSelected
            ) {
                setSelectedIds([]);
            } else {
                setSelectedIds(
                    rows.map(
                        (row) =>
                            row.id
                    )
                );
            }
        };


    const toggleOne =
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
                                value !== id
                        )
                        : [
                            ...current,
                            id,
                        ]
            );
        };


    /* =====================================================
       DETAIL
    ===================================================== */

    const openSeller =
        async (
            id
        ) => {
            setDetailOpen(
                true
            );

            setDetailLoading(
                true
            );

            setDetail(
                null
            );

            try {
                const response =
                    await adminSellerService.show(
                        id
                    );

                const seller =
                    response.data;

                setDetail(
                    seller
                );

                setCommercial({
                    commission_rate:
                        seller
                            .commission_rate
                        ?? "",

                    minimum_payout_amount:
                        seller
                            .minimum_payout_amount
                        ?? 0,

                    is_featured:
                        Boolean(
                            seller
                                .is_featured
                        ),
                });
            } catch (
                error
            ) {
                notify(
                    firstError(
                        error
                    ),
                    "error"
                );

                setDetailOpen(
                    false
                );
            } finally {
                setDetailLoading(
                    false
                );
            }
        };


    const refreshDetail =
        async () => {
            if (
                !detail?.id
            ) {
                return;
            }

            const response =
                await adminSellerService.show(
                    detail.id
                );

            const seller =
                response.data;

            setDetail(
                seller
            );

            setCommercial({
                commission_rate:
                    seller
                        .commission_rate
                    ?? "",

                minimum_payout_amount:
                    seller
                        .minimum_payout_amount
                    ?? 0,

                is_featured:
                    Boolean(
                        seller
                            .is_featured
                    ),
            });
        };


    /* =====================================================
       SINGLE ACTION
    ===================================================== */

    const openSingleAction =
        (
            vendor,
            action
        ) => {
            setActionDialog({
                open: true,
                mode: "single",
                action,
                vendor,
                reason: "",
                busy: false,
            });
        };


    /* =====================================================
       QUICK STATUS
    ===================================================== */

    const quickStatus =
        (
            row,
            nextStatus
        ) => {
            if (
                nextStatus ===
                row.status
            ) {
                return;
            }

            let action =
                nextStatus;

            if (
                nextStatus ===
                "active"
            ) {
                action =
                    row.status ===
                        "pending"
                        ? "approve"
                        : "activate";
            }

            openSingleAction(
                row,
                action
            );
        };


    /* =====================================================
       BULK ACTION DIALOG
    ===================================================== */

    const openBulkAction =
        () => {
            if (
                !selectedIds.length
            ) {
                notify(
                    "Select at least one seller.",
                    "error"
                );

                return;
            }

            if (
                !bulkAction
            ) {
                notify(
                    "Choose a bulk action.",
                    "error"
                );

                return;
            }

            setActionDialog({
                open: true,
                mode: "bulk",
                action:
                    bulkAction,
                vendor: null,
                reason: "",
                busy: false,
            });
        };


    /* =====================================================
       EXECUTE ACTION
    ===================================================== */

    const executeAction =
        async () => {
            const {
                mode,
                action,
                vendor,
                reason,
            } =
                actionDialog;


            if (
                [
                    "reject",
                    "suspend",
                ].includes(
                    action
                )
                &&
                !reason.trim()
            ) {
                notify(
                    "Enter a reason first.",
                    "error"
                );

                return;
            }


            setActionDialog(
                (
                    current
                ) => ({
                    ...current,
                    busy: true,
                })
            );


            try {
                let response;


                if (
                    mode ===
                    "bulk"
                ) {
                    response =
                        await adminSellerService.bulk({
                            vendor_ids:
                                selectedIds,

                            action,

                            reason:
                                reason.trim()
                                || null,
                        });
                } else {
                    const id =
                        vendor.id;


                    if (
                        action ===
                        "delete"
                    ) {
                        response =
                            await adminSellerService.destroy(
                                id
                            );
                    } else if (
                        action ===
                        "force_delete"
                    ) {
                        response =
                            await adminSellerService.forceDestroy(
                                id
                            );
                    } else if (
                        action ===
                        "restore"
                    ) {
                        response =
                            await adminSellerService.restore(
                                id
                            );
                    } else if (
                        [
                            "feature",
                            "unfeature",
                        ].includes(
                            action
                        )
                    ) {
                        response =
                            await adminSellerService.bulk({
                                vendor_ids: [
                                    id,
                                ],

                                action,
                            });
                    } else {
                        response =
                            await adminSellerService.status(
                                id,
                                {
                                    action,

                                    reason:
                                        reason.trim()
                                        || null,
                                }
                            );
                    }
                }


                notify(
                    response?.message
                    ||
                    "Seller updated successfully."
                );


                setActionDialog({
                    open: false,
                    mode: "single",
                    action: "",
                    vendor: null,
                    reason: "",
                    busy: false,
                });


                setBulkAction("");


                await load();


                if (
                    mode ===
                        "single"
                    &&
                    detail?.id ===
                        vendor?.id
                ) {
                    if (
                        [
                            "delete",
                            "force_delete",
                        ].includes(
                            action
                        )
                    ) {
                        setDetailOpen(
                            false
                        );
                        setDetail(null);
                    } else {
                        await refreshDetail();
                    }
                }
            } catch (
                error
            ) {
                notify(
                    firstError(
                        error
                    ),
                    "error"
                );

                setActionDialog(
                    (
                        current
                    ) => ({
                        ...current,
                        busy: false,
                    })
                );
            }
        };


    /* =====================================================
       COMMERCIAL SAVE
    ===================================================== */

    const saveCommercial =
        async () => {
            if (
                !detail?.id
            ) {
                return;
            }

            setCommercialSaving(
                true
            );

            try {
                const response =
                    await adminSellerService.commercial(
                        detail.id,
                        {
                            commission_rate:
                                commercial
                                    .commission_rate ===
                                ""
                                    ? null
                                    : Number(
                                        commercial
                                            .commission_rate
                                    ),

                            minimum_payout_amount:
                                Number(
                                    commercial
                                        .minimum_payout_amount
                                    ),

                            is_featured:
                                Boolean(
                                    commercial
                                        .is_featured
                                ),
                        }
                    );

                notify(
                    response.message
                );

                await Promise.all([
                    load(),
                    refreshDetail(),
                ]);
            } catch (
                error
            ) {
                notify(
                    firstError(
                        error
                    ),
                    "error"
                );
            } finally {
                setCommercialSaving(
                    false
                );
            }
        };


    /* =====================================================
       DOCUMENT VERIFY
    ===================================================== */

    const verifyDocument =
        async (
            document,
            status
        ) => {
            if (
                status ===
                "rejected"
            ) {
                setDocDialog({
                    open: true,
                    document,
                    reason: "",
                    busy: false,
                });

                return;
            }

            try {
                const response =
                    await adminSellerService.verifyDocument(
                        document.id,
                        {
                            status,
                            reason: null,
                        }
                    );

                notify(
                    response.message
                );

                await refreshDetail();
            } catch (
                error
            ) {
                notify(
                    firstError(
                        error
                    ),
                    "error"
                );
            }
        };


    const submitDocumentReject =
        async () => {
            if (
                !docDialog
                    .reason
                    .trim()
            ) {
                notify(
                    "Enter document rejection reason.",
                    "error"
                );

                return;
            }

            setDocDialog(
                (
                    current
                ) => ({
                    ...current,
                    busy: true,
                })
            );

            try {
                const response =
                    await adminSellerService.verifyDocument(
                        docDialog
                            .document
                            .id,
                        {
                            status:
                                "rejected",

                            reason:
                                docDialog
                                    .reason
                                    .trim(),
                        }
                    );

                notify(
                    response.message
                );

                setDocDialog({
                    open: false,
                    document: null,
                    reason: "",
                    busy: false,
                });

                await refreshDetail();
            } catch (
                error
            ) {
                notify(
                    firstError(
                        error
                    ),
                    "error"
                );

                setDocDialog(
                    (
                        current
                    ) => ({
                        ...current,
                        busy: false,
                    })
                );
            }
        };


    /* =====================================================
       BANK VERIFY
    ===================================================== */

    const verifyBank =
        async (
            bank
        ) => {
            try {
                const response =
                    await adminSellerService.verifyBank(
                        bank.id,
                        !bank.is_verified
                    );

                notify(
                    response.message
                );

                await refreshDetail();
            } catch (
                error
            ) {
                notify(
                    firstError(
                        error
                    ),
                    "error"
                );
            }
        };


    /* =====================================================
       TABS
    ===================================================== */

    const tabs =
        useMemo(
            () => [
                [
                    "",
                    "All",
                    summary.total
                    || 0,
                ],

                [
                    "pending",
                    "Pending",
                    summary.pending
                    || 0,
                ],

                [
                    "active",
                    "Active",
                    summary.active
                    || 0,
                ],

                [
                    "suspended",
                    "Suspended",
                    summary.suspended
                    || 0,
                ],

                [
                    "rejected",
                    "Rejected",
                    summary.rejected
                    || 0,
                ],

                [
                    "deleted",
                    "Deleted",
                    summary.deleted
                    || 0,
                ],
            ],
            [
                summary,
            ]
        );


    /* =====================================================
       UI
    ===================================================== */

    return (
        <AdminLayout>

            <div className="asm-page">

                {/* ========================================
                    HEADER
                ======================================== */}

                <header className="asm-page-head">

                    <div>
                        <span className="asm-eyebrow">
                            MARKETPLACE
                        </span>

                        <h1>
                            Seller Management
                        </h1>

                        <p>
                            Manage seller approvals, shop status, KYC, payout accounts,
                            commercial settings and marketplace access.
                        </p>
                    </div>


                    <button
                        type="button"
                        className="asm-btn asm-btn-light"
                        onClick={
                            load
                        }
                    >
                        <i className="fa-solid fa-rotate-right" />

                        Refresh
                    </button>

                </header>


                {/* ========================================
                    SUMMARY
                ======================================== */}

                <section className="asm-summary-grid">

                    <article>
                        <span className="asm-summary-icon blue">
                            <i className="fa-solid fa-store" />
                        </span>

                        <div>
                            <small>
                                Total Sellers
                            </small>

                            <strong>
                                {summary.total || 0}
                            </strong>
                        </div>
                    </article>


                    <article>
                        <span className="asm-summary-icon amber">
                            <i className="fa-solid fa-clock" />
                        </span>

                        <div>
                            <small>
                                Pending
                            </small>

                            <strong>
                                {summary.pending || 0}
                            </strong>
                        </div>
                    </article>


                    <article>
                        <span className="asm-summary-icon green">
                            <i className="fa-solid fa-circle-check" />
                        </span>

                        <div>
                            <small>
                                Active
                            </small>

                            <strong>
                                {summary.active || 0}
                            </strong>
                        </div>
                    </article>


                    <article>
                        <span className="asm-summary-icon orange">
                            <i className="fa-solid fa-star" />
                        </span>

                        <div>
                            <small>
                                Featured
                            </small>

                            <strong>
                                {summary.featured || 0}
                            </strong>
                        </div>
                    </article>


                    <article>
                        <span className="asm-summary-icon red">
                            <i className="fa-solid fa-trash-can" />
                        </span>

                        <div>
                            <small>
                                Deleted
                            </small>

                            <strong>
                                {summary.deleted || 0}
                            </strong>
                        </div>
                    </article>

                </section>


                {/* ========================================
                    MAIN CARD
                ======================================== */}

                <section className="asm-card">

                    {/* TABS */}

                    <div className="asm-tabs">

                        {tabs.map(
                            ([
                                value,
                                label,
                                count,
                            ]) => (
                                <button
                                    type="button"
                                    key={
                                        value
                                        || "all"
                                    }
                                    className={
                                        filters.status ===
                                            value
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        updateFilter(
                                            "status",
                                            value
                                        )
                                    }
                                >
                                    {label}

                                    <span>
                                        {count}
                                    </span>
                                </button>
                            )
                        )}

                    </div>


                    {/* FILTER */}

                    <div className="asm-filter-bar">

                        <form
                            className="asm-search"
                            onSubmit={
                                submitSearch
                            }
                        >
                            <i className="fa-solid fa-magnifying-glass" />

                            <input
                                value={
                                    searchInput
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setSearchInput(
                                            event
                                                .target
                                                .value
                                        )
                                }
                                placeholder="Search shop, owner, email, phone or slug..."
                            />

                            <button
                                type="submit"
                            >
                                Search
                            </button>
                        </form>


                        <select
                            value={
                                filters.featured
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    updateFilter(
                                        "featured",
                                        event
                                            .target
                                            .value
                                    )
                            }
                        >
                            <option value="">
                                All Sellers
                            </option>

                            <option value="1">
                                Featured Only
                            </option>

                            <option value="0">
                                Not Featured
                            </option>
                        </select>


                        <select
                            value={
                                filters.per_page
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    updateFilter(
                                        "per_page",
                                        Number(
                                            event
                                                .target
                                                .value
                                        )
                                    )
                            }
                        >
                            <option value="10">
                                10 rows
                            </option>

                            <option value="25">
                                25 rows
                            </option>

                            <option value="50">
                                50 rows
                            </option>

                            <option value="100">
                                100 rows
                            </option>
                        </select>

                    </div>


                    {/* BULK */}

                    {selectedIds.length >
                        0 && (
                        <div className="asm-bulk-bar">

                            <strong>
                                {selectedIds.length}
                                {" "}
                                selected
                            </strong>


                            <select
                                value={
                                    bulkAction
                                }
                                onChange={
                                    (
                                        event
                                    ) =>
                                        setBulkAction(
                                            event
                                                .target
                                                .value
                                        )
                                }
                            >
                                <option value="">
                                    Choose bulk action
                                </option>

                                <option value="approve">
                                    Approve
                                </option>

                                <option value="activate">
                                    Activate
                                </option>

                                <option value="pending">
                                    Set Pending
                                </option>

                                <option value="suspend">
                                    Suspend
                                </option>

                                <option value="reject">
                                    Reject
                                </option>

                                <option value="feature">
                                    Feature
                                </option>

                                <option value="unfeature">
                                    Remove Featured
                                </option>

                                <option value="delete">
                                    Delete
                                </option>

                                <option value="restore">
                                    Restore
                                </option>

                                <option value="force_delete">
                                    Permanently Delete
                                </option>
                            </select>


                            <button
                                type="button"
                                className="asm-btn asm-btn-primary"
                                onClick={
                                    openBulkAction
                                }
                            >
                                Apply
                            </button>


                            <button
                                type="button"
                                className="asm-btn asm-btn-light"
                                onClick={() =>
                                    setSelectedIds(
                                        []
                                    )
                                }
                            >
                                Clear
                            </button>

                        </div>
                    )}


                    {/* TABLE */}

                    {loading ? (
                        <div className="asm-loading">
                            <i className="fa-solid fa-spinner fa-spin" />

                            Loading sellers...
                        </div>
                    ) : !rows.length ? (
                        <div className="asm-empty">
                            <i className="fa-solid fa-store-slash" />

                            <strong>
                                No sellers found
                            </strong>

                            <span>
                                Try changing your filters.
                            </span>
                        </div>
                    ) : (
                        <div className="asm-table-wrap">

                            <table className="asm-table">

                                <thead>
                                    <tr>

                                        <th className="asm-check-col">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    allSelected
                                                }
                                                onChange={
                                                    toggleAll
                                                }
                                            />
                                        </th>

                                        <th>
                                            Seller
                                        </th>

                                        <th>
                                            Owner
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Products
                                        </th>

                                        <th>
                                            Orders
                                        </th>

                                        <th>
                                            Featured
                                        </th>

                                        <th>
                                            Joined
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>
                                </thead>


                                <tbody>

                                    {rows.map(
                                        (
                                            row
                                        ) => {
                                            const phone =
                                                row.phone
                                                ||
                                                row.owner
                                                    ?.phone;

                                            const whatsapp =
                                                whatsappNumber(
                                                    phone
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        row.id
                                                    }
                                                >

                                                    <td
                                                        data-label="Select"
                                                        className="asm-check-col"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                selectedIds.includes(
                                                                    row.id
                                                                )
                                                            }
                                                            onChange={() =>
                                                                toggleOne(
                                                                    row.id
                                                                )
                                                            }
                                                        />
                                                    </td>


                                                    <td data-label="Seller">

                                                        <button
                                                            type="button"
                                                            className="asm-seller-cell"
                                                            onClick={() =>
                                                                openSeller(
                                                                    row.id
                                                                )
                                                            }
                                                        >

                                                            <span className="asm-avatar">

                                                                {row.logo ? (
                                                                    <img
                                                                        src={
                                                                            mediaUrl(
                                                                                row.logo
                                                                            )
                                                                        }
                                                                        alt={
                                                                            row.name
                                                                        }
                                                                    />
                                                                ) : (
                                                                    String(
                                                                        row.name
                                                                        ||
                                                                        "S"
                                                                    )
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase()
                                                                )}

                                                            </span>


                                                            <span className="asm-seller-copy">

                                                                <strong>
                                                                    {row.name}
                                                                </strong>


                                                                <small>
                                                                    {phone
                                                                        ||
                                                                        "No phone"
                                                                    }
                                                                </small>


                                                                <em>
                                                                    Seller #{row.id}
                                                                </em>

                                                            </span>

                                                        </button>


                                                        {whatsapp && (
                                                            <a
                                                                href={
                                                                    `https://wa.me/${whatsapp}`
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="asm-whatsapp-mini"
                                                                title="WhatsApp seller"
                                                            >
                                                                <i className="fa-brands fa-whatsapp" />
                                                            </a>
                                                        )}

                                                    </td>


                                                    <td data-label="Owner">

                                                        <strong className="asm-owner-name">
                                                            {row.owner
                                                                ?.name
                                                                ||
                                                                "—"
                                                            }
                                                        </strong>

                                                        <small className="asm-muted">
                                                            {row.owner
                                                                ?.email
                                                                ||
                                                                row.email
                                                                ||
                                                                "—"
                                                            }
                                                        </small>

                                                    </td>


                                                    <td data-label="Status">

                                                        {row.deleted_at ? (
                                                            <StatusBadge
                                                                value="deleted"
                                                            />
                                                        ) : (
                                                            <select
                                                                className="asm-status-select"
                                                                value={
                                                                    row.status
                                                                }
                                                                onChange={
                                                                    (
                                                                        event
                                                                    ) =>
                                                                        quickStatus(
                                                                            row,
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                }
                                                            >
                                                                <option value="pending">
                                                                    Pending
                                                                </option>

                                                                <option value="active">
                                                                    Active
                                                                </option>

                                                                <option value="suspended">
                                                                    Suspended
                                                                </option>

                                                                <option value="rejected">
                                                                    Rejected
                                                                </option>
                                                            </select>
                                                        )}

                                                    </td>


                                                    <td data-label="Products">
                                                        <strong>
                                                            {row.products_count}
                                                        </strong>
                                                    </td>


                                                    <td data-label="Orders">
                                                        <strong>
                                                            {row.orders_count}
                                                        </strong>
                                                    </td>


                                                    <td data-label="Featured">

                                                        <span
                                                            className={
                                                                row.is_featured
                                                                    ? "asm-featured yes"
                                                                    : "asm-featured"
                                                            }
                                                        >
                                                            <i className="fa-solid fa-star" />

                                                            {row.is_featured
                                                                ? "Yes"
                                                                : "No"
                                                            }
                                                        </span>

                                                    </td>


                                                    <td data-label="Joined">
                                                        <span className="asm-date">
                                                            {formatDate(
                                                                row.created_at
                                                            )}
                                                        </span>
                                                    </td>


                                                    <td data-label="Actions">

                                                        <div className="asm-actions">

                                                            <button
                                                                type="button"
                                                                title="View seller"
                                                                onClick={() =>
                                                                    openSeller(
                                                                        row.id
                                                                    )
                                                                }
                                                            >
                                                                <i className="fa-regular fa-eye" />
                                                            </button>


                                                            {row.deleted_at ? (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="restore"
                                                                        title="Restore seller"
                                                                        onClick={() =>
                                                                            openSingleAction(
                                                                                row,
                                                                                "restore"
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="fa-solid fa-trash-arrow-up" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="delete"
                                                                        title="Permanently delete seller"
                                                                        onClick={() =>
                                                                            openSingleAction(
                                                                                row,
                                                                                "force_delete"
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="fa-solid fa-trash-can" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        title={
                                                                            row.is_featured
                                                                                ? "Remove featured"
                                                                                : "Feature seller"
                                                                        }
                                                                        onClick={() =>
                                                                            openSingleAction(
                                                                                row,
                                                                                row.is_featured
                                                                                    ? "unfeature"
                                                                                    : "feature"
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="fa-regular fa-star" />
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        className="delete"
                                                                        title="Delete seller"
                                                                        onClick={() =>
                                                                            openSingleAction(
                                                                                row,
                                                                                "delete"
                                                                            )
                                                                        }
                                                                    >
                                                                        <i className="fa-regular fa-trash-can" />
                                                                    </button>
                                                                </>
                                                            )}

                                                        </div>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )}

                                </tbody>

                            </table>

                        </div>
                    )}


                    {/* PAGINATION */}

                    <footer className="asm-pagination">

                        <span>
                            Showing{" "}
                            {meta.from || 0}
                            {"–"}
                            {meta.to || 0}
                            {" of "}
                            {meta.total || 0}
                        </span>


                        <div>

                            <button
                                type="button"
                                disabled={
                                    Number(
                                        meta.current_page
                                    ) <= 1
                                }
                                onClick={() =>
                                    updateFilter(
                                        "page",
                                        Number(
                                            meta.current_page
                                        ) - 1
                                    )
                                }
                            >
                                <i className="fa-solid fa-chevron-left" />
                            </button>


                            <strong>
                                {meta.current_page || 1}
                                {" / "}
                                {meta.last_page || 1}
                            </strong>


                            <button
                                type="button"
                                disabled={
                                    Number(
                                        meta.current_page
                                    )
                                    >=
                                    Number(
                                        meta.last_page
                                    )
                                }
                                onClick={() =>
                                    updateFilter(
                                        "page",
                                        Number(
                                            meta.current_page
                                        ) + 1
                                    )
                                }
                            >
                                <i className="fa-solid fa-chevron-right" />
                            </button>

                        </div>

                    </footer>

                </section>

            </div>


            {/* =================================================
                SELLER DETAIL
            ================================================= */}

            <Modal
                open={
                    detailOpen
                }
                title={
                    detail
                        ? detail.name
                        : "Seller Details"
                }
                size="large"
                onClose={() =>
                    setDetailOpen(
                        false
                    )
                }
            >

                {detailLoading ||
                !detail ? (
                    <div className="asm-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Loading seller details...
                    </div>
                ) : (
                    <>

                        <section className="asm-profile-card">

                            <span className="asm-profile-logo">

                                {detail.logo ? (
                                    <img
                                        src={
                                            mediaUrl(
                                                detail.logo
                                            )
                                        }
                                        alt={
                                            detail.name
                                        }
                                    />
                                ) : (
                                    String(
                                        detail.name
                                        ||
                                        "S"
                                    )
                                        .charAt(
                                            0
                                        )
                                        .toUpperCase()
                                )}

                            </span>


                            <div className="asm-profile-copy">

                                <div>
                                    <h2>
                                        {detail.name}
                                    </h2>

                                    <StatusBadge
                                        value={
                                            detail.deleted_at
                                                ? "deleted"
                                                : detail.status
                                        }
                                    />
                                </div>


                                <p>
                                    Seller #{detail.id}
                                    {" · "}
                                    {detail.slug || "No slug"}
                                </p>


                                <div className="asm-profile-contact">

                                    {detail.phone && (
                                        <a
                                            href={
                                                `tel:${detail.phone}`
                                            }
                                        >
                                            <i className="fa-solid fa-phone" />
                                            {detail.phone}
                                        </a>
                                    )}


                                    {whatsappNumber(
                                        detail.phone
                                        ||
                                        detail.owner
                                            ?.phone
                                    ) && (
                                        <a
                                            className="whatsapp"
                                            href={
                                                `https://wa.me/${whatsappNumber(
                                                    detail.phone
                                                    ||
                                                    detail.owner
                                                        ?.phone
                                                )}`
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <i className="fa-brands fa-whatsapp" />
                                            WhatsApp
                                        </a>
                                    )}


                                    {detail.email && (
                                        <a
                                            href={
                                                `mailto:${detail.email}`
                                            }
                                        >
                                            <i className="fa-regular fa-envelope" />
                                            {detail.email}
                                        </a>
                                    )}

                                </div>

                            </div>

                        </section>


                        {/* STATS */}

                        <section className="asm-detail-stats">

                            <article>
                                <small>
                                    Products
                                </small>

                                <strong>
                                    {detail.products_count || 0}
                                </strong>
                            </article>


                            <article>
                                <small>
                                    Orders
                                </small>

                                <strong>
                                    {detail.orders_count || 0}
                                </strong>
                            </article>


                            <article>
                                <small>
                                    Reviews
                                </small>

                                <strong>
                                    {detail.reviews_count || 0}
                                </strong>
                            </article>


                            <article>
                                <small>
                                    Currency
                                </small>

                                <strong>
                                    {detail.currency || "BDT"}
                                </strong>
                            </article>

                        </section>


                        {/* STATUS ACTIONS */}

                        <section className="asm-detail-section">

                            <header>
                                <div>
                                    <h3>
                                        Seller Access
                                    </h3>

                                    <p>
                                        Control marketplace access and seller status.
                                    </p>
                                </div>
                            </header>


                            <div className="asm-detail-actions">

                                {!detail.deleted_at ? (
                                    <>
                                        <button
                                            className="asm-btn asm-btn-success"
                                            onClick={() =>
                                                openSingleAction(
                                                    detail,
                                                    "approve"
                                                )
                                            }
                                        >
                                            Approve
                                        </button>


                                        <button
                                            className="asm-btn asm-btn-primary"
                                            onClick={() =>
                                                openSingleAction(
                                                    detail,
                                                    "activate"
                                                )
                                            }
                                        >
                                            Activate
                                        </button>


                                        <button
                                            className="asm-btn asm-btn-light"
                                            onClick={() =>
                                                openSingleAction(
                                                    detail,
                                                    "pending"
                                                )
                                            }
                                        >
                                            Pending
                                        </button>


                                        <button
                                            className="asm-btn asm-btn-warning"
                                            onClick={() =>
                                                openSingleAction(
                                                    detail,
                                                    "suspend"
                                                )
                                            }
                                        >
                                            Suspend
                                        </button>


                                        <button
                                            className="asm-btn asm-btn-danger"
                                            onClick={() =>
                                                openSingleAction(
                                                    detail,
                                                    "reject"
                                                )
                                            }
                                        >
                                            Reject
                                        </button>


                                        <button
                                            className="asm-btn asm-btn-danger-outline"
                                            onClick={() =>
                                                openSingleAction(
                                                    detail,
                                                    "delete"
                                                )
                                            }
                                        >
                                            <i className="fa-regular fa-trash-can" />
                                            Delete
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="asm-btn asm-btn-success"
                                            onClick={() =>
                                                openSingleAction(
                                                    detail,
                                                    "restore"
                                                )
                                            }
                                        >
                                            Restore Seller
                                        </button>

                                        <button
                                            className="asm-btn asm-btn-danger"
                                            onClick={() =>
                                                openSingleAction(
                                                    detail,
                                                    "force_delete"
                                                )
                                            }
                                        >
                                            <i className="fa-solid fa-trash-can" />
                                            Permanently Delete
                                        </button>
                                    </>
                                )}

                            </div>


                            {detail.rejection_reason && (
                                <div className="asm-reason-box">

                                    <strong>
                                        Current reason
                                    </strong>

                                    <p>
                                        {detail.rejection_reason}
                                    </p>

                                </div>
                            )}

                        </section>


                        {/* COMMERCIAL */}

                        {!detail.deleted_at && (
                            <section className="asm-detail-section">

                                <header>
                                    <div>
                                        <h3>
                                            Commercial Settings
                                        </h3>

                                        <p>
                                            Seller commission, payout threshold and featured placement.
                                        </p>
                                    </div>
                                </header>


                                <div className="asm-commercial-grid">

                                    <label>
                                        <span>
                                            Commission %
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={
                                                commercial
                                                    .commission_rate
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    setCommercial(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,

                                                            commission_rate:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>


                                    <label>
                                        <span>
                                            Minimum Payout
                                        </span>

                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={
                                                commercial
                                                    .minimum_payout_amount
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    setCommercial(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,

                                                            minimum_payout_amount:
                                                                event
                                                                    .target
                                                                    .value,
                                                        })
                                                    )
                                            }
                                        />
                                    </label>


                                    <label className="asm-feature-switch">

                                        <input
                                            type="checkbox"
                                            checked={
                                                commercial
                                                    .is_featured
                                            }
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    setCommercial(
                                                        (
                                                            current
                                                        ) => ({
                                                            ...current,

                                                            is_featured:
                                                                event
                                                                    .target
                                                                    .checked,
                                                        })
                                                    )
                                            }
                                        />

                                        <span>
                                            Featured Seller
                                        </span>

                                    </label>


                                    <button
                                        type="button"
                                        className="asm-btn asm-btn-primary"
                                        disabled={
                                            commercialSaving
                                        }
                                        onClick={
                                            saveCommercial
                                        }
                                    >
                                        {commercialSaving
                                            ? "Saving..."
                                            : "Save Settings"
                                        }
                                    </button>

                                </div>

                            </section>
                        )}


                        {/* STORE INFO */}

                        <section className="asm-detail-section">

                            <header>
                                <div>
                                    <h3>
                                        Store & Owner Information
                                    </h3>
                                </div>
                            </header>


                            <div className="asm-info-grid">

                                <div>
                                    <span>
                                        Owner
                                    </span>

                                    <strong>
                                        {detail.owner
                                            ?.name
                                            ||
                                            "—"
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Owner Email
                                    </span>

                                    <strong>
                                        {detail.owner
                                            ?.email
                                            ||
                                            "—"
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Owner Phone
                                    </span>

                                    <strong>
                                        {detail.owner
                                            ?.phone
                                            ||
                                            "—"
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Onboarding
                                    </span>

                                    <strong>
                                        {titleCase(
                                            detail
                                                .onboarding_status
                                            ||
                                            "—"
                                        )}
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Trade License
                                    </span>

                                    <strong>
                                        {detail
                                            .trade_license_number
                                            ||
                                            "—"
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Tax ID
                                    </span>

                                    <strong>
                                        {detail.tax_id
                                            ||
                                            "—"
                                        }
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Approved
                                    </span>

                                    <strong>
                                        {formatDate(
                                            detail
                                                .approved_at
                                        )}
                                    </strong>
                                </div>


                                <div>
                                    <span>
                                        Joined
                                    </span>

                                    <strong>
                                        {formatDate(
                                            detail
                                                .created_at
                                        )}
                                    </strong>
                                </div>

                            </div>

                        </section>


                        {/* ADDRESSES & LOCATION */}

                        <section className="asm-detail-section">

                            <header>
                                <div>
                                    <h3>
                                        Address & Location Details
                                    </h3>
                                    <p>
                                        Physical business store, warehouse, and pickup location details.
                                    </p>
                                </div>
                            </header>

                            {!(
                                Array.isArray(detail.addresses)
                                    ? detail.addresses
                                    : detail.address
                                      ? [detail.address]
                                      : []
                            ).length ? (
                                <div className="asm-mini-empty">
                                    <i className="fa-solid fa-location-dot" style={{ marginRight: 6 }} />
                                    No physical address registered yet.
                                </div>
                            ) : (
                                <div className="asm-address-grid">
                                    {(
                                        Array.isArray(detail.addresses)
                                            ? detail.addresses
                                            : [detail.address]
                                    ).map((addr, idx) => (
                                        <article className="asm-address-card" key={addr?.id || idx}>
                                            <div className="asm-address-card-header">
                                                <div className="asm-address-type-badge">
                                                    <i className="fa-solid fa-location-dot" />
                                                    <strong>{titleCase(addr?.type || "Business Address")}</strong>
                                                </div>
                                                {addr?.is_default ? (
                                                    <span className="asm-badge asm-badge-success">Default</span>
                                                ) : null}
                                            </div>

                                            <div className="asm-address-content">
                                                <div className="asm-address-field full-width">
                                                    <span>Street / Full Address</span>
                                                    <strong>{addr?.address || "—"}</strong>
                                                </div>

                                                <div className="asm-address-field">
                                                    <span>City / District</span>
                                                    <strong>{addr?.city || "—"}</strong>
                                                </div>

                                                <div className="asm-address-field">
                                                    <span>State / Division</span>
                                                    <strong>{addr?.state || "—"}</strong>
                                                </div>

                                                <div className="asm-address-field">
                                                    <span>Postal Code</span>
                                                    <strong>{addr?.postal_code || "—"}</strong>
                                                </div>

                                                <div className="asm-address-field">
                                                    <span>Country</span>
                                                    <strong>{addr?.country || "Bangladesh"}</strong>
                                                </div>

                                                {(addr?.contact_name || addr?.phone) && (
                                                    <>
                                                        <div className="asm-address-field">
                                                            <span>Contact Person</span>
                                                            <strong>{addr?.contact_name || "—"}</strong>
                                                        </div>
                                                        <div className="asm-address-field">
                                                            <span>Contact Phone</span>
                                                            <strong>
                                                                {addr?.phone ? (
                                                                    <a href={`tel:${addr.phone}`} style={{ color: "inherit", textDecoration: "none" }}>
                                                                        {addr.phone}
                                                                    </a>
                                                                ) : "—"}
                                                            </strong>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                        </section>


                        {/* DOCUMENTS */}

                        <section className="asm-detail-section">

                            <header>
                                <div>
                                    <h3>
                                        Verification Documents
                                    </h3>

                                    <p>
                                        Review KYC and seller verification documents.
                                    </p>
                                </div>
                            </header>


                            {!detail.documents
                                ?.length ? (
                                <div className="asm-mini-empty">
                                    No documents uploaded.
                                </div>
                            ) : (
                                <div className="asm-doc-grid">
                                    {detail.documents.map(
                                        (document) => (
                                            <article
                                                className="asm-doc-card"
                                                key={document.id}
                                            >
                                                <DocumentPreview
                                                    document={document}
                                                    onNotify={notify}
                                                />

                                                <div className="asm-doc-card-body">
                                                    <div className="asm-doc-card-meta">
                                                        <strong>
                                                            {titleCase(
                                                                document.type
                                                            )}
                                                        </strong>

                                                        <StatusBadge
                                                            value={
                                                                document.status
                                                            }
                                                        />
                                                    </div>

                                                    <p>
                                                        {document.document_number
                                                            ? `#${document.document_number}`
                                                            : "No document number"}
                                                    </p>

                                                    <div className="asm-table-buttons">
                                                        <button
                                                            type="button"
                                                            className="asm-btn asm-btn-success"
                                                            onClick={() =>
                                                                verifyDocument(
                                                                    document,
                                                                    "verified"
                                                                )
                                                            }
                                                        >
                                                            Verify
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="asm-btn asm-btn-light"
                                                            onClick={() =>
                                                                verifyDocument(
                                                                    document,
                                                                    "pending"
                                                                )
                                                            }
                                                        >
                                                            Pending
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="asm-btn asm-btn-danger"
                                                            onClick={() =>
                                                                verifyDocument(
                                                                    document,
                                                                    "rejected"
                                                                )
                                                            }
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            </article>
                                        )
                                    )}
                                </div>
                            )}

                        </section>


                        {/* BANK */}

                        <section className="asm-detail-section">

                            <header>
                                <div>
                                    <h3>
                                        Payout Accounts
                                    </h3>

                                    <p>
                                        Verify seller bank or mobile financial accounts.
                                    </p>
                                </div>
                            </header>


                            {!detail.bank_accounts
                                ?.length ? (
                                <div className="asm-mini-empty">
                                    No payout account available.
                                </div>
                            ) : (
                                <div className="asm-table-wrap">

                                    <table className="asm-table asm-inner-table">

                                        <thead>
                                            <tr>
                                                <th>
                                                    Type
                                                </th>

                                                <th>
                                                    Account
                                                </th>

                                                <th>
                                                    Provider
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th>
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>


                                        <tbody>

                                            {detail.bank_accounts.map(
                                                (
                                                    bank
                                                ) => (
                                                    <tr
                                                        key={
                                                            bank.id
                                                        }
                                                    >

                                                        <td data-label="Type">
                                                            {titleCase(
                                                                bank.type
                                                            )}
                                                        </td>


                                                        <td data-label="Account">

                                                            <strong>
                                                                {bank.account_name
                                                                    ||
                                                                    "—"
                                                                }
                                                            </strong>

                                                            <small className="asm-muted">
                                                                {bank.account_number
                                                                    ||
                                                                    "—"
                                                                }
                                                            </small>

                                                        </td>


                                                        <td data-label="Provider">
                                                            {bank.bank_name
                                                                ||
                                                                bank.mobile_provider
                                                                ||
                                                                "—"
                                                            }
                                                        </td>


                                                        <td data-label="Status">

                                                            <StatusBadge
                                                                value={
                                                                    bank.is_verified
                                                                        ? "verified"
                                                                        : "pending"
                                                                }
                                                            />

                                                        </td>


                                                        <td data-label="Action">

                                                            <button
                                                                type="button"
                                                                className="asm-btn asm-btn-light"
                                                                onClick={() =>
                                                                    verifyBank(
                                                                        bank
                                                                    )
                                                                }
                                                            >
                                                                {bank.is_verified
                                                                    ? "Unverify"
                                                                    : "Verify"
                                                                }
                                                            </button>

                                                        </td>

                                                    </tr>
                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>
                            )}

                        </section>

                    </>
                )}

            </Modal>


            {/* =================================================
                ACTION CONFIRM
            ================================================= */}

            <Modal
                open={
                    actionDialog.open
                }
                title={
                    ACTION_LABELS[
                        actionDialog.action
                    ]
                    ||
                    "Seller Action"
                }
                size="small"
                onClose={() =>
                    !actionDialog.busy
                    &&
                    setActionDialog(
                        (
                            current
                        ) => ({
                            ...current,
                            open: false,
                        })
                    )
                }
            >

                <div className="asm-confirm">

                    <span
                        className={
                            [
                                "delete",
                                "force_delete",
                                "reject",
                                "suspend",
                            ].includes(
                                actionDialog.action
                            )
                                ? "asm-confirm-icon danger"
                                : "asm-confirm-icon"
                        }
                    >
                        <i
                            className={
                                [
                                    "delete",
                                    "force_delete",
                                ].includes(
                                    actionDialog.action
                                )
                                    ? "fa-regular fa-trash-can"
                                    : "fa-solid fa-circle-check"
                            }
                        />
                    </span>


                    <h3>
                        {ACTION_LABELS[
                            actionDialog.action
                        ]}
                    </h3>


                    <p>
                        {actionDialog.mode ===
                            "bulk"
                            ? `This action will affect ${selectedIds.length} selected seller(s).`
                            : `This action will affect ${actionDialog.vendor?.name || "this seller"}.`
                        }
                    </p>


                    {actionDialog.action ===
                        "delete" && (
                        <div className="asm-warning-box">
                            Seller will be moved to the deleted list and can be restored later.
                        </div>
                    )}


                    {actionDialog.action ===
                        "force_delete" && (
                        <div className="asm-warning-box">
                            This permanently removes the seller, their products, and seller order
                            history. This cannot be undone.
                        </div>
                    )}

                    {[
                        "reject",
                        "suspend",
                    ].includes(
                        actionDialog.action
                    ) && (
                        <textarea
                            value={
                                actionDialog.reason
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    setActionDialog(
                                        (
                                            current
                                        ) => ({
                                            ...current,

                                            reason:
                                                event
                                                    .target
                                                    .value,
                                        })
                                    )
                            }
                            placeholder="Enter reason..."
                        />
                    )}


                    <div className="asm-confirm-actions">

                        <button
                            type="button"
                            className="asm-btn asm-btn-light"
                            disabled={
                                actionDialog.busy
                            }
                            onClick={() =>
                                setActionDialog(
                                    (
                                        current
                                    ) => ({
                                        ...current,
                                        open: false,
                                    })
                                )
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            className={
                                [
                                    "delete",
                                    "reject",
                                    "suspend",
                                ].includes(
                                    actionDialog.action
                                )
                                    ? "asm-btn asm-btn-danger"
                                    : "asm-btn asm-btn-primary"
                            }
                            disabled={
                                actionDialog.busy
                            }
                            onClick={
                                executeAction
                            }
                        >
                            {actionDialog.busy
                                ? "Processing..."
                                : "Confirm"
                            }
                        </button>

                    </div>

                </div>

            </Modal>


            {/* =================================================
                DOCUMENT REJECT
            ================================================= */}

            <Modal
                open={
                    docDialog.open
                }
                title="Reject Document"
                size="small"
                onClose={() =>
                    !docDialog.busy
                    &&
                    setDocDialog(
                        (
                            current
                        ) => ({
                            ...current,
                            open: false,
                        })
                    )
                }
            >

                <div className="asm-confirm">

                    <span className="asm-confirm-icon danger">
                        <i className="fa-solid fa-file-circle-xmark" />
                    </span>


                    <h3>
                        Reject verification document?
                    </h3>


                    <textarea
                        value={
                            docDialog.reason
                        }
                        onChange={
                            (
                                event
                            ) =>
                                setDocDialog(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        reason:
                                            event
                                                .target
                                                .value,
                                    })
                                )
                        }
                        placeholder="Enter document rejection reason..."
                    />


                    <div className="asm-confirm-actions">

                        <button
                            className="asm-btn asm-btn-light"
                            disabled={
                                docDialog.busy
                            }
                            onClick={() =>
                                setDocDialog(
                                    (
                                        current
                                    ) => ({
                                        ...current,
                                        open: false,
                                    })
                                )
                            }
                        >
                            Cancel
                        </button>


                        <button
                            className="asm-btn asm-btn-danger"
                            disabled={
                                docDialog.busy
                            }
                            onClick={
                                submitDocumentReject
                            }
                        >
                            {docDialog.busy
                                ? "Rejecting..."
                                : "Reject Document"
                            }
                        </button>

                    </div>

                </div>

            </Modal>


            {/* =================================================
                TOAST
            ================================================= */}

            {toast && (
                <div
                    className={
                        `asm-toast ${toast.type}`
                    }
                >
                    <i
                        className={
                            toast.type ===
                                "error"
                                ? "fa-solid fa-circle-exclamation"
                                : "fa-solid fa-circle-check"
                        }
                    />

                    {toast.message}
                </div>
            )}

        </AdminLayout>
    );
}