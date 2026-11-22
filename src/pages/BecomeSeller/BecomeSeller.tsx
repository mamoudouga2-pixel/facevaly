import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    Navigate,
    useNavigate,
} from "react-router-dom";

import sellerRegistrationService
    from "../../services/sellerRegistrationService";

import useSellerAuth
    from "../../hooks/useSellerAuth";

import "./become-seller.css";


/* =========================================================
   INITIAL REGISTRATION
========================================================= */

const initialRegistration = {
    full_name: "",
    email: "",
    shop_name: "",
    password: "",
    password_confirmation: "",
    terms_accepted: false,
};


/* =========================================================
   ERROR
========================================================= */

const getApiError = (
    error,
    fallback = "Something went wrong."
) => {
    const data =
        error?.response?.data;

    if (data?.errors) {
        const first =
            Object.values(
                data.errors
            )?.[0];

        if (
            Array.isArray(first) &&
            first[0]
        ) {
            return first[0];
        }
    }

    return (
        data?.message ||
        error?.message ||
        fallback
    );
};


/*
|--------------------------------------------------------------------------
| BANGLADESH PHONE NORMALIZATION
|--------------------------------------------------------------------------
|
| Accepts common local formats and always stores the 10-digit local part:
| 1752569844, 01752569844, 8801752569844, +8801752569844
|
*/

const normalizeBangladeshPhone = (
    value = ""
) => {
    let digits = String(value)
        .replace(/\D/g, "");

    if (
        digits.startsWith("880")
    ) {
        digits = digits.slice(3);
    }

    if (
        digits.startsWith("0")
    ) {
        digits = digits.slice(1);
    }

    return digits.slice(0, 10);
};


/* =========================================================
   MAIN
========================================================= */

export default function BecomeSeller() {
    const navigate = useNavigate();
    const {
        isAuthenticated,
        loading: authLoading,
        setSeller,
        login,
    } =
        useSellerAuth();


    const [
        step,
        setStep,
    ] = useState("phone");


    const [
        phone,
        setPhone,
    ] = useState("");


    const [
        requestToken,
        setRequestToken,
    ] = useState("");


    const [
        verificationToken,
        setVerificationToken,
    ] = useState("");


    const [
        otp,
        setOtp,
    ] = useState("");


    const [
        maskedPhone,
        setMaskedPhone,
    ] = useState("");


    const [
        resendSeconds,
        setResendSeconds,
    ] = useState(0);


    const [
        registration,
        setRegistration,
    ] = useState(
        initialRegistration
    );


    const [
        loading,
        setLoading,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        success,
        setSuccess,
    ] = useState(null);


    const [
        openFaq,
        setOpenFaq,
    ] = useState(1);


    /* =====================================================
       OTP TIMER
    ===================================================== */

    useEffect(() => {
        if (
            resendSeconds <= 0
        ) {
            return undefined;
        }

        const timer =
            window.setInterval(
                () => {
                    setResendSeconds(
                        (current) =>
                            Math.max(
                                0,
                                current - 1
                            )
                    );
                },
                1000
            );

        return () =>
            window.clearInterval(
                timer
            );
    }, [resendSeconds]);


    /* =====================================================
       PHONE
    ===================================================== */

    const cleanPhone =
        useMemo(
            () =>
                normalizeBangladeshPhone(
                    phone
                ),
            [phone]
        );


    /* =====================================================
       REGISTRATION CHANGE
    ===================================================== */

    const changeRegistration =
        (event) => {
            const {
                name,
                value,
                type,
                checked,
            } =
                event.target;

            setRegistration(
                (current) => ({
                    ...current,

                    [name]:
                        type ===
                        "checkbox"
                            ? checked
                            : value,
                })
            );

            if (error) {
                setError("");
            }
        };


    /* =====================================================
       REQUEST OTP
    ===================================================== */

    const requestOtp =
        async (event) => {
            event?.preventDefault?.();

            setError("");

            if (
                !/^1[3-9]\d{8}$/.test(
                    cleanPhone
                )
            ) {
                setError(
                    "Enter a valid Bangladesh mobile number."
                );

                return;
            }

            setLoading(true);

            try {
                const response =
                    await sellerRegistrationService.requestOtp({
                        country_code:
                            "+880",

                        phone:
                            cleanPhone,
                    });

                setRequestToken(
                    response.data
                        .request_token
                );

                setMaskedPhone(
                    response.data.phone
                );

                setResendSeconds(
                    response.data
                        .resend_after ||
                    60
                );

                setOtp("");

                setStep("otp");
            } catch (err) {
                setError(
                    getApiError(
                        err,
                        "Unable to send OTP."
                    )
                );

                const retryAfter =
                    err?.response?.data
                        ?.retry_after;

                if (retryAfter) {
                    setResendSeconds(
                        Number(
                            retryAfter
                        )
                    );
                }
            } finally {
                setLoading(false);
            }
        };


    /* =====================================================
       VERIFY OTP
    ===================================================== */

    const verifyOtp =
        async (event) => {
            event.preventDefault();

            setError("");

            if (
                !/^\d{6}$/.test(
                    otp
                )
            ) {
                setError(
                    "Enter the 6-digit verification code."
                );

                return;
            }

            setLoading(true);

            try {
                const response =
                    await sellerRegistrationService.verifyOtp({
                        request_token:
                            requestToken,

                        otp,
                    });

                setVerificationToken(
                    response.data
                        .verification_token
                );

                setStep("details");
            } catch (err) {
                setError(
                    getApiError(
                        err,
                        "OTP verification failed."
                    )
                );
            } finally {
                setLoading(false);
            }
        };


    /* =====================================================
       COMPLETE
    ===================================================== */

    const completeRegistration =
        async (event) => {
            event.preventDefault();

            setError("");

            if (
                registration.password !==
                registration
                    .password_confirmation
            ) {
                setError(
                    "Password confirmation does not match."
                );

                return;
            }

            if (
                !registration
                    .terms_accepted
            ) {
                setError(
                    "Please accept the Terms & Conditions and Privacy Policy."
                );

                return;
            }

            setLoading(true);

            try {
                const response =
                    await sellerRegistrationService.complete({
                        request_token:
                            requestToken,

                        verification_token:
                            verificationToken,

                        ...registration,
                    });

                const payload =
                    response?.data
                    ?? response;

                // Session cookie is set by the API; hydrate local seller auth and enter dashboard.
                if (
                    payload?.user
                    && payload?.vendor
                ) {
                    setSeller(
                        payload
                    );

                    navigate(
                        "/seller/complete-profile",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                try {
                    await login({
                        login: registration.email,
                        password: registration.password,
                    });

                    navigate(
                        "/seller/complete-profile",
                        {
                            replace: true,
                        }
                    );

                    return;
                } catch {
                    setSuccess(
                        payload
                    );

                    setStep(
                        "success"
                    );
                }
            } catch (err) {
                setError(
                    getApiError(
                        err,
                        "Seller registration failed."
                    )
                );
            } finally {
                setLoading(false);
            }
        };


    return (
        <div className="bs-page">

            {/* HEADER */}

            <RegisterHeader
                authLoading={
                    authLoading
                }
                isAuthenticated={
                    isAuthenticated
                }
            />


            {/* HERO */}

            <main className="bs-hero">

                <div
                    className="bs-hero-bg"
                    aria-hidden="true"
                />

                <div
                    className="bs-hero-overlay"
                    aria-hidden="true"
                />


                <div className="bs-hero-inner">

                    {/* LEFT */}

                    <section className="bs-promo">

                        <span className="bs-eyebrow bs-hero-reveal bs-hero-reveal--1">
                            FACEVALY SELLER CENTER
                        </span>

                        <h1 className="bs-hero-reveal bs-hero-reveal--2">
                            GROW YOUR
                            <br />

                            <span>
                                BUSINESS
                            </span>

                            <br />

                            WITH US!
                        </h1>

                        <p className="bs-promo-text bs-hero-reveal bs-hero-reveal--3">
                            Start your seller journey with
                            Facevaly and manage your growing
                            online business from one powerful
                            platform.
                        </p>


                        <div className="bs-stats">

                            <article className="bs-hero-reveal bs-hero-reveal--4">
                                <div className="bs-stat-number">
                                    5
                                    <span>M</span>
                                </div>

                                <p>
                                    Monthly Active
                                    <br />
                                    Users on Facevaly
                                </p>
                            </article>


                            <article className="bs-hero-reveal bs-hero-reveal--5">
                                <div className="bs-stat-number">
                                    22
                                    <span>M</span>
                                </div>

                                <p>
                                    Live Products
                                    <br />
                                    Across Countries
                                </p>
                            </article>


                            <article className="bs-hero-reveal bs-hero-reveal--6">
                                <div className="bs-stat-number">
                                    0
                                    <span>%</span>
                                </div>

                                <p>
                                    Platform commission
                                    <br />
                                    for 30 days
                                </p>
                            </article>

                        </div>

                    </section>


                    {/* RIGHT */}

                    <section className="bs-card bs-hero-reveal bs-hero-reveal--card">

                        {authLoading ? (

                            <RegisterAuthChecking />

                        ) : isAuthenticated ? (

                            <Navigate
                                to="/seller/complete-profile"
                                replace
                            />

                        ) : (

                            <>
                                {/* PHONE */}

                                {step === "phone" && (
                                    <form
                                        onSubmit={
                                            requestOtp
                                        }
                                    >

                                        <div className="bs-card-head">

                                            <span className="bs-small-title">
                                                GET STARTED
                                            </span>

                                            <h2>
                                                Sign up as a Facevaly Seller
                                            </h2>

                                            <p>
                                                Already have an account?{" "}

                                                <Link to="/seller/login">
                                                    Log in
                                                </Link>
                                            </p>

                                        </div>


                                        <div className="bs-form-group">

                                            <label
                                                className="bs-label"
                                                htmlFor="bs-phone"
                                            >
                                                Mobile Number
                                            </label>


                                            <div className="bs-phone-control">

                                                <div className="bs-country">

                                                    <span className="bs-bd-flag">
                                                        <i />
                                                    </span>

                                                    +880

                                                </div>

                                                <input
                                                    id="bs-phone"
                                                    type="tel"
                                                    inputMode="tel"
                                                    autoComplete="tel"
                                                    placeholder="17XXXXXXXX"
                                                    value={phone}
                                                    onChange={
                                                        (event) => {
                                                            setPhone(
                                                                normalizeBangladeshPhone(
                                                                    event
                                                                        .target
                                                                        .value
                                                                )
                                                            );

                                                            setError("");
                                                        }
                                                    }
                                                    onPaste={
                                                        (event) => {
                                                            event.preventDefault();

                                                            const pasted =
                                                                event.clipboardData.getData(
                                                                    "text"
                                                                );

                                                            setPhone(
                                                                normalizeBangladeshPhone(
                                                                    pasted
                                                                )
                                                            );

                                                            setError("");
                                                        }
                                                    }
                                                />

                                            </div>

                                        </div>


                                        {error && (
                                            <div className="bs-alert">
                                                {error}
                                            </div>
                                        )}


                                        <button
                                            type="submit"
                                            className="bs-submit"
                                            disabled={
                                                loading
                                            }
                                        >

                                            {loading ? (
                                                <>
                                                    <span className="bs-spinner" />

                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    Verify with SMS

                                                    <ArrowIcon />
                                                </>
                                            )}

                                        </button>


                                        <p className="bs-terms-copy">

                                            By clicking Verify with SMS,
                                            you agree to these{" "}

                                            <Link to="/terms-and-conditions">
                                                Terms &amp; Conditions
                                            </Link>

                                            {" "}and{" "}

                                            <Link to="/privacy-policy">
                                                Privacy Policy
                                            </Link>.

                                        </p>

                                    </form>
                                )}


                                {/* OTP */}

                                {step === "otp" && (
                                    <form
                                        onSubmit={
                                            verifyOtp
                                        }
                                    >

                                        <button
                                            type="button"
                                            className="bs-back"
                                            onClick={
                                                () => {
                                                    setStep(
                                                        "phone"
                                                    );

                                                    setError("");
                                                }
                                            }
                                        >
                                            <BackIcon />

                                            Change number
                                        </button>


                                        <div className="bs-card-head">

                                            <span className="bs-small-title">
                                                PHONE VERIFICATION
                                            </span>

                                            <h2>
                                                Verify your mobile number
                                            </h2>

                                            <p>
                                                We sent a 6-digit code to{" "}

                                                <strong>
                                                    {maskedPhone}
                                                </strong>.
                                            </p>

                                        </div>


                                        <div className="bs-form-group">

                                            <label
                                                className="bs-label"
                                                htmlFor="bs-otp"
                                            >
                                                Verification Code
                                            </label>


                                            <input
                                                id="bs-otp"
                                                className="bs-text-input bs-otp-input"
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={otp}
                                                onChange={
                                                    (event) => {
                                                        setOtp(
                                                            event.target
                                                                .value
                                                                .replace(
                                                                    /\D/g,
                                                                    ""
                                                                )
                                                                .slice(
                                                                    0,
                                                                    6
                                                                )
                                                        );

                                                        setError("");
                                                    }
                                                }
                                            />

                                        </div>


                                        {error && (
                                            <div className="bs-alert">
                                                {error}
                                            </div>
                                        )}


                                        <button
                                            type="submit"
                                            className="bs-submit"
                                            disabled={
                                                loading
                                            }
                                        >
                                            {loading
                                                ? "Verifying..."
                                                : "Verify OTP"
                                            }
                                        </button>


                                        <div className="bs-resend-row">

                                            <span>
                                                {resendSeconds >
                                                0
                                                    ? `Resend available in ${resendSeconds}s`
                                                    : "Didn't receive OTP?"
                                                }
                                            </span>


                                            <button
                                                type="button"
                                                className="bs-resend"
                                                disabled={
                                                    loading ||
                                                    resendSeconds >
                                                        0
                                                }
                                                onClick={
                                                    requestOtp
                                                }
                                            >
                                                Resend OTP
                                            </button>

                                        </div>

                                    </form>
                                )}


                                {/* DETAILS */}

                                {step === "details" && (
                                    <form
                                        onSubmit={
                                            completeRegistration
                                        }
                                    >

                                        <div className="bs-card-head">

                                            <span className="bs-small-title">
                                                FINAL STEP
                                            </span>

                                            <h2>
                                                Create your seller account
                                            </h2>

                                            <p>
                                                Phone verified successfully.
                                                Complete your account and
                                                shop information.
                                            </p>

                                        </div>


                                        <div className="bs-detail-grid">

                                            <div className="bs-full">

                                                <label
                                                    className="bs-label"
                                                    htmlFor="full_name"
                                                >
                                                    Full Name
                                                </label>

                                                <input
                                                    id="full_name"
                                                    className="bs-text-input"
                                                    type="text"
                                                    name="full_name"
                                                    value={
                                                        registration
                                                            .full_name
                                                    }
                                                    onChange={
                                                        changeRegistration
                                                    }
                                                    placeholder="Full Name"
                                                    required
                                                />

                                            </div>


                                            <div className="bs-full">

                                                <label
                                                    className="bs-label"
                                                    htmlFor="shop_name"
                                                >
                                                    Shop Name
                                                </label>

                                                <input
                                                    id="shop_name"
                                                    className="bs-text-input"
                                                    type="text"
                                                    name="shop_name"
                                                    value={
                                                        registration
                                                            .shop_name
                                                    }
                                                    onChange={
                                                        changeRegistration
                                                    }
                                                    placeholder="Shop Name"
                                                    required
                                                />

                                            </div>


                                            <div className="bs-full">

                                                <label
                                                    className="bs-label"
                                                    htmlFor="email"
                                                >
                                                    Email
                                                </label>

                                                <input
                                                    id="email"
                                                    className="bs-text-input"
                                                    type="email"
                                                    name="email"
                                                    value={
                                                        registration.email
                                                    }
                                                    onChange={
                                                        changeRegistration
                                                    }
                                                    placeholder="seller@example.com"
                                                    required
                                                />

                                            </div>


                                            <div>

                                                <label
                                                    className="bs-label"
                                                    htmlFor="password"
                                                >
                                                    Password
                                                </label>

                                                <input
                                                    id="password"
                                                    className="bs-text-input"
                                                    type="password"
                                                    name="password"
                                                    value={
                                                        registration
                                                            .password
                                                    }
                                                    onChange={
                                                        changeRegistration
                                                    }
                                                    required
                                                />

                                            </div>


                                            <div>

                                                <label
                                                    className="bs-label"
                                                    htmlFor="password_confirmation"
                                                >
                                                    Confirm Password
                                                </label>

                                                <input
                                                    id="password_confirmation"
                                                    className="bs-text-input"
                                                    type="password"
                                                    name="password_confirmation"
                                                    value={
                                                        registration
                                                            .password_confirmation
                                                    }
                                                    onChange={
                                                        changeRegistration
                                                    }
                                                    required
                                                />

                                            </div>

                                        </div>


                                        <label className="bs-checkbox-row">

                                            <input
                                                type="checkbox"
                                                name="terms_accepted"
                                                checked={
                                                    registration
                                                        .terms_accepted
                                                }
                                                onChange={
                                                    changeRegistration
                                                }
                                            />

                                            <span className="bs-checkbox-ui" />

                                            <span>
                                                I agree to the{" "}

                                                <Link to="/terms-and-conditions">
                                                    Terms &amp; Conditions
                                                </Link>

                                                {" "}and{" "}

                                                <Link to="/privacy-policy">
                                                    Privacy Policy
                                                </Link>.
                                            </span>

                                        </label>


                                        {error && (
                                            <div className="bs-alert">
                                                {error}
                                            </div>
                                        )}


                                        <button
                                            type="submit"
                                            className="bs-submit"
                                            disabled={
                                                loading
                                            }
                                        >
                                            {loading
                                                ? "Creating seller..."
                                                : "Create Seller Account"
                                            }
                                        </button>

                                    </form>
                                )}


                                {/* SUCCESS */}

                                {step === "success" && (
                                    <div className="bs-success">

                                        <div className="bs-success-icon">
                                            <CheckIcon />
                                        </div>

                                        <h2>
                                            Registration complete
                                        </h2>

                                        <p>
                                            <strong>
                                                {success?.vendor_name ||
                                                    registration.shop_name}
                                            </strong>{" "}
                                            is ready. Next, submit your store
                                            address and National ID so Facevaly
                                            can review your account.
                                        </p>

                                        <Link
                                            to="/seller/complete-profile"
                                            className="bs-submit bs-submit-link"
                                        >
                                            Continue to verification
                                        </Link>

                                    </div>
                                )}
                            </>

                        )}

                    </section>

                </div>

            </main>


            <RegisterBottom
                openFaq={
                    openFaq
                }
                setOpenFaq={
                    setOpenFaq
                }
            />

        </div>
    );
}


/* =========================================================
   HEADER
========================================================= */

function RegisterHeader({
    isAuthenticated,
    authLoading,
}) {
    return (
        <header className="bs-header">

            <div className="bs-header-inner">

                <Link
                    to="/"
                    className="bs-brand"
                >

                    <span className="bs-brand-mark">
                        <i />
                        <i />
                        <i />
                    </span>

                    <span className="bs-brand-copy">

                        <strong>
                            Facevaly
                        </strong>

                        <small>
                            SELLER CENTER
                        </small>

                    </span>

                </Link>


                <nav className="bs-nav">

                    {!authLoading &&
                    isAuthenticated ? (

                        <Link
                            to="/seller/complete-profile"
                            className="bs-nav-dashboard"
                        >
                            <DashboardIcon />

                            Continue setup
                        </Link>

                    ) : !authLoading ? (

                        <>
                            <Link
                                to="/seller/login"
                                className="bs-nav-login"
                            >
                                <PersonIcon />

                                Login
                            </Link>


                            <Link
                                to="/become-a-seller"
                                className="bs-nav-register"
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
   CHECK SESSION
========================================================= */

function RegisterAuthChecking() {
    return (
        <div className="bs-auth-state">

            <div className="bs-auth-spinner" />

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
   BOTTOM SECTIONS
========================================================= */

function RegisterBottom({
    openFaq,
    setOpenFaq,
}) {
    return (
        <>
            <section className="bs-features">

                <div className="bs-feature-grid">

                    <article className="bs-feature-card">
                        <h3>
                            Free Registration
                        </h3>
                        <p>
                            Account registration & listing items for sale is free
                        </p>
                    </article>

                    <article className="bs-feature-card">
                        <h3>
                            Free Marketing
                        </h3>
                        <p>
                            We have no extra charge for marketing and sales except commission
                        </p>
                    </article>

                    <article className="bs-feature-card">
                        <h3>
                            On Time Payment
                        </h3>
                        <p>
                            Get on time payment withdraw through Bkash or Bank Account
                        </p>
                    </article>

                    <article className="bs-feature-card">
                        <h3>
                            Reach &amp; Engagement
                        </h3>
                        <p>
                            Get 100X reach and engagement of your brand and collections
                        </p>
                    </article>

                    <article className="bs-feature-card">
                        <h3>
                            Hustle Free Shipping
                        </h3>
                        <p>
                            We handle the entire Delivery and Logistics for your order.
                        </p>
                    </article>

                    <article className="bs-feature-card">
                        <h3>
                            24/7 Support
                        </h3>
                        <p>
                            Our seller support team is available to help you.
                        </p>
                    </article>

                </div>

            </section>


            <section className="bs-steps">

                <div className="bs-section-shell">

                    <h2>
                        4 Simple Steps to Start Selling
                    </h2>

                    <img
                        src="/frontend/step1.png"
                        alt="4 Simple Steps to Start Selling"
                        className="bs-step-image"
                    />

                </div>

            </section>


            <section className="bs-faq-section">

                <div className="bs-faq-shell">

                    <div className="bs-faq-heading">

                        <h2>
                            FAQs
                        </h2>

                        <p>
                            Find quick answers to common questions
                            about selling on Facevaly.
                        </p>

                    </div>


                    <div className="bs-faq-list">

                        {[
                            {
                                id: 1,
                                q: "How can I sell on Facevaly?",
                                a: "Create a seller account, verify your mobile number, complete your shop details and submit your registration.",
                            },
                            {
                                id: 2,
                                q: "What categories can I sell on Facevaly?",
                                a: "Facevaly supports multiple categories including fashion, lifestyle and FMCG.",
                            },
                            {
                                id: 3,
                                q: "How much commission does Facevaly charge?",
                                a: "Seller commission may vary depending on the product category.",
                            },
                            {
                                id: 4,
                                q: "What is the payment policy for Facevaly?",
                                a: "Payments are processed for eligible delivered seller orders according to the applicable payment schedule.",
                            },
                        ].map(
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
                                            `bs-faq-item ${
                                                active
                                                    ? "active"
                                                    : ""
                                            }`
                                        }
                                    >

                                        <button
                                            type="button"
                                            className="bs-faq-question"
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
                                                {item.q}
                                            </span>

                                            <span className="bs-faq-arrow">
                                                <ChevronIcon />
                                            </span>
                                        </button>


                                        <div className="bs-faq-answer">

                                            <div className="bs-faq-answer-inner">
                                                <p>
                                                    {item.a}
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


            <footer className="bs-footer">
                © {new Date().getFullYear()} Facevaly — All rights reserved.
            </footer>
        </>
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


function ArrowIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="M5 12h14" />
            <path d="m14 7 5 5-5 5" />
        </svg>
    );
}


function BackIcon() {
    return (
        <svg viewBox="0 0 24 24">
            <path d="m15 18-6-6 6-6" />
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