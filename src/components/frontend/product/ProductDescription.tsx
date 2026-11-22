import React, { useState } from "react";
import { sanitizeEmbed, sanitizeRichText } from "../../../utils/sanitizeHtml";
import "./ProductDescription.css";

export default function ProductDescription({ product }) {
    const [expanded, setExpanded] = useState(false);

    const hasDescription =
        product.short_description ||
        product.long_description ||
        product.video_embed;

    if (!hasDescription) {
        return null;
    }

    const video = product.video_embed ? (
        <div
            className="fv-product-video"
            dangerouslySetInnerHTML={{
                __html: sanitizeEmbed(product.video_embed),
            }}
        />
    ) : null;

    return (
        <section className="fv-product-details-section">
            <h2>Product details of {product.name}</h2>

            <div
                className={
                    expanded
                        ? "fv-product-description expanded"
                        : "fv-product-description"
                }
            >
                {product.video_position === "before_description" && video}

                {product.short_description && (
                    <div
                        className="fv-rich-text"
                        dangerouslySetInnerHTML={{
                            __html: sanitizeRichText(
                                product.short_description
                            ),
                        }}
                    />
                )}

                {product.video_position === "after_images" && video}

                {product.long_description && (
                    <div
                        className="fv-rich-text"
                        dangerouslySetInnerHTML={{
                            __html: sanitizeRichText(
                                product.long_description
                            ),
                        }}
                    />
                )}

                {(!product.video_position ||
                    product.video_position === "after_description") &&
                    video}
            </div>

            <button
                type="button"
                className="fv-view-more-description"
                onClick={() => setExpanded((current) => !current)}
            >
                {expanded ? "VIEW LESS" : "VIEW MORE"}
            </button>
        </section>
    );
}
