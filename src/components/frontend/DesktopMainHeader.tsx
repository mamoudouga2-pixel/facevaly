import React from "react";

import {
    Link,
} from "react-router-dom";

import {
    useCart,
} from "../../context/CartContext";

import {
    useWishlist,
} from "../../context/WishlistContext";

import DynamicSearchBox
    from "./search/DynamicSearchBox";

import "./styles/DesktopMainHeader.css";
import "./styles/DesktopMainHeader.cart-patch.css";


const LOGO_URL =
    "/img/logo.webp";


export default function DesktopMainHeader({
    isStuck = false,
    onSearch,
}) {
    const {
        itemCount,
    } =
        useCart();

    const {
        itemCount: wishlistCount,
    } =
        useWishlist();


    return (
        <header
            className={
                `desktop-mainbar${isStuck ? " is-stuck" : ""}`
            }

            id="desktopMainbar"
        >

            <div className="main-head container">

                <Link
                    className="brand"
                    to="/"
                    aria-label="Facevaly home"
                >

                    <img
                        className="facevaly-logo"
                        src={
                            LOGO_URL
                        }
                        alt="Facevaly logo"
                    />


                    <strong>
                        Facevaly
                    </strong>

                </Link>


                <DynamicSearchBox
                    variant="desktop"
                    placeholder="Search in Facevaly"
                    onSearch={
                        onSearch
                    }
                />


                <div className="main-head-actions">
                    <Link
                        className="header-icon-btn customer-login-btn"
                        to="/login"
                        aria-label="Customer login"
                    >
                        <i
                            className="fa-regular fa-user"
                            aria-hidden="true"
                        />
                    </Link>

                    <Link
                        className="header-icon-btn"
                        to="/wishlist"
                        aria-label={`Wishlist with ${wishlistCount} item(s)`}
                    >
                        <i className="fa-regular fa-heart" />

                        {wishlistCount >
                            0 && (
                            <span className="fv-header-cart-count">
                                {
                                    wishlistCount >
                                    99
                                        ? "99+"
                                        : wishlistCount
                                }
                            </span>
                        )}
                    </Link>

                    <Link
                        className="cart-btn header-icon-btn"
                        to="/cart"
                        aria-label={`Cart with ${itemCount} item(s)`}
                    >
                        <i className="fa-solid fa-cart-shopping" />

                        {itemCount >
                            0 && (
                            <span className="fv-header-cart-count">
                                {
                                    itemCount >
                                    99
                                        ? "99+"
                                        : itemCount
                                }
                            </span>
                        )}
                    </Link>
                </div>

            </div>

        </header>
    );
}
