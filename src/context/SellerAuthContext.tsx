import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useLocation,
} from "react-router-dom";

import sellerAuthService
    from "../services/sellerAuthService";


export const SellerAuthContext =
    createContext(null);


function shouldResolveSellerAuth(
    pathname
) {
    const path =
        String(pathname || "")
            .replace(/\/+$/, "")
        || "/";

    return (
        path.startsWith("/seller")
        || path === "/become-a-seller"
    );
}


function normalizeSeller(
    payload
) {
    if (!payload) {
        return null;
    }

    return (
        payload?.data
        ?? payload
        ?? null
    );
}


export function SellerAuthProvider({
    children,
}) {
    const location =
        useLocation();

    const needsAuthCheck =
        shouldResolveSellerAuth(
            location.pathname
        );

    const [
        seller,
        setSeller,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(needsAuthCheck);

    const checkVersionRef =
        useRef(0);

    const hasResolvedRef =
        useRef(false);

    const lastSellerPathRef =
        useRef(false);


    /* =====================================================
       CLEAR LOCAL SELLER STATE
    ===================================================== */

    const clearSellerState =
        useCallback(() => {
            setSeller(null);

            localStorage.removeItem(
                "seller"
            );

            localStorage.removeItem(
                "seller_user"
            );

            localStorage.removeItem(
                "seller_token"
            );

            sessionStorage.removeItem(
                "seller"
            );

            sessionStorage.removeItem(
                "seller_user"
            );

            sessionStorage.removeItem(
                "seller_token"
            );
        }, []);


    /* =====================================================
       REFRESH CURRENT SELLER
    ===================================================== */

    const refreshSeller =
        useCallback(
            async () => {
                try {
                    const response =
                        await sellerAuthService.me();

                    const currentSeller =
                        normalizeSeller(
                            response
                        );

                    setSeller(
                        currentSeller
                    );

                    return currentSeller;
                } catch (error) {
                    const status =
                        error?.status
                        ?? error?.response
                            ?.status;

                    if (
                        status === 401
                        || status === 403
                    ) {
                        clearSellerState();

                        return null;
                    }

                    throw error;
                }
            },
            [
                clearSellerState,
            ]
        );


    /* =====================================================
       AUTH CHECK
       Resolve once when entering seller area.
       Navigating between seller pages must NOT block the UI
       with a full-page loader (SPA / WordPress-admin style).
    ===================================================== */

    useEffect(() => {
        const onSellerRoute =
            shouldResolveSellerAuth(
                location.pathname
            );

        const enteredSellerArea =
            onSellerRoute
            && !lastSellerPathRef.current;

        lastSellerPathRef.current =
            onSellerRoute;

        if (!onSellerRoute) {
            if (hasResolvedRef.current) {
                setLoading(false);
            }

            return undefined;
        }

        // Already authenticated for this session — keep navigating instantly.
        if (
            hasResolvedRef.current
            && !enteredSellerArea
        ) {
            setLoading(false);

            return undefined;
        }

        let mounted = true;

        const version =
            ++checkVersionRef.current;

        const boot =
            async () => {
                // Only show the blocking loader on first resolve
                // (or when re-entering seller area with no seller yet).
                if (!hasResolvedRef.current) {
                    setLoading(true);
                }

                try {
                    const response =
                        await sellerAuthService.me();

                    if (
                        !mounted
                        || version
                            !== checkVersionRef.current
                    ) {
                        return;
                    }

                    setSeller(
                        normalizeSeller(
                            response
                        )
                    );
                } catch (error) {
                    if (
                        !mounted
                        || version
                            !== checkVersionRef.current
                    ) {
                        return;
                    }

                    const status =
                        error?.status
                        ?? error?.response
                            ?.status;

                    if (
                        status === 401
                        || status === 403
                    ) {
                        clearSellerState();
                    } else if (!hasResolvedRef.current) {
                        setSeller(null);
                    }
                } finally {
                    hasResolvedRef.current =
                        true;

                    if (
                        mounted
                        && version
                            === checkVersionRef.current
                    ) {
                        setLoading(false);
                    }
                }
            };

        boot();

        return () => {
            mounted = false;
        };
    }, [
        location.pathname,
        clearSellerState,
    ]);


    /* =====================================================
       LOGIN
    ===================================================== */

    const login =
        useCallback(
            async (payload) => {
                const response =
                    await sellerAuthService.login(
                        payload
                    );

                const loggedSeller =
                    normalizeSeller(
                        response
                    );

                if (!loggedSeller) {
                    throw new Error(
                        "Seller login succeeded but seller information was not returned."
                    );
                }

                hasResolvedRef.current =
                    true;
                lastSellerPathRef.current =
                    true;
                setLoading(false);
                setSeller(
                    loggedSeller
                );

                return loggedSeller;
            },
            []
        );


    /* =====================================================
       LOGOUT
    ===================================================== */

    const logout =
        useCallback(
            async () => {
                try {
                    await sellerAuthService.logout();
                } catch (error) {
                    console.error(
                        "Seller logout API failed:",
                        {
                            status:
                                error?.response
                                    ?.status,

                            data:
                                error?.response
                                    ?.data,

                            message:
                                error?.message,
                        }
                    );

                    if (
                        error?.response
                            ?.status === 401
                        || error?.response
                            ?.status === 403
                    ) {
                        clearSellerState();

                        return true;
                    }

                    throw error;
                }

                clearSellerState();

                try {
                    const current =
                        await sellerAuthService.me();

                    const currentSeller =
                        normalizeSeller(
                            current
                        );

                    if (currentSeller) {
                        setSeller(
                            currentSeller
                        );

                        throw new Error(
                            "Seller session is still active after logout. Backend logout did not invalidate the session."
                        );
                    }
                } catch (error) {
                    const status =
                        error?.status
                        ?? error?.response
                            ?.status;

                    if (
                        status === 401
                        || status === 403
                    ) {
                        clearSellerState();

                        return true;
                    }

                    if (
                        error?.message?.includes(
                            "Seller session is still active"
                        )
                    ) {
                        throw error;
                    }

                    console.warn(
                        "Unable to verify seller logout:",
                        error
                    );
                }

                return true;
            },
            [
                clearSellerState,
            ]
        );


    /* =====================================================
       CONTEXT
    ===================================================== */

    const value =
        useMemo(
            () => ({
                seller,

                loading,

                isAuthenticated:
                    Boolean(seller),

                login,

                logout,

                refreshSeller,

                setSeller,
            }),
            [
                seller,
                loading,
                login,
                logout,
                refreshSeller,
            ]
        );


    return (
        <SellerAuthContext.Provider
            value={value}
        >
            {children}
        </SellerAuthContext.Provider>
    );
}
