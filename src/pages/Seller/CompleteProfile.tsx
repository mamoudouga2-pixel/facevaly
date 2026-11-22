import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import SellerLayout from "./Layout";
import useSellerAuth from "../../hooks/useSellerAuth";
import sellerSuiteService from "../../services/sellerSuiteService";
import { mediaUrl } from "../../config/api";
import {
    SellerSuiteAlert,
    SellerSuiteBadge,
    SellerSuiteCard,
    SellerSuiteHeader,
    SellerSuiteLoader,
    SellerSuiteToast,
    firstError,
} from "../../components/seller/SellerSuiteUI";

import "./seller-suite.css";

const NID_SIDES = [
    {
        type: "nid_front",
        title: "NID Front",
        hint: "Choose or take a clear photo of the front of your National ID.",
    },
    {
        type: "nid_back",
        title: "NID Back",
        hint: "Choose or take a clear photo of the back of your National ID.",
    },
];

const ADDRESS_FIELDS = [
    ["contact_name", "Contact Name"],
    ["address_phone", "Contact Phone"],
    ["country", "Country"],
    ["state", "State / Division"],
    ["city", "City / District"],
    ["postal_code", "Postal Code"],
];

const emptyAddress = {
    contact_name: "",
    address_phone: "",
    country: "Bangladesh",
    state: "",
    city: "",
    postal_code: "",
    address: "",
};

export default function SellerCompleteProfile() {
    const navigate = useNavigate();
    const { seller, refreshSeller } = useSellerAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [nidUploading, setNidUploading] = useState(false);
    const [toast, setToast] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [address, setAddress] = useState(emptyAddress);
    const [nidFiles, setNidFiles] = useState({
        nid_front: null,
        nid_back: null,
    });
    const [nidPreviews, setNidPreviews] = useState({
        nid_front: "",
        nid_back: "",
    });

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const documentsByType = useMemo(() => {
        const map = {};
        for (const row of documents || []) {
            const key = String(row.type || "");
            if (!map[key]) map[key] = row;
        }
        return map;
    }, [documents]);

    const hasFront = Boolean(documentsByType.nid_front);
    const hasBack = Boolean(documentsByType.nid_back);
    const hasPendingNid = Boolean(nidFiles.nid_front || nidFiles.nid_back);
    const addressReady = Boolean(
        String(address.contact_name || "").trim()
        && String(address.address || "").trim()
        && String(address.city || "").trim()
    );

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const response = await sellerSuiteService.storeSettings();
            const payload = response.data || {};
            const docs = payload.documents || [];
            const addr =
                payload.business_address
                || payload.address
                || {};

            setDocuments(docs);
            setAddress({
                contact_name: addr.contact_name || "",
                address_phone: addr.phone || addr.address_phone || "",
                country: addr.country || "Bangladesh",
                state: addr.state || "",
                city: addr.city || "",
                postal_code: addr.postal_code || "",
                address: addr.address || "",
            });
        } catch (exception) {
            notify(
                firstError(exception, "Could not load verification details."),
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        load();
    }, [load]);

    const selectNidSide = (type, file) => {
        if (!file) return;

        setNidPreviews((current) => {
            if (current[type]) URL.revokeObjectURL(current[type]);
            return {
                ...current,
                [type]: URL.createObjectURL(file),
            };
        });
        setNidFiles((current) => ({
            ...current,
            [type]: file,
        }));
    };

    const submitNidPhotos = async () => {
        const pending = NID_SIDES
            .map((side) => ({ type: side.type, file: nidFiles[side.type] }))
            .filter((entry) => entry.file);

        if (!pending.length) {
            notify("Select NID front and/or back photos before submitting.", "error");
            return;
        }

        setNidUploading(true);
        try {
            let lastMessage = "";
            for (const entry of pending) {
                const formData = new FormData();
                formData.append("type", entry.type);
                formData.append("document", entry.file);
                const response =
                    await sellerSuiteService.uploadStoreDocument(formData);
                lastMessage = response.message || lastMessage;
            }

            setNidPreviews((current) => {
                Object.values(current).forEach((url) => {
                    if (url) URL.revokeObjectURL(url);
                });
                return { nid_front: "", nid_back: "" };
            });
            setNidFiles({ nid_front: null, nid_back: null });

            notify(lastMessage || "NID photos submitted.");
            await load();
            const refreshed =
                typeof refreshSeller === "function"
                    ? await refreshSeller()
                    : null;
            const vendor = refreshed?.vendor || {};
            if (
                vendor.awaiting_admin_approval
                || (vendor.docs_submitted && !vendor.needs_onboarding_docs)
            ) {
                navigate("/seller/pending-approval", { replace: true });
            }
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setNidUploading(false);
        }
    };

    const saveAddress = async () => {
        if (!String(address.address || "").trim()) {
            notify("Please enter your full business address.", "error");
            return;
        }

        setSaving(true);
        try {
            const formData = new FormData();
            Object.entries(address).forEach(([key, value]) => {
                formData.append(key, value ?? "");
            });

            // Keep current store name so profile update does not wipe identity.
            if (seller?.vendor?.name) {
                formData.append("name", seller.vendor.name);
            }

            const response =
                await sellerSuiteService.updateStoreProfile(formData);

            notify(
                response.message
                || "Business address saved."
            );
            await load();
            const refreshed =
                typeof refreshSeller === "function"
                    ? await refreshSeller()
                    : null;
            const vendor = refreshed?.vendor || seller?.vendor || {};
            const docsReady =
                vendor.awaiting_admin_approval
                || vendor.docs_submitted
                || (Boolean(vendor.has_nid_front)
                    && Boolean(vendor.has_nid_back)
                    && Boolean(vendor.has_business_address));
            if (docsReady) {
                navigate("/seller/pending-approval", { replace: true });
            }
        } catch (exception) {
            notify(firstError(exception), "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Complete your seller profile"
                    description="Upload NID photos and add your business address so Facevaly can approve your shop."
                    actions={
                        <Link
                            to={
                                seller?.vendor?.awaiting_admin_approval
                                    ? "/seller/pending-approval"
                                    : "/seller/dashboard"
                            }
                            className="ss-btn ss-btn-light"
                        >
                            {seller?.vendor?.awaiting_admin_approval
                                ? "View approval status"
                                : "Back"}
                        </Link>
                    }
                />

                {toast ? (
                    <SellerSuiteToast
                        message={toast.message}
                        type={toast.type}
                    />
                ) : null}

                <div className="ss-page-actions" style={{ marginBottom: 16, gap: 8 }}>
                    <SellerSuiteBadge
                        value={hasFront && hasBack ? "verified" : "pending"}
                    />
                    <SellerSuiteBadge
                        value={addressReady ? "completed" : "pending"}
                    />
                </div>

                {loading ? (
                    <SellerSuiteLoader text="Loading verification form..." />
                ) : (
                    <>
                        <SellerSuiteAlert type="warning">
                            Your account stays pending until NID front &amp; back
                            and a business address are submitted for review.
                        </SellerSuiteAlert>

                        <SellerSuiteCard
                            title="National ID (NID)"
                            description="Choose clear photos of both sides of your NID, then submit them together. You can pick a file or take a photo with your camera."
                            actions={
                                <button
                                    type="button"
                                    className="ss-btn ss-btn-primary"
                                    disabled={nidUploading || !hasPendingNid}
                                    onClick={submitNidPhotos}
                                >
                                    {nidUploading
                                        ? "Submitting..."
                                        : "Submit NID photos"}
                                </button>
                            }
                        >
                            <div className="ss-nid-grid">
                                {NID_SIDES.map((side) => {
                                    const current = documentsByType[side.type];
                                    const pendingFile = nidFiles[side.type];
                                    const preview =
                                        nidPreviews[side.type]
                                        || (current?.url
                                            ? mediaUrl(current.url)
                                            : current?.download_url
                                              ? mediaUrl(current.download_url)
                                              : "");

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
                                                        <span>No photo yet</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="ss-nid-meta">
                                                <SellerSuiteBadge
                                                    value={
                                                        pendingFile
                                                            ? "ready"
                                                            : current
                                                              ? current.status || "pending"
                                                              : "missing"
                                                    }
                                                />
                                            </div>

                                            <div className="ss-nid-actions">
                                                <label className="ss-btn ss-btn-primary ss-nid-file">
                                                    Choose photo
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        hidden
                                                        disabled={nidUploading}
                                                        onChange={(event) => {
                                                            const file =
                                                                event.target.files?.[0];
                                                            event.target.value = "";
                                                            selectNidSide(
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
                                                        hidden
                                                        disabled={nidUploading}
                                                        onChange={(event) => {
                                                            const file =
                                                                event.target.files?.[0];
                                                            event.target.value = "";
                                                            selectNidSide(
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

                        <SellerSuiteCard
                            title="Business Address"
                            description="Provide the address Facevaly can use for seller verification and support."
                            actions={
                                <button
                                    type="button"
                                    className="ss-btn ss-btn-primary"
                                    disabled={saving}
                                    onClick={saveAddress}
                                >
                                    {saving ? "Saving..." : "Save address"}
                                </button>
                            }
                        >
                            <div className="ss-form-grid ss-form-grid-3">
                                {ADDRESS_FIELDS.map(([field, label]) => (
                                    <label key={field}>
                                        <span>{label}</span>
                                        <input
                                            className="ss-input"
                                            value={address[field] || ""}
                                            onChange={(event) =>
                                                setAddress((current) => ({
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
                                        value={address.address || ""}
                                        onChange={(event) =>
                                            setAddress((current) => ({
                                                ...current,
                                                address: event.target.value,
                                            }))
                                        }
                                    />
                                </label>
                            </div>
                        </SellerSuiteCard>
                    </>
                )}
            </div>
        </SellerLayout>
    );
}
