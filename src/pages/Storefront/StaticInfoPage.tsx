import React from "react";

import "./static-info-pages.css";

export default function StaticInfoPage({
    eyebrow,
    icon = "fa-solid fa-circle-info",
    title,
    intro,
    updated = "August 2026",
    highlights = [],
    sections = [],
    steps = [],
}) {
    return (
        <article className="fv-static-page">
            <div className="fv-static-shell">
                <header className="fv-static-hero">
                    <p className="fv-static-eyebrow">
                        <i className={icon} aria-hidden="true" />
                        {eyebrow}
                    </p>

                    <h1 className="fv-static-title">{title}</h1>

                    {intro ? (
                        <p className="fv-static-intro">{intro}</p>
                    ) : null}

                    <p className="fv-static-meta">Last updated: {updated}</p>

                    {highlights.length > 0 ? (
                        <div className="fv-static-highlights">
                            {highlights.map((item) => (
                                <div className="fv-static-highlight" key={item.title}>
                                    <i className={item.icon} aria-hidden="true" />
                                    <strong>{item.title}</strong>
                                    <span>{item.text}</span>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </header>

                <div className="fv-static-body">
                    {sections.map((section) => (
                        <section
                            key={section.title}
                            className="fv-static-section"
                        >
                            <h2>{section.title}</h2>

                            {section.body?.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                            ))}

                            {section.list ? (
                                <ul>
                                    {section.list.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            ) : null}

                            {section.ordered ? (
                                <ol>
                                    {section.ordered.map((item) => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ol>
                            ) : null}
                        </section>
                    ))}

                    {steps.length > 0 ? (
                        <section className="fv-static-section">
                            <h2>At a glance</h2>
                            <div className="fv-static-steps">
                                {steps.map((step, index) => (
                                    <div className="fv-static-step" key={step}>
                                        <span className="fv-static-step-num">
                                            {index + 1}
                                        </span>
                                        <p>{step}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
