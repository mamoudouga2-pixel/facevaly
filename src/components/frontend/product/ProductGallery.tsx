import React, { useEffect, useMemo, useState } from "react";
import "./ProductGallery.css";

export default function ProductGallery({
    images = [],
    variantImage = null,
    productName = "Product",
}) {
    const displayImages = useMemo(() => {
        const rows = [...images];

        if (
            variantImage &&
            !rows.some((image) => image.url === variantImage)
        ) {
            rows.unshift({
                id: `variant-${variantImage}`,
                url: variantImage,
                thumbnail: variantImage,
                alt: productName,
            });
        }

        return rows;
    }, [images, variantImage, productName]);

    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        setActiveIndex(0);
    }, [variantImage]);

    const active = displayImages[activeIndex];

    return (
        <div className="fv-product-gallery">
            <div className="fv-product-main-image">
                {active?.url ? (
                    <img
                        src={active.url}
                        alt={active.alt || productName}
                    />
                ) : (
                    <span>
                        <i className="fa-regular fa-image" />
                    </span>
                )}
            </div>

            {displayImages.length > 0 && (
                <div className="fv-product-thumbnails">
                    {displayImages.map((image, index) => (
                        <button
                            type="button"
                            className={index === activeIndex ? "active" : ""}
                            onClick={() => setActiveIndex(index)}
                            key={image.id || image.url || index}
                        >
                            <img
                                src={image.thumbnail || image.url}
                                alt={image.alt || productName}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
