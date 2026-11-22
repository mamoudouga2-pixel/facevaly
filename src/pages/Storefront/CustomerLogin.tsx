import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import customerAuthService from "../../services/customerAuthService";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { authErrorMessage } from "../../utils/authErrorMessage";
import "./CustomerAuth.css";

export default function CustomerLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshCart } = useCart();
    const { refreshWishlist } = useWishlist();

    const [form, setForm] = useState({
        login: "",
        password: "",
        remember: true,
    });
    const [loading, setLoading] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const from = String(location.state?.from || "/account");
    const redirectTo = from.startsWith("/") ? from : "/account";

    useEffect(() => {
        let active = true;

        customerAuthService
            .me()
            .then(() => {
                if (active) {
                    navigate(redirectTo, { replace: true });
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
    }, [navigate, redirectTo]);

    const onChange = (event) => {
        const { name, value, checked, type } = event.target;
        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        if (loading) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            await customerAuthService.login(form);
            await Promise.all([
                refreshCart().catch(() => null),
                refreshWishlist().catch(() => null),
            ]);
            navigate(redirectTo, { replace: true });
        } catch (exception) {
            setError(
                authErrorMessage(
                    exception,
                    "Sign in failed. Check your email or phone and password."
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
                        <h2>Your orders, saved in one place.</h2>
                        <p>
                            Sign in to track deliveries, manage your wishlist,
                            and checkout faster next time.
                        </p>
                    </div>

                    <ul className="fv-auth-brand-list">
                        <li>
                            <i className="fa-solid fa-box" aria-hidden="true" />
                            <span>View order status and payment updates</span>
                        </li>
                        <li>
                            <i className="fa-regular fa-heart" aria-hidden="true" />
                            <span>Keep wishlist items synced across devices</span>
                        </li>
                        <li>
                            <i className="fa-solid fa-bolt" aria-hidden="true" />
                            <span>Save addresses for quicker checkout</span>
                        </li>
                    </ul>
                </aside>

                <section className="fv-auth-panel">
                    <header className="fv-auth-panel-head">
                        <span>Account</span>
                        <h1>Sign in</h1>
                        <p>Use your email or phone number and password.</p>
                    </header>

                    <form className="fv-auth-form" onSubmit={onSubmit} noValidate>
                        <div className="fv-auth-field">
                            <label htmlFor="customer-login">Email or phone</label>
                            <div className="fv-auth-input-wrap">
                                <i className="fa-regular fa-envelope" aria-hidden="true" />
                                <input
                                    id="customer-login"
                                    name="login"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="you@email.com or 01XXXXXXXXX"
                                    value={form.login}
                                    onChange={onChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="fv-auth-field">
                            <label htmlFor="customer-password">Password</label>
                            <div className="fv-auth-input-wrap fv-auth-input-wrap--password">
                                <i className="fa-solid fa-lock" aria-hidden="true" />
                                <input
                                    id="customer-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={onChange}
                                    required
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

                        <div className="fv-auth-row">
                            <label className="fv-auth-check">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={form.remember}
                                    onChange={onChange}
                                />
                                Remember me
                            </label>

                            <Link className="fv-auth-link" to="/help-support">
                                Need help?
                            </Link>
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
                            {loading ? "Signing in…" : "Sign in"}
                        </button>
                    </form>

                    <p className="fv-auth-footer">
                        New to Facevaly?{" "}
                        <Link to="/register">Create account</Link>
                    </p>
                </section>
            </div>
        </div>
    );
}
