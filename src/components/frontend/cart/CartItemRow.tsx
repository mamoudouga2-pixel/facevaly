import React from "react";
import { Link } from "react-router-dom";
import "./CartItemRow.css";

const money = (value) =>
    Number(value || 0).toLocaleString("en-BD", {
        maximumFractionDigits: 2,
    });

function itemMetaLine(item) {
    const parts = [];

    if (item.brand_name) {
        parts.push(item.brand_name);
    } else {
        parts.push("No Brand");
    }

    if (item.variant_name) {
        parts.push(item.variant_name);
    } else if (item.sku) {
        parts.push(`SKU: ${item.sku}`);
    }

    return parts.join(", ");
}

export default function CartItemRow({
    item,
    selected,
    busy,
    onSelect,
    onQuantity,
    onWishlist,
    onDelete,
}) {
    const unit = Number(item.unit_price || 0);
    const regular = Number(item.regular_price || 0);
    const hasDiscount = regular > unit && unit >= 0;
    const stockLeft =
        item.stock_left != null
            ? Number(item.stock_left)
            : item.max_quantity != null
                ? Number(item.max_quantity)
                : null;
    const showLowStock =
        stockLeft != null && stockLeft > 0 && stockLeft <= 10;

    return (
        <div
            className={
                item.available
                    ? "fv-cart-item-row"
                    : "fv-cart-item-row unavailable"
            }
        >
            <label className="fv-cart-checkbox">
                <input
                    type="checkbox"
                    checked={selected}
                    disabled={!item.available}
                    onChange={() => onSelect(item.id)}
                />
            </label>

            <Link
                to={item.slug ? `/product/${item.slug}` : "#"}
                className="fv-cart-item-image"
            >
                {item.image ? (
                    <img src={item.image} alt={item.name} />
                ) : (
                    <i className="fa-regular fa-image" />
                )}
            </Link>

            <div className="fv-cart-item-body">
                <Link
                    to={item.slug ? `/product/${item.slug}` : "#"}
                    className="fv-cart-item-title"
                >
                    {hasDiscount ? (
                        <span className="fv-cart-sale-badge">SALE</span>
                    ) : null}
                    {item.name}
                </Link>

                <small className="fv-cart-item-meta">{itemMetaLine(item)}</small>

                {showLowStock ? (
                    <span className="fv-cart-stock-warn">
                        Only {stockLeft} item(s) in stock
                    </span>
                ) : null}

                {!item.available ? (
                    <strong className="fv-cart-unavailable">
                        This product is no longer available
                    </strong>
                ) : null}

                <div className="fv-cart-item-foot">
                    <div className="fv-cart-item-price">
                        <strong>৳ {money(unit)}</strong>
                        {hasDiscount ? <del>৳ {money(regular)}</del> : null}
                    </div>

                    <div className="fv-cart-item-quantity">
                        <button
                            type="button"
                            disabled={busy || item.quantity <= 1}
                            aria-label="Decrease quantity"
                            onClick={() =>
                                onQuantity(item, Math.max(1, item.quantity - 1))
                            }
                        >
                            −
                        </button>

                        <span>{item.quantity}</span>

                        <button
                            type="button"
                            aria-label="Increase quantity"
                            disabled={
                                busy
                                || (item.max_quantity !== null
                                    && item.quantity >= item.max_quantity)
                            }
                            onClick={() => onQuantity(item, item.quantity + 1)}
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            <div className="fv-cart-item-actions">
                <button
                    type="button"
                    title="Move to Wishlist"
                    disabled={busy}
                    onClick={() => onWishlist(item)}
                >
                    <i className="fa-regular fa-heart" />
                </button>

                <button
                    type="button"
                    title="Delete"
                    disabled={busy}
                    onClick={() => onDelete(item)}
                >
                    <i className="fa-regular fa-trash-can" />
                </button>
            </div>
        </div>
    );
}
