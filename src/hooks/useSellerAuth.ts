import { useContext } from "react";
import { SellerAuthContext } from "../context/SellerAuthContext";

export type SellerAuthContextValue = {
    seller: any | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (payload: any) => Promise<any>;
    logout: () => Promise<boolean>;
    refreshSeller: () => Promise<any>;
    setSeller: (seller: any) => void;
};

export default function useSellerAuth(): SellerAuthContextValue {
    const context = useContext(SellerAuthContext) as SellerAuthContextValue | null;

    if (!context) {
        throw new Error(
            "useSellerAuth must be used inside SellerAuthProvider."
        );
    }

    return context;
}
