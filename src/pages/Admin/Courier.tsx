import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import AdminLayout from "./Layout";
import adminService from "../../services/adminService";

import {
    AdminBadge,
    AdminCard,
    AdminEmpty,
    AdminLoader,
    AdminMetric,
    AdminModal,
    AdminPageHeader,
    AdminToast,
    firstError,
    formatDate,
    money,
    titleCase,
} from "../../components/admin/AdminUI";

import "./admin.css";
import "./courier-admin.css";


const emptyProvider = {
    adapter: "manual",
    code: "manual",
    name: "Manual Delivery",
    base_url: "",
    tracking_url_template: "",
    supports_webhook: false,
    is_active: true,
    sort_order: 0,
};


const emptyAccount = {
    courier_provider_id: "",
    scope: "platform",
    vendor_id: "",
    name: "",
    credentials: {},
    settings: {},
    webhook_secret: "",
    pickup_store_id: "",
    pickup_store_name: "",
    pickup_contact_number: "",
    is_default: false,
    is_active: true,
};


export default function AdminCourier() {
    const [
        data,
        setData,
    ] = useState({
        providers: [],
        accounts: [],
        shipments: [],
        vendors: [],
        adapters: {},
        summary: {},
    });

    const [
        activeTab,
        setActiveTab,
    ] = useState("accounts");

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        modal,
        setModal,
    ] = useState(null);

    const [
        editId,
        setEditId,
    ] = useState(null);

    const [
        providerForm,
        setProviderForm,
    ] = useState(emptyProvider);

    const [
        accountForm,
        setAccountForm,
    ] = useState(emptyAccount);

    const [
        selectedAccount,
        setSelectedAccount,
    ] = useState(null);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        testingId,
        setTestingId,
    ] = useState(null);

    const [
        shippingForm,
        setShippingForm,
    ] = useState({
        inside_dhaka_charge: 80,
        outside_dhaka_charge: 120,
        free_shipping: false,
    });

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
                3400
            );
        },
        []
    );


    const load = useCallback(async () => {
        setLoading(true);

        try {
            const response =
                await adminService
                    .courier();

            setData(
                response.data || {}
            );

            const areas =
                response.data?.shipping_areas || {};

            setShippingForm({
                inside_dhaka_charge:
                    Number(areas.inside_dhaka_charge ?? 80),
                outside_dhaka_charge:
                    Number(areas.outside_dhaka_charge ?? 120),
                free_shipping:
                    Boolean(areas.free_shipping),
            });
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        } finally {
            setLoading(false);
        }
    }, [notify]);


    useEffect(() => {
        load();
    }, [load]);


    const providerById = useMemo(
        () =>
            Object.fromEntries(
                (data.providers || []).map(
                    (provider) => [
                        String(provider.id),
                        provider,
                    ]
                )
            ),
        [data.providers]
    );


    const currentProvider =
        providerById[
            String(
                accountForm.courier_provider_id || ""
            )
        ] || null;


    const currentAdapter =
        currentProvider?.adapter
        || "manual";


    const currentSchema =
        data.adapters?.[
            currentAdapter
        ] || {
            credential_fields: [],
            setting_fields: [],
        };


    const openProvider = (
        row = null
    ) => {
        setEditId(
            row?.id || null
        );

        if (row) {
            setProviderForm({
                adapter:
                    row.adapter || "generic",
                code:
                    row.code || "",
                name:
                    row.name || "",
                base_url:
                    row.base_url || "",
                tracking_url_template:
                    row.tracking_url_template || "",
                supports_webhook:
                    Boolean(row.supports_webhook),
                is_active:
                    Boolean(row.is_active),
                sort_order:
                    Number(row.sort_order || 0),
            });
        } else {
            setProviderForm(
                emptyProvider
            );
        }

        setModal("provider");
    };


    const changeAdapter = (
        adapter
    ) => {
        const schema =
            data.adapters?.[adapter];

        setProviderForm(
            (current) => ({
                ...current,
                adapter,
                code:
                    editId
                        ? current.code
                        : adapter === "generic"
                            ? ""
                            : adapter,
                name:
                    editId
                        ? current.name
                        : schema?.label || "",
                base_url:
                    editId
                        ? current.base_url
                        : schema?.default_base_url || "",
            })
        );
    };


    const saveProvider = async () => {
        setSaving(true);

        try {
            const response =
                await adminService
                    .saveCourierProvider(
                        editId,
                        {
                            ...providerForm,
                            sort_order:
                                Number(
                                    providerForm.sort_order || 0
                                ),
                        }
                    );

            notify(response.message);
            setModal(null);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        } finally {
            setSaving(false);
        }
    };


    const toggleProvider = async (
        row
    ) => {
        try {
            const response =
                await adminService
                    .toggleCourierProvider(
                        row.id,
                        !row.is_active
                    );

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const deleteProvider = async (
        row
    ) => {
        if (
            !window.confirm(
                `Delete courier provider "${row.name}"?`
            )
        ) {
            return;
        }

        try {
            const response =
                await adminService
                    .deleteCourierProvider(
                        row.id
                    );

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const openAccount = (
        row = null
    ) => {
        setEditId(
            row?.id || null
        );

        setSelectedAccount(
            row || null
        );

        if (row) {
            setAccountForm({
                courier_provider_id:
                    String(
                        row.courier_provider_id
                    ),
                scope:
                    row.scope || "platform",
                vendor_id:
                    row.vendor_id
                        ? String(row.vendor_id)
                        : "",
                name:
                    row.name || "",
                credentials: {},
                settings:
                    row.settings || {},
                webhook_secret: "",
                pickup_store_id:
                    row.pickup_store_id || "",
                pickup_store_name:
                    row.pickup_store_name || "",
                pickup_contact_number:
                    row.pickup_contact_number || "",
                is_default:
                    Boolean(row.is_default),
                is_active:
                    Boolean(row.is_active),
            });
        } else {
            const firstProvider =
                (data.providers || [])
                    .find(
                        (provider) =>
                            provider.is_active
                    )
                || data.providers?.[0];

            setAccountForm({
                ...emptyAccount,
                courier_provider_id:
                    firstProvider
                        ? String(firstProvider.id)
                        : "",
            });

            setSelectedAccount(null);
        }

        setModal("account");
    };


    const setCredential = (
        key,
        value
    ) => {
        setAccountForm(
            (current) => ({
                ...current,
                credentials: {
                    ...current.credentials,
                    [key]: value,
                },
            })
        );
    };


    const setSetting = (
        key,
        value,
        type = "text"
    ) => {
        setAccountForm(
            (current) => ({
                ...current,
                settings: {
                    ...current.settings,
                    [key]:
                        type === "number"
                            ? (
                                value === ""
                                    ? ""
                                    : Number(value)
                            )
                            : value,
                },
            })
        );
    };


    const saveAccount = async () => {
        if (
            !accountForm.courier_provider_id
        ) {
            notify(
                "Select a courier provider.",
                "error"
            );

            return;
        }

        setSaving(true);

        try {
            const response =
                await adminService
                    .saveCourierAccount(
                        editId,
                        {
                            ...accountForm,
                            courier_provider_id:
                                Number(
                                    accountForm.courier_provider_id
                                ),
                            vendor_id:
                                accountForm.scope === "vendor"
                                && accountForm.vendor_id
                                    ? Number(accountForm.vendor_id)
                                    : null,
                        }
                    );

            notify(response.message);
            setModal(null);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        } finally {
            setSaving(false);
        }
    };


    const testAccount = async (
        row
    ) => {
        setTestingId(row.id);

        try {
            const response =
                await adminService
                    .testCourierAccount(
                        row.id
                    );

            notify(
                response.message,
                response.success
                    ? (
                        response.data?.live_tested
                            ? "success"
                            : "warning"
                    )
                    : "error"
            );

            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        } finally {
            setTestingId(null);
        }
    };


    const toggleAccount = async (
        row
    ) => {
        try {
            const response =
                await adminService
                    .toggleCourierAccount(
                        row.id,
                        !row.is_active
                    );

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const makeDefault = async (
        row
    ) => {
        try {
            const response =
                await adminService
                    .makeDefaultCourierAccount(
                        row.id
                    );

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const deleteAccount = async (
        row
    ) => {
        if (
            !window.confirm(
                `Move courier API account "${row.name}" to trash?`
            )
        ) {
            return;
        }

        try {
            const response =
                await adminService
                    .deleteCourierAccount(
                        row.id
                    );

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const restoreAccount = async (
        row
    ) => {
        try {
            const response =
                await adminService
                    .restoreCourierAccount(
                        row.id
                    );

            notify(response.message);
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        }
    };


    const saveShippingAreas = async () => {
        try {
            setSaving(true);

            const response =
                await adminService.updateCourierShippingAreas({
                    inside_dhaka_charge:
                        Number(shippingForm.inside_dhaka_charge || 0),
                    outside_dhaka_charge:
                        Number(shippingForm.outside_dhaka_charge || 0),
                    free_shipping:
                        Boolean(shippingForm.free_shipping),
                });

            notify(
                response.message
                || "Shipping area pricing updated."
            );
            await load();
        } catch (exception) {
            notify(
                firstError(exception),
                "error"
            );
        } finally {
            setSaving(false);
        }
    };


    return (
        <AdminLayout>
            <AdminPageHeader
                title="Courier API Center"
                description="Add Pathao, SteadFast, Manual or compatible REST courier APIs dynamically from Admin. API credentials remain encrypted and never return to the browser."
                actions={
                    <>
                        <button
                            className="adm-btn"
                            type="button"
                            onClick={() => openProvider()}
                        >
                            <i className="fa-solid fa-truck-fast" />
                            Add Provider
                        </button>

                        <button
                            className="adm-btn adm-btn-primary"
                            type="button"
                            onClick={() => openAccount()}
                        >
                            <i className="fa-solid fa-key" />
                            Add API Account
                        </button>
                    </>
                }
            />

            <div className="adm-metric-grid">
                <AdminMetric
                    icon="fa-solid fa-truck-fast"
                    label="Courier Providers"
                    value={data.summary?.providers || 0}
                />

                <AdminMetric
                    icon="fa-solid fa-circle-check"
                    label="Active Providers"
                    value={data.summary?.active_providers || 0}
                    tone="green"
                />

                <AdminMetric
                    icon="fa-solid fa-key"
                    label="API Accounts"
                    value={data.summary?.accounts || 0}
                    tone="blue"
                />

                <AdminMetric
                    icon="fa-solid fa-box"
                    label="Courier Shipments"
                    value={data.summary?.shipments || 0}
                    tone="purple"
                />
            </div>

            <div className="adm-tabs courier-tabs">
                <button
                    type="button"
                    className={
                        activeTab === "shipping"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("shipping")
                    }
                >
                    Shipping Areas
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "accounts"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("accounts")
                    }
                >
                    API Accounts
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "providers"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("providers")
                    }
                >
                    Providers
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "shipments"
                            ? "active"
                            : ""
                    }
                    onClick={() =>
                        setActiveTab("shipments")
                    }
                >
                    Shipments
                </button>
            </div>

            <div className="courier-tab-gap" />

            {loading ? (
                <AdminLoader
                    text="Loading courier configuration..."
                />
            ) : activeTab === "shipping" ? (
                <AdminCard
                    title="Delivery Area Pricing"
                    description="Set checkout delivery charges for inside and outside Dhaka. These amounts appear on the storefront checkout page and are added to order totals."
                >
                    <div className="courier-shipping-form">
                        <label className="courier-shipping-field">
                            <span>
                                Inside Dhaka charge (BDT)
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={shippingForm.inside_dhaka_charge}
                                onChange={(event) =>
                                    setShippingForm((current) => ({
                                        ...current,
                                        inside_dhaka_charge:
                                            Number(event.target.value || 0),
                                    }))
                                }
                            />
                            <small>
                                Applied when customer selects ঢাকার ভিতরে at checkout.
                            </small>
                        </label>

                        <label className="courier-shipping-field">
                            <span>
                                Outside Dhaka charge (BDT)
                            </span>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={shippingForm.outside_dhaka_charge}
                                onChange={(event) =>
                                    setShippingForm((current) => ({
                                        ...current,
                                        outside_dhaka_charge:
                                            Number(event.target.value || 0),
                                    }))
                                }
                            />
                            <small>
                                Applied when customer selects ঢাকার বাইরে at checkout.
                            </small>
                        </label>

                        <label className="courier-shipping-toggle">
                            <input
                                type="checkbox"
                                checked={shippingForm.free_shipping}
                                onChange={(event) =>
                                    setShippingForm((current) => ({
                                        ...current,
                                        free_shipping:
                                            event.target.checked,
                                    }))
                                }
                            />
                            <span>
                                Enable free shipping for all delivery areas
                            </span>
                        </label>

                        <div className="courier-shipping-actions">
                            <button
                                type="button"
                                className="adm-btn adm-btn-primary"
                                disabled={saving}
                                onClick={saveShippingAreas}
                            >
                                {saving ? "Saving..." : "Save pricing"}
                            </button>
                        </div>
                    </div>
                </AdminCard>
            ) : activeTab === "accounts" ? (
                <AdminCard
                    title="Courier API Accounts"
                    description="Platform accounts are available to all sellers. Vendor accounts are limited to the selected seller."
                >
                    {!data.accounts?.length ? (
                        <AdminEmpty
                            title="No courier API accounts"
                            description="Create a platform or seller-specific courier account."
                        />
                    ) : (
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Account</th>
                                        <th>Provider</th>
                                        <th>Scope</th>
                                        <th>Credentials</th>
                                        <th>Default</th>
                                        <th>Status</th>
                                        <th>Last Test</th>
                                        <th>Shipments</th>
                                        <th />
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.accounts.map(
                                        (row) => (
                                            <tr key={row.id}>
                                                <td data-label="Account">
                                                    <strong>
                                                        {row.name}
                                                    </strong>

                                                    <span className="adm-table-sub">
                                                        #{row.id}
                                                    </span>
                                                </td>

                                                <td data-label="Provider">
                                                    <strong>
                                                        {row.provider || "—"}
                                                    </strong>

                                                    <span className="adm-table-sub">
                                                        {row.provider_code || "—"}
                                                    </span>
                                                </td>

                                                <td data-label="Scope">
                                                    <AdminBadge
                                                        value={
                                                            row.scope === "platform"
                                                                ? "platform"
                                                                : "vendor"
                                                        }
                                                    />

                                                    <span className="adm-table-sub">
                                                        {row.scope === "platform"
                                                            ? "All sellers"
                                                            : row.vendor || "Seller"}
                                                    </span>
                                                </td>

                                                <td data-label="Credentials">
                                                    <CredentialSummary
                                                        status={
                                                            row.credential_status || {}
                                                        }
                                                    />
                                                </td>

                                                <td data-label="Default">
                                                    <AdminBadge
                                                        value={
                                                            row.is_default
                                                                ? "active"
                                                                : "inactive"
                                                        }
                                                    />
                                                </td>

                                                <td data-label="Status">
                                                    <AdminBadge
                                                        value={
                                                            row.deleted_at
                                                                ? "deleted"
                                                                : row.is_active
                                                                    ? "active"
                                                                    : "inactive"
                                                        }
                                                    />
                                                </td>

                                                <td data-label="Last Test">
                                                    {formatDate(
                                                        row.last_authenticated_at
                                                    )}
                                                </td>

                                                <td data-label="Shipments">
                                                    {row.shipments_count || 0}
                                                </td>

                                                <td data-label="Action">
                                                    <div className="adm-table-actions courier-actions">
                                                        {row.deleted_at ? (
                                                            <button
                                                                type="button"
                                                                className="adm-btn"
                                                                onClick={() =>
                                                                    restoreAccount(row)
                                                                }
                                                            >
                                                                Restore
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="adm-btn"
                                                                    onClick={() =>
                                                                        openAccount(row)
                                                                    }
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="adm-btn"
                                                                    disabled={
                                                                        testingId === row.id
                                                                    }
                                                                    onClick={() =>
                                                                        testAccount(row)
                                                                    }
                                                                >
                                                                    {testingId === row.id
                                                                        ? "Testing..."
                                                                        : "Test API"}
                                                                </button>

                                                                {!row.is_default && (
                                                                    <button
                                                                        type="button"
                                                                        className="adm-btn"
                                                                        onClick={() =>
                                                                            makeDefault(row)
                                                                        }
                                                                    >
                                                                        Default
                                                                    </button>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    className="adm-btn"
                                                                    onClick={() =>
                                                                        toggleAccount(row)
                                                                    }
                                                                >
                                                                    {row.is_active
                                                                        ? "Disable"
                                                                        : "Enable"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="adm-btn adm-btn-danger"
                                                                    onClick={() =>
                                                                        deleteAccount(row)
                                                                    }
                                                                >
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AdminCard>
            ) : activeTab === "providers" ? (
                <AdminCard
                    title="Courier Providers"
                    description="A Provider chooses the courier driver/adapter. API credentials are stored separately in Accounts."
                >
                    {!data.providers?.length ? (
                        <AdminEmpty
                            title="No courier providers"
                        />
                    ) : (
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Provider</th>
                                        <th>Adapter</th>
                                        <th>Base URL</th>
                                        <th>Accounts</th>
                                        <th>Webhook</th>
                                        <th>Status</th>
                                        <th>Sort</th>
                                        <th />
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.providers.map(
                                        (row) => (
                                            <tr key={row.id}>
                                                <td data-label="Provider">
                                                    <strong>
                                                        {row.name}
                                                    </strong>

                                                    <span className="adm-table-sub">
                                                        {row.code}
                                                    </span>
                                                </td>

                                                <td data-label="Adapter">
                                                    {data.adapters?.[
                                                        row.adapter
                                                    ]?.label
                                                    || titleCase(row.adapter)}
                                                </td>

                                                <td data-label="Base URL">
                                                    <span className="courier-url">
                                                        {row.base_url || "Local / none"}
                                                    </span>
                                                </td>

                                                <td data-label="Accounts">
                                                    {row.accounts_count || 0}
                                                </td>

                                                <td data-label="Webhook">
                                                    <AdminBadge
                                                        value={
                                                            row.supports_webhook
                                                                ? "active"
                                                                : "inactive"
                                                        }
                                                    />
                                                </td>

                                                <td data-label="Status">
                                                    <AdminBadge
                                                        value={
                                                            row.is_active
                                                                ? "active"
                                                                : "inactive"
                                                        }
                                                    />
                                                </td>

                                                <td data-label="Sort">
                                                    {row.sort_order}
                                                </td>

                                                <td data-label="Action">
                                                    <div className="adm-table-actions courier-actions">
                                                        <button
                                                            type="button"
                                                            className="adm-btn"
                                                            onClick={() =>
                                                                openProvider(row)
                                                            }
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="adm-btn"
                                                            onClick={() =>
                                                                toggleProvider(row)
                                                            }
                                                        >
                                                            {row.is_active
                                                                ? "Disable"
                                                                : "Enable"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="adm-btn adm-btn-danger"
                                                            onClick={() =>
                                                                deleteProvider(row)
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
                </AdminCard>
            ) : (
                <AdminCard
                    title="Recent Courier Shipments"
                    description="Latest 50 marketplace courier submissions."
                >
                    {!data.shipments?.length ? (
                        <AdminEmpty
                            title="No courier shipments"
                        />
                    ) : (
                        <div className="adm-table-wrap">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Seller</th>
                                        <th>Courier</th>
                                        <th>Tracking</th>
                                        <th>COD</th>
                                        <th>Charge</th>
                                        <th>Status</th>
                                        <th>Submitted</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {data.shipments.map(
                                        (row) => (
                                            <tr key={row.id}>
                                                <td data-label="Order">
                                                    <strong>
                                                        {row.vendor_order_number || `#${row.id}`}
                                                    </strong>
                                                </td>

                                                <td data-label="Seller">
                                                    {row.vendor || "—"}
                                                </td>

                                                <td data-label="Courier">
                                                    <strong>
                                                        {row.provider || "—"}
                                                    </strong>

                                                    <span className="adm-table-sub">
                                                        {row.account || "—"}
                                                    </span>
                                                </td>

                                                <td data-label="Tracking">
                                                    {row.tracking_url ? (
                                                        <a
                                                            href={row.tracking_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="courier-track-link"
                                                        >
                                                            {row.tracking_code
                                                                || row.consignment_id
                                                                || "Track"}
                                                        </a>
                                                    ) : (
                                                        row.tracking_code
                                                        || row.consignment_id
                                                        || "—"
                                                    )}
                                                </td>

                                                <td data-label="COD">
                                                    {money(row.cod_amount)}
                                                </td>

                                                <td data-label="Charge">
                                                    {money(row.provider_charge)}
                                                </td>

                                                <td data-label="Status">
                                                    <AdminBadge
                                                        value={row.status}
                                                    />
                                                </td>

                                                <td data-label="Submitted">
                                                    {formatDate(
                                                        row.submitted_at
                                                        || row.created_at
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </AdminCard>
            )}

            <AdminModal
                open={modal === "provider"}
                title={
                    editId
                        ? "Edit Courier Provider"
                        : "Add Courier Provider"
                }
                size="large"
                onClose={() => setModal(null)}
            >
                <div className="adm-form-grid">
                    <label className="adm-field">
                        <span>Adapter / Driver</span>

                        <select
                            className="adm-select"
                            value={providerForm.adapter}
                            onChange={(event) =>
                                changeAdapter(
                                    event.target.value
                                )
                            }
                        >
                            {Object.entries(
                                data.adapters || {}
                            ).map(
                                ([key, schema]) => (
                                    <option
                                        key={key}
                                        value={key}
                                    >
                                        {schema.label}
                                    </option>
                                )
                            )}
                        </select>
                    </label>

                    <label className="adm-field">
                        <span>Provider Code</span>

                        <input
                            className="adm-input"
                            value={providerForm.code}
                            onChange={(event) =>
                                setProviderForm(
                                    (current) => ({
                                        ...current,
                                        code: event.target.value
                                            .toLowerCase()
                                            .replace(/[^a-z0-9_-]/g, ""),
                                    })
                                )
                            }
                            placeholder="e.g. pathao, steadfast, custom_courier"
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Provider Name</span>

                        <input
                            className="adm-input"
                            value={providerForm.name}
                            onChange={(event) =>
                                setProviderForm(
                                    (current) => ({
                                        ...current,
                                        name: event.target.value,
                                    })
                                )
                            }
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Base API URL</span>

                        <input
                            className="adm-input"
                            value={providerForm.base_url}
                            onChange={(event) =>
                                setProviderForm(
                                    (current) => ({
                                        ...current,
                                        base_url: event.target.value,
                                    })
                                )
                            }
                            placeholder="https://..."
                        />
                    </label>

                    <label className="adm-field full">
                        <span>Tracking URL Template</span>

                        <input
                            className="adm-input"
                            value={providerForm.tracking_url_template}
                            onChange={(event) =>
                                setProviderForm(
                                    (current) => ({
                                        ...current,
                                        tracking_url_template:
                                            event.target.value,
                                    })
                                )
                            }
                            placeholder="https://courier.com/track/{tracking_code}"
                        />

                        <small>
                            Supported tokens: {"{tracking_code}"}, {"{consignment_id}"}, {"{id}"}.
                        </small>
                    </label>

                    <label className="adm-field">
                        <span>Sort Order</span>

                        <input
                            className="adm-input"
                            type="number"
                            min="0"
                            value={providerForm.sort_order}
                            onChange={(event) =>
                                setProviderForm(
                                    (current) => ({
                                        ...current,
                                        sort_order: event.target.value,
                                    })
                                )
                            }
                        />
                    </label>

                    <div className="courier-check-stack">
                        <label className="adm-check">
                            <input
                                type="checkbox"
                                checked={providerForm.supports_webhook}
                                onChange={(event) =>
                                    setProviderForm(
                                        (current) => ({
                                            ...current,
                                            supports_webhook:
                                                event.target.checked,
                                        })
                                    )
                                }
                            />
                            Supports Webhook
                        </label>

                        <label className="adm-check">
                            <input
                                type="checkbox"
                                checked={providerForm.is_active}
                                onChange={(event) =>
                                    setProviderForm(
                                        (current) => ({
                                            ...current,
                                            is_active:
                                                event.target.checked,
                                        })
                                    )
                                }
                            />
                            Active
                        </label>
                    </div>

                    {providerForm.adapter === "generic" && (
                        <div className="courier-warning full">
                            <i className="fa-solid fa-circle-info" />

                            <div>
                                <strong>
                                    Generic REST adapter
                                </strong>

                                <span>
                                    Use this only when the courier accepts the existing DeliveryExpress-compatible request payload. A courier with a different API contract needs its own Laravel CourierDriver implementation.
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="adm-modal-footer">
                    <button
                        type="button"
                        className="adm-btn"
                        onClick={() => setModal(null)}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="adm-btn adm-btn-primary"
                        disabled={saving}
                        onClick={saveProvider}
                    >
                        {saving
                            ? "Saving..."
                            : "Save Provider"}
                    </button>
                </div>
            </AdminModal>

            <AdminModal
                open={modal === "account"}
                title={
                    editId
                        ? "Edit Courier API Account"
                        : "Add Courier API Account"
                }
                size="xl"
                onClose={() => setModal(null)}
            >
                <div className="courier-account-grid">
                    <div>
                        <div className="adm-form-grid">
                            <label className="adm-field">
                                <span>Courier Provider</span>

                                <select
                                    className="adm-select"
                                    value={accountForm.courier_provider_id}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                courier_provider_id:
                                                    event.target.value,
                                                credentials: {},
                                                settings: {},
                                            })
                                        )
                                    }
                                >
                                    <option value="">
                                        Select Provider
                                    </option>

                                    {(data.providers || []).map(
                                        (provider) => (
                                            <option
                                                value={provider.id}
                                                key={provider.id}
                                            >
                                                {provider.name}
                                                {!provider.is_active
                                                    ? " (Inactive)"
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <label className="adm-field">
                                <span>Account Name</span>

                                <input
                                    className="adm-input"
                                    value={accountForm.name}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                name: event.target.value,
                                            })
                                        )
                                    }
                                    placeholder="e.g. Facevaly Pathao Main"
                                />
                            </label>

                            <label className="adm-field">
                                <span>Account Scope</span>

                                <select
                                    className="adm-select"
                                    value={accountForm.scope}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                scope: event.target.value,
                                                vendor_id:
                                                    event.target.value === "platform"
                                                        ? ""
                                                        : current.vendor_id,
                                            })
                                        )
                                    }
                                >
                                    <option value="platform">
                                        Platform — All Sellers
                                    </option>

                                    <option value="vendor">
                                        One Seller Only
                                    </option>
                                </select>
                            </label>

                            {accountForm.scope === "vendor" && (
                                <label className="adm-field">
                                    <span>Seller</span>

                                    <select
                                        className="adm-select"
                                        value={accountForm.vendor_id}
                                        onChange={(event) =>
                                            setAccountForm(
                                                (current) => ({
                                                    ...current,
                                                    vendor_id:
                                                        event.target.value,
                                                })
                                            )
                                        }
                                    >
                                        <option value="">
                                            Select Seller
                                        </option>

                                        {(data.vendors || []).map(
                                            (vendor) => (
                                                <option
                                                    key={vendor.id}
                                                    value={vendor.id}
                                                >
                                                    {vendor.name}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </label>
                            )}
                        </div>

                        <div className="courier-form-section">
                            <div className="courier-form-section-head">
                                <i className="fa-solid fa-key" />
                                <div>
                                    <strong>
                                        API Credentials
                                    </strong>

                                    <span>
                                        Stored encrypted. Existing secret values are never returned to React.
                                    </span>
                                </div>
                            </div>

                            {!currentSchema.credential_fields?.length ? (
                                <div className="courier-no-fields">
                                    This adapter does not require API credentials.
                                </div>
                            ) : (
                                <div className="adm-form-grid">
                                    {currentSchema.credential_fields.map(
                                        (field) => {
                                            const configured =
                                                selectedAccount
                                                    ?.credential_status
                                                    ?.[field.key];

                                            return (
                                                <label
                                                    className="adm-field"
                                                    key={field.key}
                                                >
                                                    <span>
                                                        {field.label}
                                                        {field.required
                                                            ? " *"
                                                            : ""}
                                                    </span>

                                                    <input
                                                        className="adm-input"
                                                        type={
                                                            field.type === "password"
                                                                ? "password"
                                                                : field.type || "text"
                                                        }
                                                        value={
                                                            accountForm.credentials
                                                                ?.[field.key]
                                                            || ""
                                                        }
                                                        onChange={(event) =>
                                                            setCredential(
                                                                field.key,
                                                                event.target.value
                                                            )
                                                        }
                                                        autoComplete="new-password"
                                                        placeholder={
                                                            configured
                                                                ? "Configured — leave blank to keep"
                                                                : `Enter ${field.label}`
                                                        }
                                                    />

                                                    {configured && (
                                                        <small className="courier-secret-ok">
                                                            <i className="fa-solid fa-lock" />
                                                            Existing value is configured.
                                                        </small>
                                                    )}
                                                </label>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="courier-form-section">
                            <div className="courier-form-section-head">
                                <i className="fa-solid fa-sliders" />
                                <div>
                                    <strong>
                                        Courier Settings
                                    </strong>

                                    <span>
                                        Driver-specific non-secret options.
                                    </span>
                                </div>
                            </div>

                            {!currentSchema.setting_fields?.length ? (
                                <div className="courier-no-fields">
                                    No extra settings are required.
                                </div>
                            ) : (
                                <div className="adm-form-grid">
                                    {currentSchema.setting_fields.map(
                                        (field) => (
                                            <label
                                                className="adm-field"
                                                key={field.key}
                                            >
                                                <span>
                                                    {field.label}
                                                    {field.required
                                                        ? " *"
                                                        : ""}
                                                </span>

                                                <input
                                                    className="adm-input"
                                                    type={
                                                        field.type || "text"
                                                    }
                                                    value={
                                                        accountForm.settings
                                                            ?.[field.key]
                                                        ?? field.default
                                                        ?? ""
                                                    }
                                                    onChange={(event) =>
                                                        setSetting(
                                                            field.key,
                                                            event.target.value,
                                                            field.type
                                                        )
                                                    }
                                                />
                                            </label>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="courier-side-card">
                            <h4>
                                Pickup / Store
                            </h4>

                            <label className="adm-field">
                                <span>Pickup Store ID</span>

                                <input
                                    className="adm-input"
                                    value={accountForm.pickup_store_id}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                pickup_store_id:
                                                    event.target.value,
                                            })
                                        )
                                    }
                                />
                            </label>

                            <label className="adm-field">
                                <span>Pickup Store Name</span>

                                <input
                                    className="adm-input"
                                    value={accountForm.pickup_store_name}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                pickup_store_name:
                                                    event.target.value,
                                            })
                                        )
                                    }
                                />
                            </label>

                            <label className="adm-field">
                                <span>Pickup Contact</span>

                                <input
                                    className="adm-input"
                                    value={accountForm.pickup_contact_number}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                pickup_contact_number:
                                                    event.target.value,
                                            })
                                        )
                                    }
                                />
                            </label>
                        </div>

                        <div className="courier-side-card">
                            <h4>
                                Webhook & Status
                            </h4>

                            <label className="adm-field">
                                <span>Webhook Secret</span>

                                <input
                                    className="adm-input"
                                    type="password"
                                    value={accountForm.webhook_secret}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                webhook_secret:
                                                    event.target.value,
                                            })
                                        )
                                    }
                                    placeholder={
                                        selectedAccount?.has_webhook_secret
                                            ? "Configured — leave blank to keep"
                                            : "Optional"
                                    }
                                />
                            </label>

                            <label className="adm-check">
                                <input
                                    type="checkbox"
                                    checked={accountForm.is_active}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                is_active:
                                                    event.target.checked,
                                            })
                                        )
                                    }
                                />
                                Active API Account
                            </label>

                            <label className="adm-check">
                                <input
                                    type="checkbox"
                                    checked={accountForm.is_default}
                                    onChange={(event) =>
                                        setAccountForm(
                                            (current) => ({
                                                ...current,
                                                is_default:
                                                    event.target.checked,
                                            })
                                        )
                                    }
                                />
                                Default for this scope
                            </label>
                        </div>

                        <div className="courier-side-note">
                            <i className="fa-solid fa-shield-halved" />

                            <p>
                                Platform scope makes this account available in every seller's courier picker. Vendor scope limits it to one seller.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="adm-modal-footer">
                    <button
                        type="button"
                        className="adm-btn"
                        onClick={() => setModal(null)}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="adm-btn adm-btn-primary"
                        disabled={saving}
                        onClick={saveAccount}
                    >
                        {saving
                            ? "Saving..."
                            : "Save API Account"}
                    </button>
                </div>
            </AdminModal>

            <AdminToast toast={toast} />
        </AdminLayout>
    );
}


function CredentialSummary({
    status,
}) {
    const entries =
        Object.entries(
            status || {}
        );

    if (!entries.length) {
        return (
            <span className="courier-credential-none">
                Not required
            </span>
        );
    }

    const configured =
        entries.filter(
            ([, value]) => Boolean(value)
        ).length;

    return (
        <span
            className={
                configured === entries.length
                    ? "courier-credential-ready"
                    : "courier-credential-missing"
            }
        >
            <i
                className={
                    configured === entries.length
                        ? "fa-solid fa-lock"
                        : "fa-solid fa-triangle-exclamation"
                }
            />

            {configured}/{entries.length} configured
        </span>
    );
}
