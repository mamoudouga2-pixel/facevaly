import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import mobileCategoryService
    from "../../services/mobileCategoryService";

import "./Categories.css";


/*
|--------------------------------------------------------------------------
| CATEGORY FONT AWESOME ICON
|--------------------------------------------------------------------------
|
| Used only when a category has no real category image.
|
*/

const iconForCategory = (
    slug = "",
    name = ""
) => {
    const value =
        `${slug} ${name}`
            .toLowerCase();

    if (
        value.includes("women")
        ||
        value.includes("fashion")
    ) {
        return "fa-solid fa-shirt";
    }

    if (
        value.includes("men")
    ) {
        return "fa-solid fa-vest";
    }

    if (
        value.includes("electronic")
        ||
        value.includes("gadget")
        ||
        value.includes("mobile")
        ||
        value.includes("computer")
    ) {
        return "fa-solid fa-mobile-screen-button";
    }

    if (
        value.includes("tv")
        ||
        value.includes("appliance")
    ) {
        return "fa-solid fa-tv";
    }

    if (
        value.includes("mother")
        ||
        value.includes("baby")
        ||
        value.includes("kid")
    ) {
        return "fa-solid fa-baby";
    }

    if (
        value.includes("auto")
        ||
        value.includes("motor")
        ||
        value.includes("vehicle")
    ) {
        return "fa-solid fa-car-side";
    }

    if (
        value.includes("sport")
    ) {
        return "fa-regular fa-futbol";
    }

    if (
        value.includes("home")
        ||
        value.includes("living")
    ) {
        return "fa-solid fa-couch";
    }

    if (
        value.includes("grocery")
        ||
        value.includes("food")
    ) {
        return "fa-solid fa-basket-shopping";
    }

    if (
        value.includes("beauty")
        ||
        value.includes("health")
    ) {
        return "fa-solid fa-bottle-droplet";
    }

    if (
        value.includes("watch")
        ||
        value.includes("jewel")
    ) {
        return "fa-regular fa-gem";
    }

    if (
        value.includes("book")
    ) {
        return "fa-solid fa-book";
    }

    if (
        value.includes("shoe")
    ) {
        return "fa-solid fa-shoe-prints";
    }

    return "fa-solid fa-tag";
};


/*
|--------------------------------------------------------------------------
| IMAGE OR ICON
|--------------------------------------------------------------------------
*/

function CategoryVisual({
    category,
    sidebar = false,
}) {
    const [
        imageFailed,
        setImageFailed,
    ] =
        useState(false);

    useEffect(
        () => {
            setImageFailed(
                false
            );
        },
        [
            category?.image,
        ]
    );

    const showImage =
        Boolean(
            category?.has_image
            &&
            category?.image
        )
        &&
        !imageFailed;

    if (
        category?.is_recommended
    ) {
        return (
            <span
                className={
                    sidebar
                        ? "fv-cat-sidebar-visual"
                        : "fv-cat-grid-visual"
                }
            >
                <i className="fa-solid fa-user-plus" />
            </span>
        );
    }

    if (showImage) {
        return (
            <span
                className={
                    sidebar
                        ? "fv-cat-sidebar-visual image"
                        : "fv-cat-grid-visual image"
                }
            >
                <img
                    src={
                        category.image
                    }
                    alt=""
                    loading="lazy"
                    draggable="false"
                    onError={() =>
                        setImageFailed(
                            true
                        )
                    }
                />
            </span>
        );
    }

    return (
        <span
            className={
                sidebar
                    ? "fv-cat-sidebar-visual"
                    : "fv-cat-grid-visual"
            }
        >
            <i
                className={
                    iconForCategory(
                        category?.slug,
                        category?.name
                    )
                }
            />
        </span>
    );
}


/*
|--------------------------------------------------------------------------
| CATEGORIES PAGE
|--------------------------------------------------------------------------
*/

export default function Categories() {
    const navigate =
        useNavigate();

    const [
        data,
        setData,
    ] =
        useState({
            recommended: [],
            roots: [],
        });

    const [
        selected,
        setSelected,
    ] =
        useState(
            "recommended"
        );

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

    const [
        searchOpen,
        setSearchOpen,
    ] =
        useState(false);

    const [
        search,
        setSearch,
    ] =
        useState("");

    const searchInputRef =
        useRef(null);

    const rightPaneRef =
        useRef(null);


    /*
    |--------------------------------------------------------------------------
    | LOAD DYNAMIC CATEGORY MENU
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            let alive =
                true;

            setLoading(
                true
            );

            setError("");

            mobileCategoryService
                .menu()
                .then(
                    (
                        response
                    ) => {
                        if (!alive) {
                            return;
                        }

                        setData({
                            recommended:
                                response?.data
                                    ?.recommended
                                ||
                                [],

                            roots:
                                response?.data
                                    ?.roots
                                ||
                                [],
                        });
                    }
                )
                .catch(
                    (
                        exception
                    ) => {
                        if (!alive) {
                            return;
                        }

                        console.error(
                            "Mobile category menu error:",
                            exception
                        );

                        setError(
                            exception?.message
                            ||
                            "Categories could not be loaded."
                        );
                    }
                )
                .finally(
                    () => {
                        if (alive) {
                            setLoading(
                                false
                            );
                        }
                    }
                );

            return () => {
                alive =
                    false;
            };
        },
        []
    );


    /*
    |--------------------------------------------------------------------------
    | LEFT MENU
    |--------------------------------------------------------------------------
    */

    const sidebarItems =
        useMemo(
            () => [
                {
                    id:
                        "recommended",

                    name:
                        "Just for You",

                    slug:
                        "recommended",

                    image:
                        null,

                    has_image:
                        false,

                    is_recommended:
                        true,
                },

                ...data.roots,
            ],
            [
                data.roots,
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | ACTIVE RIGHT PANE ITEMS
    |--------------------------------------------------------------------------
    */

    const activeItems =
        useMemo(
            () => {
                if (
                    selected ===
                    "recommended"
                ) {
                    return data.recommended;
                }

                const root =
                    data.roots
                        .find(
                            (
                                category
                            ) =>
                                String(
                                    category.id
                                )
                                ===
                                String(
                                    selected
                                )
                        );

                return root?.items
                    ||
                    [];
            },
            [
                selected,
                data,
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | LOCAL SEARCH
    |--------------------------------------------------------------------------
    */

    const visibleItems =
        useMemo(
            () => {
                const query =
                    search
                        .trim()
                        .toLowerCase();

                if (!query) {
                    return activeItems;
                }

                return activeItems
                    .filter(
                        (
                            category
                        ) =>
                            String(
                                category.name
                                ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    query
                                )
                    );
            },
            [
                activeItems,
                search,
            ]
        );


    /*
    |--------------------------------------------------------------------------
    | SELECT LEFT CATEGORY
    |--------------------------------------------------------------------------
    */

    const selectSidebar =
        (
            item
        ) => {
            setSelected(
                item.is_recommended
                    ? "recommended"
                    : String(
                        item.id
                    )
            );

            setSearch("");

            rightPaneRef.current
                ?.scrollTo({
                    top: 0,
                    behavior: "auto",
                });
        };


    /*
    |--------------------------------------------------------------------------
    | SEARCH BUTTON
    |--------------------------------------------------------------------------
    */

    const openSearch =
        () => {
            setSearchOpen(
                true
            );

            window.setTimeout(
                () =>
                    searchInputRef.current
                        ?.focus(),
                0
            );
        };


    const closeSearch =
        () => {
            setSearchOpen(
                false
            );

            setSearch("");
        };


    /*
    |--------------------------------------------------------------------------
    | BACK
    |--------------------------------------------------------------------------
    */

    const goBack =
        () => {
            if (
                window.history.length >
                1
            ) {
                navigate(
                    -1
                );

                return;
            }

            navigate(
                "/"
            );
        };


    return (
        <div className="fv-mobile-category-page">

            {/* ============================================================
                PAGE HEADER
            ============================================================ */}

            <header className="fv-cat-page-header">

                <button
                    type="button"
                    className="fv-cat-header-icon"
                    aria-label="Back"
                    onClick={
                        goBack
                    }
                >
                    <i className="fa-solid fa-arrow-left" />
                </button>


                {searchOpen ? (

                    <div className="fv-cat-header-search">

                        <i className="fa-solid fa-magnifying-glass" />

                        <input
                            ref={
                                searchInputRef
                            }
                            type="search"
                            placeholder="Search categories"
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

                    </div>

                ) : (

                    <h1>
                        Categories
                    </h1>

                )}


                {searchOpen ? (

                    <button
                        type="button"
                        className="fv-cat-header-icon"
                        aria-label="Close search"
                        onClick={
                            closeSearch
                        }
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>

                ) : (

                    <button
                        type="button"
                        className="fv-cat-header-icon"
                        aria-label="Search categories"
                        onClick={
                            openSearch
                        }
                    >
                        <i className="fa-solid fa-magnifying-glass" />
                    </button>

                )}

            </header>


            {/* ============================================================
                CONTENT
            ============================================================ */}

            <div className="fv-cat-page-content">

                {/* ========================================================
                    LEFT VERTICAL CATEGORY MENU
                ======================================================== */}

                <aside className="fv-cat-sidebar">

                    {sidebarItems.map(
                        (
                            item
                        ) => {
                            const active =
                                item.is_recommended
                                    ? selected ===
                                        "recommended"

                                    : String(
                                        selected
                                    )
                                    ===
                                    String(
                                        item.id
                                    );

                            return (
                                <button
                                    type="button"

                                    className={
                                        active
                                            ? "fv-cat-sidebar-item active"
                                            : "fv-cat-sidebar-item"
                                    }

                                    onClick={() =>
                                        selectSidebar(
                                            item
                                        )
                                    }

                                    key={
                                        item.is_recommended
                                            ? "recommended"
                                            : item.id
                                    }
                                >

                                    <CategoryVisual
                                        category={
                                            item
                                        }
                                        sidebar
                                    />


                                    <span>
                                        {
                                            item.name
                                        }
                                    </span>

                                </button>
                            );
                        }
                    )}

                </aside>


                {/* ========================================================
                    RIGHT 3-COLUMN CATEGORY GRID
                ======================================================== */}

                <main
                    ref={
                        rightPaneRef
                    }
                    className="fv-cat-right-pane"
                >

                    {loading ? (

                        <div className="fv-cat-state">

                            <i className="fa-solid fa-spinner fa-spin" />

                            <span>
                                Loading categories...
                            </span>

                        </div>

                    ) : error ? (

                        <div className="fv-cat-state error">

                            <i className="fa-solid fa-circle-exclamation" />

                            <span>
                                {
                                    error
                                }
                            </span>

                        </div>

                    ) : visibleItems.length >
                        0 ? (

                        <div className="fv-cat-grid">

                            {visibleItems.map(
                                (
                                    category
                                ) => (

                                    <Link
                                        className="fv-cat-grid-item"

                                        to={`/category/${category.slug}`}

                                        key={
                                            category.id
                                        }
                                    >

                                        <CategoryVisual
                                            category={
                                                category
                                            }
                                        />


                                        <span>
                                            {
                                                category.name
                                            }
                                        </span>

                                    </Link>

                                )
                            )}

                        </div>

                    ) : (

                        <div className="fv-cat-state">

                            <i className="fa-solid fa-box-open" />

                            <span>
                                No categories found
                            </span>

                        </div>

                    )}

                </main>

            </div>

        </div>
    );
}
