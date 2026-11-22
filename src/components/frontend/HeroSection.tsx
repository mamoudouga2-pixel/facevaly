import React, { useEffect, useState } from "react";
import "./styles/HeroSection.css";

/*
 * Hero CSS and slider behavior are present in the source file although the
 * supplied body does not render a hero. This component preserves that code
 * without changing the currently rendered layout.
 */
export default function HeroSection({ categories = [], slides = [] }) {
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (!slides.length) return undefined;

        const timer = window.setInterval(() => {
            setActive((current) => (current + 1) % slides.length);
        }, 4500);

        return () => window.clearInterval(timer);
    }, [slides.length]);

    if (!slides.length && !categories.length) {
        return null;
    }

    return (
        <section className="hero">
            <div className="container hero-inner">
                <nav className="category-menu">
                    {categories.map((category, index) => (
                        <a href={category.href || "#"} key={`${category.label}-${index}`}>
                            {category.label}
                        </a>
                    ))}
                </nav>

                <div className="hero-slider">
                    {slides.map((slide, index) => (
                        <article
                            className={`hero-slide${index === active ? " is-active" : ""}`}
                            key={`${slide.title}-${index}`}
                        >
                            <div>
                                {slide.eyebrow && <span className="eyebrow">{slide.eyebrow}</span>}
                                <h1>{slide.title}</h1>
                                {slide.description && <p>{slide.description}</p>}
                                {slide.cta && (
                                    <a className="hero-cta" href={slide.href || "#"}>
                                        {slide.cta}
                                    </a>
                                )}
                            </div>

                            <div className={`hero-art ${slide.artClass || ""}`}>
                                {slide.image && <img src={slide.image} alt={slide.imageAlt || slide.title} />}
                            </div>
                        </article>
                    ))}

                    <div className="slider-dots">
                        {slides.map((_, index) => (
                            <button
                                type="button"
                                aria-label={`Slide ${index + 1}`}
                                className={index === active ? "is-active" : ""}
                                onClick={() => setActive(index)}
                                key={index}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
