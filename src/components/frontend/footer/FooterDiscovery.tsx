import React, {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import footerDiscoveryService
    from "../../../services/footerDiscoveryService";

import "./FooterDiscovery.css";


export default function FooterDiscovery() {
    const [
        data,
        setData,
    ] =
        useState({
            top_categories: [],
            top_brands: [],
            best_selling_products: [],
        });

    const [
        loading,
        setLoading,
    ] =
        useState(true);


    useEffect(
        () => {
            let active =
                true;

            footerDiscoveryService
                .load()
                .then(
                    (
                        response
                    ) => {
                        if (
                            active
                        ) {
                            setData(
                                response?.data
                                ||
                                {
                                    top_categories: [],
                                    top_brands: [],
                                    best_selling_products: [],
                                }
                            );
                        }
                    }
                )
                .catch(
                    (
                        exception
                    ) => {
                        console.error(
                            "Footer discovery failed:",
                            exception
                        );
                    }
                )
                .finally(
                    () => {
                        if (
                            active
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                );

            return () => {
                active =
                    false;
            };
        },
        []
    );


    if (
        !loading
        &&
        !data.top_categories
            ?.length
        &&
        !data.top_brands
            ?.length
        &&
        !data.best_selling_products
            ?.length
    ) {
        return null;
    }


    return (
        <section className="fv-footer-discovery">

            <div className="container fv-footer-discovery-grid">


                {/* ========================================================
                    TOP CATEGORIES + BRANDS
                ======================================================== */}

                <section>

                    <h3>
                        Top Categories &amp; Brands
                    </h3>


                    {loading ? (

                        <div className="fv-footer-discovery-loading">

                            <i className="fa-solid fa-spinner fa-spin" />

                        </div>

                    ) : (

                        <>

                            {data.top_categories
                                ?.slice(
                                    0,
                                    4
                                )
                                .map(
                                    (
                                        category
                                    ) => (

                                    <div
                                        className="fv-footer-category-copy"

                                        key={
                                            category.id
                                        }
                                    >

                                        <h4>

                                            <Link
                                                to={`/category/${category.slug}`}
                                            >
                                                {
                                                    category.name
                                                }
                                            </Link>

                                        </h4>


                                        <p>
                                            {
                                                category.description
                                            }
                                        </p>

                                    </div>

                                )
                            )}


                            {data.top_brands
                                ?.length >
                                0 && (

                                <div className="fv-footer-brand-cloud">

                                    <h4>
                                        POPULAR BRANDS
                                    </h4>


                                    <p>

                                        {data.top_brands
                                            .map(
                                                (
                                                    brand,
                                                    index
                                                ) => (

                                                <React.Fragment
                                                    key={
                                                        brand.id
                                                    }
                                                >

                                                    {index >
                                                        0 && (
                                                        <>
                                                            {", "}
                                                        </>
                                                    )}


                                                    <Link
                                                        to={`/search?q=${encodeURIComponent(
                                                            brand.name
                                                        )}&brand=${encodeURIComponent(
                                                            brand.slug
                                                        )}`}
                                                    >
                                                        {
                                                            brand.name
                                                        }
                                                    </Link>

                                                </React.Fragment>

                                            )
                                        )}

                                    </p>

                                </div>

                            )}

                        </>

                    )}

                </section>


                {/* ========================================================
                    REAL BEST SELLERS
                ======================================================== */}

                <section>

                    <h4>
                        BEST-SELLING PRODUCTS
                    </h4>


                    {loading ? (

                        <div className="fv-footer-discovery-loading">

                            <i className="fa-solid fa-spinner fa-spin" />

                        </div>

                    ) : (

                        <p className="fv-footer-best-sellers">

                            {data.best_selling_products
                                ?.map(
                                    (
                                        product,
                                        index
                                    ) => (

                                    <React.Fragment
                                        key={
                                            product.id
                                        }
                                    >

                                        {index >
                                            0 && (
                                            <>
                                                {", "}
                                            </>
                                        )}


                                        <Link
                                            to={`/product/${product.slug}`}
                                        >
                                            {
                                                product.name
                                            }
                                        </Link>

                                    </React.Fragment>

                                )
                            )}

                        </p>

                    )}

                </section>

            </div>

        </section>
    );
}
