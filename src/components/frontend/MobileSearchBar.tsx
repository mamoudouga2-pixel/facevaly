import React from "react";

import DynamicSearchBox
    from "./search/DynamicSearchBox";

import "./styles/MobileSearchBar.css";


export default function MobileSearchBar({
    isStuck = false,
    onSearch,
}) {
    return (
        <section
            className={
                `mobile-search-wrap${isStuck ? " is-stuck" : ""}`
            }

            id="mobileSearchWrap"
        >

            <DynamicSearchBox
                variant="mobile"
                placeholder="Search products, categories and brands"
                onSearch={
                    onSearch
                }
            />

        </section>
    );
}
