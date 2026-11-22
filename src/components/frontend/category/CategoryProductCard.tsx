import React, { memo } from "react";
import { Link } from "react-router-dom";
import { prefetchProduct } from "../../../utils/productBootstrap";
import ProductCardImage from "../ProductCardImage";
import "./CategoryProductCard.css";

const money = (value) =>
    Number(value || 0).toLocaleString("en-BD", {
        maximumFractionDigits: 2,
    });

function RatingStars({
    rating,
    count,
}) {
    const rounded = Math.round(Number(rating || 0));

    return (
        <div className="fv-category-rating">
            <span>
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

            <small>({count || 0})</small>
        </div>
    );
}

function CategoryProductCard({
    product,
    view = "grid",
}) {
    const firstFlag = product.flags?.[0];

    return (
        <article
            className={`fv-category-product-card fv-category-product-${view}`}
        >
            <Link
                to={`/product/${product.slug}`}
                className="fv-category-product-image"
                onMouseEnter={() =>
                    prefetchProduct(product.slug)
                }
                onFocus={() =>
                    prefetchProduct(product.slug)
                }
            >
                <ProductCardImage
                    src={product.image}
                    alt={product.name}
                />
            </Link>

            <div className="fv-category-product-content">
                <Link
                    to={`/product/${product.slug}`}
                    className="fv-category-product-title"
                >
                    {firstFlag && (
                        <b
                            style={{
                                background:
                                    firstFlag.badge_color ||
                                    "#5c159c",
                                color:
                                    firstFlag.text_color ||
                                    "#fff",
                            }}
                        >
                            {firstFlag.name
                                .slice(0, 2)
                                .toLowerCase()}
                        </b>
                    )}

                    {product.name}
                </Link>

                <div className="fv-category-product-price">
                    ৳ {money(product.price)}
                </div>

                {product.discount_percent > 0 && (
                    <div className="fv-category-product-discount">
                        {product.discount_percent}% Off{" "}
                        <span>
                            Coins save ৳
                            {money(product.save_amount)}
                        </span>
                    </div>
                )}

                <div className="fv-category-product-meta">
                    <span>
                        {product.sold_count} sold
                    </span>

                    <RatingStars
                        rating={product.rating}
                        count={product.review_count}
                    />

                    <small>{product.location}</small>
                </div>

                {view === "list" &&
                    product.highlights?.length > 0 && (
                        <ul className="fv-category-product-highlights">
                            {product.highlights.map(
                                (highlight, index) => (
                                    <li key={index}>
                                        {highlight}
                                    </li>
                                )
                            )}
                        </ul>
                    )}
            </div>
        </article>
    );
}

export default memo(CategoryProductCard);
