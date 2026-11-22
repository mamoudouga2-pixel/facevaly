import {
    useCallback,
    useEffect,
    useState,
} from "react";

import AdminLayout from "./Layout";
import adminService from "../../services/adminService";

import {
    AdminCard,
    AdminLoader,
    AdminPageHeader,
    AdminToast,
    firstError,
} from "../../components/admin/AdminUI";

import "./admin.css";


export default function AdminProfile() {
    const [
        profile,
        setProfile,
    ] = useState(null);

    const [
        password,
        setPassword,
    ] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        toast,
        setToast,
    ] = useState(null);


    const notify = useCallback(
        (
            message,
            type = "success"
        ) => {
            setToast({
                message,
                type,
            });

            window.setTimeout(
                () => setToast(null),
                3200
            );
        },
        []
    );


    const load = useCallback(
        async () => {
            setLoading(true);

            try {
                const response =
                    await adminService
                        .profile();

                setProfile(response.data || null);
            } catch (exception) {
                notify(
                    firstError(exception),
                    "error"
                );
            } finally {
                setLoading(false);
            }
        },
        [notify]
    );


    useEffect(() => {
        load();
    }, [load]);


    const saveProfile = async () => {
        try {
            const response =
                await adminService
                    .saveProfile({
                        name: profile.name,
                        email: profile.email,
                        phone: profile.phone || null,
                    });

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const changePassword = async () => {
        try {
            const response =
                await adminService
                    .changePassword(password);

            notify(response.message);

            setPassword({
                current_password: "",
                password: "",
                password_confirmation: "",
            });
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const revokeOtherSessions = async () => {
        if (
            !window.confirm(
                "Sign out this administrator account from all other sessions?"
            )
        ) {
            return;
        }

        try {
            const response =
                await adminService
                    .revokeOtherSessions();

            notify(response.message);
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    if (loading) {
        return (
            <AdminLayout>
                <AdminLoader text="Loading admin profile..." />
            </AdminLayout>
        );
    }


    return (
        <AdminLayout>
            <AdminPageHeader
                title="My Admin Account"
                description="Update your administrator profile, password and active sessions."
            />

            <div className="adm-two-col">
                <AdminCard title="Profile">
                    <div className="adm-form-grid">
                        <label className="adm-field full">
                            <span>Name</span>

                            <input
                                className="adm-input"
                                value={profile?.name || ""}
                                onChange={(event) =>
                                    setProfile((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="adm-field full">
                            <span>Email</span>

                            <input
                                className="adm-input"
                                type="email"
                                value={profile?.email || ""}
                                onChange={(event) =>
                                    setProfile((current) => ({
                                        ...current,
                                        email: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="adm-field full">
                            <span>Phone</span>

                            <input
                                className="adm-input"
                                value={profile?.phone || ""}
                                onChange={(event) =>
                                    setProfile((current) => ({
                                        ...current,
                                        phone: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    </div>

                    <div className="adm-modal-footer">
                        <button
                            className="adm-btn adm-btn-primary"
                            type="button"
                            onClick={saveProfile}
                        >
                            Save Profile
                        </button>
                    </div>
                </AdminCard>

                <AdminCard title="Security">
                    <div className="adm-form-grid">
                        <label className="adm-field full">
                            <span>Current Password</span>

                            <input
                                className="adm-input"
                                type="password"
                                value={password.current_password}
                                onChange={(event) =>
                                    setPassword((current) => ({
                                        ...current,
                                        current_password: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="adm-field full">
                            <span>New Password</span>

                            <input
                                className="adm-input"
                                type="password"
                                value={password.password}
                                onChange={(event) =>
                                    setPassword((current) => ({
                                        ...current,
                                        password: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label className="adm-field full">
                            <span>Confirm New Password</span>

                            <input
                                className="adm-input"
                                type="password"
                                value={password.password_confirmation}
                                onChange={(event) =>
                                    setPassword((current) => ({
                                        ...current,
                                        password_confirmation: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    </div>

                    <div className="adm-modal-footer">
                        <button
                            className="adm-btn"
                            type="button"
                            onClick={revokeOtherSessions}
                        >
                            Revoke Other Sessions
                        </button>

                        <button
                            className="adm-btn adm-btn-primary"
                            type="button"
                            onClick={changePassword}
                        >
                            Change Password
                        </button>
                    </div>

                    <p className="adm-form-help">
                        2FA status in the existing users table:{" "}
                        <strong>
                            {profile?.two_factor_enabled
                                ? "Enabled"
                                : "Not enabled"}
                        </strong>.
                        This package does not invent a TOTP secret-enrollment
                        protocol without the project's existing authenticator
                        implementation.
                    </p>
                </AdminCard>
            </div>

            <AdminToast toast={toast} />
        </AdminLayout>
    );
}
