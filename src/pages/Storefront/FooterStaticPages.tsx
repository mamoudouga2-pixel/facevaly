import StaticInfoPage from "./StaticInfoPage";

export function HelpCenterPage() {
    return (
        <StaticInfoPage
            eyebrow="Help & support"
            icon="fa-regular fa-circle-question"
            title="Help Center"
            intro="Find answers about orders, delivery, payments, returns and your Facevaly account. Everything here is written for shoppers in Bangladesh."
            highlights={[
                {
                    icon: "fa-solid fa-box",
                    title: "Orders",
                    text: "Track status, change delivery details and manage cancellations.",
                },
                {
                    icon: "fa-solid fa-wallet",
                    title: "Payments",
                    text: "Cash on delivery, bKash, cards and refund timelines explained.",
                },
                {
                    icon: "fa-solid fa-headset",
                    title: "Support",
                    text: "Reach our team when something does not match your order.",
                },
            ]}
            sections={[
                {
                    title: "Common topics",
                    list: [
                        "Where is my order and how do I track delivery?",
                        "How do I pay with bKash, Nagad or cash on delivery?",
                        "What if my product arrives damaged or incomplete?",
                        "How do I update my phone number or delivery address?",
                        "Can I cancel before the parcel leaves the seller?",
                    ],
                },
                {
                    title: "Before you contact us",
                    body: [
                        "Have your order number ready. Photos of the product and packaging help us resolve issues faster, especially for damaged or wrong-item cases.",
                    ],
                },
            ]}
        />
    );
}

export function HowToBuyPage() {
    return (
        <StaticInfoPage
            eyebrow="Help & support"
            icon="fa-solid fa-cart-shopping"
            title="How to buy on Facevaly"
            intro="Shopping on Facevaly takes a few minutes. Browse, compare sellers, choose delivery and pay the way that suits you."
            steps={[
                "Search or browse categories to find what you need.",
                "Open a product page, pick size or variant if available, and add to cart or buy now.",
                "Sign in or continue as a guest, then enter your delivery address.",
                "Choose inside or outside Dhaka delivery and confirm cash on delivery or online payment.",
                "Track your order from My Account until it arrives.",
            ]}
            sections={[
                {
                    title: "Tips for a smooth order",
                    list: [
                        "Double-check your phone number — couriers call before delivery.",
                        "Read the seller rating and return policy on the product page.",
                        "Save items to your wishlist if you are comparing options.",
                    ],
                },
            ]}
        />
    );
}

export function ContactUsPage() {
    return (
        <StaticInfoPage
            eyebrow="Help & support"
            icon="fa-regular fa-envelope"
            title="Contact us"
            intro="Our support team helps with orders, payments, delivery and account questions. We aim to respond within one business day."
            highlights={[
                {
                    icon: "fa-solid fa-phone",
                    title: "Phone",
                    text: "16780 — Sunday to Thursday, 9:00 AM – 6:00 PM (BST).",
                },
                {
                    icon: "fa-regular fa-envelope",
                    title: "Email",
                    text: "support@facevaly.com for order and account enquiries.",
                },
                {
                    icon: "fa-solid fa-location-dot",
                    title: "Office",
                    text: "Dhaka, Bangladesh — online marketplace operations.",
                },
            ]}
            sections={[
                {
                    title: "What to include in your message",
                    list: [
                        "Your order number or registered phone number.",
                        "A clear description of the issue.",
                        "Photos if the item is damaged, wrong or missing parts.",
                    ],
                },
            ]}
        />
    );
}

export function CcmsPage() {
    return (
        <StaticInfoPage
            eyebrow="Help & support"
            icon="fa-solid fa-scale-balanced"
            title="File a complaint (CCMS)"
            intro="The Consumer Complaint Management System (CCMS) gives you a formal channel to escalate unresolved marketplace issues after you have contacted Facevaly support."
            sections={[
                {
                    title: "When to use CCMS",
                    body: [
                        "Use CCMS when a complaint about an order, refund or seller behaviour has not been resolved through normal support within a reasonable time.",
                    ],
                    list: [
                        "Refund not processed after an approved return.",
                        "Repeated delivery failure without resolution.",
                        "Suspected fraud or misleading product listing.",
                    ],
                },
                {
                    title: "What you will need",
                    list: [
                        "Your Facevaly order number and support ticket reference if available.",
                        "Dates and summary of previous contact with support.",
                        "Supporting documents such as photos, payment proof or courier notes.",
                    ],
                },
                {
                    title: "Process overview",
                    ordered: [
                        "Try Facevaly support first and keep your reference number.",
                        "If unresolved, submit your complaint through the official CCMS portal.",
                        "Provide complete details so the case can be reviewed fairly.",
                        "You will receive updates as the complaint moves through review.",
                    ],
                },
            ]}
        />
    );
}

export function OurStoryPage() {
    return (
        <StaticInfoPage
            eyebrow="About Facevaly"
            icon="fa-solid fa-store"
            title="Our story"
            intro="Facevaly started with a simple idea: make online shopping in Bangladesh feel trustworthy, fast and personal — whether you are buying fashion in Dhaka or essentials anywhere in the country."
            highlights={[
                {
                    icon: "fa-solid fa-users",
                    title: "For shoppers",
                    text: "One place for fashion, electronics, beauty and home essentials.",
                },
                {
                    icon: "fa-solid fa-handshake",
                    title: "For sellers",
                    text: "Tools to list, fulfil and grow without heavy upfront cost.",
                },
                {
                    icon: "fa-solid fa-truck-fast",
                    title: "Nationwide",
                    text: "Delivery options built for inside and outside Dhaka.",
                },
            ]}
            sections={[
                {
                    title: "What we believe",
                    body: [
                        "Clear product information, honest pricing and reliable delivery should be the default — not the exception. We work with independent sellers and invest in support so customers can shop with confidence.",
                    ],
                },
                {
                    title: "Where we are headed",
                    body: [
                        "Facevaly continues to expand categories, improve the app experience and bring more local brands online for customers across Bangladesh.",
                    ],
                },
            ]}
        />
    );
}

export function BlogPage() {
    return (
        <StaticInfoPage
            eyebrow="About Facevaly"
            icon="fa-solid fa-newspaper"
            title="Facevaly Blog"
            intro="Stories, shopping guides and marketplace updates from the Facevaly team — written for customers and sellers in Bangladesh."
            sections={[
                {
                    title: "What we publish",
                    list: [
                        "Seasonal shopping guides and deal round-ups.",
                        "Seller spotlights and brand interviews.",
                        "Tips on returns, payments and safe online shopping.",
                        "Product care and lifestyle inspiration.",
                    ],
                },
                {
                    title: "Coming soon",
                    body: [
                        "New articles are added regularly. Check back for Eid picks, back-to-school lists and electronics buying guides.",
                    ],
                },
            ]}
        />
    );
}

export function CaresPage() {
    return (
        <StaticInfoPage
            eyebrow="About Facevaly"
            icon="fa-solid fa-heart"
            title="Facevaly Cares"
            intro="Facevaly Cares is our commitment to responsible marketplace growth — supporting communities, reducing waste and helping small businesses sell online."
            sections={[
                {
                    title: "Community",
                    body: [
                        "We partner with local sellers and social initiatives to bring more products online and create income opportunities beyond major cities.",
                    ],
                },
                {
                    title: "Sustainability",
                    list: [
                        "Encouraging accurate product listings to reduce unnecessary returns.",
                        "Working with sellers on smarter packaging where possible.",
                        "Digital receipts and order tracking to cut paper waste.",
                    ],
                },
            ]}
        />
    );
}

export function UniversityPage() {
    return (
        <StaticInfoPage
            eyebrow="About Facevaly"
            icon="fa-solid fa-graduation-cap"
            title="Facevaly University"
            intro="Free learning resources for sellers and partners — from listing your first product to managing inventory, promotions and customer reviews."
            sections={[
                {
                    title: "Learning paths",
                    list: [
                        "Getting started as a Facevaly seller.",
                        "Product photography and listing quality.",
                        "Pricing, stock and order fulfilment basics.",
                        "Customer service and review management.",
                    ],
                },
                {
                    title: "Format",
                    body: [
                        "Short guides and checklists designed for busy shop owners. Content is available in English and Bengali-friendly plain language.",
                    ],
                },
            ]}
        />
    );
}

export function CodeOfConductPage() {
    return (
        <StaticInfoPage
            eyebrow="About Facevaly"
            icon="fa-solid fa-shield-halved"
            title="Code of conduct"
            intro="Everyone on Facevaly — customers, sellers and partners — is expected to act honestly, respectfully and in line with Bangladeshi law."
            sections={[
                {
                    title: "For customers",
                    list: [
                        "Provide accurate delivery and contact information.",
                        "Use returns and refunds honestly and in good faith.",
                        "Do not abuse promotions, reviews or support channels.",
                    ],
                },
                {
                    title: "For sellers",
                    list: [
                        "List products accurately with real photos and correct prices.",
                        "Ship on time and respond to customer messages promptly.",
                        "Do not sell prohibited, counterfeit or unsafe goods.",
                    ],
                },
                {
                    title: "Consequences",
                    body: [
                        "Violations may lead to listing removal, account suspension or permanent removal from the marketplace.",
                    ],
                },
            ]}
        />
    );
}

export function FacevalyAppPage() {
    return (
        <StaticInfoPage
            eyebrow="About Facevaly"
            icon="fa-solid fa-mobile-screen-button"
            title="Facevaly App"
            intro="Shop on the go with the Facevaly app — same catalogue, wishlist and order tracking as the website, tuned for mobile."
            highlights={[
                {
                    icon: "fa-brands fa-apple",
                    title: "iOS",
                    text: "Available on the App Store for iPhone and iPad.",
                },
                {
                    icon: "fa-brands fa-google-play",
                    title: "Android",
                    text: "Download from Google Play on supported devices.",
                },
                {
                    icon: "fa-solid fa-bell",
                    title: "Alerts",
                    text: "Order updates and flash sale notifications.",
                },
            ]}
            sections={[
                {
                    title: "App features",
                    list: [
                        "Browse categories and flash sales.",
                        "Save favourites to your wishlist.",
                        "Track parcels and view order history.",
                        "Secure sign-in with your Facevaly account.",
                    ],
                },
            ]}
        />
    );
}

export function AffiliatePage() {
    return (
        <StaticInfoPage
            eyebrow="Earn with Facevaly"
            icon="fa-solid fa-link"
            title="Affiliate program"
            intro="Earn commission by sharing Facevaly products you genuinely recommend — through social media, blogs or your community."
            sections={[
                {
                    title: "How it works",
                    ordered: [
                        "Apply to join the Facevaly affiliate program.",
                        "Get unique tracking links for products or categories.",
                        "Share content that helps people discover great deals.",
                        "Earn commission on qualifying purchases through your links.",
                    ],
                },
                {
                    title: "Who it is for",
                    list: [
                        "Content creators and bloggers.",
                        "Community admins and deal sharers.",
                        "Anyone with an audience that trusts their recommendations.",
                    ],
                },
            ]}
        />
    );
}

export function ExclusivesPage() {
    return (
        <StaticInfoPage
            eyebrow="Earn with Facevaly"
            icon="fa-solid fa-star"
            title="Facevaly Exclusives"
            intro="Products and bundles available only on Facevaly — curated deals, limited drops and seller collaborations you will not find elsewhere."
            sections={[
                {
                    title: "What makes something exclusive",
                    list: [
                        "Launched first on Facevaly before other channels.",
                        "Bundle pricing negotiated for our customers only.",
                        "Limited stock from trusted seller partners.",
                    ],
                },
                {
                    title: "How to find them",
                    body: [
                        "Look for the Exclusives badge on product pages and check this section regularly for new drops during flash sales and seasonal events.",
                    ],
                },
            ]}
        />
    );
}
