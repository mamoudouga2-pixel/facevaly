import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import SellerLayout from "./Layout";
import sellerOrderService from "../../services/sellerOrderService";
import { mediaUrl } from "../../config/api";
import "./seller-orders.css";

const STATUS_COLORS = {
    incomplete: ["#fff7ed", "#c2410c"],
    new_order: ["#eff6ff", "#2563eb"],
    confirmed: ["#ecfdf5", "#059669"],
    processing: ["#fefce8", "#a16207"],
    ready_to_ship: ["#ecfeff", "#0891b2"],
    dispatched: ["#f3e8ff", "#7c3aed"],
    delivered: ["#f0fdf4", "#15803d"],
    completed: ["#ecfdf5", "#047857"],
    hold: ["#fff7ed", "#ea580c"],
    ship_later: ["#f0fdfa", "#0f766e"],
    return: ["#fffbeb", "#d97706"],
    cancelled: ["#fff1f2", "#dc2626"],
    deleted: ["#f1f5f9", "#475569"],
};

const EMPTY_EDITOR = {
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    district_name: "",
    thana_name: "",
    address: "",
    postal_code: "",
    assigned_to: "",
    payment_method: "cash_on_delivery",
    payment_status: "pending",
    advance_amount: 0,
    delivery_charge: 0,
    extra_charge: 0,
    customer_note: "",
    vendor_note: "",
    status: "confirmed",
};

const money = (value) =>
    Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });

const titleCase = (value = "") =>
    String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (value) => {
    if (!value) return "—";

    try {
        return new Intl.DateTimeFormat("en-BD", {
            timeZone: "Asia/Dhaka",
            day: "2-digit",
            month: "short",
            year: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(value));
    } catch {
        return value;
    }
};

const normalizePhone = (phone) => {
    let digits = String(phone || "").replace(/\D+/g, "");

    if (digits.startsWith("880")) {
        digits = `0${digits.slice(3)}`;
    } else if (digits.startsWith("88") && digits.length === 13) {
        digits = digits.slice(2);
    }

    return digits;
};

const whatsappPhone = (phone) => {
    const local = normalizePhone(phone);
    return local ? `88${local}` : "";
};

function Modal({ open, title, children, onClose, size = "medium" }) {
    if (!open) return null;

    return (
        <div
            className="som-modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className={`som-modal som-modal-${size}`}>
                <div className="som-modal-head">
                    <h3>{title}</h3>

                    <button
                        type="button"
                        className="som-modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="som-modal-body">{children}</div>
            </div>
        </div>
    );
}

function FraudReport({ data }) {
    const summary = data.summary || {};
    const ratio = Number(summary.success_ratio || 0);
    const couriers = Array.isArray(data.couriers) ? data.couriers : [];
    const reports = Array.isArray(data.reports) ? data.reports : [];
    const history = Array.isArray(data.order_history)
        ? data.order_history
        : [];

    return (
        <div className="som-fraud-report">
            <div className="som-fraud-summary">
                <article className="primary">
                    <span>Success Rate</span>
                    <strong>{money(ratio)}%</strong>
                    <div>
                        <i
                            style={{
                                width: `${Math.min(100, Math.max(0, ratio))}%`,
                            }}
                        />
                    </div>
                </article>

                <article>
                    <span>Total</span>
                    <strong>{money(summary.total_parcel)}</strong>
                </article>

                <article>
                    <span>Delivered</span>
                    <strong>{money(summary.success_parcel)}</strong>
                </article>

                <article>
                    <span>Returned</span>
                    <strong>{money(summary.cancelled_parcel)}</strong>
                </article>
            </div>

            <h4>Courier Breakdown</h4>

            <div className="som-fraud-table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Courier</th>
                            <th>Total</th>
                            <th>Delivered</th>
                            <th>Returned</th>
                            <th>Success</th>
                        </tr>
                    </thead>
                    <tbody>
                        {couriers.length ? (
                            couriers.map((courier, index) => (
                                <tr key={`${courier.code || "c"}-${index}`}>
                                    <td>{courier.name || courier.code}</td>
                                    <td>{money(courier.total_parcel)}</td>
                                    <td>{money(courier.success_parcel)}</td>
                                    <td>{money(courier.cancelled_parcel)}</td>
                                    <td>{money(courier.success_ratio)}%</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">No courier history returned.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <h4>Fraud Reports</h4>

            {reports.length ? (
                reports.map((report, index) => (
                    <div className="som-fraud-warning" key={index}>
                        <strong>
                            {report.courierName || "Merchant report"}
                        </strong>
                        <p>{report.details || "No details"}</p>
                    </div>
                ))
            ) : (
                <div className="som-muted">No fraud reports.</div>
            )}

            <h4>
                Seller Order History{" "}
                {Number(data.duplicate_count || 0) > 0 && (
                    <span className="som-duplicate-badge">
                        {data.duplicate_count} possible duplicate
                    </span>
                )}
            </h4>

            <div className="som-history">
                {history.length ? (
                    history.map((order) => (
                        <div key={order.id}>
                            <strong>{order.vendor_order_number}</strong>
                            <span>{order.status_label}</span>
                            <span>৳{money(order.total_amount)}</span>
                            <small>{order.placed_at || "—"}</small>
                        </div>
                    ))
                ) : (
                    <div className="som-muted">No previous seller orders.</div>
                )}
            </div>
        </div>
    );
}

export default function SellerOrders() {
    const [searchParams] = useSearchParams();
    const initialStatus = searchParams.get("status") || "all";
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({});
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: 0,
        to: 0,
    });
    const [filterOptions, setFilterOptions] = useState({
        statuses: [],
        staff: [],
        courier_accounts: [],
    });

    const [filters, setFilters] = useState({
        status: initialStatus,
        q: "",
        employee: "",
        date_from: "",
        date_to: "",
        per_page: 25,
        page: 1,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState(null);
    const [selected, setSelected] = useState([]);
    const [rowBusy, setRowBusy] = useState({});

    const [detail, setDetail] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const [noteOrder, setNoteOrder] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [noteOpen, setNoteOpen] = useState(false);

    const [fraudOpen, setFraudOpen] = useState(false);
    const [fraudPhone, setFraudPhone] = useState("");
    const [fraudOrderId, setFraudOrderId] = useState(null);
    const [fraudData, setFraudData] = useState(null);
    const [fraudLoading, setFraudLoading] = useState(false);

    const [courierOrder, setCourierOrder] = useState(null);
    const [courierAccountId, setCourierAccountId] = useState("");
    const [courierOpen, setCourierOpen] = useState(false);

    const [courierDetail, setCourierDetail] = useState(null);
    const [courierDetailOpen, setCourierDetailOpen] = useState(false);

    const [bulkStatus, setBulkStatus] = useState("");
    const [bulkEmployee, setBulkEmployee] = useState("");
    const [bulkCourier, setBulkCourier] = useState("");

    const [editorOpen, setEditorOpen] = useState(false);
    const [editorId, setEditorId] = useState(null);
    const [editorForm, setEditorForm] = useState(EMPTY_EDITOR);
    const [editorItems, setEditorItems] = useState([]);
    const [editorSaving, setEditorSaving] = useState(false);
    const [duplicateInfo, setDuplicateInfo] = useState(null);

    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [productResults, setProductResults] = useState([]);
    const [productLoading, setProductLoading] = useState(false);

    const [districts, setDistricts] = useState([]);
    const [upazilas, setUpazilas] = useState([]);

    const fraudCache = useRef(new Map());
    const duplicateTimer = useRef(null);
    const productTimer = useRef(null);

    const notify = useCallback((message, type = "success") => {
        setToast({ message, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const loadOrders = useCallback(
        async (nextFilters = filters) => {
            setLoading(true);
            setError("");

            try {
                const response = await sellerOrderService.list(nextFilters);
                setOrders(response.data || []);
                setStats(response.stats || {});
                setMeta(response.meta || {});
                setFilterOptions(response.filters || {});
                setSelected([]);
            } catch (exception) {
                setError(exception.message || "Orders could not be loaded.");
            } finally {
                setLoading(false);
            }
        },
        [filters]
    );

    useEffect(() => {
        loadOrders(filters);
    }, [
        filters.status,
        filters.employee,
        filters.date_from,
        filters.date_to,
        filters.per_page,
        filters.page,
    ]);

    const submitSearch = (event) => {
        event.preventDefault();
        loadOrders({ ...filters, page: 1 });
    };

    const setFilter = (name, value) => {
        setFilters((current) => ({
            ...current,
            [name]: value,
            page: name === "page" ? Number(value) : 1,
        }));
    };

    const allSelected =
        orders.length > 0 &&
        orders.every((order) => selected.includes(order.id));

    const toggleAll = () => {
        setSelected(allSelected ? [] : orders.map((order) => order.id));
    };

    const toggleSelected = (id) => {
        setSelected((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id]
        );
    };

    const updateLocalOrder = (id, patch) => {
        setOrders((current) =>
            current.map((order) =>
                order.id === id ? { ...order, ...patch } : order
            )
        );
    };

    const changeStatus = async (order, status) => {
        if (status === order.status) return;

        const oldStatus = order.status;
        updateLocalOrder(order.id, {
            status,
            status_label: titleCase(status),
        });
        setRowBusy((current) => ({ ...current, [order.id]: true }));

        try {
            const response = await sellerOrderService.updateStatus(
                order.id,
                status
            );
            notify(response.message || "Order status updated.");
            await loadOrders(filters);
        } catch (exception) {
            updateLocalOrder(order.id, {
                status: oldStatus,
                status_label: order.status_label,
            });
            notify(exception.message, "error");
        } finally {
            setRowBusy((current) => ({ ...current, [order.id]: false }));
        }
    };

    const openDetails = async (id) => {
        setDetailOpen(true);
        setDetail(null);

        try {
            const response = await sellerOrderService.show(id);
            setDetail(response.data);
        } catch (exception) {
            notify(exception.message, "error");
            setDetailOpen(false);
        }
    };

    const openNote = async (order) => {
        setNoteOrder(order);
        setNoteText("");
        setNoteOpen(true);

        try {
            const response = await sellerOrderService.show(order.id);
            setNoteOrder(response.data);
        } catch (exception) {
            notify(exception.message, "error");
        }
    };

    const saveNote = async () => {
        const note = noteText.trim();
        if (!note || !noteOrder) {
            notify("Write a note first.", "error");
            return;
        }

        try {
            const response = await sellerOrderService.addNote(
                noteOrder.id,
                note
            );
            notify(response.message || "Note saved.");
            setNoteText("");
            const refreshed = await sellerOrderService.show(noteOrder.id);
            setNoteOrder(refreshed.data);
            updateLocalOrder(noteOrder.id, { note });
        } catch (exception) {
            notify(exception.message, "error");
        }
    };

    const loadFraud = async (phone, orderId, force = false) => {
        const normalized = normalizePhone(phone);
        if (!normalized) return null;

        if (!force && fraudCache.current.has(normalized)) {
            return fraudCache.current.get(normalized);
        }

        const response = await sellerOrderService.fraudCheck(
            phone,
            orderId,
            force
        );
        fraudCache.current.set(normalized, response);
        return response;
    };

    const openFraud = async (order, force = false) => {
        const phone = order.customer?.phone;
        if (!phone) {
            notify("Customer phone is empty.", "error");
            return;
        }

        setFraudOpen(true);
        setFraudPhone(phone);
        setFraudOrderId(order.id);
        setFraudLoading(true);

        try {
            const response = await loadFraud(phone, order.id, force);
            setFraudData(response);
        } catch (exception) {
            setFraudData({ error: exception.message });
        } finally {
            setFraudLoading(false);
        }
    };

    useEffect(() => {
        if (!orders.length) return;

        const unique = new Map();
        orders.forEach((order) => {
            const phone = order.customer?.phone;
            const key = normalizePhone(phone);
            if (key && !unique.has(key)) {
                unique.set(key, { phone, orderId: order.id });
            }
        });

        const entries = Array.from(unique.values());
        let cursor = 0;
        let cancelled = false;

        const worker = async () => {
            while (!cancelled && cursor < entries.length) {
                const entry = entries[cursor++];
                try {
                    const response = await loadFraud(
                        entry.phone,
                        entry.orderId,
                        false
                    );
                    const ratio = Number(
                        response?.summary?.success_ratio ?? 0
                    );
                    setOrders((current) =>
                        current.map((order) =>
                            normalizePhone(order.customer?.phone) ===
                            normalizePhone(entry.phone)
                                ? {
                                      ...order,
                                      live_success_rate: ratio,
                                      duplicate_count: Number(
                                          response?.duplicate_count ?? 0
                                      ),
                                  }
                                : order
                        )
                    );
                } catch {
                    // Remote courier intelligence is optional; table remains usable.
                }
            }
        };

        Promise.all(
            Array.from(
                { length: Math.min(4, entries.length) },
                () => worker()
            )
        );

        return () => {
            cancelled = true;
        };
    }, [meta.current_page, orders.length]);

    const blockPhone = async (order) => {
        const reason = window.prompt(
            "Reason for blocking this phone number:",
            "Fraud or repeated fake order"
        );
        if (reason === null) return;

        try {
            const response = await sellerOrderService.blockCustomer(
                order.id,
                "phone",
                reason
            );
            notify(response.message || "Phone blocked.");
        } catch (exception) {
            notify(exception.message, "error");
        }
    };

    const deleteOrder = async (order) => {
        if (!window.confirm("Move this seller order to Deleted?")) return;

        try {
            const response = await sellerOrderService.destroy(order.id);
            notify(response.message || "Order deleted.");
            await loadOrders(filters);
        } catch (exception) {
            notify(exception.message, "error");
        }
    };

    const restoreOrder = async (order) => {
        try {
            const response = await sellerOrderService.restore(order.id);
            notify(response.message || "Order restored.");
            await loadOrders(filters);
        } catch (exception) {
            notify(exception.message, "error");
        }
    };

    const openCourier = (order) => {
        setCourierOrder(order);
        setCourierAccountId("");
        setCourierOpen(true);
    };

    const sendCourier = async () => {
        if (!courierOrder) return;

        try {
            const response = await sellerOrderService.sendCourier(
                courierOrder.id,
                courierAccountId || null
            );
            notify(response.message || "Order sent to courier.");
            setCourierOpen(false);
            await loadOrders(filters);
        } catch (exception) {
            notify(exception.message, "error");
        }
    };

    const showCourier = async (order) => {
        setCourierDetail(null);
        setCourierDetailOpen(true);

        try {
            const response = await sellerOrderService.courierDetails(order.id);
            setCourierDetail(response.data);
        } catch (exception) {
            notify(exception.message, "error");
            setCourierDetailOpen(false);
        }
    };

    const applyBulk = async () => {
        if (!selected.length) {
            notify("Select at least one order.", "error");
            return;
        }
        if (!bulkStatus && !bulkEmployee && !bulkCourier) {
            notify("Choose a bulk action.", "error");
            return;
        }

        const payload = { vendor_order_ids: selected };
        if (bulkStatus) payload.status = bulkStatus;
        if (bulkEmployee === "__clear__") {
            payload.clear_assignee = true;
        } else if (bulkEmployee) {
            payload.assigned_to = Number(bulkEmployee);
        }
        if (bulkCourier) {
            payload.send_courier = true;
            if (bulkCourier !== "__default__") {
                payload.courier_account_id = Number(bulkCourier);
            }
        }

        try {
            const response = await sellerOrderService.bulkAction(payload);
            notify(
                response.message || "Bulk action completed.",
                response.failed?.length ? "warning" : "success"
            );
            setBulkStatus("");
            setBulkEmployee("");
            setBulkCourier("");
            await loadOrders(filters);
        } catch (exception) {
            notify(exception.message, "error");
        }
    };

    const ensureDistricts = async () => {
        if (districts.length) return;
        try {
            const response = await sellerOrderService.districts();
            setDistricts(Array.isArray(response.data) ? response.data : []);
        } catch {
            // Manual typing still works.
        }
    };

    const loadUpazilas = async (district) => {
        if (!district) {
            setUpazilas([]);
            return;
        }
        try {
            const response = await sellerOrderService.upazilas(district);
            setUpazilas(Array.isArray(response.data) ? response.data : []);
        } catch {
            setUpazilas([]);
        }
    };

    const checkDuplicate = useCallback((phone, excludeId = null) => {
        clearTimeout(duplicateTimer.current);
        const normalized = normalizePhone(phone);

        if (normalized.length !== 11) {
            setDuplicateInfo(null);
            return;
        }

        duplicateTimer.current = window.setTimeout(async () => {
            try {
                const response = await sellerOrderService.customerCheck(
                    phone,
                    excludeId
                );
                setDuplicateInfo(response);
            } catch {
                setDuplicateInfo(null);
            }
        }, 500);
    }, []);

    const openCreateEditor = async () => {
        setEditorId(null);
        setEditorForm({ ...EMPTY_EDITOR });
        setEditorItems([]);
        setDuplicateInfo(null);
        setUpazilas([]);
        setEditorOpen(true);
        ensureDistricts();
    };

    const openEditEditor = async (order) => {
        setEditorOpen(true);
        setEditorId(order.id);
        setEditorItems([]);
        setDuplicateInfo(null);
        ensureDistricts();

        try {
            const response = await sellerOrderService.show(order.id);
            const data = response.data;

            setEditorForm({
                customer_name: data.customer?.name || "",
                customer_phone: data.customer?.phone || "",
                customer_email: data.customer?.email || "",
                district_name: data.customer?.district || "",
                thana_name: data.customer?.thana || "",
                address: data.customer?.address || "",
                postal_code: data.customer?.postal_code || "",
                assigned_to: data.assignee?.id || "",
                payment_method: data.payment_method || "cash_on_delivery",
                payment_status: data.payment_status || "pending",
                advance_amount: Number(data.advance_amount || 0),
                delivery_charge: Number(data.delivery_charge || 0),
                extra_charge: Number(data.extra_charge || 0),
                customer_note: data.customer?.customer_note || "",
                vendor_note: data.vendor_note || "",
                status: data.status || "new_order",
            });

            setEditorItems(
                (data.items || []).map((item) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    name: item.name,
                    variant_name: item.variant_name,
                    sku: item.sku,
                    image: item.image,
                    quantity: Number(item.quantity || 1),
                    unit_price: Number(item.unit_price || 0),
                    discount_amount: Number(item.discount_amount || 0),
                    stock: null,
                }))
            );

            if (data.customer?.district) {
                loadUpazilas(data.customer.district);
            }
            checkDuplicate(data.customer?.phone || "", order.id);
        } catch (exception) {
            notify(exception.message, "error");
            setEditorOpen(false);
        }
    };

    const updateEditor = (name, value) => {
        setEditorForm((current) => ({ ...current, [name]: value }));

        if (name === "customer_phone") {
            checkDuplicate(value, editorId);
        }
        if (name === "district_name") {
            setEditorForm((current) => ({
                ...current,
                district_name: value,
                thana_name: "",
            }));
            loadUpazilas(value);
        }
    };

    const searchProducts = async (term) => {
        setProductLoading(true);
        try {
            const response = await sellerOrderService.products(term);
            setProductResults(response.data || []);
        } catch (exception) {
            notify(exception.message, "error");
        } finally {
            setProductLoading(false);
        }
    };

    const openProductPicker = () => {
        setProductSearch("");
        setProductResults([]);
        setProductPickerOpen(true);
        searchProducts("");
    };

    const changeProductSearch = (value) => {
        setProductSearch(value);
        clearTimeout(productTimer.current);
        productTimer.current = window.setTimeout(() => {
            searchProducts(value);
        }, 350);
    };

    const addProduct = (product) => {
        setEditorItems((current) => {
            const found = current.find(
                (row) =>
                    Number(row.product_id) === Number(product.product_id) &&
                    Number(row.variant_id || 0) === Number(product.variant_id || 0)
            );

            if (found) {
                return current.map((row) =>
                    row === found
                        ? { ...row, quantity: Number(row.quantity || 1) + 1 }
                        : row
                );
            }

            return [
                ...current,
                {
                    ...product,
                    quantity: 1,
                    unit_price: Number(product.price || 0),
                    discount_amount: 0,
                },
            ];
        });
        notify("Product added.");
    };

    const updateEditorItem = (index, patch) => {
        setEditorItems((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item
            )
        );
    };

    const removeEditorItem = (index) => {
        setEditorItems((current) =>
            current.filter((_, itemIndex) => itemIndex !== index)
        );
    };

    const editorTotals = useMemo(() => {
        const gross = editorItems.reduce(
            (sum, item) =>
                sum + Number(item.unit_price || 0) * Number(item.quantity || 1),
            0
        );
        const discount = editorItems.reduce(
            (sum, item) => sum + Number(item.discount_amount || 0),
            0
        );
        const subtotalAfterItemDiscount = Math.max(0, gross - discount);
        const total = Math.max(
            0,
            subtotalAfterItemDiscount +
                Number(editorForm.delivery_charge || 0) +
                Number(editorForm.extra_charge || 0)
        );
        const due = Math.max(0, total - Number(editorForm.advance_amount || 0));

        return { gross, discount, total, due };
    }, [editorItems, editorForm]);

    const saveEditor = async () => {
        if (!editorForm.customer_name.trim()) {
            notify("Customer name is required.", "error");
            return;
        }
        if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(editorForm.customer_phone.trim())) {
            notify("Enter a valid Bangladesh mobile number.", "error");
            return;
        }
        if (!editorForm.address.trim()) {
            notify("Address is required.", "error");
            return;
        }
        if (!editorItems.length) {
            notify("Add at least one product.", "error");
            return;
        }

        const payload = {
            ...editorForm,
            assigned_to: editorForm.assigned_to
                ? Number(editorForm.assigned_to)
                : null,
            advance_amount: Number(editorForm.advance_amount || 0),
            delivery_charge: Number(editorForm.delivery_charge || 0),
            extra_charge: Number(editorForm.extra_charge || 0),
            items: editorItems.map((item) => ({
                product_id: Number(item.product_id),
                variant_id: item.variant_id ? Number(item.variant_id) : null,
                quantity: Math.max(1, Number(item.quantity || 1)),
                unit_price: Math.max(0, Number(item.unit_price || 0)),
                discount_amount: Math.max(
                    0,
                    Number(item.discount_amount || 0)
                ),
            })),
        };

        setEditorSaving(true);
        try {
            const response = editorId
                ? await sellerOrderService.update(editorId, payload)
                : await sellerOrderService.create(payload);
            notify(response.message || (editorId ? "Order updated." : "Order created."));
            setEditorOpen(false);
            await loadOrders(filters);
        } catch (exception) {
            notify(exception.message, "error");
        } finally {
            setEditorSaving(false);
        }
    };

    const successTone = (rate) => {
        const value = Number(rate);
        if (!Number.isFinite(value)) return "#98a2b3";
        if (value >= 80) return "#059669";
        if (value >= 40) return "#d97706";
        return "#dc2626";
    };

    return (
        <SellerLayout>
            <div className="som-page">
                <div className="som-page-title">
                    <div>
                        <span>SELLER CENTER</span>
                        <h1>Order Management</h1>
                        <p>
                            Vendor-scoped orders, courier, fraud checks, notes,
                            staff and bulk actions.
                        </p>
                    </div>

                    <div className="som-page-actions">
                        <button
                            type="button"
                            className="som-refresh"
                            onClick={() => loadOrders(filters)}
                        >
                            <i className="fa-solid fa-rotate-right" />
                            Refresh
                        </button>

                        <button
                            type="button"
                            className="som-primary-btn"
                            onClick={openCreateEditor}
                        >
                            <i className="fa-solid fa-plus" />
                            Create Order
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="som-error">
                        <i className="fa-solid fa-circle-exclamation" />
                        {error}
                    </div>
                )}

                <section className="som-card som-toolbar">
                    <form className="som-filter-row" onSubmit={submitSearch}>
                        <div className="som-search-wrap">
                            <i className="fa-solid fa-magnifying-glass" />
                            <input
                                type="search"
                                placeholder="Vendor order, parent order, customer, phone..."
                                value={filters.q}
                                onChange={(event) =>
                                    setFilters((current) => ({
                                        ...current,
                                        q: event.target.value,
                                    }))
                                }
                            />
                        </div>

                        <select
                            value={filters.status}
                            onChange={(event) =>
                                setFilter("status", event.target.value)
                            }
                            aria-label="Order status"
                        >
                            <option value="all">All statuses</option>
                            {(filterOptions.statuses || []).map((status) => (
                                <option value={status.value} key={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.employee}
                            onChange={(event) =>
                                setFilter("employee", event.target.value)
                            }
                        >
                            <option value="">All Staff</option>
                            {(filterOptions.staff || []).map((staff) => (
                                <option value={staff.id} key={staff.id}>
                                    {staff.name} · {titleCase(staff.role)}
                                </option>
                            ))}
                        </select>

                        <input
                            type="date"
                            value={filters.date_from}
                            onChange={(event) =>
                                setFilter("date_from", event.target.value)
                            }
                        />

                        <input
                            type="date"
                            value={filters.date_to}
                            onChange={(event) =>
                                setFilter("date_to", event.target.value)
                            }
                        />

                        <button type="submit" className="som-primary-btn">
                            Filter
                        </button>

                        <button
                            type="button"
                            className="som-secondary-btn"
                            onClick={() =>
                                setFilters({
                                    status: "all",
                                    q: "",
                                    employee: "",
                                    date_from: "",
                                    date_to: "",
                                    per_page: 25,
                                    page: 1,
                                })
                            }
                        >
                            Reset
                        </button>
                    </form>
                </section>

                {selected.length > 0 && (
                    <section className="som-bulk-bar">
                        <span className="som-selected-count">
                            {selected.length}
                        </span>
                        <strong>selected</strong>
                        <button type="button" onClick={() => setSelected([])}>
                            Clear
                        </button>

                        <div className="som-bulk-controls">
                            <select
                                value={bulkStatus}
                                onChange={(event) =>
                                    setBulkStatus(event.target.value)
                                }
                            >
                                <option value="">Status</option>
                                {(filterOptions.statuses || [])
                                    .filter((row) => row.value !== "deleted")
                                    .map((status) => (
                                        <option
                                            value={status.value}
                                            key={status.value}
                                        >
                                            {status.label}
                                        </option>
                                    ))}
                            </select>

                            <select
                                value={bulkEmployee}
                                onChange={(event) =>
                                    setBulkEmployee(event.target.value)
                                }
                            >
                                <option value="">Staff</option>
                                <option value="__clear__">Unassigned</option>
                                {(filterOptions.staff || []).map((staff) => (
                                    <option value={staff.id} key={staff.id}>
                                        {staff.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={bulkCourier}
                                onChange={(event) =>
                                    setBulkCourier(event.target.value)
                                }
                            >
                                <option value="">Courier</option>
                                <option value="__default__">
                                    Default Courier
                                </option>
                                {(filterOptions.courier_accounts || []).map(
                                    (account) => (
                                        <option
                                            value={account.id}
                                            key={account.id}
                                        >
                                            {account.provider} — {account.name}
                                            {account.is_default
                                                ? " (Default)"
                                                : ""}
                                        </option>
                                    )
                                )}
                            </select>

                            <button
                                type="button"
                                className="som-bulk-apply"
                                onClick={applyBulk}
                            >
                                Apply
                            </button>
                        </div>
                    </section>
                )}

                <section className="som-card som-table-card">
                    <div className="som-table-wrap">
                        <table className="som-table">
                            <thead>
                                <tr>
                                    <th>
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={toggleAll}
                                        />
                                    </th>
                                    <th>Order</th>
                                    <th>Customer</th>
                                    <th>Product</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Courier</th>
                                    <th>Note</th>
                                    <th>Staff</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="10" className="som-empty">
                                            <i className="fa-solid fa-spinner fa-spin" />{" "}
                                            Loading seller orders...
                                        </td>
                                    </tr>
                                ) : orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="som-empty">
                                            No seller orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((order) => {
                                        const statusColor =
                                            STATUS_COLORS[order.status] ||
                                            STATUS_COLORS.new_order;
                                        const rate =
                                            order.live_success_rate ??
                                            order.customer?.success_rate;
                                        const wa = whatsappPhone(
                                            order.customer?.phone
                                        );

                                        return (
                                            <tr key={order.id}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selected.includes(
                                                            order.id
                                                        )}
                                                        onChange={() =>
                                                            toggleSelected(
                                                                order.id
                                                            )
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="som-order-number"
                                                        onClick={() =>
                                                            openDetails(order.id)
                                                        }
                                                    >
                                                        {order.vendor_order_number}
                                                    </button>
                                                    <div className="som-parent-order">
                                                        {order.parent_order_number ||
                                                            "Parent pending"}
                                                    </div>
                                                    <div className="som-date">
                                                        {formatDate(
                                                            order.placed_at
                                                        )}
                                                    </div>
                                                    <span className="som-source">
                                                        {titleCase(
                                                            order.source ||
                                                                "website"
                                                        )}
                                                    </span>
                                                    <div
                                                        className={
                                                            Number(
                                                                order.duplicate_count ||
                                                                    0
                                                            ) > 0
                                                                ? "som-duplicate danger"
                                                                : "som-duplicate"
                                                        }
                                                    >
                                                        Duplicate:{" "}
                                                        {order.duplicate_count ===
                                                        undefined
                                                            ? "..."
                                                            : order.duplicate_count}
                                                    </div>
                                                </td>

                                                <td>
                                                    <strong className="som-customer">
                                                        <i className="fa-regular fa-user" />
                                                        {order.customer?.name ||
                                                            "Unknown"}
                                                    </strong>
                                                    <div className="som-phone-line">
                                                        <a
                                                            href={
                                                                order.customer
                                                                    ?.phone
                                                                    ? `tel:${order.customer.phone}`
                                                                    : undefined
                                                            }
                                                        >
                                                            {order.customer?.phone ||
                                                                "—"}
                                                        </a>
                                                        {order.customer?.phone && (
                                                            <button
                                                                type="button"
                                                                className="som-rate"
                                                                style={{
                                                                    color: successTone(
                                                                        rate
                                                                    ),
                                                                }}
                                                                onClick={() =>
                                                                    openFraud(
                                                                        order
                                                                    )
                                                                }
                                                            >
                                                                {rate ===
                                                                    undefined ||
                                                                rate === null
                                                                    ? "..."
                                                                    : `${money(
                                                                          rate
                                                                      )}%`}
                                                            </button>
                                                        )}
                                                        {wa && (
                                                            <a
                                                                className="som-wa"
                                                                href={`https://wa.me/${wa}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <i className="fa-brands fa-whatsapp" />
                                                            </a>
                                                        )}
                                                    </div>
                                                    <div className="som-address">
                                                        <i className="fa-solid fa-location-dot" />
                                                        {order.customer?.address ||
                                                            "Address unavailable"}
                                                    </div>
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="som-products"
                                                        onClick={() =>
                                                            openDetails(order.id)
                                                        }
                                                    >
                                                        {order.items
                                                            .slice(0, 3)
                                                            .map((item) =>
                                                                item.image ? (
                                                                    <img
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        src={mediaUrl(
                                                                            item.image
                                                                        )}
                                                                        alt={
                                                                            item.name
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="som-product-placeholder"
                                                                        key={
                                                                            item.id
                                                                        }
                                                                    >
                                                                        <i className="fa-regular fa-image" />
                                                                    </span>
                                                                )
                                                            )}
                                                        {order.items_count > 3 && (
                                                            <span className="som-more">
                                                                +
                                                                {order.items_count -
                                                                    3}
                                                            </span>
                                                        )}
                                                    </button>
                                                </td>

                                                <td>
                                                    <strong className="som-amount">
                                                        ৳{money(order.total_amount)}
                                                    </strong>
                                                    <div className="som-amount-sub">
                                                        Earning ৳
                                                        {money(
                                                            order.vendor_earning
                                                        )}
                                                    </div>
                                                    <div className="som-amount-sub">
                                                        Payable ৳
                                                        {money(
                                                            order.payable_amount
                                                        )}
                                                    </div>
                                                    <div className="som-amount-sub som-payment">
                                                        {String(
                                                            order.payment_method ||
                                                                "COD"
                                                        ).toUpperCase()}
                                                    </div>
                                                </td>

                                                <td>
                                                    {filters.status ===
                                                    "deleted" ? (
                                                        <span
                                                            className="som-status-pill"
                                                            style={{
                                                                background:
                                                                    STATUS_COLORS
                                                                        .deleted[0],
                                                                color: STATUS_COLORS
                                                                    .deleted[1],
                                                            }}
                                                        >
                                                            Deleted
                                                        </span>
                                                    ) : (
                                                        <select
                                                            className="som-status-select"
                                                            disabled={
                                                                rowBusy[order.id]
                                                            }
                                                            value={order.status}
                                                            style={{
                                                                background:
                                                                    statusColor[0],
                                                                color: statusColor[1],
                                                                borderColor: `${statusColor[1]}55`,
                                                            }}
                                                            onChange={(event) =>
                                                                changeStatus(
                                                                    order,
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            {(
                                                                filterOptions.statuses ||
                                                                []
                                                            )
                                                                .filter(
                                                                    (row) =>
                                                                        row.value !==
                                                                        "deleted"
                                                                )
                                                                .map((status) => (
                                                                    <option
                                                                        value={
                                                                            status.value
                                                                        }
                                                                        key={
                                                                            status.value
                                                                        }
                                                                    >
                                                                        {
                                                                            status.label
                                                                        }
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    )}
                                                </td>

                                                <td>
                                                    {order.courier ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                className="som-courier-badge"
                                                                onClick={() =>
                                                                    showCourier(
                                                                        order
                                                                    )
                                                                }
                                                            >
                                                                {
                                                                    order.courier
                                                                        .provider
                                                                }
                                                            </button>
                                                            <div className="som-courier-id">
                                                                #
                                                                {order.courier
                                                                    .consignment_id ||
                                                                    order.courier
                                                                        .tracking_code ||
                                                                    order.courier.id}
                                                            </div>
                                                        </>
                                                    ) : filters.status !==
                                                      "deleted" ? (
                                                        <button
                                                            type="button"
                                                            className="som-send-courier"
                                                            onClick={() =>
                                                                openCourier(order)
                                                            }
                                                        >
                                                            One-click Courier
                                                        </button>
                                                    ) : (
                                                        "—"
                                                    )}
                                                </td>

                                                <td>
                                                    <div className="som-note-preview">
                                                        {order.note || "—"}
                                                    </div>
                                                    {filters.status !==
                                                        "deleted" && (
                                                        <button
                                                            type="button"
                                                            className="som-link"
                                                            onClick={() =>
                                                                openNote(order)
                                                            }
                                                        >
                                                            <i className="fa-regular fa-pen-to-square" />
                                                            {order.notes_count
                                                                ? "View / Add"
                                                                : "Add note"}
                                                        </button>
                                                    )}
                                                </td>

                                                <td>
                                                    <span className="som-staff-badge">
                                                        <span>
                                                            {(
                                                                order.assignee
                                                                    ?.name || "U"
                                                            )
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </span>
                                                        {order.assignee?.name ||
                                                            "Unassigned"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {filters.status ===
                                                    "deleted" ? (
                                                        <button
                                                            type="button"
                                                            className="som-action restore"
                                                            onClick={() =>
                                                                restoreOrder(
                                                                    order
                                                                )
                                                            }
                                                        >
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <div className="som-actions">
                                                            <button
                                                                type="button"
                                                                title="Details"
                                                                onClick={() =>
                                                                    openDetails(
                                                                        order.id
                                                                    )
                                                                }
                                                            >
                                                                <i className="fa-regular fa-eye" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Edit"
                                                                onClick={() =>
                                                                    openEditEditor(
                                                                        order
                                                                    )
                                                                }
                                                            >
                                                                <i className="fa-regular fa-pen-to-square" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Block phone"
                                                                className="warn"
                                                                onClick={() =>
                                                                    blockPhone(
                                                                        order
                                                                    )
                                                                }
                                                            >
                                                                <i className="fa-solid fa-ban" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Cancel"
                                                                className="warn"
                                                                onClick={() =>
                                                                    changeStatus(
                                                                        order,
                                                                        "cancelled"
                                                                    )
                                                                }
                                                            >
                                                                <i className="fa-regular fa-circle-xmark" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Delete"
                                                                className="danger"
                                                                onClick={() =>
                                                                    deleteOrder(
                                                                        order
                                                                    )
                                                                }
                                                            >
                                                                <i className="fa-regular fa-trash-can" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="som-pagination">
                        <div>
                            <span>Rows</span>
                            <select
                                value={filters.per_page}
                                onChange={(event) =>
                                    setFilter(
                                        "per_page",
                                        Number(event.target.value)
                                    )
                                }
                            >
                                {[25, 50, 100].map((size) => (
                                    <option value={size} key={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                            <span>
                                {meta.from || 0}–{meta.to || 0} of{" "}
                                {meta.total || 0}
                            </span>
                        </div>

                        <div>
                            <button
                                type="button"
                                disabled={meta.current_page <= 1}
                                onClick={() =>
                                    setFilter(
                                        "page",
                                        meta.current_page - 1
                                    )
                                }
                            >
                                ‹
                            </button>
                            <strong>{meta.current_page || 1}</strong>
                            <span>/ {meta.last_page || 1}</span>
                            <button
                                type="button"
                                disabled={meta.current_page >= meta.last_page}
                                onClick={() =>
                                    setFilter(
                                        "page",
                                        meta.current_page + 1
                                    )
                                }
                            >
                                ›
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            <Modal
                open={detailOpen}
                title={
                    detail?.vendor_order_number
                        ? `Order ${detail.vendor_order_number}`
                        : "Order Details"
                }
                onClose={() => setDetailOpen(false)}
                size="large"
            >
                {!detail ? (
                    <div className="som-modal-loading">
                        <i className="fa-solid fa-spinner fa-spin" /> Loading...
                    </div>
                ) : (
                    <div className="som-detail-grid">
                        <section className="som-detail-section">
                            <h4>Customer</h4>
                            <dl>
                                <div>
                                    <dt>Name</dt>
                                    <dd>{detail.customer?.name || "—"}</dd>
                                </div>
                                <div>
                                    <dt>Phone</dt>
                                    <dd>{detail.customer?.phone || "—"}</dd>
                                </div>
                                <div>
                                    <dt>Email</dt>
                                    <dd>{detail.customer?.email || "—"}</dd>
                                </div>
                                <div>
                                    <dt>Address</dt>
                                    <dd>{detail.customer?.address || "—"}</dd>
                                </div>
                                <div>
                                    <dt>District / Thana</dt>
                                    <dd>
                                        {detail.customer?.district || "—"} /{" "}
                                        {detail.customer?.thana || "—"}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="som-detail-section">
                            <h4>Seller Order</h4>
                            <dl>
                                <div>
                                    <dt>Vendor Order</dt>
                                    <dd>{detail.vendor_order_number}</dd>
                                </div>
                                <div>
                                    <dt>Parent Order</dt>
                                    <dd>
                                        {detail.parent_order_number || "—"}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Status</dt>
                                    <dd>{detail.status_label}</dd>
                                </div>
                                <div>
                                    <dt>Payment</dt>
                                    <dd>{titleCase(detail.payment_status)}</dd>
                                </div>
                                <div>
                                    <dt>Total</dt>
                                    <dd>৳{money(detail.total_amount)}</dd>
                                </div>
                                <div>
                                    <dt>Vendor Earning</dt>
                                    <dd>৳{money(detail.vendor_earning)}</dd>
                                </div>
                            </dl>
                        </section>

                        <section className="som-detail-section som-detail-wide">
                            <h4>Products</h4>
                            <div className="som-detail-products">
                                {detail.items.map((item) => (
                                    <div
                                        className="som-detail-product"
                                        key={item.id}
                                    >
                                        {item.image ? (
                                            <img
                                                src={mediaUrl(item.image)}
                                                alt={item.name}
                                            />
                                        ) : (
                                            <span>
                                                <i className="fa-regular fa-image" />
                                            </span>
                                        )}
                                        <div>
                                            <strong>{item.name}</strong>
                                            <small>
                                                {item.variant_name || ""}{" "}
                                                {item.sku || ""}
                                            </small>
                                            <p>
                                                ৳{money(item.unit_price)} ×{" "}
                                                {item.quantity} = ৳
                                                {money(item.line_total)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="som-detail-section som-detail-wide">
                            <h4>Status Logs</h4>
                            <div className="som-log-list">
                                {(detail.logs || []).length ? (
                                    detail.logs.map((log) => (
                                        <div className="som-log-row" key={log.id}>
                                            <div>
                                                <strong>
                                                    {log.previous_status_label ||
                                                        "—"}
                                                </strong>
                                                <i className="fa-solid fa-arrow-right" />
                                                <strong>
                                                    {log.new_status_label}
                                                </strong>
                                            </div>
                                            <p>{log.message || "—"}</p>
                                            <small>
                                                {log.updated_by} ·{" "}
                                                {log.created_at}
                                            </small>
                                        </div>
                                    ))
                                ) : (
                                    <div className="som-muted">
                                        No status logs.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </Modal>

            <Modal
                open={editorOpen}
                title={editorId ? "Edit Seller Order" : "Create Seller Order"}
                onClose={() => setEditorOpen(false)}
                size="large"
            >
                <div className="som-editor-grid">
                    <section className="som-editor-section">
                        <h4>Customer Information</h4>
                        <div className="som-form-grid">
                            <label>
                                <span>Customer Name *</span>
                                <input
                                    value={editorForm.customer_name}
                                    onChange={(event) =>
                                        updateEditor(
                                            "customer_name",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <span>Mobile Number *</span>
                                <input
                                    value={editorForm.customer_phone}
                                    onChange={(event) =>
                                        updateEditor(
                                            "customer_phone",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            {duplicateInfo && (
                                <div
                                    className={
                                        duplicateInfo.duplicates?.length
                                            ? "som-duplicate-alert danger"
                                            : "som-duplicate-alert safe"
                                    }
                                >
                                    {duplicateInfo.duplicates?.length
                                        ? `Possible duplicate: ${duplicateInfo.duplicates.length}`
                                        : "No active duplicate seller order found."}
                                </div>
                            )}

                            <label className="full">
                                <span>Email</span>
                                <input
                                    type="email"
                                    value={editorForm.customer_email}
                                    onChange={(event) =>
                                        updateEditor(
                                            "customer_email",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <span>District / City</span>
                                <input
                                    list="sellerDistrictList"
                                    value={editorForm.district_name}
                                    onFocus={ensureDistricts}
                                    onChange={(event) =>
                                        updateEditor(
                                            "district_name",
                                            event.target.value
                                        )
                                    }
                                />
                                <datalist id="sellerDistrictList">
                                    {districts.map((row, index) => (
                                        <option
                                            value={row.name}
                                            key={`${row.name}-${index}`}
                                        >
                                            {row.name_bn || ""}
                                        </option>
                                    ))}
                                </datalist>
                            </label>

                            <label>
                                <span>Thana / Upazila</span>
                                <input
                                    list="sellerUpazilaList"
                                    value={editorForm.thana_name}
                                    onChange={(event) =>
                                        updateEditor(
                                            "thana_name",
                                            event.target.value
                                        )
                                    }
                                />
                                <datalist id="sellerUpazilaList">
                                    {upazilas.map((row, index) => (
                                        <option
                                            value={row.name}
                                            key={`${row.name}-${index}`}
                                        >
                                            {row.name_bn || ""}
                                        </option>
                                    ))}
                                </datalist>
                            </label>

                            <label className="full">
                                <span>Address *</span>
                                <textarea
                                    rows="3"
                                    value={editorForm.address}
                                    onChange={(event) =>
                                        updateEditor(
                                            "address",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>
                        </div>
                    </section>

                    <section className="som-editor-section">
                        <h4>Payment & Seller Settings</h4>
                        <div className="som-form-grid">
                            <label>
                                <span>Payment Method</span>
                                <select
                                    value={editorForm.payment_method}
                                    onChange={(event) =>
                                        updateEditor(
                                            "payment_method",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="cash_on_delivery">
                                        Cash on Delivery
                                    </option>
                                    <option value="bkash">bKash</option>
                                    <option value="nagad">Nagad</option>
                                    <option value="bank">Bank</option>
                                </select>
                            </label>

                            <label>
                                <span>Payment Status</span>
                                <select
                                    value={editorForm.payment_status}
                                    onChange={(event) =>
                                        updateEditor(
                                            "payment_status",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="pending">Pending</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </label>

                            <label>
                                <span>Advance Amount</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editorForm.advance_amount}
                                    onChange={(event) =>
                                        updateEditor(
                                            "advance_amount",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <span>Delivery Charge</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editorForm.delivery_charge}
                                    onChange={(event) =>
                                        updateEditor(
                                            "delivery_charge",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <span>Extra Charge</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editorForm.extra_charge}
                                    onChange={(event) =>
                                        updateEditor(
                                            "extra_charge",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label>
                                <span>Order Status</span>
                                <select
                                    value={editorForm.status}
                                    onChange={(event) =>
                                        updateEditor(
                                            "status",
                                            event.target.value
                                        )
                                    }
                                >
                                    {(filterOptions.statuses || [])
                                        .filter(
                                            (row) => row.value !== "deleted"
                                        )
                                        .map((status) => (
                                            <option
                                                value={status.value}
                                                key={status.value}
                                            >
                                                {status.label}
                                            </option>
                                        ))}
                                </select>
                            </label>

                            <label className="full">
                                <span>Assign Staff</span>
                                <select
                                    value={editorForm.assigned_to}
                                    onChange={(event) =>
                                        updateEditor(
                                            "assigned_to",
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">Unassigned</option>
                                    {(filterOptions.staff || []).map(
                                        (staff) => (
                                            <option
                                                value={staff.id}
                                                key={staff.id}
                                            >
                                                {staff.name}
                                            </option>
                                        )
                                    )}
                                </select>
                            </label>

                            <label className="full">
                                <span>Customer Note</span>
                                <textarea
                                    rows="2"
                                    value={editorForm.customer_note}
                                    onChange={(event) =>
                                        updateEditor(
                                            "customer_note",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>

                            <label className="full">
                                <span>Vendor Note</span>
                                <textarea
                                    rows="2"
                                    value={editorForm.vendor_note}
                                    onChange={(event) =>
                                        updateEditor(
                                            "vendor_note",
                                            event.target.value
                                        )
                                    }
                                />
                            </label>
                        </div>
                    </section>
                </div>

                <section className="som-editor-products">
                    <div className="som-editor-products-head">
                        <div>
                            <h4>Products & Pricing</h4>
                            <p>Only products owned by this seller are searchable.</p>
                        </div>
                        <button
                            type="button"
                            className="som-primary-btn"
                            onClick={openProductPicker}
                        >
                            <i className="fa-solid fa-plus" /> Add Product
                        </button>
                    </div>

                    <div className="som-editor-products-grid">
                        <div className="som-editor-item-list">
                            {editorItems.length ? (
                                editorItems.map((item, index) => (
                                    <div
                                        className="som-editor-item"
                                        key={`${item.product_id}-${
                                            item.variant_id || 0
                                        }`}
                                    >
                                        {item.image ? (
                                            <img
                                                src={mediaUrl(item.image)}
                                                alt={item.name}
                                            />
                                        ) : (
                                            <span className="som-editor-image-placeholder">
                                                <i className="fa-regular fa-image" />
                                            </span>
                                        )}

                                        <div>
                                            <strong>{item.name}</strong>
                                            <small>
                                                {item.variant_name || ""}{" "}
                                                {item.sku || ""}
                                            </small>

                                            <div className="som-item-fields">
                                                <label>
                                                    Price
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={(event) =>
                                                            updateEditorItem(
                                                                index,
                                                                {
                                                                    unit_price:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }
                                                            )
                                                        }
                                                    />
                                                </label>

                                                <label>
                                                    Qty
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(event) =>
                                                            updateEditorItem(
                                                                index,
                                                                {
                                                                    quantity:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }
                                                            )
                                                        }
                                                    />
                                                </label>

                                                <label>
                                                    Vendor Discount
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            item.discount_amount
                                                        }
                                                        onChange={(event) =>
                                                            updateEditorItem(
                                                                index,
                                                                {
                                                                    discount_amount:
                                                                        event
                                                                            .target
                                                                            .value,
                                                                }
                                                            )
                                                        }
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="som-remove-item"
                                            onClick={() =>
                                                removeEditorItem(index)
                                            }
                                        >
                                            <i className="fa-solid fa-xmark" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="som-muted">
                                    Add at least one product.
                                </div>
                            )}
                        </div>

                        <div className="som-price-summary">
                            <div>
                                <span>Product Gross</span>
                                <strong>৳{money(editorTotals.gross)}</strong>
                            </div>
                            <div>
                                <span>Vendor Discount</span>
                                <strong>
                                    -৳{money(editorTotals.discount)}
                                </strong>
                            </div>
                            <div>
                                <span>Delivery</span>
                                <strong>
                                    ৳{money(editorForm.delivery_charge)}
                                </strong>
                            </div>
                            <div>
                                <span>Extra Charge</span>
                                <strong>
                                    ৳{money(editorForm.extra_charge)}
                                </strong>
                            </div>
                            <div className="total">
                                <span>Total</span>
                                <strong>৳{money(editorTotals.total)}</strong>
                            </div>
                            <div>
                                <span>Due</span>
                                <strong>৳{money(editorTotals.due)}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="som-editor-footer">
                    <button
                        type="button"
                        className="som-secondary-btn"
                        onClick={() => setEditorOpen(false)}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="som-primary-btn"
                        disabled={editorSaving}
                        onClick={saveEditor}
                    >
                        {editorSaving ? (
                            <i className="fa-solid fa-spinner fa-spin" />
                        ) : (
                            <i className="fa-regular fa-floppy-disk" />
                        )}
                        {editorId ? "Update Order" : "Create Order"}
                    </button>
                </div>
            </Modal>

            <Modal
                open={productPickerOpen}
                title="Available Seller Products"
                onClose={() => setProductPickerOpen(false)}
                size="medium"
            >
                <div className="som-product-search">
                    <i className="fa-solid fa-magnifying-glass" />
                    <input
                        placeholder="Search seller product or SKU..."
                        value={productSearch}
                        onChange={(event) =>
                            changeProductSearch(event.target.value)
                        }
                    />
                </div>

                <div className="som-product-picker-list">
                    {productLoading ? (
                        <div className="som-muted">
                            <i className="fa-solid fa-spinner fa-spin" />{" "}
                            Loading products...
                        </div>
                    ) : productResults.length ? (
                        productResults.map((product, index) => (
                            <div
                                className="som-product-picker-row"
                                key={`${product.product_id}-${
                                    product.variant_id || 0
                                }-${index}`}
                            >
                                {product.image ? (
                                    <img
                                        src={mediaUrl(product.image)}
                                        alt={product.name}
                                    />
                                ) : (
                                    <span>
                                        <i className="fa-regular fa-image" />
                                    </span>
                                )}
                                <div>
                                    <strong>{product.name}</strong>
                                    <small>
                                        {product.variant_name || ""}{" "}
                                        {product.sku || ""}
                                    </small>
                                    <p>
                                        ৳{money(product.price)} ·{" "}
                                        {product.stock === null
                                            ? "Stock not tracked"
                                            : `${product.stock} in stock`}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="som-primary-btn"
                                    onClick={() => addProduct(product)}
                                >
                                    Add
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="som-muted">No product found.</div>
                    )}
                </div>
            </Modal>

            <Modal
                open={noteOpen}
                title={
                    noteOrder?.vendor_order_number
                        ? `Notes · ${noteOrder.vendor_order_number}`
                        : "Seller Order Note"
                }
                onClose={() => setNoteOpen(false)}
                size="small"
            >
                <textarea
                    className="som-modal-textarea"
                    rows="4"
                    placeholder="Write internal seller note..."
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                />
                <button
                    type="button"
                    className="som-primary-btn som-modal-save"
                    onClick={saveNote}
                >
                    Save Note
                </button>
                <div className="som-note-history">
                    {(noteOrder?.notes || []).map((note) => (
                        <div key={note.id}>
                            <p>{note.note}</p>
                            <small>
                                {note.user} · {note.created_at}
                            </small>
                        </div>
                    ))}
                </div>
            </Modal>

            <Modal
                open={fraudOpen}
                title={`Fraud Tracker · ${fraudPhone || "Customer"}`}
                onClose={() => setFraudOpen(false)}
                size="medium"
            >
                <div className="som-fraud-head-actions">
                    <button
                        type="button"
                        onClick={() =>
                            openFraud(
                                {
                                    id: fraudOrderId,
                                    customer: { phone: fraudPhone },
                                },
                                true
                            )
                        }
                    >
                        <i className="fa-solid fa-rotate-right" /> Refresh BD
                        Courier
                    </button>
                </div>

                {fraudLoading ? (
                    <div className="som-modal-loading">
                        <i className="fa-solid fa-spinner fa-spin" /> Loading BD
                        Courier...
                    </div>
                ) : fraudData?.error ? (
                    <div className="som-error">{fraudData.error}</div>
                ) : fraudData ? (
                    <FraudReport data={fraudData} />
                ) : null}
            </Modal>

            <Modal
                open={courierOpen}
                title={
                    courierOrder
                        ? `Send ${courierOrder.vendor_order_number} to Courier`
                        : "Send to Courier"
                }
                onClose={() => setCourierOpen(false)}
                size="small"
            >
                <label className="som-modal-label">Courier Account</label>
                <select
                    className="som-modal-select"
                    value={courierAccountId}
                    onChange={(event) =>
                        setCourierAccountId(event.target.value)
                    }
                >
                    <option value="">Default Courier Account</option>
                    {(filterOptions.courier_accounts || []).map((account) => (
                        <option value={account.id} key={account.id}>
                            {account.provider} — {account.name}
                            {account.is_default ? " (Default)" : ""}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    className="som-primary-btn som-modal-save"
                    onClick={sendCourier}
                >
                    Send Courier
                </button>
            </Modal>

            <Modal
                open={courierDetailOpen}
                title="Courier Details"
                onClose={() => setCourierDetailOpen(false)}
                size="small"
            >
                {!courierDetail ? (
                    <div className="som-modal-loading">
                        <i className="fa-solid fa-spinner fa-spin" /> Loading...
                    </div>
                ) : (
                    <div className="som-courier-detail">
                        {[
                            ["Provider", courierDetail.provider],
                            ["Account", courierDetail.account_name],
                            [
                                "Consignment",
                                courierDetail.consignment_id ||
                                    courierDetail.tracking_code,
                            ],
                            ["Status", titleCase(courierDetail.status)],
                            ["Customer", courierDetail.customer_name],
                            ["Phone", courierDetail.customer_phone],
                            ["Address", courierDetail.address],
                            [
                                "Collection",
                                `৳${money(
                                    courierDetail.collection_amount
                                )}`,
                            ],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <span>{label}</span>
                                <strong>{value || "—"}</strong>
                            </div>
                        ))}

                        {courierDetail.tracking_url && (
                            <a
                                href={courierDetail.tracking_url}
                                target="_blank"
                                rel="noreferrer"
                                className="som-track-link"
                            >
                                Open Tracking
                            </a>
                        )}

                        <h4>Courier Logs</h4>
                        {(courierDetail.logs || []).map((log, index) => (
                            <div
                                className="som-courier-log"
                                key={`${log.time}-${index}`}
                            >
                                <small>{log.time}</small>
                                <p>{log.message || log.event}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {toast && (
                <div className={`som-toast ${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </SellerLayout>
    );
}
