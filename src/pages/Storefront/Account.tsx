import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import accountService
    from "../../services/accountService";

import "./Account.css";


/*
|--------------------------------------------------------------------------
| ACCOUNT MENU DEFINITIONS
|--------------------------------------------------------------------------
|
| Keep navigation URLs in one place so they are easy to connect to future
| customer pages.
|
*/

const guestActions = [
    {
        label:
            "My Orders",

        description:
            "Track and manage your purchases",

        icon:
            "fa-solid fa-box",

        to:
            "/account/orders",
    },

    {
        label:
            "My Wishlist",

        description:
            "Products you saved for later",

        icon:
            "fa-regular fa-heart",

        to:
            "/account/wishlist",
    },

    {
        label:
            "Address Book",

        description:
            "Manage delivery addresses",

        icon:
            "fa-regular fa-address-book",

        to:
            "/account/addresses",
    },

    {
        label:
            "Vouchers",

        description:
            "View available vouchers",

        icon:
            "fa-solid fa-ticket",

        to:
            "/account/vouchers",
    },

    {
        label:
            "Help & Support",

        description:
            "Get help with your orders",

        icon:
            "fa-regular fa-circle-question",

        to:
            "/contact",
    },
];


const orderShortcuts = [
    {
        key:
            "to_pay",

        label:
            "To Pay",

        icon:
            "fa-regular fa-credit-card",

        to:
            "/account/orders?status=to-pay",
    },

    {
        key:
            "to_ship",

        label:
            "To Ship",

        icon:
            "fa-solid fa-box-open",

        to:
            "/account/orders?status=to-ship",
    },

    {
        key:
            "to_receive",

        label:
            "To Receive",

        icon:
            "fa-solid fa-truck-fast",

        to:
            "/account/orders?status=to-receive",
    },

    {
        key:
            "completed",

        label:
            "Completed",

        icon:
            "fa-regular fa-circle-check",

        to:
            "/account/orders?status=completed",
    },
];


/*
|--------------------------------------------------------------------------
| AVATAR
|--------------------------------------------------------------------------
*/

function AccountAvatar({
    profile,
}) {
    const [
        failed,
        setFailed,
    ] =
        useState(false);

    if (
        profile?.avatar
        &&
        !failed
    ) {
        return (
            <img
                src={
                    profile.avatar
                }
                alt={
                    profile.name
                    ||
                    "Customer"
                }
                onError={() =>
                    setFailed(
                        true
                    )
                }
            />
        );
    }

    return (
        <i className="fa-regular fa-user" />
    );
}


/*
|--------------------------------------------------------------------------
| ACCOUNT PAGE
|--------------------------------------------------------------------------
*/

export default function Account() {
    const [
        account,
        setAccount,
    ] =
        useState(null);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | LOAD ACCOUNT
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            let alive =
                true;

            setLoading(
                true
            );

            setError("");

            accountService
                .show()
                .then(
                    (
                        response
                    ) => {
                        if (
                            alive
                        ) {
                            setAccount(
                                response?.data
                                ||
                                null
                            );
                        }
                    }
                )
                .catch(
                    (
                        exception
                    ) => {
                        if (
                            alive
                        ) {
                            setError(
                                exception?.message
                                ||
                                "Account could not be loaded."
                            );
                        }
                    }
                )
                .finally(
                    () => {
                        if (
                            alive
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                );

            return () => {
                alive =
                    false;
            };
        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | PROFILE
    |--------------------------------------------------------------------------
    */

    const authenticated =
        Boolean(
            account?.authenticated
        );

    const profile =
        account?.profile
        ||
        null;

    const orders =
        account?.orders
        ||
        {};


    const displayName =
        profile?.name
        ||
        "Facevaly Customer";


    const secondaryText =
        profile?.phone
        ||
        profile?.email
        ||
        "Manage your Facevaly account";


    /*
    |--------------------------------------------------------------------------
    | ACCOUNT MENU
    |--------------------------------------------------------------------------
    */

    const accountMenu =
        useMemo(
            () => [
                {
                    label:
                        "My Orders",

                    description:
                        `${Number(
                            orders.total
                            ||
                            0
                        )} total orders`,

                    icon:
                        "fa-solid fa-box",

                    to:
                        "/account/orders",
                },

                {
                    label:
                        "My Wishlist",

                    description:
                        `${Number(
                            account?.wishlist_count
                            ||
                            0
                        )} saved items`,

                    icon:
                        "fa-regular fa-heart",

                    to:
                        "/account/wishlist",
                },

                {
                    label:
                        "Address Book",

                    description:
                        "Manage delivery addresses",

                    icon:
                        "fa-regular fa-address-book",

                    to:
                        "/account/addresses",
                },

                {
                    label:
                        "Vouchers",

                    description:
                        "View your vouchers",

                    icon:
                        "fa-solid fa-ticket",

                    to:
                        "/account/vouchers",
                },

                {
                    label:
                        "Account Settings",

                    description:
                        "Profile and security",

                    icon:
                        "fa-solid fa-gear",

                    to:
                        "/account/settings",
                },

                {
                    label:
                        "Help & Support",

                    description:
                        "We're here to help",

                    icon:
                        "fa-regular fa-circle-question",

                    to:
                        "/contact",
                },
            ],
            [
                orders.total,
                account?.wishlist_count,
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (
        loading
    ) {
        return (
            <div className="fv-account-page">

                <div className="fv-account-container">

                    <div className="fv-account-loading">

                        <i className="fa-solid fa-spinner fa-spin" />

                        Loading your account...

                    </div>

                </div>

            </div>
        );
    }


    /*
    |--------------------------------------------------------------------------
    | API ERROR
    |--------------------------------------------------------------------------
    */

    if (
        error
    ) {
        return (
            <div className="fv-account-page">

                <div className="fv-account-container">

                    <div className="fv-account-error">

                        <i className="fa-solid fa-circle-exclamation" />

                        {
                            error
                        }

                    </div>

                </div>

            </div>
        );
    }


    return (
        <div className="fv-account-page">

            <div className="fv-account-container">


                {/* ========================================================
                    TITLE
                ======================================================== */}

                <div className="fv-account-page-title">

                    <span>
                        ACCOUNT
                    </span>

                    <h1>
                        My Account
                    </h1>

                </div>


                {/* ========================================================
                    PROFILE / LOGIN CARD
                ======================================================== */}

                <section className="fv-account-profile-card">

                    <div className="fv-account-profile-main">

                        <span className="fv-account-avatar">

                            <AccountAvatar
                                profile={
                                    profile
                                }
                            />

                        </span>


                        <div className="fv-account-profile-copy">

                            {authenticated ? (

                                <>

                                    <span>
                                        Welcome back
                                    </span>

                                    <strong>
                                        {
                                            displayName
                                        }
                                    </strong>

                                    <small>
                                        {
                                            secondaryText
                                        }
                                    </small>

                                </>

                            ) : (

                                <>

                                    <span>
                                        Welcome to Facevaly
                                    </span>

                                    <strong>
                                        Sign in to your account
                                    </strong>

                                    <small>
                                        Track orders, save products and manage your account.
                                    </small>

                                </>

                            )}

                        </div>

                    </div>


                    {authenticated ? (

                        <Link
                            className="fv-account-profile-action"
                            to="/account/settings"
                        >
                            Edit Profile

                            <i className="fa-solid fa-chevron-right" />
                        </Link>

                    ) : (

                        <div className="fv-account-auth-buttons">

                            <Link
                                className="primary"
                                to="/login"
                            >
                                LOGIN
                            </Link>


                            <Link
                                to="/register"
                            >
                                REGISTER
                            </Link>

                        </div>

                    )}

                </section>


                {/* ========================================================
                    ORDER SHORTCUTS
                    Logged-in customers only
                ======================================================== */}

                {authenticated && (

                    <section className="fv-account-section">

                        <div className="fv-account-section-head">

                            <h2>
                                My Orders
                            </h2>


                            <Link
                                to="/account/orders"
                            >
                                View All

                                <i className="fa-solid fa-chevron-right" />
                            </Link>

                        </div>


                        <div className="fv-account-order-shortcuts">

                            {orderShortcuts.map(
                                (
                                    item
                                ) => (

                                    <Link
                                        to={
                                            item.to
                                        }

                                        key={
                                            item.key
                                        }
                                    >

                                        <span className="fv-account-order-icon">

                                            <i
                                                className={
                                                    item.icon
                                                }
                                            />


                                            {Number(
                                                orders[
                                                    item.key
                                                ]
                                                ||
                                                0
                                            ) >
                                                0 && (

                                                <b>
                                                    {
                                                        Number(
                                                            orders[
                                                                item.key
                                                            ]
                                                            ||
                                                            0
                                                        ) >
                                                        99

                                                            ? "99+"

                                                            : orders[
                                                                item.key
                                                            ]
                                                    }
                                                </b>

                                            )}

                                        </span>


                                        <small>
                                            {
                                                item.label
                                            }
                                        </small>

                                    </Link>

                                )
                            )}

                        </div>

                    </section>

                )}


                {/* ========================================================
                    MENU
                ======================================================== */}

                <section className="fv-account-section">

                    <div className="fv-account-section-head">

                        <h2>
                            {
                                authenticated
                                    ? "Account"
                                    : "Explore Your Account"
                            }
                        </h2>

                    </div>


                    <div className="fv-account-menu">

                        {(authenticated
                            ? accountMenu
                            : guestActions
                        ).map(
                            (
                                item
                            ) => (

                                <Link
                                    to={
                                        item.to
                                    }

                                    key={
                                        item.label
                                    }
                                >

                                    <span className="fv-account-menu-icon">

                                        <i
                                            className={
                                                item.icon
                                            }
                                        />

                                    </span>


                                    <span className="fv-account-menu-copy">

                                        <strong>
                                            {
                                                item.label
                                            }
                                        </strong>

                                        <small>
                                            {
                                                item.description
                                            }
                                        </small>

                                    </span>


                                    <i className="fa-solid fa-chevron-right" />

                                </Link>

                            )
                        )}

                    </div>

                </section>


                {/* ========================================================
                    SELL ON FACEVALY
                ======================================================== */}

                {/* ========================================================
                    SELLER CENTER / BECOME A SELLER
                    --------------------------------------------------------
                    AUTH + SELLER CHECK:

                    Logged in + owns vendor
                    => Go to Dashboard
                    => /seller/dashboard

                    Guest OR logged in customer without vendor
                    => Start
                    => /become-a-seller
                ======================================================== */}

                <section className="fv-account-seller-card">

                    <span>

                        <i className="fa-solid fa-store" />

                    </span>


                    <div>

                        <strong>
                            {
                                authenticated
                                &&
                                account?.seller?.exists

                                    ? "Seller Center"

                                    : "Sell on Facevaly"
                            }
                        </strong>


                        <small>
                            {
                                authenticated
                                &&
                                account?.seller?.exists

                                    ? (
                                        account?.seller?.name
                                            ? `Manage ${account.seller.name}, products and orders.`
                                            : "Manage your store, products and orders."
                                    )

                                    : "Start selling and grow your business."
                            }
                        </small>

                    </div>


                    <Link
                        to={
                            authenticated
                            &&
                            account?.seller?.exists

                                ? (
                                    account?.seller?.dashboard_url
                                    ||
                                    "/seller/dashboard"
                                )

                                : "/become-a-seller"
                        }
                    >
                        {
                            authenticated
                            &&
                            account?.seller?.exists

                                ? "Go to Dashboard"

                                : "Start"
                        }

                        <i className="fa-solid fa-chevron-right" />
                    </Link>

                </section>


                {/* ========================================================
                    LOGOUT
                    Logged in only
                ======================================================== */}

                {authenticated && (

                    <Link
                        className="fv-account-logout"
                        to="/logout"
                    >

                        <i className="fa-solid fa-arrow-right-from-bracket" />

                        Log Out

                    </Link>

                )}

            </div>

        </div>
    );
}
