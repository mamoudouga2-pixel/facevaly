import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import justForYouService from "../../../services/justForYouService";
import JustForYouProductCard from "./JustForYouProductCard";
import "./JustForYouSection.css";

export default function JustForYouSection({
    perPage = 18,
    prefetchedPage = null,
    skipFetch = false,
}) {
    const [products, setProducts] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 0,
        last_page: 1,
        total: 0,
        has_more: true,
        next_page: 1,
    });
    const [loading, setLoading] = useState(!(skipFetch && prefetchedPage));
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const mounted = useRef(true);
    const loadingMoreRef = useRef(false);
    const metaRef = useRef(meta);
    const sentinelRef = useRef(null);
    const prefetchRef = useRef(null);

    useEffect(() => {
        metaRef.current = meta;
    }, [meta]);

    const mergeRows = (current, rows, replace) => {
        if (replace) {
            return rows;
        }

        const map = new Map();

        [...current, ...rows].forEach((product) => {
            map.set(Number(product.id), product);
        });

        return Array.from(map.values());
    };

    const applyPage = useCallback((response, replace) => {
        const rows = response?.data || [];

        setProducts((current) => mergeRows(current, rows, replace));

        setMeta(
            response?.meta || {
                current_page: 1,
                last_page: 1,
                total: rows.length,
                has_more: false,
                next_page: null,
            }
        );
    }, []);

    const prefetchNext = useCallback(async (nextPage) => {
        if (!nextPage || prefetchRef.current?.page === nextPage) {
            return;
        }

        try {
            const response = await justForYouService.products({
                page: nextPage,
                per_page: perPage,
            });

            if (!mounted.current) {
                return;
            }

            prefetchRef.current = {
                page: nextPage,
                response,
            };
        } catch {
            // Prefetch failures are silent; scroll will retry via loadPage.
        }
    }, [perPage]);

    const loadPage = useCallback(async (page, replace = false) => {
        if (!replace && loadingMoreRef.current) {
            return;
        }

        const buffered =
            !replace
            && prefetchRef.current?.page === page
                ? prefetchRef.current.response
                : null;

        if (buffered) {
            prefetchRef.current = null;
            applyPage(buffered, false);

            const next = buffered?.meta?.next_page;
            if (next) {
                prefetchNext(next);
            }

            return;
        }

        try {
            if (replace) {
                setLoading(true);
            } else {
                loadingMoreRef.current = true;
                setLoadingMore(true);
            }

            setError("");

            const response = await justForYouService.products({
                page,
                per_page: perPage,
            });

            if (!mounted.current) {
                return;
            }

            applyPage(response, replace);

            const next = response?.meta?.next_page;
            if (next) {
                prefetchNext(next);
            }
        } catch (exception) {
            if (mounted.current) {
                setError(
                    exception?.message || "Products could not be loaded."
                );
            }
        } finally {
            if (mounted.current) {
                setLoading(false);
                loadingMoreRef.current = false;
                setLoadingMore(false);
            }
        }
    }, [applyPage, perPage, prefetchNext]);

    useEffect(() => {
        mounted.current = true;
        prefetchRef.current = null;

        if (skipFetch) {
            if (prefetchedPage) {
                applyPage(prefetchedPage, true);
                setLoading(false);
                setError("");

                const next = prefetchedPage?.meta?.next_page;
                if (next) {
                    prefetchNext(next);
                }
            }

            return () => {
                mounted.current = false;
            };
        }

        loadPage(1, true);

        return () => {
            mounted.current = false;
        };
    }, [perPage, skipFetch, prefetchedPage, loadPage, applyPage, prefetchNext]);

    useEffect(() => {
        const node = sentinelRef.current;

        if (!node || !meta.has_more || loading) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];

                if (!entry?.isIntersecting) {
                    return;
                }

                const current = metaRef.current;

                if (loadingMoreRef.current || !current.has_more) {
                    return;
                }

                const nextPage =
                    current.next_page || current.current_page + 1;

                loadPage(nextPage, false);
            },
            {
                root: null,
                rootMargin: "600px 0px",
                threshold: 0,
            }
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [meta.has_more, loading, loadPage, products.length]);

    if (loading) {
        return (
            <section className="fv-jfy-section">
                <div className="fv-jfy-container">
                    <h2>Just For You</h2>
                    <div className="fv-jfy-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Loading products...
                    </div>
                </div>
            </section>
        );
    }

    if (error && products.length === 0) {
        return (
            <section className="fv-jfy-section">
                <div className="fv-jfy-container">
                    <h2>Just For You</h2>
                    <div className="fv-jfy-error">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error}
                        <button
                            type="button"
                            onClick={() => loadPage(1, true)}
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="fv-jfy-section">
            <div className="fv-jfy-container">
                <h2>Just For You</h2>

                <div className="fv-jfy-grid">
                    {products.map((product) => (
                        <JustForYouProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </div>

                {error ? (
                    <div className="fv-jfy-load-more-error">
                        {error}
                        <button
                            type="button"
                            className="fv-jfy-retry-inline"
                            onClick={() => {
                                const current = metaRef.current;
                                const nextPage =
                                    current.next_page
                                    || current.current_page + 1;
                                loadPage(nextPage, false);
                            }}
                        >
                            Retry
                        </button>
                    </div>
                ) : null}

                {meta.has_more ? (
                    <div
                        ref={sentinelRef}
                        className="fv-jfy-infinite-sentinel"
                        aria-hidden="true"
                    >
                        {loadingMore ? (
                            <div className="fv-jfy-infinite-loading">
                                <i className="fa-solid fa-spinner fa-spin" />
                                Loading more...
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </section>
    );
}
