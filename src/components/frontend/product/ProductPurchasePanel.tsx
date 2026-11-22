import React from "react";
import { Link } from "react-router-dom";
import "./ProductPurchasePanel.css";

const money = (value) =>
    Number(value || 0).toLocaleString("en-BD", {
        maximumFractionDigits: 2,
    });

function Stars({ rating = 0 }) {
    const rounded = Math.round(Number(rating || 0));

    return (
        <span className="fv-purchase-stars">
            {[1, 2, 3, 4, 5].map((star) => (
                <i
                    className={
                        star <= rounded
                            ? "fa-solid fa-star"
                            : "fa-regular fa-star"
                    }
                    key={star}
                />
            ))}
        </span>
    );
}

export default function ProductPurchasePanel({
    product,
    selectedVariant,
    selectedAttributes,
    quantity,
    busy,
    onAttributeChange,
    onQuantity,
    onAddCart,
    onBuyNow,
    onWishlist,
}) {
    const regularPrice = selectedVariant
        ? selectedVariant.regular_price
        : product.regular_price;

    const price = selectedVariant
        ? selectedVariant.price
        : product.price;

    const discount =
        Number(regularPrice) > Number(price)
            ? Math.round(
                  ((Number(regularPrice) - Number(price)) /
                      Number(regularPrice)) *
                      100
              )
            : 0;

    const inStock =
        product.pre_order_enabled ||
        !selectedVariant ||
        !selectedVariant.track_stock ||
        Number(selectedVariant.stock_quantity) > 0;

    return (
        <div className="fv-product-purchase">
            <div className="fv-product-title-row">
                <h1>{product.name}</h1>

                <div className="fv-product-title-actions">
                    <button type="button" title="Share">
                        <i className="fa-solid fa-share-nodes" />
                    </button>

                    <button
                        type="button"
                        title="Wishlist"
                        onClick={onWishlist}
                    >
                        <i className="fa-regular fa-heart" />
                    </button>
                </div>
            </div>

            <div className="fv-product-rating-row">
                <Stars rating={product.rating?.average} />

                <a href="#reviews">
                    Ratings {product.rating?.count || 0}
                </a>

                <span>{product.sold_count || 0} sold</span>
            </div>

            {product.brand && (
                <div className="fv-product-brand">
                    Brand:{" "}
                    <Link to={`/category/${product.categories?.[0]?.slug || ""}`}>
                        {product.brand.name}
                    </Link>
                </div>
            )}

            <div className="fv-product-price-box">
                <strong>৳ {money(price)}</strong>

                {discount > 0 && (
                    <div>
                        <del>৳ {money(regularPrice)}</del>
                        <span>-{discount}%</span>
                    </div>
                )}
            </div>

            {product.promotions?.length > 0 && (
                <div className="fv-product-promotions">
                    <span>Promotions</span>
                    <strong>{product.promotions[0].name}</strong>
                </div>
            )}

            {product.attribute_groups?.map((attribute) => (
                <div className="fv-product-variant-row" key={attribute.id}>
                    <span>{attribute.name}</span>

                    <div className="fv-product-variant-values">
                        {attribute.values.map((value) => (
                            <button
                                type="button"
                                className={
                                    Number(selectedAttributes[attribute.id]) ===
                                    Number(value.id)
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    onAttributeChange(attribute.id, value.id)
                                }
                                key={value.id}
                            >
                                {value.color_code && (
                                    <i
                                        style={{
                                            background: value.color_code,
                                        }}
                                    />
                                )}

                                {value.value}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="fv-product-quantity-row">
                <span>Quantity</span>

                <div className="fv-product-quantity">
                    <button
                        type="button"
                        onClick={() => onQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                    >
                        −
                    </button>

                    <strong>{quantity}</strong>

                    <button
                        type="button"
                        onClick={() => onQuantity(quantity + 1)}
                        disabled={
                            selectedVariant?.track_stock &&
                            quantity >= Number(selectedVariant.stock_quantity)
                        }
                    >
                        +
                    </button>
                </div>

                {selectedVariant?.track_stock && (
                    <small>
                        {selectedVariant.stock_quantity} available
                    </small>
                )}
            </div>

            {!inStock && (
                <div className="fv-product-out-stock">
                    Out of stock
                </div>
            )}

            <div className="fv-product-buy-actions">
                <button
                    type="button"
                    className="buy-now"
                    disabled={busy || !inStock}
                    onClick={onBuyNow}
                >
                    {busy ? "Please wait..." : "Buy Now"}
                </button>

                <button
                    type="button"
                    className="add-cart"
                    disabled={busy || !inStock}
                    onClick={onAddCart}
                >
                    <i className="fa-solid fa-cart-plus" />
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
