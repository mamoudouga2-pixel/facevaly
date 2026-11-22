import { Link } from "react-router-dom";
import SellerLayout from "./Layout";
import useSellerAuth from "../../hooks/useSellerAuth";
import {
    SellerSuiteAlert,
    SellerSuiteBadge,
    SellerSuiteCard,
    SellerSuiteHeader,
} from "../../components/seller/SellerSuiteUI";
import "./seller-suite.css";

export default function SellerPendingApproval() {
    const { seller, refreshSeller } = useSellerAuth();
    const vendor = seller?.vendor || {};
    const status = String(vendor.status || "").toLowerCase();
    const approved = status === "active" && Boolean(vendor.is_active ?? true);

    if (approved) {
        return (
            <SellerLayout>
                <div className="ss-page">
                    <SellerSuiteHeader
                        title="Account approved"
                        description="Your seller account is active. You can upload and list products."
                        actions={
                            <Link to="/seller/products/create" className="ss-btn ss-btn-primary">
                                Add product
                            </Link>
                        }
                    />
                </div>
            </SellerLayout>
        );
    }

    return (
        <SellerLayout>
            <div className="ss-page">
                <SellerSuiteHeader
                    title="Pending for Approval"
                    description="Your store details and National ID have been submitted. Facevaly admin will review your account before you can list products."
                    actions={
                        <button
                            type="button"
                            className="ss-btn ss-btn-light"
                            onClick={() => refreshSeller?.()}
                        >
                            Refresh status
                        </button>
                    }
                />

                <div className="ss-page-actions" style={{ marginBottom: 16, gap: 8 }}>
                    <SellerSuiteBadge value="pending" />
                    <span style={{ fontWeight: 700 }}>
                        {vendor.status_label || "Pending for Approval"}
                    </span>
                </div>

                <SellerSuiteAlert type="warning">
                    Until an admin approves your account, product upload and marketplace
                    listing stay locked.
                </SellerSuiteAlert>

                <SellerSuiteCard
                    title="Submitted for review"
                    description="Keep this page bookmarked. You will get full seller access after approval."
                >
                    <ul className="ss-checklist">
                        <li>
                            NID front:{" "}
                            <strong>{vendor.has_nid_front ? "Submitted" : "Missing"}</strong>
                        </li>
                        <li>
                            NID back:{" "}
                            <strong>{vendor.has_nid_back ? "Submitted" : "Missing"}</strong>
                        </li>
                        <li>
                            Store address:{" "}
                            <strong>
                                {vendor.has_business_address ? "Submitted" : "Missing"}
                            </strong>
                        </li>
                        <li>
                            Account status:{" "}
                            <strong>{vendor.status_label || "Pending for Approval"}</strong>
                        </li>
                    </ul>

                    <div className="ss-page-actions" style={{ marginTop: 16 }}>
                        <Link to="/seller/complete-profile" className="ss-btn ss-btn-light">
                            Review submitted details
                        </Link>
                    </div>
                </SellerSuiteCard>
            </div>
        </SellerLayout>
    );
}
