import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import categoryStorefrontService
    from "../../../services/categoryStorefrontService";

import {
    categoryIconClass,
    dedupeCategoriesByName,
} from "../../../utils/categoryIcon";

import "./CategoryShowcase.css";


/*
|--------------------------------------------------------------------------
| MOBILE PAGE SIZE
|--------------------------------------------------------------------------
|
| Mobile:
|
| 5 columns
| ×
| 2 rows
|
| = 10 categories per swipe page
|
*/

const MOBILE_PAGE_SIZE = 10;
const DESKTOP_PAGE_SIZE = 16;


/*
|--------------------------------------------------------------------------
| CHUNK ARRAY (circular fill)
|--------------------------------------------------------------------------
|
| Always fill each page to `size` slots by wrapping from the start.
| That keeps the desktop 8×2 (and mobile 5×2) grid fully aligned,
| and the duplicated track can loop last → first without empty cells.
|
*/

const chunkArrayCircular = (
    items,
    size
) => {
    if (
        !Array.isArray(items)
        || items.length === 0
        || size < 1
    ) {
        return [];
    }

    const pageCount =
        Math.max(
            1,
            Math.ceil(
                items.length / size
            )
        );

    const pages = [];

    for (
        let pageIndex = 0;
        pageIndex < pageCount;
        pageIndex += 1
    ) {
        const page = [];

        for (
            let slot = 0;
            slot < size;
            slot += 1
        ) {
            const index =
                (
                    pageIndex * size
                    + slot
                ) % items.length;

            page.push(
                items[index]
            );
        }

        pages.push(
            page
        );
    }

    return pages;
};


/*
|--------------------------------------------------------------------------
| CATEGORY ICON (Font Awesome)
|--------------------------------------------------------------------------
*/

function CategoryIcon({
    category,
}) {
    return (
        <span
            className="fv-category-icon"
            aria-hidden="true"
        >
            <i
                className={
                    categoryIconClass(
                        category
                    )
                }
            />
        </span>
    );
}


/*
|--------------------------------------------------------------------------
| CATEGORY ITEM
|--------------------------------------------------------------------------
*/

function CategoryItem({
    category,
    mobile = false,
}) {
    return (
        <Link
            to={`/category/${category.slug}`}
            className={
                mobile
                    ? "fv-category-mobile-item"
                    : "fv-category-desktop-item"
            }
        >

            <div
                className={
                    mobile
                        ? "fv-category-mobile-image"
                        : "fv-category-desktop-image"
                }
            >

                <CategoryIcon
                    category={
                        category
                    }
                />

            </div>


            <span className="fv-category-name">
                {
                    category.name
                }
            </span>

        </Link>
    );
}


/*
|--------------------------------------------------------------------------
| CATEGORY SHOWCASE
|--------------------------------------------------------------------------
*/

export default function CategoryShowcase({
    title = "Categories",
    limit = 16,
    showTitleOnMobile = false,
    prefetchedCategories = null,
    skipFetch = false,
}) {
    const [
        categories,
        setCategories,
    ] =
        useState([]);

    const [
        loading,
        setLoading,
    ] =
        useState(
            !(
                skipFetch
                && Array.isArray(prefetchedCategories)
            )
        );

    const [
        error,
        setError,
    ] =
        useState("");

    const [
        activePage,
        setActivePage,
    ] =
        useState(0);


    /*
    |--------------------------------------------------------------------------
    | MOBILE SCROLLER REF
    |--------------------------------------------------------------------------
    */

    const mobileScrollerRef =
        useRef(null);
    const desktopScrollerRef =
        useRef(null);

    const [
        isDesktopPaused,
        setIsDesktopPaused,
    ] = useState(false);

    const scrollFrameRef =
        useRef(null);


    /*
    |--------------------------------------------------------------------------
    | LOAD CATEGORIES
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            if (skipFetch) {
                if (Array.isArray(prefetchedCategories)) {
                    setCategories(
                        dedupeCategoriesByName(
                            prefetchedCategories
                        )
                    );
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


            categoryStorefrontService
                .categories({
                    limit,
                    parent: "root",
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


                        const rows =
                            Array.isArray(
                                response?.data
                            )
                                ? response.data
                                : [];


                        setCategories(
                            dedupeCategoriesByName(
                                rows
                            )
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
                            "Category Showcase Error:",
                            exception
                        );


                        setCategories(
                            []
                        );


                        setError(
                            exception?.message ||
                            "Categories could not be loaded."
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


                if (
                    scrollFrameRef.current
                ) {
                    window.cancelAnimationFrame(
                        scrollFrameRef.current
                    );
                }
            };
        },
        [
            limit,
            skipFetch,
            prefetchedCategories,
        ]
    );


    /*
    |--------------------------------------------------------------------------
    | MOBILE CATEGORY PAGES
    |--------------------------------------------------------------------------
    */

    const mobilePages =
        useMemo(
            () =>
                chunkArrayCircular(
                    categories,
                    MOBILE_PAGE_SIZE
                ),
            [
                categories,
            ]
        );

    const desktopPages =
        useMemo(
            () =>
                chunkArrayCircular(
                    categories,
                    DESKTOP_PAGE_SIZE
                ),
            [
                categories,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | DESKTOP LOOP TRACK
    |--------------------------------------------------------------------------
    |
    | Duplicate the filled pages so CSS translateX(-50%) loops
    | seamlessly: after the last page, the first page starts again.
    |
    */

    const desktopLoopPages =
        useMemo(
            () => {
                if (
                    desktopPages.length ===
                    0
                ) {
                    return [];
                }

                return [
                    ...desktopPages,
                    ...desktopPages,
                ];
            },
            [
                desktopPages,
            ]
        );


    const pageCount =
        Math.max(
            mobilePages.length,
            1
        );


    /*
    |--------------------------------------------------------------------------
    | DETECT CURRENT PAGE WHILE SWIPING
    |--------------------------------------------------------------------------
    */

    const handleMobileScroll =
        () => {
            const scroller =
                mobileScrollerRef.current;


            if (
                !scroller
            ) {
                return;
            }


            if (
                scrollFrameRef.current
            ) {
                window.cancelAnimationFrame(
                    scrollFrameRef.current
                );
            }


            scrollFrameRef.current =
                window.requestAnimationFrame(
                    () => {
                        const width =
                            scroller.clientWidth ||
                            1;


                        const page =
                            Math.round(
                                scroller.scrollLeft /
                                width
                            );


                        setActivePage(
                            Math.max(
                                0,

                                Math.min(
                                    page,
                                    mobilePages.length - 1
                                )
                            )
                        );
                    }
                );
        };


    /*
    |--------------------------------------------------------------------------
    | PROGRAMMATIC PAGE CHANGE
    |--------------------------------------------------------------------------
    */

    const scrollToPage =
        (
            page
        ) => {
            const scroller =
                mobileScrollerRef.current;


            if (
                !scroller ||
                mobilePages.length === 0
            ) {
                return;
            }


            const safePage =
                Math.max(
                    0,

                    Math.min(
                        page,
                        mobilePages.length - 1
                    )
                );


            scroller.scrollTo({
                left:
                    safePage *
                    scroller.clientWidth,

                behavior:
                    "smooth",
            });


            setActivePage(
                safePage
            );
        };


    /*
    |--------------------------------------------------------------------------
    | KEYBOARD SUPPORT
    |--------------------------------------------------------------------------
    */

    const handleKeyDown =
        (
            event
        ) => {
            if (
                event.key ===
                "ArrowRight"
            ) {
                event.preventDefault();

                scrollToPage(
                    activePage + 1
                );
            }


            if (
                event.key ===
                "ArrowLeft"
            ) {
                event.preventDefault();

                scrollToPage(
                    activePage - 1
                );
            }
        };


    /*
    |--------------------------------------------------------------------------
    | DESKTOP AUTO SLIDE — pause on hover
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (
        loading
    ) {
        return (
            <section className="fv-category-showcase">

                <div className="fv-category-showcase-container">

                    <h2
                        className={
                            showTitleOnMobile
                                ? ""
                                : "fv-category-title-mobile-hidden"
                        }
                    >
                        {
                            title
                        }
                    </h2>


                    <div className="fv-category-showcase-loading">

                        <i className="fa-solid fa-spinner fa-spin" />

                        Loading categories...

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
        error &&
        categories.length === 0
    ) {
        return (
            <section className="fv-category-showcase">

                <div className="fv-category-showcase-container">

                    <h2
                        className={
                            showTitleOnMobile
                                ? ""
                                : "fv-category-title-mobile-hidden"
                        }
                    >
                        {
                            title
                        }
                    </h2>


                    <div className="fv-category-showcase-error">

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
    | NO CATEGORIES
    |--------------------------------------------------------------------------
    */

    if (
        categories.length ===
        0
    ) {
        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | MAIN UI
    |--------------------------------------------------------------------------
    */

    return (
        <section className="fv-category-showcase">

            <div className="fv-category-showcase-container">


                {/* ========================================================
                    TITLE
                ======================================================== */}

                <h2
                    className={
                        showTitleOnMobile
                            ? ""
                            : "fv-category-title-mobile-hidden"
                    }
                >
                    {
                        title
                    }
                </h2>


                {/* ========================================================
                    DESKTOP CATEGORY GRID

                    16 categories
                    8 columns × 2 rows
                ======================================================== */}

                <div className="fv-category-desktop-grid">
                    <div
                        ref={
                            desktopScrollerRef
                        }
                        className={
                            isDesktopPaused
                                ? "fv-category-desktop-scroller is-paused"
                                : "fv-category-desktop-scroller"
                        }
                        onMouseEnter={() =>
                            setIsDesktopPaused(
                                true
                            )
                        }
                        onMouseLeave={() =>
                            setIsDesktopPaused(
                                false
                            )
                        }
                        onFocus={() =>
                            setIsDesktopPaused(
                                true
                            )
                        }
                        onBlur={() =>
                            setIsDesktopPaused(
                                false
                            )
                        }
                        tabIndex={0}
                        aria-label="Categories carousel"
                    >
                    <div
                        className={
                            desktopLoopPages.length >
                            0
                                ? "fv-category-desktop-track is-animated"
                                : "fv-category-desktop-track"
                        }
                    >
                        {desktopLoopPages.map(
                            (
                                page,
                                pageIndex
                            ) => (
                                <div
                                    className="fv-category-desktop-page"
                                    key={`desktop-page-${pageIndex}`}
                                >
                                    {page.map(
                                        (
                                            category,
                                            slotIndex
                                        ) => (
                                            <CategoryItem
                                                key={`${pageIndex}-${slotIndex}-${category.id}`}
                                                category={
                                                    category
                                                }
                                            />
                                        )
                                    )}
                                </div>
                            )
                        )}
                    </div>
                    </div>
                </div>


                {/* ========================================================
                    MOBILE CATEGORY SLIDER

                    10 categories per page
                    5 columns × 2 rows

                    Native swipe + scroll snap.
                ======================================================== */}

                <div className="fv-category-mobile-wrap">

                    <div
                        ref={
                            mobileScrollerRef
                        }
                        className="fv-category-mobile-scroller"
                        role="region"
                        aria-label="Categories"
                        tabIndex="0"
                        onScroll={
                            handleMobileScroll
                        }
                        onKeyDown={
                            handleKeyDown
                        }
                    >

                        <div className="fv-category-mobile-track">

                            {mobilePages.map(
                                (
                                    page,
                                    pageIndex
                                ) => (

                                    <div
                                        className="fv-category-mobile-page"
                                        key={
                                            pageIndex
                                        }
                                    >

                                        {page.map(
                                            (
                                                category,
                                                slotIndex
                                            ) => (

                                                <CategoryItem
                                                    key={`${pageIndex}-${slotIndex}-${category.id}`}
                                                    category={
                                                        category
                                                    }
                                                    mobile
                                                />

                                            )
                                        )}

                                    </div>

                                )
                            )}

                        </div>

                    </div>


                    {/* ====================================================
                        MOBILE PROGRESS INDICATOR

                        Grey base
                        +
                        moving red part
                    ==================================================== */}

                    {mobilePages.length >
                        1 && (

                        <div className="fv-category-mobile-progress">

                            <span
                                style={{
                                    width:
                                        `${100 / pageCount}%`,

                                    transform:
                                        `translateX(${activePage * 100}%)`,
                                }}
                            />

                        </div>

                    )}

                </div>

            </div>

        </section>
    );
}