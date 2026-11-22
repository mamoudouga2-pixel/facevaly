import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import categoryStorefrontService from "../../../services/categoryStorefrontService";
import "./CategoryMenuDropdown.css";

export default function CategoryMenuDropdown() {
    const [open, setOpen] = useState(false);
    const [tree, setTree] = useState([]);
    const ref = useRef(null);

    useEffect(() => {
        if (!open || tree.length > 0) {
            return;
        }

        let active = true;

        categoryStorefrontService
            .tree()
            .then((response) => {
                if (active) {
                    setTree(response.data || []);
                }
            })
            .catch(() => {
                if (active) {
                    setTree([]);
                }
            });

        return () => {
            active = false;
        };
    }, [open, tree.length]);

    useEffect(() => {
        const close = (event) => {
            if (
                ref.current &&
                !ref.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", close);

        return () => {
            document.removeEventListener("mousedown", close);
        };
    }, []);

    return (
        <div
            className="fv-category-menu-dropdown"
            ref={ref}
        >
            <button
                type="button"
                className={
                    open
                        ? "fv-category-menu-trigger open"
                        : "fv-category-menu-trigger"
                }
                onClick={() => setOpen((current) => !current)}
            >
                Categories
                <i className="fa-solid fa-chevron-down" />
            </button>

            {open && (
                <div className="fv-category-menu-panel">
                    {tree.map((category) => (
                        <div
                            className="fv-category-menu-parent"
                            key={category.id}
                        >
                            <Link
                                to={`/category/${category.slug}`}
                                onClick={() => setOpen(false)}
                            >
                                {category.name}

                                {category.children?.length > 0 && (
                                    <i className="fa-solid fa-chevron-right" />
                                )}
                            </Link>

                            {category.children?.length > 0 && (
                                <div className="fv-category-menu-children">
                                    {category.children.map((child) => (
                                        <Link
                                            to={`/category/${child.slug}`}
                                            onClick={() => setOpen(false)}
                                            key={child.id}
                                        >
                                            {child.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
