import React from "react";
import "./styles/ProductSkeletonGrid.css";


export function ProductDetailSkeleton() {
    return (
        <div className="fv-skeleton-pd">
            <div className="fv-skeleton-pd-layout">
                <div className="fv-skeleton fv-skeleton-pd-gallery" />
                <div className="fv-skeleton-pd-info">
                    <div className="fv-skeleton fv-skeleton-line lg" />
                    <div className="fv-skeleton fv-skeleton-line md" />
                    <div className="fv-skeleton fv-skeleton-line sm" />
                    <div className="fv-skeleton fv-skeleton-price" />
                    <div className="fv-skeleton fv-skeleton-btn" />
                </div>
            </div>
        </div>
    );
}


export default function ProductSkeletonGrid({
    count = 8,
    view = "grid",
}) {
    return (
        <div
            className={
                view === "list"
                    ? "fv-skeleton-grid fv-skeleton-grid-list"
                    : "fv-skeleton-grid fv-skeleton-grid-grid"
            }
        >
            {Array.from({ length: count }).map((_, index) => (
                <article
                    key={index}
                    className="fv-skeleton-card"
                >
                    <div className="fv-skeleton fv-skeleton-image" />
                    <div className="fv-skeleton fv-skeleton-line md" />
                    <div className="fv-skeleton fv-skeleton-line sm" />
                    <div className="fv-skeleton fv-skeleton-line xs" />
                </article>
            ))}
        </div>
    );
}
