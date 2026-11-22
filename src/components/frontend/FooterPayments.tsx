import React from "react";
import "./styles/FooterPayments.css";

function ImagePaymentBadge({ className, title, src, alt, fallback }) {
    const handleError = (event) => {
        event.currentTarget.style.display = "none";
        const next = event.currentTarget.nextElementSibling;
        if (next) next.style.display = "inline-flex";
    };

    return (
        <span className={`payment-badge ${className}`} title={title}>
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onError={handleError}
            />
            <span className="payment-fallback">{fallback}</span>
        </span>
    );
}

export default function FooterPayments() {
    return (
        <div className="footer-payments">
            <div className="container payment-grid">
                <section>
                    <h3>Payment Methods</h3>

                    <div className="payment-icons" aria-label="Supported payment methods">
                        <span className="payment-badge payment-generic" title="Cash on Delivery">
                            <i className="fa-solid fa-truck-fast" />
                            <span>COD</span>
                        </span>

                        <ImagePaymentBadge
                            className="visa"
                            title="Visa"
                            src="https://corporate.visa.com/dam/VCOM/corporate/about-visa/images/visa-brand-mark-grid-800x450.jpg"
                            alt="Visa"
                            fallback="VISA"
                        />

                        <ImagePaymentBadge
                            className="mastercard"
                            title="Mastercard"
                            src="https://www.mastercard.com/brandcenter/us/en/download-artwork/_jcr_content/root/container/container_1578756628/container_copy/container/tabs/item_1734020772487/container_45945280/carousel/item_1739263305851.coreimg.png/1751029718046/maestro-light.png"
                            alt="Mastercard"
                            fallback="Mastercard"
                        />

                        <ImagePaymentBadge
                            className="amex"
                            title="American Express"
                            src="https://www.americanexpress.com/content/dam/amex/us/merchant/supplies/product/images/img-WEBLOGO1-01.jpg"
                            alt="American Express"
                            fallback="AMEX"
                        />

                        <span className="payment-badge payment-generic" title="Easy Monthly Installments">
                            <i className="fa-regular fa-credit-card" />
                            <span>EMI</span>
                        </span>

                        <ImagePaymentBadge
                            className="bkash"
                            title="bKash"
                            src="https://merchantportal.bkash.com/src/assets/image/header-bkash-icon.png"
                            alt="bKash"
                            fallback="bKash"
                        />

                        <ImagePaymentBadge
                            className="nagad"
                            title="Nagad"
                            src="https://mma.prnewswire.com/media/2420590/Nagad_New_Logo_English_Logo.jpg"
                            alt="Nagad"
                            fallback="Nagad"
                        />

                        <ImagePaymentBadge
                            className="rocket"
                            title="Rocket"
                            src="https://www.dutchbanglabank.com/img/slides/mobile-Banking-Billboard.jpg"
                            alt="Rocket"
                            fallback="Rocket"
                        />
                    </div>
                </section>

                <section>
                    <h3>Verified by</h3>
                    <div className="pci">
                        <i className="fa-solid fa-shield-halved" /> PCI <b>DSS</b>
                    </div>
                </section>

                <section>
                    <h3>DBID</h3>
                    <p>Registration ID :<br />304903094</p>
                </section>
            </div>
        </div>
    );
}
