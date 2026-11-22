import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import storefrontWishlistService
    from "../services/storefrontWishlistService";


const WishlistContext =
    createContext(null);


function messageFromError(
    error,
    fallback = "Wishlist request failed."
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
    const number = Number(value);

    return Number.isInteger(number)
        ? number
        : fallback;
}


/** Backend returns `{ data: { items, count } }`; tolerate a bare array too. */
function itemsFromWishlistResponse(response) {
    const payload = response?.data;

    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.items)) {
        return payload.items;
    }

    return [];
}


export function WishlistProvider({
    children,
}) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mutating, setMutating] = useState(false);
    const [error, setError] = useState("");

    const requestVersionRef = useRef(0);
    const mutationCountRef = useRef(0);

    const mutationStart = useCallback(() => {
        mutationCountRef.current += 1;
        setMutating(true);
    }, []);

    const mutationEnd = useCallback(() => {
        mutationCountRef.current = Math.max(
            0,
            mutationCountRef.current - 1
        );

        if (mutationCountRef.current === 0) {
            setMutating(false);
        }
    }, []);

    const applyResponse = useCallback((response) => {
        ++requestVersionRef.current;

        const nextItems = itemsFromWishlistResponse(response);
        setItems(nextItems);
        setLoading(false);
        setError("");

        return nextItems;
    }, []);

    const refreshWishlist = useCallback(async () => {
        const version = ++requestVersionRef.current;

        setLoading(true);

        try {
            const response =
                await storefrontWishlistService.get();

            const nextItems = itemsFromWishlistResponse(response);

            if (version !== requestVersionRef.current) {
                return nextItems;
            }

            setItems(nextItems);
            setError("");

            return nextItems;
        } catch (exception) {
            if (version === requestVersionRef.current) {
                setError(
                    messageFromError(
                        exception,
                        "Wishlist could not be loaded."
                    )
                );
            }

            throw exception;
        } finally {
            if (version === requestVersionRef.current) {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        let active = true;

        refreshWishlist().catch(() => {
            /* storefront should stay usable */
        });

        return () => {
            active = false;
        };
    }, [refreshWishlist]);

    const addToWishlist = useCallback(
        async (productId) => {
            const id = integer(productId, 0);

            if (id <= 0) {
                throw new Error(
                    "A valid product is required."
                );
            }

            ++requestVersionRef.current;
            mutationStart();
            setError("");

            try {
                const response =
                    await storefrontWishlistService.add(id);

                applyResponse(response);

                return response;
            } catch (exception) {
                setError(
                    messageFromError(
                        exception,
                        "Product could not be added to wishlist."
                    )
                );

                throw exception;
            } finally {
                mutationEnd();
            }
        },
        [applyResponse, mutationEnd, mutationStart]
    );

    const removeFromWishlist = useCallback(
        async (productId) => {
            const id = integer(productId, 0);

            if (id <= 0) {
                throw new Error(
                    "A valid product is required."
                );
            }

            ++requestVersionRef.current;
            mutationStart();

            try {
                const response =
                    await storefrontWishlistService.remove(id);

                applyResponse(response);

                return response;
            } catch (exception) {
                setError(
                    messageFromError(
                        exception,
                        "Product could not be removed from wishlist."
                    )
                );

                throw exception;
            } finally {
                mutationEnd();
            }
        },
        [applyResponse, mutationEnd, mutationStart]
    );

    const toggleWishlist = useCallback(
        async (productId) => {
            const id = integer(productId, 0);

            if (id <= 0) {
                throw new Error(
                    "A valid product is required."
                );
            }

            if (items.some((item) => item.product_id === id)) {
                return removeFromWishlist(id);
            }

            return addToWishlist(id);
        },
        [addToWishlist, items, removeFromWishlist]
    );

    const productIds = useMemo(
        () =>
            new Set(
                items.map((item) => item.product_id)
            ),
        [items]
    );

    const isInWishlist = useCallback(
        (productId) =>
            productIds.has(
                integer(productId, 0)
            ),
        [productIds]
    );

    const itemCount = useMemo(
        () => items.length,
        [items]
    );

    const value = useMemo(
        () => ({
            items,
            itemCount,
            productIds,
            loading,
            mutating,
            error,
            refreshWishlist,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist,
            isInWishlist,
            clearWishlistError: () => setError(""),
        }),
        [
            items,
            itemCount,
            productIds,
            loading,
            mutating,
            error,
            refreshWishlist,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist,
            isInWishlist,
        ]
    );

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
}


export function useWishlist() {
    const context = useContext(WishlistContext);

    if (!context) {
        throw new Error(
            "useWishlist must be used inside WishlistProvider."
        );
    }

    return context;
}
