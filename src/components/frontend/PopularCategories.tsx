import React from "react";
import SectionHeader from "./SectionHeader";
import "./styles/PopularCategories.css";

export default function PopularCategories({ categories = [] }) {
    if (!categories.length) return null;

    return (
        <section className="popular-section section-space">
            <div className="container">
                <SectionHeader
                    title="Popular Categories"
                    actionLabel="View All"
                    className="mobile-tight"
                />

                <div className="category-grid">
                    {categories.map((category, index) => (
                        <a href={category.href || "#"} key={`${category.name}-${index}`}>
                            <img src={category.image} alt={category.name} loading="lazy" />
                            <span>{category.name}</span>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
