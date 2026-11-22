import React, { useState } from "react";
import "./styles/MobileTabStrip.css";

export default function MobileTabStrip({ items = [] }) {
    const [active, setActive] = useState(0);

    if (!items.length) return null;

    return (
        <div className="mobile-tab-strip">
            {items.map((item, index) => (
                <button
                    type="button"
                    className={index === active ? "active" : ""}
                    onClick={() => setActive(index)}
                    key={`${item.label}-${index}`}
                >
                    <span>{item.iconClass ? <i className={item.iconClass} /> : item.icon}</span>
                    <small>{item.label}</small>
                </button>
            ))}
        </div>
    );
}
