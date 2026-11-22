import React from "react";
import { Link } from "react-router-dom";

export default function HelpSupport() {
    return (
        <section
            style={{
                width: "min(940px, calc(100% - 24px))",
                margin: "28px auto 48px",
                padding: "26px 22px",
                border: "1px solid #e6ebf5",
                borderRadius: "16px",
                background: "#ffffff",
                boxShadow: "0 14px 34px rgba(17, 28, 52, 0.08)",
            }}
        >
            <p
                style={{
                    margin: 0,
                    color: "#ff5a00",
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    fontSize: 11,
                }}
            >
                Help and support
            </p>

            <h1
                style={{
                    margin: "10px 0 10px",
                    color: "#1e2b52",
                    fontSize: "clamp(24px, 2.4vw, 34px)",
                    lineHeight: 1.2,
                }}
            >
                How can we help you today?
            </h1>

            <p
                style={{
                    margin: 0,
                    color: "#5f6c8b",
                    lineHeight: 1.7,
                    maxWidth: "65ch",
                }}
            >
                Get support for orders, payments, returns, delivery updates and
                account issues. Choose a quick path below to resolve your issue
                faster.
            </p>

            <div
                style={{
                    marginTop: 20,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                }}
            >
                <Link
                    to="/contact"
                    style={{
                        minHeight: 40,
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid #ffbe9b",
                        background: "#fff3ec",
                        color: "#d14e00",
                        fontWeight: 700,
                    }}
                >
                    Contact support
                </Link>
                <Link
                    to="/returns"
                    style={{
                        minHeight: 40,
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid #dfe6f3",
                        color: "#425176",
                        fontWeight: 700,
                    }}
                >
                    Return and refund
                </Link>
                <Link
                    to="/account/orders"
                    style={{
                        minHeight: 40,
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0 14px",
                        borderRadius: 999,
                        border: "1px solid #dfe6f3",
                        color: "#425176",
                        fontWeight: 700,
                    }}
                >
                    Track my order
                </Link>
            </div>
        </section>
    );
}
