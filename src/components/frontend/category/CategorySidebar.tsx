import React from "react";
import { Link } from "react-router-dom";
import "./CategorySidebar.css";

function Checkbox({
    checked,
    label,
    onChange,
}) {
    return (
        <label className="fv-filter-checkbox">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
            />

            <span>{label}</span>
        </label>
    );
}

export default function CategorySidebar({
    category,
    relatedCategories = [],
    filters,
    selected,
    onToggleBrand,
    onToggleFlag,
    onToggleAttribute,
    onPriceChange,
    onClear,
}) {
    return (
        <aside className="fv-category-sidebar">
            <section className="fv-sidebar-category-section">
                <h3>Category</h3>

                {relatedCategories
                    .slice(0, 8)
                    .map((item) => (
                        <Link
                            to={`/category/${item.slug}`}
                            key={item.id}
                        >
                            {item.name}
                        </Link>
                    ))}

                {relatedCategories.length > 8 && (
                    <button type="button">
                        VIEW MORE
                    </button>
                )}
            </section>

            <section className="fv-sidebar-filter-section">
                <h3>PRICE RANGE</h3>

                <div className="fv-price-values">
                    <span>
                        ৳{selected.min_price}
                    </span>

                    <span>
                        ৳{selected.max_price}
                    </span>
                </div>

                <div className="fv-price-inputs">
                    <input
                        type="number"
                        min={filters.price?.min || 0}
                        max={selected.max_price}
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
                        min={selected.min_price}
                        max={filters.price?.max || 0}
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

            {filters.brands?.length > 0 && (
                <section className="fv-sidebar-filter-section">
                    <h3>BRANDS</h3>

                    {filters.brands.map((brand) => (
                        <Checkbox
                            key={brand.id}
                            checked={selected.brands.includes(
                                brand.id
                            )}
                            label={brand.name}
                            onChange={() =>
                                onToggleBrand(brand.id)
                            }
                        />
                    ))}
                </section>
            )}

            {filters.flags?.length > 0 && (
                <section className="fv-sidebar-filter-section">
                    <h3>PRODUCT FLAG</h3>

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
                        className="fv-sidebar-filter-section"
                        key={attribute.id}
                    >
                        <h3>
                            {attribute.name.toUpperCase()}
                        </h3>

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

            <button
                type="button"
                className="fv-clear-filter-btn"
                onClick={onClear}
            >
                Clear All Filters
            </button>
        </aside>
    );
}
