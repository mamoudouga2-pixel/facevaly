import React, { memo } from "react";

import {
    Link,
} from "react-router-dom";

import {
    prefetchProduct,
} from "../../../utils/productBootstrap";

import ProductCardImage from "../ProductCardImage";

import "./FlashSaleProductCard.css";


const money = (
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


function FlashSaleProductCard({
    product,
}) {
    return (
        <article className="fv-flash-card">

            <Link
                className="fv-flash-card-image"
                to={`/product/${product.slug}`}
                aria-label={
                    product.name
                }
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


            <div className="fv-flash-card-body">

                <Link
                    className="fv-flash-card-title"
                    to={`/product/${product.slug}`}
                >
                    {
                        product.name
                    }
                </Link>


                <div className="fv-flash-card-price">
                    ৳
                    {money(
                        product.price
                    )}
                </div>


                <div className="fv-flash-card-old-price">

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
                        product.discount_percent ||
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

            </div>

        </article>
    );
}

export default memo(FlashSaleProductCard);
