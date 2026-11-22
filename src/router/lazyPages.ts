import { lazyNamedPage, lazyPage } from "./lazyRoute";

// Keep Home eager — storefront LCP critical path
export { default as Home } from "../pages/Home";

export const BecomeSeller = lazyPage(
    () => import("../pages/BecomeSeller/BecomeSeller")
);

export const SellerLogin = lazyPage(() => import("../pages/Seller/Login"));
export const SellerLogout = lazyPage(() => import("../pages/Seller/Logout"));
export const SellerPendingApproval = lazyPage(
    () => import("../pages/Seller/PendingApproval")
);
export const SellerDashboard = lazyPage(() => import("../pages/Seller/Dashboard"));
export const SellerOrders = lazyPage(() => import("../pages/Seller/Orders"));
export const SellerProductsIndex = lazyPage(
    () => import("../pages/Seller/Products/Index")
);
export const SellerProductCreate = lazyPage(
    () => import("../pages/Seller/Products/Create")
);
export const SellerProductEdit = lazyPage(
    () => import("../pages/Seller/Products/Edit")
);
export const SellerProductShow = lazyPage(
    () => import("../pages/Seller/Products/Show")
);
export const SellerInventory = lazyPage(() => import("../pages/Seller/Inventory"));
export const SellerCustomers = lazyPage(() => import("../pages/Seller/Customers"));
export const SellerWallet = lazyPage(() => import("../pages/Seller/Wallet"));
export const SellerPromotions = lazyPage(() => import("../pages/Seller/Promotions"));
export const SellerReturns = lazyPage(() => import("../pages/Seller/Returns"));
export const SellerReviews = lazyPage(() => import("../pages/Seller/Reviews"));
export const SellerReports = lazyPage(() => import("../pages/Seller/Reports"));
export const SellerStoreSettings = lazyPage(
    () => import("../pages/Seller/StoreSettings")
);
export const SellerCompleteProfile = lazyPage(
    () => import("../pages/Seller/CompleteProfile")
);
export const SellerStaff = lazyPage(() => import("../pages/Seller/Staff"));
export const SellerProfile = lazyPage(() => import("../pages/Seller/Profile"));
export const SellerSupport = lazyPage(() => import("../pages/Seller/Support"));
export const SellerNotifications = lazyPage(
    () => import("../pages/Seller/Notifications")
);

export const AdminLogin = lazyPage(() => import("../pages/Admin/Login"));
export const AdminDashboard = lazyPage(() => import("../pages/Admin/Dashboard"));
export const AdminSellers = lazyPage(() => import("../pages/Admin/Sellers"));
export const AdminProducts = lazyPage(() => import("../pages/Admin/Products"));
export const AdminPriceAdjustments = lazyPage(
    () => import("../pages/Admin/PriceAdjustments")
);
export const AdminProfile = lazyPage(() => import("../pages/Admin/Profile"));
export const AdminCatalog = lazyPage(() => import("../pages/Admin/Catalog"));
export const AdminOrders = lazyPage(() => import("../pages/Admin/Orders"));
export const AdminFinance = lazyPage(() => import("../pages/Admin/Finance"));
export const AdminPromotions = lazyPage(() => import("../pages/Admin/Promotions"));
export const AdminBanners = lazyPage(() => import("../pages/Admin/Banners"));
export const AdminLandingPages = lazyPage(
    () => import("../pages/Admin/LandingPages")
);
export const AdminContent = lazyPage(() => import("../pages/Admin/Content"));
export const AdminCourier = lazyPage(() => import("../pages/Admin/Courier"));
export const AdminCustomers = lazyPage(() => import("../pages/Admin/Customers"));
export const AdminReturns = lazyPage(() => import("../pages/Admin/Returns"));
export const AdminReviews = lazyPage(() => import("../pages/Admin/Reviews"));
export const AdminSupport = lazyPage(() => import("../pages/Admin/Support"));
export const AdminReports = lazyPage(() => import("../pages/Admin/Reports"));
export const AdminUsers = lazyPage(() => import("../pages/Admin/AdminUsers"));
export const AdminAuditLogs = lazyPage(() => import("../pages/Admin/AuditLogs"));
export const AdminSettings = lazyPage(() => import("../pages/Admin/Settings"));

export const Products = lazyPage(() => import("../pages/Storefront/Products"));
export const Checkout = lazyPage(() => import("../pages/Storefront/Checkout"));
export const OrderSuccess = lazyPage(() => import("../pages/Storefront/OrderSuccess"));
export const CategoryProducts = lazyPage(
    () => import("../pages/Storefront/CategoryProducts")
);
export const ProductDetail = lazyPage(
    () => import("../pages/Storefront/ProductDetail")
);
export const LandingPageView = lazyPage(
    () => import("../pages/Storefront/LandingPageView")
);
export const LandingSuccess = lazyPage(
    () => import("../pages/Storefront/LandingSuccess")
);
export const Cart = lazyPage(() => import("../pages/Storefront/Cart"));
export const FlashSalePage = lazyPage(
    () => import("../pages/Storefront/FlashSalePage")
);
export const Categories = lazyPage(() => import("../pages/Storefront/Categories"));
export const Account = lazyPage(() => import("../pages/Storefront/Account"));
export const CustomerLogin = lazyPage(
    () => import("../pages/Storefront/CustomerLogin")
);
export const CustomerRegister = lazyPage(
    () => import("../pages/Storefront/CustomerRegister")
);
export const CustomerOrders = lazyPage(
    () => import("../pages/Storefront/CustomerOrders")
);
export const CustomerWishlist = lazyPage(
    () => import("../pages/Storefront/CustomerWishlist")
);
export const CustomerAddresses = lazyPage(
    () => import("../pages/Storefront/CustomerAddresses")
);
export const CustomerAccountSettings = lazyPage(
    () => import("../pages/Storefront/CustomerAccountSettings")
);
export const CustomerVouchers = lazyPage(
    () => import("../pages/Storefront/CustomerVouchers")
);
export const CustomerLogout = lazyPage(
    () => import("../pages/Storefront/CustomerLogout")
);
export const VendorStore = lazyPage(() => import("../pages/Storefront/VendorStore"));
export const SearchResults = lazyPage(
    () => import("../pages/Storefront/SearchResults")
);
export const ReturnsPolicy = lazyPage(
    () => import("../pages/Storefront/ReturnsPolicy")
);
export const TermsAndConditions = lazyPage(
    () => import("../pages/Storefront/TermsAndConditions")
);
export const LegalPrivacy = lazyPage(
    () => import("../pages/Storefront/LegalPrivacy")
);

const footerStatic = () => import("../pages/Storefront/FooterStaticPages");

export const HelpCenterPage = lazyNamedPage(footerStatic, "HelpCenterPage");
export const HowToBuyPage = lazyNamedPage(footerStatic, "HowToBuyPage");
export const ContactUsPage = lazyNamedPage(footerStatic, "ContactUsPage");
export const CcmsPage = lazyNamedPage(footerStatic, "CcmsPage");
export const OurStoryPage = lazyNamedPage(footerStatic, "OurStoryPage");
export const BlogPage = lazyNamedPage(footerStatic, "BlogPage");
export const CaresPage = lazyNamedPage(footerStatic, "CaresPage");
export const UniversityPage = lazyNamedPage(footerStatic, "UniversityPage");
export const CodeOfConductPage = lazyNamedPage(
    footerStatic,
    "CodeOfConductPage"
);
export const FacevalyAppPage = lazyNamedPage(footerStatic, "FacevalyAppPage");
export const AffiliatePage = lazyNamedPage(footerStatic, "AffiliatePage");
export const ExclusivesPage = lazyNamedPage(footerStatic, "ExclusivesPage");
