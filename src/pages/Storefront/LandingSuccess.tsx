import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { apiUrl } from "../../config/api";
import "./LandingSuccess.css";

function money(value: number) {
    return `৳${Math.round(Number(value || 0)).toLocaleString("en-BD")}`;
}

export default function LandingSuccess() {
    const { productSlug } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.documentElement.classList.add("lp-active");
        document.body.classList.add("lp-active");
        return () => {
            document.documentElement.classList.remove("lp-active");
            document.body.classList.remove("lp-active");
        };
    }, []);

    useEffect(() => {
        let active = true;

        const boot = async () => {
            setLoading(true);
            setError("");

            try {
                const cached = sessionStorage.getItem(
                    `fv_landing_success_${productSlug}`
                );
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (active) setData(parsed);
                }
            } catch {
                // ignore
            }

            let hasCached = false;
            try {
                hasCached = Boolean(
                    sessionStorage.getItem(`fv_landing_success_${productSlug}`)
                );
            } catch {
                hasCached = false;
            }

            if (!token) {
                if (active) {
                    setLoading(false);
                    if (!hasCached) setError("Order success session expired.");
                }
                return;
            }

            try {
                const response = await fetch(
                    apiUrl(
                        `storefront/landing-success/${encodeURIComponent(productSlug || "")}?token=${encodeURIComponent(token)}`
                    ),
                    {
                        headers: { Accept: "application/json" },
                        credentials: "include",
                    }
                );
                const json = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(json?.message || "Order success session expired.");
                }
                if (active) {
                    setData((current: any) => ({ ...(current || {}), ...(json?.data || json) }));
                }
            } catch (exception: any) {
                if (active && !hasCached) {
                    setError(exception?.message || "Order success session expired.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        void boot();
        return () => {
            active = false;
        };
    }, [productSlug, token]);

    useEffect(() => {
        if (!data?.meta_event_id) return;
        const value = Number(data.total_amount || data.order?.total_amount || 0);
        const eventId = data.meta_event_id;
        try {
            const w = window as any;
            w.dataLayer = w.dataLayer || [];

            if (data.tracking?.meta_pixel_id && typeof w.fbq !== "function") {
                !(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
                    if (f.fbq) return;
                    n = f.fbq = function () {
                        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                    };
                    if (!f._fbq) f._fbq = n;
                    n.push = n;
                    n.loaded = true;
                    n.version = "2.0";
                    n.queue = [];
                    t = b.createElement(e);
                    t.async = true;
                    t.src = v;
                    s = b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t, s);
                })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
                w.fbq("init", data.tracking.meta_pixel_id);
            }

            if (typeof w.fbq === "function") {
                w.fbq(
                    "track",
                    "Purchase",
                    {
                        value,
                        currency: "BDT",
                        content_ids: (data.items || []).map(
                            (item: any) => String(item.product_id || item.name)
                        ),
                        content_type: "product",
                        num_items: (data.items || []).reduce(
                            (sum: number, item: any) => sum + Number(item.quantity || 1),
                            0
                        ),
                    },
                    { eventID: eventId }
                );
            }

            if (typeof w.gtag === "function") {
                w.gtag("event", "purchase", {
                    transaction_id: data.order_number,
                    value,
                    currency: "BDT",
                    event_id: eventId,
                });
            } else {
                w.dataLayer.push({
                    event: "purchase",
                    ecommerce: {
                        transaction_id: data.order_number,
                        value,
                        currency: "BDT",
                    },
                    meta_event_id: eventId,
                });
            }
        } catch {
            // browser pixel optional
        }
    }, [data]);

    const orderNumber = data?.order_number || data?.order?.order_number || "—";
    const totalAmount = Number(data?.total_amount || data?.order?.total_amount || 0);
    const customerName = data?.customer_name || data?.order?.customer_name || "";
    const productName = data?.product_name || data?.items?.[0]?.name || "—";
    const statusLabel = data?.status_label || data?.order?.status || "Confirmed";
    const landingPath = data?.landing_slug ? `/p/${data.landing_slug}` : "/";

    if (loading) {
        return (
            <div className="lp-success-page">
                <main className="lp-success-card">
                    <p className="lp-success-subtitle">Confirming your order…</p>
                </main>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="lp-success-page">
                <main className="lp-success-card">
                    <div className="lp-success-badge">Session expired</div>
                    <h1 className="lp-success-title">অর্ডার সেশন শেষ</h1>
                    <p className="lp-success-subtitle">{error}</p>
                    <div className="lp-success-actions">
                        <Link className="lp-success-btn is-primary" to="/">
                            Back to home
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="lp-success-page">
            <main className="lp-success-card" aria-labelledby="success-title">
                <div className="lp-success-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M5 12.5L9.2 16.5L19 6.8"
                            stroke="currentColor"
                            strokeWidth="2.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <div className="lp-success-badge">Order Confirmed</div>

                <h1 className="lp-success-title" id="success-title">
                    {data?.success_title || "আপনার অর্ডার সফল হয়েছে!"}
                </h1>

                <p className="lp-success-subtitle">
                    {customerName ? (
                        <span className="lp-success-customer">{customerName}, </span>
                    ) : null}
                    {data?.success_text ||
                        "ধন্যবাদ। আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে। আমরা খুব শীঘ্রই আপনার সঙ্গে যোগাযোগ করব।"}
                </p>

                <section className="lp-success-grid" aria-label="Order information">
                    <div className="lp-success-box">
                        <div className="lp-success-box-icon is-order" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M7 3H15L19 7V21H7V3Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M15 3V8H19"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="lp-success-box-text">
                            <span className="lp-success-label">Order Number</span>
                            <strong className="lp-success-value">{orderNumber}</strong>
                        </div>
                    </div>

                    <div className="lp-success-box is-total">
                        <div className="lp-success-box-icon is-total" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M7 6H15.5C17.4 6 19 7.4 19 9.2C19 11 17.4 12.4 15.5 12.4H7"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M7 3V21M4 6H8.5M4 10H8.5"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="lp-success-box-text">
                            <span className="lp-success-label">Total Amount</span>
                            <strong className="lp-success-value is-total">{money(totalAmount)}</strong>
                        </div>
                    </div>

                    <div className="lp-success-box">
                        <div className="lp-success-box-icon is-status" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 3L19 6V11C19 15.4 16.2 19.2 12 21C7.8 19.2 5 15.4 5 11V6L12 3Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M8.8 12L11 14.2L15.5 9.7"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div className="lp-success-box-text">
                            <span className="lp-success-label">Order Status</span>
                            <strong className="lp-success-value">{statusLabel}</strong>
                        </div>
                    </div>

                    <div className="lp-success-box">
                        <div className="lp-success-box-icon is-product" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M4 7H20L18.5 19H5.5L4 7Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M9 7V5.5C9 4.1 10.1 3 11.5 3H12.5C13.9 3 15 4.1 15 5.5V7"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="lp-success-box-text">
                            <span className="lp-success-label">Product</span>
                            <strong className="lp-success-value">{productName}</strong>
                        </div>
                    </div>
                </section>

                <div className="lp-success-actions">
                    <Link className="lp-success-btn is-primary" to="/">
                        Back to home
                    </Link>
                    <Link className="lp-success-btn is-secondary" to={landingPath}>
                        View product
                    </Link>
                </div>

                <p className="lp-success-note">
                    অর্ডার কনফার্মেশন SMS/কল পেতে কিছুক্ষণ অপেক্ষা করুন।
                </p>
            </main>
        </div>
    );
}
