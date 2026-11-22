import React from "react";
import "./styles/ProductCard.css";

export default function ProductCard({
    image,
    name,
    price,
    oldPrice,
    discount,
    soldText,
    href = "#",
}) {
    return (
        <a className="product-card" href={href}>
            {discount && (
                <span className="discount">
                    <b>{discount}</b>
                </span>
            )}

            <img src={image} alt={name || "Product"} loading="lazy" />

            <h3>{name}</h3>

            <div className="price">{price}</div>

            {oldPrice && <del>{oldPrice}</del>}

            {soldText && <div className="selling-pill">{soldText}</div>}
        </a>
    );
}
