import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import flashSaleService
    from "../../../services/flashSaleService";

import FlashSaleProductCard
    from "./FlashSaleProductCard";

import "./FlashSaleSection.css";


/*
|--------------------------------------------------------------------------
| SLIDER CONFIG
|--------------------------------------------------------------------------
*/

const DESKTOP_PAGE_SIZE = 6;

const MOBILE_PAGE_SIZE = 2;

const AUTO_SLIDE_MS = 4000;


/*
|--------------------------------------------------------------------------
| ARRAY CHUNK
|--------------------------------------------------------------------------
*/

const chunkArray = (
    items,
    size
) => {
    const pages = [];

    for (
        let index = 0;
        index < items.length;
        index += size
    ) {
        pages.push(
            items.slice(
                index,
                index + size
            )
        );
    }

    return pages;
};


/*
|--------------------------------------------------------------------------
| FLASH SALE SECTION
|--------------------------------------------------------------------------
*/

export default function FlashSaleSection({
    slug = "flash-sale",
    limit = 24,
    prefetchedResponse = null,
    skipFetch = false,
}) {

    /*
    |--------------------------------------------------------------------------
    | DATA
    |--------------------------------------------------------------------------
    */

    const [
        data,
        setData,
    ] =
        useState(null);


    const [
        loading,
        setLoading,
    ] =
        useState(
            !(
                skipFetch
                && prefetchedResponse
            )
        );


    const [
        error,
        setError,
    ] =
        useState("");


    /*
    |--------------------------------------------------------------------------
    | RESPONSIVE STATE
    |--------------------------------------------------------------------------
    */

    const [
        isMobile,
        setIsMobile,
    ] =
        useState(
            () =>
                window.matchMedia(
                    "(max-width: 767px)"
                ).matches
        );


    /*
    |--------------------------------------------------------------------------
    | SLIDER STATE
    |--------------------------------------------------------------------------
    */

    const [
        activePage,
        setActivePage,
    ] =
        useState(0);


    const [
        paused,
        setPaused,
    ] =
        useState(false);


    /*
    |--------------------------------------------------------------------------
    | SWIPE REFS
    |--------------------------------------------------------------------------
    */

    const touchStartX =
        useRef(null);


    const touchEndX =
        useRef(null);


    /*
    |--------------------------------------------------------------------------
    | RESPONSIVE WATCH
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {

            const media =
                window.matchMedia(
                    "(max-width: 767px)"
                );


            const handleChange =
                (
                    event
                ) => {

                    setIsMobile(
                        event.matches
                    );


                    /*
                     * Start from first page
                     * when layout switches.
                     */

                    setActivePage(
                        0
                    );

                };


            handleChange(
                media
            );


            media.addEventListener(
                "change",
                handleChange
            );


            return () => {

                media.removeEventListener(
                    "change",
                    handleChange
                );

            };

        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | LOAD FLASH SALE PRODUCTS
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            if (skipFetch) {
                if (prefetchedResponse) {
                    setData(prefetchedResponse);
                    setActivePage(0);
                    setLoading(false);
                    setError("");
                }

                return undefined;
            }

            let mounted =
                true;


            setLoading(
                true
            );


            setError("");


            /*
             * Always request enough products for sliding.
             *
             * API maximum = 24.
             */

            const requestLimit =
                Math.min(
                    24,

                    Math.max(
                        12,
                        Number(limit) || 24
                    )
                );


            flashSaleService
                .home({
                    slug,
                    limit:
                        requestLimit,
                })
                .then(
                    (
                        response
                    ) => {

                        if (
                            !mounted
                        ) {
                            return;
                        }


                        setData(
                            response
                        );


                        setActivePage(
                            0
                        );

                    }
                )
                .catch(
                    (
                        exception
                    ) => {

                        if (
                            !mounted
                        ) {
                            return;
                        }


                        console.error(
                            "Flash Sale API Error:",
                            exception
                        );


                        setData(
                            null
                        );


                        setError(
                            exception?.message ||
                            "Flash Sale could not be loaded."
                        );

                    }
                )
                .finally(
                    () => {

                        if (
                            mounted
                        ) {

                            setLoading(
                                false
                            );

                        }

                    }
                );


            return () => {

                mounted =
                    false;

            };

        },
        [
            slug,
            limit,
            skipFetch,
            prefetchedResponse,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | OFFER + PRODUCTS
    |--------------------------------------------------------------------------
    */

    const offer =
        data?.data?.offer;


    const products =
        data?.data?.products ||
        [];


    /*
    |--------------------------------------------------------------------------
    | PAGE SIZE
    |--------------------------------------------------------------------------
    |
    | Desktop = 6
    | Mobile  = 2
    |
    */

    const pageSize =
        isMobile
            ? MOBILE_PAGE_SIZE
            : DESKTOP_PAGE_SIZE;


    /*
    |--------------------------------------------------------------------------
    | PRODUCT PAGES
    |--------------------------------------------------------------------------
    */

    const pages =
        useMemo(
            () =>
                chunkArray(
                    products,
                    pageSize
                ),
            [
                products,
                pageSize,
            ]
        );


    const pageCount =
        pages.length;


    /*
    |--------------------------------------------------------------------------
    | KEEP ACTIVE PAGE VALID
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {

            if (
                pageCount === 0
            ) {

                setActivePage(
                    0
                );

                return;

            }


            if (
                activePage >=
                pageCount
            ) {

                setActivePage(
                    0
                );

            }

        },
        [
            pageCount,
            activePage,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | AUTOMATIC SLIDE
    |--------------------------------------------------------------------------
    |
    | Desktop + Mobile both.
    |
    */

    useEffect(
        () => {

            if (
                pageCount <= 1 ||
                paused
            ) {
                return undefined;
            }


            const timer =
                window.setInterval(
                    () => {

                        if (
                            document.hidden
                        ) {
                            return;
                        }


                        setActivePage(
                            (
                                current
                            ) =>
                                (
                                    current + 1
                                )
                                %
                                pageCount
                        );

                    },
                    AUTO_SLIDE_MS
                );


            return () => {

                window.clearInterval(
                    timer
                );

            };

        },
        [
            pageCount,
            paused,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | PREVIOUS PAGE
    |--------------------------------------------------------------------------
    */

    const previousPage =
        () => {

            if (
                pageCount <= 1
            ) {
                return;
            }


            setActivePage(
                (
                    current
                ) =>
                    (
                        current
                        - 1
                        + pageCount
                    )
                    %
                    pageCount
            );

        };


    /*
    |--------------------------------------------------------------------------
    | NEXT PAGE
    |--------------------------------------------------------------------------
    */

    const nextPage =
        () => {

            if (
                pageCount <= 1
            ) {
                return;
            }


            setActivePage(
                (
                    current
                ) =>
                    (
                        current + 1
                    )
                    %
                    pageCount
            );

        };


    /*
    |--------------------------------------------------------------------------
    | MOBILE SWIPE START
    |--------------------------------------------------------------------------
    */

    const handleTouchStart =
        (
            event
        ) => {

            touchStartX.current =
                event.touches?.[0]
                    ?.clientX
                ??
                null;


            touchEndX.current =
                null;

        };


    /*
    |--------------------------------------------------------------------------
    | MOBILE SWIPE MOVE
    |--------------------------------------------------------------------------
    */

    const handleTouchMove =
        (
            event
        ) => {

            touchEndX.current =
                event.touches?.[0]
                    ?.clientX
                ??
                null;

        };


    /*
    |--------------------------------------------------------------------------
    | MOBILE SWIPE END
    |--------------------------------------------------------------------------
    */

    const handleTouchEnd =
        () => {

            if (
                touchStartX.current ===
                null ||
                touchEndX.current ===
                null
            ) {
                return;
            }


            const distance =
                touchStartX.current
                -
                touchEndX.current;


            /*
             * Ignore tiny finger movements.
             */

            if (
                Math.abs(
                    distance
                )
                <
                40
            ) {

                touchStartX.current =
                    null;


                touchEndX.current =
                    null;


                return;

            }


            /*
             * Swipe left
             */

            if (
                distance > 0
            ) {

                nextPage();

            }


            /*
             * Swipe right
             */

            if (
                distance < 0
            ) {

                previousPage();

            }


            touchStartX.current =
                null;


            touchEndX.current =
                null;

        };


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (
        loading
    ) {

        return (

            <section className="fv-home-flash-sale">

                <div className="fv-home-flash-container">

                    <h2>
                        Flash Sale
                    </h2>


                    <div className="fv-home-flash-loading">

                        <i className="fa-solid fa-spinner fa-spin" />

                        Loading deals...

                    </div>

                </div>

            </section>

        );

    }


    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    if (
        error
    ) {

        return (

            <section className="fv-home-flash-sale">

                <div className="fv-home-flash-container">

                    <h2>
                        Flash Sale
                    </h2>


                    <div className="fv-home-flash-error">

                        <i className="fa-solid fa-circle-exclamation" />

                        {
                            error
                        }

                    </div>

                </div>

            </section>

        );

    }


    /*
    |--------------------------------------------------------------------------
    | NO ACTIVE SALE
    |--------------------------------------------------------------------------
    */

    if (
        !data?.active ||
        !offer ||
        products.length === 0
    ) {

        return null;

    }


    /*
    |--------------------------------------------------------------------------
    | MAIN FLASH SALE UI
    |--------------------------------------------------------------------------
    */

    return (

        <section className="fv-home-flash-sale">

            <div className="fv-home-flash-container">


                {/* ========================================================
                    TITLE
                ======================================================== */}

                <h2>
                    {
                        offer.name ||
                        "Flash Sale"
                    }
                </h2>


                <div
                    className="fv-home-flash-box"

                    /*
                     * Desktop hover pause.
                     */

                    onMouseEnter={() =>
                        setPaused(
                            true
                        )
                    }

                    onMouseLeave={() =>
                        setPaused(
                            false
                        )
                    }
                >


                    {/* ====================================================
                        HEADER
                    ==================================================== */}

                    <div className="fv-home-flash-head">

                        <span>
                            On Sale Now
                        </span>


                        <Link
                            to={`/flash-sale?slug=${encodeURIComponent(
                                offer.slug
                            )}`}
                        >
                            SHOP ALL PRODUCTS
                        </Link>

                    </div>


                    {/* ====================================================
                        SLIDER
                    ==================================================== */}

                    <div className="fv-flash-slider-shell">


                        {/* =================================================
                            PREVIOUS BUTTON
                            Desktop only
                        ================================================= */}

                        {pageCount >
                            1 && (

                            <button
                                type="button"
                                className="fv-flash-arrow fv-flash-arrow-left"
                                aria-label="Previous Flash Sale products"
                                onClick={
                                    previousPage
                                }
                            >

                                <i className="fa-solid fa-chevron-left" />

                            </button>

                        )}


                        {/* =================================================
                            VIEWPORT
                        ================================================= */}

                        <div
                            className="fv-flash-slider-viewport"

                            onTouchStart={
                                handleTouchStart
                            }

                            onTouchMove={
                                handleTouchMove
                            }

                            onTouchEnd={
                                handleTouchEnd
                            }
                        >


                            {/* =============================================
                                TRACK
                            ============================================= */}

                            <div className="fv-flash-slider-track">
                                <div className="fv-flash-slider-page">
                                    {(pages[activePage] || []).map(
                                        (product) => (
                                            <FlashSaleProductCard
                                                key={product.id}
                                                product={product}
                                            />
                                        )
                                    )}
                                </div>
                            </div>

                        </div>


                        {/* =================================================
                            NEXT BUTTON
                            Desktop only
                        ================================================= */}

                        {pageCount >
                            1 && (

                            <button
                                type="button"
                                className="fv-flash-arrow fv-flash-arrow-right"
                                aria-label="Next Flash Sale products"
                                onClick={
                                    nextPage
                                }
                            >

                                <i className="fa-solid fa-chevron-right" />

                            </button>

                        )}

                    </div>


                    {/* ====================================================
                        SLIDER INDICATOR
                    ==================================================== */}

                    {pageCount >
                        1 && (

                        <div className="fv-flash-slider-dots">

                            {pages.map(
                                (
                                    _,
                                    index
                                ) => (

                                    <button
                                        type="button"

                                        className={
                                            index ===
                                            activePage

                                                ? "active"

                                                : ""
                                        }

                                        aria-label={`Flash Sale page ${index + 1}`}

                                        onClick={() =>
                                            setActivePage(
                                                index
                                            )
                                        }

                                        key={
                                            index
                                        }
                                    />

                                )
                            )}

                        </div>

                    )}

                </div>

            </div>

        </section>
    );
}