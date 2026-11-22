import React from "react";
import CategorySidebar from "./CategorySidebar";
import "./MobileFilterDrawer.css";

export default function MobileFilterDrawer({
    open,
    onClose,
    ...sidebarProps
}) {
    if (!open) return null;

    return (
        <div
            className="fv-mobile-filter-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <aside className="fv-mobile-filter-drawer">
                <div className="fv-mobile-filter-head">
                    <strong>Filters</strong>

                    <button
                        type="button"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="fv-mobile-filter-body">
                    <CategorySidebar {...sidebarProps} />
                </div>

                <div className="fv-mobile-filter-foot">
                    <button
                        type="button"
                        onClick={onClose}
                    >
                        Show Products
                    </button>
                </div>
            </aside>
        </div>
    );
}
