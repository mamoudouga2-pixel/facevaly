import React from "react";
import ShopFilterSidebar from "./ShopFilterSidebar";
import "./ShopFilters.css";

export default function ShopMobileFilterDrawer({
    open,
    onClose,
    ...sidebarProps
}) {
    if (!open) {
        return null;
    }

    return (
        <div
            className="fv-shop-filter-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <aside className="fv-shop-filter-drawer">
                <div className="fv-shop-filter-drawer-head">
                    <strong>Filters</strong>

                    <button
                        type="button"
                        aria-label="Close filters"
                        onClick={onClose}
                    >
                        <i className="fa-solid fa-xmark" />
                    </button>
                </div>

                <div className="fv-shop-filter-drawer-body">
                    <ShopFilterSidebar {...sidebarProps} />
                </div>

                <div className="fv-shop-filter-drawer-foot">
                    <button
                        type="button"
                        onClick={onClose}
                    >
                        Show products
                    </button>
                </div>
            </aside>
        </div>
    );
}
