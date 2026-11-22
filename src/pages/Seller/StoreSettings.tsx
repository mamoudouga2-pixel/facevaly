import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import SellerLayout from "./Layout";
import useSellerAuth from "../../hooks/useSellerAuth";
import sellerSuiteService from "../../services/sellerSuiteService";
import { mediaUrl } from "../../config/api";

import {
    SellerSuiteAlert,
    SellerSuiteBadge,
    SellerSuiteCard,
    SellerSuiteEmpty,
    SellerSuiteHeader,
    SellerSuiteLoader,
    SellerSuiteModal,
    SellerSuiteToast,
    firstError,
    money,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";


const SOCIAL_DEFAULTS = {
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    website_url: "",
};

const NID_SIDES = [
    {
        type: "nid_front",
        title: "NID Front",
        hint: "Upload or take a clear photo of the front of your National ID.",
    },
    {
        type: "nid_back",
        title: "NID Back",
        hint: "Upload or take a clear photo of the back of your National ID.",
    },
];


export default function SellerStoreSettings() {
    const { seller, setSeller, refreshSeller } = useSellerAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const initialTab = searchParams.get("tab") || "profile";
    const [tab, setTab] = useState(
        ["profile", "policies", "shipping", "documents"].includes(initialTab)
            ? initialTab
            : "profile"
    );
    const [nidBusy, setNidBusy] = useState("");
    const [nidPreviews, setNidPreviews] = useState({
        nid_front: "",
        nid_back: "",
    });
    const [toast, setToast] = useState(null);
    const [saving, setSaving] = useState(false);
    const [rateOpen, setRateOpen] = useState(false);
    const [rateId, setRateId] = useState(null);
    const [documentOpen, setDocumentOpen] = useState(false);

    const [profile, setProfile] = useState({});
    const [profileFiles, setProfileFiles] = useState({
        logo: null,
        banner: null,
    });
    const [policies, setPolicies] = useState({});
    const [shipping, setShipping] = useState({});
    const [rate, setRate] = useState({
        weight_unit_id: "",
        name: "",
        tier_code: "",
        minimum_weight: 0,
        maximum_weight: "",
        shipping_charge: 0,
        extra_per_kg: 0,
        country: "Bangladesh",
        state: "",
        city: "",
        sort_order: 0,
        is_active: true,
    });
    const [documentForm, setDocumentForm] = useState({
        type: "trade_license",
        document_number: "",
        file: null,
    });

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const hydrate = useCallback((payload) => {
        const vendor = payload.vendor || {};
        const address = payload.business_address || payload.address || {};
        const store = payload.store_settings || payload.settings || {};
        const social = vendor.settings?.social || {};

        setProfile({
            name: vendor.name || "",
            email: vendor.email || "",
            phone: vendor.phone || "",
            support_email: vendor.support_email || "",
            support_phone: vendor.support_phone || "",
            description: vendor.description || "",
            trade_license_number: vendor.trade_license_number || "",
            tax_id: vendor.tax_id || "",
            ...SOCIAL_DEFAULTS,
            ...social,
            contact_name: address.contact_name || "",
            address_phone: address.phone || "",
            country: address.country || "Bangladesh",
            state: address.state || "",
            city: address.city || "",
            postal_code: address.postal_code || "",
            address: address.address || "",
        });

        setPolicies({
            store_name: store.store_name || vendor.name || "",
            invoice_prefix: store.invoice_prefix || "FVV",
            return_policy: store.return_policy || "",
            shipping_policy: store.shipping_policy || "",
            privacy_policy: store.privacy_policy || "",
            seo_title: store.seo?.title || "",
            seo_description: store.seo?.description || "",
            seo_keywords: store.seo?.keywords || "",
        });

        setShipping({
            free_shipping: Boolean(
                (payload.delivery || payload.delivery_settings)?.free_shipping
            ),
            flat_rate: Number(
                (payload.delivery || payload.delivery_settings)?.flat_rate || 0
            ),
            weight_based_enabled: Boolean(
                (payload.delivery || payload.delivery_settings)
                    ?.weight_based_enabled
            ),
            use_platform_rates:
                (payload.delivery || payload.delivery_settings)
                    ?.use_platform_rates !== false,
            free_shipping_minimum:
                (payload.delivery || payload.delivery_settings)
                    ?.free_shipping_minimum ?? "",
        });
    }, []);

    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response = await sellerSuiteService.storeSettings();
            const payload = response.data || {};
            setData(payload);
            hydrate(payload);
        } catch (exception) {
            notify(firstError(exception, "Store settings could not be loaded."), "error");
        } finally {
            setLoading(false);
        }
    }, [hydrate, notify]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const next = searchParams.get("tab");
        if (
            next &&
            ["profile", "policies", "shipping", "documents"].includes(next) &&
            next !== tab
        ) {
            setTab(next);
        }
    }, [searchParams, tab]);

    const changeTab = (value) => {
        setTab(value);
        const next = new URLSearchParams(searchParams);
        if (value === "profile") {
            next.delete("tab");
        } else {
            next.set("tab", value);
        }
        setSearchParams(next, { replace: true });
    };

    const documentsByType = useMemo(() => {
        const map = {};
        for (const row of data?.documents || []) {
            const key = String(row.type || "");
            if (!map[key]) map[key] = row;
        }
        return map;
    }, [data?.documents]);

    const uploadNidSide = async (type, file) => {
        if (!file) return;

        setNidBusy(type);
        try {
            const preview = URL.createObjectURL(file);
            setNidPreviews((current) => ({
                ...current,
                [type]: preview,
            }));

            const formData = new FormData();
            formData.append("type", type);
            formData.append("document", file);

            const response =
                await sellerSuiteService.uploadStoreDocument(formData);

            notify(response.message || "NID uploaded.");
            await load();
            if (typeof refreshSeller === "function") {
                await refreshSeller();
            }
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setNidBusy("");
        }
    };

    const saveProfile = async () => {
        setSaving(true);

        try {
            const formData = new FormData();

            Object.entries(profile).forEach(([key, value]) => {
                formData.append(key, value ?? "");
            });

            if (profileFiles.logo) {
                formData.append("logo", profileFiles.logo);
            }

            if (profileFiles.banner) {
                formData.append("banner", profileFiles.banner);
            }

            const response =
                await sellerSuiteService.updateStoreProfile(formData);

            notify(response.message || "Store profile updated.");
            setProfileFiles({ logo: null, banner: null });

            const updatedVendor = response.data?.vendor;
            if (updatedVendor && seller) {
                setSeller({
                    ...seller,
                    vendor: {
                        ...(seller.vendor || {}),
                        ...updatedVendor,
                        needs_store_setup: false,
                        onboarding_status:
                            updatedVendor.onboarding_status || "complete",
                    },
                });
            } else {
                await refreshSeller();
            }

            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const savePolicies = async () => {
        setSaving(true);

        try {
            const response =
                await sellerSuiteService.updateStorePolicies(policies);
            notify(response.message || "Policies updated.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const saveShipping = async () => {
        setSaving(true);

        try {
            const response = await sellerSuiteService.updateShipping({
                ...shipping,
                flat_rate: Number(shipping.flat_rate || 0),
                free_shipping_minimum:
                    shipping.free_shipping_minimum === ""
                        ? null
                        : Number(shipping.free_shipping_minimum),
            });

            notify(response.message || "Shipping settings updated.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const openRate = (row = null) => {
        setRateId(row?.id || null);

        setRate(
            row
                ? {
                    weight_unit_id: row.weight_unit_id || "",
                    name: row.name || "",
                    tier_code: row.tier_code || "",
                    minimum_weight: Number(row.minimum_weight || 0),
                    maximum_weight: row.maximum_weight ?? "",
                    shipping_charge: Number(row.shipping_charge || 0),
                    extra_per_kg: Number(row.extra_per_kg || 0),
                    country: row.country || "Bangladesh",
                    state: row.state || "",
                    city: row.city || "",
                    sort_order: Number(row.sort_order || 0),
                    is_active: Boolean(row.is_active),
                }
                : {
                    weight_unit_id: data?.weight_units?.[0]?.id || "",
                    name: "",
                    tier_code: "",
                    minimum_weight: 0,
                    maximum_weight: "",
                    shipping_charge: 0,
                    extra_per_kg: 0,
                    country: "Bangladesh",
                    state: "",
                    city: "",
                    sort_order: 0,
                    is_active: true,
                }
        );

        setRateOpen(true);
    };

    const saveRate = async () => {
        setSaving(true);

        try {
            const response = await sellerSuiteService.saveShippingRate(
                {
                    ...rate,
                    weight_unit_id: Number(rate.weight_unit_id),
                    minimum_weight: Number(rate.minimum_weight || 0),
                    maximum_weight:
                        rate.maximum_weight === ""
                            ? null
                            : Number(rate.maximum_weight),
                    shipping_charge: Number(rate.shipping_charge || 0),
                    extra_per_kg: Number(rate.extra_per_kg || 0),
                    sort_order: Number(rate.sort_order || 0),
                },
                rateId
            );

            notify(response.message || "Shipping rate saved.");
            setRateOpen(false);
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const deleteRate = async (id) => {
        if (!window.confirm("Delete this shipping weight rate?")) return;

        try {
            const response =
                await sellerSuiteService.deleteShippingRate(id);
            notify(response.message || "Shipping rate removed.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    const uploadDocument = async () => {
        if (!documentForm.file) {
            notify("Select a document file.", "error");
            return;
        }

        setSaving(true);

        try {
            const formData = new FormData();
            formData.append("type", documentForm.type);
            formData.append(
                "document_number",
                documentForm.document_number || ""
            );
            formData.append("document", documentForm.file);

            const response =
                await sellerSuiteService.uploadStoreDocument(formData);

            notify(response.message || "Document uploaded.");
            setDocumentOpen(false);
            setDocumentForm({
                type: "trade_license",
                document_number: "",
                file: null,
            });
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    const deleteDocument = async (id) => {
        if (!window.confirm("Delete this pending/rejected document?")) return;

        try {
            const response =
                await sellerSuiteService.deleteStoreDocument(id);
            notify(response.message || "Document removed.");
            await load();
        } catch (exception) {
            notify(firstError(exception), "error");
        }
    };

    if (loading && !data) {
        return (
            <SellerLayout>
                <SellerSuiteLoader text="Loading store settings..." />
            </SellerLayout>
        );
    }

    const vendor = data?.vendor || {};

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Store Settings"
                    description="Manage public store identity, business address, policies, shipping rates, SEO and verification documents."
                    actions={
                        <a
                            className="ss-btn"
                            href={`/store/${vendor.slug || ""}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <i className="fa-solid fa-arrow-up-right-from-square" />
                            View Public Store
                        </a>
                    }
                />

                {vendor.status !== "active" && (
                    <SellerSuiteAlert type="warning">
                        Store status: <strong>{vendor.status}</strong>. Some
                        public selling features remain restricted until the
                        seller account is approved/active.
                    </SellerSuiteAlert>
                )}

                <div className="ss-tabs">
                    {[
                        ["profile", "Store Profile"],
                        ["policies", "Policies & SEO"],
                        ["shipping", "Shipping"],
                        ["documents", "Documents"],
                    ].map(([value, label]) => (
                        <button
                            type="button"
                            key={value}
                            className={
                                tab === value ? "ss-tab active" : "ss-tab"
                            }
                            onClick={() => changeTab(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === "profile" && (
                    <SellerSuiteCard
                        title="Store Profile"
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
                        <div className="ss-form-grid ss-form-grid-3">
                            <label>
                                <span>Store Name</span>
                                <input
                                    className="ss-input"
                                    value={profile.name || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
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
                                    value={profile.email || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
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
                                    value={profile.phone || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
                                            ...current,
                                            phone: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Support Email</span>
                                <input
                                    className="ss-input"
                                    type="email"
                                    value={profile.support_email || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
                                            ...current,
                                            support_email: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Support Phone</span>
                                <input
                                    className="ss-input"
                                    value={profile.support_phone || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
                                            ...current,
                                            support_phone: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Trade License Number</span>
                                <input
                                    className="ss-input"
                                    value={profile.trade_license_number || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
                                            ...current,
                                            trade_license_number:
                                                event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Tax ID</span>
                                <input
                                    className="ss-input"
                                    value={profile.tax_id || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
                                            ...current,
                                            tax_id: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Logo</span>
                                <input
                                    className="ss-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setProfileFiles((current) => ({
                                            ...current,
                                            logo: event.target.files?.[0] || null,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Banner</span>
                                <input
                                    className="ss-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setProfileFiles((current) => ({
                                            ...current,
                                            banner:
                                                event.target.files?.[0] || null,
                                        }))
                                    }
                                />
                            </label>

                            <label className="full">
                                <span>Description</span>
                                <textarea
                                    className="ss-textarea"
                                    value={profile.description || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        </div>

                        {(vendor.logo || vendor.banner) && (
                            <div
                                className="ss-page-actions"
                                style={{ marginTop: 14 }}
                            >
                                {vendor.logo && (
                                    <span
                                        className="ss-product-thumb"
                                        style={{ width: 70, height: 70 }}
                                    >
                                        <img
                                            src={mediaUrl(vendor.logo)}
                                            alt="Store logo"
                                        />
                                    </span>
                                )}
                                {vendor.banner && (
                                    <img
                                        src={mediaUrl(vendor.banner)}
                                        alt="Store banner"
                                        style={{
                                            maxWidth: 360,
                                            height: 70,
                                            objectFit: "cover",
                                            borderRadius: 8,
                                        }}
                                    />
                                )}
                            </div>
                        )}

                        <hr
                            style={{
                                border: 0,
                                borderTop: "1px solid #edf0f3",
                                margin: "20px 0",
                            }}
                        />

                        <h3 style={{ fontSize: 13, marginBottom: 12 }}>
                            Business Address
                        </h3>

                        <div className="ss-form-grid ss-form-grid-3">
                            {[
                                ["contact_name", "Contact Name"],
                                ["address_phone", "Contact Phone"],
                                ["country", "Country"],
                                ["state", "State / Division"],
                                ["city", "City / District"],
                                ["postal_code", "Postal Code"],
                            ].map(([field, label]) => (
                                <label key={field}>
                                    <span>{label}</span>
                                    <input
                                        className="ss-input"
                                        value={profile[field] || ""}
                                        onChange={(event) =>
                                            setProfile((current) => ({
                                                ...current,
                                                [field]: event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                            ))}

                            <label className="full">
                                <span>Full Address</span>
                                <textarea
                                    className="ss-textarea"
                                    value={profile.address || ""}
                                    onChange={(event) =>
                                        setProfile((current) => ({
                                            ...current,
                                            address: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        </div>
                    </SellerSuiteCard>
                )}

                {tab === "policies" && (
                    <SellerSuiteCard
                        title="Policies & Store SEO"
                        actions={
                            <button
                                type="button"
                                className="ss-btn ss-btn-primary"
                                disabled={saving}
                                onClick={savePolicies}
                            >
                                Save Policies
                            </button>
                        }
                    >
                        <div className="ss-form-grid">
                            <label>
                                <span>Public Store Name</span>
                                <input
                                    className="ss-input"
                                    value={policies.store_name || ""}
                                    onChange={(event) =>
                                        setPolicies((current) => ({
                                            ...current,
                                            store_name: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label>
                                <span>Invoice Prefix</span>
                                <input
                                    className="ss-input"
                                    value={policies.invoice_prefix || ""}
                                    onChange={(event) =>
                                        setPolicies((current) => ({
                                            ...current,
                                            invoice_prefix: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            {[
                                ["return_policy", "Return Policy"],
                                ["shipping_policy", "Shipping Policy"],
                                ["privacy_policy", "Privacy Policy"],
                            ].map(([field, label]) => (
                                <label className="full" key={field}>
                                    <span>{label}</span>
                                    <textarea
                                        className="ss-textarea"
                                        rows="7"
                                        value={policies[field] || ""}
                                        onChange={(event) =>
                                            setPolicies((current) => ({
                                                ...current,
                                                [field]: event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                            ))}

                            <label className="full">
                                <span>SEO Title</span>
                                <input
                                    className="ss-input"
                                    value={policies.seo_title || ""}
                                    onChange={(event) =>
                                        setPolicies((current) => ({
                                            ...current,
                                            seo_title: event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label className="full">
                                <span>SEO Description</span>
                                <textarea
                                    className="ss-textarea"
                                    value={policies.seo_description || ""}
                                    onChange={(event) =>
                                        setPolicies((current) => ({
                                            ...current,
                                            seo_description:
                                                event.target.value,
                                        }))
                                    }
                                />
                            </label>

                            <label className="full">
                                <span>SEO Keywords</span>
                                <textarea
                                    className="ss-textarea"
                                    value={policies.seo_keywords || ""}
                                    onChange={(event) =>
                                        setPolicies((current) => ({
                                            ...current,
                                            seo_keywords: event.target.value,
                                        }))
                                    }
                                />
                            </label>
                        </div>
                    </SellerSuiteCard>
                )}

                {tab === "shipping" && (
                    <>
                        <SellerSuiteCard
                            title="Shipping Settings"
                            actions={
                                <button
                                    type="button"
                                    className="ss-btn ss-btn-primary"
                                    disabled={saving}
                                    onClick={saveShipping}
                                >
                                    Save Shipping
                                </button>
                            }
                        >
                            <div className="ss-form-grid">
                                <label>
                                    <span>Flat Rate</span>
                                    <input
                                        className="ss-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={shipping.flat_rate ?? 0}
                                        onChange={(event) =>
                                            setShipping((current) => ({
                                                ...current,
                                                flat_rate: event.target.value,
                                            }))
                                        }
                                    />
                                </label>

                                <label>
                                    <span>Free Shipping Minimum</span>
                                    <input
                                        className="ss-input"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            shipping.free_shipping_minimum ?? ""
                                        }
                                        onChange={(event) =>
                                            setShipping((current) => ({
                                                ...current,
                                                free_shipping_minimum:
                                                    event.target.value,
                                            }))
                                        }
                                    />
                                </label>

                                {[
                                    ["free_shipping", "Enable Free Shipping"],
                                    [
                                        "weight_based_enabled",
                                        "Enable Weight-Based Rates",
                                    ],
                                    [
                                        "use_platform_rates",
                                        "Use Platform Rates",
                                    ],
                                ].map(([field, label]) => (
                                    <label key={field}>
                                        <span className="ss-check">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(
                                                    shipping[field]
                                                )}
                                                onChange={(event) =>
                                                    setShipping((current) => ({
                                                        ...current,
                                                        [field]:
                                                            event.target
                                                                .checked,
                                                    }))
                                                }
                                            />
                                            {label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </SellerSuiteCard>

                        <SellerSuiteCard
                            title="Weight-Based Rates"
                            actions={
                                <button
                                    type="button"
                                    className="ss-btn ss-btn-primary"
                                    onClick={() => openRate()}
                                >
                                    Add Rate
                                </button>
                            }
                        >
                            {(data?.delivery?.weight_rates || []).length ===
                            0 ? (
                                <SellerSuiteEmpty
                                    icon="fa-solid fa-truck"
                                    title="No seller weight rates"
                                />
                            ) : (
                                <div className="ss-table-wrap">
                                    <table className="ss-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Weight</th>
                                                <th>Charge</th>
                                                <th>Extra / kg</th>
                                                <th>Location</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.delivery.weight_rates.map(
                                                (row) => (
                                                    <tr key={row.id}>
                                                        <td>
                                                            <strong>
                                                                {row.name}
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            {row.minimum_weight}
                                                            {" - "}
                                                            {row.maximum_weight ??
                                                                "∞"}{" "}
                                                            {row.weight_unit}
                                                        </td>
                                                        <td>
                                                            {money(
                                                                row.shipping_charge
                                                            )}
                                                        </td>
                                                        <td>
                                                            {money(
                                                                row.extra_per_kg
                                                            )}
                                                        </td>
                                                        <td>
                                                            {[
                                                                row.city,
                                                                row.state,
                                                                row.country,
                                                            ]
                                                                .filter(Boolean)
                                                                .join(", ")}
                                                        </td>
                                                        <td>
                                                            <SellerSuiteBadge
                                                                value={
                                                                    row.is_active
                                                                        ? "active"
                                                                        : "inactive"
                                                                }
                                                            />
                                                        </td>
                                                        <td>
                                                            <div className="ss-page-actions">
                                                                <button
                                                                    type="button"
                                                                    className="ss-btn"
                                                                    onClick={() =>
                                                                        openRate(
                                                                            row
                                                                        )
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="ss-btn ss-btn-danger"
                                                                    onClick={() =>
                                                                        deleteRate(
                                                                            row.id
                                                                        )
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </SellerSuiteCard>
                    </>
                )}

                {tab === "documents" && (
                    <>
                        <SellerSuiteCard
                            title="National ID (NID)"
                            description="Upload clear photos of both sides of your NID. You can choose a file or take a photo with your camera."
                        >
                            <div className="ss-nid-grid">
                                {NID_SIDES.map((side) => {
                                    const current = documentsByType[side.type];
                                    const preview =
                                        nidPreviews[side.type] ||
                                        (current?.url
                                            ? mediaUrl(current.url)
                                            : current?.download_url
                                              ? mediaUrl(current.download_url)
                                              : "");
                                    const busy = nidBusy === side.type;

                                    return (
                                        <article
                                            key={side.type}
                                            className="ss-nid-card"
                                        >
                                            <header>
                                                <strong>{side.title}</strong>
                                                <p>{side.hint}</p>
                                            </header>

                                            <div className="ss-nid-preview">
                                                {preview ? (
                                                    <img
                                                        src={preview}
                                                        alt={side.title}
                                                    />
                                                ) : (
                                                    <div className="ss-nid-placeholder">
                                                        <i className="fa-solid fa-id-card" />
                                                        <span>
                                                            No photo yet
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {current ? (
                                                <div className="ss-nid-meta">
                                                    <SellerSuiteBadge
                                                        value={current.status}
                                                    />
                                                    {current.document_number ? (
                                                        <span>
                                                            #{current.document_number}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            ) : null}

                                            <div className="ss-nid-actions">
                                                <label className="ss-btn ss-btn-primary ss-nid-file">
                                                    {busy
                                                        ? "Uploading…"
                                                        : "Upload photo"}
                                                    <input
                                                        type="file"
                                                        accept="image/*,.pdf"
                                                        disabled={busy}
                                                        onChange={(event) => {
                                                            const file =
                                                                event.target
                                                                    .files?.[0];
                                                            event.target.value =
                                                                "";
                                                            uploadNidSide(
                                                                side.type,
                                                                file
                                                            );
                                                        }}
                                                    />
                                                </label>

                                                <label className="ss-btn ss-btn-light ss-nid-file">
                                                    Take photo
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        capture="environment"
                                                        disabled={busy}
                                                        onChange={(event) => {
                                                            const file =
                                                                event.target
                                                                    .files?.[0];
                                                            event.target.value =
                                                                "";
                                                            uploadNidSide(
                                                                side.type,
                                                                file
                                                            );
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </SellerSuiteCard>
                    </>
                )}
            </div>

            <SellerSuiteModal
                open={rateOpen}
                title={rateId ? "Edit Shipping Rate" : "Add Shipping Rate"}
                onClose={() => setRateOpen(false)}
                size="medium"
            >
                <div className="ss-form-grid ss-form-grid-3">
                    <label>
                        <span>Name</span>
                        <input
                            className="ss-input"
                            value={rate.name}
                            onChange={(event) =>
                                setRate((current) => ({
                                    ...current,
                                    name: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Weight Unit</span>
                        <select
                            className="ss-select"
                            value={rate.weight_unit_id}
                            onChange={(event) =>
                                setRate((current) => ({
                                    ...current,
                                    weight_unit_id: event.target.value,
                                }))
                            }
                        >
                            <option value="">Select</option>
                            {(data?.weight_units || []).map((unit) => (
                                <option value={unit.id} key={unit.id}>
                                    {unit.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        <span>Tier Code</span>
                        <input
                            className="ss-input"
                            value={rate.tier_code}
                            onChange={(event) =>
                                setRate((current) => ({
                                    ...current,
                                    tier_code: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Minimum Weight</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            step="0.001"
                            value={rate.minimum_weight}
                            onChange={(event) =>
                                setRate((current) => ({
                                    ...current,
                                    minimum_weight: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Maximum Weight</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            step="0.001"
                            value={rate.maximum_weight}
                            onChange={(event) =>
                                setRate((current) => ({
                                    ...current,
                                    maximum_weight: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Shipping Charge</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={rate.shipping_charge}
                            onChange={(event) =>
                                setRate((current) => ({
                                    ...current,
                                    shipping_charge: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label>
                        <span>Extra Per KG</span>
                        <input
                            className="ss-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={rate.extra_per_kg}
                            onChange={(event) =>
                                setRate((current) => ({
                                    ...current,
                                    extra_per_kg: event.target.value,
                                }))
                            }
                        />
                    </label>

                    {["country", "state", "city"].map((field) => (
                        <label key={field}>
                            <span>
                                {field.charAt(0).toUpperCase() + field.slice(1)}
                            </span>
                            <input
                                className="ss-input"
                                value={rate[field]}
                                onChange={(event) =>
                                    setRate((current) => ({
                                        ...current,
                                        [field]: event.target.value,
                                    }))
                                }
                            />
                        </label>
                    ))}

                    <label>
                        <span className="ss-check">
                            <input
                                type="checkbox"
                                checked={rate.is_active}
                                onChange={(event) =>
                                    setRate((current) => ({
                                        ...current,
                                        is_active: event.target.checked,
                                    }))
                                }
                            />
                            Rate active
                        </span>
                    </label>
                </div>

                <div className="ss-modal-footer">
                    <button
                        type="button"
                        className="ss-btn"
                        onClick={() => setRateOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="ss-btn ss-btn-primary"
                        disabled={saving}
                        onClick={saveRate}
                    >
                        Save Rate
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteModal
                open={documentOpen}
                title="Upload Seller Document"
                onClose={() => setDocumentOpen(false)}
                size="small"
            >
                <div className="ss-form-grid">
                    <label>
                        <span>Document Type</span>
                        <select
                            className="ss-select"
                            value={documentForm.type}
                            onChange={(event) =>
                                setDocumentForm((current) => ({
                                    ...current,
                                    type: event.target.value,
                                }))
                            }
                        >
                            <option value="trade_license">Trade License</option>
                            <option value="nid">NID</option>
                            <option value="passport">Passport</option>
                            <option value="tax">Tax / TIN</option>
                            <option value="bank">Bank Document</option>
                            <option value="other">Other</option>
                        </select>
                    </label>

                    <label>
                        <span>Document Number</span>
                        <input
                            className="ss-input"
                            value={documentForm.document_number}
                            onChange={(event) =>
                                setDocumentForm((current) => ({
                                    ...current,
                                    document_number: event.target.value,
                                }))
                            }
                        />
                    </label>

                    <label className="full">
                        <span>File (JPG, PNG or PDF)</span>
                        <input
                            className="ss-input"
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(event) =>
                                setDocumentForm((current) => ({
                                    ...current,
                                    file: event.target.files?.[0] || null,
                                }))
                            }
                        />
                    </label>
                </div>

                <div className="ss-modal-footer">
                    <button
                        type="button"
                        className="ss-btn"
                        onClick={() => setDocumentOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="ss-btn ss-btn-primary"
                        disabled={saving}
                        onClick={uploadDocument}
                    >
                        Upload
                    </button>
                </div>
            </SellerSuiteModal>

            <SellerSuiteToast toast={toast} />
        </SellerLayout>
    );
}
