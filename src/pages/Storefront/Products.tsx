import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import storefrontService
    from "../../services/storefrontService";

import ProductSkeletonGrid
    from "../../components/frontend/ProductSkeletonGrid";

import ShopFilterSidebar
    from "../../components/frontend/shop/ShopFilterSidebar";

import ShopMobileFilterDrawer
    from "../../components/frontend/shop/ShopMobileFilterDrawer";

import "../../styles/storefront-commerce.css";
import "../../components/frontend/shop/ShopFilters.css";


const money = (value) => {

    return "৳" +
        Number(
            value || 0
        ).toLocaleString(
            "en-BD"
        );

};


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


const pageItems = (
    current,
    last
) => {

    if (last <= 7) {

        return Array.from(
            {
                length: last,
            },
            (_, index) => index + 1
        );

    }


    const items = [1];

    if (current > 3) {
        items.push("...");
    }

    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);

    for (let page = start; page <= end; page += 1) {
        items.push(page);
    }

    if (current < last - 2) {
        items.push("...");
    }

    items.push(last);

    return items;

};


const SHOP_COLUMNS = 5;
const SHOP_ROWS = 4;
const SHOP_PAGE_SIZE = SHOP_COLUMNS * SHOP_ROWS;


const defaultFilterOptions = {
    price: {
        min: 0,
        max: 0,
    },
    categories: [],
    brands: [],
    flags: [],
    attributes: [],
    sorts: [],
};


export default function Products() {

    const navigate =
        useNavigate();


    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();


    const [
        products,
        setProducts,
    ] = useState([]);


    const [
        filterOptions,
        setFilterOptions,
    ] = useState(defaultFilterOptions);


    const [
        meta,
        setMeta,
    ] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const [
        mobileFiltersOpen,
        setMobileFiltersOpen,
    ] = useState(false);


    const [
        searchDraft,
        setSearchDraft,
    ] = useState(
        () =>
            searchParams.get("q")
            || ""
    );


    const selected =
        useMemo(() => ({

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
                    || SHOP_PAGE_SIZE
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

            category:
                searchParams.get("category")
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

        }), [searchParams]);


    const updateUrl =
        useCallback(
            (next) => {

                const params =
                    new URLSearchParams();


                if (next.q) {
                    params.set("q", next.q);
                }

                if (
                    next.sort
                    && next.sort !== "best_match"
                ) {
                    params.set("sort", next.sort);
                }

                if (next.page && next.page > 1) {
                    params.set("page", String(next.page));
                }

                if (
                    next.per_page
                    && next.per_page !== SHOP_PAGE_SIZE
                ) {
                    params.set(
                        "per_page",
                        String(next.per_page)
                    );
                }

                if (next.category) {
                    params.set("category", next.category);
                }

                if (next.min_price) {
                    params.set(
                        "min_price",
                        String(next.min_price)
                    );
                }

                if (next.max_price) {
                    params.set(
                        "max_price",
                        String(next.max_price)
                    );
                }

                if (next.in_stock) {
                    params.set("in_stock", "1");
                }

                (next.brands || []).forEach((brandId) => {
                    params.append("brands[]", String(brandId));
                });

                (next.flags || []).forEach((flagId) => {
                    params.append("flags[]", String(flagId));
                });

                Object.entries(
                    next.attributes || {}
                ).forEach(
                    ([attributeId, valueIds]) => {
                        (valueIds || []).forEach((valueId) => {
                            params.append(
                                `attributes[${attributeId}][]`,
                                String(valueId)
                            );
                        });
                    }
                );

                setSearchParams(params, {
                    replace: true,
                });

            },
            [setSearchParams]
        );


    const patchSelected =
        useCallback(
            (patch) => {

                updateUrl({
                    ...selected,
                    ...patch,
                    page: 1,
                });

            },
            [selected, updateUrl]
        );


    useEffect(() => {

        let active = true;

        setLoading(true);
        setError("");


        storefrontService
            .products(selected)
            .then((response) => {

                if (!active) {
                    return;
                }

                setProducts(
                    response.data || []
                );

                setFilterOptions(
                    response.filters
                    || defaultFilterOptions
                );

                setMeta(
                    response.meta
                    || {
                        current_page: 1,
                        last_page: 1,
                        total: 0,
                    }
                );

            })
            .catch((exception) => {

                if (!active) {
                    return;
                }

                setError(
                    exception.message
                );

            })
            .finally(() => {

                if (active) {
                    setLoading(false);
                }

            });


        return () => {

            active = false;

        };

    }, [selected]);


    useEffect(() => {

        setSearchDraft(selected.q);

    }, [selected.q]);


    const buyNow = (
        product
    ) => {

        if (!product.in_stock) {
            return;
        }


        const params =
            new URLSearchParams();


        params.set(
            "product",
            product.id
        );


        if (
            product.default_variant_id
        ) {

            params.set(
                "variant",
                product.default_variant_id
            );

        }


        navigate(
            "/checkout?"
            + params.toString()
        );

    };


    const toggleBrand = (brandId) => {

        const brands = selected.brands.includes(brandId)
            ? selected.brands.filter((id) => id !== brandId)
            : [...selected.brands, brandId];

        patchSelected({ brands });

    };


    const toggleFlag = (flagId) => {

        const flags = selected.flags.includes(flagId)
            ? selected.flags.filter((id) => id !== flagId)
            : [...selected.flags, flagId];

        patchSelected({ flags });

    };


    const toggleCategory = (slug) => {

        patchSelected({
            category:
                selected.category === slug
                    ? ""
                    : slug,
        });

    };


    const toggleAttribute = (
        attributeId,
        valueId
    ) => {

        const current =
            selected.attributes[attributeId]
            || [];

        const nextValues =
            current.includes(valueId)
                ? current.filter((id) => id !== valueId)
                : [...current, valueId];

        patchSelected({
            attributes: {
                ...selected.attributes,
                [attributeId]: nextValues,
            },
        });

    };


    const handlePriceChange = (
        key,
        value
    ) => {

        patchSelected({
            [key]: value,
        });

    };


    const clearFilters = () => {

        setSearchDraft("");
        updateUrl({
            q: "",
            sort: "best_match",
            page: 1,
            per_page: SHOP_PAGE_SIZE,
            min_price: "",
            max_price: "",
            category: "",
            brands: [],
            flags: [],
            attributes: {},
            in_stock: false,
        });

    };


    const submitSearch = (
        event
    ) => {

        event.preventDefault();

        patchSelected({
            q: searchDraft.trim(),
        });

    };


    const activeChips =
        useMemo(() => {

            const chips = [];

            if (selected.q) {
                chips.push({
                    key: "q",
                    label: `"${selected.q}"`,
                });
            }

            if (selected.category) {
                const category =
                    filterOptions.categories.find(
                        (item) =>
                            item.slug === selected.category
                    );

                chips.push({
                    key: "category",
                    label: category?.name || selected.category,
                });
            }

            if (selected.in_stock) {
                chips.push({
                    key: "in_stock",
                    label: "In stock",
                });
            }

            if (selected.min_price || selected.max_price) {
                chips.push({
                    key: "price",
                    label: `৳${selected.min_price || filterOptions.price.min} – ৳${selected.max_price || filterOptions.price.max}`,
                });
            }

            selected.brands.forEach((brandId) => {

                const brand =
                    filterOptions.brands.find(
                        (item) => item.id === brandId
                    );

                chips.push({
                    key: `brand-${brandId}`,
                    label: brand?.name || `Brand ${brandId}`,
                });

            });

            selected.flags.forEach((flagId) => {

                const flag =
                    filterOptions.flags.find(
                        (item) => item.id === flagId
                    );

                chips.push({
                    key: `flag-${flagId}`,
                    label: flag?.name || `Offer ${flagId}`,
                });

            });

            return chips;

        }, [selected, filterOptions]);


    const removeChip = (key) => {

        if (key === "q") {
            setSearchDraft("");
            patchSelected({ q: "" });
            return;
        }

        if (key === "category") {
            patchSelected({ category: "" });
            return;
        }

        if (key === "in_stock") {
            patchSelected({ in_stock: false });
            return;
        }

        if (key === "price") {
            patchSelected({
                min_price: "",
                max_price: "",
            });
            return;
        }

        if (key.startsWith("brand-")) {
            const brandId = Number(key.replace("brand-", ""));
            patchSelected({
                brands: selected.brands.filter(
                    (id) => id !== brandId
                ),
            });
        }

        if (key.startsWith("flag-")) {
            const flagId = Number(key.replace("flag-", ""));
            patchSelected({
                flags: selected.flags.filter(
                    (id) => id !== flagId
                ),
            });
        }

    };


    const sidebarProps = {
        filters: filterOptions,
        selected,
        onToggleCategory: toggleCategory,
        onToggleBrand: toggleBrand,
        onToggleFlag: toggleFlag,
        onToggleAttribute: toggleAttribute,
        onPriceChange: handlePriceChange,
        onToggleInStock: () =>
            patchSelected({
                in_stock: !selected.in_stock,
            }),
        onClear: clearFilters,
    };


    if (loading && products.length === 0) {

        return (

            <section className="fv-products-section">

                <div className="fv-shop-container">

                    <div className="fv-shop-results">

                        <ProductSkeletonGrid
                            count={SHOP_PAGE_SIZE}
                        />

                    </div>

                </div>

            </section>

        );

    }


    return (

        <section className="fv-products-section">

            <div className="fv-shop-container">


                <div className="fv-section-heading">

                    <div>

                        <span>
                            SHOP NOW
                        </span>

                        <h1>
                            Latest Products
                        </h1>

                    </div>

                </div>


                <div className="fv-shop-discovery">

                    <form
                        className="fv-shop-search-form"
                        onSubmit={submitSearch}
                    >

                        <div className="fv-shop-search-accent" />

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

                            {activeChips.map((chip) => (

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

                            ))}

                        </div>

                    )}

                </div>


                {error && (

                    <div className="fv-commerce-error">

                        {error}

                    </div>

                )}


                <div className="fv-shop-layout">


                    <div className="fv-shop-desktop-sidebar">

                        <ShopFilterSidebar
                            {...sidebarProps}
                        />

                    </div>


                    <div className="fv-shop-results">


                        <div className="fv-shop-results-head">

                            <p className="fv-shop-results-count">

                                Showing{" "}
                                <strong>
                                    {meta.total || 0}
                                </strong>{" "}
                                products

                            </p>


                            <div className="fv-shop-results-actions">

                                <button
                                    type="button"
                                    className="fv-shop-mobile-filter-btn"
                                    onClick={() =>
                                        setMobileFiltersOpen(true)
                                    }
                                >
                                    <i className="fa-solid fa-sliders" />
                                    Filters
                                </button>


                                <label className="fv-shop-sort-label">

                                    <span>Sort by</span>

                                    <select
                                        value={selected.sort}
                                        onChange={(event) =>
                                            patchSelected({
                                                sort: event.target.value,
                                            })
                                        }
                                    >
                                        {(filterOptions.sorts?.length
                                            ? filterOptions.sorts
                                            : [
                                                {
                                                    value: "best_match",
                                                    label: "Best Match",
                                                },
                                                {
                                                    value: "newest",
                                                    label: "Newest",
                                                },
                                                {
                                                    value: "popular",
                                                    label: "Most Sold",
                                                },
                                                {
                                                    value: "price_asc",
                                                    label: "Price Low to High",
                                                },
                                                {
                                                    value: "price_desc",
                                                    label: "Price High to Low",
                                                },
                                            ]
                                        ).map((option) => (

                                            <option
                                                value={option.value}
                                                key={option.value}
                                            >
                                                {option.label}
                                            </option>

                                        ))}

                                    </select>

                                </label>

                            </div>

                        </div>


                        {loading && products.length > 0 && (

                            <div className="fv-commerce-loading">

                                <i className="fa-solid fa-spinner fa-spin" />
                                Updating results…

                            </div>

                        )}


                        <div className="fv-product-grid">


                            {products.map(
                                (product) => (

                                    <article
                                        className="fv-product-card"
                                        key={
                                            product.id
                                        }
                                    >


                                        <div className="fv-product-image-area">


                                            {product.badge && (

                                                <span
                                                    className="fv-product-badge"
                                                    style={{
                                                        background:
                                                            product.badge.background
                                                            || "#FF620D",

                                                        color:
                                                            product.badge.color
                                                            || "#ffffff",
                                                    }}
                                                >

                                                    {
                                                        product.badge.name
                                                    }

                                                </span>

                                            )}


                                            {product.image ? (

                                                <img
                                                    src={
                                                        product.image
                                                    }
                                                    alt={
                                                        product.name
                                                    }
                                                    loading="lazy"
                                                />

                                            ) : (

                                                <div className="fv-product-no-image">

                                                    <i className="fa-regular fa-image" />

                                                </div>

                                            )}


                                        </div>


                                        <div className="fv-product-body">


                                            <h3>
                                                {product.name}
                                            </h3>


                                            {product.vendor && (

                                                <small className="fv-product-vendor">

                                                    {
                                                        product.vendor.name
                                                    }

                                                </small>

                                            )}


                                            <div className="fv-product-price">


                                                <strong>

                                                    {money(
                                                        product.final_price
                                                    )}

                                                </strong>


                                                {product.has_discount && (

                                                    <del>

                                                        {money(
                                                            product.regular_price
                                                        )}

                                                    </del>

                                                )}


                                            </div>


                                            <button
                                                type="button"
                                                className="fv-buy-now-btn"
                                                disabled={
                                                    !product.in_stock
                                                }
                                                onClick={() =>
                                                    buyNow(
                                                        product
                                                    )
                                                }
                                            >

                                                <i className="fa-solid fa-bag-shopping" />

                                                {product.in_stock
                                                    ? "Buy Now"
                                                    : "Out of Stock"}

                                            </button>


                                        </div>


                                    </article>

                                )
                            )}


                        </div>


                        {!error &&
                            products.length === 0 && (

                            <div className="fv-empty-products">

                                No products match your filters.
                                Try clearing some options.

                            </div>

                        )}


                        {meta.last_page > 1 && (

                            <nav
                                className="fv-shop-pagination"
                                aria-label="Shop pagination"
                            >

                                <button
                                    type="button"
                                    disabled={
                                        meta.current_page <= 1
                                    }
                                    onClick={() =>
                                        updateUrl({
                                            ...selected,
                                            page: meta.current_page - 1,
                                        })
                                    }
                                >
                                    <i className="fa-solid fa-chevron-left" />
                                </button>


                                {pageItems(
                                    meta.current_page,
                                    meta.last_page
                                ).map((item, index) =>
                                    item === "..." ? (

                                        <span key={`dots-${index}`}>
                                            •••
                                        </span>

                                    ) : (

                                        <button
                                            type="button"
                                            key={item}
                                            className={
                                                item === meta.current_page
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                updateUrl({
                                                    ...selected,
                                                    page: item,
                                                })
                                            }
                                        >
                                            {item}
                                        </button>

                                    )
                                )}


                                <button
                                    type="button"
                                    disabled={
                                        meta.current_page
                                        >= meta.last_page
                                    }
                                    onClick={() =>
                                        updateUrl({
                                            ...selected,
                                            page: meta.current_page + 1,
                                        })
                                    }
                                >
                                    <i className="fa-solid fa-chevron-right" />
                                </button>

                            </nav>

                        )}


                    </div>

                </div>


                <ShopMobileFilterDrawer
                    open={mobileFiltersOpen}
                    onClose={() =>
                        setMobileFiltersOpen(false)
                    }
                    {...sidebarProps}
                />


            </div>

        </section>

    );

}
