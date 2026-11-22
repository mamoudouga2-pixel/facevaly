import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";

import adminService
    from "../../services/adminService";

import {
    firstError,
} from "../../components/admin/AdminUI";

import "./admin-login.css";


/* =========================================================
   ADMIN LOGIN
========================================================= */

export default function AdminLogin() {
    const navigate =
        useNavigate();

    const location =
        useLocation();


    const [
        form,
        setForm,
    ] = useState({
        login: "",
        password: "",
        remember: true,
    });


    const [
        submitting,
        setSubmitting,
    ] = useState(false);


    const [
        checking,
        setChecking,
    ] = useState(true);


    const [
        showPassword,
        setShowPassword,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    /* =====================================================
       CHECK EXISTING ADMIN SESSION
    ===================================================== */

    useEffect(() => {
        let mounted = true;


        const checkAdmin =
            async () => {
                try {
                    await adminService.me();

                    if (mounted) {
                        navigate(
                            "/admin/dashboard",
                            {
                                replace: true,
                            }
                        );
                    }
                } catch {
                    /*
                     * Not logged in.
                     * Continue showing login page.
                     */
                } finally {
                    if (mounted) {
                        setChecking(false);
                    }
                }
            };


        checkAdmin();


        return () => {
            mounted = false;
        };
    }, [
        navigate,
    ]);


    /* =====================================================
       INPUT CHANGE
    ===================================================== */

    const changeField =
        (event) => {
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
        };


    /* =====================================================
       SUBMIT
    ===================================================== */

    const submit =
        async (event) => {
            event.preventDefault();

            if (submitting) {
                return;
            }

            setSubmitting(true);
            setError("");


            try {
                await adminService.login(
                    form
                );


                const target =
                    location.state?.from &&
                    String(
                        location.state.from
                    ).startsWith(
                        "/admin"
                    )
                        ? location.state.from
                        : "/admin/dashboard";


                navigate(
                    target,
                    {
                        replace: true,
                    }
                );
            } catch (exception) {
                setError(
                    firstError(
                        exception,
                        "Unable to sign in."
                    )
                );
            } finally {
                setSubmitting(false);
            }
        };


    /* =====================================================
       SESSION CHECKING
    ===================================================== */

    if (checking) {
        return (
            <div className="fal-page">

                <div
                    className="fal-background"
                    aria-hidden="true"
                />

                <div
                    className="fal-background-overlay"
                    aria-hidden="true"
                />

                <div className="fal-checking-card">

                    <FacevalyLogo />

                    <div className="fal-check-spinner" />

                    <p>
                        Checking administrator session...
                    </p>

                </div>

            </div>
        );
    }


    /* =====================================================
       LOGIN PAGE
    ===================================================== */

    return (
        <div className="fal-page">

            {/* =============================================
                ONLINE BACKGROUND
            ============================================= */}

            <div
                className="fal-background"
                aria-hidden="true"
            />

            <div
                className="fal-background-overlay"
                aria-hidden="true"
            />


            {/* Decorative shapes */}

            <div
                className="fal-shape fal-shape-one"
                aria-hidden="true"
            />

            <div
                className="fal-shape fal-shape-two"
                aria-hidden="true"
            />

            <div
                className="fal-shape fal-shape-three"
                aria-hidden="true"
            />


            {/* =============================================
                LOGIN WRAPPER
            ============================================= */}

            <main className="fal-main">

                <section className="fal-card">

                    {/* =====================================
                        LOGO
                    ===================================== */}

                    <div className="fal-logo-section">

                        <FacevalyLogo />

                        <p className="fal-login-caption">
                            Secure Administrator Login
                        </p>

                    </div>


                    {/* =====================================
                        ERROR
                    ===================================== */}

                    {error && (
                        <div
                            className="fal-error"
                            role="alert"
                        >

                            <span className="fal-error-icon">
                                <AlertIcon />
                            </span>

                            <span>
                                {error}
                            </span>

                        </div>
                    )}


                    {/* =====================================
                        FORM
                    ===================================== */}

                    <form
                        className="fal-form"
                        onSubmit={
                            submit
                        }
                    >

                        {/* =================================
                            USERNAME / EMAIL
                        ================================= */}

                        <div className="fal-field">

                            <label
                                htmlFor="admin-login"
                            >
                                Username
                            </label>


                            <div className="fal-input-wrapper">

                                <span className="fal-input-icon">
                                    <UserIcon />
                                </span>


                                <input
                                    id="admin-login"
                                    type="text"
                                    name="login"
                                    value={
                                        form.login
                                    }
                                    onChange={
                                        changeField
                                    }
                                    placeholder="Enter email or mobile number"
                                    autoComplete="username"
                                    disabled={
                                        submitting
                                    }
                                    required
                                />

                            </div>

                        </div>


                        {/* =================================
                            PASSWORD
                        ================================= */}

                        <div className="fal-field">

                            <label
                                htmlFor="admin-password"
                            >
                                Password
                            </label>


                            <div className="fal-input-wrapper fal-password-wrapper">

                                <span className="fal-input-icon">
                                    <LockIcon />
                                </span>


                                <input
                                    id="admin-password"
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
                                        changeField
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
                                    className="fal-password-toggle"
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


                        {/* =================================
                            REMEMBER
                            Payload preserved, compact UI.
                        ================================= */}

                        <div className="fal-options">

                            <label className="fal-remember">

                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={
                                        form.remember
                                    }
                                    onChange={
                                        changeField
                                    }
                                />

                                <span className="fal-checkbox">
                                    <CheckSmallIcon />
                                </span>

                                <span>
                                    Keep me signed in for 1 month
                                </span>

                            </label>

                        </div>


                        {/* =================================
                            SUBMIT
                        ================================= */}

                        <button
                            type="submit"
                            className="fal-submit"
                            disabled={
                                submitting
                            }
                        >

                            {submitting ? (
                                <>
                                    <span className="fal-spinner" />

                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in

                                    <ArrowIcon />
                                </>
                            )}

                        </button>

                    </form>


                    {/* =====================================
                        BOTTOM
                    ===================================== */}

                    <div className="fal-bottom">

                        <div className="fal-security">

                            <ShieldIcon />

                            <span>
                                Protected administrator access
                            </span>

                        </div>


                        <Link
                            to="/"
                            className="fal-marketplace-link"
                        >
                            <BackIcon />

                            Back to Facevaly
                        </Link>

                    </div>

                </section>

            </main>

        </div>
    );
}


/* =========================================================
   FACEVALY LOGO
========================================================= */

function FacevalyLogo() {
    return (
        <Link
            to="/"
            className="fal-brand"
            aria-label="Facevaly Home"
        >

            <span
                className="fal-brand-symbol"
                aria-hidden="true"
            >

                <i />
                <i />
                <i />

            </span>


            <span className="fal-brand-text">

                <strong>
                    Facevaly
                </strong>

                <small>
                    ADMIN CONTROL PANEL
                </small>

            </span>

        </Link>
    );
}


/* =========================================================
   ICONS
========================================================= */

function UserIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="8"
                r="4"
            />

            <path d="M4 21c0-4.2 3.5-7 8-7s8 2.8 8 7" />
        </svg>
    );
}


function LockIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
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


function EyeIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
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
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="m3 3 18 18" />

            <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a17.8 17.8 0 0 1-2.1 3.2" />

            <path d="M6.6 6.6C3.8 8.5 2 12 2 12s3.5 8 10 8c2 0 3.8-.6 5.4-1.6" />
        </svg>
    );
}


function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M12 3 5 6v5c0 4.5 2.8 8.5 7 10 4.2-1.5 7-5.5 7-10V6l-7-3Z" />

            <path d="m9 12 2 2 4-4" />
        </svg>
    );
}


function ArrowIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="M5 12h14" />

            <path d="m14 7 5 5-5 5" />
        </svg>
    );
}


function BackIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="m15 18-6-6 6-6" />

            <path d="M9 12h10" />
        </svg>
    );
}


function AlertIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
            />

            <path d="M12 8v5" />

            <path d="M12 17h.01" />
        </svg>
    );
}


function CheckSmallIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
}