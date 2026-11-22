import React from "react";
import { Link } from "react-router-dom";
import "./CategoryBreadcrumbs.css";

export default function CategoryBreadcrumbs({
    breadcrumbs = [],
}) {
    return (
        <nav
            className="fv-category-breadcrumbs"
            aria-label="Breadcrumb"
        >
            {breadcrumbs.map((crumb, index) => {
                const last =
                    index === breadcrumbs.length - 1;

                return (
                    <React.Fragment
                        key={`${crumb.slug || "home"}-${index}`}
                    >
                        {crumb.slug && !last ? (
                            <Link to={`/category/${crumb.slug}`}>
                                {crumb.name}
                            </Link>
                        ) : !crumb.slug && !last ? (
                            <Link to="/">
                                {crumb.name}
                            </Link>
                        ) : (
                            <span>{crumb.name}</span>
                        )}

                        {!last && (
                            <i className="fa-solid fa-chevron-right" />
                        )}
                    </React.Fragment>
                );
            })}

            {breadcrumbs.length > 0 && (
                <>
                    <i className="fa-solid fa-chevron-right" />
                    <span>Search Results</span>
                </>
            )}
        </nav>
    );
}
