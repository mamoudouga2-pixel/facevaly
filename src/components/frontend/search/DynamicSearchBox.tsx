import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import searchService
    from "../../../services/searchService";

import "./DynamicSearchBox.css";

const quickSuggestions = [
    "wireless earbuds",
    "smart watch",
    "summer fashion",
    "kitchen storage",
    "skin care",
    "gaming mouse",
];

const rotatingPlaceholders = [
    "Search in Facevaly",
    "Search: wireless earbuds",
    "Search: skin care",
    "Search: smart watches",
    "Search: home essentials",
];


const money = (
    value
) =>
    `৳${Number(
        value || 0
    ).toLocaleString(
        "en-BD",
        {
            maximumFractionDigits:
                2,
        }
    )}`;


function ProductSuggestion({
    product,
    close,
}) {
    return (
        <Link
            to={`/product/${product.slug}`}
            className="fv-live-search-product"
            onClick={close}
        >
            <span className="fv-live-search-product-image">

                {product.image ? (

                    <img
                        src={
                            product.image
                        }
                        alt=""
                    />

                ) : (

                    <i className="fa-regular fa-image" />

                )}

            </span>


            <span className="fv-live-search-product-copy">

                <strong>
                    {
                        product.name
                    }
                </strong>

                <small>
                    {
                        product.brand
                            ?.name
                        ||
                        product.sku
                        ||
                        "Product"
                    }
                </small>

            </span>


            <b>
                {
                    money(
                        product.price
                    )
                }
            </b>

        </Link>
    );
}


export default function DynamicSearchBox({
    variant = "desktop",
    placeholder = "Search in Facevaly",
    initialValue = "",
    onSearch,
}) {
    const navigate =
        useNavigate();

    const location =
        useLocation();

    const rootRef =
        useRef(null);

    const inputRef =
        useRef(null);

    const [
        value,
        setValue,
    ] =
        useState(
            initialValue
        );

    const [
        suggestions,
        setSuggestions,
    ] =
        useState({
            products: [],
            categories: [],
            brands: [],
        });

    const [
        loading,
        setLoading,
    ] =
        useState(false);

    const [
        open,
        setOpen,
    ] =
        useState(false);

    const [
        focused,
        setFocused,
    ] =
        useState(false);

    const [
        animatedPlaceholder,
        setAnimatedPlaceholder,
    ] =
        useState(
            rotatingPlaceholders[0]
        );


    /*
    |--------------------------------------------------------------------------
    | SYNC SEARCH PAGE QUERY
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            if (
                location.pathname !==
                "/search"
            ) {
                return;
            }

            const params =
                new URLSearchParams(
                    location.search
                );

            setValue(
                params.get(
                    "q"
                )
                ||
                ""
            );
        },
        [
            location.pathname,
            location.search,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | DESKTOP PLACEHOLDER TYPING
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            if (
                variant !==
                "desktop"
            ) {
                return undefined;
            }

            let phraseIndex = 0;
            let charIndex = 0;
            let deleting = false;
            let holdUntil = 0;

            const tick = () => {
                const now =
                    Date.now();

                if (
                    now <
                    holdUntil
                ) {
                    return;
                }

                const phrase =
                    rotatingPlaceholders[
                        phraseIndex
                    ];

                if (
                    !deleting
                ) {
                    charIndex = Math.min(
                        phrase.length,
                        charIndex + 1
                    );

                    setAnimatedPlaceholder(
                        phrase.slice(
                            0,
                            charIndex
                        )
                    );

                    if (
                        charIndex >=
                        phrase.length
                    ) {
                        deleting =
                            true;
                        holdUntil =
                            now + 1350;
                    }
                } else {
                    charIndex = Math.max(
                        0,
                        charIndex - 1
                    );

                    setAnimatedPlaceholder(
                        phrase.slice(
                            0,
                            charIndex
                        )
                    );

                    if (
                        charIndex ===
                        0
                    ) {
                        deleting =
                            false;
                        phraseIndex =
                            (
                                phraseIndex +
                                1
                            ) %
                            rotatingPlaceholders.length;
                        holdUntil =
                            now + 220;
                    }
                }
            };

            const timer =
                window.setInterval(
                    tick,
                    78
                );

            return () => {
                window.clearInterval(
                    timer
                );
            };
        },
        [
            variant,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | LIVE SUGGESTIONS
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            const query =
                value.trim();

            if (
                query.length <
                2
            ) {
                setSuggestions({
                    products: [],
                    categories: [],
                    brands: [],
                });

                setLoading(
                    false
                );

                return;
            }


            const controller =
                new AbortController();


            const timer =
                window.setTimeout(
                    async () => {
                        try {
                            setLoading(
                                true
                            );


                            const response =
                                await searchService
                                    .suggestions(
                                        query,
                                        controller.signal
                                    );


                            setSuggestions(
                                response?.data
                                ||
                                {
                                    products: [],
                                    categories: [],
                                    brands: [],
                                }
                            );


                            setOpen(
                                true
                            );
                        } catch (
                            exception
                        ) {
                            if (
                                exception
                                    ?.name
                                !==
                                "AbortError"
                            ) {
                                console.error(
                                    "Live search failed:",
                                    exception
                                );
                            }
                        } finally {
                            setLoading(
                                false
                            );
                        }
                    },
                    260
                );


            return () => {
                window.clearTimeout(
                    timer
                );

                controller.abort();
            };
        },
        [
            value,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | OUTSIDE CLICK
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            const close =
                (
                    event
                ) => {
                    if (
                        !rootRef.current
                            ?.contains(
                                event.target
                            )
                    ) {
                        setOpen(
                            false
                        );
                    }
                };


            document.addEventListener(
                "mousedown",
                close
            );


            return () => {
                document.removeEventListener(
                    "mousedown",
                    close
                );
            };
        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const submit =
        (
            event
        ) => {
            event.preventDefault();


            const query =
                value.trim();


            if (!query) {
                inputRef.current
                    ?.focus();

                return;
            }


            onSearch?.(
                query
            );


            setOpen(
                false
            );


            navigate(
                `/search?q=${encodeURIComponent(
                    query
                )}`
            );
        };


    const hasResults =
        suggestions.products
            ?.length
        ||
        suggestions.categories
            ?.length
        ||
        suggestions.brands
            ?.length;


    return (
        <div
            ref={
                rootRef
            }

            className={`fv-live-search ${variant}${open ? " is-open" : ""}${focused ? " is-focused" : ""}`}
        >

            <form
                className="fv-live-search-form"
                onSubmit={
                    submit
                }
                onMouseDown={() =>
                    setOpen(
                        true
                    )
                }
                onFocusCapture={() =>
                    setFocused(
                        true
                    )
                }
                onBlurCapture={(
                    event
                ) => {
                    if (
                        rootRef.current
                            ?.contains(
                                event.relatedTarget
                            )
                    ) {
                        return;
                    }

                    setFocused(
                        false
                    );
                }}
            >

                {variant ===
                    "mobile" && (

                    <span className="fv-live-search-leading">

                        <i className="fa-solid fa-magnifying-glass" />

                    </span>

                )}


                <input
                    ref={
                        inputRef
                    }

                    type="search"

                    autoComplete="off"

                    aria-label="Search Facevaly"

                    placeholder={
                        variant ===
                        "desktop"
                            ? animatedPlaceholder
                            : placeholder
                    }

                    value={
                        value
                    }

                    onFocus={() => {
                        setOpen(
                            true
                        );
                    }}

                    onKeyDown={(
                        event
                    ) => {
                        if (
                            event.key ===
                            "Escape"
                        ) {
                            setOpen(
                                false
                            );
                        }
                    }}

                    onChange={(
                        event
                    ) =>
                        setValue(
                            event.target.value
                        )
                    }
                />


                <button
                    type="submit"

                    aria-label="Search"
                >

                    {variant ===
                        "mobile" ? (

                        "Search"

                    ) : (
                        <i className="fa-solid fa-magnifying-glass" />

                    )}

                </button>

            </form>


            {open && (

                <div className="fv-live-search-dropdown">

                    {loading && (

                        <div className="fv-live-search-loading">

                            <i className="fa-solid fa-spinner fa-spin" />

                            Searching...

                        </div>

                    )}


                    {!loading
                        &&
                        !hasResults && (

                        <div className="fv-live-search-empty">

                            <i className="fa-solid fa-magnifying-glass" />

                            No matching products, categories or brands.

                        </div>

                    )}


                    {!loading &&
                        value
                            .trim()
                            .length <
                            2 && (
                        <section>
                            <div className="fv-live-search-group-title">
                                <span>
                                    Suggested searches
                                </span>
                            </div>

                            <div className="fv-live-search-links fv-live-search-quick">
                                {quickSuggestions.map(
                                    (
                                        keyword
                                    ) => (
                                    <button
                                        type="button"
                                        key={
                                            keyword
                                        }
                                        onClick={() => {
                                            const query =
                                                keyword.trim();

                                            setValue(
                                                query
                                            );

                                            onSearch?.(
                                                query
                                            );

                                            setOpen(
                                                false
                                            );

                                            navigate(
                                                `/search?q=${encodeURIComponent(
                                                    query
                                                )}`
                                            );
                                        }}
                                    >
                                        <i className="fa-solid fa-sparkles" />
                                        {
                                            keyword
                                        }
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}


                    {!loading
                        &&
                        suggestions.products
                            ?.length >
                            0 && (

                        <section>

                            <div className="fv-live-search-group-title">

                                <span>
                                    Products
                                </span>


                                <button
                                    type="button"

                                    onClick={() => {
                                        setOpen(
                                            false
                                        );

                                        navigate(
                                            `/search?q=${encodeURIComponent(
                                                value.trim()
                                            )}`
                                        );
                                    }}
                                >
                                    View All
                                </button>

                            </div>


                            {suggestions.products
                                .slice(
                                    0,
                                    variant ===
                                    "mobile"

                                        ? 4

                                        : 6
                                )
                                .map(
                                    (
                                        product
                                    ) => (

                                    <ProductSuggestion
                                        key={
                                            product.id
                                        }

                                        product={
                                            product
                                        }

                                        close={() =>
                                            setOpen(
                                                false
                                            )
                                        }
                                    />

                                )
                            )}

                        </section>

                    )}


                    {!loading
                        &&
                        suggestions.categories
                            ?.length >
                            0 && (

                        <section>

                            <div className="fv-live-search-group-title">

                                <span>
                                    Categories
                                </span>

                            </div>


                            <div className="fv-live-search-links">

                                {suggestions.categories
                                    .map(
                                        (
                                            category
                                        ) => (

                                        <Link
                                            key={
                                                category.id
                                            }

                                            to={`/category/${category.slug}`}

                                            onClick={() =>
                                                setOpen(
                                                    false
                                                )
                                            }
                                        >

                                            <i className="fa-solid fa-layer-group" />

                                            {
                                                category.name
                                            }

                                        </Link>

                                    )
                                )}

                            </div>

                        </section>

                    )}


                    {!loading
                        &&
                        suggestions.brands
                            ?.length >
                            0 && (

                        <section>

                            <div className="fv-live-search-group-title">

                                <span>
                                    Brands
                                </span>

                            </div>


                            <div className="fv-live-search-links">

                                {suggestions.brands
                                    .map(
                                        (
                                            brand
                                        ) => (

                                        <Link
                                            key={
                                                brand.id
                                            }

                                            to={`/search?q=${encodeURIComponent(
                                                brand.name
                                            )}&brand=${encodeURIComponent(
                                                brand.slug
                                            )}`}

                                            onClick={() =>
                                                setOpen(
                                                    false
                                                )
                                            }
                                        >

                                            <i className="fa-solid fa-tag" />

                                            {
                                                brand.name
                                            }

                                        </Link>

                                    )
                                )}

                            </div>

                        </section>

                    )}

                </div>

            )}

        </div>
    );
}
