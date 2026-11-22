import React from "react";
import { Link } from "react-router-dom";

import useSellerAuth from "../../hooks/useSellerAuth";

import "./styles/DesktopTopbar.css";

export default function DesktopTopbar() {
    const { isAuthenticated } = useSellerAuth();

    return (
        <div className="desktop-topbar">
            <div className="container top-strip">
                <div className="top-strip-note">
                    <i className="fa-solid fa-bolt" aria-hidden="true" />
                    <span>Fast delivery across Bangladesh</span>
                </div>

                <div className="top-links">
                    <Link to="/help-support">Help &amp; support</Link>
                    <Link
                        className="top-links-seller-cta"
                        to={
                            isAuthenticated
                                ? "/seller/dashboard"
                                : "/become-a-seller"
                        }
                    >
                        {isAuthenticated
                            ? "Seller Dashboard"
                            : "Sell on Facevaly"}
                    </Link>
                </div>
            </div>
        </div>
    );
}
