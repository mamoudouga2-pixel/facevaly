import {
    useCallback,
    useEffect,
    useState,
} from "react";

import SellerLayout from "./Layout";
import sellerSuiteService from "../../services/sellerSuiteService";
import { mediaUrl } from "../../config/api";

import {
    SellerSuiteAlert,
    SellerSuiteCard,
    SellerSuiteHeader,
    SellerSuiteLoader,
    SellerSuiteToast,
    firstError,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


export default function SellerProfile() {
    const [data, setData] = useState(null);
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        avatar: null,
    });
    const [password, setPassword] = useState({
        current_password: "",
        password: "",
        password_confirmation: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.account();
            const payload = response.data || {};
            setData(payload);
            setForm({
                name: payload.user?.name || "",
                email: payload.user?.email || "",
                phone: payload.user?.phone || "",
                avatar: null,
            });
        } catch (exception) {
            notify(firstError(exception, "Profile could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        load();
    }, [load]);

    const saveProfile = async () => {
        setSaving(true);

        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("email", form.email);
            formData.append("phone", form.phone || "");

            if (form.avatar) {
                formData.append("avatar", form.avatar);
            }

            const response =
                await sellerSuiteService.updateAccountProfile(formData);
            notify(response.message || "Profile updated.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async () => {
        setSaving(true);

        try {
            const response =
                await sellerSuiteService.changePassword(password);
            notify(response.message || "Password changed.");
            setPassword({
                current_password: "",
                password: "",
                password_confirmation: "",
            });
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading && !data) {
        return (
            <SellerLayout>
                <SellerSuiteLoader text="Loading seller profile..." />
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="My Profile & Security"
                    description="Manage the personal user account used to access Seller Center."
                />

                <SellerSuiteAlert type="info">
                    Store identity, logo, banner, trade license and public store
                    details are managed separately under <strong>Store Settings</strong>.
                </SellerSuiteAlert>

                <SellerSuiteCard
                    title="My Profile"
                    actions={
                        <button
                            type="button"
                            className="ss-btn ss-btn-primary"
                            disabled={saving}
                            onClick={saveProfile}
                        >
                            Save Profile
                        </button>
                    }
                >
                    <div className="ss-form-grid">
                        <label>
                            <span>Full Name</span>
                            <input
                                className="ss-input"
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label>
                            <span>Email</span>
                            <input
                                className="ss-input"
                                type="email"
                                value={form.email}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        email: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label>
                            <span>Phone</span>
                            <input
                                className="ss-input"
                                value={form.phone}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        phone: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label>
                            <span>Avatar</span>
                            <input
                                className="ss-input"
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        avatar:
                                            event.target.files?.[0] || null,
                                    }))
                                }
                            />
                        </label>
                    </div>

                    {data?.user?.avatar && (
                        <div style={{ marginTop: 14 }}>
                            <span
                                className="ss-product-thumb"
                                style={{ width: 70, height: 70 }}
                            >
                                <img
                                    src={mediaUrl(data.user.avatar)}
                                    alt={data.user.name}
                                />
                            </span>
                        </div>
                    )}
                </SellerSuiteCard>

                <SellerSuiteCard
                    title="Change Password"
                    description="The current password is required before a new password can be saved."
                    actions={
                        <button
                            type="button"
                            className="ss-btn ss-btn-primary"
                            disabled={
                                saving ||
                                !password.current_password ||
                                !password.password ||
                                password.password !==
                                    password.password_confirmation
                            }
                            onClick={changePassword}
                        >
                            Change Password
                        </button>
                    }
                >
                    <div className="ss-form-grid">
                        <label>
                            <span>Current Password</span>
                            <input
                                className="ss-input"
                                type="password"
                                autoComplete="current-password"
                                value={password.current_password}
                                onChange={(event) =>
                                    setPassword((current) => ({
                                        ...current,
                                        current_password:
                                            event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label>
                            <span>New Password</span>
                            <input
                                className="ss-input"
                                type="password"
                                autoComplete="new-password"
                                value={password.password}
                                onChange={(event) =>
                                    setPassword((current) => ({
                                        ...current,
                                        password: event.target.value,
                                    }))
                                }
                            />
                        </label>

                        <label>
                            <span>Confirm New Password</span>
                            <input
                                className="ss-input"
                                type="password"
                                autoComplete="new-password"
                                value={password.password_confirmation}
                                onChange={(event) =>
                                    setPassword((current) => ({
                                        ...current,
                                        password_confirmation:
                                            event.target.value,
                                    }))
                                }
                            />
                        </label>
                    </div>
                </SellerSuiteCard>
            </div>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
