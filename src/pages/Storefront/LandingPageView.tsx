import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiUrl, mediaUrl } from "../../config/api";
import {
    ensureCsrf,
    getCsrfToken,
    rememberCsrfToken,
    resetCsrf,
} from "../../services/csrfBootstrap";
import "./LandingPageView.css";

type LandingSection = {
    type: string;
    label?: string;
    is_enabled?: boolean;
    content?: Record<string, any>;
};

function sectionMap(sections: LandingSection[] = []) {
    return Object.fromEntries(
        sections
            .filter((section) => section?.is_enabled !== false)
            .map((section) => [section.type, section])
    ) as Record<string, LandingSection>;
}

function readCookie(name: string) {
    if (typeof document === "undefined") return "";
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "";
}

function tokenStorageKey(pageId: number | string) {
    return `fv_landing_checkout_${pageId}`;
}

function loadStylesheet(href: string, id: string) {
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

function loadScript(src: string, id: string) {
    return new Promise<void>((resolve) => {
        if (document.getElementById(id)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.id = id;
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });
}

async function landingFetch(path: string, init: RequestInit = {}) {
    const method = String(init.method || "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
        await ensureCsrf(true);
    }

    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (!headers.has("Content-Type") && init.body) {
        headers.set("Content-Type", "application/json");
    }
    headers.set("X-Requested-With", "XMLHttpRequest");
    const csrf = getCsrfToken();
    if (csrf) headers.set("X-XSRF-TOKEN", csrf);

    const response = await fetch(apiUrl(path), {
        ...init,
        headers,
        credentials: "include",
    });

    rememberCsrfToken(response.headers.get("X-XSRF-TOKEN"));

    if (response.status === 419) {
        resetCsrf();
        await ensureCsrf(true);
        const retryHeaders = new Headers(headers);
        const retryToken = getCsrfToken();
        if (retryToken) retryHeaders.set("X-XSRF-TOKEN", retryToken);
        return fetch(apiUrl(path), {
            ...init,
            headers: retryHeaders,
            credentials: "include",
        });
    }

    return response;
}

function money(value: number) {
    return `${Math.round(Number(value || 0)).toLocaleString("en-BD")}৳`;
}

export default function LandingPageView() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [quote, setQuote] = useState<any>(null);
    const [token, setToken] = useState("");
    const [lightbox, setLightbox] = useState<{ group: string; index: number } | null>(null);
    const incompleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const incompleteAbort = useRef<AbortController | null>(null);
    const orderFinished = useRef(false);
    const initiateCheckoutSent = useRef(false);

    const [orderState, setOrderState] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        quantity: 1,
        variant_id: "" as string | number,
        delivery_area: "inside_dhaka",
        submitting: false,
        message: "",
    });

    useEffect(() => {
        document.documentElement.classList.add("lp-active");
        document.body.classList.add("lp-active");
        loadStylesheet(
            "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&display=swap",
            "lp-hind-font"
        );
        loadStylesheet(
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css",
            "lp-fa"
        );
        loadStylesheet(
            "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css",
            "lp-swiper-css"
        );
        void loadScript(
            "https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js",
            "lp-swiper-js"
        );
        return () => {
            document.documentElement.classList.remove("lp-active");
            document.documentElement.classList.remove("modal-open");
            document.body.classList.remove("lp-active");
            document.body.classList.remove("modal-open");
        };
    }, []);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        landingFetch(`storefront/landing-pages/${encodeURIComponent(slug || "")}`)
            .then(async (response) => {
                const json = await response.json().catch(() => ({}));
                if (!response.ok) {
                    throw new Error(json?.message || "Landing page not found.");
                }
                if (!active) return;
                const data = json?.data || json;
                setPage(data);
                const defaultVariant =
                    data?.product?.variants?.find((row: any) => row.is_default) ||
                    data?.product?.variants?.[0];
                setOrderState((current) => ({
                    ...current,
                    variant_id: defaultVariant?.id || "",
                }));
                try {
                    const saved = localStorage.getItem(tokenStorageKey(data.id));
                    if (saved) setToken(saved);
                } catch {
                    // ignore
                }
            })
            .catch((exception) => {
                if (active) {
                    setError(exception?.message || "This landing page is unavailable.");
                    setPage(null);
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [slug]);

    const sections = useMemo(() => sectionMap(page?.sections || []), [page]);
    const theme = page?.theme || {};
    const product = page?.product;
    const hero = sections.hero?.content || {};
    const benefits = sections.benefits?.content || {};
    const promo = sections.promo?.content || {};
    const usage = sections.usage?.content || {};
    const reviews = sections.reviews?.content || {};
    const order = sections.order?.content || {};
    const footer = sections.footer?.content || {};

    const galleryImages: string[] = useMemo(() => {
        const gallery = Array.isArray(hero.gallery_images)
            ? hero.gallery_images.filter(Boolean)
            : [];
        if (gallery.length) return gallery;
        if (Array.isArray(product?.images) && product.images.length) {
            return product.images.filter(Boolean);
        }
        if (product?.thumbnail || product?.image) {
            return [product.thumbnail || product.image];
        }
        return [];
    }, [hero.gallery_images, product]);

    const reviewImages: string[] = Array.isArray(reviews.screenshots)
        ? reviews.screenshots.filter(Boolean)
        : [];

    const productOptions = useMemo(() => {
        if (product?.variants?.length) {
            return product.variants.map((variant: any) => ({
                id: variant.id,
                name: variant.name || product.name,
                image:
                    variant.image ||
                    product.thumbnail ||
                    product.image ||
                    product.images?.[0] ||
                    "",
                price: Number(variant.unit_price ?? variant.sale_price ?? variant.price ?? 0),
                regular_price: Number(variant.regular_price ?? variant.price ?? 0),
            }));
        }
        if (product) {
            return [
                {
                    id: "",
                    name: product.name,
                    image:
                        product.thumbnail ||
                        product.image ||
                        product.images?.[0] ||
                        "",
                    price: Number(product.unit_price ?? product.sale_price ?? product.price ?? 0),
                    regular_price: Number(product.regular_price ?? product.price ?? 0),
                },
            ];
        }
        return [];
    }, [product]);

    const selectedOption =
        productOptions.find(
            (row: any) => String(row.id || "") === String(orderState.variant_id || "")
        ) || productOptions[0];

    const unitPrice = Number(
        quote?.quote?.unit_price ?? selectedOption?.price ?? product?.unit_price ?? 0
    );
    const deliveryCharge = Number(quote?.quote?.delivery_charge ?? 0);
    const subtotal = Number(
        quote?.quote?.subtotal ?? unitPrice * Math.max(1, Number(orderState.quantity || 1))
    );
    const total = Number(quote?.quote?.total ?? subtotal + deliveryCharge);
    const asBool = (value: unknown, fallback = false) => {
        if (value === undefined || value === null || value === "") return fallback;
        if (typeof value === "boolean") return value;
        if (typeof value === "number") return value !== 0;
        const normalized = String(value).trim().toLowerCase();
        if (["1", "true", "yes", "on"].includes(normalized)) return true;
        if (["0", "false", "no", "off"].includes(normalized)) return false;
        return fallback;
    };
    const shippingFree =
        asBool(quote?.quote?.shipping_free, false) || asBool(order.free_shipping, false);
    const checkoutAvailable = Boolean(product?.is_published);

    useEffect(() => {
        const w = window as any;
        if (!page || typeof w.Swiper !== "function") return;
        const heroSwiper = galleryImages.length
            ? new w.Swiper("#heroSwiper", {
                  slidesPerView: 1,
                  spaceBetween: 12,
                  loop: galleryImages.length > 1,
                  autoplay: galleryImages.length > 1 ? { delay: 3500 } : false,
              })
            : null;
        const reviewSwiper = reviewImages.length
            ? new w.Swiper("#reviewSwiper", {
                  slidesPerView: 1.15,
                  spaceBetween: 14,
                  centeredSlides: true,
                  loop: reviewImages.length > 1,
              })
            : null;
        return () => {
            heroSwiper?.destroy?.(true, true);
            reviewSwiper?.destroy?.(true, true);
        };
    }, [page, galleryImages.length, reviewImages.length, loading]);

    useEffect(() => {
        if (!page?.tracking) return;
        const tracking = page.tracking;
        const w = window as any;
        w.dataLayer = w.dataLayer || [];

        if (tracking.meta_pixel_id && typeof w.fbq !== "function") {
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
            w.fbq("init", tracking.meta_pixel_id);
            w.fbq("track", "PageView");
        }

        if (tracking.meta_pixel_id && typeof w.fbq === "function" && page.product) {
            w.fbq("track", "ViewContent", {
                content_ids: [String(page.product.id)],
                content_name: page.product.name,
                content_type: "product",
                value: Number(page.product.unit_price || 0),
                currency: "BDT",
            });
        }
    }, [page]);

    const buildPayload = () => ({
        customer_name: orderState.name,
        name: orderState.name,
        customer_phone: orderState.phone,
        phone: orderState.phone,
        customer_email: orderState.email,
        email: orderState.email,
        address: orderState.address,
        quantity: orderState.quantity,
        variant_id: orderState.variant_id || undefined,
        delivery_area: orderState.delivery_area,
        token: token || undefined,
        fbp: readCookie("_fbp") || undefined,
        fbc: readCookie("_fbc") || undefined,
        ttp: readCookie("_ttp") || undefined,
        event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
    });

    const refreshQuote = async () => {
        if (!page?.id || orderFinished.current) return;
        try {
            const response = await landingFetch(
                `storefront/landing-pages/${page.id}/quote`,
                {
                    method: "POST",
                    body: JSON.stringify(buildPayload()),
                }
            );
            const json = await response.json().catch(() => ({}));
            if (response.ok) setQuote(json?.data || json);
        } catch {
            // best-effort
        }
    };

    const saveIncomplete = async () => {
        if (!page?.id || orderFinished.current) return;
        if (incompleteAbort.current) incompleteAbort.current.abort();
        incompleteAbort.current = new AbortController();
        try {
            const response = await landingFetch(
                `storefront/landing-pages/${page.id}/incomplete`,
                {
                    method: "POST",
                    signal: incompleteAbort.current.signal,
                    body: JSON.stringify(buildPayload()),
                }
            );
            const json = await response.json().catch(() => ({}));
            const draftToken = json?.data?.draft?.token;
            if (response.ok && draftToken) {
                setToken(draftToken);
                try {
                    localStorage.setItem(tokenStorageKey(page.id), draftToken);
                } catch {
                    // ignore
                }
            }
        } catch (exception: any) {
            if (exception?.name === "AbortError") return;
        }
    };

    const scheduleIncomplete = (delay = 650) => {
        if (!page?.id || orderFinished.current) return;
        if (incompleteTimer.current) clearTimeout(incompleteTimer.current);
        incompleteTimer.current = setTimeout(() => {
            void saveIncomplete();
        }, delay);
    };

    useEffect(() => {
        if (!page?.id) return;
        void refreshQuote();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page?.id, orderState.quantity, orderState.variant_id, orderState.delivery_area]);

    const trackInitiateCheckout = () => {
        if (initiateCheckoutSent.current) return;
        initiateCheckoutSent.current = true;
        try {
            const w = window as any;
            if (typeof w.fbq === "function") {
                w.fbq("track", "InitiateCheckout", {
                    content_ids: page?.product?.id ? [String(page.product.id)] : [],
                    content_type: "product",
                    value: unitPrice,
                    currency: "BDT",
                    num_items: Number(orderState.quantity || 1),
                });
            }
        } catch {
            // optional
        }
    };

    const scrollToOrder = () => {
        document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const submitOrder = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!page?.id || orderFinished.current || orderState.submitting) return;
        if (incompleteTimer.current) clearTimeout(incompleteTimer.current);
        if (incompleteAbort.current) incompleteAbort.current.abort();

        setOrderState((current) => ({ ...current, submitting: true, message: "" }));
        try {
            const response = await landingFetch(`storefront/landing-pages/${page.id}/order`, {
                method: "POST",
                body: JSON.stringify(buildPayload()),
            });
            const json = await response.json().catch(() => ({}));
            if (!response.ok || json?.success === false) {
                throw new Error(json?.message || "Order could not be placed.");
            }

            orderFinished.current = true;
            const data = json?.data || json;
            try {
                localStorage.removeItem(tokenStorageKey(page.id));
            } catch {
                // ignore
            }

            try {
                sessionStorage.setItem(
                    `fv_landing_success_${data.product_slug}`,
                    JSON.stringify({
                        ...data,
                        success_title: order.success_title || "অর্ডার সফল হয়েছে",
                        success_text:
                            order.success_text ||
                            "ধন্যবাদ। আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।",
                    })
                );
            } catch {
                // ignore
            }

            navigate(
                data.redirect_url ||
                    data.success_url ||
                    `/landing-success/${encodeURIComponent(data.product_slug || product?.slug || "order")}?token=${encodeURIComponent(data.checkout_token || token || "")}`
            );
        } catch (exception: any) {
            setOrderState((current) => ({
                ...current,
                submitting: false,
                message: exception?.message || "Order could not be placed.",
            }));
        }
    };

    if (loading) {
        return (
            <div className="lp-page" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
                Loading landing page…
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="lp-page" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
                <div style={{ textAlign: "center" }}>
                    <h1>Page unavailable</h1>
                    <p>{error || "This landing page is unavailable."}</p>
                    <Link to="/">Back to home</Link>
                </div>
            </div>
        );
    }

    const benefitItems: string[] = Array.isArray(benefits.items) ? benefits.items : [];
    const usageFeatures: string[] = Array.isArray(usage.features) ? usage.features : [];
    const avatars: string[] = Array.isArray(hero.customer_avatars)
        ? hero.customer_avatars.filter(Boolean).slice(0, 4)
        : [];
    const lightboxImages =
        lightbox?.group === "reviews" ? reviewImages : galleryImages;

    const themeStyle = {
        ["--primary" as any]: theme.primary || "#4f9000",
        ["--primary-dark" as any]: theme.primary_dark || "#3c7000",
        ["--secondary" as any]: theme.secondary || "#68b900",
        ["--accent" as any]: theme.accent || "#ffbd00",
        ["--accent-dark" as any]: theme.accent_dark || "#eaa900",
        ["--light-green" as any]: theme.light_green || "#efffd3",
        ["--cream" as any]: theme.cream || theme.background || "#fff8e4",
        ["--surface" as any]: theme.surface || "#ffffff",
        ["--text" as any]: theme.text || "#121212",
        ["--muted" as any]: theme.muted || "#6c6c6c",
        ["--border" as any]: theme.border || "#d7dce1",
        ["--content-width" as any]: "840px",
    } as React.CSSProperties;

    return (
        <div className="lp-page" style={themeStyle}>
            {sections.hero ? (
                <section className="lp-section hero-section">
                    <div className="lp-inner hero-content">
                        <div className="hero-brand">{hero.brand_name || "FACEVALY"}</div>
                        <h1 className="hero-title">
                            <span className="hero-title-1">{hero.title_1}</span>
                            <span className="hero-title-2">{hero.title_2}</span>
                            <span className="hero-title-3">
                                {hero.title_3 || page.title || product?.name}
                            </span>
                        </h1>
                        <div className="hero-stars">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <i key={index} className="fa-solid fa-star" />
                            ))}
                        </div>
                        <div className="promise-box">
                            {hero.promise_text}
                            <div className="refund-badge">{hero.refund_text}</div>
                        </div>
                        <div className="customer-heading">{hero.customer_heading}</div>
                        <div className="customer-pill">
                            {avatars.length ? (
                                <div className="customer-avatars">
                                    {avatars.map((avatar) => (
                                        <div className="customer-avatar" key={avatar}>
                                            <img src={mediaUrl(avatar)} alt="" width={40} height={40} />
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                            <div className="customer-badge">
                                ০২
                                <br />
                                লক্ষ+
                            </div>
                            <div className="customer-count">{hero.customer_count}</div>
                        </div>
                        <div className="hero-arrow" />
                        {galleryImages.length ? (
                            <div className="hero-gallery">
                                <div className="swiper heroSwiper" id="heroSwiper">
                                    <div className="swiper-wrapper">
                                        {galleryImages.map((image, index) => (
                                            <div className="swiper-slide" key={`${image}-${index}`}>
                                                <button
                                                    type="button"
                                                    className="hero-image-button"
                                                    onClick={() => {
                                                        document.documentElement.classList.add("modal-open");
                                                        document.body.classList.add("modal-open");
                                                        setLightbox({ group: "hero", index });
                                                    }}
                                                >
                                                    <img
                                                        src={mediaUrl(image)}
                                                        alt=""
                                                        className="hero-image"
                                                        width={830}
                                                        height={600}
                                                        loading={index === 0 ? "eager" : "lazy"}
                                                    />
                                                    <span className="image-plus">+</span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>
            ) : null}

            {sections.benefits ? (
                <section className="lp-section benefits-section">
                    <div className="lp-inner">
                        <div className="benefits-order-cta">
                            <button type="button" className="order-yellow-button" onClick={scrollToOrder}>
                                <i className="fa-solid fa-cart-shopping" /> অর্ডার করুন
                            </button>
                        </div>
                        <h2 className="benefits-title">{benefits.heading || product?.name}</h2>
                        <h3 className="benefits-subtitle">{benefits.subheading}</h3>
                        <svg className="benefit-arrow-svg" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5,5 Q20,15 15,35" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" />
                            <path d="M5,25 L15,35 L25,28" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <div className="nb-diagram">
                            <div className="nb-top-box">
                                <span className="nb-label">
                                    {benefits.left_top_label || "প্রকৃতির স্পর্শে"}
                                </span>
                                <span className="nb-label">
                                    {benefits.right_top_label || "শরীরের সুস্থতা"}
                                </span>
                            </div>
                            <div className="nb-bottle-wrapper">
                                {product?.thumbnail || product?.image ? (
                                    <img
                                        src={mediaUrl(product.thumbnail || product.image)}
                                        alt={product?.name || ""}
                                        className="nb-bottle-img"
                                        loading="lazy"
                                    />
                                ) : null}
                                <div className="nb-lab-badge">
                                    <i className="fa-solid fa-circle-check" />
                                    LAB
                                    <br />
                                    TESTED
                                </div>
                            </div>
                            <div className="nb-grid">
                                {[0, 3, 1, 4, 2, 5].map((itemIndex, position) => (
                                    <div
                                        key={`benefit-${itemIndex}`}
                                        className={`nb-item ${position % 2 === 0 ? "left" : "right"} nb-row-${position + 1}`}
                                    >
                                        <div className="nb-card">
                                            {benefitItems[itemIndex] || "সুবিধা এখানে লিখুন"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="nb-actions">
                            <button type="button" className="nb-btn-iso">
                                {benefits.certificate_text || benefits.badge || "ISO সার্টিফিকেট"}
                            </button>
                            <button type="button" className="nb-btn-order" onClick={scrollToOrder}>
                                অর্ডার করুন
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}

            {sections.promo && promo.image ? (
                <section className="lp-section promo-section">
                    <div className="lp-inner">
                        <div className="promo-card">
                            <img src={mediaUrl(promo.image)} alt={product?.name || ""} loading="lazy" />
                        </div>
                        <div className="center-order-button">
                            <button type="button" className="order-yellow-button" onClick={scrollToOrder}>
                                {promo.button_text || "অর্ডার করুন"}
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}

            {sections.usage ? (
                <section className="lp-section usage-section">
                    <div className="lp-inner">
                        <h2 className="usage-title">{usage.title}</h2>
                        <div className="usage-card">
                            <div className="usage-pin">
                                <i className="fa-solid fa-thumbtack" />
                            </div>
                            <div className="usage-copy">
                                {usage.text}{" "}
                                <span className="usage-highlight">{usage.highlight}</span>
                            </div>
                            <div className="usage-underline" />
                            <div className="usage-features">
                                {usageFeatures.slice(0, 3).map((feature) => (
                                    <div className="usage-feature" key={feature}>
                                        <i className="fa-solid fa-circle-check" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="center-order-button">
                            <button type="button" className="order-yellow-button" onClick={scrollToOrder}>
                                অর্ডার করুন
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}

            {sections.reviews && reviewImages.length ? (
                <section className="lp-section review-section">
                    <div className="lp-inner">
                        <div className="swiper reviewSwiper" id="reviewSwiper">
                            <div className="swiper-wrapper">
                                {reviewImages.map((image, index) => (
                                    <div className="swiper-slide" key={`${image}-${index}`}>
                                        <button
                                            type="button"
                                            className="review-button"
                                            onClick={() => {
                                                document.documentElement.classList.add("modal-open");
                                                document.body.classList.add("modal-open");
                                                setLightbox({ group: "reviews", index });
                                            }}
                                        >
                                            <img src={mediaUrl(image)} alt="" loading="lazy" />
                                            <span className="image-plus">+</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="review-order">
                            <button type="button" className="order-yellow-button" onClick={scrollToOrder}>
                                অর্ডার করুন
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}

            {sections.order ? (
                <section className="lp-section order-section" id="order">
                    <div className="lp-inner">
                        <div className="order-head">
                            <div className="order-icon">
                                <i className="fa-solid fa-cart-shopping" />
                            </div>
                            <h2>{order.title || "অর্ডার ফর্ম"}</h2>
                            <p>{order.subtitle}</p>
                        </div>

                        <form
                            className={`order-form-box ${checkoutAvailable ? "" : "is-checkout-disabled"}`}
                            onSubmit={submitOrder}
                            onInput={() => {
                                trackInitiateCheckout();
                                scheduleIncomplete();
                            }}
                            noValidate
                        >
                            {!checkoutAvailable ? (
                                <div className="checkout-unavailable" role="status">
                                    এই পণ্যটি বর্তমানে অর্ডার করা যাচ্ছে না।
                                </div>
                            ) : null}

                            <h3 className="products-title">Your Products</h3>
                            <div className="product-options">
                                {productOptions.map((option: any) => {
                                    const selected =
                                        String(option.id || "") ===
                                        String(orderState.variant_id || selectedOption?.id || "");
                                    return (
                                        <div
                                            key={option.id || option.name}
                                            className={`product-option ${selected ? "is-selected" : ""}`}
                                            onClick={() =>
                                                setOrderState((current) => ({
                                                    ...current,
                                                    variant_id: option.id,
                                                }))
                                            }
                                        >
                                            <span className="option-radio" />
                                            {option.image ? (
                                                <img
                                                    src={mediaUrl(option.image)}
                                                    alt=""
                                                    className="option-image"
                                                />
                                            ) : (
                                                <span className="option-image" />
                                            )}
                                            <div>
                                                <span className="option-name">{option.name}</span>
                                            </div>
                                            <div className="option-qty">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setOrderState((current) => ({
                                                            ...current,
                                                            quantity: Math.max(1, current.quantity - 1),
                                                        }));
                                                    }}
                                                >
                                                    −
                                                </button>
                                                <span>{orderState.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setOrderState((current) => ({
                                                            ...current,
                                                            quantity: Math.min(100, current.quantity + 1),
                                                        }));
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="option-price">
                                                {option.regular_price > option.price ? (
                                                    <small className="option-old-price">
                                                        {money(option.regular_price)}
                                                    </small>
                                                ) : null}
                                                <strong>{money(option.price)}</strong>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <fieldset className="checkout-fieldset" disabled={!checkoutAvailable}>
                                <div className="checkout-grid">
                                    <div className="checkout-left">
                                        <h3 className="checkout-title">Billing details</h3>
                                        <div className="form-row-2">
                                            <div className="form-group">
                                                <label>
                                                    {order.name_label || "আপনার পূর্ণ নাম"}{" "}
                                                    <span className="required">*</span>
                                                </label>
                                                <input
                                                    className="form-control"
                                                    required
                                                    minLength={3}
                                                    value={orderState.name}
                                                    onChange={(event) =>
                                                        setOrderState((current) => ({
                                                            ...current,
                                                            name: event.target.value,
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>
                                                    {order.phone_label || "ফোন নম্বর"}{" "}
                                                    <span className="required">*</span>
                                                </label>
                                                <input
                                                    className="form-control"
                                                    required
                                                    inputMode="numeric"
                                                    maxLength={11}
                                                    value={orderState.phone}
                                                    onChange={(event) =>
                                                        setOrderState((current) => ({
                                                            ...current,
                                                            phone: event.target.value
                                                                .replace(/\D/g, "")
                                                                .slice(0, 11),
                                                        }))
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>
                                                {order.address_label || "বাসার পূর্ণ ঠিকানা"}{" "}
                                                <span className="required">*</span>
                                            </label>
                                            <textarea
                                                className="form-control"
                                                required
                                                minLength={8}
                                                value={orderState.address}
                                                onChange={(event) =>
                                                    setOrderState((current) => ({
                                                        ...current,
                                                        address: event.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className="shipping-wrap">
                                            <div className="shipping-heading-row">
                                                <h3 className="shipping-heading">
                                                    {order.delivery_heading || "ডেলিভারি এলাকা"}
                                                </h3>
                                                {shippingFree ? (
                                                    <span className="shipping-free-badge">
                                                        <i className="fa-solid fa-truck-fast" /> ফ্রি শিপিং
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="delivery-grid">
                                                {(
                                                    quote?.quote?.delivery_areas || [
                                                        { key: "inside_dhaka", label: "Inside Dhaka", charge: 0 },
                                                        {
                                                            key: "outside_dhaka",
                                                            label: "Outside Dhaka",
                                                            charge: 0,
                                                        },
                                                    ]
                                                ).map((area: any) => (
                                                    <label className="delivery-card" key={area.key}>
                                                        <input
                                                            type="radio"
                                                            name="delivery_area"
                                                            value={area.key}
                                                            checked={orderState.delivery_area === area.key}
                                                            onChange={(event) =>
                                                                setOrderState((current) => ({
                                                                    ...current,
                                                                    delivery_area: event.target.value,
                                                                }))
                                                            }
                                                        />
                                                        <span className="delivery-left">
                                                            <span className="delivery-dot" />
                                                            <span>{area.label}</span>
                                                        </span>
                                                        <strong
                                                            className={`delivery-price ${shippingFree ? "is-free" : ""}`}
                                                        >
                                                            <span className="delivery-price-amount">
                                                                {shippingFree
                                                                    ? "ফ্রি"
                                                                    : money(area.charge || 0)}
                                                            </span>
                                                        </strong>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="checkout-right">
                                        <h3 className="order-summary-title">Your order</h3>
                                        <div className="summary-heading">
                                            <span>Product</span>
                                            <span>Subtotal</span>
                                        </div>
                                        <div className="summary-product-row">
                                            <div className="summary-image-wrap">
                                                {selectedOption?.image ? (
                                                    <img
                                                        src={mediaUrl(selectedOption.image)}
                                                        alt=""
                                                        className="summary-image"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="summary-name">
                                                {selectedOption?.name || product?.name}
                                            </div>
                                            <div className="summary-quantity">
                                                × {orderState.quantity}
                                            </div>
                                            <div className="summary-price">{money(subtotal)}</div>
                                        </div>
                                        <div className="summary-row">
                                            <span>Subtotal</span>
                                            <strong>{money(subtotal)}</strong>
                                        </div>
                                        <div className="summary-row">
                                            <span>Delivery</span>
                                            <strong>
                                                {shippingFree ? "ফ্রি" : money(deliveryCharge)}
                                            </strong>
                                        </div>
                                        <div className="summary-row total">
                                            <span>Total</span>
                                            <strong>{money(total)}</strong>
                                        </div>
                                        <div className="payment-box">
                                            <div className="payment-title">
                                                {order.payment_title || "ক্যাশ অন ডেলিভারি (COD)"}
                                            </div>
                                            <div className="payment-description">
                                                {order.payment_text ||
                                                    "পণ্য হাতে পেয়ে মূল্য পরিশোধ করবেন।"}
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            className="place-order-button"
                                            disabled={orderState.submitting || !checkoutAvailable}
                                        >
                                            <i className="fa-solid fa-cart-arrow-down" />
                                            <span>
                                                {orderState.submitting
                                                    ? "Submitting…"
                                                    : order.button_text || "অর্ডারটি প্লেস করুন"}
                                            </span>
                                            <strong>{money(total)}</strong>
                                        </button>
                                        {orderState.message ? (
                                            <div className="checkout-unavailable" style={{ marginTop: 12 }}>
                                                {orderState.message}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </fieldset>
                        </form>
                    </div>
                </section>
            ) : null}

            {sections.footer ? (
                <footer className="footer">
                    <div className="footer-heading">{footer.heading}</div>
                    <div className="footer-links">
                        {footer.whatsapp_number ? (
                            <a
                                href={`https://wa.me/${String(footer.whatsapp_number).replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="WhatsApp"
                            >
                                <i className="fa-brands fa-whatsapp" />
                            </a>
                        ) : null}
                        {footer.phone_number ? (
                            <a href={`tel:${footer.phone_number}`} aria-label="Phone">
                                <i className="fa-solid fa-phone" />
                            </a>
                        ) : null}
                    </div>
                    <div className="footer-copy">
                        {footer.copyright}
                        {footer.address ? (
                            <>
                                <br />
                                {footer.address}
                            </>
                        ) : null}
                    </div>
                </footer>
            ) : null}

            {footer.whatsapp_number ? (
                <a
                    href={`https://wa.me/${String(footer.whatsapp_number).replace(/\D/g, "")}?text=${encodeURIComponent(`আমি ${product?.name || page.title} অর্ডার করতে চাই`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="wa-live-chat"
                    aria-label="WhatsApp order"
                >
                    <i className="fa-brands fa-whatsapp" />
                </a>
            ) : null}

            {lightbox && lightboxImages[lightbox.index] ? (
                <div
                    className="image-modal"
                    onClick={() => {
                        setLightbox(null);
                        document.body.classList.remove("modal-open");
                        document.documentElement.classList.remove("modal-open");
                    }}
                >
                    <div className="modal-toolbar">
                        <span className="modal-counter">
                            {lightbox.index + 1} / {lightboxImages.length}
                        </span>
                        <button type="button" className="modal-close" aria-label="Close">
                            ×
                        </button>
                    </div>
                    <div className="modal-stage" onClick={(event) => event.stopPropagation()}>
                        <img
                            src={mediaUrl(lightboxImages[lightbox.index])}
                            alt=""
                            className="modal-image"
                            draggable={false}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}
