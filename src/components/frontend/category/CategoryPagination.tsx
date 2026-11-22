import React from "react";
import "./CategoryPagination.css";

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

export default function CategoryPagination({
    meta,
    onPage,
}) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }

    return (
        <nav className="fv-category-pagination">
            <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() =>
                    onPage(meta.current_page - 1)
                }
            >
                <i className="fa-solid fa-chevron-left" />
            </button>

            {pageItems(
                meta.current_page,
                meta.last_page
            ).map((item, index) =>
                item === "..." ? (
                    <span key={`dots-${index}`}>•••</span>
                ) : (
                    <button
                        type="button"
                        key={item}
                        className={
                            item === meta.current_page
                                ? "active"
                                : ""
                        }
                        onClick={() => onPage(item)}
                    >
                        {item}
                    </button>
                )
            )}

            <button
                type="button"
                disabled={
                    meta.current_page >= meta.last_page
                }
                onClick={() =>
                    onPage(meta.current_page + 1)
                }
            >
                <i className="fa-solid fa-chevron-right" />
            </button>
        </nav>
    );
}
