import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminBadge, AdminCard, AdminEmpty, AdminLoader, AdminModal,
    AdminPageHeader, AdminToast, firstError, formatDate, money,
} from "../../components/admin/AdminUI";
import "./admin.css";

const offerBlank = {
    vendor_id:"", name:"", slug:"", scope:"platform",
    discount_type:"percentage", discount_value:"", maximum_discount:"",
    description:"", starts_at:"", ends_at:"", sort_order:0,
    is_active:true, product_ids:[],
};

const couponBlank = {
    vendor_id:"", code:"", scope:"platform",
    discount_type:"percentage", discount_value:"",
    minimum_order_amount:0, maximum_discount:"",
    usage_limit:"", usage_limit_per_user:"",
    starts_at:"", ends_at:"", is_active:true,
    product_ids:[], category_ids:[],
};

export default function AdminPromotions() {
    const [tab, setTab] = useState("offers");
    const [data, setData] = useState({offers:[],coupons:[],vendors:[],products:[],categories:[]});
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [offer, setOffer] = useState(offerBlank);
    const [coupon, setCoupon] = useState(couponBlank);
    const [toast, setToast] = useState(null);

    const notify = useCallback((message,type="success") => {
        setToast({message,type});
        window.setTimeout(()=>setToast(null),3200);
    },[]);

    const load = useCallback(async()=>{
        setLoading(true);
        try {
            const r = await adminService.promotions();
            setData(r.data || {});
        } catch(e) { notify(firstError(e),"error"); }
        finally { setLoading(false); }
    },[notify]);

    useEffect(()=>{load();},[load]);

    const openOffer = (row=null) => {
        setTab("offers"); setEditId(row?.id || null);
        setOffer(row ? {
            vendor_id:row.vendor_id || "", name:row.name || "", slug:row.slug || "",
            scope:row.scope || "platform", discount_type:row.discount_type || "percentage",
            discount_value:row.discount_value ?? "", maximum_discount:row.maximum_discount ?? "",
            description:row.description || "",
            starts_at:row.starts_at ? String(row.starts_at).slice(0,16) : "",
            ends_at:row.ends_at ? String(row.ends_at).slice(0,16) : "",
            sort_order:row.sort_order || 0, is_active:Boolean(row.is_active),
            product_ids:row.products?.map(p=>p.id) || [],
        } : offerBlank);
        setModal(true);
    };

    const openCoupon = (row=null) => {
        setTab("coupons"); setEditId(row?.id || null);
        setCoupon(row ? {
            vendor_id:row.vendor_id || "", code:row.code || "", scope:row.scope || "platform",
            discount_type:row.discount_type || "percentage", discount_value:row.discount_value ?? "",
            minimum_order_amount:row.minimum_order_amount || 0, maximum_discount:row.maximum_discount ?? "",
            usage_limit:row.usage_limit ?? "", usage_limit_per_user:row.usage_limit_per_user ?? "",
            starts_at:row.starts_at ? String(row.starts_at).slice(0,16) : "",
            ends_at:row.ends_at ? String(row.ends_at).slice(0,16) : "",
            is_active:Boolean(row.is_active),
            product_ids:row.products?.map(p=>p.id) || [],
            category_ids:row.categories?.map(c=>c.id) || [],
        } : couponBlank);
        setModal(true);
    };

    const toggle = (setter,key,id) => setter(c=>({
        ...c,
        [key]:c[key].includes(id) ? c[key].filter(v=>v!==id) : [...c[key],id],
    }));

    const save = async() => {
        try {
            if(tab==="offers") {
                const payload = {
                    ...offer,
                    vendor_id:offer.scope==="vendor" ? Number(offer.vendor_id) : null,
                    discount_value:Number(offer.discount_value),
                    maximum_discount:offer.maximum_discount!=="" ? Number(offer.maximum_discount) : null,
                    sort_order:Number(offer.sort_order),
                    starts_at:offer.starts_at || null, ends_at:offer.ends_at || null,
                };
                const r = await adminService.saveOffer(editId,payload);
                notify(r.message);
            } else {
                const payload = {
                    ...coupon,
                    vendor_id:coupon.scope==="vendor" ? Number(coupon.vendor_id) : null,
                    discount_value:Number(coupon.discount_value),
                    minimum_order_amount:Number(coupon.minimum_order_amount),
                    maximum_discount:coupon.maximum_discount!=="" ? Number(coupon.maximum_discount) : null,
                    usage_limit:coupon.usage_limit!=="" ? Number(coupon.usage_limit) : null,
                    usage_limit_per_user:coupon.usage_limit_per_user!=="" ? Number(coupon.usage_limit_per_user) : null,
                    starts_at:coupon.starts_at || null, ends_at:coupon.ends_at || null,
                };
                const r = await adminService.saveCoupon(editId,payload);
                notify(r.message);
            }
            setModal(false); await load();
        } catch(e) { notify(firstError(e),"error"); }
    };

    const remove = async(type,id) => {
        if(!window.confirm(`Delete this ${type}?`)) return;
        try {
            const r = type==="offer" ? await adminService.deleteOffer(id) : await adminService.deleteCoupon(id);
            notify(r.message); await load();
        } catch(e){ notify(firstError(e),"error");}
    };

    const form = tab==="offers" ? offer : coupon;
    const setForm = tab==="offers" ? setOffer : setCoupon;

    return <AdminLayout>
        <AdminPageHeader title="Promotions"
            description="Platform and seller offers, Flash Sale assignments and coupon rules."
            actions={<button className="adm-btn adm-btn-primary"
                onClick={()=>tab==="offers" ? openOffer() : openCoupon()}>
                <i className="fa-solid fa-plus"/> Add {tab==="offers" ? "Offer" : "Coupon"}
            </button>}
        />
        <div className="adm-tabs">
            <button className={tab==="offers"?"active":""} onClick={()=>setTab("offers")}>Offers / Flash Sale</button>
            <button className={tab==="coupons"?"active":""} onClick={()=>setTab("coupons")}>Coupons</button>
        </div><div style={{height:10}}/>

        <AdminCard>
            {loading ? <AdminLoader/> : tab==="offers" ? (
                !data.offers?.length ? <AdminEmpty title="No offers found"/> :
                <div className="adm-table-wrap"><table className="adm-table">
                    <thead><tr><th>Offer</th><th>Scope</th><th>Discount</th><th>Products</th><th>Schedule</th><th>Status</th><th/></tr></thead>
                    <tbody>{data.offers.map(row=><tr key={row.id}>
                        <td data-label="Offer"><strong>{row.name}</strong><span className="adm-table-sub">{row.slug}</span></td>
                        <td data-label="Scope">{row.scope==="platform" ? "Platform" : row.vendor?.name || "Vendor"}</td>
                        <td data-label="Discount">{row.discount_type==="percentage" ? `${row.discount_value}%` : money(row.discount_value)}</td>
                        <td data-label="Products">{row.products?.length || 0}</td>
                        <td data-label="Schedule">{row.starts_at ? formatDate(row.starts_at) : "Now"}<span className="adm-table-sub">{row.ends_at ? `to ${formatDate(row.ends_at)}` : "No end"}</span></td>
                        <td data-label="Status"><AdminBadge value={row.is_active ? "active":"inactive"}/></td>
                        <td data-label="Action"><div className="adm-table-actions">
                            <button className="adm-btn" onClick={()=>openOffer(row)}>Edit</button>
                            {!row.deleted_at && <button className="adm-btn adm-btn-danger" onClick={()=>remove("offer",row.id)}>Delete</button>}
                        </div></td>
                    </tr>)}</tbody>
                </table></div>
            ) : (
                !data.coupons?.length ? <AdminEmpty title="No coupons found"/> :
                <div className="adm-table-wrap"><table className="adm-table">
                    <thead><tr><th>Code</th><th>Scope</th><th>Discount</th><th>Minimum</th><th>Usage</th><th>Status</th><th/></tr></thead>
                    <tbody>{data.coupons.map(row=><tr key={row.id}>
                        <td data-label="Code"><strong>{row.code}</strong></td>
                        <td data-label="Scope">{row.scope==="platform" ? "Platform" : row.vendor?.name || "Vendor"}</td>
                        <td data-label="Discount">{row.discount_type==="percentage" ? `${row.discount_value}%` : money(row.discount_value)}</td>
                        <td data-label="Minimum">{money(row.minimum_order_amount)}</td>
                        <td data-label="Usage">{row.used_count}{row.usage_limit ? ` / ${row.usage_limit}`:""}</td>
                        <td data-label="Status"><AdminBadge value={row.is_active ? "active":"inactive"}/></td>
                        <td data-label="Action"><div className="adm-table-actions">
                            <button className="adm-btn" onClick={()=>openCoupon(row)}>Edit</button>
                            {!row.deleted_at && <button className="adm-btn adm-btn-danger" onClick={()=>remove("coupon",row.id)}>Delete</button>}
                        </div></td>
                    </tr>)}</tbody>
                </table></div>
            )}
        </AdminCard>

        <AdminModal open={modal} title={`${editId ? "Edit":"Create"} ${tab==="offers" ? "Offer":"Coupon"}`}
            size="xl" onClose={()=>setModal(false)}>
            <div className="adm-form-grid">
                {tab==="offers" ? <>
                    <label className="adm-field"><span>Offer Name</span><input className="adm-input" value={form.name}
                        onChange={e=>setForm(c=>({...c,name:e.target.value}))}/></label>
                    <label className="adm-field"><span>Slug</span><input className="adm-input" value={form.slug}
                        onChange={e=>setForm(c=>({...c,slug:e.target.value}))}/></label>
                </> : <label className="adm-field full"><span>Coupon Code</span><input className="adm-input" value={form.code}
                    onChange={e=>setForm(c=>({...c,code:e.target.value}))}/></label>}

                <label className="adm-field"><span>Scope</span><select className="adm-select" value={form.scope}
                    onChange={e=>setForm(c=>({...c,scope:e.target.value}))}>
                    <option value="platform">Platform</option><option value="vendor">Vendor</option>
                </select></label>

                {form.scope==="vendor" && <label className="adm-field"><span>Seller</span>
                    <select className="adm-select" value={form.vendor_id}
                        onChange={e=>setForm(c=>({...c,vendor_id:e.target.value}))}>
                        <option value="">Select seller</option>
                        {data.vendors?.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
                    </select></label>}

                <label className="adm-field"><span>Discount Type</span><select className="adm-select" value={form.discount_type}
                    onChange={e=>setForm(c=>({...c,discount_type:e.target.value}))}>
                    <option value="percentage">Percentage</option><option value="flat">Flat</option>
                </select></label>
                <label className="adm-field"><span>Discount Value</span><input className="adm-input" type="number" min="0" step="0.01"
                    value={form.discount_value} onChange={e=>setForm(c=>({...c,discount_value:e.target.value}))}/></label>
                {tab==="coupons" && <label className="adm-field"><span>Minimum Order</span><input className="adm-input" type="number" min="0"
                    value={form.minimum_order_amount} onChange={e=>setForm(c=>({...c,minimum_order_amount:e.target.value}))}/></label>}
                <label className="adm-field"><span>Maximum Discount</span><input className="adm-input" type="number" min="0"
                    value={form.maximum_discount} onChange={e=>setForm(c=>({...c,maximum_discount:e.target.value}))}/></label>
                <label className="adm-field"><span>Starts At</span><input className="adm-input" type="datetime-local"
                    value={form.starts_at} onChange={e=>setForm(c=>({...c,starts_at:e.target.value}))}/></label>
                <label className="adm-field"><span>Ends At</span><input className="adm-input" type="datetime-local"
                    value={form.ends_at} onChange={e=>setForm(c=>({...c,ends_at:e.target.value}))}/></label>
                <label className="adm-check"><input type="checkbox" checked={form.is_active}
                    onChange={e=>setForm(c=>({...c,is_active:e.target.checked}))}/> Active</label>

                <div className="adm-field full"><span>Products</span>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6,maxHeight:220,overflow:"auto",border:"1px solid #e2e7ed",borderRadius:8,padding:8}}>
                        {data.products?.filter(p=>form.scope!=="vendor" || !form.vendor_id || String(p.vendor_id)===String(form.vendor_id))
                            .map(p=><label className="adm-check" key={p.id}><input type="checkbox"
                                checked={form.product_ids.includes(p.id)}
                                onChange={()=>toggle(setForm,"product_ids",p.id)}/>{p.name}</label>)}
                    </div>
                </div>

                {tab==="coupons" && <div className="adm-field full"><span>Categories</span>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6,maxHeight:180,overflow:"auto",border:"1px solid #e2e7ed",borderRadius:8,padding:8}}>
                        {data.categories?.map(c=><label className="adm-check" key={c.id}><input type="checkbox"
                            checked={form.category_ids.includes(c.id)}
                            onChange={()=>toggle(setForm,"category_ids",c.id)}/>{c.name}</label>)}
                    </div>
                </div>}
            </div>
            <div className="adm-modal-footer"><button className="adm-btn adm-btn-primary" onClick={save}>Save Promotion</button></div>
        </AdminModal>
        <AdminToast toast={toast}/>
    </AdminLayout>;
}
