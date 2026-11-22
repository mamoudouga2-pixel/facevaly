import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import storefrontCartService
    from "../services/storefrontCartService";


const CartContext =
    createContext(null);


/* =========================================================
   HELPERS
========================================================= */

function messageFromError(
    error,
    fallback =
        "Cart request failed."
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


function integer(
    value,
    fallback = 0
) {
    const number =
        Number(
            value
        );


    return Number.isInteger(
        number
    )
        ? number
        : fallback;
}


/** Normalize cart API payload for Cart.tsx (groups + available + row_count). */
function normalizeCartPayload(payload) {
    if (!payload || typeof payload !== "object") {
        return payload || null;
    }

    const items = Array.isArray(payload.items)
        ? payload.items.map((item) => ({
            ...item,
            available:
                typeof item?.available === "boolean"
                    ? item.available
                    : true,
        }))
        : [];

    const groups = Array.isArray(payload.groups)
        ? payload.groups
        : Array.isArray(payload.vendors)
            ? payload.vendors
            : [];

    const normalizedGroups = groups.map((group) => ({
        ...group,
        items: Array.isArray(group?.items)
            ? group.items.map((item) => ({
                ...item,
                available:
                    typeof item?.available === "boolean"
                        ? item.available
                        : true,
            }))
            : [],
    }));

    return {
        ...payload,
        items,
        groups: normalizedGroups,
        vendors: Array.isArray(payload.vendors)
            ? payload.vendors
            : normalizedGroups,
        row_count: Number(
            payload.row_count ?? items.length ?? 0
        ),
        item_count: Number(
            payload.item_count
            ?? payload.quantity_total
            ?? 0
        ),
    };
}


/* =========================================================
   PROVIDER
========================================================= */

export function CartProvider({
    children,
}) {
    const [
        cart,
        setCart,
    ] =
        useState(null);


    const [
        loading,
        setLoading,
    ] =
        useState(true);


    const [
        mutating,
        setMutating,
    ] =
        useState(false);


    const [
        error,
        setError,
    ] =
        useState("");


    /*
     * Prevent an older GET /cart response from overwriting
     * a newer Add To Cart response.
     */
    const requestVersionRef =
        useRef(0);


    const mutationCountRef =
        useRef(0);


    /* =====================================================
       MUTATION COUNTER
    ===================================================== */

    const mutationStart =
        useCallback(
            () => {
                mutationCountRef.current +=
                    1;


                setMutating(
                    true
                );
            },
            []
        );


    const mutationEnd =
        useCallback(
            () => {
                mutationCountRef.current =
                    Math.max(
                        0,
                        mutationCountRef.current -
                            1
                    );


                if (
                    mutationCountRef.current ===
                    0
                ) {
                    setMutating(
                        false
                    );
                }
            },
            []
        );


    /* =====================================================
       APPLY RESPONSE
    ===================================================== */

    const setCartFromResponse =
        useCallback(
            (
                response
            ) => {
                /*
                 * Invalidate older refresh requests.
                 */

                ++requestVersionRef.current;


                const nextCart =
                    normalizeCartPayload(
                        response?.data
                    );


                if (
                    nextCart
                ) {
                    setCart(
                        nextCart
                    );
                }


                setLoading(
                    false
                );


                setError(
                    ""
                );


                return nextCart;
            },
            []
        );


    /* =====================================================
       REFRESH CART
    ===================================================== */

    const refreshCart =
        useCallback(
            async () => {
                const version =
                    ++requestVersionRef.current;


                setLoading(
                    true
                );


                try {
                    const response =
                        await storefrontCartService.get();


                    const nextCart =
                        normalizeCartPayload(
                            response?.data
                        );


                    if (
                        version !==
                        requestVersionRef.current
                    ) {
                        return nextCart;
                    }


                    setCart(
                        nextCart
                    );


                    setError(
                        ""
                    );


                    return nextCart;
                } catch (
                    exception
                ) {
                    if (
                        version ===
                        requestVersionRef.current
                    ) {
                        setError(
                            messageFromError(
                                exception,
                                "Cart could not be loaded."
                            )
                        );
                    }


                    throw exception;
                } finally {
                    if (
                        version ===
                        requestVersionRef.current
                    ) {
                        setLoading(
                            false
                        );
                    }
                }
            },
            []
        );


    /* =====================================================
       INITIAL LOAD
    ===================================================== */

    useEffect(
        () => {
            let active =
                true;

            refreshCart().catch(
                () => {
                    /*
                     * Do not crash the entire storefront
                     * if cart API is temporarily unavailable.
                     */
                }
            );

            return () => {
                active =
                    false;
            };
        },
        [
            refreshCart,
        ]
    );


    /* =====================================================
       ADD TO CART
    ===================================================== */

    const addToCart =
        useCallback(
            async (
                product,
                quantityOverride =
                    null
            ) => {
                const productId =
                    integer(
                        product
                            ?.product_id
                        ??
                        product
                            ?.id,
                        0
                    );


                if (
                    productId <=
                    0
                ) {
                    throw new Error(
                        "A valid product is required."
                    );
                }


                const rawVariantId =
                    product
                        ?.variant_id
                    ??
                    product
                        ?.product_variant_id
                    ??
                    null;


                const variantId =
                    rawVariantId ===
                        null
                    ||
                    rawVariantId ===
                        undefined
                    ||
                    rawVariantId ===
                        ""
                        ? null
                        : integer(
                            rawVariantId,
                            0
                        );


                if (
                    variantId !==
                        null
                    &&
                    variantId <=
                        0
                ) {
                    throw new Error(
                        "The selected product option is invalid."
                    );
                }


                const quantity =
                    Math.max(
                        1,
                        integer(
                            quantityOverride
                            ??
                            product
                                ?.quantity
                            ??
                            1,
                            1
                        )
                    );


                /*
                 * Invalidate any pending GET /cart.
                 */

                ++requestVersionRef.current;


                mutationStart();


                setError(
                    ""
                );


                try {
                    const response =
                        await storefrontCartService.add({
                            product_id:
                                productId,

                            variant_id:
                                variantId,

                            quantity,
                        });


                    setCartFromResponse(
                        response
                    );


                    return response;
                } catch (
                    exception
                ) {
                    setError(
                        messageFromError(
                            exception,
                            "Product could not be added to cart."
                        )
                    );


                    throw exception;
                } finally {
                    mutationEnd();
                }
            },
            [
                mutationEnd,
                mutationStart,
                setCartFromResponse,
            ]
        );


    /* =====================================================
       UPDATE ITEM
    ===================================================== */

    const updateCartItem =
        useCallback(
            async (
                itemId,
                quantity
            ) => {
                ++requestVersionRef.current;


                mutationStart();


                try {
                    const response =
                        await storefrontCartService.update(
                            itemId,
                            quantity
                        );


                    setCartFromResponse(
                        response
                    );


                    return response;
                } catch (
                    exception
                ) {
                    setError(
                        messageFromError(
                            exception,
                            "Cart quantity could not be updated."
                        )
                    );


                    throw exception;
                } finally {
                    mutationEnd();
                }
            },
            [
                mutationEnd,
                mutationStart,
                setCartFromResponse,
            ]
        );


    /* =====================================================
       REMOVE ITEM
    ===================================================== */

    const removeCartItem =
        useCallback(
            async (
                itemId
            ) => {
                ++requestVersionRef.current;


                mutationStart();


                try {
                    const response =
                        await storefrontCartService.remove(
                            itemId
                        );


                    setCartFromResponse(
                        response
                    );


                    return response;
                } catch (
                    exception
                ) {
                    setError(
                        messageFromError(
                            exception,
                            "Cart item could not be removed."
                        )
                    );


                    throw exception;
                } finally {
                    mutationEnd();
                }
            },
            [
                mutationEnd,
                mutationStart,
                setCartFromResponse,
            ]
        );


    /* =====================================================
       REMOVE SELECTED
    ===================================================== */

    const removeSelectedItems =
        useCallback(
            async (
                ids
            ) => {
                ++requestVersionRef.current;


                mutationStart();


                try {
                    const response =
                        await storefrontCartService.removeSelected(
                            ids
                        );


                    setCartFromResponse(
                        response
                    );


                    return response;
                } catch (
                    exception
                ) {
                    setError(
                        messageFromError(
                            exception,
                            "Selected cart items could not be removed."
                        )
                    );


                    throw exception;
                } finally {
                    mutationEnd();
                }
            },
            [
                mutationEnd,
                mutationStart,
                setCartFromResponse,
            ]
        );


    /* =====================================================
       MOVE TO WISHLIST
    ===================================================== */

    const moveCartItemToWishlist =
        useCallback(
            async (
                itemId
            ) => {
                ++requestVersionRef.current;


                mutationStart();


                try {
                    const response =
                        await storefrontCartService.moveToWishlist(
                            itemId
                        );


                    setCartFromResponse(
                        response
                    );


                    return response;
                } catch (
                    exception
                ) {
                    setError(
                        messageFromError(
                            exception,
                            "Item could not be moved to wishlist."
                        )
                    );


                    throw exception;
                } finally {
                    mutationEnd();
                }
            },
            [
                mutationEnd,
                mutationStart,
                setCartFromResponse,
            ]
        );


    /* =====================================================
       COUNTS
    ===================================================== */

    const itemCount =
        useMemo(
            () =>
                Number(
                    cart
                        ?.item_count
                    || 0
                ),
            [
                cart
                    ?.item_count,
            ]
        );


    const rowCount =
        useMemo(
            () =>
                Number(
                    cart
                        ?.row_count
                    || 0
                ),
            [
                cart
                    ?.row_count,
            ]
        );


    /* =====================================================
       VALUE
    ===================================================== */

    const value =
        useMemo(
            () => ({
                cart,

                itemCount,

                rowCount,

                loading,

                mutating,

                error,

                refreshCart,

                setCart,

                setCartFromResponse,

                /*
                 * New production-safe operations.
                 */

                addToCart,

                updateCartItem,

                removeCartItem,

                removeSelectedItems,

                moveCartItemToWishlist,

                clearCartError:
                    () =>
                        setError(
                            ""
                        ),
            }),
            [
                cart,
                itemCount,
                rowCount,
                loading,
                mutating,
                error,
                refreshCart,
                setCartFromResponse,
                addToCart,
                updateCartItem,
                removeCartItem,
                removeSelectedItems,
                moveCartItemToWishlist,
            ]
        );


    return (
        <CartContext.Provider
            value={
                value
            }
        >
            {children}
        </CartContext.Provider>
    );
}


/* =========================================================
   HOOK
========================================================= */

export function useCart() {
    const context =
        useContext(
            CartContext
        );


    if (
        !context
    ) {
        throw new Error(
            "useCart must be used inside CartProvider."
        );
    }


    return context;
}