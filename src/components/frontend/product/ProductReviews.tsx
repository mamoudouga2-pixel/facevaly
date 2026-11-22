import React from "react";
import "./ProductReviews.css";

function Stars({ rating, large = false }) {
    const rounded = Math.round(Number(rating || 0));

    return (
        <span className={large ? "fv-review-stars large" : "fv-review-stars"}>
            {[1, 2, 3, 4, 5].map((star) => (
                <i
                    className={
                        star <= rounded
                            ? "fa-solid fa-star"
                            : "fa-regular fa-star"
                    }
                    key={star}
                />
            ))}
        </span>
    );
}

export default function ProductReviews({ product }) {
    const rating = product.rating || {
        average: 0,
        count: 0,
        distribution: {},
    };

    return (
        <section className="fv-product-reviews" id="reviews">
            <h2>Ratings &amp; Reviews of {product.name}</h2>

            <div className="fv-review-summary">
                <div className="fv-review-score">
                    <strong>
                        {Number(rating.average || 0).toFixed(1)}
                        <small>/5</small>
                    </strong>

                    <Stars rating={rating.average} large />

                    <span>{rating.count || 0} Ratings</span>
                </div>

                <div className="fv-review-bars">
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = Number(
                            rating.distribution?.[star] || 0
                        );

                        const percent = rating.count
                            ? Math.round((count / rating.count) * 100)
                            : 0;

                        return (
                            <div key={star}>
                                <Stars rating={star} />

                                <span className="fv-review-bar">
                                    <i
                                        style={{
                                            width: `${percent}%`,
                                        }}
                                    />
                                </span>

                                <small>{count}</small>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="fv-review-list-head">
                <strong>Product Reviews</strong>

                <div>
                    <span>
                        <i className="fa-solid fa-arrow-down-wide-short" />
                        Sort: Relevance
                    </span>

                    <span>
                        <i className="fa-solid fa-filter" />
                        Filter: All star
                    </span>
                </div>
            </div>

            <div className="fv-review-list">
                {product.reviews?.length > 0 ? (
                    product.reviews.map((review) => (
                        <article key={review.id}>
                            <Stars rating={review.rating} />

                            <small>
                                {review.name}
                                {review.verified && " · Verified purchase"}
                            </small>

                            {review.review && <p>{review.review}</p>}

                            {review.images?.length > 0 && (
                                <div className="fv-review-images">
                                    {review.images.map((image) => (
                                        <img
                                            src={image.url}
                                            alt="Customer review"
                                            key={image.id}
                                        />
                                    ))}
                                </div>
                            )}

                            {review.admin_reply && (
                                <div className="fv-review-reply">
                                    <strong>Seller reply</strong>
                                    <p>{review.admin_reply}</p>
                                </div>
                            )}

                            <div className="fv-review-footer">
                                <button type="button">
                                    <i className="fa-regular fa-thumbs-up" /> 0
                                </button>
                                <i className="fa-solid fa-ellipsis-vertical" />
                            </div>
                        </article>
                    ))
                ) : (
                    <div className="fv-no-reviews">
                        No approved reviews yet.
                    </div>
                )}
            </div>
        </section>
    );
}
