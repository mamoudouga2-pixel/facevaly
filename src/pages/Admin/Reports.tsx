import { useCallback, useEffect, useState } from "react";
import AdminLayout from "./Layout";
import adminService from "../../services/adminService";
import {
    AdminCard, AdminEmpty, AdminLoader, AdminMetric, AdminPageHeader,
    AdminToast, firstError, money,
} from "../../components/admin/AdminUI";
import "./admin.css";

function LineChart({rows=[]}) {
    const W=800,H=240,p={l:52,r:20,t:18,b:35};
    const max=Math.max(1,...rows.map(r=>Math.max(Number(r.sales||0),Number(r.commission||0))));
    const iw=W-p.l-p.r,ih=H-p.t-p.b;
    const pts=key=>rows.map((r,i)=>({x:p.l+(rows.length>1?i/(rows.length-1):.5)*iw,y:p.t+ih-(Number(r[key]||0)/max)*ih}));
    const a=pts("sales"),b=pts("commission");
    const path=x=>x.map((q,i)=>`${i?"L":"M"} ${q.x} ${q.y}`).join(" ");
    return <div className="adm-chart-scroll"><svg viewBox={`0 0 ${W} ${H}`} className="adm-chart">
        {[0,.25,.5,.75,1].map(v=>{const y=p.t+ih-v*ih;return <g key={v}>
            <line x1={p.l} y1={y} x2={W-p.r} y2={y} className="adm-chart-grid"/>
            <text x={p.l-8} y={y+3} textAnchor="end" className="adm-chart-axis">
                {Math.round(max*v).toLocaleString("en-BD",{notation:"compact",maximumFractionDigits:1})}
            </text></g>})}
        <path d={path(a)} className="adm-chart-sales"/><path d={path(b)} className="adm-chart-commission"/>
        {rows.map((r,i)=>(i%3===0||i===rows.length-1)?<text key={r.date} x={a[i]?.x||p.l} y={H-10} textAnchor="middle" className="adm-chart-axis">{r.label}</text>:null)}
    </svg></div>;
}

export default function AdminReports() {
    const today=new Date();
    const before=new Date(); before.setDate(today.getDate()-29);
    const iso=d=>d.toISOString().slice(0,10);
    const [filters,setFilters]=useState({from:iso(before),to:iso(today)});
    const [data,setData]=useState(null);
    const [loading,setLoading]=useState(true);
    const [toast,setToast]=useState(null);
    const notify=useCallback((m,t="success")=>{setToast({message:m,type:t});window.setTimeout(()=>setToast(null),3200)},[]);

    const load=useCallback(async()=>{
        setLoading(true);
        try{const r=await adminService.reports(filters);setData(r.data||null);}
        catch(e){notify(firstError(e),"error");}
        finally{setLoading(false);}
    },[filters,notify]);

    useEffect(()=>{load();},[load]);

    return <AdminLayout>
        <AdminPageHeader title="Reports & Analytics"
            description="Marketplace revenue, commission, seller performance, top products, refunds and payouts."
            actions={<div className="adm-toolbar" style={{margin:0}}>
                <input className="adm-input" type="date" value={filters.from} onChange={e=>setFilters(c=>({...c,from:e.target.value}))}/>
                <input className="adm-input" type="date" value={filters.to} onChange={e=>setFilters(c=>({...c,to:e.target.value}))}/>
            </div>}/>
        {loading?<AdminLoader/>:data?<>
            <div className="adm-metric-grid">
                <AdminMetric icon="fa-solid fa-cart-shopping" label="Orders" value={data.summary?.orders_total||0}/>
                <AdminMetric icon="fa-solid fa-money-bill-trend-up" label="Gross Sales" value={money(data.summary?.gross_sales)} tone="green"/>
                <AdminMetric icon="fa-solid fa-percent" label="Commission" value={money(data.summary?.platform_commission)} tone="blue"/>
                <AdminMetric icon="fa-solid fa-store" label="Seller Earnings" value={money(data.summary?.vendor_earnings)} tone="purple"/>
                <AdminMetric icon="fa-solid fa-rotate-left" label="Refunds" value={money(data.summary?.refunds_total)} tone="red"/>
                <AdminMetric icon="fa-solid fa-money-bill-transfer" label="Payouts" value={money(data.summary?.payouts_total)} tone="amber"/>
            </div>
            <AdminCard title="Sales & Commission Trend" description={`${data.range?.from||filters.from} to ${data.range?.to||filters.to}`}>
                <LineChart rows={data.daily||[]}/>
            </AdminCard>
            <div className="adm-two-col">
                <AdminCard title="Top Products">
                    {!data.top_products?.length?<AdminEmpty title="No product sales"/>:
                    <div className="adm-table-wrap"><table className="adm-table">
                        <thead><tr><th>Product</th><th>Sold</th><th>Sales</th></tr></thead>
                        <tbody>{data.top_products.map((r,i)=><tr key={`${r.product_id}-${i}`}>
                            <td data-label="Product"><strong>{r.product_name}</strong><span className="adm-table-sub">{r.sku||"—"}</span></td>
                            <td data-label="Sold">{r.quantity_sold}</td><td data-label="Sales">{money(r.sales)}</td>
                        </tr>)}</tbody>
                    </table></div>}
                </AdminCard>
                <AdminCard title="Top Sellers">
                    {!data.top_vendors?.length?<AdminEmpty title="No seller sales"/>:
                    <div className="adm-table-wrap"><table className="adm-table">
                        <thead><tr><th>Seller</th><th>Orders</th><th>Sales</th><th>Commission</th></tr></thead>
                        <tbody>{data.top_vendors.map(r=><tr key={r.vendor_id}>
                            <td data-label="Seller"><strong>{r.vendor_name}</strong></td>
                            <td data-label="Orders">{r.orders_count}</td><td data-label="Sales">{money(r.sales)}</td>
                            <td data-label="Commission">{money(r.commission)}</td>
                        </tr>)}</tbody>
                    </table></div>}
                </AdminCard>
            </div>
        </>:<AdminEmpty title="No report data"/>}
        <AdminToast toast={toast}/>
    </AdminLayout>;
}
