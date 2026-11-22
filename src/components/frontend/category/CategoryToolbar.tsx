import React from "react";
import "./CategoryToolbar.css";

export default function CategoryToolbar({
    category,
    total,
    sort,
    sortOptions = [],
    view,
    onSort,
    onView,
    onOpenFilters,
}) {
    return (
        <div className="fv-category-toolbar">
            <div className="fv-category-toolbar-title">
                <h1>{category?.name || "Products"}</h1>

                <p>
                    Showing results for{" "}
                    {category?.name?.toLowerCase() ||
                        "products"}
                    {total !== undefined
                        ? ` · ${total} products`
                        : ""}
                </p>
            </div>

            <div className="fv-category-toolbar-actions">
                <button
                    type="button"
                    className="fv-mobile-filter-btn"
                    onClick={onOpenFilters}
                >
                    <i className="fa-solid fa-filter" />
                    Filters
                </button>

                <label>
                    <span>Sort By:</span>

                    <select
                        value={sort}
                        onChange={(event) =>
                            onSort(event.target.value)
                        }
                    >
                        {sortOptions.map((option) => (
                            <option
                                value={option.value}
                                key={option.value}
                            >
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="fv-view-selector">
                    <span>View:</span>

                    <button
                        type="button"
                        className={
                            view === "grid"
                                ? "active"
                                : ""
                        }
                        onClick={() => onView("grid")}
                    >
                        <i className="fa-solid fa-grip" />
                    </button>

                    <button
                        type="button"
                        className={
                            view === "list"
                                ? "active"
                                : ""
                        }
                        onClick={() => onView("list")}
                    >
                        <i className="fa-solid fa-list" />
                    </button>
                </div>
            </div>
        </div>
    );
}
