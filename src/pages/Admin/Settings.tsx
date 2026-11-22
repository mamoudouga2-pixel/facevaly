import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminCard, AdminLoader, AdminPageHeader, AdminToast, firstError,
} from "../../components/admin/AdminUI";
import "./admin.css";

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({});
    const [toast, setToast] = useState(null);
    const notify = useCallback((m, t = "success") => {
        setToast({ message: m, type: t });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await adminService.settings();
            const c = r.data?.company || {};
            const s = r.data?.seo || {};
            const d = r.data?.delivery || {};
            const f = r.data?.fraud_guard || {};
            const h = r.data?.homepage || {};
            setForm({
                name: c.name || "Facevaly",
                company_desc: c.company_desc || "",
                phone: c.phone || "",
                address: c.address || "",
                email: c.email || "",
                whatsapp_number: c.whatsapp_number || "",
                facebook_page_link: c.facebook_page_link || "",
                messenger: c.messenger || "",
                x_link: c.x_link || "",
                instagram_link: c.instagram_link || "",
                tiktok_link: c.tiktok_link || "",
                youtube_link: c.youtube_link || "",
                home_page_title: s.home_page_title || "",
                meta_description: s.meta_description || "",
                meta_keywords: s.meta_keywords || "",
                free_shipping: Boolean(d.free_shipping),
                flat_rate: d.flat_rate || 0,
                weight_based_enabled:
                    d.weight_based_enabled === undefined
                        ? true
                        : Boolean(d.weight_based_enabled),
                allow_vendor_shipping_override:
                    d.allow_vendor_shipping_override === undefined
                        ? true
                        : Boolean(d.allow_vendor_shipping_override),
                old_users_enabled: Boolean(f.old_users_enabled),
                new_users_enabled: Boolean(f.new_users_enabled),
                maximum_quantity_per_product:
                    f.maximum_quantity_per_product || 10,
                flash_sale_enabled:
                    h.flash_sale_enabled === undefined
                        ? true
                        : Boolean(h.flash_sale_enabled),
                logo: null,
                favicon: null,
                existing_logo: c.logo || null,
                existing_favicon: c.favicon || null,
            });
        } catch (e) {
            notify(firstError(e), "error");
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        load();
    }, [load]);

    const save = async () => {
        const p = new FormData();
        Object.entries(form).forEach(([k, v]) => {
            if (k.startsWith("existing_")) return;
            if (["logo", "favicon"].includes(k)) {
                if (v instanceof File) p.append(k, v);
                return;
            }
            if (
                [
                    "free_shipping",
                    "weight_based_enabled",
                    "allow_vendor_shipping_override",
                    "old_users_enabled",
                    "new_users_enabled",
                    "flash_sale_enabled",
                ].includes(k)
            ) {
                p.append(k, v ? "1" : "0");
                return;
            }
            p.append(k, v ?? "");
        });
        try {
            const r = await adminService.saveSettings(p);
            notify(r.message || "Admin settings updated.");
            await load();
        } catch (e) {
            notify(firstError(e), "error");
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <AdminLoader text="Loading platform settings..." />
            </AdminLayout>
        );
    }

    const text = (key, label, type = "text") => (
        <label className="adm-field">
            <span>{label}</span>
            <input
                className="adm-input"
                type={type}
                value={form[key] || ""}
                onChange={(e) =>
                    setForm((c) => ({ ...c, [key]: e.target.value }))
                }
            />
        </label>
    );
    const check = (key, label) => (
        <label className="adm-check">
            <input
                type="checkbox"
                checked={Boolean(form[key])}
                onChange={(e) =>
                    setForm((c) => ({ ...c, [key]: e.target.checked }))
                }
            />
            {label}
        </label>
    );

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Platform Settings"
                description="Facevaly identity, homepage sections, SEO defaults, delivery configuration and checkout safeguards."
                actions={
                    <button className="adm-btn adm-btn-primary" onClick={save}>
                        <i className="fa-solid fa-floppy-disk" /> Save Settings
                    </button>
                }
            />

            <AdminCard
                title="Homepage Sections"
                description="Control which storefront homepage blocks are visible to shoppers."
            >
                <div className="adm-form-grid">
                    {check(
                        "flash_sale_enabled",
                        "Show Flash Sale section on homepage"
                    )}
                    <p className="adm-help" style={{ gridColumn: "1 / -1", margin: 0 }}>
                        When disabled, the homepage Flash Sale block is hidden and
                        `/flash-sale` returns no active sale. Existing flash-sale
                        offers stay in the database.
                    </p>
                </div>
            </AdminCard>

            <AdminCard title="Company & Contact">
                <div className="adm-form-grid">
                    {text("name", "Site / Company Name")}
                    {text("email", "Public Email", "email")}
                    {text("phone", "Phone")}
                    {text("whatsapp_number", "WhatsApp")}
                    <label className="adm-field full">
                        <span>Address</span>
                        <textarea
                            className="adm-textarea"
                            value={form.address || ""}
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    address: e.target.value,
                                }))
                            }
                        />
                    </label>
                    <label className="adm-field full">
                        <span>Company Description</span>
                        <textarea
                            className="adm-textarea"
                            value={form.company_desc || ""}
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    company_desc: e.target.value,
                                }))
                            }
                        />
                    </label>
                    <label className="adm-field">
                        <span>Logo</span>
                        <input
                            className="adm-input"
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    logo: e.target.files?.[0] || null,
                                }))
                            }
                        />
                    </label>
                    <label className="adm-field">
                        <span>Favicon</span>
                        <input
                            className="adm-input"
                            type="file"
                            accept="image/*,.ico"
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    favicon: e.target.files?.[0] || null,
                                }))
                            }
                        />
                    </label>
                </div>
            </AdminCard>

            <AdminCard title="Social Links">
                <div className="adm-form-grid">
                    {text("facebook_page_link", "Facebook")}
                    {text("messenger", "Messenger")}
                    {text("x_link", "X / Twitter")}
                    {text("instagram_link", "Instagram")}
                    {text("tiktok_link", "TikTok")}
                    {text("youtube_link", "YouTube")}
                </div>
            </AdminCard>

            <AdminCard title="Platform SEO">
                <div className="adm-form-grid">
                    <label className="adm-field full">
                        <span>Homepage Title</span>
                        <input
                            className="adm-input"
                            value={form.home_page_title || ""}
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    home_page_title: e.target.value,
                                }))
                            }
                        />
                    </label>
                    <label className="adm-field full">
                        <span>Meta Description</span>
                        <textarea
                            className="adm-textarea"
                            value={form.meta_description || ""}
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    meta_description: e.target.value,
                                }))
                            }
                        />
                    </label>
                    <label className="adm-field full">
                        <span>Meta Keywords</span>
                        <textarea
                            className="adm-textarea"
                            value={form.meta_keywords || ""}
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    meta_keywords: e.target.value,
                                }))
                            }
                        />
                    </label>
                </div>
            </AdminCard>

            <AdminCard title="Delivery Defaults">
                <div className="adm-form-grid">
                    {check("free_shipping", "Platform Free Shipping")}
                    {check("weight_based_enabled", "Enable Weight-Based Delivery")}
                    {check(
                        "allow_vendor_shipping_override",
                        "Allow Seller Delivery Overrides"
                    )}
                    <label className="adm-field">
                        <span>Platform Flat Rate</span>
                        <input
                            className="adm-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.flat_rate || 0}
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    flat_rate: e.target.value,
                                }))
                            }
                        />
                    </label>
                </div>
            </AdminCard>

            <AdminCard title="Checkout Guard">
                <div className="adm-form-grid">
                    {check(
                        "old_users_enabled",
                        "Enable Guard for Existing Customers"
                    )}
                    {check("new_users_enabled", "Enable Guard for New Customers")}
                    <label className="adm-field">
                        <span>Maximum Quantity Per Product</span>
                        <input
                            className="adm-input"
                            type="number"
                            min="1"
                            value={form.maximum_quantity_per_product || 10}
                            onChange={(e) =>
                                setForm((c) => ({
                                    ...c,
                                    maximum_quantity_per_product: e.target.value,
                                }))
                            }
                        />
                    </label>
                </div>
            </AdminCard>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 20,
                }}
            >
                <button className="adm-btn adm-btn-primary" onClick={save}>
                    <i className="fa-solid fa-floppy-disk" /> Save All Settings
                </button>
            </div>
            <AdminToast toast={toast} />
        </AdminLayout>
    );
}
