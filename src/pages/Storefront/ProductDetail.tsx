import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
    useLocation,
    useNavigate,
    useParams,
} from "react-router-dom";

import CategoryMenuDropdown
    from "../../components/frontend/category/CategoryMenuDropdown";

import productDetailService
    from "../../services/productDetailService";

import {
    persistProduct,
    readProductBootstrap,
} from "../../utils/productBootstrap";

import {
    ProductDetailSkeleton,
} from "../../components/frontend/ProductSkeletonGrid";

import {
    sanitizeEmbed,
    sanitizeRichText,
} from "../../utils/sanitizeHtml";

import storefrontService
    from "../../services/storefrontService";

import {
    useStorefrontToast,
} from "../../context/StorefrontToastContext";

import {
    useCart,
} from "../../context/CartContext";

import {
    useWishlist,
} from "../../context/WishlistContext";

import "./ProductDetail.css";


const money = (
    value
) =>
    Number(
        value || 0
    ).toLocaleString(
        "en-BD",
        {
            maximumFractionDigits: 2,
        }
    );


function Stars({
    rating = 0,
}) {
    const rounded =
        Math.round(
            Number(
                rating || 0
            )
        );

    return (
        <span className="fv-pd-stars">
            {[1, 2, 3, 4, 5].map(
                (
                    star
                ) => (
                    <i
                        key={star}
                        className={
                            star <= rounded
                                ? "fa-solid fa-star"
                                : "fa-regular fa-star"
                        }
                    />
                )
            )}
        </span>
    );
}


function ProductImage({
    src,
    alt,
    isVideo = false,
}) {
    const [
        failed,
        setFailed,
    ] =
        useState(false);

    useEffect(
        () => {
            setFailed(false);
        },
        [
            src,
            isVideo,
        ]
    );

    if (
        !src ||
        failed
    ) {
        return (
            <span className="fv-pd-image-fallback">
                <i className={isVideo ? "fa-solid fa-play" : "fa-regular fa-image"} />
            </span>
        );
    }

    if (isVideo) {
        return (
            <video
                src={src}
                controls
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
            />
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            draggable="false"
            onError={() =>
                setFailed(true)
            }
        />
    );
}


/*
|--------------------------------------------------------------------------
| DESKTOP IMAGE ZOOM
|--------------------------------------------------------------------------
|
| Marketplace-style hover magnifier: lens on the photo + enlarged preview
| beside it so shoppers can inspect labels, textures, and fine detail.
|
*/

const PRODUCT_ZOOM_FACTOR = 2.4;

function ProductMainImageZoom({
    src,
    alt,
    isVideo = false,
}) {
    const frameRef = useRef(null);

    const [
        failed,
        setFailed,
    ] = useState(false);

    const [
        active,
        setActive,
    ] = useState(false);

    const [
        origin,
        setOrigin,
    ] = useState({
        x: 50,
        y: 50,
    });

    const [
        lens,
        setLens,
    ] = useState({
        size: 120,
        left: 0,
        top: 0,
    });

    useEffect(() => {
        setFailed(false);
        setActive(false);
    }, [src, isVideo]);

    const updateFromPointer = useCallback((clientX, clientY) => {
        const frame = frameRef.current;

        if (!frame) {
            return;
        }

        const rect = frame.getBoundingClientRect();
        const width = rect.width || 1;
        const height = rect.height || 1;

        const x = Math.min(
            Math.max(clientX - rect.left, 0),
            width
        );
        const y = Math.min(
            Math.max(clientY - rect.top, 0),
            height
        );

        const size = Math.max(
            72,
            Math.min(width, height) / PRODUCT_ZOOM_FACTOR
        );

        setOrigin({
            x: (x / width) * 100,
            y: (y / height) * 100,
        });

        setLens({
            size,
            left: Math.min(
                Math.max(x - size / 2, 0),
                width - size
            ),
            top: Math.min(
                Math.max(y - size / 2, 0),
                height - size
            ),
        });
    }, []);

    if (!src || failed) {
        return (
            <div className="fv-pd-desktop-main-image">
                <span className="fv-pd-image-fallback">
                    <i className={isVideo ? "fa-solid fa-play" : "fa-regular fa-image"} />
                </span>
            </div>
        );
    }

    if (isVideo) {
        return (
            <div className="fv-pd-desktop-main-image fv-pd-desktop-main-image--video">
                <video
                    src={src}
                    controls
                    playsInline
                    preload="metadata"
                    onError={() => setFailed(true)}
                >
                    {alt}
                </video>
            </div>
        );
    }

    return (
        <div
            className={
                active
                    ? "fv-pd-desktop-main-image fv-pd-desktop-main-image--zoom"
                    : "fv-pd-desktop-main-image"
            }
        >
            <div
                className="fv-pd-zoom-frame"
                ref={frameRef}
                onMouseEnter={(event) => {
                    setActive(true);
                    updateFromPointer(event.clientX, event.clientY);
                }}
                onMouseMove={(event) => {
                    updateFromPointer(event.clientX, event.clientY);
                }}
                onMouseLeave={() => {
                    setActive(false);
                }}
            >
                <img
                    src={src}
                    alt={alt}
                    draggable="false"
                    onError={() => setFailed(true)}
                />

                {active && (
                    <span
                        className="fv-pd-zoom-lens"
                        style={{
                            width: lens.size,
                            height: lens.size,
                            transform: `translate(${lens.left}px, ${lens.top}px)`,
                        }}
                        aria-hidden="true"
                    />
                )}
            </div>

            {active && (
                <div
                    className="fv-pd-zoom-pane"
                    aria-hidden="true"
                >
                    <img
                        src={src}
                        alt=""
                        draggable="false"
                        style={{
                            transform: `scale(${PRODUCT_ZOOM_FACTOR})`,
                            transformOrigin: `${origin.x}% ${origin.y}%`,
                        }}
                    />
                </div>
            )}
        </div>
    );
}


function MobileInfoRow({
    label,
    summary,
    onClick,
}) {
    return (
        <section className="fv-pd-mobile-info-row">
            <button
                type="button"
                onClick={onClick}
            >
                <span>{label}</span>

                {summary && (
                    <small>
                        {summary}
                    </small>
                )}

                <i className="fa-solid fa-chevron-right" />
            </button>
        </section>
    );
}


function ProductReviewForm({
    product,
    slug,
    loginReturnPath,
    onSubmitted,
    showToast,
}) {
    const eligibility =
        product?.review_eligibility || {};

    const [
        rating,
        setRating,
    ] = useState(5);

    const [
        review,
        setReview,
    ] = useState("");

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    if (
        eligibility.requires_login
    ) {
        return (
            <div className="fv-pd-review-form fv-pd-review-form-login">
                <p>
                    Sign in to share your experience with this product.
                </p>

                <Link
                    to="/login"
                    state={{
                        from: loginReturnPath,
                    }}
                >
                    Sign in to review
                </Link>
            </div>
        );
    }

    if (
        eligibility.has_reviewed
    ) {
        return (
            <div className="fv-pd-review-form fv-pd-review-form-done">
                <p>
                    You already reviewed this product.
                </p>

                {eligibility.existing_review?.review ? (
                    <p className="fv-pd-review-form-existing">
                        {eligibility.existing_review.review}
                    </p>
                ) : null}
            </div>
        );
    }

    if (
        !eligibility.can_review
    ) {
        return null;
    }

    const submitReview =
        async (event) => {
            event.preventDefault();

            if (
                submitting
            ) {
                return;
            }

            setSubmitting(true);

            try {
                const response =
                    await productDetailService.submitReview(
                        slug,
                        {
                            rating,
                            review: review.trim(),
                            is_recommended:
                                rating >= 4,
                        }
                    );

                showToast(
                    response?.message
                    || "Review submitted.",
                    "success"
                );

                setReview("");

                await onSubmitted();
            } catch (
                exception
            ) {
                showToast(
                    exception?.message
                    || "Review could not be submitted.",
                    "error"
                );
            } finally {
                setSubmitting(false);
            }
        };

    return (
        <form
            className="fv-pd-review-form"
            onSubmit={submitReview}
        >
            <strong>
                Write a review
            </strong>

            <div className="fv-pd-review-form-stars">
                <span>
                    Your rating
                </span>

                <div>
                    {[1, 2, 3, 4, 5].map(
                        (star) => (
                            <button
                                key={star}
                                type="button"
                                className={
                                    star <= rating
                                        ? "active"
                                        : ""
                                }
                                aria-label={`Rate ${star} star`}
                                onClick={() =>
                                    setRating(
                                        star
                                    )
                                }
                            >
                                <i className="fa-solid fa-star" />
                            </button>
                        )
                    )}
                </div>
            </div>

            <label
                className="fv-pd-review-form-field"
                htmlFor="fv-pd-review-text"
            >
                Your review
            </label>

            <textarea
                id="fv-pd-review-text"
                rows={4}
                maxLength={2000}
                placeholder="Tell others what you liked or did not like about this product."
                value={review}
                onChange={(event) =>
                    setReview(
                        event.target.value
                    )
                }
            />

            <button
                type="submit"
                disabled={
                    submitting
                    || rating < 1
                }
            >
                {submitting
                    ? "Submitting..."
                    : "Submit review"}
            </button>
        </form>
    );
}


function applyProductDefaults(data, setters) {
    const {
        setProduct,
        setSelectedVariantId,
        setSelectedAttributes,
        setQuantity,
        setActiveImageIndex,
    } = setters;

    setProduct(data);

    const variants = Array.isArray(data?.variants)
        ? data.variants
        : [];

    const defaultVariant =
        variants.find(
            (variant) =>
                Number(variant.id)
                === Number(data.default_variant_id)
        )
        || variants.find(
            (variant) => variant.is_default === true
        )
        || variants.find(
            (variant) => variant.is_active !== false
        )
        || variants[0]
        || null;

    setSelectedVariantId(defaultVariant?.id ?? null);

    const values = {};

    defaultVariant?.attributes?.forEach((attribute) => {
        values[attribute.attribute_id] = attribute.value_id;
    });

    setSelectedAttributes(values);
    setQuantity(1);
    setActiveImageIndex(0);
}


export default function ProductDetail() {
    const {
        slug,
    } =
        useParams();

    const navigate =
        useNavigate();

    const location =
        useLocation();

    const {
        showToast,
    } =
        useStorefrontToast();

    const {
        itemCount,
        addToCart: addProductToCart,
    } =
        useCart();

    const {
        toggleWishlist,
        isInWishlist,
        mutating: wishlistBusy,
    } =
        useWishlist();

    const initialProduct =
        useMemo(
            () => readProductBootstrap(slug),
            [slug]
        );

    const [
        product,
        setProduct,
    ] =
        useState(initialProduct);

    const [
        loading,
        setLoading,
    ] =
        useState(!initialProduct);

    const [
        error,
        setError,
    ] =
        useState("");

    const [
        quantity,
        setQuantity,
    ] =
        useState(1);

    const [
        selectedAttributes,
        setSelectedAttributes,
    ] =
        useState({});

    const [
        selectedVariantId,
        setSelectedVariantId,
    ] =
        useState(null);

    const [
        busy,
        setBusy,
    ] =
        useState(false);

    const [
        wishlistAnimating,
        setWishlistAnimating,
    ] =
        useState(false);

    const wishlistAnimTimer =
        useRef(null);

    const [
        activeImageIndex,
        setActiveImageIndex,
    ] =
        useState(0);

    const [
        optionsOpen,
        setOptionsOpen,
    ] =
        useState(false);

    const [
        specsOpen,
        setSpecsOpen,
    ] =
        useState(false);

    const [
        descriptionExpanded,
        setDescriptionExpanded,
    ] =
        useState(false);

    const touchStartX =
        useRef(null);

    const reviewRef =
        useRef(null);

    const reloadProduct =
        useCallback(
            async () => {
                const response =
                    await productDetailService.show(
                        slug
                    );

                const data =
                    response.data;

                applyProductDefaults(
                    data,
                    {
                        setProduct,
                        setSelectedVariantId,
                        setSelectedAttributes,
                        setQuantity,
                        setActiveImageIndex,
                    }
                );

                persistProduct(
                    slug,
                    data
                );
            },
            [
                slug,
            ]
        );


    useEffect(
        () => {
            document
                .getElementById(
                    "product-static-preview"
                )
                ?.remove();
        },
        []
    );

    /*
    |--------------------------------------------------------------------------
    | LOAD PRODUCT
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            let active =
                true;

            const cached =
                readProductBootstrap(slug);

            if (cached) {
                applyProductDefaults(
                    cached,
                    {
                        setProduct,
                        setSelectedVariantId,
                        setSelectedAttributes,
                        setQuantity,
                        setActiveImageIndex,
                    }
                );
                setLoading(false);
            } else {
                setLoading(true);
            }

            setError("");

            const refreshProduct =
                () => {
                    productDetailService
                        .show(slug)
                        .then(
                            (
                                response
                            ) => {
                                if (!active) {
                                    return;
                                }

                                const data =
                                    response.data;

                                applyProductDefaults(
                                    data,
                                    {
                                        setProduct,
                                        setSelectedVariantId,
                                        setSelectedAttributes,
                                        setQuantity,
                                        setActiveImageIndex,
                                    }
                                );

                                persistProduct(
                                    slug,
                                    data
                                );
                            }
                        )
                        .catch(
                            (
                                exception
                            ) => {
                                if (
                                    active
                                    && !cached
                                ) {
                                    setError(
                                        exception.message ||
                                        "Product could not be loaded."
                                    );
                                }
                            }
                        )
                        .finally(
                            () => {
                                if (active) {
                                    setLoading(false);
                                }
                            }
                        );
                };

            if (cached) {
                const timer =
                    window.setTimeout(
                        refreshProduct,
                        3000
                    );

                return () => {
                    active = false;
                    window.clearTimeout(timer);
                };
            }

            refreshProduct();

            return () => {
                active = false;
            };
        },
        [
            slug,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | SELECTED VARIANT / PRICE
    |--------------------------------------------------------------------------
    */

    const selectedVariant =
        useMemo(
            () =>
                product?.variants?.find(
                    (
                        variant
                    ) =>
                        Number(
                            variant.id
                        )
                        ===
                        Number(
                            selectedVariantId
                        )
                )
                ||
                null,
            [
                product,
                selectedVariantId,
            ]
        );


    const regularPrice =
        Number(
            selectedVariant?.regular_price
            ??
            product?.regular_price
            ??
            0
        );


    const price =
        Number(
            selectedVariant?.price
            ??
            product?.price
            ??
            0
        );


    const discount =
        regularPrice > 0 &&
        price < regularPrice

            ? Math.round(
                (
                    (
                        regularPrice -
                        price
                    )
                    /
                    regularPrice
                )
                *
                100
            )

            : 0;


    const savingAmount =
        Math.max(
            0,
            regularPrice -
            price
        );


    const inStock =
        selectedVariant

            ? (
                !selectedVariant.track_stock
                ||
                Number(
                    selectedVariant.stock_quantity
                )
                >
                0
            )

            : Boolean(
                product?.in_stock
            );


    const maxQuantity =
        selectedVariant

            ? (
                selectedVariant.track_stock
                    ? Math.max(
                        0,
                        Number(
                            selectedVariant.stock_quantity
                            ||
                            0
                        )
                    )
                    : null
            )

            : (
                product?.track_stock
                &&
                !product?.pre_order_enabled
                    ? Math.max(
                        0,
                        Number(
                            product?.stock_quantity
                            ||
                            0
                        )
                    )
                    : null
            );


    /*
    |--------------------------------------------------------------------------
    | GALLERY
    |--------------------------------------------------------------------------
    */

    const galleryImages =
        useMemo(
            () => {
                const rows =
                    Array.isArray(
                        product?.images
                    )
                        ? product.images.map(
                            (
                                image
                            ) => {
                                const src =
                                    image.url
                                    || image.image
                                    || null;

                                const isVideo =
                                    Boolean(
                                        image.is_video
                                        || image.media_type === "video"
                                    )
                                    || /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(
                                        String(src || "")
                                    );

                                return {
                                    ...image,
                                    url: src,
                                    thumbnail:
                                        image.thumbnail
                                        || src,
                                    alt:
                                        image.alt
                                        || product?.name
                                        || "Product",
                                    is_video: isVideo,
                                };
                            }
                        )
                        : [];

                if (
                    selectedVariant?.image &&
                    !rows.some(
                        (
                            image
                        ) =>
                            image.url ===
                            selectedVariant.image
                    )
                ) {
                    rows.unshift({
                        id:
                            `variant-${selectedVariant.id}`,

                        url:
                            selectedVariant.image,

                        thumbnail:
                            selectedVariant.image,

                        alt:
                            product?.name ||
                            "Product",
                    });
                }

                if (
                    rows.length ===
                    0
                    && (product?.cover_image || product?.image)
                ) {
                    const cover =
                        product.cover_image
                        || product.image;

                    rows.push({
                        id: "cover",
                        url: cover,
                        thumbnail: cover,
                        alt:
                            product?.name
                            || "Product",
                    });
                }

                if (
                    rows.length ===
                    0
                ) {
                    rows.push({
                        id:
                            "placeholder",

                        url:
                            null,

                        thumbnail:
                            null,

                        alt:
                            product?.name ||
                            "Product",
                    });
                }

                return rows;
            },
            [
                product,
                selectedVariant,
            ]
        );


    useEffect(
        () => {
            setActiveImageIndex(0);
        },
        [
            selectedVariantId,
        ]
    );


    const activeImage =
        galleryImages[
            activeImageIndex
        ]
        ||
        galleryImages[0];


    /*
    |--------------------------------------------------------------------------
    | VARIANT RESOLUTION
    |--------------------------------------------------------------------------
    */

    const resolveVariant = (
        nextAttributes
    ) => {
        if (
            !product?.variants?.length
        ) {
            return null;
        }

        const attributeIds =
            Object.keys(
                nextAttributes
            );

        return (
            product.variants.find(
                (
                    variant
                ) =>
                    attributeIds.every(
                        (
                            attributeId
                        ) => {
                            const row =
                                variant.attributes?.find(
                                    (
                                        attribute
                                    ) =>
                                        Number(
                                            attribute.attribute_id
                                        )
                                        ===
                                        Number(
                                            attributeId
                                        )
                                );

                            return (
                                Number(
                                    row?.value_id
                                )
                                ===
                                Number(
                                    nextAttributes[
                                        attributeId
                                    ]
                                )
                            );
                        }
                    )
            )
            ||
            null
        );
    };


    const changeAttribute = (
        attributeId,
        valueId
    ) => {
        const next = {
            ...selectedAttributes,

            [attributeId]:
                valueId,
        };

        const variant =
            resolveVariant(next);

        if (variant) {
            setSelectedAttributes(next);

            setSelectedVariantId(
                variant.id
            );

            setQuantity(1);

            return;
        }

        showToast(
            "This variant combination is not available.",
            "warning"
        );
    };


    const selectedOptionsText =
        selectedVariant?.attributes
            ?.map(
                (
                    attribute
                ) =>
                    attribute.value
            )
            .filter(Boolean)
            .join(", ")
        ||
        (
            product?.has_variants
                ? "Select options"
                : "Default"
        );


    const specificationSummary =
        (
            product?.specifications
            ||
            []
        )
            .slice(0, 2)
            .map(
                (
                    row
                ) =>
                    row.value
            )
            .filter(Boolean)
            .join(", ");


    /*
    |--------------------------------------------------------------------------
    | CART / BUY NOW
    |--------------------------------------------------------------------------
    */

    const handleAddToCart =
        async () => {
            if (
                !product ||
                busy ||
                !inStock
            ) {
                return;
            }

            if (
                product.has_variants &&
                !selectedVariant
            ) {
                setOptionsOpen(true);

                showToast(
                    "Please select an available product option.",
                    "warning"
                );

                return;
            }

            try {
                setBusy(true);

                const response =
                    await addProductToCart({
                        product_id:
                            product.id,

                        variant_id:
                            selectedVariant?.id ??
                            null,

                        quantity,
                    });

                showToast(
                    response?.message ||
                    "Added to cart."
                );
            } catch (
                exception
            ) {
                const firstValidationError =
                    exception?.response?.data?.errors
                        ? Object.values(
                            exception.response.data.errors
                        )
                            .flat()
                            .find(Boolean)
                        : null;

                showToast(
                    firstValidationError ||
                    exception?.response?.data?.message ||
                    exception?.data?.message ||
                    exception?.message ||
                    "Could not add to cart.",
                    "error"
                );
            } finally {
                setBusy(false);
            }
        };


    const buyNow =
        async () => {
            if (!product) {
                return;
            }

            try {
                setBusy(true);

                const response =
                    await storefrontService.startBuyNow({
                        product_id:
                            product.id,

                        variant_id:
                            selectedVariant?.id ||
                            null,

                        quantity,
                    });

                const token =
                    response?.data
                        ?.checkout_token;

                if (!token) {
                    throw new Error(
                        "Checkout token was not returned."
                    );
                }

                navigate(
                    `/checkout?token=${encodeURIComponent(
                        token
                    )}`
                );
            } catch (
                exception
            ) {
                showToast(
                    exception.message ||
                    "Checkout could not be started.",
                    "error"
                );
            } finally {
                setBusy(false);
            }
        };


    /*
    |--------------------------------------------------------------------------
    | AUXILIARY ACTIONS
    |--------------------------------------------------------------------------
    */

    const wishlist =
        async () => {
            if (!product?.id) {
                return;
            }

            const wasInWishlist =
                isInWishlist(
                    product.id
                );

            try {
                const response =
                    await toggleWishlist(
                        product.id
                    );

                if (!wasInWishlist) {
                    setWishlistAnimating(true);

                    if (wishlistAnimTimer.current) {
                        window.clearTimeout(
                            wishlistAnimTimer.current
                        );
                    }

                    wishlistAnimTimer.current =
                        window.setTimeout(
                            () => {
                                setWishlistAnimating(false);
                            },
                            600
                        );
                }

                showToast(
                    response?.message
                    || (
                        wasInWishlist
                            ? "Removed from wishlist."
                            : "Added to wishlist."
                    )
                );
            } catch (
                exception
            ) {
                showToast(
                    exception?.message
                    || "Wishlist could not be updated.",
                    "error"
                );
            }
        };


    const share =
        async () => {
            const url =
                window.location.href;

            try {
                if (
                    navigator.share
                ) {
                    await navigator.share({
                        title:
                            product?.name ||
                            "Facevaly Product",

                        url,
                    });

                    return;
                }

                if (
                    navigator.clipboard
                    &&
                    window.isSecureContext
                ) {
                    await navigator.clipboard
                        .writeText(url);

                    showToast(
                        "Product link copied."
                    );

                    return;
                }

                const textarea =
                    document.createElement(
                        "textarea"
                    );

                textarea.value =
                    url;

                textarea.setAttribute(
                    "readonly",
                    ""
                );

                textarea.style.position =
                    "fixed";

                textarea.style.left =
                    "-9999px";

                document.body.appendChild(
                    textarea
                );

                textarea.select();

                document.execCommand(
                    "copy"
                );

                document.body.removeChild(
                    textarea
                );

                showToast(
                    "Product link copied."
                );
            } catch (
                exception
            ) {
                if (
                    exception?.name ===
                    "AbortError"
                ) {
                    return;
                }

                showToast(
                    "Could not share this product.",
                    "error"
                );
            }
        };


    const visitStore =
        () => {
            if (
                product?.vendor?.slug
            ) {
                navigate(
                    `/store/${encodeURIComponent(
                        product.vendor.slug
                    )}`
                );

                return;
            }

            navigate("/shop");
        };


    /*
    |--------------------------------------------------------------------------
    | MOBILE IMAGE SWIPE
    |--------------------------------------------------------------------------
    */

    const nextImage =
        () => {
            setActiveImageIndex(
                (
                    current
                ) =>
                    (
                        current +
                        1
                    )
                    %
                    galleryImages.length
            );
        };


    const previousImage =
        () => {
            setActiveImageIndex(
                (
                    current
                ) =>
                    (
                        current -
                        1 +
                        galleryImages.length
                    )
                    %
                    galleryImages.length
            );
        };


    const onTouchStart =
        (
            event
        ) => {
            touchStartX.current =
                event.touches?.[0]
                    ?.clientX
                ??
                null;
        };


    const onTouchEnd =
        (
            event
        ) => {
            if (
                touchStartX.current ===
                null
            ) {
                return;
            }

            const endX =
                event.changedTouches?.[0]
                    ?.clientX
                ??
                touchStartX.current;

            const diff =
                endX -
                touchStartX.current;

            touchStartX.current =
                null;

            if (
                Math.abs(diff) <
                40
            ) {
                return;
            }

            if (
                diff < 0
            ) {
                nextImage();

                return;
            }

            previousImage();
        };


    const scrollToReviews =
        () => {
            reviewRef.current
                ?.scrollIntoView({
                    behavior:
                        "smooth",

                    block:
                        "start",
                });
        };


    /*
    |--------------------------------------------------------------------------
    | PAGE STATES
    |--------------------------------------------------------------------------
    */

    if (loading && !product) {
        return (
            <ProductDetailSkeleton />
        );
    }


    if (
        error ||
        !product
    ) {
        return (
            <div className="fv-pd-page-state error">
                <i className="fa-solid fa-circle-exclamation" />

                {error ||
                    "Product not found."}
            </div>
        );
    }


    const descriptionVideo =
        product.video_embed ? (
            <div
                className="fv-pd-video"

                dangerouslySetInnerHTML={{
                    __html: sanitizeEmbed(
                        product.video_embed
                    ),
                }}
            />
        ) : null;


    return (
        <div className="fv-pd-page">

            {/* ============================================================
                DESKTOP VIEW
            ============================================================ */}

            <div className="fv-pd-desktop">

                <CategoryMenuDropdown />

                <div className="fv-pd-desktop-container">

                    {/* Breadcrumbs */}

                    <nav className="fv-pd-breadcrumbs">

                        {product.breadcrumbs?.map(
                            (
                                crumb,
                                index
                            ) => (
                                <React.Fragment
                                    key={`${crumb.name}-${index}`}
                                >
                                    {index > 0 && (
                                        <i className="fa-solid fa-chevron-right" />
                                    )}

                                    {crumb.slug ? (
                                        <Link
                                            to={`/category/${crumb.slug}`}
                                        >
                                            {crumb.name}
                                        </Link>
                                    ) : (
                                        <span>
                                            {crumb.name}
                                        </span>
                                    )}
                                </React.Fragment>
                            )
                        )}

                    </nav>


                    {/* Main card */}

                    <section className="fv-pd-desktop-main">

                        {/* Gallery */}

                        <div className="fv-pd-desktop-gallery">

                            <ProductMainImageZoom
                                src={
                                    activeImage?.url
                                }
                                alt={
                                    product.name
                                }
                                isVideo={Boolean(activeImage?.is_video)}
                            />


                            {galleryImages.length > 1 && (

                                <div className="fv-pd-desktop-thumbnails">

                                    {galleryImages.map(
                                        (
                                            image,
                                            index
                                        ) => (
                                            <button
                                                type="button"

                                                className={
                                                    index ===
                                                    activeImageIndex
                                                        ? "active"
                                                        : ""
                                                }

                                                onClick={() =>
                                                    setActiveImageIndex(
                                                        index
                                                    )
                                                }

                                                key={
                                                    image.id ||
                                                    index
                                                }
                                            >
                                                {image.is_video ? (
                                                    <span className="fv-pd-thumb-video">
                                                        <video
                                                            src={image.url}
                                                            muted
                                                            playsInline
                                                            preload="metadata"
                                                        />
                                                        <i className="fa-solid fa-play" />
                                                    </span>
                                                ) : (
                                                    <ProductImage
                                                        src={
                                                            image.thumbnail ||
                                                            image.url
                                                        }
                                                        alt={
                                                            image.alt ||
                                                            product.name
                                                        }
                                                    />
                                                )}
                                            </button>
                                        )
                                    )}

                                </div>
                            )}

                        </div>


                        {/* Purchase information */}

                        <div className="fv-pd-desktop-info">

                            <div className="fv-pd-brand-line">
                                {product.brand && (
                                    <>
                                        Brand:

                                        <Link
                                            to={`/brands/${product.brand.slug}`}
                                        >
                                            {product.brand.name}
                                        </Link>
                                    </>
                                )}
                            </div>


                            <div className="fv-pd-title-row">

                                <h1>
                                    {product.name}
                                </h1>


                                <div>
                                    <button
                                        type="button"
                                        className="fv-pd-desktop-icon-btn"
                                        aria-label="Share product"
                                        onClick={share}
                                    >
                                        <i className="fa-solid fa-share-nodes" aria-hidden="true" />
                                    </button>

                                    <button
                                        type="button"
                                        className={[
                                            "fv-pd-desktop-icon-btn",
                                            product && isInWishlist(product.id)
                                                ? "is-wishlisted"
                                                : "",
                                            wishlistAnimating
                                                ? "is-wishlist-animating"
                                                : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onClick={wishlist}
                                        disabled={wishlistBusy}
                                        aria-label={
                                            product && isInWishlist(product.id)
                                                ? "Remove from wishlist"
                                                : "Add to wishlist"
                                        }
                                    >
                                        <i
                                            className={
                                                product && isInWishlist(product.id)
                                                    ? "fa-solid fa-heart"
                                                    : "fa-regular fa-heart"
                                            }
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>

                            </div>


                            <div className="fv-pd-desktop-rating">

                                <Stars
                                    rating={
                                        product.rating?.average
                                    }
                                />

                                <button
                                    type="button"
                                    onClick={scrollToReviews}
                                >
                                    Ratings {
                                        product.rating?.count ||
                                        0
                                    }
                                </button>

                                <span>
                                    {product.sold_count ||
                                        0} sold
                                </span>

                            </div>


                            <div className="fv-pd-price-panel">

                                <strong>
                                    ৳ {money(price)}
                                </strong>

                                {discount > 0 && (
                                    <div>
                                        <del>
                                            ৳ {money(regularPrice)}
                                        </del>

                                        <span>
                                            -{discount}%
                                        </span>
                                    </div>
                                )}

                            </div>


                            {product.promotions?.length > 0 && (

                                <div className="fv-pd-desktop-promo">

                                    <span>
                                        Promotions
                                    </span>

                                    <strong>
                                        {product.promotions[0].name}
                                    </strong>

                                </div>
                            )}


                            {/* Variants */}

                            {product.attribute_groups?.map(
                                (
                                    attribute
                                ) => (
                                    <div
                                        className="fv-pd-desktop-option-row"
                                        key={
                                            attribute.id
                                        }
                                    >
                                        <span>
                                            {attribute.name}
                                        </span>

                                        <div>
                                            {attribute.values.map(
                                                (
                                                    value
                                                ) => (
                                                    <button
                                                        type="button"

                                                        className={
                                                            Number(
                                                                selectedAttributes[
                                                                    attribute.id
                                                                ]
                                                            )
                                                            ===
                                                            Number(
                                                                value.id
                                                            )
                                                                ? "active"
                                                                : ""
                                                        }

                                                        onClick={() =>
                                                            changeAttribute(
                                                                attribute.id,
                                                                value.id
                                                            )
                                                        }

                                                        key={
                                                            value.id
                                                        }
                                                    >
                                                        {value.color_code && (
                                                            <i
                                                                style={{
                                                                    background:
                                                                        value.color_code,
                                                                }}
                                                            />
                                                        )}

                                                        {value.value}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            )}


                            {/* Quantity */}

                            <div className="fv-pd-desktop-qty-row">

                                <span>
                                    Quantity
                                </span>

                                <div className="fv-pd-qty-control">

                                    <button
                                        type="button"

                                        disabled={
                                            quantity <= 1
                                        }

                                        onClick={() =>
                                            setQuantity(
                                                Math.max(
                                                    1,
                                                    quantity - 1
                                                )
                                            )
                                        }
                                    >
                                        −
                                    </button>

                                    <strong>
                                        {quantity}
                                    </strong>

                                    <button
                                        type="button"

                                        disabled={
                                            maxQuantity !==
                                                null
                                            &&
                                            quantity >=
                                                maxQuantity
                                        }

                                        onClick={() =>
                                            setQuantity(
                                                quantity + 1
                                            )
                                        }
                                    >
                                        +
                                    </button>

                                </div>

                                {maxQuantity !== null && (
                                    <small>
                                        {maxQuantity} available
                                    </small>
                                )}

                            </div>


                            {!inStock && (
                                <div className="fv-pd-out-stock">
                                    Out of stock
                                </div>
                            )}


                            <div className="fv-pd-desktop-actions">

                                <button
                                    type="button"
                                    className="buy"
                                    disabled={
                                        busy ||
                                        !inStock
                                    }
                                    onClick={buyNow}
                                >
                                    Buy Now
                                </button>

                                <button
                                    type="button"
                                    className="cart"
                                    disabled={
                                        busy ||
                                        !inStock
                                    }
                                    onClick={handleAddToCart}
                                >
                                    <i className="fa-solid fa-cart-plus" />
                                    Add to Cart
                                </button>

                            </div>

                        </div>


                        {/* Side panel */}

                        <aside className="fv-pd-desktop-side">

                            <section>

                                <h3>
                                    Delivery Options
                                    <i className="fa-regular fa-circle-question" />
                                </h3>

                                <div className="fv-pd-side-line">
                                    <i className="fa-solid fa-location-dot" />

                                    <span>
                                        {product.delivery?.location ||
                                            product.vendor?.location ||
                                            "Bangladesh"}
                                    </span>
                                </div>

                                <div className="fv-pd-side-line">
                                    <i className="fa-solid fa-truck-fast" />

                                    <span>
                                        <strong>
                                            {product.delivery?.label}
                                        </strong>

                                        <small>
                                            {product.delivery?.charge_label}
                                        </small>
                                    </span>
                                </div>

                                {product.delivery?.cash_on_delivery && (
                                    <div className="fv-pd-side-line">
                                        <i className="fa-solid fa-money-bill-wave" />
                                        <span>
                                            Cash on Delivery Available
                                        </span>
                                    </div>
                                )}

                            </section>


                            <section>

                                <h3>
                                    Return &amp; Warranty
                                </h3>

                                <div className="fv-pd-side-line">
                                    <i className="fa-solid fa-rotate-left" />
                                    <span>
                                        {product.return_policy}
                                    </span>
                                </div>

                                <div className="fv-pd-side-line">
                                    <i className="fa-solid fa-shield-halved" />
                                    <span>
                                        {product.warranty_label}
                                    </span>
                                </div>

                            </section>


                            <section className="fv-pd-seller-card">

                                <span>
                                    Sold by
                                </span>

                                <div className="fv-pd-seller-head">

                                    <div className="fv-pd-seller-logo">
                                        {product.vendor?.logo ? (
                                            <img
                                                src={product.vendor.logo}
                                                alt=""
                                            />
                                        ) : (
                                            <i className="fa-solid fa-store" />
                                        )}
                                    </div>

                                    <strong>
                                        {product.vendor?.name ||
                                            "Seller"}
                                    </strong>

                                </div>


                                <div className="fv-pd-seller-metrics">

                                    <div>
                                        <span>
                                            Positive Seller Ratings
                                        </span>

                                        <strong>
                                            {product.vendor?.positive_seller_rating !== null
                                                && product.vendor?.positive_seller_rating !== undefined
                                                ? `${product.vendor.positive_seller_rating}%`
                                                : "—"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Reviews
                                        </span>

                                        <strong>
                                            {product.vendor?.vendor_review_count ||
                                                0}
                                        </strong>
                                    </div>

                                </div>


                                <div className="fv-pd-seller-actions">

                                    <button
                                        type="button"
                                        onClick={visitStore}
                                    >
                                        Go to Store
                                    </button>

                                </div>

                            </section>

                        </aside>

                    </section>


                    {/* Description */}

                    {(product.short_description ||
                        product.long_description ||
                        product.video_embed) && (

                        <section className="fv-pd-desktop-section">

                            <h2>
                                Product details of {product.name}
                            </h2>

                            <div
                                className={
                                    descriptionExpanded
                                        ? "fv-pd-description expanded"
                                        : "fv-pd-description"
                                }
                            >
                                {product.video_position ===
                                    "before_description"
                                    &&
                                    descriptionVideo}

                                {product.short_description && (
                                    <div
                                        className="fv-pd-rich-text"
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizeRichText(
                                                product.short_description
                                            ),
                                        }}
                                    />
                                )}

                                {product.long_description && (
                                    <div
                                        className="fv-pd-rich-text"
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizeRichText(
                                                product.long_description
                                            ),
                                        }}
                                    />
                                )}

                                {(
                                    !product.video_position ||
                                    product.video_position ===
                                    "after_description"
                                ) && descriptionVideo}
                            </div>

                            <button
                                type="button"
                                className="fv-pd-view-more"
                                onClick={() =>
                                    setDescriptionExpanded(
                                        (
                                            current
                                        ) =>
                                            !current
                                    )
                                }
                            >
                                {descriptionExpanded
                                    ? "VIEW LESS"
                                    : "VIEW MORE"}
                            </button>

                        </section>
                    )}


                    {/* Reviews */}

                    <section
                        ref={reviewRef}
                        className="fv-pd-desktop-section fv-pd-reviews-section"
                    >

                        <h2>
                            Ratings &amp; Reviews of {product.name}
                        </h2>

                        <div className="fv-pd-review-summary">

                            <div>
                                <strong>
                                    {Number(
                                        product.rating?.average ||
                                        0
                                    ).toFixed(1)}

                                    <small>
                                        /5
                                    </small>
                                </strong>

                                <Stars
                                    rating={
                                        product.rating?.average
                                    }
                                />

                                <span>
                                    {product.rating?.count ||
                                        0} Ratings
                                </span>
                            </div>

                            <div className="fv-pd-review-bars">

                                {[5, 4, 3, 2, 1].map(
                                    (
                                        star
                                    ) => {
                                        const count =
                                            Number(
                                                product.rating?.distribution?.[
                                                    star
                                                ]
                                                ||
                                                0
                                            );

                                        const total =
                                            Number(
                                                product.rating?.count ||
                                                0
                                            );

                                        const percent =
                                            total > 0
                                                ? Math.round(
                                                    (
                                                        count /
                                                        total
                                                    )
                                                    *
                                                    100
                                                )
                                                : 0;

                                        return (
                                            <div
                                                key={star}
                                            >
                                                <span>
                                                    {star}
                                                    <i className="fa-solid fa-star" />
                                                </span>

                                                <b>
                                                    <i
                                                        style={{
                                                            width:
                                                                `${percent}%`,
                                                        }}
                                                    />
                                                </b>

                                                <small>
                                                    {count}
                                                </small>
                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </div>


                        <ProductReviewForm
                            product={product}
                            slug={slug}
                            loginReturnPath={location.pathname}
                            onSubmitted={reloadProduct}
                            showToast={showToast}
                        />


                        <div className="fv-pd-review-list">

                            {product.reviews?.length > 0 ? (

                                product.reviews.map(
                                    (
                                        review
                                    ) => (
                                        <article
                                            key={
                                                review.id
                                            }
                                        >
                                            <Stars
                                                rating={
                                                    review.rating
                                                }
                                            />

                                            <small>
                                                {review.name}
                                                {review.verified &&
                                                    " · Verified purchase"}
                                            </small>

                                            {review.review && (
                                                <p>
                                                    {review.review}
                                                </p>
                                            )}

                                            {review.images?.length > 0 && (
                                                <div className="fv-pd-review-images">
                                                    {review.images.map(
                                                        (
                                                            image
                                                        ) => (
                                                            <img
                                                                src={image.url}
                                                                alt="Customer review"
                                                                key={image.id}
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    )
                                )

                            ) : (

                                <div className="fv-pd-no-reviews">
                                    No approved reviews yet.
                                </div>

                            )}

                        </div>

                    </section>

                </div>

            </div>


            {/* ============================================================
                MOBILE VIEW
            ============================================================ */}

            <div className="fv-pd-mobile">

                {/* Gallery */}

                <section
                    className="fv-pd-mobile-gallery"
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                >
                    <ProductImage
                        src={activeImage?.url}
                        alt={product.name}
                        isVideo={Boolean(activeImage?.is_video)}
                    />

                    <button
                        type="button"
                        className="fv-pd-mobile-home"
                        aria-label="Go to home"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        <i className="fa-solid fa-house" aria-hidden="true" />
                    </button>

                    <div className="fv-pd-mobile-top-actions">

                        <button
                            type="button"
                            className="cart"
                            aria-label={`Open cart with ${itemCount} item(s)`}
                            onClick={() =>
                                navigate("/cart")
                            }
                        >
                            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />

                            {itemCount > 0 && (
                                <b>
                                    {itemCount > 99
                                        ? "99+"
                                        : itemCount}
                                </b>
                            )}
                        </button>

                        <button
                            type="button"
                            aria-label="Share product"
                            onClick={share}
                        >
                            <i className="fa-solid fa-share-nodes" aria-hidden="true" />
                        </button>

                    </div>

                    {galleryImages.length > 1 && (
                        <span className="fv-pd-mobile-image-count">
                            {activeImageIndex + 1}/{galleryImages.length}
                        </span>
                    )}

                </section>


                {/* Price + title */}

                <section className="fv-pd-mobile-summary">

                    {savingAmount > 0 && (
                        <div className="fv-pd-mobile-promo-text">
                            ৳ {money(savingAmount)} off with Promo
                        </div>
                    )}

                    <div className="fv-pd-mobile-price-actions">

                        <div>
                            <strong>
                                ৳ {money(price)}
                            </strong>

                            {discount > 0 && (
                                <small>
                                    <del>
                                        ৳{money(regularPrice)}
                                    </del>

                                    <b>
                                        -{discount}%
                                    </b>
                                </small>
                            )}
                        </div>

                        <div className="fv-pd-mobile-action-icons">
                            <button
                                type="button"
                                className={[
                                    "fv-pd-mobile-icon-btn",
                                    product && isInWishlist(product.id)
                                        ? "is-wishlisted"
                                        : "",
                                    wishlistAnimating
                                        ? "is-wishlist-animating"
                                        : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onClick={wishlist}
                                disabled={wishlistBusy}
                                aria-label={
                                    product && isInWishlist(product.id)
                                        ? "Remove from wishlist"
                                        : "Add to wishlist"
                                }
                            >
                                <i
                                    className={
                                        product && isInWishlist(product.id)
                                            ? "fa-solid fa-heart"
                                            : "fa-regular fa-heart"
                                    }
                                    aria-hidden="true"
                                />
                            </button>

                            <button
                                type="button"
                                className="fv-pd-mobile-icon-btn"
                                aria-label="Share product"
                                onClick={share}
                            >
                                <i className="fa-solid fa-share-nodes" aria-hidden="true" />
                            </button>
                        </div>

                    </div>

                    <h1>
                        {product.name}
                    </h1>

                    <button
                        type="button"
                        className="fv-pd-mobile-rating"
                        onClick={scrollToReviews}
                    >
                        <Stars
                            rating={
                                product.rating?.average
                            }
                        />

                        <span>
                            {Number(
                                product.rating?.average ||
                                0
                            ).toFixed(1)}{" "}
                            ({product.rating?.count || 0})
                        </span>
                    </button>

                </section>


                {/* Options */}

                <MobileInfoRow
                    label="Product Options"
                    summary={selectedOptionsText}
                    onClick={() =>
                        setOptionsOpen(true)
                    }
                />


                {/* Specifications */}

                <MobileInfoRow
                    label="Specifications"
                    summary={
                        specificationSummary ||
                        "View details"
                    }
                    onClick={() =>
                        setSpecsOpen(true)
                    }
                />


                {/* Delivery */}

                <section className="fv-pd-mobile-block">

                    <div className="fv-pd-mobile-block-label">
                        Delivery
                    </div>

                    <div className="fv-pd-mobile-block-content">

                        <div className="fv-pd-mobile-delivery-location">
                            <span>
                                {product.delivery?.location ||
                                    product.vendor?.location ||
                                    "Bangladesh"}
                            </span>

                            <i className="fa-regular fa-pen-to-square" />
                        </div>

                        <div className="fv-pd-mobile-delivery-line">
                            <span>
                                {product.delivery?.label ||
                                    "Standard Delivery"}
                            </span>

                            <strong>
                                {product.delivery?.charge_label ||
                                    "Calculated at checkout"}
                            </strong>
                        </div>

                    </div>

                    <i className="fa-solid fa-chevron-right fv-pd-mobile-block-arrow" />

                </section>


                {/* Service */}

                <section className="fv-pd-mobile-block">

                    <div className="fv-pd-mobile-block-label">
                        Service
                    </div>

                    <div className="fv-pd-mobile-block-content fv-pd-mobile-service">

                        <span>
                            <i className="fa-solid fa-square" />
                            {product.return_policy}
                        </span>

                        <span>
                            <i className="fa-solid fa-square" />
                            {product.warranty_label}
                        </span>

                    </div>

                    <i className="fa-solid fa-chevron-right fv-pd-mobile-block-arrow" />

                </section>


                {/* Reviews link */}

                <section
                    className="fv-pd-mobile-reviews-link"
                    onClick={scrollToReviews}
                >
                    <span>
                        Ratings and Reviews ({product.rating?.count || 0})
                    </span>

                    <button type="button">
                        View All
                    </button>
                </section>


                {/* Mobile description */}

                {(product.short_description ||
                    product.long_description) && (

                    <section className="fv-pd-mobile-description">

                        <h2>
                            Product Details
                        </h2>

                        <div
                            className={
                                descriptionExpanded
                                    ? "expanded"
                                    : ""
                            }
                        >
                            {product.short_description && (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeRichText(
                                            product.short_description
                                        ),
                                    }}
                                />
                            )}

                            {product.long_description && (
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: sanitizeRichText(
                                            product.long_description
                                        ),
                                    }}
                                />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setDescriptionExpanded(
                                    (
                                        current
                                    ) =>
                                        !current
                                )
                            }
                        >
                            {descriptionExpanded
                                ? "Show Less"
                                : "View More"}
                        </button>

                    </section>
                )}


                {/* Mobile review summary */}

                <section
                    ref={reviewRef}
                    className="fv-pd-mobile-review-panel"
                >
                    <h2>
                        Ratings &amp; Reviews
                    </h2>

                    <div>
                        <strong>
                            {Number(
                                product.rating?.average ||
                                0
                            ).toFixed(1)}

                            <small>
                                /5
                            </small>
                        </strong>

                        <Stars
                            rating={
                                product.rating?.average
                            }
                        />

                        <span>
                            {product.rating?.count || 0} Ratings
                        </span>
                    </div>

                    <ProductReviewForm
                        product={product}
                        slug={slug}
                        loginReturnPath={location.pathname}
                        onSubmitted={reloadProduct}
                        showToast={showToast}
                    />
                </section>


                {/* Sticky bottom actions */}

                <nav className="fv-pd-mobile-bottom-bar">

                    <button
                        type="button"
                        className="mini"
                        onClick={visitStore}
                    >
                        <i className="fa-solid fa-store" />
                        <small>
                            Store
                        </small>
                    </button>

                    <button
                        type="button"
                        className="buy"
                        disabled={
                            busy ||
                            !inStock
                        }
                        onClick={buyNow}
                    >
                        {busy
                            ? "Please wait..."
                            : "Buy Now"}
                    </button>

                    <button
                        type="button"
                        className="cart"
                        disabled={
                            busy ||
                            !inStock
                        }
                        onClick={handleAddToCart}
                    >
                        Add to Cart
                    </button>

                </nav>

            </div>


            {/* ============================================================
                PRODUCT OPTIONS SHEET
            ============================================================ */}

            {optionsOpen && (
                <div
                    className="fv-pd-sheet-backdrop"
                    onMouseDown={() =>
                        setOptionsOpen(false)
                    }
                >
                    <div
                        className="fv-pd-sheet"
                        onMouseDown={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="fv-pd-sheet-handle" />

                        <div className="fv-pd-sheet-head">
                            <strong>
                                Product Options
                            </strong>

                            <button
                                type="button"
                                onClick={() =>
                                    setOptionsOpen(false)
                                }
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        <div className="fv-pd-sheet-product">
                            <span>
                                <ProductImage
                                    src={activeImage?.url}
                                    alt={product.name}
                                />
                            </span>

                            <div>
                                <strong>
                                    ৳ {money(price)}
                                </strong>

                                <small>
                                    {inStock
                                        ? "In stock"
                                        : "Out of stock"}
                                </small>
                            </div>
                        </div>

                        {product.attribute_groups?.map(
                            (
                                attribute
                            ) => (
                                <div
                                    className="fv-pd-sheet-option-group"
                                    key={
                                        attribute.id
                                    }
                                >
                                    <span>
                                        {attribute.name}
                                    </span>

                                    <div>
                                        {attribute.values.map(
                                            (
                                                value
                                            ) => (
                                                <button
                                                    type="button"

                                                    className={
                                                        Number(
                                                            selectedAttributes[
                                                                attribute.id
                                                            ]
                                                        )
                                                        ===
                                                        Number(
                                                            value.id
                                                        )
                                                            ? "active"
                                                            : ""
                                                    }

                                                    onClick={() =>
                                                        changeAttribute(
                                                            attribute.id,
                                                            value.id
                                                        )
                                                    }

                                                    key={
                                                        value.id
                                                    }
                                                >
                                                    {value.color_code && (
                                                        <i
                                                            style={{
                                                                background:
                                                                    value.color_code,
                                                            }}
                                                        />
                                                    )}

                                                    {value.value}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>
                            )
                        )}

                        <div className="fv-pd-sheet-qty">
                            <span>
                                Quantity
                            </span>

                            <div className="fv-pd-qty-control">
                                <button
                                    type="button"
                                    disabled={
                                        quantity <= 1
                                    }
                                    onClick={() =>
                                        setQuantity(
                                            Math.max(
                                                1,
                                                quantity - 1
                                            )
                                        )
                                    }
                                >
                                    −
                                </button>

                                <strong>
                                    {quantity}
                                </strong>

                                <button
                                    type="button"
                                    disabled={
                                        maxQuantity !==
                                            null
                                        &&
                                        quantity >=
                                            maxQuantity
                                    }
                                    onClick={() =>
                                        setQuantity(
                                            quantity + 1
                                        )
                                    }
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="fv-pd-sheet-apply"
                            onClick={() =>
                                setOptionsOpen(false)
                            }
                        >
                            Apply
                        </button>

                    </div>
                </div>
            )}


            {/* ============================================================
                SPECIFICATIONS SHEET
            ============================================================ */}

            {specsOpen && (
                <div
                    className="fv-pd-sheet-backdrop"
                    onMouseDown={() =>
                        setSpecsOpen(false)
                    }
                >
                    <div
                        className="fv-pd-sheet"
                        onMouseDown={(
                            event
                        ) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="fv-pd-sheet-handle" />

                        <div className="fv-pd-sheet-head">
                            <strong>
                                Specifications
                            </strong>

                            <button
                                type="button"
                                onClick={() =>
                                    setSpecsOpen(false)
                                }
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        </div>

                        <div className="fv-pd-spec-list">
                            {(product.specifications || []).map(
                                (
                                    row
                                ) => (
                                    <div
                                        key={
                                            row.label
                                        }
                                    >
                                        <span>
                                            {row.label}
                                        </span>

                                        <strong>
                                            {row.value}
                                        </strong>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
