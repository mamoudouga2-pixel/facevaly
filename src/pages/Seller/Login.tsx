import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    Navigate,
    useLocation,
    useNavigate,
} from "react-router-dom";

import useSellerAuth
    from "../../hooks/useSellerAuth";

import sellerAuthService
    from "../../services/sellerAuthService";

import "./login.css";


/* =========================================================
   ERROR
========================================================= */

const sellerLoginRedirectTarget = (from) =>
    from &&
    from.startsWith("/seller/") &&
    from !== "/seller/pending-approval" &&
    from !== "/seller/login"
        ? from
        : "/seller/dashboard";


const firstError = (error) => {
    const validation =
        error?.response?.data?.errors;

    if (validation) {
        const firstKey =
            Object.keys(validation)[0];

        if (
            firstKey &&
            validation[firstKey]?.[0]
        ) {
            return validation[firstKey][0];
        }
    }

    return (
        error?.response?.data?.message ||
        error?.message ||
        "Unable to log in. Please try again."
    );
};


/* =========================================================
   FEATURES
========================================================= */

const features = [
    {
        id: 1,
        icon: "registration",
        title: "Free Registration",
        description:
            "Account registration & listing items for sale is free",
    },
    {
        id: 2,
        icon: "marketing",
        title: "Free Marketing",
        description:
            "We have no extra charge for marketing and sales except commission",
    },
    {
        id: 3,
        icon: "payment",
        title: "On Time Payment",
        description:
            "Get on time payment withdraw through Bkash or Bank Account",
    },
    {
        id: 4,
        icon: "engagement",
        title: "Reach & Engagement",
        description:
            "Get 100X reach and engagement of your brand and collections",
    },
    {
        id: 5,
        icon: "shipping",
        title: "Hustle Free Shipping",
        description:
            "We handle the entire Delivery and Logistics for your order and deliver it to your customer doorstep.",
    },
    {
        id: 6,
        icon: "support",
        title: "24/7 Support",
        description:
            "Get response within 2 minute. Dedicated Key Account Manager and Our support team is always for your support.",
    },
];


/* =========================================================
   FAQ
========================================================= */

const faqs = [
    {
        id: 1,
        question:
            "How can I sell on Facevaly?",
        answer:
            "To start selling on Facevaly, create a seller account using your phone number, complete verification and submit your shop information. Once approved, you can start listing products.",
    },
    {
        id: 2,
        question:
            "What categories can I sell on Facevaly?",
        answer:
            "Facevaly supports multiple product categories including fashion, lifestyle, FMCG and digital goods. Counterfeit, dangerous, restricted or prohibited products must not be listed.",
    },
    {
        id: 3,
        question:
            "How much commission does Facevaly charge?",
        answer:
            "Opening a Facevaly seller account is free. Commission may vary depending on the product category and completed order.",
    },
    {
        id: 4,
        question:
            "What is the payment policy for Facevaly?",
        answer:
            "Seller payments are processed for eligible delivered orders according to the applicable Facevaly seller payment schedule.",
    },
];


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SellerLogin() {
    const navigate =
        useNavigate();

    const location =
        useLocation();

    const {
        login,
        isAuthenticated,
        loading: authLoading,
    } =
        useSellerAuth();


    const [
        form,
        setForm,
    ] = useState({
        login: "",
        password: "",
        remember: true,
    });

    const [
        mode,
        setMode,
    ] = useState("login");

    const [
        forgot,
        setForgot,
    ] = useState({
        phone: "",
        otp: "",
        password: "",
        password_confirmation: "",
        request_token: "",
        verification_token: "",
        masked_phone: "",
        resend_after: 60,
    });

    const [
        notice,
        setNotice,
    ] = useState("");

    const [
        resendIn,
        setResendIn,
    ] = useState(0);


    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        showForgotPassword,
        setShowForgotPassword,
    ] = useState(false);


    const [
        submitting,
        setSubmitting,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        openFaq,
        setOpenFaq,
    ] = useState(1);


    /* =====================================================
       INPUT CHANGE
    ===================================================== */

    const handleChange = (
        event
    ) => {
        const {
            name,
            value,
            type,
            checked,
        } =
            event.target;

        setForm(
            (current) => ({
                ...current,

                [name]:
                    type === "checkbox"
                        ? checked
                        : value,
            })
        );

        if (error) {
            setError("");
        }

        if (notice) {
            setNotice("");
        }
    };

    useEffect(() => {
        if (resendIn <= 0) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            setResendIn((current) => Math.max(0, current - 1));
        }, 1000);

        return () => window.clearTimeout(timer);
    }, [resendIn]);

    const openForgotPassword = () => {
        setMode("forgot-phone");
        setError("");
        setNotice("");
        const loginValue = String(form.login || "").trim();
        const looksLikePhone = !loginValue.includes("@");
        setForgot((current) => ({
            ...current,
            phone: looksLikePhone ? loginValue : current.phone,
            otp: "",
            password: "",
            password_confirmation: "",
            request_token: "",
            verification_token: "",
            masked_phone: "",
        }));
        setResendIn(0);
    };

    const backToLogin = () => {
        setMode("login");
        setError("");
        setNotice("");
        setForgot((current) => ({
            ...current,
            otp: "",
            password: "",
            password_confirmation: "",
            request_token: "",
            verification_token: "",
            masked_phone: "",
        }));
        setResendIn(0);
    };

    const updateForgot = (field, value) => {
        setForgot((current) => ({
            ...current,
            [field]: value,
        }));
        if (error) setError("");
        if (notice) setNotice("");
    };

    const requestForgotOtp = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        setSubmitting(true);

        try {
            const response = await sellerAuthService.forgotPasswordRequest({
                phone: forgot.phone.trim(),
            });

            setForgot((current) => ({
                ...current,
                phone: current.phone.trim(),
                request_token: response?.data?.request_token || "",
                masked_phone: response?.data?.phone || "",
                otp: "",
                verification_token: "",
                password: "",
                password_confirmation: "",
                resend_after: Number(response?.data?.resend_after || 60),
            }));
            setResendIn(Number(response?.data?.resend_after || 60));
            setMode("forgot-otp");
            setNotice(
                response?.message
                || `Verification code sent to ${response?.data?.phone || "your mobile"}.`
            );
        } catch (requestError) {
            setError(firstError(requestError));
        } finally {
            setSubmitting(false);
        }
    };

    const verifyForgotOtp = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        setSubmitting(true);

        try {
            const response = await sellerAuthService.forgotPasswordVerifyOtp({
                request_token: forgot.request_token,
                otp: forgot.otp.trim(),
            });

            setForgot((current) => ({
                ...current,
                verification_token: response?.data?.verification_token || "",
                masked_phone: response?.data?.phone || current.masked_phone,
            }));
            setMode("forgot-reset");
            setNotice(
                response?.message || "Phone verified. Set your new password."
            );
        } catch (verifyError) {
            setError(firstError(verifyError));
        } finally {
            setSubmitting(false);
        }
    };

    const resetForgotPassword = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");

        if (forgot.password !== forgot.password_confirmation) {
            setError("Password confirmation does not match.");
            return;
        }

        if (String(forgot.password).length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await sellerAuthService.forgotPasswordReset({
                request_token: forgot.request_token,
                verification_token: forgot.verification_token,
                phone: forgot.phone,
                password: forgot.password,
                password_confirmation: forgot.password_confirmation,
            });

            setForm((current) => ({
                ...current,
                login: forgot.phone,
                password: "",
            }));
            setMode("login");
            setNotice(
                response?.message
                || "Password updated successfully. You can log in now."
            );
            setForgot({
                phone: forgot.phone,
                otp: "",
                password: "",
                password_confirmation: "",
                request_token: "",
                verification_token: "",
                masked_phone: "",
                resend_after: 60,
            });
        } catch (resetError) {
            setError(firstError(resetError));
        } finally {
            setSubmitting(false);
        }
    };


    /* =====================================================
       LOGIN
    ===================================================== */

    const handleSubmit =
        async (event) => {
            event.preventDefault();

            setError("");
            setSubmitting(true);

            try {
                await login(form);

                navigate(
                    sellerLoginRedirectTarget(
                        location.state?.from
                    ),
                    {
                        replace: true,
                    }
                );
            } catch (loginError) {
                setError(
                    firstError(
                        loginError
                    )
                );
            } finally {
                setSubmitting(false);
            }
        };


    return (
        <div className="sl-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <LoginHeader
                isAuthenticated={
                    isAuthenticated
                }
                authLoading={
                    authLoading
                }
            />


            {/* =================================================
                HERO
            ================================================= */}

            <main className="sl-hero">

                <div
                    className="sl-hero-bg"
                    aria-hidden="true"
                />

                <div
                    className="sl-hero-overlay"
                    aria-hidden="true"
                />


                <div className="sl-hero-inner">

                    {/* LEFT */}

                    <section className="sl-promo">

                        <span className="sl-eyebrow sl-hero-reveal sl-hero-reveal--1">
                            FACEVALY SELLER CENTER
                        </span>


                        <h1 className="sl-hero-reveal sl-hero-reveal--2">
                            MANAGE YOUR
                            <br />

                            <span>
                                SELLER
                            </span>

                            <br />

                            BUSINESS
                        </h1>


                        <p className="sl-promo-text sl-hero-reveal sl-hero-reveal--3">
                            Login to your Facevaly Seller
                            Center and manage products,
                            orders, inventory, customers,
                            earnings and your entire online
                            store from one powerful dashboard.
                        </p>


                        <div className="sl-stats">

                            <article className="sl-hero-reveal sl-hero-reveal--4">

                                <div className="sl-stat-number">
                                    5
                                    <span>M</span>
                                </div>

                                <p>
                                    Monthly Active
                                    <br />
                                    Users on Facevaly
                                </p>

                            </article>


                            <article className="sl-hero-reveal sl-hero-reveal--5">

                                <div className="sl-stat-number">
                                    22
                                    <span>M</span>
                                </div>

                                <p>
                                    Live Products
                                    <br />
                                    Across Categories
                                </p>

                            </article>


                            <article className="sl-hero-reveal sl-hero-reveal--6">

                                <div className="sl-stat-number">
                                    24
                                    <span>7</span>
                                </div>

                                <p>
                                    Seller Dashboard
                                    <br />
                                    Access
                                </p>

                            </article>

                        </div>

                    </section>


                    {/* =================================================
                        RIGHT CARD
                    ================================================= */}

                    <section className="sl-card sl-hero-reveal sl-hero-reveal--card">

                        {authLoading ? (

                            <AuthCheckingCard />

                        ) : isAuthenticated ? (

                            <Navigate
                                to={sellerLoginRedirectTarget(
                                    location.state?.from
                                )}
                                replace
                            />

                        ) : (

                            <>
                                <div className="sl-card-head">

                                    <span className="sl-small-title">
                                        {mode === "login"
                                            ? "WELCOME BACK"
                                            : "PASSWORD RECOVERY"}
                                    </span>

                                    <h2>
                                        {mode === "login"
                                            ? "Login as a Facevaly Seller"
                                            : mode === "forgot-phone"
                                              ? "Forgot your password?"
                                              : mode === "forgot-otp"
                                                ? "Verify mobile OTP"
                                                : "Set a new password"}
                                    </h2>

                                    <p>
                                        {mode === "login" ? (
                                            <>
                                                Don&apos;t have a seller account?{" "}
                                                <Link to="/become-a-seller">
                                                    Sign up
                                                </Link>
                                            </>
                                        ) : mode === "forgot-phone" ? (
                                            "Enter your registered mobile number. We will send an OTP to that number."
                                        ) : mode === "forgot-otp" ? (
                                            <>
                                                Code sent to{" "}
                                                <strong>
                                                    {forgot.masked_phone || "your mobile"}
                                                </strong>
                                                . Enter it below to continue.
                                            </>
                                        ) : (
                                            "Choose a new password for your seller account."
                                        )}
                                    </p>

                                </div>


                                {error && (
                                    <div
                                        className="sl-alert"
                                        role="alert"
                                    >
                                        {error}
                                    </div>
                                )}

                                {notice && !error && (
                                    <div
                                        className="sl-alert sl-alert-success"
                                        role="status"
                                    >
                                        {notice}
                                    </div>
                                )}


                                {mode === "login" && (
                                <form
                                    onSubmit={
                                        handleSubmit
                                    }
                                >

                                    {/* LOGIN */}

                                    <div className="sl-form-group">

                                        <label
                                            className="sl-label"
                                            htmlFor="seller-login"
                                        >
                                            Email or Mobile Number
                                        </label>


                                        <div className="sl-input-control">

                                            <span className="sl-input-icon">
                                                <PersonIcon />
                                            </span>

                                            <input
                                                id="seller-login"
                                                type="text"
                                                name="login"
                                                value={
                                                    form.login
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="seller@example.com or 017XXXXXXXX"
                                                autoComplete="username"
                                                disabled={
                                                    submitting
                                                }
                                                required
                                            />

                                        </div>

                                    </div>


                                    {/* PASSWORD */}

                                    <div className="sl-form-group">

                                        <div className="sl-label-row">
                                            <label
                                                className="sl-label"
                                                htmlFor="seller-password"
                                            >
                                                Password
                                            </label>

                                            <button
                                                type="button"
                                                className="sl-forgot-link"
                                                onClick={openForgotPassword}
                                            >
                                                Forgot password?
                                            </button>
                                        </div>


                                        <div className="sl-password-control">

                                            <span className="sl-input-icon">
                                                <LockIcon />
                                            </span>

                                            <input
                                                id="seller-password"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                name="password"
                                                value={
                                                    form.password
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter your password"
                                                autoComplete="current-password"
                                                disabled={
                                                    submitting
                                                }
                                                required
                                            />


                                            <button
                                                type="button"
                                                className="sl-password-toggle"
                                                onClick={
                                                    () =>
                                                        setShowPassword(
                                                            (current) =>
                                                                !current
                                                        )
                                                }
                                                aria-label={
                                                    showPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                            >
                                                {showPassword
                                                    ? <EyeOffIcon />
                                                    : <EyeIcon />
                                                }
                                            </button>

                                        </div>

                                    </div>


                                    {/* REMEMBER */}

                                    <div className="sl-form-options">

                                        <label className="sl-remember">

                                            <input
                                                type="checkbox"
                                                name="remember"
                                                checked={
                                                    form.remember
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                            <span className="sl-check-ui" />

                                            <span>
                                                Remember me
                                            </span>

                                        </label>

                                    </div>


                                    {/* SUBMIT */}

                                    <button
                                        type="submit"
                                        className="sl-submit"
                                        disabled={
                                            submitting
                                        }
                                    >

                                        {submitting ? (
                                            <>
                                                <span className="sl-spinner" />

                                                Signing in...
                                            </>
                                        ) : (
                                            <>
                                                Login to Seller Center

                                                <ArrowIcon />
                                            </>
                                        )}

                                    </button>


                                    <div className="sl-security">

                                        <ShieldIcon />

                                        <span>
                                            Secure seller authentication
                                        </span>

                                    </div>

                                </form>
                                )}

                                {mode === "forgot-phone" && (
                                    <form onSubmit={requestForgotOtp}>
                                        <div className="sl-form-group">
                                            <label
                                                className="sl-label"
                                                htmlFor="seller-forgot-phone"
                                            >
                                                Mobile Number
                                            </label>
                                            <div className="sl-input-control">
                                                <span className="sl-input-icon">
                                                    <PersonIcon />
                                                </span>
                                                <input
                                                    id="seller-forgot-phone"
                                                    type="tel"
                                                    inputMode="numeric"
                                                    value={forgot.phone}
                                                    onChange={(event) =>
                                                        updateForgot(
                                                            "phone",
                                                            event.target.value
                                                                .replace(/[^\d+]/g, "")
                                                                .slice(0, 14)
                                                        )
                                                    }
                                                    placeholder="017XXXXXXXX"
                                                    autoComplete="tel"
                                                    disabled={submitting}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="sl-submit"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="sl-spinner" />
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                <>
                                                    Send OTP to Mobile
                                                    <ArrowIcon />
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="sl-back-link"
                                            onClick={backToLogin}
                                            disabled={submitting}
                                        >
                                            Back to login
                                        </button>
                                    </form>
                                )}

                                {mode === "forgot-otp" && (
                                    <form onSubmit={verifyForgotOtp}>
                                        <div className="sl-form-group">
                                            <label
                                                className="sl-label"
                                                htmlFor="seller-forgot-otp"
                                            >
                                                OTP Code
                                            </label>
                                            <div className="sl-input-control">
                                                <span className="sl-input-icon">
                                                    <LockIcon />
                                                </span>
                                                <input
                                                    id="seller-forgot-otp"
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="one-time-code"
                                                    value={forgot.otp}
                                                    onChange={(event) =>
                                                        updateForgot(
                                                            "otp",
                                                            event.target.value
                                                                .replace(/\D+/g, "")
                                                                .slice(0, 6)
                                                        )
                                                    }
                                                    placeholder="Enter 6-digit code"
                                                    disabled={submitting}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="sl-submit"
                                            disabled={submitting || forgot.otp.length < 4}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="sl-spinner" />
                                                    Verifying...
                                                </>
                                            ) : (
                                                <>
                                                    Verify OTP
                                                    <ArrowIcon />
                                                </>
                                            )}
                                        </button>

                                        <div className="sl-forgot-actions">
                                            <button
                                                type="button"
                                                className="sl-back-link"
                                                onClick={() => setMode("forgot-phone")}
                                                disabled={submitting}
                                            >
                                                Change number
                                            </button>

                                            <button
                                                type="button"
                                                className="sl-forgot-link"
                                                disabled={submitting || resendIn > 0}
                                                onClick={(event) =>
                                                    requestForgotOtp(event)
                                                }
                                            >
                                                {resendIn > 0
                                                    ? `Resend in ${resendIn}s`
                                                    : "Resend OTP"}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {mode === "forgot-reset" && (
                                    <form onSubmit={resetForgotPassword}>
                                        <div className="sl-form-group">
                                            <label
                                                className="sl-label"
                                                htmlFor="seller-new-password"
                                            >
                                                New Password
                                            </label>
                                            <div className="sl-password-control">
                                                <span className="sl-input-icon">
                                                    <LockIcon />
                                                </span>
                                                <input
                                                    id="seller-new-password"
                                                    type={
                                                        showForgotPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    value={forgot.password}
                                                    onChange={(event) =>
                                                        updateForgot(
                                                            "password",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="At least 8 characters"
                                                    autoComplete="new-password"
                                                    disabled={submitting}
                                                    required
                                                    minLength={8}
                                                />
                                                <button
                                                    type="button"
                                                    className="sl-password-toggle"
                                                    onClick={() =>
                                                        setShowForgotPassword(
                                                            (current) => !current
                                                        )
                                                    }
                                                    aria-label={
                                                        showForgotPassword
                                                            ? "Hide password"
                                                            : "Show password"
                                                    }
                                                >
                                                    {showForgotPassword
                                                        ? <EyeOffIcon />
                                                        : <EyeIcon />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="sl-form-group">
                                            <label
                                                className="sl-label"
                                                htmlFor="seller-confirm-password"
                                            >
                                                Confirm Password
                                            </label>
                                            <div className="sl-input-control">
                                                <span className="sl-input-icon">
                                                    <LockIcon />
                                                </span>
                                                <input
                                                    id="seller-confirm-password"
                                                    type={
                                                        showForgotPassword
                                                            ? "text"
                                                            : "password"
                                                    }
                                                    value={forgot.password_confirmation}
                                                    onChange={(event) =>
                                                        updateForgot(
                                                            "password_confirmation",
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder="Re-enter new password"
                                                    autoComplete="new-password"
                                                    disabled={submitting}
                                                    required
                                                    minLength={8}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            className="sl-submit"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="sl-spinner" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    Update Password
                                                    <ArrowIcon />
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="sl-back-link"
                                            onClick={backToLogin}
                                            disabled={submitting}
                                        >
                                            Back to login
                                        </button>
                                    </form>
                                )}


                                <div className="sl-card-footer">

                                    <span>
                                        New to Facevaly Seller Center?
                                    </span>

                                    <Link to="/become-a-seller">
                                        Create Seller Account
                                    </Link>

                                </div>
                            </>

                        )}

                    </section>

                </div>

            </main>


            {/* =================================================
                FEATURE
            ================================================= */}

            <FeaturesSection />


            {/* =================================================
                STEPS
            ================================================= */}

            <StepsSection />


            {/* =================================================
                FAQ
            ================================================= */}

            <FaqSection
                openFaq={
                    openFaq
                }
                setOpenFaq={
                    setOpenFaq
                }
            />


            <Footer />

        </div>
    );
}


/* =========================================================
   HEADER
========================================================= */

function LoginHeader({
    isAuthenticated,
    authLoading,
}) {
    const homePath = "/seller/dashboard";

    return (
        <header className="sl-header">

            <div className="sl-header-inner">

                <Link
                    to="/"
                    className="sl-brand"
                >

                    <span className="sl-brand-mark">
                        <i />
                        <i />
                        <i />
                    </span>

                    <span className="sl-brand-copy">

                        <strong>
                            Facevaly
                        </strong>

                        <small>
                            SELLER CENTER
                        </small>

                    </span>

                </Link>


                <nav className="sl-nav">

                    {!authLoading &&
                    isAuthenticated ? (

                        <Link
                            to={homePath}
                            className="sl-nav-dashboard"
                        >
                            <DashboardIcon />

                            Go to Dashboard
                        </Link>

                    ) : !authLoading ? (

                        <>
                            <Link
                                to="/seller/login"
                                className="sl-nav-login"
                            >
                                <PersonIcon />

                                Login
                            </Link>


                            <Link
                                to="/become-a-seller"
                                className="sl-nav-register"
                            >
                                <PersonIcon />

                                Register
                            </Link>
                        </>

                    ) : null}

                </nav>

            </div>

        </header>
    );
}


/* =========================================================
   AUTH CHECKING
========================================================= */

function AuthCheckingCard() {
    return (
        <div className="sl-auth-state">

            <div className="sl-auth-spinner" />

            <h2>
                Checking your session
            </h2>

            <p>
                Please wait while we check your seller login.
            </p>

        </div>
    );
}


/* =========================================================
   FEATURE
========================================================= */

function FeaturesSection() {
    return (
        <section className="sl-features">

            <div className="sl-feature-grid">

                {features.map(
                    (item) => (
                        <article
                            key={
                                item.id
                            }
                            className="sl-feature-card"
                        >

                            <div className="sl-feature-icon">
                                <FeatureIcon
                                    type={
                                        item.icon
                                    }
                                />
                            </div>

                            <h3>
                                {item.title}
                            </h3>

                            <p>
                                {item.description}
                            </p>

                        </article>
                    )
                )}

            </div>

        </section>
    );
}


/* =========================================================
   STEPS
========================================================= */

function StepsSection() {
    return (
        <section className="sl-steps">

            <div className="sl-section-shell">

                <h2>
                    4 Simple Steps to Start Selling
                </h2>

                <img
                    src="/frontend/step1.png"
                    alt="4 Simple Steps to Start Selling"
                    className="sl-step-image"
                    loading="lazy"
                />

            </div>

        </section>
    );
}


/* =========================================================
   FAQ
========================================================= */

function FaqSection({
    openFaq,
    setOpenFaq,
}) {
    return (
        <section className="sl-faq-section">

            <div className="sl-faq-shell">

                <div className="sl-faq-heading">

                    <h2>
                        FAQs
                    </h2>

                    <p>
                        Find quick answers to common questions
                        about selling on Facevaly.
                    </p>

                </div>


                <div className="sl-faq-list">

                    {faqs.map(
                        (item) => {
                            const active =
                                openFaq ===
                                item.id;

                            return (
                                <article
                                    key={
                                        item.id
                                    }
                                    className={
                                        `sl-faq-item ${
                                            active
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                >

                                    <button
                                        type="button"
                                        className="sl-faq-question"
                                        onClick={
                                            () =>
                                                setOpenFaq(
                                                    active
                                                        ? 0
                                                        : item.id
                                                )
                                        }
                                    >

                                        <span>
                                            {item.question}
                                        </span>

                                        <span className="sl-faq-arrow">
                                            <ChevronIcon />
                                        </span>

                                    </button>


                                    <div className="sl-faq-answer">

                                        <div className="sl-faq-answer-inner">

                                            <p>
                                                {item.answer}
                                            </p>

                                        </div>

                                    </div>

                                </article>
                            );
                        }
                    )}

                </div>

            </div>

        </section>
    );
}


function Footer() {
    return (
        <footer className="sl-footer">
            © {new Date().getFullYear()} Facevaly — All rights reserved.
        </footer>
    );
}


/* =========================================================
   ICONS
========================================================= */

function PersonIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.2 3.5-7 8-7s8 2.8 8 7" />
        </svg>
    );
}


function LockIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <rect
                x="4"
                y="10"
                width="16"
                height="11"
                rx="2"
            />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
}


function DashboardIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <rect
                x="3"
                y="3"
                width="7"
                height="7"
                rx="1"
            />
            <rect
                x="14"
                y="3"
                width="7"
                height="7"
                rx="1"
            />
            <rect
                x="3"
                y="14"
                width="7"
                height="7"
                rx="1"
            />
            <rect
                x="14"
                y="14"
                width="7"
                height="7"
                rx="1"
            />
        </svg>
    );
}


function EyeIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
            <circle
                cx="12"
                cy="12"
                r="3"
            />
        </svg>
    );
}


function EyeOffIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="m3 3 18 18" />
            <path d="M6.6 6.6C3.8 8.5 2 12 2 12s3.5 8 10 8c2 0 3.8-.7 5.4-1.6" />
            <path d="M9.9 4.2A10 10 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2" />
        </svg>
    );
}


function ShieldIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}


function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M5 12h14" />
            <path d="m14 7 5 5-5 5" />
        </svg>
    );
}


function CheckIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M20 6 9 17l-5-5" />
        </svg>
    );
}


function ChevronIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="m7 9 5 5 5-5" />
        </svg>
    );
}


function FeatureIcon({
    type,
}) {
    if (type === "registration") {
        return (
            <svg viewBox="0 0 24 24">
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
            </svg>
        );
    }

    if (type === "marketing") {
        return (
            <svg viewBox="0 0 24 24">
                <path d="M3 11v2" />
                <path d="M6 9v6" />
                <path d="M9 7v10" />
                <path d="M13 5l8 3v8l-8 3z" />
            </svg>
        );
    }

    if (type === "payment") {
        return (
            <svg viewBox="0 0 24 24">
                <rect
                    x="3"
                    y="6"
                    width="15"
                    height="12"
                    rx="2"
                />
            </svg>
        );
    }

    if (type === "engagement") {
        return (
            <svg viewBox="0 0 24 24">
                <circle
                    cx="6"
                    cy="12"
                    r="2"
                />
                <circle
                    cx="18"
                    cy="6"
                    r="2"
                />
                <circle
                    cx="18"
                    cy="18"
                    r="2"
                />
                <path d="M8 11l8-4" />
                <path d="M8 13l8 4" />
            </svg>
        );
    }

    if (type === "shipping") {
        return (
            <svg viewBox="0 0 24 24">
                <path d="M12 2l7 4v8l-7 4-7-4V6z" />
                <path d="M5 6l7 4 7-4" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 24 24">
            <path d="M4 12a8 8 0 0 1 16 0" />
            <rect
                x="3"
                y="12"
                width="4"
                height="7"
                rx="2"
            />
            <rect
                x="17"
                y="12"
                width="4"
                height="7"
                rx="2"
            />
        </svg>
    );
}