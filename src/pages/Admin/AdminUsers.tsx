import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminBadge, AdminCard, AdminEmpty, AdminLoader, AdminModal,
    AdminPageHeader, AdminToast, firstError, formatDate,
} from "../../components/admin/AdminUI";
import "./admin.css";

const blankAdmin={name:"",email:"",phone:"",status:"active",password:"",role_ids:[],is_super_admin:false};
const blankRole={name:"",slug:"",description:"",is_active:true,permission_ids:[]};

export default function AdminUsers() {
    const [data,setData]=useState({admins:[],roles:[],permissions:{}});
    const [loading,setLoading]=useState(true);
    const [modal,setModal]=useState(null);
    const [editId,setEditId]=useState(null);
    const [adminForm,setAdminForm]=useState(blankAdmin);
    const [roleForm,setRoleForm]=useState(blankRole);
    const [toast,setToast]=useState(null);

    const notify=useCallback((m,t="success")=>{setToast({message:m,type:t});window.setTimeout(()=>setToast(null),3200)},[]);

    const load=useCallback(async()=>{
        setLoading(true);
        try{const r=await adminService.administrators();setData(r.data||{});}
        catch(e){notify(firstError(e),"error");}
        finally{setLoading(false);}
    },[notify]);

    useEffect(()=>{load();},[load]);

    const permissionGroups=useMemo(()=>Object.entries(data.permissions||{}),[data.permissions]);

    const openAdmin=(row=null)=>{
        setEditId(row?.id||null);
        setAdminForm(row?{
            name:row.name||"",email:row.email||"",phone:row.phone||"",status:row.status||"active",
            password:"",role_ids:row.roles?.map(r=>r.id)||[],is_super_admin:Boolean(row.is_super_admin),
        }:blankAdmin);
        setModal("admin");
    };

    const openRole=(row=null)=>{
        setEditId(row?.id||null);
        setRoleForm(row?{
            name:row.name||"",slug:row.slug||"",description:row.description||"",
            is_active:Boolean(row.is_active),permission_ids:row.permissions?.map(p=>p.id)||[],
        }:blankRole);
        setModal("role");
    };

    const toggleArray=(setter,key,id)=>setter(c=>({...c,[key]:c[key].includes(id)?c[key].filter(v=>v!==id):[...c[key],id]}));

    const saveAdmin=async()=>{
        try{
            const payload={...adminForm,phone:adminForm.phone||null,password:adminForm.password||null};
            const r=await adminService.saveAdministrator(editId,payload);
            notify(r.message);setModal(null);await load();
        }catch(e){notify(firstError(e),"error");}
    };

    const saveRole=async()=>{
        try{
            const r=await adminService.saveAdminRole(editId,roleForm);
            notify(r.message);setModal(null);await load();
        }catch(e){notify(firstError(e),"error");}
    };

    return <AdminLayout>
        <AdminPageHeader title="Administrators & Permissions"
            description="Create admin accounts, assign roles and control access to the Facevaly marketplace control plane."
            actions={<>
                <button className="adm-btn" onClick={()=>openRole()}><i className="fa-solid fa-key"/> New Role</button>
                <button className="adm-btn adm-btn-primary" onClick={()=>openAdmin()}><i className="fa-solid fa-user-plus"/> New Admin</button>
            </>}/>
        <div className="adm-two-col">
            <AdminCard title="Admin Users">
                {loading?<AdminLoader/>:!data.admins?.length?<AdminEmpty title="No administrators"/>:
                <div className="adm-table-wrap"><table className="adm-table">
                    <thead><tr><th>Administrator</th><th>Roles</th><th>Status</th><th>Super Admin</th><th>Created</th><th/></tr></thead>
                    <tbody>{data.admins.map(row=><tr key={row.id}>
                        <td data-label="Admin"><strong>{row.name}</strong><span className="adm-table-sub">{row.email}</span></td>
                        <td data-label="Roles">{row.roles?.map(r=>r.name).join(", ")||"—"}</td>
                        <td data-label="Status"><AdminBadge value={row.status}/></td>
                        <td data-label="Super Admin"><AdminBadge value={row.is_super_admin?"active":"inactive"}/></td>
                        <td data-label="Created">{formatDate(row.created_at)}</td>
                        <td data-label="Action"><button className="adm-btn" onClick={()=>openAdmin(row)}>Edit</button></td>
                    </tr>)}</tbody>
                </table></div>}
            </AdminCard>
            <AdminCard title="Roles">
                {loading?<AdminLoader/>:!data.roles?.length?<AdminEmpty title="No roles"/>:
                <div className="adm-table-wrap"><table className="adm-table">
                    <thead><tr><th>Role</th><th>Permissions</th><th>Status</th><th/></tr></thead>
                    <tbody>{data.roles.map(row=><tr key={row.id}>
                        <td data-label="Role"><strong>{row.name}</strong><span className="adm-table-sub">{row.slug}</span></td>
                        <td data-label="Permissions">{row.permissions?.length||0}</td>
                        <td data-label="Status"><AdminBadge value={row.is_active?"active":"inactive"}/></td>
                        <td data-label="Action"><button className="adm-btn" onClick={()=>openRole(row)}>Edit</button></td>
                    </tr>)}</tbody>
                </table></div>}
            </AdminCard>
        </div>

        <AdminModal open={modal==="admin"} title={`${editId?"Edit":"Create"} Administrator`} size="large" onClose={()=>setModal(null)}>
            <div className="adm-form-grid">
                <label className="adm-field"><span>Name</span><input className="adm-input" value={adminForm.name}
                    onChange={e=>setAdminForm(c=>({...c,name:e.target.value}))}/></label>
                <label className="adm-field"><span>Email</span><input className="adm-input" type="email" value={adminForm.email}
                    onChange={e=>setAdminForm(c=>({...c,email:e.target.value}))}/></label>
                <label className="adm-field"><span>Phone</span><input className="adm-input" value={adminForm.phone}
                    onChange={e=>setAdminForm(c=>({...c,phone:e.target.value}))}/></label>
                <label className="adm-field"><span>Status</span><select className="adm-select" value={adminForm.status}
                    onChange={e=>setAdminForm(c=>({...c,status:e.target.value}))}>
                    <option value="active">Active</option><option value="suspended">Suspended</option><option value="blocked">Blocked</option>
                </select></label>
                <label className="adm-field full"><span>{editId?"New Password (leave blank to keep current)":"Password"}</span>
                    <input className="adm-input" type="password" value={adminForm.password}
                        onChange={e=>setAdminForm(c=>({...c,password:e.target.value}))}/></label>
                <label className="adm-check full"><input type="checkbox" checked={adminForm.is_super_admin}
                    onChange={e=>setAdminForm(c=>({...c,is_super_admin:e.target.checked}))}/> Super Admin</label>
                <div className="adm-field full"><span>Roles</span>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:6,border:"1px solid #e2e7ed",borderRadius:8,padding:8}}>
                        {data.roles?.map(r=><label className="adm-check" key={r.id}><input type="checkbox"
                            checked={adminForm.role_ids.includes(r.id)}
                            onChange={()=>toggleArray(setAdminForm,"role_ids",r.id)}/>{r.name}</label>)}
                    </div>
                </div>
            </div>
            <div className="adm-modal-footer"><button className="adm-btn adm-btn-primary" onClick={saveAdmin}>Save Administrator</button></div>
        </AdminModal>

        <AdminModal open={modal==="role"} title={`${editId?"Edit":"Create"} Admin Role`} size="xl" onClose={()=>setModal(null)}>
            <div className="adm-form-grid">
                <label className="adm-field"><span>Role Name</span><input className="adm-input" value={roleForm.name}
                    onChange={e=>setRoleForm(c=>({...c,name:e.target.value}))}/></label>
                <label className="adm-field"><span>Slug</span><input className="adm-input" value={roleForm.slug}
                    onChange={e=>setRoleForm(c=>({...c,slug:e.target.value}))}/></label>
                <label className="adm-field full"><span>Description</span><textarea className="adm-textarea" value={roleForm.description}
                    onChange={e=>setRoleForm(c=>({...c,description:e.target.value}))}/></label>
                <label className="adm-check full"><input type="checkbox" checked={roleForm.is_active}
                    onChange={e=>setRoleForm(c=>({...c,is_active:e.target.checked}))}/> Active</label>
                <div className="adm-field full"><span>Permissions</span>
                    <div style={{display:"grid",gap:10}}>
                        {permissionGroups.map(([group,permissions])=><div key={group} style={{border:"1px solid #e2e7ed",borderRadius:8,padding:9}}>
                            <strong style={{display:"block",fontSize:8,marginBottom:7}}>{group}</strong>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:6}}>
                                {permissions.map(p=><label className="adm-check" key={p.id}><input type="checkbox"
                                    checked={roleForm.permission_ids.includes(p.id)}
                                    onChange={()=>toggleArray(setRoleForm,"permission_ids",p.id)}/>{p.name}</label>)}
                            </div>
                        </div>)}
                    </div>
                </div>
            </div>
            <div className="adm-modal-footer"><button className="adm-btn adm-btn-primary" onClick={saveRole}>Save Role</button></div>
        </AdminModal>
        <AdminToast toast={toast}/>
    </AdminLayout>;
}
