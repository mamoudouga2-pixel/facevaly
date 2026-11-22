import React, {
    useEffect,
    useState,
} from "react";

import {
    useSearchParams,
} from "react-router-dom";

import flashSaleService
    from "../../services/flashSaleService";

import FlashSaleProductCard
    from "../../components/frontend/flashsale/FlashSaleProductCard";

import "./FlashSalePage.css";


const pagesFor = (
    current,
    last
) => {
    if (
        last <= 7
    ) {
        return Array.from(
            {
                length: last,
            },
            (_, index) =>
                index + 1
        );
    }

    const pages = [
        1,
    ];

    if (
        current > 3
    ) {
        pages.push(
            "..."
        );
    }

    const start =
        Math.max(
            2,
            current - 1
        );

    const end =
        Math.min(
            last - 1,
            current + 1
        );

    for (
        let page = start;
        page <= end;
        page += 1
    ) {
        pages.push(
            page
        );
    }

    if (
        current <
        last - 2
    ) {
        pages.push(
            "..."
        );
    }

    pages.push(
        last
    );

    return pages;
};


export default function FlashSalePage() {
    const [
        searchParams,
        setSearchParams,
    ] =
        useSearchParams();

    const slug =
        searchParams.get(
            "slug"
        ) ||
        "flash-sale";

    const page =
        Math.max(
            1,
            Number(
                searchParams.get(
                    "page"
                )
                ||
                1
            )
        );

    const [
        data,
        setData,
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


    useEffect(
        () => {
            let active =
                true;

            setLoading(
                true
            );

            setError("");

            flashSaleService
                .products({
                    slug,
                    page,
                    per_page: 24,
                })
                .then(
                    (
                        response
                    ) => {
                        if (
                            active
                        ) {
                            setData(
                                response
                            );
                        }
                    }
                )
                .catch(
                    (
                        exception
                    ) => {
                        if (
                            active
                        ) {
                            setError(
                                exception.message ||
                                "Flash Sale could not be loaded."
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

            window.scrollTo({
                top: 0,
                left: 0,
            });

            return () => {
                active =
                    false;
            };
        },
        [
            slug,
            page,
        ]
    );


    const goPage =
        (
            nextPage
        ) => {
            const params =
                new URLSearchParams(
                    searchParams
                );

            if (
                nextPage <=
                1
            ) {
                params.delete(
                    "page"
                );
            } else {
                params.set(
                    "page",
                    String(
                        nextPage
                    )
                );
            }

            setSearchParams(
                params
            );
        };


    if (
        loading
    ) {
        return (
            <div className="fv-flash-page-loading">
                <i className="fa-solid fa-spinner fa-spin" />

                Loading Flash Sale...
            </div>
        );
    }


    if (
        error
    ) {
        return (
            <div className="fv-flash-page">
                <div className="fv-flash-page-container">
                    <div className="fv-flash-page-error">
                        <i className="fa-solid fa-circle-exclamation" />

                        {
                            error
                        }
                    </div>
                </div>
            </div>
        );
    }


    const offer =
        data?.data?.offer;

    const products =
        data?.data?.products ||
        [];

    const meta =
        data?.meta || {
            current_page: 1,
            last_page: 1,
            total: 0,
        };

    if (data?.enabled === false) {
        return (
            <div className="fv-flash-page">
                <div className="fv-flash-page-container">
                    <div className="fv-flash-page-head">
                        <div>
                            <span>FLASH SALE</span>
                            <h1>Currently unavailable</h1>
                            <p>
                                The Flash Sale section is turned off right now.
                                Please check back later.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data?.active || !offer) {
        return (
            <div className="fv-flash-page">
                <div className="fv-flash-page-container">
                    <div className="fv-flash-page-head">
                        <div>
                            <span>FLASH SALE</span>
                            <h1>No active sale</h1>
                            <p>
                                There is no flash sale running at the moment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="fv-flash-page">

            <div className="fv-flash-page-container">

                <div className="fv-flash-page-head">

                    <div>
                        <span>
                            LIMITED-TIME DEALS
                        </span>

                        <h1>
                            {
                                offer?.name ||
                                "Flash Sale"
                            }
                        </h1>

                        <p>
                            On Sale Now
                            {meta.total
                                ? ` · ${meta.total} products`
                                : ""}
                        </p>
                    </div>

                </div>


                {products.length === 0 ? (

                    <div className="fv-flash-page-empty">

                        <i className="fa-solid fa-tags" />

                        <h2>
                            No products are currently available in this sale.
                        </h2>

                    </div>

                ) : (

                    <>

                        <div className="fv-flash-page-grid">

                            {products.map(
                                (
                                    product
                                ) => (

                                    <FlashSaleProductCard
                                        key={
                                            product.id
                                        }
                                        product={
                                            product
                                        }
                                    />

                                )
                            )}

                        </div>


                        {meta.last_page >
                            1 && (

                            <nav className="fv-flash-pagination">

                                <button
                                    type="button"
                                    disabled={
                                        meta.current_page <=
                                        1
                                    }
                                    onClick={() =>
                                        goPage(
                                            meta.current_page -
                                                1
                                        )
                                    }
                                >
                                    <i className="fa-solid fa-chevron-left" />
                                </button>


                                {pagesFor(
                                    meta.current_page,
                                    meta.last_page
                                ).map(
                                    (
                                        item,
                                        index
                                    ) =>
                                        item ===
                                        "..." ? (

                                            <span
                                                key={`dots-${index}`}
                                            >
                                                •••
                                            </span>

                                        ) : (

                                            <button
                                                type="button"
                                                className={
                                                    item ===
                                                    meta.current_page
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    goPage(
                                                        item
                                                    )
                                                }
                                                key={
                                                    item
                                                }
                                            >
                                                {
                                                    item
                                                }
                                            </button>

                                        )
                                )}


                                <button
                                    type="button"
                                    disabled={
                                        meta.current_page >=
                                        meta.last_page
                                    }
                                    onClick={() =>
                                        goPage(
                                            meta.current_page +
                                                1
                                        )
                                    }
                                >
                                    <i className="fa-solid fa-chevron-right" />
                                </button>

                            </nav>

                        )}

                    </>

                )}

            </div>

        </div>
    );
}
