import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";

import adminService from "../services/adminService";


type AdminAuthValue = {
    admin: any;
    loading: boolean;
    authError: string;
    refresh: () => Promise<void>;
    logout: () => Promise<void>;
    can: (permission?: string | null) => boolean;
    isAuthenticated: boolean;
};


const AdminAuthContext = createContext<AdminAuthValue | null>(null);


export function AdminAuthProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [
        admin,
        setAdmin,
    ] = useState<any>(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        authError,
        setAuthError,
    ] = useState("");

    const adminRef = useRef<any>(null);
    adminRef.current = admin;


    const refresh = useCallback(async () => {
        const hadAdmin = Boolean(adminRef.current?.user?.id);

        // Only block the shell on the first resolve. Soft-refresh later so
        // route changes / me() blips do not look like a logout.
        if (!hadAdmin) {
            setLoading(true);
        }

        try {
            const response =
                await adminService.me();

            setAdmin(
                response?.data || null
            );

            setAuthError("");
        } catch (error: any) {
            const status =
                error?.response?.status;

            // Keep the existing admin on transient/network failures.
            // Only treat hard unauthenticated responses as logout.
            if (status === 401 || status === 403) {
                setAdmin(null);
                setAuthError(
                    error?.response?.data?.message
                    || ""
                );
            } else if (!hadAdmin) {
                setAdmin(null);
                setAuthError(
                    error?.response?.data?.message
                    || ""
                );
            }
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        refresh();
    }, [refresh]);


    const logout = useCallback(async () => {
        try {
            await adminService.logout();
        } finally {
            setAdmin(null);
            setAuthError("");
        }
    }, []);


    const permissionSet = useMemo(
        () =>
            new Set(
                admin?.permissions || []
            ),
        [admin?.permissions]
    );


    const can = useCallback(
        (permission?: string | null) => {
            if (!permission) {
                return true;
            }

            return permissionSet.has("*")
                || permissionSet.has(permission);
        },
        [permissionSet]
    );


    const value = useMemo(
        () => ({
            admin,
            loading,
            authError,
            refresh,
            logout,
            can,
            isAuthenticated: Boolean(admin?.user?.id),
        }),
        [
            admin,
            loading,
            authError,
            refresh,
            logout,
            can,
        ]
    );


    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
}


export function useAdminAuth() {
    const value = useContext(AdminAuthContext);

    if (!value) {
        throw new Error(
            "useAdminAuth must be used inside AdminAuthProvider."
        );
    }

    return value;
}
