import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import vendorStoreService
    from "../../services/vendorStoreService";

import StoreProductCard
    from "../../components/frontend/store/StoreProductCard";

import {
    useStorefrontToast,
} from "../../context/StorefrontToastContext";

import "./VendorStore.css";


/*
|--------------------------------------------------------------------------
| STORE MEDIA
|--------------------------------------------------------------------------
*/

function StoreMedia({
    src,
    type,
    name,
}) {
    const [
        failed,
        setFailed,
    ] =
        useState(false);


    useEffect(
        () => {
            setFailed(
                false
            );
        },
        [
            src,
        ]
    );


    if (
        src
        &&
        !failed
    ) {
        return (
            <img
                src={
                    src
                }

                alt={
                    type ===
                    "logo"

                        ? `${name} logo`

                        : `${name} banner`
                }

                draggable="false"

                onError={() =>
                    setFailed(
                        true
                    )
                }
            />
        );
    }


    if (
        type ===
        "logo"
    ) {
        return (
            <span className="fv-vstore-logo-fallback">

                <i className="fa-solid fa-store" />

            </span>
        );
    }


    return (
        <span className="fv-vstore-banner-fallback">

            <i className="fa-solid fa-store" />

            <strong>
                {
                    name
                }
            </strong>

        </span>
    );
}


/*
|--------------------------------------------------------------------------
| VENDOR STORE PAGE
|--------------------------------------------------------------------------
*/

export default function VendorStore() {
    const {
        slug,
    } =
        useParams();


    const navigate =
        useNavigate();


    const {
        showToast,
    } =
        useStorefrontToast();


    const [
        store,
        setStore,
    ] =
        useState(null);


    const [
        highlighted,
        setHighlighted,
    ] =
        useState([]);


    const [
        products,
        setProducts,
    ] =
        useState([]);


    const [
        meta,
        setMeta,
    ] =
        useState({
            current_page:
                1,

            last_page:
                1,

            has_more:
                false,

            next_page:
                null,

            total:
                0,
        });


    const [
        search,
        setSearch,
    ] =
        useState("");


    const [
        loading,
        setLoading,
    ] =
        useState(true);


    const [
        loadingMore,
        setLoadingMore,
    ] =
        useState(false);


    const [
        followingBusy,
        setFollowingBusy,
    ] =
        useState(false);


    const [
        error,
        setError,
    ] =
        useState("");


    const searchTimer =
        useRef(null);


    /*
    |--------------------------------------------------------------------------
    | LOAD STORE
    |--------------------------------------------------------------------------
    */

    const loadStore =
        async ({
            page = 1,
            query = search,
            append = false,
        } = {}) => {
            try {
                if (
                    append
                ) {
                    setLoadingMore(
                        true
                    );
                } else {
                    setLoading(
                        true
                    );
                }


                setError("");


                const response =
                    await vendorStoreService
                        .show(
                            slug,
                            {
                                page,

                                per_page:
                                    20,

                                q:
                                    query,
                            }
                        );


                const data =
                    response?.data
                    ||
                    {};


                setStore(
                    data.store
                    ||
                    null
                );


                if (
                    !append
                ) {
                    setHighlighted(
                        data.highlighted_products
                        ||
                        []
                    );
                }


                const rows =
                    data.products
                    ||
                    [];


                setProducts(
                    (
                        current
                    ) => {
                        if (
                            !append
                        ) {
                            return rows;
                        }


                        const unique =
                            new Map();


                        [
                            ...current,
                            ...rows,
                        ]
                            .forEach(
                                (
                                    product
                                ) => {
                                    unique
                                        .set(
                                            Number(
                                                product.id
                                            ),
                                            product
                                        );
                                }
                            );


                        return Array
                            .from(
                                unique
                                    .values()
                            );
                    }
                );


                setMeta(
                    response?.meta
                    ||
                    {
                        current_page:
                            page,

                        last_page:
                            page,

                        has_more:
                            false,

                        next_page:
                            null,

                        total:
                            rows.length,
                    }
                );
            } catch (
                exception
            ) {
                setError(
                    exception.message
                    ||
                    "Store could not be loaded."
                );
            } finally {
                setLoading(
                    false
                );

                setLoadingMore(
                    false
                );
            }
        };


    useEffect(
        () => {
            setSearch("");

            setProducts([]);

            setHighlighted([]);

            loadStore({
                page:
                    1,

                query:
                    "",

                append:
                    false,
            });
        },
        [
            slug,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | SEARCH DEBOUNCE
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            if (
                !store
            ) {
                return;
            }


            if (
                searchTimer.current
            ) {
                window.clearTimeout(
                    searchTimer.current
                );
            }


            searchTimer.current =
                window.setTimeout(
                    () => {
                        loadStore({
                            page:
                                1,

                            query:
                                search,

                            append:
                                false,
                        });
                    },
                    320
                );


            return () => {
                if (
                    searchTimer.current
                ) {
                    window.clearTimeout(
                        searchTimer.current
                    );
                }
            };
        },
        [
            search,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | FOLLOW
    |--------------------------------------------------------------------------
    */

    const toggleFollow =
        async () => {
            if (
                !store
                ||
                followingBusy
            ) {
                return;
            }


            try {
                setFollowingBusy(
                    true
                );


                const response =
                    store.is_following

                        ? await vendorStoreService
                            .unfollow(
                                slug
                            )

                        : await vendorStoreService
                            .follow(
                                slug
                            );


                setStore(
                    (
                        current
                    ) => ({
                        ...current,

                        is_following:
                            response.data
                                .is_following,

                        followers_count:
                            response.data
                                .followers_count,
                    })
                );


                showToast(
                    response.message
                    ||
                    "Store updated."
                );
            } catch (
                exception
            ) {
                if (
                    exception.status ===
                    401
                ) {
                    showToast(
                        "Please sign in to follow this store.",
                        "warning"
                    );

                    navigate(
                        "/login"
                    );

                    return;
                }


                showToast(
                    exception.message
                    ||
                    "Could not update follow status.",
                    "error"
                );
            } finally {
                setFollowingBusy(
                    false
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | CHAT
    |--------------------------------------------------------------------------
    */

    const chat =
        () => {
            showToast(
                "Seller chat can be connected to your chat module."
            );
        };


    /*
    |--------------------------------------------------------------------------
    | LOAD MORE
    |--------------------------------------------------------------------------
    */

    const loadMore =
        () => {
            if (
                !meta.has_more
                ||
                loadingMore
            ) {
                return;
            }


            loadStore({
                page:
                    meta.next_page
                    ||
                    meta.current_page
                    +
                    1,

                query:
                    search,

                append:
                    true,
            });
        };


    /*
    |--------------------------------------------------------------------------
    | PAGE STATES
    |--------------------------------------------------------------------------
    */

    if (
        loading
        &&
        !store
    ) {
        return (
            <div className="fv-vstore-state">

                <i className="fa-solid fa-spinner fa-spin" />

                Loading store...

            </div>
        );
    }


    if (
        error
        &&
        !store
    ) {
        return (
            <div className="fv-vstore-state error">

                <i className="fa-solid fa-circle-exclamation" />

                {
                    error
                }

            </div>
        );
    }


    if (
        !store
    ) {
        return null;
    }


    return (
        <div className="fv-vstore-page">


            {/* ============================================================
                STORE HERO
            ============================================================ */}

            <section className="fv-vstore-hero">

                <div className="fv-vstore-banner">

                    <StoreMedia
                        src={
                            store.banner
                        }

                        type="banner"

                        name={
                            store.name
                        }
                    />

                </div>


                <div className="fv-vstore-profile">

                    <div className="fv-vstore-logo">

                        <StoreMedia
                            src={
                                store.logo
                            }

                            type="logo"

                            name={
                                store.name
                            }
                        />

                    </div>


                    <div className="fv-vstore-profile-copy">

                        <div>

                            <h1>
                                {
                                    store.name
                                }
                            </h1>


                            <button
                                type="button"

                                className={
                                    store.is_following

                                        ? "following"

                                        : ""
                                }

                                disabled={
                                    followingBusy
                                }

                                onClick={
                                    toggleFollow
                                }
                            >
                                {
                                    store.is_following

                                        ? "Following"

                                        : "Follow"
                                }
                            </button>

                        </div>


                        <p>

                            <strong>
                                {
                                    store.followers_count
                                    ||
                                    0
                                }
                            </strong>

                            {" "}
                            followers


                            <i />


                            <strong>
                                {
                                    store.positive_seller_rating
                                    !==
                                    null

                                        ? `${store.positive_seller_rating}%`

                                        : "—"
                                }
                            </strong>

                            {" "}
                            Positive seller ratings

                        </p>

                    </div>


                    <button
                        type="button"
                        className="fv-vstore-chat"

                        onClick={
                            chat
                        }
                    >

                        <i className="fa-regular fa-comment-dots" />

                    </button>

                </div>

            </section>


            {/* ============================================================
                STORE INFO STRIP — DESKTOP ENHANCEMENT
            ============================================================ */}

            <section className="fv-vstore-metrics">

                <div>

                    <i className="fa-solid fa-box" />

                    <span>
                        Products
                    </span>

                    <strong>
                        {
                            store.product_count
                            ||
                            0
                        }
                    </strong>

                </div>


                <div>

                    <i className="fa-solid fa-user-group" />

                    <span>
                        Followers
                    </span>

                    <strong>
                        {
                            store.followers_count
                            ||
                            0
                        }
                    </strong>

                </div>


                <div>

                    <i className="fa-solid fa-star" />

                    <span>
                        Seller Rating
                    </span>

                    <strong>
                        {
                            store.positive_seller_rating
                            !==
                            null

                                ? `${store.positive_seller_rating}%`

                                : "New"
                        }
                    </strong>

                </div>


                <div>

                    <i className="fa-solid fa-shield-halved" />

                    <span>
                        Marketplace
                    </span>

                    <strong>
                        Verified Store
                    </strong>

                </div>

            </section>


            {/* ============================================================
                HIGHLIGHTED PRODUCTS
            ============================================================ */}

            {highlighted.length >
                0 && (

                <section className="fv-vstore-section">

                    <div className="fv-vstore-section-head">

                        <h2>
                            Highlighted Products
                        </h2>

                    </div>


                    <div className="fv-vstore-highlight-scroll">

                        {highlighted.map(
                            (
                                product
                            ) => (

                            <div
                                className="fv-vstore-highlight-item"

                                key={
                                    product.id
                                }
                            >

                                <StoreProductCard
                                    product={
                                        product
                                    }

                                    highlighted
                                />

                            </div>

                        ))}

                    </div>

                </section>

            )}


            {/* ============================================================
                ALL PRODUCTS
            ============================================================ */}

            <section className="fv-vstore-section fv-vstore-all-products">

                <div className="fv-vstore-products-head">

                    <h2>
                        All Products ({
                            meta.total
                            ||
                            0
                        })
                    </h2>


                    <label>

                        <i className="fa-solid fa-magnifying-glass" />

                        <input
                            type="search"

                            placeholder="Search products..."

                            value={
                                search
                            }

                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        {search && (

                            <button
                                type="button"

                                aria-label="Clear search"

                                onClick={() =>
                                    setSearch(
                                        ""
                                    )
                                }
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>

                        )}

                    </label>

                </div>


                {loading
                    &&
                    products.length >
                        0 && (

                    <div className="fv-vstore-refreshing">

                        <i className="fa-solid fa-spinner fa-spin" />

                        Updating products...

                    </div>

                )}


                {products.length >
                    0 ? (

                    <div className="fv-vstore-products-grid">

                        {products.map(
                            (
                                product
                            ) => (

                            <StoreProductCard
                                product={
                                    product
                                }

                                key={
                                    product.id
                                }
                            />

                        ))}

                    </div>

                ) : (

                    <div className="fv-vstore-empty">

                        <i className="fa-solid fa-box-open" />

                        <strong>
                            No products found
                        </strong>

                        <span>
                            Try a different search.
                        </span>

                    </div>

                )}


                {meta.has_more && (

                    <div className="fv-vstore-load-more-wrap">

                        <button
                            type="button"

                            disabled={
                                loadingMore
                            }

                            onClick={
                                loadMore
                            }
                        >

                            {loadingMore ? (

                                <>
                                    <i className="fa-solid fa-spinner fa-spin" />

                                    LOADING...
                                </>

                            ) : (

                                "LOAD MORE"

                            )}

                        </button>

                    </div>

                )}

            </section>

        </div>
    );
}
