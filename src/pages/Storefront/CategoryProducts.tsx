import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useParams,
    useSearchParams,
} from "react-router-dom";

import categoryStorefrontService
    from "../../services/categoryStorefrontService";

import CategoryMenuDropdown
    from "../../components/frontend/category/CategoryMenuDropdown";

import CategoryBreadcrumbs
    from "../../components/frontend/category/CategoryBreadcrumbs";

import CategorySidebar
    from "../../components/frontend/category/CategorySidebar";

import CategoryToolbar
    from "../../components/frontend/category/CategoryToolbar";

import CategoryProductCard
    from "../../components/frontend/category/CategoryProductCard";

import CategoryPagination
    from "../../components/frontend/category/CategoryPagination";

import ProductSkeletonGrid
    from "../../components/frontend/ProductSkeletonGrid";

import {
    persistPage,
    readPageBootstrap,
} from "../../utils/pageBootstrap";

import MobileFilterDrawer
    from "../../components/frontend/category/MobileFilterDrawer";

import "../../styles/storefront-commerce.css";

import "../../components/frontend/shop/ShopFilters.css";

import "./CategoryProducts.css";


const arrayFromParams = (
    searchParams,
    key
) =>
    searchParams
        .getAll(`${key}[]`)
        .map(Number)
        .filter(
            (value) =>
                Number.isInteger(value) &&
                value > 0
        );


const readAttributes =
    (searchParams) => {

        const attributes = {};

        for (
            const [key, value]
            of searchParams.entries()
        ) {

            const match =
                key.match(
                    /^attributes\[(\d+)\]\[\]$/
                );


            if (!match) {
                continue;
            }


            const attributeId =
                Number(match[1]);


            const valueId =
                Number(value);


            if (
                !Number.isInteger(
                    attributeId
                )
                ||
                !Number.isInteger(
                    valueId
                )
            ) {
                continue;
            }


            if (
                !attributes[
                    attributeId
                ]
            ) {

                attributes[
                    attributeId
                ] =
                    [];

            }


            attributes[
                attributeId
            ].push(
                valueId
            );

        }


        return attributes;

    };


const isDefaultCategoryFilters = (
    filters
) =>
    !filters.q
    && !filters.min_price
    && !filters.max_price
    && !(filters.brands?.length)
    && !(filters.flags?.length)
    && !Object.keys(
        filters.attributes || {}
    ).length
    && !filters.in_stock
    && Number(filters.page || 1) === 1
    && (
        !filters.sort
        || filters.sort === "best_match"
    );


export default function CategoryProducts() {

    const { slug } =
        useParams();

    const initialBootstrap =
        useMemo(
            () => readPageBootstrap(
                "category",
                slug
            ),
            [slug]
        );

    const [
        searchParams,
        setSearchParams,
    ] =
        useSearchParams();


    const [
        category,
        setCategory,
    ] =
        useState(
            initialBootstrap?.category
            ?? null
        );


    const [
        breadcrumbs,
        setBreadcrumbs,
    ] =
        useState(
            initialBootstrap?.breadcrumbs
            ?? []
        );


    const [
        relatedCategories,
        setRelatedCategories,
    ] =
        useState(
            initialBootstrap?.sidebar_categories
            ?? []
        );


    const [
        products,
        setProducts,
    ] =
        useState(
            initialBootstrap?.data
            ?? []
        );


    const [
        filterOptions,
        setFilterOptions,
    ] =
        useState(
            initialBootstrap?.filters
            ?? {
                price: {
                    min: 0,
                    max: 0,
                },
                brands: [],
                flags: [],
                attributes: [],
                sorts: [],
            }
        );


    const [
        meta,
        setMeta,
    ] =
        useState(
            initialBootstrap?.meta
            ?? {
                current_page: 1,
                last_page: 1,
                total: 0,
            }
        );


    const [
        loading,
        setLoading,
    ] =
        useState(
            !initialBootstrap?.data?.length
        );


    const [
        error,
        setError,
    ] =
        useState("");


    const [
        view,
        setView,
    ] =
        useState(
            () =>
                window.localStorage.getItem(
                    "fv_category_view"
                ) || "grid"
        );


    const [
        mobileFiltersOpen,
        setMobileFiltersOpen,
    ] =
        useState(false);


    const [
        selected,
        setSelected,
    ] =
        useState({
            q:
                searchParams.get("q")
                || "",

            sort:
                searchParams.get("sort")
                || "best_match",

            page:
                Number(
                    searchParams.get("page")
                    || 1
                ),

            per_page:
                Number(
                    searchParams.get("per_page")
                    || 20
                ),

            min_price:
                searchParams.get(
                    "min_price"
                )
                || "",

            max_price:
                searchParams.get(
                    "max_price"
                )
                || "",

            brands:
                arrayFromParams(
                    searchParams,
                    "brands"
                ),

            flags:
                arrayFromParams(
                    searchParams,
                    "flags"
                ),

            attributes:
                readAttributes(
                    searchParams
                ),

            in_stock:
                searchParams.get(
                    "in_stock"
                ) === "1",
        });

    const [
        searchDraft,
        setSearchDraft,
    ] = useState(
        selected.q || ""
    );

    useEffect(() => {
        setSearchDraft(selected.q || "");
    }, [selected.q]);


    const updateUrl =
        useCallback(
            (next) => {

                const params =
                    new URLSearchParams();


                if (next.q) {
                    params.set(
                        "q",
                        next.q
                    );
                }


                if (
                    next.sort
                    &&
                    next.sort !==
                    "best_match"
                ) {
                    params.set(
                        "sort",
                        next.sort
                    );
                }


                if (
                    next.page
                    &&
                    Number(next.page)
                    > 1
                ) {
                    params.set(
                        "page",
                        String(
                            next.page
                        )
                    );
                }


                if (
                    next.per_page
                    &&
                    Number(
                        next.per_page
                    ) !== 20
                ) {
                    params.set(
                        "per_page",
                        String(
                            next.per_page
                        )
                    );
                }


                if (
                    next.min_price !==
                    ""
                ) {

                    params.set(
                        "min_price",
                        String(
                            next.min_price
                        )
                    );

                }


                if (
                    next.max_price !==
                    ""
                ) {

                    params.set(
                        "max_price",
                        String(
                            next.max_price
                        )
                    );

                }


                next.brands.forEach(
                    (id) =>
                        params.append(
                            "brands[]",
                            String(id)
                        )
                );


                next.flags.forEach(
                    (id) =>
                        params.append(
                            "flags[]",
                            String(id)
                        )
                );


                Object.entries(
                    next.attributes
                ).forEach(
                    ([
                        attributeId,
                        valueIds,
                    ]) => {

                        valueIds.forEach(
                            (valueId) => {

                                params.append(
                                    `attributes[${attributeId}][]`,
                                    String(
                                        valueId
                                    )
                                );

                            }
                        );

                    }
                );


                if (
                    next.in_stock
                ) {

                    params.set(
                        "in_stock",
                        "1"
                    );

                }


                setSearchParams(
                    params,
                    {
                        replace: true,
                    }
                );

            },
            [
                setSearchParams,
            ]
        );


    const load =
        useCallback(
            async (
                next = selected
            ) => {

                setLoading(
                    true
                );

                setError("");


                try {

                    const response =
                        await categoryStorefrontService
                            .products(
                                slug,
                                next
                            );


                    setCategory(
                        response.category
                    );


                    setBreadcrumbs(
                        response.breadcrumbs
                        || []
                    );


                    setRelatedCategories(
                        response
                            .sidebar_categories
                        || []
                    );


                    setProducts(
                        response.data
                        || []
                    );


                    setMeta(
                        response.meta
                        || {}
                    );


                    const options =
                        response.filters
                        || {};


                    setFilterOptions(
                        options
                    );

                    if (
                        isDefaultCategoryFilters(
                            next
                        )
                    ) {
                        persistPage(
                            "category",
                            slug,
                            response
                        );
                    }


                    setSelected(
                        (current) => {

                            const nextSelected =
                                {
                                    ...current,

                                    min_price:
                                        current
                                            .min_price ===
                                        ""
                                            ? (
                                                options
                                                    .price
                                                    ?.min
                                                ?? 0
                                            )
                                            : current
                                                .min_price,

                                    max_price:
                                        current
                                            .max_price ===
                                        ""
                                            ? (
                                                options
                                                    .price
                                                    ?.max
                                                ?? 0
                                            )
                                            : current
                                                .max_price,
                                };


                            return nextSelected;

                        }
                    );


                } catch (
                    exception
                ) {

                    setError(
                        exception
                            .message
                        ||
                        "Category products could not be loaded."
                    );

                } finally {

                    setLoading(
                        false
                    );

                }

            },
            [
                slug,
                selected,
            ]
        );


    useEffect(
        () => {

            window.scrollTo({
                top: 0,
                left: 0,
            });


            load(
                selected
            );


        },
        [
            slug,
            selected.sort,
            selected.page,
            selected.per_page,
            selected.brands.join(","),
            selected.flags.join(","),
            JSON.stringify(
                selected.attributes
            ),
        ]
    );


    /*
     * Price inputs apply with a short debounce.
     */
    useEffect(
        () => {

            if (
                !category
            ) {
                return;
            }


            const timer =
                window.setTimeout(
                    () => {

                        const next =
                            {
                                ...selected,
                                page: 1,
                            };


                        updateUrl(
                            next
                        );


                        load(next);

                    },
                    500
                );


            return () =>
                window.clearTimeout(
                    timer
                );


        },
        [
            selected.min_price,
            selected.max_price,
        ]
    );


    const changeSelected =
        (
            updater,
            shouldLoad = true
        ) => {

            setSelected(
                (current) => {

                    const next =
                        typeof updater ===
                        "function"
                            ? updater(
                                current
                            )
                            : {
                                ...current,
                                ...updater,
                            };


                    updateUrl(
                        next
                    );


                    if (
                        shouldLoad
                    ) {

                        window.setTimeout(
                            () =>
                                load(next),
                            0
                        );

                    }


                    return next;

                }
            );

        };


    const toggleArray =
        (
            key,
            id
        ) => {

            changeSelected(
                (current) => {

                    const exists =
                        current[
                            key
                        ].includes(
                            id
                        );


                    return {
                        ...current,

                        page: 1,

                        [key]:
                            exists
                                ? current[
                                    key
                                ].filter(
                                    (value) =>
                                        value !==
                                        id
                                )
                                : [
                                    ...current[
                                        key
                                    ],
                                    id,
                                ],
                    };

                }
            );

        };


    const toggleAttribute =
        (
            attributeId,
            valueId
        ) => {

            changeSelected(
                (current) => {

                    const values =
                        current
                            .attributes[
                            attributeId
                        ] || [];


                    const exists =
                        values.includes(
                            valueId
                        );


                    const nextValues =
                        exists
                            ? values.filter(
                                (id) =>
                                    id !==
                                    valueId
                            )
                            : [
                                ...values,
                                valueId,
                            ];


                    const attributes =
                        {
                            ...current
                                .attributes,
                        };


                    if (
                        nextValues
                            .length
                    ) {

                        attributes[
                            attributeId
                        ] =
                            nextValues;

                    } else {

                        delete attributes[
                            attributeId
                        ];

                    }


                    return {
                        ...current,
                        page: 1,
                        attributes,
                    };

                }
            );

        };


    const clearFilters =
        () => {

            const next =
                {
                    q: "",
                    sort:
                        "best_match",
                    page: 1,
                    per_page: 20,
                    min_price:
                        filterOptions
                            .price
                            ?.min
                        ?? 0,
                    max_price:
                        filterOptions
                            .price
                            ?.max
                        ?? 0,
                    brands: [],
                    flags: [],
                    attributes: {},
                    in_stock: false,
                };


            setSelected(
                next
            );


            updateUrl(
                next
            );


            load(next);

        };


    const submitSearch = (
        event
    ) => {
        event.preventDefault();

        changeSelected({
            q: searchDraft.trim(),
            page: 1,
        });
    };

    const activeChips =
        useMemo(() => {
            const chips = [];

            if (selected.q) {
                chips.push({
                    key: "q",
                    label: `\"${selected.q}\"`,
                });
            }

            if (selected.in_stock) {
                chips.push({
                    key: "in_stock",
                    label: "In stock",
                });
            }

            const priceMinDefault =
                filterOptions.price?.min ?? 0;
            const priceMaxDefault =
                filterOptions.price?.max ?? 0;

            const minHas =
                selected.min_price !== "";
            const maxHas =
                selected.max_price !== "";

            const minVal =
                minHas
                    ? Number(selected.min_price)
                    : priceMinDefault;
            const maxVal =
                maxHas
                    ? Number(selected.max_price)
                    : priceMaxDefault;

            const hasCustomPrice =
                (minHas && minVal !== priceMinDefault) ||
                (maxHas && maxVal !== priceMaxDefault);

            if (hasCustomPrice) {
                chips.push({
                    key: "price",
                    label: `৳${minVal} – ৳${maxVal}`,
                });
            }

            (selected.brands || []).forEach(
                (brandId) => {
                    const brand = (
                        filterOptions.brands ||
                        []
                    ).find(
                        (item) => item.id === brandId
                    );

                    chips.push({
                        key: `brand-${brandId}`,
                        label:
                            brand?.name ||
                            `Brand ${brandId}`,
                    });
                }
            );

            (selected.flags || []).forEach(
                (flagId) => {
                    const flag = (
                        filterOptions.flags ||
                        []
                    ).find(
                        (item) => item.id === flagId
                    );

                    chips.push({
                        key: `flag-${flagId}`,
                        label:
                            flag?.name ||
                            `Offer ${flagId}`,
                    });
                }
            );

            Object.entries(
                selected.attributes || {}
            ).forEach(
                ([attributeId, valueIds]) => {
                    const attribute = (
                        filterOptions.attributes ||
                        []
                    ).find(
                        (item) =>
                            item.id ===
                            Number(attributeId)
                    );

                    (valueIds || []).forEach(
                        (valueId) => {
                            const value =
                                attribute?.values?.find(
                                    (v) =>
                                        v.id === valueId
                                );

                            chips.push({
                                key: `attr-${attributeId}-${valueId}`,
                                label:
                                    value?.value ||
                                    `Option ${valueId}`,
                            });
                        }
                    );
                }
            );

            return chips;
        }, [selected, filterOptions]);

    const removeChip = (
        key
    ) => {
        if (key === "q") {
            setSearchDraft("");
            changeSelected({
                q: "",
                page: 1,
            });
            return;
        }

        if (key === "in_stock") {
            changeSelected({
                in_stock: false,
                page: 1,
            });
            return;
        }

        if (key === "price") {
            changeSelected({
                min_price: "",
                max_price: "",
                page: 1,
            });
            return;
        }

        if (key.startsWith("brand-")) {
            const brandId =
                Number(
                    key.replace("brand-", "")
                );
            changeSelected({
                brands: (selected.brands || []).filter(
                    (id) => id !== brandId
                ),
                page: 1,
            });
            return;
        }

        if (key.startsWith("flag-")) {
            const flagId =
                Number(
                    key.replace("flag-", "")
                );
            changeSelected({
                flags: (selected.flags || []).filter(
                    (id) => id !== flagId
                ),
                page: 1,
            });
            return;
        }

        if (key.startsWith("attr-")) {
            const parts = key.split("-");
            // attr-{attributeId}-{valueId}
            const attributeId = Number(parts[1]);
            const valueId = Number(parts[2]);

            const nextAttributes = {
                ...(selected.attributes || {}),
            };

            const currentValues = nextAttributes[attributeId] || [];
            nextAttributes[attributeId] = currentValues.filter(
                (id) => id !== valueId
            );

            if (
                nextAttributes[attributeId].length === 0
            ) {
                delete nextAttributes[attributeId];
            }

            changeSelected({
                attributes: nextAttributes,
                page: 1,
            });
        }
    };

    const sidebarProps =
        useMemo(
            () => ({
                category,
                relatedCategories,
                filters:
                    filterOptions,
                selected,

                onToggleBrand:
                    (id) =>
                        toggleArray(
                            "brands",
                            id
                        ),

                onToggleFlag:
                    (id) =>
                        toggleArray(
                            "flags",
                            id
                        ),

                onToggleAttribute:
                    toggleAttribute,

                onPriceChange:
                    (
                        field,
                        value
                    ) => {

                        setSelected(
                            (current) => ({
                                ...current,
                                page: 1,
                                [field]:
                                    value,
                            })
                        );

                    },

                onClear:
                    clearFilters,
            }),
            [
                category,
                relatedCategories,
                filterOptions,
                selected,
            ]
        );


    const changeView =
        (nextView) => {

            setView(
                nextView
            );


            window.localStorage
                .setItem(
                    "fv_category_view",
                    nextView
                );

        };


    return (

        <div className="fv-category-page">


            <CategoryMenuDropdown />


            <div className="fv-category-page-container">


                <CategoryBreadcrumbs
                    breadcrumbs={
                        breadcrumbs
                    }
                />


                <div className="fv-category-page-layout">


                    <div className="fv-category-desktop-sidebar">

                        <CategorySidebar
                            {...sidebarProps}
                        />

                    </div>


                    <main className="fv-category-results">


                        <CategoryToolbar
                            category={
                                category
                            }
                            total={
                                meta.total
                            }
                            sort={
                                selected.sort
                            }
                            sortOptions={
                                filterOptions
                                    .sorts
                                || []
                            }
                            view={
                                view
                            }
                            onSort={
                                (sort) =>
                                    changeSelected({
                                        sort,
                                        page: 1,
                                    })
                            }
                            onView={
                                changeView
                            }
                            onOpenFilters={
                                () =>
                                    setMobileFiltersOpen(
                                        true
                                    )
                            }
                        />

                        <div className="fv-shop-discovery">
                            <form
                                className="fv-shop-search-form"
                                onSubmit={submitSearch}
                            >
                                <div
                                    className="fv-shop-search-accent"
                                />

                                <label className="fv-shop-search-field">
                                    <i className="fa-solid fa-magnifying-glass" />

                                    <input
                                        type="search"
                                        value={searchDraft}
                                        placeholder="Search by name, SKU, or description"
                                        onChange={(event) =>
                                            setSearchDraft(
                                                event.target.value
                                            )
                                        }
                                    />
                                </label>

                                <button
                                    type="submit"
                                    className="fv-shop-search-btn"
                                >
                                    Search
                                </button>
                            </form>

                            {activeChips.length > 0 && (
                                <div className="fv-shop-active-filters">
                                    {activeChips.map(
                                        (chip) => (
                                            <span
                                                className="fv-shop-filter-chip"
                                                key={chip.key}
                                            >
                                                {chip.label}

                                                <button
                                                    type="button"
                                                    aria-label={`Remove ${chip.label}`}
                                                    onClick={() =>
                                                        removeChip(chip.key)
                                                    }
                                                >
                                                    <i className="fa-solid fa-xmark" />
                                                </button>
                                            </span>
                                        )
                                    )}
                                </div>
                            )}
                        </div>


                        {error && (

                            <div className="fv-category-error">

                                <i className="fa-solid fa-circle-exclamation" />

                                {error}

                            </div>

                        )}


                        {loading
                        && products.length
                            === 0 ? (

                            <ProductSkeletonGrid
                                view={view}
                            />

                        ) : products.length ===
                          0 ? (

                            <div className="fv-category-empty">

                                No products found in this category.

                            </div>

                        ) : (

                            <div
                                className={
                                    view ===
                                    "list"
                                        ? "fv-category-products fv-category-products-list"
                                        : "fv-category-products fv-category-products-grid"
                                }
                            >

                                {products.map(
                                    (
                                        product
                                    ) => (

                                        <CategoryProductCard
                                            key={
                                                product.id
                                            }
                                            product={
                                                product
                                            }
                                            view={
                                                view
                                            }
                                        />

                                    )
                                )}

                            </div>

                        )}


                        <CategoryPagination
                            meta={
                                meta
                            }
                            onPage={
                                (page) =>
                                    changeSelected({
                                        page,
                                    })
                            }
                        />


                    </main>


                </div>


            </div>


            <MobileFilterDrawer
                open={
                    mobileFiltersOpen
                }
                onClose={
                    () =>
                        setMobileFiltersOpen(
                            false
                        )
                }
                {...sidebarProps}
            />


        </div>

    );

}
