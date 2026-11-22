import React from "react";
import "./ShopFilters.css";

function Checkbox({
    checked,
    label,
    count,
    onChange,
}) {
    return (
        <label className="fv-shop-filter-check">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
            />

            <span className="fv-shop-filter-check-label">
                {label}

                {count !== undefined && (
                    <em>({count})</em>
                )}
            </span>
        </label>
    );
}

export default function ShopFilterSidebar({
    filters,
    selected,
    onToggleCategory,
    onToggleBrand,
    onToggleFlag,
    onToggleAttribute,
    onPriceChange,
    onToggleInStock,
    onClear,
}) {
    const priceMin = filters.price?.min ?? 0;
    const priceMax = filters.price?.max ?? 0;

    return (
        <aside className="fv-shop-filter-sidebar">
            <div className="fv-shop-filter-head">
                <h2>Refine results</h2>

                <button
                    type="button"
                    className="fv-shop-filter-clear"
                    onClick={onClear}
                >
                    Clear all
                </button>
            </div>

            <section className="fv-shop-filter-block">
                <h3>Availability</h3>

                <Checkbox
                    checked={selected.in_stock}
                    label="In stock only"
                    onChange={onToggleInStock}
                />
            </section>

            <section className="fv-shop-filter-block">
                <h3>Price range</h3>

                <div className="fv-shop-price-range">
                    <span>৳{selected.min_price || priceMin}</span>
                    <span className="fv-shop-price-dash" />
                    <span>৳{selected.max_price || priceMax}</span>
                </div>

                <div className="fv-shop-price-fields">
                    <input
                        type="number"
                        min={priceMin}
                        max={selected.max_price || priceMax}
                        placeholder="Min"
                        value={selected.min_price}
                        onChange={(event) =>
                            onPriceChange(
                                "min_price",
                                event.target.value
                            )
                        }
                    />

                    <input
                        type="number"
                        min={selected.min_price || priceMin}
                        max={priceMax}
                        placeholder="Max"
                        value={selected.max_price}
                        onChange={(event) =>
                            onPriceChange(
                                "max_price",
                                event.target.value
                            )
                        }
                    />
                </div>
            </section>

            {filters.categories?.length > 0 && (
                <section className="fv-shop-filter-block">
                    <h3>Category</h3>

                    {filters.categories.map((category) => (
                        <Checkbox
                            key={category.id}
                            checked={
                                selected.category === category.slug
                            }
                            label={category.name}
                            count={category.count}
                            onChange={() =>
                                onToggleCategory(category.slug)
                            }
                        />
                    ))}
                </section>
            )}

            {filters.brands?.length > 0 && (
                <section className="fv-shop-filter-block">
                    <h3>Brand</h3>

                    {filters.brands.map((brand) => (
                        <Checkbox
                            key={brand.id}
                            checked={selected.brands.includes(
                                brand.id
                            )}
                            label={brand.name}
                            count={brand.count}
                            onChange={() =>
                                onToggleBrand(brand.id)
                            }
                        />
                    ))}
                </section>
            )}

            {filters.flags?.length > 0 && (
                <section className="fv-shop-filter-block">
                    <h3>Offers</h3>

                    {filters.flags.map((flag) => (
                        <Checkbox
                            key={flag.id}
                            checked={selected.flags.includes(
                                flag.id
                            )}
                            label={flag.name}
                            onChange={() =>
                                onToggleFlag(flag.id)
                            }
                        />
                    ))}
                </section>
            )}

            {(filters.attributes || []).map(
                (attribute) => (
                    <section
                        className="fv-shop-filter-block"
                        key={attribute.id}
                    >
                        <h3>{attribute.name}</h3>

                        {attribute.values.map((value) => (
                            <Checkbox
                                key={value.id}
                                checked={(
                                    selected.attributes[
                                        attribute.id
                                    ] || []
                                ).includes(value.id)}
                                label={value.value}
                                onChange={() =>
                                    onToggleAttribute(
                                        attribute.id,
                                        value.id
                                    )
                                }
                            />
                        ))}
                    </section>
                )
            )}
        </aside>
    );
}
