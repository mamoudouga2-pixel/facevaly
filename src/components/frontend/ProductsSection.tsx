import React from "react";
import SectionHeader from "./SectionHeader";
import ShopCard from "./ShopCard";
import "./styles/ProductsSection.css";

export default function ProductsSection({ products = [] }) {
    if (!products.length) return null;

    return (
        <section className="products-section section-space">
            <div className="container">
                <SectionHeader title="Just For You" actionLabel="View All" />

                <div className="products-grid">
                    {products.map((product, index) => (
                        <ShopCard {...product} key={product.id || index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
