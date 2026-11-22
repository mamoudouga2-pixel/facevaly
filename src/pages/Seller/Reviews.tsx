import {
    useCallback,
    useEffect,
    useState,
} from "react";

import SellerLayout from "./Layout";
import sellerSuiteService from "../../services/sellerSuiteService";
import { mediaUrl } from "../../config/api";

import {
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


function Stars({ value = 0 }) {
    const rounded = Math.round(Number(value || 0));

    return (
        <span className="ss-stars">
            {[1, 2, 3, 4, 5].map((star) => (
                <i
                    key={star}
                    className={
                        star <= rounded
                            ? "fa-solid fa-star"
                            : "fa-regular fa-star"
                    }
                />
            ))}
        </span>
    );
}


export default function SellerReviews() {
    const [type, setType] = useState("product");
    const [status, setStatus] = useState("");
    const [rows, setRows] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [replyOpen, setReplyOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [reply, setReply] = useState("");
    const [saving, setSaving] = useState(false);

    const notify = useCallback((message, toastType = "success") => {
        setToast({ message, type: toastType });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.reviews({
                type,
                status,
            });

            const payload = response.data;
            const list = Array.isArray(payload)
                ? payload
                : payload?.product_reviews
                    || payload?.store_reviews
                    || [];

            setRows(Array.isArray(list) ? list : []);
            setSummary(response.summary || {});
        } catch (exception) {
            notify(firstError(exception, "Reviews could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [notify, status, type]);

    useEffect(() => {
        load();
    }, [load]);

    const openReply = (row) => {
        setSelected(row);
        setReply(row.reply || "");
        setReplyOpen(true);
    };

    const saveReply = async () => {
        if (!selected || !reply.trim()) return;

        setSaving(true);

        try {
            const response =
                selected.type === "store"
                    ? await sellerSuiteService.replyStoreReview(
                        selected.id,
                        reply.trim()
                    )
                    : await sellerSuiteService.replyProductReview(
                        selected.id,
                        reply.trim()
                    );

            notify(response.message || "Reply saved.");
            setReplyOpen(false);
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
                    title="Reviews"
                    description="Read product and store reviews and reply as the seller. Sellers cannot approve or delete customer reviews."
                />

                <div className="ss-stat-grid">
                    <SellerSuiteStat
                        icon="fa-solid fa-star"
                        label="Average Rating"
                        value={`${summary.average_rating || 0}/5`}
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-comment-dots"
                        label="Product Reviews"
                        value={summary.product_reviews || 0}
                        tone="blue"
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-store"
                        label="Store Reviews"
                        value={summary.store_reviews || 0}
                        tone="green"
                    />
                    <SellerSuiteStat
                        icon="fa-solid fa-clock"
                        label="Pending Moderation"
                        value={summary.pending_reviews || 0}
                    />
                </div>

                <div className="ss-toolbar">
                    <div className="ss-tabs" style={{ marginBottom: 0 }}>
                        <button
                            type="button"
                            className={type === "product" ? "ss-tab active" : "ss-tab"}
                            onClick={() => setType("product")}
                        >
                            Product Reviews
                        </button>
                        <button
                            type="button"
                            className={type === "store" ? "ss-tab active" : "ss-tab"}
                            onClick={() => setType("store")}
                        >
                            Store Reviews
                        </button>
                    </div>

                    <select
                        className="ss-select"
                        style={{ width: 170 }}
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                    >
                        <option value="">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                <SellerSuiteCard>
                    {loading ? (
                        <SellerSuiteLoader text="Loading reviews..." />
                    ) : !Array.isArray(rows) || rows.length === 0 ? (
                        <SellerSuiteEmpty
                            icon="fa-regular fa-star"
                            title="No reviews found"
                        />
                    ) : (
                        <div className="ss-review-grid">
                            {rows.map((row) => (
                                <article className="ss-review" key={row.id}>
                                    <div className="ss-review-head">
                                        <div>
                                            <strong>{row.name}</strong>
                                            <div>
                                                <Stars value={row.rating} />
                                            </div>
                                        </div>

                                        <SellerSuiteBadge value={row.status} />
                                    </div>

                                    {row.product && (
                                        <small>
                                            Product: {row.product.name}
                                        </small>
                                    )}

                                    <p>{row.review || "No written review."}</p>

                                    {row.images?.length > 0 && (
                                        <div className="ss-page-actions">
                                            {row.images.map((image) => (
                                                <span
                                                    className="ss-product-thumb"
                                                    key={image.id}
                                                >
                                                    <img
                                                        src={mediaUrl(image.image)}
                                                        alt="Review"
                                                    />
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <small>
                                        {row.verified
                                            ? "Verified purchase · "
                                            : ""}
                                        {formatDate(row.created_at)}
                                    </small>

                                    {row.reply && (
                                        <div className="ss-review-reply">
                                            <strong>Seller reply</strong>
                                            <div>{row.reply}</div>
                                        </div>
                                    )}

                                    <div style={{ marginTop: 10 }}>
                                        <button
                                            type="button"
                                            className="ss-btn"
                                            onClick={() => openReply(row)}
                                        >
                                            <i className="fa-solid fa-reply" />
                                            {row.reply ? "Edit Reply" : "Reply"}
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </SellerSuiteCard>
            </div>

            <SellerSuiteModal
                open={replyOpen}
                title="Seller Reply"
                onClose={() => setReplyOpen(false)}
                size="small"
            >
                <textarea
                    className="ss-textarea"
                    rows="6"
                    placeholder="Write a professional seller reply..."
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                />

                <div className="ss-modal-footer">
                    <button
                        type="button"
                        className="ss-btn"
                        onClick={() => setReplyOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="ss-btn ss-btn-primary"
                        disabled={saving || !reply.trim()}
                        onClick={saveReply}
                    >
                        Save Reply
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
