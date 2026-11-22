import React from "react";
import "./styles/QuickActions.css";

export default function QuickActions({ items = [] }) {
    if (!items.length) return null;

    return (
        <div className="container quick-actions">
            {items.map((item, index) => (
                <a className="quick-card" href={item.href || "#"} key={`${item.title}-${index}`}>
                    <span>
                        {item.iconClass ? <i className={item.iconClass} /> : item.icon}
                    </span>
                    <strong>{item.title}</strong>
                    {item.subtitle && <small>{item.subtitle}</small>}
                </a>
            ))}
        </div>
    );
}
