import React from "react";
import "./CartSummary.css";

const money = (value) =>
    Number(value || 0).toLocaleString("en-BD", {
        maximumFractionDigits: 2,
    });

export default function CartSummary({
    selectedCount,
    subtotal,
    shippingFee,
    coupon,
    couponCode,
    onCouponCode,
    onApplyCoupon,
    couponBusy,
    onCheckout,
    checkoutBusy,
}) {
    const discount = Number(coupon?.discount || 0);

    const total = Math.max(
        0,
        Number(subtotal || 0) + Number(shippingFee || 0) - discount
    );

    return (
        <aside className="fv-cart-summary">
            <h2>Order Summary</h2>

            <div className="fv-cart-summary-line">
                <span>Subtotal ({selectedCount} items)</span>
                <strong>৳ {money(subtotal)}</strong>
            </div>

            <div className="fv-cart-summary-line">
                <span>Shipping Fee</span>
                <strong>৳ {money(shippingFee)}</strong>
            </div>

            <div className="fv-cart-voucher fv-cart-voucher--desktop">
                <input
                    type="text"
                    placeholder="Enter Voucher Code"
                    value={couponCode}
                    onChange={(event) =>
                        onCouponCode(event.target.value.toUpperCase())
                    }
                />

                <button
                    type="button"
                    disabled={couponBusy || selectedCount === 0}
                    onClick={onApplyCoupon}
                >
                    {couponBusy ? "..." : "APPLY"}
                </button>
            </div>

            {coupon && (
                <div className="fv-cart-coupon-success">
                    {coupon.code}: −৳{money(coupon.discount)}
                </div>
            )}

            <div className="fv-cart-summary-line total">
                <span>Total</span>
                <strong>৳ {money(total)}</strong>
            </div>

            <button
                type="button"
                className="fv-cart-checkout-btn"
                disabled={selectedCount === 0 || checkoutBusy}
                onClick={onCheckout}
            >
                {checkoutBusy
                    ? "Please wait…"
                    : `PROCEED TO CHECKOUT (${selectedCount})`}
            </button>
        </aside>
    );
}

export function CartMobileCheckoutBar({
    selectedCount,
    subtotal,
    shippingFee = 0,
    allSelected,
    onToggleAll,
    selectableCount = 0,
    onCheckout,
    checkoutBusy,
}) {
    return (
        <div className="fv-cart-mobile-bar" role="region" aria-label="Checkout">
            <label className="fv-cart-mobile-bar-all">
                <input
                    type="checkbox"
                    checked={Boolean(allSelected) && selectableCount > 0}
                    disabled={selectableCount === 0}
                    onChange={onToggleAll}
                />
                <span>All</span>
            </label>

            <div className="fv-cart-mobile-bar-end">
                <div className="fv-cart-mobile-bar-totals">
                    <div className="fv-cart-mobile-bar-subtotal">
                        Subtotal: <strong>৳ {money(subtotal)}</strong>
                    </div>
                    <div className="fv-cart-mobile-bar-ship">
                        Shipping Fee: ৳ {money(shippingFee)}
                    </div>
                </div>

                <button
                    type="button"
                    className="fv-cart-mobile-checkout"
                    disabled={selectedCount === 0 || checkoutBusy}
                    onClick={onCheckout}
                >
                    {checkoutBusy ? "…" : `Check Out(${selectedCount})`}
                </button>
            </div>
        </div>
    );
}
