import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminBadge, AdminCard, AdminEmpty, AdminLoader, AdminModal,
    AdminPageHeader, AdminToast, firstError, formatDate,
} from "../../components/admin/AdminUI";
import { mediaUrl } from "../../config/api";
import "./admin.css";

const blank = {
    admin_name:"", link_url:"", link_target:"_self", sort_order:0,
    starts_at:"", ends_at:"", is_active:true,
    image:null, mobile_image:null, remove_mobile_image:false,
};

export default function AdminBanners() {
    const [data,setData] = useState({slides:[],settings:null});
    const [settings,setSettings] = useState({});
    const [loading,setLoading] = useState(true);
    const [modal,setModal] = useState(false);
    const [editId,setEditId] = useState(null);
    const [form,setForm] = useState(blank);
    const [toast,setToast] = useState(null);

    const notify = useCallback((message,type="success")=>{
        setToast({message,type}); window.setTimeout(()=>setToast(null),3200);
    },[]);

    const load = useCallback(async()=>{
        setLoading(true);
        try {
            const r = await adminService.banners();
            setData(r.data || {});
            setSettings(r.data?.settings || {});
        } catch(e){ notify(firstError(e),"error"); }
        finally { setLoading(false); }
    },[notify]);

    useEffect(()=>{load();},[load]);

    const openSlide = (row=null) => {
        setEditId(row?.id || null);
        setForm(row ? {
            admin_name:row.admin_name || "", link_url:row.link_url || "",
            link_target:row.link_target || "_self", sort_order:row.sort_order || 0,
            starts_at:row.starts_at ? String(row.starts_at).slice(0,16) : "",
            ends_at:row.ends_at ? String(row.ends_at).slice(0,16) : "",
            is_active:Boolean(row.is_active), image:null, mobile_image:null,
            remove_mobile_image:false, existing_mobile_image:row.mobile_image_path,
        } : blank);
        setModal(true);
    };

    const slideData = () => {
        const p = new FormData();
        ["admin_name","link_url","link_target","sort_order","starts_at","ends_at"].forEach(k=>p.append(k,form[k] ?? ""));
        p.append("is_active",form.is_active ? "1":"0");
        p.append("remove_mobile_image",form.remove_mobile_image ? "1":"0");
        if(form.image instanceof File) p.append("image",form.image);
        if(form.mobile_image instanceof File) p.append("mobile_image",form.mobile_image);
        return p;
    };

    const saveSlide = async() => {
        try {
            const r = await adminService.saveBanner(editId,slideData());
            notify(r.message); setModal(false); await load();
        } catch(e){ notify(firstError(e),"error");}
    };

    const remove = async(id) => {
        if(!window.confirm("Move this banner to trash?")) return;
        try { const r=await adminService.deleteBanner(id); notify(r.message); await load(); }
        catch(e){notify(firstError(e),"error");}
    };

    const restore = async(id) => {
        try { const r=await adminService.restoreBanner(id); notify(r.message); await load(); }
        catch(e){notify(firstError(e),"error");}
    };

    const saveSettings = async() => {
        const p = new FormData();
        ["autoplay_ms","app_title","rating_text","promo_heading","benefit_one_text",
         "benefit_two_text","app_store_url","play_store_url","footer_text"].forEach(
            k=>p.append(k,settings[k] ?? "")
        );
        p.append("pause_on_hover",settings.pause_on_hover ? "1":"0");
        p.append("show_right_panel",settings.show_right_panel ? "1":"0");
        if(settings.app_icon instanceof File) p.append("app_icon",settings.app_icon);
        if(settings.qr_image instanceof File) p.append("qr_image",settings.qr_image);
        try {
            const r=await adminService.saveBannerSettings(p);
            notify(r.message); await load();
        } catch(e){notify(firstError(e),"error");}
    };

    return <AdminLayout>
        <AdminPageHeader title="Homepage Banners"
            description="Control the automatic hero slider and editable desktop app panel."
            actions={<button className="adm-btn adm-btn-primary" onClick={()=>openSlide()}>
                <i className="fa-solid fa-plus"/> Add Banner
            </button>}
        />

        <AdminCard title="Banner Slides">
            {loading ? <AdminLoader/> : !data.slides?.length ? <AdminEmpty title="No banner slides"/> :
            <div className="adm-table-wrap"><table className="adm-table">
                <thead><tr><th>Preview</th><th>Name</th><th>Link</th><th>Schedule</th><th>Sort</th><th>Status</th><th/></tr></thead>
                <tbody>{data.slides.map(row=><tr key={row.id}>
                    <td data-label="Preview"><span className="adm-thumb" style={{width:90,height:46}}>
                        <img src={mediaUrl(row.image_path)} alt={row.admin_name || "Banner"}/></span></td>
                    <td data-label="Name"><strong>{row.admin_name || `Slide ${row.id}`}</strong></td>
                    <td data-label="Link">{row.link_url || "—"}</td>
                    <td data-label="Schedule">{row.starts_at ? formatDate(row.starts_at) : "Immediate"}
                        <span className="adm-table-sub">{row.ends_at ? `Ends ${formatDate(row.ends_at)}`:"No end date"}</span></td>
                    <td data-label="Sort">{row.sort_order}</td>
                    <td data-label="Status"><AdminBadge value={row.deleted_at ? "deleted" : row.is_active ? "active":"inactive"}/></td>
                    <td data-label="Action"><div className="adm-table-actions">
                        {row.deleted_at ? <button className="adm-btn" onClick={()=>restore(row.id)}>Restore</button> : <>
                            <button className="adm-btn" onClick={()=>openSlide(row)}>Edit</button>
                            <button className="adm-btn adm-btn-danger" onClick={()=>remove(row.id)}>Delete</button>
                        </>}
                    </div></td>
                </tr>)}</tbody>
            </table></div>}
        </AdminCard>

        {!loading && <AdminCard title="Slider & App Panel Settings"
            description="Mobile storefront continues to hide the right app panel automatically.">
            <div className="adm-form-grid">
                <label className="adm-field"><span>Autoplay (ms)</span><input className="adm-input" type="number" min="1500"
                    value={settings.autoplay_ms || 4500} onChange={e=>setSettings(c=>({...c,autoplay_ms:e.target.value}))}/></label>
                <label className="adm-check"><input type="checkbox" checked={Boolean(settings.pause_on_hover)}
                    onChange={e=>setSettings(c=>({...c,pause_on_hover:e.target.checked}))}/> Pause on hover</label>
                {[
                    ["app_title","App Title"],["rating_text","Rating Text"],["promo_heading","Promo Heading"],
                    ["benefit_one_text","Benefit One"],["benefit_two_text","Benefit Two"],
                    ["app_store_url","App Store URL"],["play_store_url","Play Store URL"],["footer_text","Footer Text"],
                ].map(([key,label])=><label className={`adm-field ${key==="footer_text"?"full":""}`} key={key}>
                    <span>{label}</span><input className="adm-input" value={settings[key] || ""}
                        onChange={e=>setSettings(c=>({...c,[key]:e.target.value}))}/></label>)}
                <label className="adm-field"><span>App Icon</span><input className="adm-input" type="file" accept="image/*"
                    onChange={e=>setSettings(c=>({...c,app_icon:e.target.files?.[0] || null}))}/></label>
                <label className="adm-field"><span>QR Image</span><input className="adm-input" type="file" accept="image/*"
                    onChange={e=>setSettings(c=>({...c,qr_image:e.target.files?.[0] || null}))}/></label>
                <label className="adm-check full"><input type="checkbox" checked={Boolean(settings.show_right_panel)}
                    onChange={e=>setSettings(c=>({...c,show_right_panel:e.target.checked}))}/> Show desktop right-side app panel</label>
            </div>
            <div className="adm-modal-footer"><button className="adm-btn adm-btn-primary" onClick={saveSettings}>Save Settings</button></div>
        </AdminCard>}

        <AdminModal open={modal} title={editId ? "Edit Banner":"Add Banner"} size="large" onClose={()=>setModal(false)}>
            <div className="adm-form-grid">
                <label className="adm-field"><span>Admin Name</span><input className="adm-input" value={form.admin_name}
                    onChange={e=>setForm(c=>({...c,admin_name:e.target.value}))}/></label>
                <label className="adm-field"><span>Sort Order</span><input className="adm-input" type="number" min="0" value={form.sort_order}
                    onChange={e=>setForm(c=>({...c,sort_order:e.target.value}))}/></label>
                <label className="adm-field full"><span>Link URL</span><input className="adm-input" value={form.link_url}
                    onChange={e=>setForm(c=>({...c,link_url:e.target.value}))}/></label>
                <label className="adm-field"><span>Link Target</span><select className="adm-select" value={form.link_target}
                    onChange={e=>setForm(c=>({...c,link_target:e.target.value}))}>
                    <option value="_self">Same Tab</option><option value="_blank">New Tab</option>
                </select></label>
                <label className="adm-check"><input type="checkbox" checked={form.is_active}
                    onChange={e=>setForm(c=>({...c,is_active:e.target.checked}))}/> Active</label>
                <label className="adm-field"><span>Desktop Image {editId ? "(optional replacement)":""}</span>
                    <input className="adm-input" type="file" accept="image/*"
                        onChange={e=>setForm(c=>({...c,image:e.target.files?.[0] || null}))}/></label>
                <label className="adm-field"><span>Mobile Image</span><input className="adm-input" type="file" accept="image/*"
                    onChange={e=>setForm(c=>({...c,mobile_image:e.target.files?.[0] || null}))}/></label>
                <label className="adm-field"><span>Starts At</span><input className="adm-input" type="datetime-local" value={form.starts_at}
                    onChange={e=>setForm(c=>({...c,starts_at:e.target.value}))}/></label>
                <label className="adm-field"><span>Ends At</span><input className="adm-input" type="datetime-local" value={form.ends_at}
                    onChange={e=>setForm(c=>({...c,ends_at:e.target.value}))}/></label>
                {form.existing_mobile_image && <label className="adm-check full"><input type="checkbox" checked={form.remove_mobile_image}
                    onChange={e=>setForm(c=>({...c,remove_mobile_image:e.target.checked}))}/> Remove current mobile image</label>}
            </div>
            <div className="adm-modal-footer"><button className="adm-btn adm-btn-primary" onClick={saveSlide}>Save Banner</button></div>
        </AdminModal>
        <AdminToast toast={toast}/>
    </AdminLayout>;
}
