import type { ComponentType } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import FrontendLayout from "../layouts/FrontendLayout";
import ScrollToTop from "../components/common/ScrollToTop";
import SellerProtectedRoute from "../components/SellerProtectedRoute";
import CustomerAccountRoute from "../components/CustomerAccountRoute";
import { SellerAuthProvider } from "../context/SellerAuthContext";
import { CartProvider } from "../context/CartContext";
import { WishlistProvider } from "../context/WishlistContext";
import { StorefrontToastProvider } from "../context/StorefrontToastContext";
import AdminProtectedRoute from "../admin/AdminProtectedRoute";
import AdminAuthLayout from "./AdminAuthLayout";
import { Lazy } from "./lazyRoute";
import * as Pages from "./lazyPages";

function PlaceholderPage({ title }: { title: string }) {
    return (
        <div
            style={{
                maxWidth: "1280px",
                margin: "0 auto",
                padding: "50px 20px",
            }}
        >
            <h1>{title}</h1>
        </div>
    );
}

function lazyElement(
    Component: ComponentType<any>
) {
    return (
        <Lazy>
            <Component />
        </Lazy>
    );
}

export default function AppRouter() {
    return (
        <BrowserRouter>
            <SellerAuthProvider>
            <StorefrontToastProvider>
            <CartProvider>
            <WishlistProvider>
            <ScrollToTop />
            <Routes>
                <Route element={<FrontendLayout />}>
                    <Route path="/" element={<Pages.Home />} />
                    <Route
                        path="/about"
                        element={lazyElement(Pages.OurStoryPage)}
                    />
                    <Route
                        path="/categories"
                        element={lazyElement(Pages.Categories)}
                    />
                    <Route
                        path="/category/:slug"
                        element={lazyElement(Pages.CategoryProducts)}
                    />
                    <Route
                        path="/product/:slug"
                        element={lazyElement(Pages.ProductDetail)}
                    />
                    <Route path="/cart" element={lazyElement(Pages.Cart)} />
                    <Route
                        path="/search"
                        element={lazyElement(Pages.SearchResults)}
                    />
                    <Route
                        path="/flash-sale"
                        element={lazyElement(Pages.FlashSalePage)}
                    />
                    <Route
                        path="/brands"
                        element={<PlaceholderPage title="Brands" />}
                    />
                    <Route
                        path="/store/:slug"
                        element={lazyElement(Pages.VendorStore)}
                    />
                    <Route
                        path="/wishlist"
                        element={lazyElement(Pages.CustomerWishlist)}
                    />
                    <Route
                        path="/orders"
                        element={lazyElement(Pages.CustomerOrders)}
                    />
                    <Route
                        path="/login"
                        element={lazyElement(Pages.CustomerLogin)}
                    />
                    <Route
                        path="/register"
                        element={lazyElement(Pages.CustomerRegister)}
                    />
                    <Route
                        path="/logout"
                        element={lazyElement(Pages.CustomerLogout)}
                    />
                    <Route element={<CustomerAccountRoute />}>
                        <Route
                            path="/account"
                            element={lazyElement(Pages.Account)}
                        />
                        <Route
                            path="/account/orders"
                            element={lazyElement(Pages.CustomerOrders)}
                        />
                        <Route
                            path="/account/wishlist"
                            element={lazyElement(Pages.CustomerWishlist)}
                        />
                        <Route
                            path="/account/addresses"
                            element={lazyElement(Pages.CustomerAddresses)}
                        />
                        <Route
                            path="/account/settings"
                            element={lazyElement(Pages.CustomerAccountSettings)}
                        />
                        <Route
                            path="/account/vouchers"
                            element={lazyElement(Pages.CustomerVouchers)}
                        />
                    </Route>
                    <Route
                        path="/contact"
                        element={lazyElement(Pages.ContactUsPage)}
                    />
                    <Route
                        path="/help"
                        element={lazyElement(Pages.HelpCenterPage)}
                    />
                    <Route
                        path="/help-support"
                        element={<Navigate to="/help" replace />}
                    />
                    <Route
                        path="/how-to-buy"
                        element={lazyElement(Pages.HowToBuyPage)}
                    />
                    <Route path="/ccms" element={lazyElement(Pages.CcmsPage)} />
                    <Route path="/blog" element={lazyElement(Pages.BlogPage)} />
                    <Route path="/cares" element={lazyElement(Pages.CaresPage)} />
                    <Route
                        path="/university"
                        element={lazyElement(Pages.UniversityPage)}
                    />
                    <Route
                        path="/code-of-conduct"
                        element={lazyElement(Pages.CodeOfConductPage)}
                    />
                    <Route path="/app" element={lazyElement(Pages.FacevalyAppPage)} />
                    <Route
                        path="/affiliate"
                        element={lazyElement(Pages.AffiliatePage)}
                    />
                    <Route
                        path="/exclusives"
                        element={lazyElement(Pages.ExclusivesPage)}
                    />
                    <Route
                        path="/returns"
                        element={lazyElement(Pages.ReturnsPolicy)}
                    />
                    <Route
                        path="/returns-refunds"
                        element={<Navigate to="/returns" replace />}
                    />
                    <Route
                        path="/shipping"
                        element={
                            <PlaceholderPage title="Shipping Information" />
                        }
                    />
                    <Route
                        path="/privacy-policy"
                        element={lazyElement(Pages.LegalPrivacy)}
                    />
                    <Route
                        path="/privacy"
                        element={<Navigate to="/privacy-policy" replace />}
                    />
                    <Route
                        path="/terms-and-conditions"
                        element={lazyElement(Pages.TermsAndConditions)}
                    />
                    <Route
                        path="/terms"
                        element={
                            <Navigate to="/terms-and-conditions" replace />
                        }
                    />
                    <Route path="/shop" element={lazyElement(Pages.Products)} />
                    <Route
                        path="/checkout"
                        element={lazyElement(Pages.Checkout)}
                    />
                    <Route
                        path="/order-success/:token"
                        element={lazyElement(Pages.OrderSuccess)}
                    />
                </Route>

                <Route
                    path="/become-a-seller"
                    element={lazyElement(Pages.BecomeSeller)}
                />
                <Route
                    path="/p/:slug"
                    element={lazyElement(Pages.LandingPageView)}
                />
                <Route
                    path="/lp/:slug"
                    element={lazyElement(Pages.LandingPageView)}
                />
                <Route
                    path="/l/:slug"
                    element={lazyElement(Pages.LandingPageView)}
                />
                <Route
                    path="/landing-success/:productSlug"
                    element={lazyElement(Pages.LandingSuccess)}
                />

                <Route
                    path="/seller/login"
                    element={lazyElement(Pages.SellerLogin)}
                />
                <Route
                    path="/seller/logout"
                    element={lazyElement(Pages.SellerLogout)}
                />
                <Route
                    path="/seller/pending-approval"
                    element={
                        <SellerProtectedRoute allowPending>
                            {lazyElement(Pages.SellerPendingApproval)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/dashboard"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerDashboard)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/complete-profile"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerCompleteProfile)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/orders"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerOrders)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/products"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerProductsIndex)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/products/create"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerProductCreate)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/products/:productId/edit"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerProductEdit)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/products/:productId"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerProductShow)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/inventory"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerInventory)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/customers"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerCustomers)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/wallet"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerWallet)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/promotions"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerPromotions)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/returns"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerReturns)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/reviews"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerReviews)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/reports"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerReports)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/store"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerStoreSettings)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/staff"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerStaff)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/profile"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerProfile)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/support"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerSupport)}
                        </SellerProtectedRoute>
                    }
                />
                <Route
                    path="/seller/notifications"
                    element={
                        <SellerProtectedRoute>
                            {lazyElement(Pages.SellerNotifications)}
                        </SellerProtectedRoute>
                    }
                />

                <Route element={<AdminAuthLayout />}>
                    <Route
                        path="/admin/home-banner"
                        element={<Navigate to="/admin/banners" replace />}
                    />
                    <Route
                        path="/admin/login"
                        element={lazyElement(Pages.AdminLogin)}
                    />
                    <Route
                        path="/admin"
                        element={
                            <AdminProtectedRoute>
                                {lazyElement(Pages.AdminDashboard)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/profile"
                        element={
                            <AdminProtectedRoute>
                                {lazyElement(Pages.AdminProfile)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/dashboard"
                        element={
                            <AdminProtectedRoute>
                                {lazyElement(Pages.AdminDashboard)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/sellers"
                        element={
                            <AdminProtectedRoute permission="sellers.view">
                                {lazyElement(Pages.AdminSellers)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/products"
                        element={
                            <AdminProtectedRoute permission="products.view">
                                {lazyElement(Pages.AdminProducts)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/pricing"
                        element={
                            <AdminProtectedRoute permission="pricing.manage">
                                {lazyElement(Pages.AdminPriceAdjustments)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/catalog"
                        element={
                            <AdminProtectedRoute
                                anyOf={[
                                    "categories.manage",
                                    "brands.manage",
                                ]}
                            >
                                {lazyElement(Pages.AdminCatalog)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/orders"
                        element={
                            <AdminProtectedRoute permission="orders.view">
                                {lazyElement(Pages.AdminOrders)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/finance"
                        element={
                            <AdminProtectedRoute permission="finance.view">
                                {lazyElement(Pages.AdminFinance)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/promotions"
                        element={
                            <AdminProtectedRoute permission="promotions.manage">
                                {lazyElement(Pages.AdminPromotions)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/content"
                        element={
                            <AdminProtectedRoute permission="content.manage">
                                {lazyElement(Pages.AdminContent)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/banners"
                        element={
                            <AdminProtectedRoute permission="banners.manage">
                                {lazyElement(Pages.AdminBanners)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/landing-pages"
                        element={
                            <AdminProtectedRoute permission="landing_pages.manage">
                                {lazyElement(Pages.AdminLandingPages)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/courier"
                        element={
                            <AdminProtectedRoute permission="courier.manage">
                                {lazyElement(Pages.AdminCourier)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/customers"
                        element={
                            <AdminProtectedRoute permission="customers.view">
                                {lazyElement(Pages.AdminCustomers)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/returns"
                        element={
                            <AdminProtectedRoute permission="returns.manage">
                                {lazyElement(Pages.AdminReturns)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/reviews"
                        element={
                            <AdminProtectedRoute permission="reviews.manage">
                                {lazyElement(Pages.AdminReviews)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/support"
                        element={
                            <AdminProtectedRoute permission="support.manage">
                                {lazyElement(Pages.AdminSupport)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/reports"
                        element={
                            <AdminProtectedRoute permission="reports.view">
                                {lazyElement(Pages.AdminReports)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/administrators"
                        element={
                            <AdminProtectedRoute permission="admins.manage">
                                {lazyElement(Pages.AdminUsers)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/audit-logs"
                        element={
                            <AdminProtectedRoute permission="audit.view">
                                {lazyElement(Pages.AdminAuditLogs)}
                            </AdminProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/settings"
                        element={
                            <AdminProtectedRoute permission="settings.manage">
                                {lazyElement(Pages.AdminSettings)}
                            </AdminProtectedRoute>
                        }
                    />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </WishlistProvider>
            </CartProvider>
            </StorefrontToastProvider>
            </SellerAuthProvider>
        </BrowserRouter>
    );
}
