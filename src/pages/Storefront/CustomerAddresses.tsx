import React, { useEffect, useMemo, useState } from "react";
import customerAccountService from "../../services/customerAccountService";
import { useStorefrontToast } from "../../context/StorefrontToastContext";
import "./CustomerAddresses.css";

const emptyForm = {
    id: null,
    label: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    postal_code: "",
    district_id: "",
    is_default_shipping: false,
    is_default_billing: false,
};

const DISTRICTS = [
    { id: 35, name: "Bagerhat" },
    { id: 9, name: "Bandarban" },
    { id: 2, name: "Barguna" },
    { id: 3, name: "Barishal" },
    { id: 4, name: "Bhola" },
    { id: 51, name: "Bogura" },
    { id: 10, name: "Brahmanbaria" },
    { id: 11, name: "Chandpur" },
    { id: 55, name: "Chapainawabganj" },
    { id: 12, name: "Chattogram" },
    { id: 36, name: "Chuadanga" },
    { id: 14, name: "Cox's Bazar" },
    { id: 13, name: "Cumilla" },
    { id: 21, name: "Dhaka" },
    { id: 60, name: "Dinajpur" },
    { id: 22, name: "Faridpur" },
    { id: 15, name: "Feni" },
    { id: 61, name: "Gaibandha" },
    { id: 23, name: "Gazipur" },
    { id: 24, name: "Gopalganj" },
    { id: 69, name: "Habiganj" },
    { id: 46, name: "Jamalpur" },
    { id: 37, name: "Jashore" },
    { id: 5, name: "Jhalokati" },
    { id: 38, name: "Jhenaidah" },
    { id: 52, name: "Joypurhat" },
    { id: 16, name: "Khagrachhari" },
    { id: 39, name: "Khulna" },
    { id: 25, name: "Kishoreganj" },
    { id: 62, name: "Kurigram" },
    { id: 40, name: "Kushtia" },
    { id: 17, name: "Lakshmipur" },
    { id: 63, name: "Lalmonirhat" },
    { id: 26, name: "Madaripur" },
    { id: 41, name: "Magura" },
    { id: 27, name: "Manikganj" },
    { id: 42, name: "Meherpur" },
    { id: 70, name: "Moulvibazar" },
    { id: 28, name: "Munshiganj" },
    { id: 47, name: "Mymensingh" },
    { id: 53, name: "Naogaon" },
    { id: 43, name: "Narail" },
    { id: 29, name: "Narayanganj" },
    { id: 30, name: "Narsingdi" },
    { id: 54, name: "Natore" },
    { id: 48, name: "Netrokona" },
    { id: 64, name: "Nilphamari" },
    { id: 18, name: "Noakhali" },
    { id: 56, name: "Pabna" },
    { id: 65, name: "Panchagarh" },
    { id: 6, name: "Patuakhali" },
    { id: 7, name: "Pirojpur" },
    { id: 31, name: "Rajbari" },
    { id: 57, name: "Rajshahi" },
    { id: 19, name: "Rangamati" },
    { id: 66, name: "Rangpur" },
    { id: 44, name: "Satkhira" },
    { id: 32, name: "Shariatpur" },
    { id: 49, name: "Sherpur" },
    { id: 58, name: "Sirajganj" },
    { id: 71, name: "Sunamganj" },
    { id: 72, name: "Sylhet" },
    { id: 33, name: "Tangail" },
    { id: 67, name: "Thakurgaon" },
];

export default function CustomerAddresses() {
    const [addresses, setAddresses] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const { showToast } = useStorefrontToast();

    const editing = useMemo(() => Boolean(form.id), [form.id]);

    const load = async () => {
        setLoading(true);
        setError("");

        try {
            const addressResponse = await customerAccountService.addresses();
            setAddresses(addressResponse?.data || []);
        } catch (exception) {
            setError(
                exception?.message || "Could not load address book."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const patchForm = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const editAddress = (item) => {
        setForm({
            id: item.id,
            label: item.label || "",
            name: item.name || "",
            phone: item.phone || "",
            email: item.email || "",
            address: item.address || "",
            postal_code: item.postal_code || "",
            district_id: item.district_id || "",
            is_default_shipping: Boolean(item.is_default_shipping),
            is_default_billing: Boolean(item.is_default_billing),
        });
    };

    const resetForm = () => {
        setForm(emptyForm);
    };

    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
            label: form.label || null,
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            address: form.address.trim(),
            postal_code: form.postal_code.trim() || null,
            district_id: form.district_id
                ? Number(form.district_id)
                : null,
            is_default_shipping: Boolean(form.is_default_shipping),
            is_default_billing: Boolean(form.is_default_billing),
        };

        try {
            const response = editing
                ? await customerAccountService.updateAddress(form.id, payload)
                : await customerAccountService.createAddress(payload);

            showToast(response?.message || "Address saved.");
            resetForm();
            await load();
        } catch (exception) {
            setError(
                exception?.response?.data?.message ||
                    exception?.message ||
                    "Could not save address."
            );
        } finally {
            setSaving(false);
        }
    };

    const removeAddress = async (id) => {
        if (!window.confirm("Remove this address?")) {
            return;
        }

        try {
            await customerAccountService.deleteAddress(id);
            showToast("Address removed.");
            if (form.id === id) {
                resetForm();
            }
            await load();
        } catch (exception) {
            setError(
                exception?.response?.data?.message ||
                    exception?.message ||
                    "Could not remove address."
            );
        }
    };

    return (
        <div className="fv-address-page">
            <div className="fv-address-shell">
                <header className="fv-address-hero">
                    <span>ADDRESS BOOK</span>
                    <h1>Manage delivery addresses</h1>
                    <p>
                        Save trusted locations for faster checkout and cleaner
                        order details.
                    </p>
                </header>

                {error ? (
                    <div className="fv-address-error">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error}
                    </div>
                ) : null}

                <div className="fv-address-layout">
                    <section className="fv-address-form-wrap">
                        <h2>{editing ? "Edit address" : "Add new address"}</h2>

                        <form onSubmit={submit}>
                            <label>
                                <span>Label</span>
                                <input
                                    type="text"
                                    value={form.label}
                                    placeholder="Home, Office, Family"
                                    onChange={(event) =>
                                        patchForm("label", event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                <span>Recipient name</span>
                                <input
                                    type="text"
                                    value={form.name}
                                    required
                                    onChange={(event) =>
                                        patchForm("name", event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                <span>Phone</span>
                                <input
                                    type="text"
                                    value={form.phone}
                                    required
                                    onChange={(event) =>
                                        patchForm("phone", event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(event) =>
                                        patchForm("email", event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                <span>District</span>
                                <select
                                    value={form.district_id}
                                    onChange={(event) =>
                                        patchForm(
                                            "district_id",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">Select district</option>
                                    {DISTRICTS.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="fv-address-full">
                                <span>Address</span>
                                <textarea
                                    value={form.address}
                                    required
                                    onChange={(event) =>
                                        patchForm("address", event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                <span>Postal code</span>
                                <input
                                    type="text"
                                    value={form.postal_code}
                                    onChange={(event) =>
                                        patchForm("postal_code", event.target.value)
                                    }
                                />
                            </label>

                            <label className="fv-address-check">
                                <input
                                    type="checkbox"
                                    checked={form.is_default_shipping}
                                    onChange={(event) =>
                                        patchForm(
                                            "is_default_shipping",
                                            event.target.checked
                                        )
                                    }
                                />
                                <span>Set as default shipping address</span>
                            </label>

                            <label className="fv-address-check">
                                <input
                                    type="checkbox"
                                    checked={form.is_default_billing}
                                    onChange={(event) =>
                                        patchForm(
                                            "is_default_billing",
                                            event.target.checked
                                        )
                                    }
                                />
                                <span>Set as default billing address</span>
                            </label>

                            <div className="fv-address-actions">
                                <button type="submit" disabled={saving}>
                                    {saving
                                        ? "Saving..."
                                        : editing
                                        ? "Update address"
                                        : "Save address"}
                                </button>

                                {editing ? (
                                    <button
                                        type="button"
                                        className="ghost"
                                        onClick={resetForm}
                                    >
                                        Cancel edit
                                    </button>
                                ) : null}
                            </div>
                        </form>
                    </section>

                    <section className="fv-address-list-wrap">
                        <h2>Saved addresses</h2>

                        {loading ? (
                            <div className="fv-address-loading">
                                <i className="fa-solid fa-spinner fa-spin" />
                                Loading addresses...
                            </div>
                        ) : addresses.length === 0 ? (
                            <div className="fv-address-empty">
                                No saved addresses yet.
                            </div>
                        ) : (
                            <div className="fv-address-list">
                                {addresses.map((item) => (
                                    <article key={item.id}>
                                        <header>
                                            <strong>
                                                {item.label || "Address"}
                                            </strong>

                                            <div>
                                                {item.is_default_shipping ? (
                                                    <span>Default shipping</span>
                                                ) : null}
                                                {item.is_default_billing ? (
                                                    <span>Default billing</span>
                                                ) : null}
                                            </div>
                                        </header>

                                        <p>{item.name}</p>
                                        <p>{item.phone}</p>
                                        <p>
                                            {[item.address, item.district_name]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>

                                        <div className="fv-address-item-actions">
                                            <button
                                                type="button"
                                                onClick={() => editAddress(item)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                className="danger"
                                                onClick={() => removeAddress(item.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
