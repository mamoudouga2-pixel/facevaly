import React from "react";
import "./styles/SectionHeader.css";

export default function SectionHeader({
    title,
    subtitle,
    actionLabel,
    actionHref = "#",
    className = "",
    right,
}) {
    return (
        <div className={`section-head ${className}`.trim()}>
            <div>
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
            </div>

            {right || (actionLabel ? <a href={actionHref}>{actionLabel}</a> : null)}
        </div>
    );
}
