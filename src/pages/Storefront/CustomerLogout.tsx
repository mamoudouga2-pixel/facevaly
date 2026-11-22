import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import customerAuthService from "../../services/customerAuthService";
import "./CustomerAuth.css";

export default function CustomerLogout() {
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;

        customerAuthService
            .logout()
            .catch(() => {})
            .finally(() => {
                if (active) {
                    navigate("/", { replace: true });
                }
            });

        return () => {
            active = false;
        };
    }, [navigate]);

    return (
        <div className="fv-auth-page">
            <div className="fv-auth-loading" role="status" aria-live="polite">
                <div className="fv-auth-spinner" aria-hidden="true" />
                <p>Signing you out…</p>
            </div>
        </div>
    );
}
