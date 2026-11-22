import React from "react";
import { Link } from "react-router-dom";
import "./ProductBreadcrumbs.css";

export default function ProductBreadcrumbs({ breadcrumbs = [] }) {
    return (
        <nav className="fv-product-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => {
                const last = index === breadcrumbs.length - 1;

                return (
                    <React.Fragment key={`${crumb.slug || "home"}-${index}`}>
                        {last ? (
                            <span>{crumb.name}</span>
                        ) : crumb.slug ? (
                            <Link to={`/category/${crumb.slug}`}>{crumb.name}</Link>
                        ) : (
                            <Link to="/">{crumb.name}</Link>
                        )}

                        {!last && <i className="fa-solid fa-chevron-right" />}
                    </React.Fragment>
                );
            })}
        </nav>
    );
}
