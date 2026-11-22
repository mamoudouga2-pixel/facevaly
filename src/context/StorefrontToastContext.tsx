import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from "react";

import "./StorefrontToast.css";

const StorefrontToastContext = createContext(null);

export function StorefrontToastProvider({ children }) {
    const [toast, setToast] = useState(null);
    const timer = useRef(null);

    const showToast = useCallback(
        (message, type = "success", duration = 2200) => {
            if (timer.current) {
                window.clearTimeout(timer.current);
            }

            setToast({
                message,
                type,
            });

            timer.current = window.setTimeout(() => {
                setToast(null);
            }, duration);
        },
        []
    );

    const hideToast = useCallback(() => {
        if (timer.current) {
            window.clearTimeout(timer.current);
        }

        setToast(null);
    }, []);

    const value = useMemo(
        () => ({
            showToast,
            hideToast,
        }),
        [showToast, hideToast]
    );

    return (
        <StorefrontToastContext.Provider value={value}>
            {children}

            {toast && (
                <div
                    className={`fv-global-toast ${toast.type}`}
                    role="status"
                    aria-live="polite"
                >
                    <span className="fv-global-toast-icon">
                        <i
                            className={
                                toast.type === "error"
                                    ? "fa-solid fa-circle-exclamation"
                                    : toast.type === "warning"
                                    ? "fa-solid fa-triangle-exclamation"
                                    : "fa-solid fa-circle-check"
                            }
                        />
                    </span>

                    <span>{toast.message}</span>

                    <button
                        type="button"
                        onClick={hideToast}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
            )}
        </StorefrontToastContext.Provider>
    );
}

export function useStorefrontToast() {
    const context = useContext(StorefrontToastContext);

    if (!context) {
        throw new Error(
            "useStorefrontToast must be used inside StorefrontToastProvider."
        );
    }

    return context;
}
