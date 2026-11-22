import React from "react";
import "./styles/FooterBottom.css";

export default function FooterBottom() {
    return (
        <div className="footer-bottom">
            <div className="container bottom-grid">
                <section className="international">
                    <h3>Facevaly International</h3>
                    <div>
                        <span>🇵🇰 Pakistan</span>
                        <span>🇧🇩 Bangladesh</span>
                        <span>🇱🇰 Sri Lanka</span>
                        <span>🇲🇲 Myanmar</span>
                        <span>🇳🇵 Nepal</span>
                    </div>
                </section>

                <section className="follow">
                    <h3>Follow Us</h3>
                    <div>
                        <a href="#" aria-label="Facebook">
                            <i className="fa-brands fa-facebook-f" />
                        </a>
                        <a href="#" aria-label="YouTube">
                            <i className="fa-brands fa-youtube" />
                        </a>
                        <a href="#" aria-label="Twitter">
                            <i className="fa-brands fa-x-twitter" />
                        </a>
                        <a href="#" aria-label="Instagram">
                            <i className="fa-brands fa-instagram" />
                        </a>
                    </div>
                </section>

                <p className="copyright">© Facevaly 2026</p>
            </div>
        </div>
    );
}
