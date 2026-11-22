import { Outlet } from "react-router-dom";
import { AdminAuthProvider } from "../admin/AdminAuthContext";

export default function AdminAuthLayout() {
    return (
        <AdminAuthProvider>
            <Outlet />
        </AdminAuthProvider>
    );
}
