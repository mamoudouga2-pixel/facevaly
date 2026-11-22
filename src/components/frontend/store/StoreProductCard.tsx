import React, {
    memo,
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import {
    mediaUrl,
} from "../../../config/api";

import "./StoreProductCard.css";


const money = (
    value
) =>
    Number(
        value || 0
    )
        .toLocaleString(
            "en-BD",
            {
                maximumFractionDigits:
                    2,
            }
        );


function ProductImage({
    product,
}) {
    const [
        failed,
        setFailed,
    ] =
        useState(false);

    const isVideo = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(
        String(product?.image || "")
    );


    useEffect(
        () => {
            setFailed(
                false
            );
        },
        [
            product?.image,
        ]
    );


    const imageSrc =
        mediaUrl(
            product?.image
        );

    if (
        !imageSrc
        ||
        failed
    ) {
        return (
            <span className="fv-store-card-fallback">

                <i className={isVideo ? "fa-solid fa-play" : "fa-regular fa-image"} />

            </span>
        );
    }

    if (isVideo) {
        return (
            <video
                src={imageSrc}
                muted
                playsInline
                preload="metadata"
                onError={() => setFailed(true)}
            />
        );
    }


    return (
        <img
            src={imageSrc}

            alt={
                product.name
            }

            loading="lazy"

            draggable="false"

            onError={() =>
                setFailed(
                    true
                )
            }
        />
    );
}


function StoreProductCard({
    product,
    highlighted = false,
}) {
    return (
        <article
            className={
                highlighted
                    ? "fv-store-product-card highlighted"
                    : "fv-store-product-card"
            }
        >

            <Link
                className="fv-store-product-image"
                to={`/product/${product.slug}`}
            >

                <ProductImage
                    product={
                        product
                    }
                />


                {product.flag && (

                    <span className="fv-store-product-flag">

                        <i className="fa-solid fa-sparkles" />

                        {
                            product.flag.name
                        }

                    </span>

                )}

            </Link>


            <div className="fv-store-product-body">

                <div className="fv-store-product-meta">

                    <span>

                        <i className="fa-solid fa-star" />

                        {
                            Number(
                                product.rating
                                ||
                                0
                            )
                                .toFixed(
                                    1
                                )
                        }

                        <small>
                            (
                            {
                                product.review_count
                                ||
                                0
                            }
                            )
                        </small>

                    </span>


                    <small>
                        {
                            product.sold_count
                            ||
                            0
                        } sold
                    </small>

                </div>


                <Link
                    className="fv-store-product-title"
                    to={`/product/${product.slug}`}
                >
                    {
                        product.name
                    }
                </Link>


                <div className="fv-store-product-price-row">

                    <div>

                        <strong>
                            ৳{
                                money(
                                    product.price
                                )
                            }
                        </strong>


                        {Number(
                            product.regular_price
                        ) >
                            Number(
                                product.price
                            ) && (

                            <del>
                                ৳{
                                    money(
                                        product.regular_price
                                    )
                                }
                            </del>

                        )}

                    </div>


                    {Number(
                        product.discount_percent
                        ||
                        0
                    ) >
                        0 && (

                        <span className="fv-store-product-discount">
                            -
                            {
                                product.discount_percent
                            }
                            %
                        </span>

                    )}

                </div>

            </div>

        </article>
    );
}

export default memo(StoreProductCard);
