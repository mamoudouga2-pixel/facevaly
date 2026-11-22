import React, { memo } from "react";

import {
    Link,
} from "react-router-dom";

import {
    prefetchProduct,
} from "../../../utils/productBootstrap";

import ProductCardImage from "../ProductCardImage";

import "./JustForYouProductCard.css";


const money =
    (
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
        <span className="fv-jfy-stars">
            {[1, 2, 3, 4, 5].map(
                (
                    star
                ) => (
                    <i
                        key={
                            star
                        }
                        className={
                            star <=
                            rounded

                                ? "fa-solid fa-star"

                                : "fa-regular fa-star"
                        }
                    />
                )
            )}
        </span>
    );
}


function JustForYouProductCard({
    product,
}) {
    return (
        <article className="fv-jfy-card">

            <Link
                className="fv-jfy-card-image"
                to={`/product/${product.slug}`}
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

                {Number(product.discount_percent || 0) > 0 ||
                Number(product.regular_price || 0) >
                    Number(product.price || 0) ? (
                    <b className="fv-jfy-sale-badge">SALE</b>
                ) : null}

            </Link>


            <div className="fv-jfy-card-body">

                <Link
                    className="fv-jfy-card-title"
                    to={`/product/${product.slug}`}
                >

                    {product.flag && (

                        <b
                            className="fv-jfy-flag"
                            style={{
                                background:
                                    product.flag
                                        .badge_color
                                    ||
                                    "#5c159c",

                                color:
                                    product.flag
                                        .text_color
                                    ||
                                    "#ffffff",
                            }}
                        >
                            {String(
                                product.flag
                                    .name
                                || ""
                            )
                                .slice(
                                    0,
                                    2
                                )
                                .toLowerCase()}
                        </b>

                    )}


                    {
                        product.name
                    }

                </Link>


                <div className="fv-jfy-price">

                    ৳
                    {money(
                        product.price
                    )}

                </div>


                <div className="fv-jfy-discount-row">

                    {Number(
                        product.regular_price
                    ) >
                        Number(
                            product.price
                        ) && (

                        <del>
                            ৳
                            {money(
                                product.regular_price
                            )}
                        </del>

                    )}


                    {Number(
                        product.discount_percent
                        ||
                        0
                    ) >
                        0 && (

                        <span>
                            -
                            {
                                product.discount_percent
                            }
                            %
                        </span>

                    )}

                </div>


                <div className="fv-jfy-rating-row">

                    <Stars
                        rating={
                            product.rating
                        }
                    />

                    <small>
                        (
                        {
                            product.review_count
                            ||
                            0
                        }
                        )
                    </small>

                </div>

            </div>

        </article>
    );
}

export default memo(JustForYouProductCard);
