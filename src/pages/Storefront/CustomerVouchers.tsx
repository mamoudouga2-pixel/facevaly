import React, { useEffect, useState } from "react";
import "./CustomerVouchers.css";
import customerAccountService from "../../services/customerAccountService";

export default function CustomerVouchers() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [vouchers, setVouchers] = useState([]);

    useEffect(() => {
        let active = true;

        setLoading(true);
        setError("");

        customerAccountService
            .vouchers()
            .then((response) => {
                if (!active) return;
                setVouchers(response?.data || []);
            })
            .catch((exception) => {
                if (!active) return;
                setError(
                    exception?.message ||
                        "Could not load vouchers."
                );
            })
            .finally(() => {
                if (!active) return;
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="fv-vouchers-page">
            <div className="fv-vouchers-container">
                <header className="fv-vouchers-hero">
                    <span>ACCOUNT VOUCHERS</span>
                    <h1>Your discounts in one place</h1>
                    <p>
                        Saved offers you can use at checkout. (This page is fully routed; voucher data integration can be added next.)
                    </p>
                </header>

                {loading ? (
                    <div className="fv-vouchers-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Loading vouchers...
                    </div>
                ) : error ? (
                    <div className="fv-vouchers-error">{error}</div>
                ) : vouchers.length === 0 ? (
                    <div className="fv-vouchers-empty">
                        <i className="fa-regular fa-ticket" />
                        No vouchers available right now.
                    </div>
                ) : (
                    <section className="fv-vouchers-grid">
                        {vouchers.map((voucher) => {
                            const expires = voucher.ends_at
                                ? new Date(voucher.ends_at).toLocaleDateString()
                                : "—";

                            const discountLabel =
                                voucher.discount_type === "percentage"
                                    ? `${voucher.discount_value}% off`
                                    : `৳ ${voucher.discount_value} off`;

                            return (
                                <article
                                    className="fv-voucher-card"
                                    key={voucher.id}
                                >
                                    <div className="fv-voucher-code">
                                        {voucher.code}
                                    </div>

                                    <div className="fv-voucher-body">
                                        <h2>{discountLabel}</h2>
                                        <p>
                                            Minimum order: ৳{" "}
                                            {voucher.minimum_order_amount.toFixed(2)}
                                        </p>
                                    </div>

                                    <footer className="fv-voucher-foot">
                                        <span>Expires</span>
                                        <b>{expires}</b>
                                    </footer>
                                </article>
                            );
                        })}
                    </section>
                )}
            </div>
        </div>
    );
}

