import React, {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import storefrontService
    from "../../services/storefrontService";

import "./OrderSuccess.css";


const money = (
    value
) =>
    `৳${Number(
        value || 0
    ).toLocaleString(
        "en-BD",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }
    )}`;


const statusLabel = (
    value
) =>
    String(
        value || ""
    )
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            (
                character
            ) =>
                character.toUpperCase()
        );


const downloadInvoicePng = (
    order
) => {
    const items =
        order?.items || [];

    const scale =
        2;

    const width =
        900;

    const itemHeight =
        62;

    const height =
        620 +
        (
            Math.max(
                items.length,
                1
            ) *
            itemHeight
        );

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        width * scale;

    canvas.height =
        height * scale;

    const ctx =
        canvas.getContext(
            "2d"
        );

    ctx.scale(
        scale,
        scale
    );

    const orange =
        "#FF5A00";

    const text =
        "#20252D";

    const muted =
        "#7D8590";

    const border =
        "#E7E9ED";

    const x =
        55;

    let y =
        46;

    ctx.fillStyle =
        "#FFFFFF";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );

    ctx.fillStyle =
        orange;

    ctx.fillRect(
        0,
        0,
        width,
        12
    );

    ctx.fillStyle =
        orange;

    ctx.font =
        "700 30px Arial";

    ctx.fillText(
        "Facevaly",
        x,
        y
    );

    ctx.fillStyle =
        muted;

    ctx.font =
        "14px Arial";

    ctx.fillText(
        "ORDER INVOICE",
        x,
        y + 26
    );

    ctx.textAlign =
        "right";

    ctx.fillStyle =
        text;

    ctx.font =
        "700 16px Arial";

    ctx.fillText(
        order.order_number,
        width - x,
        y
    );

    ctx.fillStyle =
        muted;

    ctx.font =
        "12px Arial";

    ctx.fillText(
        order.placed_at
            ? new Date(
                order.placed_at
            ).toLocaleString(
                "en-BD"
            )
            : "",
        width - x,
        y + 23
    );

    ctx.textAlign =
        "left";

    y += 75;

    ctx.strokeStyle =
        border;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(width - x, y);
    ctx.stroke();

    y += 28;

    const columnWidth =
        (
            width -
            (x * 2) -
            26
        ) /
        2;

    const drawLabelValue =
        (
            label,
            value,
            colX,
            rowY
        ) => {
            ctx.fillStyle =
                muted;

            ctx.font =
                "11px Arial";

            ctx.fillText(
                label,
                colX,
                rowY
            );

            ctx.fillStyle =
                text;

            ctx.font =
                "600 13px Arial";

            ctx.fillText(
                String(
                    value || "—"
                ).slice(
                    0,
                    52
                ),
                colX,
                rowY + 19
            );
        };

    drawLabelValue(
        "CUSTOMER",
        order.customer_name,
        x,
        y
    );

    drawLabelValue(
        "PHONE",
        order.customer_phone,
        x,
        y + 49
    );

    drawLabelValue(
        "DELIVERY ADDRESS",
        order.address,
        x,
        y + 98
    );

    drawLabelValue(
        "PAYMENT",
        statusLabel(
            order.payment_method
        ),
        x + columnWidth + 26,
        y
    );

    drawLabelValue(
        "ORDER STATUS",
        statusLabel(
            order.status
        ),
        x + columnWidth + 26,
        y + 49
    );

    drawLabelValue(
        "DELIVERY AREA",
        statusLabel(
            order.delivery_area
        ),
        x + columnWidth + 26,
        y + 98
    );

    y += 175;

    ctx.fillStyle =
        "#F7F8FA";

    ctx.fillRect(
        x,
        y,
        width - (x * 2),
        38
    );

    ctx.fillStyle =
        text;

    ctx.font =
        "700 11px Arial";

    ctx.fillText(
        "ITEM",
        x + 12,
        y + 24
    );

    ctx.fillText(
        "QTY",
        width - x - 210,
        y + 24
    );

    ctx.textAlign =
        "right";

    ctx.fillText(
        "TOTAL",
        width - x - 12,
        y + 24
    );

    ctx.textAlign =
        "left";

    y += 48;

    items.forEach(
        (
            item
        ) => {
            ctx.fillStyle =
                text;

            ctx.font =
                "600 12px Arial";

            ctx.fillText(
                String(
                    item.product_name ||
                    "Product"
                ).slice(
                    0,
                    58
                ),
                x + 12,
                y + 16
            );

            ctx.fillStyle =
                muted;

            ctx.font =
                "10px Arial";

            ctx.fillText(
                [
                    item.variant_name,
                    money(
                        item.unit_price
                    ),
                ]
                    .filter(Boolean)
                    .join(" · ")
                    .slice(
                        0,
                        60
                    ),
                x + 12,
                y + 34
            );

            ctx.fillStyle =
                text;

            ctx.font =
                "600 12px Arial";

            ctx.fillText(
                String(
                    item.quantity || 1
                ),
                width - x - 195,
                y + 23
            );

            ctx.textAlign =
                "right";

            ctx.fillText(
                money(
                    item.line_total
                ),
                width - x - 12,
                y + 23
            );

            ctx.textAlign =
                "left";

            ctx.strokeStyle =
                border;

            ctx.beginPath();
            ctx.moveTo(
                x,
                y + 50
            );
            ctx.lineTo(
                width - x,
                y + 50
            );
            ctx.stroke();

            y += itemHeight;
        }
    );

    y += 12;

    const totalX =
        width - x - 300;

    const drawTotal =
        (
            label,
            value,
            bold = false,
            orangeValue = false
        ) => {
            ctx.fillStyle =
                bold
                    ? text
                    : muted;

            ctx.font =
                bold
                    ? "700 13px Arial"
                    : "12px Arial";

            ctx.fillText(
                label,
                totalX,
                y
            );

            ctx.textAlign =
                "right";

            ctx.fillStyle =
                orangeValue
                    ? orange
                    : text;

            ctx.font =
                bold
                    ? "700 16px Arial"
                    : "600 12px Arial";

            ctx.fillText(
                money(value),
                width - x,
                y
            );

            ctx.textAlign =
                "left";

            y += 28;
        };

    drawTotal(
        "Subtotal",
        order.subtotal
    );

    if (
        Number(
            order.coupon_discount || 0
        ) > 0
    ) {
        drawTotal(
            "Coupon Discount",
            -Number(
                order.coupon_discount
            )
        );
    }

    drawTotal(
        "Delivery",
        order.delivery_charge
    );

    y += 5;

    drawTotal(
        "Grand Total",
        order.total,
        true,
        true
    );

    ctx.fillStyle =
        muted;

    ctx.font =
        "10px Arial";

    ctx.fillText(
        "Thank you for shopping with Facevaly.",
        x,
        height - 38
    );

    canvas.toBlob(
        (
            blob
        ) => {
            if (!blob) {
                return;
            }

            const url =
                URL.createObjectURL(
                    blob
                );

            const anchor =
                document.createElement(
                    "a"
                );

            anchor.href =
                url;

            anchor.download =
                `Facevaly-Invoice-${order.order_number}.png`;

            document.body.appendChild(
                anchor
            );

            anchor.click();
            anchor.remove();

            URL.revokeObjectURL(
                url
            );
        },
        "image/png"
    );
};


export default function OrderSuccess() {
    const {
        token,
    } =
        useParams();

    const navigate =
        useNavigate();

    const [
        order,
        setOrder,
    ] =
        useState(null);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        error,
        setError,
    ] =
        useState("");

    const [
        downloading,
        setDownloading,
    ] =
        useState(false);


    useEffect(
        () => {
            let active =
                true;

            storefrontService
                .success(
                    token
                )
                .then(
                    (
                        response
                    ) => {
                        if (active) {
                            setOrder(
                                response.data
                            );
                        }
                    }
                )
                .catch(
                    (
                        exception
                    ) => {
                        if (active) {
                            setError(
                                exception?.message ||
                                "Order details could not be loaded."
                            );
                        }
                    }
                )
                .finally(
                    () => {
                        if (active) {
                            setLoading(false);
                        }
                    }
                );

            return () => {
                active =
                    false;
            };
        },
        [
            token,
        ]
    );

    // After success loads, go to shop without a visible countdown.
    useEffect(
        () => {
            if (
                loading
                || error
                || !order
            ) {
                return undefined;
            }

            const timer =
                window.setTimeout(
                    () => {
                        navigate(
                            "/shop",
                            {
                                replace:
                                    true,
                            }
                        );
                    },
                    2500
                );

            return () => {
                window.clearTimeout(
                    timer
                );
            };
        },
        [
            loading,
            error,
            order,
            navigate,
        ]
    );


    const invoice =
        () => {
            if (!order) {
                return;
            }

            setDownloading(true);

            try {
                downloadInvoicePng(
                    order
                );
            } finally {
                window.setTimeout(
                    () =>
                        setDownloading(false),
                    500
                );
            }
        };


    if (loading) {
        return (
            <div className="fvos2-state">
                <i className="fa-solid fa-spinner fa-spin" />
                Loading order...
            </div>
        );
    }


    if (
        error ||
        !order
    ) {
        return (
            <div className="fvos2-state error">
                <i className="fa-solid fa-circle-exclamation" />

                {error ||
                    "Order not found."}
            </div>
        );
    }


    return (
        <div className="fvos2-page">

            <div className="fvos2-card">

                <div className="fvos2-top">

                    <span className="fvos2-check">
                        <i className="fa-solid fa-check" />
                    </span>


                    <div>
                        <small>
                            ORDER CONFIRMED
                        </small>

                        <h1>
                            Thank you! Your order is confirmed.
                        </h1>

                        <p>
                            We received your order and will keep you updated.
                        </p>
                    </div>


                    <button
                        type="button"
                        className="fvos2-invoice"
                        title="Download PNG invoice"
                        disabled={downloading}
                        onClick={invoice}
                    >
                        <i
                            className={
                                downloading
                                    ? "fa-solid fa-spinner fa-spin"
                                    : "fa-solid fa-download"
                            }
                        />
                    </button>

                </div>


                <div className="fvos2-facts">

                    <div>
                        <span className="orange">
                            <i className="fa-solid fa-receipt" />
                        </span>

                        <p>
                            <small>
                                Order Number
                            </small>

                            <strong>
                                {order.order_number}
                            </strong>
                        </p>
                    </div>


                    <div>
                        <span className="money">
                            <i className="fa-solid fa-bangladeshi-taka-sign" />
                        </span>

                        <p>
                            <small>
                                Total
                            </small>

                            <strong>
                                {money(
                                    order.total
                                )}
                            </strong>
                        </p>
                    </div>


                    <div>
                        <span className="green">
                            <i className="fa-solid fa-shield" />
                        </span>

                        <p>
                            <small>
                                Status
                            </small>

                            <strong>
                                {statusLabel(
                                    order.status
                                )}
                            </strong>
                        </p>
                    </div>


                    <div>
                        <span className="blue">
                            <i className="fa-regular fa-credit-card" />
                        </span>

                        <p>
                            <small>
                                Payment
                            </small>

                            <strong>
                                {statusLabel(
                                    order.payment_method
                                )}
                            </strong>
                        </p>
                    </div>

                </div>


                <div className="fvos2-detail-grid">

                    <section>
                        <h2>
                            <i className="fa-solid fa-location-dot" />
                            Delivery To
                        </h2>

                        <strong>
                            {order.customer_name}
                        </strong>

                        <p>
                            {order.customer_phone}
                        </p>

                        <p>
                            {order.address}
                        </p>

                        {order.customer_note && (
                            <small>
                                Note: {order.customer_note}
                            </small>
                        )}
                    </section>


                    <section>
                        <h2>
                            <i className="fa-solid fa-bag-shopping" />
                            Items ({order.items?.length || 0})
                        </h2>

                        <div className="fvos2-items">

                            {(order.items || []).map(
                                (
                                    item
                                ) => (
                                    <div
                                        key={item.id}
                                    >
                                        <span>
                                            <strong>
                                                {item.product_name}
                                            </strong>

                                            <small>
                                                {item.variant_name ||
                                                    "Default"} × {item.quantity}
                                            </small>
                                        </span>

                                        <b>
                                            {money(
                                                item.line_total
                                            )}
                                        </b>
                                    </div>
                                )
                            )}

                        </div>
                    </section>

                </div>


                <div className="fvos2-totals">

                    <span>
                        <small>
                            Subtotal
                        </small>

                        <strong>
                            {money(
                                order.subtotal
                            )}
                        </strong>
                    </span>


                    <span>
                        <small>
                            Delivery
                        </small>

                        <strong>
                            {money(
                                order.delivery_charge
                            )}
                        </strong>
                    </span>


                    {Number(
                        order.coupon_discount || 0
                    ) > 0 && (
                        <span>
                            <small>
                                Discount
                            </small>

                            <strong className="green-text">
                                -{money(
                                    order.coupon_discount
                                )}
                            </strong>
                        </span>
                    )}


                    <span className="grand">
                        <small>
                            Grand Total
                        </small>

                        <strong>
                            {money(
                                order.total
                            )}
                        </strong>
                    </span>

                </div>


                <div className="fvos2-actions">

                    <button
                        type="button"
                        className="primary"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        <i className="fa-solid fa-bag-shopping" />
                        Continue Shopping
                    </button>


                    <button
                        type="button"
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        <i className="fa-solid fa-house" />
                        Home
                    </button>


                    <button
                        type="button"
                        className="invoice"
                        onClick={invoice}
                    >
                        <i className="fa-solid fa-download" />
                        Invoice PNG
                    </button>

                </div>

            </div>

        </div>
    );
}
