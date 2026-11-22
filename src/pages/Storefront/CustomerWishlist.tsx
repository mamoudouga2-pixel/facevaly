import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { useStorefrontToast } from "../../context/StorefrontToastContext";
import { mediaUrl } from "../../config/api";
import "./CustomerWishlist.css";

const money = (value) =>
    Number(value || 0).toLocaleString("en-BD", {
        maximumFractionDigits: 2,
    });

export default function CustomerWishlist() {
    const {
        items,
        loading,
        error,
        removeFromWishlist,
        refreshWishlist,
        mutating,
    } = useWishlist();

    const { addToCart } = useCart();
    const { showToast } = useStorefrontToast();
    const [busyProductId, setBusyProductId] = useState(null);

    const remove = async (productId) => {
        try {
            setBusyProductId(productId);
            await removeFromWishlist(productId);
            showToast("Removed from wishlist.");
        } catch (exception) {
            showToast(
                exception?.message || "Could not remove item.",
                "error"
            );
        } finally {
            setBusyProductId(null);
        }
    };

    const moveToCart = async (item) => {
        try {
            setBusyProductId(item.product_id);
            await addToCart({
                product_id: item.product_id,
                quantity: 1,
            });
            showToast("Added to cart.");
        } catch (exception) {
            showToast(
                exception?.message || "Could not add to cart.",
                "error"
            );
        } finally {
            setBusyProductId(null);
        }
    };

    return (
        <div className="fv-wishlist-page">
            <div className="fv-wishlist-shell">
                <header className="fv-wishlist-hero">
                    <div className="fv-wishlist-hero-copy">
                        <h1>My Wishlist</h1>
                        <p>
                            Products you saved for later — move them to cart when you are ready.
                        </p>
                    </div>

                    <div className="fv-wishlist-hero-meta">
                        <div className="fv-wishlist-count">
                            <strong>{items.length}</strong>
                            <span>Saved</span>
                        </div>

                        <button
                            type="button"
                            className="fv-wishlist-refresh"
                            aria-label="Refresh wishlist"
                            disabled={loading || mutating}
                            onClick={() => refreshWishlist()}
                        >
                            <i
                                className={
                                    loading || mutating
                                        ? "fa-solid fa-spinner fa-spin"
                                        : "fa-solid fa-rotate-right"
                                }
                            />
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="fv-wishlist-state loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Loading your saved items...
                    </div>
                ) : null}

                {error ? (
                    <div className="fv-wishlist-state error">
                        {error}{" "}
                        <button type="button" onClick={() => refreshWishlist()}>
                            Try again
                        </button>
                    </div>
                ) : null}

                {!loading && !error && items.length === 0 ? (
                    <div className="fv-wishlist-empty">
                        <div className="fv-wishlist-empty-icon">
                            <i className="fa-regular fa-heart" />
                        </div>
                        <h2>Nothing saved yet</h2>
                        <p>
                            Tap the heart on any product to keep it here. Your wishlist stays ready even before you sign in.
                        </p>
                        <Link to="/">
                            Browse products
                            <i className="fa-solid fa-arrow-right" />
                        </Link>
                    </div>
                ) : null}

                {!loading && !error && items.length > 0 ? (
                    <div className="fv-wishlist-grid">
                        {items.map((item, index) => {
                            const onSale =
                                item.sale_price !== null
                                && Number(item.sale_price) < Number(item.regular_price);

                            const isBusy =
                                busyProductId === item.product_id;

                            return (
                                <article
                                    key={item.id}
                                    className="fv-wishlist-card"
                                    style={{
                                        animationDelay: `${Math.min(index * 0.06, 0.36)}s`,
                                    }}
                                >
                                    <Link
                                        to={`/product/${item.slug}`}
                                        className="fv-wishlist-card-image"
                                    >
                                        {item.image ? (
                                            <img
                                                src={mediaUrl(item.image)}
                                                alt={item.name}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <span>
                                                <i className="fa-regular fa-image" />
                                            </span>
                                        )}
                                    </Link>

                                    <div className="fv-wishlist-card-body">
                                        {item.vendor?.name ? (
                                            <span className="fv-wishlist-card-vendor">
                                                {item.vendor.name}
                                            </span>
                                        ) : null}

                                        <Link
                                            to={`/product/${item.slug}`}
                                            className="fv-wishlist-card-title"
                                        >
                                            {item.name}
                                        </Link>

                                        <div className="fv-wishlist-card-price">
                                            ৳ {money(item.final_price)}
                                            {onSale ? (
                                                <small>
                                                    ৳ {money(item.regular_price)}
                                                </small>
                                            ) : null}
                                        </div>

                                        <span
                                            className={
                                                item.in_stock
                                                    ? "fv-wishlist-stock in"
                                                    : "fv-wishlist-stock out"
                                            }
                                        >
                                            <i
                                                className={
                                                    item.in_stock
                                                        ? "fa-solid fa-circle-check"
                                                        : "fa-solid fa-circle-xmark"
                                                }
                                            />
                                            {item.in_stock
                                                ? "In stock"
                                                : "Out of stock"}
                                        </span>
                                    </div>

                                    <div className="fv-wishlist-card-actions">
                                        <button
                                            type="button"
                                            className="fv-wishlist-btn fv-wishlist-btn-primary"
                                            disabled={!item.in_stock || isBusy}
                                            onClick={() => moveToCart(item)}
                                        >
                                            {isBusy ? (
                                                <i className="fa-solid fa-spinner fa-spin" />
                                            ) : (
                                                "Add to cart"
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="fv-wishlist-btn fv-wishlist-btn-ghost"
                                            disabled={isBusy}
                                            onClick={() => remove(item.product_id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
