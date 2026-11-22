import React, {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useSearchParams,
} from "react-router-dom";

import searchService
    from "../../services/searchService";

import ProductSkeletonGrid
    from "../../components/frontend/ProductSkeletonGrid";

import "./SearchResults.css";


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


function ResultImage({
    src,
    alt,
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
        !src ||
        failed
    ) {
        return (
            <span className="fv-search-result-fallback">

                <i className="fa-regular fa-image" />

            </span>
        );
    }

    return (
        <img
            src={
                src
            }
            alt={
                alt
            }
            loading="lazy"
            onError={() =>
                setFailed(
                    true
                )
            }
        />
    );
}


export default function SearchResults() {
    const [
        params,
    ] =
        useSearchParams();

    const q =
        params.get(
            "q"
        )
        ||
        "";

    const brand =
        params.get(
            "brand"
        )
        ||
        "";

    const category =
        params.get(
            "category"
        )
        ||
        "";

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
            total: 0,
            current_page: 1,
            has_more: false,
            next_page: null,
        });

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
        error,
        setError,
    ] =
        useState("");


    const load =
        async (
            page = 1,
            append = false
        ) => {
            try {
                if (append) {
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
                    await searchService
                        .results({
                            q,
                            brand,
                            category,
                            page,
                            per_page: 20,
                        });

                const rows =
                    response?.data
                    ||
                    [];

                setProducts(
                    (
                        current
                    ) => {
                        if (!append) {
                            return rows;
                        }

                        const map =
                            new Map();

                        [
                            ...current,
                            ...rows,
                        ].forEach(
                            (
                                product
                            ) =>
                                map.set(
                                    Number(
                                        product.id
                                    ),
                                    product
                                )
                        );

                        return Array.from(
                            map.values()
                        );
                    }
                );

                setMeta(
                    response?.meta
                    ||
                    {}
                );
            } catch (
                exception
            ) {
                setError(
                    exception?.message
                    ||
                    "Search results could not be loaded."
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
            setProducts([]);

            load(
                1,
                false
            );
        },
        [
            q,
            brand,
            category,
        ]
    );


    return (
        <div className="fv-search-page">

            <div className="fv-search-page-container">

                <header>

                    <span>
                        SEARCH RESULTS
                    </span>


                    <h1>

                        {q ? (
                            <>
                                Results for “
                                {
                                    q
                                }
                                ”
                            </>
                        ) : (
                            "All matching products"
                        )}

                    </h1>


                    {!loading && (

                        <p>
                            {
                                meta.total
                                ||
                                0
                            } product(s) found
                        </p>

                    )}

                </header>


                {loading
                && products.length === 0 ? (

                    <ProductSkeletonGrid />

                ) : error ? (

                    <div className="fv-search-page-state error">

                        <i className="fa-solid fa-circle-exclamation" />

                        {
                            error
                        }

                    </div>

                ) : products.length >
                    0 ? (

                    <>

                        <div className="fv-search-results-grid">

                            {products.map(
                                (
                                    product
                                ) => (

                                <article
                                    key={
                                        product.id
                                    }
                                >

                                    <Link
                                        className="fv-search-result-image"
                                        to={`/product/${product.slug}`}
                                    >

                                        <ResultImage
                                            src={
                                                product.image
                                            }

                                            alt={
                                                product.name
                                            }
                                        />

                                    </Link>


                                    <div className="fv-search-result-body">

                                        <Link
                                            className="fv-search-result-title"
                                            to={`/product/${product.slug}`}
                                        >
                                            {
                                                product.name
                                            }
                                        </Link>


                                        <strong>
                                            {
                                                money(
                                                    product.price
                                                )
                                            }
                                        </strong>


                                        <div className="fv-search-result-price-meta">

                                            {Number(
                                                product.regular_price
                                            )
                                            >
                                            Number(
                                                product.price
                                            ) && (

                                                <del>
                                                    {
                                                        money(
                                                            product.regular_price
                                                        )
                                                    }
                                                </del>

                                            )}


                                            {Number(
                                                product.discount_percent
                                                ||
                                                0
                                            )
                                            >
                                            0 && (

                                                <span>
                                                    -
                                                    {
                                                        product.discount_percent
                                                    }
                                                    %
                                                </span>

                                            )}

                                        </div>


                                        <small>

                                            <i className="fa-solid fa-star" />

                                            {
                                                Number(
                                                    product.rating
                                                    ||
                                                    0
                                                )
                                                    .toFixed(
                                                        1
                                                    )
                                            }

                                            {" "}

                                            (
                                            {
                                                product.review_count
                                                ||
                                                0
                                            }
                                            )

                                            {" · "}

                                            {
                                                product.sold_count
                                                ||
                                                0
                                            } sold

                                        </small>

                                    </div>

                                </article>

                            ))}

                        </div>


                        {meta.has_more && (

                            <div className="fv-search-load-more">

                                <button
                                    type="button"

                                    disabled={
                                        loadingMore
                                    }

                                    onClick={() =>
                                        load(
                                            meta.next_page
                                            ||
                                            meta.current_page
                                            +
                                            1,
                                            true
                                        )
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

                    </>

                ) : (

                    <div className="fv-search-page-state">

                        <i className="fa-solid fa-box-open" />

                        No products matched your search.

                    </div>

                )}

            </div>

        </div>
    );
}
