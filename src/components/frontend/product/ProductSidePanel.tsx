import React from "react";
import "./ProductSidePanel.css";

export default function ProductSidePanel({ product }) {
    const vendor = product.vendor || {};
    const metric = (value, fallback = "Not enough data") =>
        value === null || value === undefined ? fallback : `${value}%`;

    return (
        <aside className="fv-product-side">
            <section className="fv-side-block">
                <h3>
                    Delivery Options
                    <i className="fa-regular fa-circle-question" />
                </h3>

                <div className="fv-side-row">
                    <i className="fa-solid fa-location-dot" />
                    <span>{vendor.location || "Bangladesh"}</span>
                </div>

                <div className="fv-side-row">
                    <i className="fa-solid fa-truck-fast" />
                    <span>
                        <strong>{product.delivery?.label}</strong>
                        <small>{product.delivery?.charge_label}</small>
                    </span>
                </div>

                {product.delivery?.cash_on_delivery && (
                    <div className="fv-side-row">
                        <i className="fa-solid fa-money-bill-wave" />
                        <span>Cash on Delivery Available</span>
                    </div>
                )}
            </section>

            <section className="fv-side-block">
                <h3>
                    Return &amp; Warranty
                    <i className="fa-regular fa-circle-question" />
                </h3>

                <div className="fv-side-row">
                    <i className="fa-solid fa-rotate-left" />
                    <span>{product.return_policy}</span>
                </div>

                <div className="fv-side-row">
                    <i className="fa-solid fa-shield-halved" />
                    <span>{product.warranty_label}</span>
                </div>
            </section>

            <section className="fv-product-app-download">
                <div className="fv-product-qr">
                    <i className="fa-solid fa-qrcode" />
                    <small>
                        <i className="fa-solid fa-mobile-screen-button" />
                        Scan with mobile
                    </small>
                </div>

                <div className="fv-product-app-card">
                    <img
                        src="https://facevaly.com/frontend/logo.png"
                        alt="Facevaly app"
                    />
                    <span>
                        Download app to enjoy
                        <br />
                        exclusive discounts!
                    </span>
                </div>
            </section>

            <section className="fv-seller-block">
                <span>Sold by</span>

                <div className="fv-seller-head">
                    <strong>{vendor.name || "Seller"}</strong>
                    <button type="button">
                        <i className="fa-solid fa-message" /> Chat Now
                    </button>
                </div>

                <div className="fv-seller-metrics">
                    <div>
                        <span>Positive Seller Ratings</span>
                        <strong>{metric(vendor.positive_seller_rating)}</strong>
                    </div>
                    <div>
                        <span>Ship on Time</span>
                        <strong>{metric(vendor.ship_on_time)}</strong>
                    </div>
                    <div>
                        <span>Chat Response Rate</span>
                        <strong>{metric(vendor.chat_response_rate)}</strong>
                    </div>
                </div>

                <button type="button" className="fv-go-store">
                    GO TO STORE
                </button>
            </section>
        </aside>
    );
}
