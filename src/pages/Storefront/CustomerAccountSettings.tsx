import React, { useEffect, useState } from "react";
import customerAccountService from "../../services/customerAccountService";
import { useStorefrontToast } from "../../context/StorefrontToastContext";
import "./CustomerAccountSettings.css";

const initialForm = {
    name: "",
    email: "",
    phone: "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
};

export default function CustomerAccountSettings() {
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const { showToast } = useStorefrontToast();

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError("");

        customerAccountService
            .settings()
            .then((response) => {
                if (!active) return;
                const data = response?.data || {};
                setForm((current) => ({
                    ...current,
                    name: data.name || "",
                    email: data.email || "",
                    phone: data.phone || "",
                }));
            })
            .catch((exception) => {
                if (!active) return;
                setError(
                    exception?.message ||
                        "Could not load account settings."
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const updateField = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = {
                name: form.name.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                current_password: form.current_password || null,
                new_password: form.new_password || null,
                new_password_confirmation:
                    form.new_password_confirmation || null,
            };

            const response =
                await customerAccountService.updateSettings(payload);

            showToast(
                response?.message || "Settings updated."
            );

            setForm((current) => ({
                ...current,
                current_password: "",
                new_password: "",
                new_password_confirmation: "",
            }));
        } catch (exception) {
            setError(
                exception?.response?.data?.message ||
                    exception?.message ||
                    "Could not update settings."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fv-account-settings-page">
            <div className="fv-account-settings-shell">
                <header className="fv-account-settings-hero">
                    <span>ACCOUNT SETTINGS</span>
                    <h1>Profile and security</h1>
                    <p>
                        Keep your contact information updated and protect your
                        account.
                    </p>
                </header>

                {loading ? (
                    <div className="fv-account-settings-loading">
                        <i className="fa-solid fa-spinner fa-spin" />
                        Loading account settings...
                    </div>
                ) : (
                    <form
                        className="fv-account-settings-form"
                        onSubmit={submit}
                    >
                        <section>
                            <h2>Profile</h2>

                            <label>
                                <span>Full name</span>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(event) =>
                                        updateField(
                                            "name",
                                            event.target.value
                                        )
                                    }
                                    required
                                />
                            </label>

                            <label>
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        updateField(
                                            "email",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <span>Phone</span>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={(event) =>
                                        updateField(
                                            "phone",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>
                        </section>

                        <section>
                            <h2>Change password</h2>

                            <label>
                                <span>Current password</span>
                                <input
                                    type="password"
                                    value={form.current_password}
                                    onChange={(event) =>
                                        updateField(
                                            "current_password",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <span>New password</span>
                                <input
                                    type="password"
                                    value={form.new_password}
                                    onChange={(event) =>
                                        updateField(
                                            "new_password",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <span>Confirm new password</span>
                                <input
                                    type="password"
                                    value={form.new_password_confirmation}
                                    onChange={(event) =>
                                        updateField(
                                            "new_password_confirmation",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>
                        </section>

                        {error ? (
                            <div className="fv-account-settings-error">
                                <i className="fa-solid fa-circle-exclamation" />
                                {error}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
