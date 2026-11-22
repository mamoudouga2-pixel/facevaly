import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import CartVendorGroup
    from "../../components/frontend/cart/CartVendorGroup";

import CartSummary, {
    CartMobileCheckoutBar,
} from "../../components/frontend/cart/CartSummary";

import MoveWishlistModal
    from "../../components/frontend/cart/MoveWishlistModal";

import JustForYouSection
    from "../../components/frontend/justforyou/JustForYouSection";

import storefrontCartService
    from "../../services/storefrontCartService";

import storefrontService
    from "../../services/storefrontService";

import {
    useCart,
} from "../../context/CartContext";

import {
    useWishlist,
} from "../../context/WishlistContext";

import {
    useStorefrontToast,
} from "../../context/StorefrontToastContext";

import "./Cart.css";


/* =========================================================
   ERROR
========================================================= */

function errorMessage(
    error,
    fallback
) {
    return (
        error?.response
            ?.data
            ?.message
        ||
        error?.data
            ?.message
        ||
        error?.message
        ||
        fallback
    );
}


/* =========================================================
   CART PAGE
========================================================= */

export default function Cart() {
    const navigate =
        useNavigate();


    const {
        cart,

        refreshCart,

        updateCartItem,

        removeCartItem,

        removeSelectedItems,

        moveCartItemToWishlist,
    } =
        useCart();

    const {
        refreshWishlist,
    } =
        useWishlist();


    const {
        showToast,
    } =
        useStorefrontToast();


    const [
        selected,
        setSelected,
    ] =
        useState([]);


    const [
        loading,
        setLoading,
    ] =
        useState(
            !cart
        );


    const [
        busyItem,
        setBusyItem,
    ] =
        useState(null);


    const [
        wishlistItem,
        setWishlistItem,
    ] =
        useState(null);


    const [
        wishlistBusy,
        setWishlistBusy,
    ] =
        useState(false);


    const [
        bulkBusy,
        setBulkBusy,
    ] =
        useState(false);


    const [
        checkoutBusy,
        setCheckoutBusy,
    ] =
        useState(false);


    const [
        couponCode,
        setCouponCode,
    ] =
        useState("");


    const [
        coupon,
        setCoupon,
    ] =
        useState(null);


    const [
        couponBusy,
        setCouponBusy,
    ] =
        useState(false);


    /* =====================================================
       LOAD
    ===================================================== */

    useEffect(
        () => {
            if (
                cart
            ) {
                setLoading(
                    false
                );

                return;
            }


            let active =
                true;


            refreshCart()
                .catch(
                    (
                        exception
                    ) => {
                        if (
                            active
                        ) {
                            showToast(
                                errorMessage(
                                    exception,
                                    "Cart could not be loaded."
                                ),
                                "error"
                            );
                        }
                    }
                )
                .finally(
                    () => {
                        if (
                            active
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                );


            return () => {
                active =
                    false;
            };
        },
        [
            cart,
            refreshCart,
            showToast,
        ]
    );


    /* =====================================================
       KEEP SELECTION VALID
    ===================================================== */

    useEffect(
        () => {
            const validIds =
                new Set(
                    (
                        cart?.items
                        || []
                    )
                        .filter(
                            (
                                item
                            ) =>
                                item
                                    .available
                        )
                        .map(
                            (
                                item
                            ) =>
                                item.id
                        )
                );


            setSelected(
                (
                    current
                ) =>
                    current.filter(
                        (
                            id
                        ) =>
                            validIds.has(
                                id
                            )
                    )
            );


            /*
             * Cart changed -> existing coupon preview
             * may no longer be valid.
             */

            setCoupon(
                null
            );
        },
        [
            cart?.row_count,
        ]
    );


    /* =====================================================
       SELECTABLE ITEMS
    ===================================================== */

    const selectableItems =
        useMemo(
            () =>
                (
                    cart?.items
                    || []
                ).filter(
                    (
                        item
                    ) =>
                        item.available
                ),
            [
                cart,
            ]
        );


    const allSelected =
        selectableItems.length >
            0
        &&
        selectableItems.every(
            (
                item
            ) =>
                selected.includes(
                    item.id
                )
        );


    const selectedItems =
        useMemo(
            () =>
                (
                    cart?.items
                    || []
                ).filter(
                    (
                        item
                    ) =>
                        selected.includes(
                            item.id
                        )
                        &&
                        item.available
                ),
            [
                cart,
                selected,
            ]
        );


    const selectedSubtotal =
        selectedItems.reduce(
            (
                total,
                item
            ) =>
                total
                +
                Number(
                    item
                        .line_total
                    || 0
                ),
            0
        );


    const selectedQuantity =
        selectedItems.reduce(
            (
                total,
                item
            ) =>
                total
                +
                Number(
                    item
                        .quantity
                    || 0
                ),
            0
        );


    /* =====================================================
       SELECT ONE
    ===================================================== */

    const toggleItem =
        (
            id
        ) => {
            setSelected(
                (
                    current
                ) =>
                    current.includes(
                        id
                    )
                        ? current.filter(
                            (
                                value
                            ) =>
                                value !==
                                id
                        )
                        : [
                            ...current,
                            id,
                        ]
            );


            setCoupon(
                null
            );
        };


    /* =====================================================
       SELECT ALL
    ===================================================== */

    const toggleAll =
        () => {
            setSelected(
                allSelected
                    ? []
                    : selectableItems.map(
                        (
                            item
                        ) =>
                            item.id
                    )
            );


            setCoupon(
                null
            );
        };


    /* =====================================================
       QUANTITY
    ===================================================== */

    const updateQuantity =
        async (
            item,
            quantity
        ) => {
            const nextQuantity =
                Math.max(
                    1,
                    Number(
                        quantity
                        || 1
                    )
                );


            if (
                item
                    .max_quantity !==
                    null
                &&
                item
                    .max_quantity !==
                    undefined
                &&
                nextQuantity >
                    Number(
                        item
                            .max_quantity
                    )
            ) {
                showToast(
                    `Only ${item.max_quantity} item(s) are available.`,
                    "warning"
                );


                return;
            }


            try {
                setBusyItem(
                    item.id
                );


                const response =
                    await updateCartItem(
                        item.id,
                        nextQuantity
                    );


                setCoupon(
                    null
                );


                showToast(
                    response
                        ?.message
                    ||
                    "Cart updated."
                );
            } catch (
                exception
            ) {
                showToast(
                    errorMessage(
                        exception,
                        "Cart quantity could not be updated."
                    ),
                    "error"
                );
            } finally {
                setBusyItem(
                    null
                );
            }
        };


    /* =====================================================
       REMOVE ONE
    ===================================================== */

    const removeItem =
        async (
            item
        ) => {
            try {
                setBusyItem(
                    item.id
                );


                const response =
                    await removeCartItem(
                        item.id
                    );


                setCoupon(
                    null
                );


                showToast(
                    response
                        ?.message
                    ||
                    "Item removed."
                );
            } catch (
                exception
            ) {
                showToast(
                    errorMessage(
                        exception,
                        "Item could not be removed."
                    ),
                    "error"
                );
            } finally {
                setBusyItem(
                    null
                );
            }
        };


    /* =====================================================
       REMOVE SELECTED
    ===================================================== */

    const removeSelected =
        async () => {
            if (
                selected.length ===
                    0
            ) {
                return;
            }


            try {
                setBulkBusy(
                    true
                );


                const response =
                    await removeSelectedItems(
                        selected
                    );


                setSelected(
                    []
                );


                setCoupon(
                    null
                );


                showToast(
                    response
                        ?.message
                    ||
                    "Selected items removed."
                );
            } catch (
                exception
            ) {
                showToast(
                    errorMessage(
                        exception,
                        "Selected items could not be removed."
                    ),
                    "error"
                );
            } finally {
                setBulkBusy(
                    false
                );
            }
        };


    /* =====================================================
       MOVE TO WISHLIST
    ===================================================== */

    const confirmMoveWishlist =
        async () => {
            if (
                !wishlistItem
            ) {
                return;
            }


            try {
                setWishlistBusy(
                    true
                );


                const response =
                    await moveCartItemToWishlist(
                        wishlistItem.id
                    );


                setWishlistItem(
                    null
                );


                setCoupon(
                    null
                );

                await refreshWishlist();

                showToast(
                    response
                        ?.message
                    ||
                    "Moved to wishlist."
                );
            } catch (
                exception
            ) {
                const status =
                    Number(
                        exception
                            ?.status
                        ||
                        exception
                            ?.response
                            ?.status
                        ||
                        0
                    );


                showToast(
                    errorMessage(
                        exception,
                        "Item could not be moved to wishlist."
                    ),
                    status ===
                        401
                        ? "warning"
                        : "error"
                );
            } finally {
                setWishlistBusy(
                    false
                );
            }
        };


    /* =====================================================
       COUPON
    ===================================================== */

    const applyCoupon =
        async () => {
            const code =
                couponCode
                    .trim();


            if (
                !code
            ) {
                showToast(
                    "Enter a voucher code.",
                    "warning"
                );


                return;
            }


            if (
                selected.length ===
                    0
            ) {
                showToast(
                    "Select at least one cart item first.",
                    "warning"
                );


                return;
            }


            try {
                setCouponBusy(
                    true
                );


                const response =
                    await storefrontCartService.couponPreview(
                        code,
                        selected
                    );


                setCoupon(
                    response
                        ?.data
                    || null
                );


                showToast(
                    response
                        ?.message
                    ||
                    "Voucher applied."
                );
            } catch (
                exception
            ) {
                setCoupon(
                    null
                );


                showToast(
                    errorMessage(
                        exception,
                        "Voucher could not be applied."
                    ),
                    "error"
                );
            } finally {
                setCouponBusy(
                    false
                );
            }
        };


    /* =====================================================
       CHECKOUT
    ===================================================== */

    const proceedCheckout =
        async () => {
            if (
                selectedItems.length ===
                    0
            ) {
                showToast(
                    "Select at least one cart item to continue.",
                    "warning"
                );


                return;
            }


            if (
                checkoutBusy
            ) {
                return;
            }


            try {
                setCheckoutBusy(
                    true
                );


                /*
                 * Send the SERVER cart row IDs.
                 */

                const response =
                    await storefrontService.startCartCheckout(
                        selectedItems.map(
                            (
                                item
                            ) =>
                                item.id
                        ),

                        coupon
                            ?.code
                        || null
                    );


                const token =
                    response
                        ?.data
                        ?.checkout_token;


                if (
                    !token
                ) {
                    throw new Error(
                        "Checkout token was not returned."
                    );
                }


                showToast(
                    response
                        ?.message
                    ||
                    "Checkout ready."
                );


                navigate(
                    `/checkout?token=${encodeURIComponent(
                        token
                    )}`
                );
            } catch (
                exception
            ) {
                showToast(
                    errorMessage(
                        exception,
                        "Checkout could not be started."
                    ),
                    "error"
                );
            } finally {
                setCheckoutBusy(
                    false
                );
            }
        };


    /* =====================================================
       LOADING
    ===================================================== */

    if (
        loading
    ) {
        return (
            <div className="fv-cart-loading">

                <i className="fa-solid fa-spinner fa-spin" />

                Loading cart...

            </div>
        );
    }


    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div className="fv-cart-page">

            <div className="fv-cart-mobile-top">
                <button
                    type="button"
                    className="fv-cart-mobile-back"
                    aria-label="Go back"
                    onClick={() => navigate(-1)}
                >
                    <i className="fa-solid fa-arrow-left" />
                </button>

                <h1>
                    My Cart
                    <span>({cart?.item_count || 0})</span>
                </h1>

                <button
                    type="button"
                    className="fv-cart-mobile-trash"
                    aria-label="Delete selected"
                    disabled={selected.length === 0 || bulkBusy}
                    onClick={removeSelected}
                >
                    {bulkBusy ? (
                        <i className="fa-solid fa-spinner fa-spin" />
                    ) : (
                        <i className="fa-regular fa-trash-can" />
                    )}
                </button>
            </div>

            <div className="fv-cart-container">

                <div className="fv-cart-layout">

                    <main className="fv-cart-main">


                        {/* =================================
                            SELECT HEADER (desktop)
                        ================================= */}

                        <div className="fv-cart-select-head">

                            <label>

                                <input
                                    type="checkbox"
                                    checked={
                                        allSelected
                                    }
                                    onChange={
                                        toggleAll
                                    }
                                />

                                SELECT ALL (
                                {selectableItems.length}
                                {" "}
                                ITEM(S))

                            </label>


                            <button
                                type="button"
                                disabled={
                                    selected.length ===
                                        0
                                    ||
                                    bulkBusy
                                }
                                onClick={
                                    removeSelected
                                }
                            >
                                {bulkBusy ? (
                                    <i className="fa-solid fa-spinner fa-spin" />
                                ) : (
                                    <i className="fa-regular fa-trash-can" />
                                )}

                                DELETE
                            </button>

                        </div>


                        {/* =================================
                            GROUPS
                        ================================= */}

                        {cart
                            ?.groups
                            ?.length >
                        0 ? (

                            cart.groups.map(
                                (
                                    group
                                ) => (

                                    <CartVendorGroup
                                        group={
                                            group
                                        }
                                        selected={
                                            selected
                                        }
                                        busyItem={
                                            busyItem
                                        }
                                        onSelect={
                                            toggleItem
                                        }
                                        onQuantity={
                                            updateQuantity
                                        }
                                        onWishlist={
                                            setWishlistItem
                                        }
                                        onDelete={
                                            removeItem
                                        }
                                        key={
                                            group
                                                .vendor
                                                ?.id
                                            ||
                                            group
                                                .vendor
                                                ?.name
                                        }
                                    />

                                )
                            )

                        ) : (

                            <div className="fv-cart-empty">

                                <i className="fa-solid fa-cart-shopping" />

                                <h2>
                                    Your cart is empty
                                </h2>


                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/"
                                        )
                                    }
                                >
                                    Continue Shopping
                                </button>

                            </div>

                        )}

                        <div className="fv-cart-mobile-voucher">
                            <input
                                type="text"
                                placeholder="Enter Voucher Code"
                                value={couponCode}
                                onChange={(event) =>
                                    setCouponCode(
                                        event.target.value.toUpperCase()
                                    )
                                }
                            />
                            <button
                                type="button"
                                disabled={couponBusy || selected.length === 0}
                                onClick={applyCoupon}
                            >
                                {couponBusy ? "..." : "APPLY"}
                            </button>
                        </div>

                        {coupon ? (
                            <div className="fv-cart-mobile-coupon-ok">
                                {coupon.code}: −৳
                                {Number(coupon.discount || 0).toLocaleString(
                                    "en-BD",
                                    { maximumFractionDigits: 2 }
                                )}
                            </div>
                        ) : null}

                    </main>


                    {/* =====================================
                        SUMMARY
                    ===================================== */}

                    <CartSummary
                        selectedCount={
                            selectedQuantity
                        }
                        subtotal={
                            selectedSubtotal
                        }
                        shippingFee={
                            0
                        }
                        coupon={
                            coupon
                        }
                        couponCode={
                            couponCode
                        }
                        onCouponCode={
                            setCouponCode
                        }
                        onApplyCoupon={
                            applyCoupon
                        }
                        couponBusy={
                            couponBusy
                        }
                        onCheckout={
                            proceedCheckout
                        }
                        checkoutBusy={
                            checkoutBusy
                        }
                    />

                </div>

                <div className="fv-cart-jfy">
                    <JustForYouSection perPage={12} />
                </div>

            </div>

            <CartMobileCheckoutBar
                selectedCount={selectedQuantity}
                subtotal={selectedSubtotal}
                shippingFee={0}
                allSelected={allSelected}
                onToggleAll={toggleAll}
                selectableCount={selectableItems.length}
                onCheckout={proceedCheckout}
                checkoutBusy={checkoutBusy}
            />


            {/* =============================================
                WISHLIST MODAL
            ============================================= */}

            <MoveWishlistModal
                open={
                    Boolean(
                        wishlistItem
                    )
                }
                busy={
                    wishlistBusy
                }
                onCancel={() =>
                    setWishlistItem(
                        null
                    )
                }
                onMove={
                    confirmMoveWishlist
                }
            />

        </div>
    );
}