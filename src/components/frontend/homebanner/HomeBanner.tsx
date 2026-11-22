import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import homeBannerService from "../../../services/homeBannerService";

import "./HomeBanner.css";

const DEFAULT_SETTINGS = {
    autoplay_ms: 4500,
    pause_on_hover: true,
    show_right_panel: true,
    app_title: "Download the App",
    rating_text: "4.8 Rated",
    promo_heading: "Download App",
    benefit_one_text: "Free Delivery",
    benefit_two_text: "Limited Time",
    app_icon: null,
    qr_image: null,
    app_store_url: null,
    play_store_url: null,
    footer_text: "Download the App Now!",
};

export default function HomeBanner({
    prefetched = null,
    skipFetch = false,
}) {
    const [slides, setSlides] = useState([]);
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(!(skipFetch && prefetched));
    const [paused, setPaused] = useState(false);
    const [animating, setAnimating] = useState(false);
    const touchStartX = useRef(null);
    const trackRef = useRef(null);

    useEffect(() => {
        if (skipFetch) {
            if (prefetched) {
                setSlides(prefetched?.slides || []);
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...(prefetched?.settings || {}),
                });
                setLoading(false);
            }

            return undefined;
        }

        let active = true;

        homeBannerService
            .show()
            .then((response) => {
                if (!active) return;

                setSlides(response?.data?.slides || []);
                setSettings({
                    ...DEFAULT_SETTINGS,
                    ...(response?.data?.settings || {}),
                });
            })
            .catch((exception) => {
                console.error("Home banner error:", exception);
                if (active) setSlides([]);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [prefetched, skipFetch]);

    useEffect(() => {
        if (activeIndex >= slides.length) {
            setActiveIndex(0);
        }
    }, [slides.length, activeIndex]);

    const goTo = useCallback(
        (nextIndex) => {
            if (!slides.length) return;

            const normalized =
                ((nextIndex % slides.length) + slides.length) % slides.length;

            if (normalized === activeIndex) return;

            setAnimating(true);
            setActiveIndex(normalized);
        },
        [activeIndex, slides.length]
    );

    const goNext = useCallback(() => {
        goTo(activeIndex + 1);
    }, [activeIndex, goTo]);

    const goPrev = useCallback(() => {
        goTo(activeIndex - 1);
    }, [activeIndex, goTo]);

    useEffect(() => {
        if (slides.length <= 1 || paused) return undefined;

        const delay = Math.max(2000, Number(settings.autoplay_ms || 4500));

        const timer = window.setInterval(() => {
            if (document.hidden) return;
            setActiveIndex((current) => (current + 1) % slides.length);
            setAnimating(true);
        }, delay);

        return () => {
            window.clearInterval(timer);
        };
    }, [slides.length, paused, settings.autoplay_ms]);

    useEffect(() => {
        if (!animating) return undefined;

        const timer = window.setTimeout(() => {
            setAnimating(false);
        }, 750);

        return () => {
            window.clearTimeout(timer);
        };
    }, [activeIndex, animating]);

    const onTouchStart = (event) => {
        touchStartX.current = event.touches?.[0]?.clientX ?? null;
    };

    const onTouchEnd = (event) => {
        if (touchStartX.current === null || slides.length <= 1) return;

        const endX =
            event.changedTouches?.[0]?.clientX ?? touchStartX.current;
        const diff = endX - touchStartX.current;
        touchStartX.current = null;

        if (Math.abs(diff) < 40) return;

        if (diff < 0) {
            goNext();
            return;
        }

        goPrev();
    };

    if (loading) {
        return (
            <section className="fv-home-banner">
                <div className="fv-home-banner-container">
                    <div className="fv-home-banner-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Loading banner...
                    </div>
                </div>
            </section>
        );
    }

    if (!slides.length) {
        return null;
    }

    return (
        <section className="fv-home-banner">
            <div className="fv-home-banner-container">
                <div
                    className="fv-home-banner-layout"
                    onMouseEnter={() => {
                        if (settings.pause_on_hover) setPaused(true);
                    }}
                    onMouseLeave={() => setPaused(false)}
                >
                    <div
                        className={`fv-home-banner-slider ${animating ? "is-animating" : ""}`}
                        onTouchStart={onTouchStart}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            ref={trackRef}
                            className="fv-home-banner-track"
                            style={{
                                transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
                            }}
                        >
                            {slides.map((slide, index) => {
                                const image = (
                                    <picture>
                                        {slide.mobile_image ? (
                                            <source
                                                media="(max-width: 767px)"
                                                srcSet={slide.mobile_image}
                                            />
                                        ) : null}

                                        <img
                                            src={slide.image}
                                            alt=""
                                            draggable="false"
                                            loading={index === 0 ? "eager" : "lazy"}
                                        />
                                    </picture>
                                );

                                if (slide.link_url) {
                                    return (
                                        <a
                                            key={slide.id}
                                            className="fv-home-banner-slide"
                                            href={slide.link_url}
                                            target={slide.link_target || "_self"}
                                            rel={
                                                slide.link_target === "_blank"
                                                    ? "noopener noreferrer"
                                                    : undefined
                                            }
                                            aria-hidden={index !== activeIndex}
                                            tabIndex={index === activeIndex ? 0 : -1}
                                        >
                                            {image}
                                        </a>
                                    );
                                }

                                return (
                                    <div
                                        key={slide.id}
                                        className="fv-home-banner-slide"
                                        aria-hidden={index !== activeIndex}
                                    >
                                        {image}
                                    </div>
                                );
                            })}
                        </div>

                        {slides.length > 1 ? (
                            <div
                                className="fv-home-banner-dots"
                                aria-label="Banner slides"
                            >
                                {slides.map((slide, index) => (
                                    <button
                                        type="button"
                                        className={
                                            index === activeIndex ? "active" : ""
                                        }
                                        aria-label={`Show banner ${index + 1}`}
                                        aria-current={
                                            index === activeIndex
                                                ? "true"
                                                : undefined
                                        }
                                        onClick={() => goTo(index)}
                                        key={slide.id}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}
