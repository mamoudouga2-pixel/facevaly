import React from "react";
import "./styles/MobileMenuGrid.css";

/*
 * The original HTML ships all styles for this block but does not render its
 * markup in the page body. The component is kept here so no functionality/style
 * from the source is discarded. Render it only where your original page needs it.
 */
export default function MobileMenuGrid({ items = [] }) {
    return (
        <nav className="mobile-menu-grid" aria-label="Quick menu">
            {items.map((item, index) => (
                <a href={item.href || "#"} key={`${item.label}-${index}`}>
                    <span className={`menu-icon ${item.color || "orange"}`}>
                        {item.iconClass ? <i className={item.iconClass} /> : item.icon}
                    </span>
                    <small>{item.label}</small>
                </a>
            ))}
        </nav>
    );
}
