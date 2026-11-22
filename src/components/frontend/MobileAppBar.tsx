import React from "react";

import {
    Link,
} from "react-router-dom";

import useSellerAuth from "../../hooks/useSellerAuth";

import "./styles/MobileAppBar.css";


const LOGO_URL =
    "/img/logo.webp";


export default function MobileAppBar() {
    const { isAuthenticated } = useSellerAuth();

    return (
        <div
            className="mobile-appbar"
            id="mobileAppbar"
        >

            {/* ============================================================
                APP IDENTITY
            ============================================================ */}

            <div className="app-id">

                <img
                    src={LOGO_URL}
                    alt="Facevaly logo"
                />


                <div>

                    <strong>
                        Facevaly App
                    </strong>

                    <small>
                        Save more on App
                    </small>

                </div>

            </div>


            {/* ============================================================
                SELLER CTA
            ============================================================ */}

            <Link
                to={
                    isAuthenticated
                        ? "/seller/dashboard"
                        : "/become-a-seller"
                }
                className="mobile-appbar-seller-link"
            >
                {isAuthenticated
                    ? "Seller Dashboard"
                    : "Sell on Facevaly"}
            </Link>

        </div>
    );
}
