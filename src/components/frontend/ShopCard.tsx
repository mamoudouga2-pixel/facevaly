import React from "react";
import "./styles/ShopCard.css";

export default function ShopCard({
    image,
    name,
    price,
    meta,
    href = "#",
}) {
    return (
        <a className="shop-card" href={href}>
            <img src={image} alt={name || "Product"} loading="lazy" />
            <div className="shop-info">
                <h3>{name}</h3>
                <strong>{price}</strong>
                {meta && <small>{meta}</small>}
            </div>
        </a>
    );
}
