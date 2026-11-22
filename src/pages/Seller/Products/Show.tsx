import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import SellerLayout from "../Layout";
import sellerProductService from "../../../services/sellerProductService";
import { mediaUrl } from "../../../config/api";
import "./seller-products.css";

const money = (value) =>
    Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

const label = (value) =>
    String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

export default function SellerProductShow() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        sellerProductService
            .show(Number(productId))
            .then((response) => {
                if (active) setProduct(response.data);
            })
            .catch((exception) => {
                if (active) setError(exception.message || "Product could not be loaded.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [productId]);

    if (loading) {
        return (
            <SellerLayout>
                <div className="sp-loading">
                    <i className="fa-solid fa-spinner fa-spin" />
                    Loading product...
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="sp-show-page">
                <header className="sp-show-header">
                    <div>
                        <span>PRODUCT DETAILS</span>
                        <h1>{product?.name || "Product"}</h1>
                        {product && (
                            <p>
                                {product.sku} · {product.approval_label}
                            </p>
                        )}
                    </div>

                    <div>
                        <button
                            type="button"
                            className="sp-outline-btn"
                            onClick={() => navigate("/seller/products")}
                        >
                            Back
                        </button>

                        {product && !product.deleted_at && (
                            <Link
                                className="sp-primary-btn"
                                to={`/seller/products/${product.id}/edit`}
                            >
                                <i className="fa-solid fa-pencil" /> Edit Product
                            </Link>
                        )}
                    </div>
                </header>

                {error && <div className="sp-alert error">{error}</div>}

                {product && (
                    <>
                        <section className="sp-show-hero sp-section-card">
                            <div className="sp-show-gallery">
                                {(product.images || [])
                                    .filter((image) => image.url)
                                    .map((image) => (
                                        <div
                                            className={image.slot === 1 ? "cover" : ""}
                                            key={image.slot}
                                        >
                                            {image.is_video ||
                                            image.media_type === "video" ||
                                            /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(
                                                String(image.url || "")
                                            ) ? (
                                                <video
                                                    src={mediaUrl(image.url)}
                                                    controls
                                                    playsInline
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <img
                                                    src={mediaUrl(image.url)}
                                                    alt={`${product.name} ${image.slot}`}
                                                />
                                            )}
                                            <span>{image.slot}</span>
                                        </div>
                                    ))}

                                {!product.images?.some((image) => image.url) && (
                                    <div className="sp-show-no-image">
                                        <i className="fa-regular fa-image" />
                                    </div>
                                )}
                            </div>

                            <div className="sp-show-summary">
                                <div className="sp-show-price">
                                    <strong>
                                        ৳{money(product.sale_price ?? product.regular_price)}
                                    </strong>
                                    {product.sale_price !== null && (
                                        <del>৳{money(product.regular_price)}</del>
                                    )}
                                </div>

                                <div className="sp-show-badges">
                                    <span className={`sp-approval sp-${product.approval_status}`}>
                                        {product.approval_label}
                                    </span>
                                    <span>{product.is_published ? "Published" : "Unpublished"}</span>
                                    <span>{label(product.availability)}</span>
                                </div>

                                <dl>
                                    <Info label="SKU" value={product.sku} />
                                    <Info label="Slug" value={product.slug} />
                                    <Info
                                        label="Categories"
                                        value={(product.categories || [])
                                            .map((category) => category.name)
                                            .join(", ")}
                                    />
                                    <Info label="Brand" value={product.brand} />
                                    <Info label="Unit" value={product.unit} />
                                    <Info
                                        label="Weight Unit"
                                        value={product.weight_unit}
                                    />
                                    <Info label="Stock" value={product.stock_quantity} />
                                    <Info label="Condition" value={label(product.condition)} />
                                    <Info
                                        label="Delivery"
                                        value={label(product.delivery_type)}
                                    />
                                    <Info
                                        label="Digital"
                                        value={product.is_digital ? "Yes" : "No"}
                                    />
                                </dl>
                            </div>
                        </section>

                        {product.has_variants && (
                            <section className="sp-section-card sp-show-section">
                                <div className="sp-section-title">Product Variants</div>
                                <div className="sp-show-variants">
                                    {product.variants.map((variant) => (
                                        <article key={variant.id}>
                                            <div>
                                                <strong>{variant.name || "Variant"}</strong>
                                                {variant.is_default && <span>Default</span>}
                                            </div>
                                            <p>{variant.sku}</p>
                                            <strong>
                                                ৳{money(variant.sale_price ?? variant.regular_price)}
                                            </strong>
                                            <small>
                                                Stock: {variant.stock_quantity} · {label(variant.availability)}
                                            </small>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )}

                        <section className="sp-section-card sp-show-section">
                            <div className="sp-section-title">Product Description</div>
                            <div className="sp-show-description-grid">
                                <article>
                                    <h4>Short Description</h4>
                                    <div
                                        className="sp-rendered-html"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                product.short_description ||
                                                "<p>No short description.</p>",
                                        }}
                                    />
                                </article>

                                <article>
                                    <h4>Long Description</h4>
                                    <div
                                        className="sp-rendered-html"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                product.long_description ||
                                                "<p>No long description.</p>",
                                        }}
                                    />
                                </article>
                            </div>
                        </section>

                        {product.is_digital && (
                            <section className="sp-section-card sp-show-section">
                                <div className="sp-section-title">Digital Files</div>
                                <div className="sp-show-files">
                                    {(product.digital_files || []).map((file) => (
                                        <div key={file.id}>
                                            <i className="fa-regular fa-file" />
                                            <span>{file.name}</span>
                                            <small>{file.mime_type || "File"}</small>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {product.seo_enabled && (
                            <section className="sp-section-card sp-show-section">
                                <div className="sp-section-title">Product SEO</div>
                                <dl className="sp-show-seo">
                                    <Info label="Meta Title" value={product.meta_title} />
                                    <Info
                                        label="Meta Keywords"
                                        value={product.meta_keywords}
                                    />
                                    <Info
                                        label="Meta Description"
                                        value={product.meta_description}
                                    />
                                    <Info
                                        label="Canonical URL"
                                        value={product.canonical_url}
                                    />
                                </dl>
                            </section>
                        )}
                    </>
                )}
            </div>
        </SellerLayout>
    );
}

function Info({ label: name, value }) {
    return (
        <div>
            <dt>{name}</dt>
            <dd>{value === null || value === undefined || value === "" ? "—" : value}</dd>
        </div>
    );
}
