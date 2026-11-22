import React from "react";

import {
    Link,
} from "react-router-dom";

import "./policy-pages.css";


export default function PolicyPage({
    eyebrow,
    title,
    intro,
    updated = "August 2026",
    sections = [],
    relatedLinks = [],
}) {
    return (
        <article className="fv-policy">
            <p className="fv-policy__eyebrow">
                {eyebrow}
            </p>

            <h1 className="fv-policy__title">
                {title}
            </h1>

            {intro && (
                <p className="fv-policy__intro">
                    {intro}
                </p>
            )}

            <p className="fv-policy__updated">
                Last updated: {updated}
            </p>

            {sections.map((section) => (
                <section
                    key={section.title}
                    className="fv-policy__section"
                >
                    <h2>
                        {section.title}
                    </h2>

                    {section.body?.map((paragraph) => (
                        <p key={paragraph}>
                            {paragraph}
                        </p>
                    ))}

                    {section.list && (
                        <ul>
                            {section.list.map((item) => (
                                <li key={item}>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    )}

                    {section.ordered && (
                        <ol>
                            {section.ordered.map((item) => (
                                <li key={item}>
                                    {item}
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            ))}

            {relatedLinks.length > 0 && (
                <div className="fv-policy__links">
                    {relatedLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={
                                link.primary
                                    ? "fv-policy__link fv-policy__link--primary"
                                    : "fv-policy__link"
                            }
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </article>
    );
}
