import React, { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import ProductCard from "./ProductCard";
import "./styles/FlashSaleSection.css";

const formatTime = (remaining) => {
    const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
    const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
};

export default function FlashSaleSection({
    products = [],
    initialSeconds = 2 * 60 * 60 + 17 * 60 + 39,
}) {
    const [remaining, setRemaining] = useState(initialSeconds);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setRemaining((current) => (current > 0 ? current - 1 : 3 * 60 * 60));
        }, 1000);

        return () => window.clearInterval(timer);
    }, []);

    if (!products.length) return null;

    const right = (
        <div className="flash-meta">
            <span className="timer-label">
                Ending in <strong id="countdown">{formatTime(remaining)}</strong>
            </span>
            <a href="#">SHOP MORE</a>
        </div>
    );

    return (
        <section className="flash-section section-space">
            <div className="container">
                <SectionHeader title="Flash Sale" right={right} />

                <div className="flash-grid">
                    {products.map((product, index) => (
                        <ProductCard {...product} key={product.id || index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
