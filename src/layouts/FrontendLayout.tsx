import React from "react";

import {
    Outlet,
    useLocation,
} from "react-router-dom";

import DesktopTopbar from "../components/frontend/DesktopTopbar";
import DesktopMainHeader from "../components/frontend/DesktopMainHeader";
import MobileAppBar from "../components/frontend/MobileAppBar";
import MobileSearchBar from "../components/frontend/MobileSearchBar";
import DesktopFooter from "../components/frontend/DesktopFooter";
import MobileBottomNav from "../components/frontend/MobileBottomNav";

import useFrontendStickyState from "../hooks/useFrontendStickyState";

import {
    useStorefrontToast,
} from "../context/StorefrontToastContext";

import "../components/frontend/styles/Global.css";

function FrontendLayoutBody({
    children,
}) {
    const location =
        useLocation();

    const {
        desktopStuck,
        mobileSearchStuck,
    } =
        useFrontendStickyState();

    const {
        showToast,
    } =
        useStorefrontToast();

    /*
    |--------------------------------------------------------------------------
    | MOBILE SPECIAL ROUTES
    |--------------------------------------------------------------------------
    */

    const isCategoryHub =
        location.pathname === "/categories";

    const isProductDetail =
        /^\/product\/[^/]+\/?$/.test(
            location.pathname
        );


    /*
    |--------------------------------------------------------------------------
    | VENDOR STORE MOBILE PAGE
    |--------------------------------------------------------------------------
    |
    | The requested store reference begins directly with the seller banner,
    | therefore the normal Facevaly App/Search chrome is hidden on mobile.
    |
    | The normal Mobile Bottom Nav remains available.
    |
    */

    const isVendorStore =
        /^\/store\/[^/]+\/?$/.test(
            location.pathname
        );


    const isCheckout =
        location.pathname ===
        "/checkout";


    const isCart =
        location.pathname === "/cart"
        || location.pathname === "/cart/";


    const isOrderSuccess =
        /^\/order-success\/[^/]+\/?$/.test(
            location.pathname
        );


    const hideMobileTopChrome =
        isCategoryHub ||
        isProductDetail ||
        isVendorStore ||
        isCheckout ||
        isCart ||
        isOrderSuccess;

    const hideMobileBottomNav =
        isProductDetail ||
        isCheckout ||
        isCart ||
        isOrderSuccess;

    const handleSearch = (
        query
    ) => {
        showToast(
            query
                ? `Searching Facevaly for “${query}”`
                : "Type something to search",
            query
                ? "success"
                : "warning"
        );
    };

    const handleOpenApp = () => {
        showToast(
            "Facevaly app demo — connect your real app link here."
        );
    };

    return (
        <div className="page-shell">
            <DesktopTopbar />

            <DesktopMainHeader
                isStuck={desktopStuck}
                onSearch={handleSearch}
            />

            {!hideMobileTopChrome && (
                <MobileAppBar
                    onOpenApp={handleOpenApp}
                />
            )}

            <main>
                {!hideMobileTopChrome && (
                    <MobileSearchBar
                        isStuck={mobileSearchStuck}
                        onSearch={handleSearch}
                    />
                )}

                {children ?? <Outlet />}
            </main>

            <DesktopFooter />

            {!hideMobileBottomNav && (
                <MobileBottomNav />
            )}
        </div>
    );
}

export default function FrontendLayout({
    children,
}) {
    // Cart / Wishlist / Toast providers live in Router so header hooks
    // always resolve (layout route + HMR-safe).
    return (
        <FrontendLayoutBody>
            {children}
        </FrontendLayoutBody>
    );
}
