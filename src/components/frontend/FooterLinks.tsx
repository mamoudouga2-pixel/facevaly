import React from "react";
import "./styles/FooterLinks.css";

const LOGO_URL = "/img/logo.webp";

const customerCare = [
    "Help Center",
    "How to Buy",
    "Returns & Refunds",
    "Contact Us",
    "Terms & Conditions",
    "CCMS - Central Complain Management System",
];

const facevalyLinks = [
    "About Facevaly",
    "Digital Payments",
    "Facevaly Card",
    "Facevaly Blog",
    "Facevaly Cares",
    "Privacy Policy",
    "Facevaly Mart",
    "Facevaly App",
    "Facevaly Exclusives",
    "Facevaly University",
    "Sell on Facevaly",
    "Code of Conduct",
    "Join the Facevaly Affiliate Program",
];

export default function FooterLinks() {
    return (
        <div className="footer-top">
            <div className="container footer-top-grid">
                <section>
                    <h3>Customer Care</h3>
                    {customerCare.map((label) => (
                        <a href="#" key={label}>{label}</a>
                    ))}
                </section>

                <section>
                    <h3>Facevaly</h3>
                    {facevalyLinks.map((label) => (
                        <a href="#" key={label}>{label}</a>
                    ))}
                </section>

                <section className="app-download">
                    <div className="happy-shopping">
                        <img src={LOGO_URL} alt="Facevaly app logo" />
                        <div>
                            <strong>Happy Shopping</strong>
                            <span>Download App</span>
                        </div>
                    </div>

                    <div className="store-badges">
                        <span> Available on the<br /><b>App Store</b></span>
                        <span>▶ GET IT ON<br /><b>Google Play</b></span>
                        <span>◈ EXPLORE IT ON<br /><b>AppGallery</b></span>
                    </div>
                </section>
            </div>
        </div>
    );
}
