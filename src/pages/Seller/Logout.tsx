import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import useSellerAuth
    from "../../hooks/useSellerAuth";

import "./seller.css";


export default function SellerLogout() {
    const {
        logout,
    } =
        useSellerAuth();

    const navigate =
        useNavigate();

    const startedRef =
        useRef(false);

    const [
        error,
        setError,
    ] =
        useState("");


    useEffect(() => {
        /*
         * React StrictMode-এ duplicate logout
         * request আটকাবে।
         */
        if (startedRef.current) {
            return;
        }

        startedRef.current = true;


        const run =
            async () => {
                try {
                    setError("");

                    await logout();

                    /*
                     * Server + frontend logout
                     * successful.
                     */
                    navigate(
                        "/seller/login",
                        {
                            replace: true,
                        }
                    );
                } catch (logoutError) {
                    console.error(
                        "Seller logout failed:",
                        logoutError
                    );

                    const status =
                        logoutError
                            ?.response
                            ?.status;

                    if (status === 419) {
                        setError(
                            "Logout request was rejected because the session security token expired. Please try again."
                        );

                        return;
                    }

                    setError(
                        logoutError?.response
                            ?.data?.message ||
                        logoutError?.message ||
                        "Unable to log out. Please try again."
                    );
                }
            };


        run();

    }, [
        logout,
        navigate,
    ]);


    if (error) {
        return (
            <div className="seller-route-loader">

                <div className="seller-logout-error">

                    <h2>
                        Logout failed
                    </h2>

                    <p>
                        {error}
                    </p>


                    <button
                        type="button"
                        onClick={
                            () =>
                                window.location.reload()
                        }
                        className="seller-login-button"
                    >
                        Try Again
                    </button>


                    <Link
                        to="/seller/dashboard"
                        className="seller-logout-back"
                    >
                        Back to Dashboard
                    </Link>

                </div>

            </div>
        );
    }


    return (
        <div className="seller-route-loader">

            <div className="seller-route-spinner" />

            <p>
                Logging out...
            </p>

        </div>
    );
}