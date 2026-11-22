import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import customerAuthService from "../../services/customerAuthService";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { authErrorMessage } from "../../utils/authErrorMessage";
import "./CustomerAuth.css";

export default function CustomerRegister() {
    const navigate = useNavigate();
    const { refreshCart } = useCart();
    const { refreshWishlist } = useWishlist();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
    });
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        customerAuthService
            .me()
            .then(() => {
                if (active) {
                    navigate("/account", { replace: true });
                }
            })
            .catch(() => {
                if (active) {
                    setCheckingSession(false);
                }
            });

        return () => {
            active = false;
        };
    }, [navigate]);

    const onChange = (event) => {
        const { name, value } = event.target;
        setForm((current) => ({ ...current, [name]: value }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        if (loading) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            await customerAuthService.register(form);
            await Promise.all([
                refreshCart().catch(() => null),
                refreshWishlist().catch(() => null),
            ]);
            navigate("/account", { replace: true });
        } catch (exception) {
            setError(
                authErrorMessage(
                    exception,
                    "Account could not be created. Check your details and try again."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="fv-auth-page">
                <div className="fv-auth-loading" role="status" aria-live="polite">
                    <div className="fv-auth-spinner" aria-hidden="true" />
                    <p>Checking your session…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fv-auth-page">
            <div className="fv-auth-shell">
                <aside className="fv-auth-brand" aria-hidden="true">
                    <div>
                        <span className="fv-auth-brand-eyebrow">Facevaly</span>
                        <h2>Join thousands of shoppers across Bangladesh.</h2>
                        <p>
                            One account for orders, wishlist, and a smoother
                            checkout every time you shop.
                        </p>
                    </div>

                    <ul className="fv-auth-brand-list">
                        <li>
                            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                            <span>Secure sign-in with session protection</span>
                        </li>
                        <li>
                            <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
                            <span>Guest cart merges when you register</span>
                        </li>
                        <li>
                            <i className="fa-solid fa-gift" aria-hidden="true" />
                            <span>Access deals, vouchers, and order history</span>
                        </li>
                    </ul>
                </aside>

                <section className="fv-auth-panel">
                    <header className="fv-auth-panel-head">
                        <span>Account</span>
                        <h1>Create account</h1>
                        <p>Fill in your details to get started.</p>
                    </header>

                    <form className="fv-auth-form" onSubmit={onSubmit} noValidate>
                        <div className="fv-auth-field">
                            <label htmlFor="customer-name">Full name</label>
                            <div className="fv-auth-input-wrap">
                                <i className="fa-regular fa-user" aria-hidden="true" />
                                <input
                                    id="customer-name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Your full name"
                                    value={form.name}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="fv-auth-field">
                            <label htmlFor="customer-email">Email</label>
                            <div className="fv-auth-input-wrap">
                                <i className="fa-regular fa-envelope" aria-hidden="true" />
                                <input
                                    id="customer-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="you@email.com"
                                    value={form.email}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="fv-auth-field">
                            <label htmlFor="customer-phone">
                                Phone <span style={{ fontWeight: 400, color: "var(--muted)" }}>(optional)</span>
                            </label>
                            <div className="fv-auth-input-wrap">
                                <i className="fa-solid fa-phone" aria-hidden="true" />
                                <input
                                    id="customer-phone"
                                    name="phone"
                                    type="tel"
                                    autoComplete="tel"
                                    placeholder="01XXXXXXXXX"
                                    value={form.phone}
                                    onChange={onChange}
                                />
                            </div>
                        </div>

                        <div className="fv-auth-field">
                            <label htmlFor="customer-new-password">Password</label>
                            <div className="fv-auth-input-wrap fv-auth-input-wrap--password">
                                <i className="fa-solid fa-lock" aria-hidden="true" />
                                <input
                                    id="customer-new-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="At least 8 characters"
                                    value={form.password}
                                    onChange={onChange}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    className="fv-auth-toggle-password"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword((current) => !current)}
                                >
                                    <i
                                        className={
                                            showPassword
                                                ? "fa-regular fa-eye-slash"
                                                : "fa-regular fa-eye"
                                        }
                                        aria-hidden="true"
                                    />
                                </button>
                            </div>
                        </div>

                        <div className="fv-auth-field">
                            <label htmlFor="customer-confirm-password">Confirm password</label>
                            <div className="fv-auth-input-wrap">
                                <i className="fa-solid fa-lock" aria-hidden="true" />
                                <input
                                    id="customer-confirm-password"
                                    name="password_confirmation"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Re-enter your password"
                                    value={form.password_confirmation}
                                    onChange={onChange}
                                    required
                                    minLength={8}
                                />
                            </div>
                        </div>

                        {error ? (
                            <div className="fv-auth-error" role="alert">
                                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                                <span>{error}</span>
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            className="fv-auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Creating account…" : "Create account"}
                        </button>
                    </form>

                    <p className="fv-auth-footer">
                        Already have an account?{" "}
                        <Link to="/login">Sign in</Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
