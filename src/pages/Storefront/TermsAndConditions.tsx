import StaticInfoPage from "./StaticInfoPage";

export default function TermsAndConditions() {
    return (
        <StaticInfoPage
            eyebrow="Help & support"
            icon="fa-solid fa-file-contract"
            title="Terms & conditions"
            intro="These terms govern your use of Facevaly, including browsing, purchasing, creating an account and interacting with sellers on our marketplace. By using the platform you agree to these terms."
            sections={[
                {
                    title: "About Facevaly",
                    body: [
                        "Facevaly operates an online marketplace that connects customers with independent sellers across Bangladesh. Product listings, pricing, stock and fulfilment responsibilities may vary by seller unless Facevaly explicitly states otherwise.",
                    ],
                },
                {
                    title: "Your account",
                    list: [
                        "You must provide accurate registration details and keep your login credentials secure.",
                        "You are responsible for activity that happens under your account.",
                        "We may suspend or close accounts involved in fraud, abuse or repeated policy violations.",
                    ],
                },
                {
                    title: "Orders and payments",
                    body: [
                        "When you place an order, you offer to buy the selected product under the price and terms shown at checkout. An order is confirmed once payment is accepted or cash-on-delivery is approved.",
                        "Prices, discounts, delivery fees and availability may change before checkout is completed. We try to display accurate product information, but errors may occur and we reserve the right to cancel affected orders with a full refund.",
                    ],
                },
                {
                    title: "Delivery",
                    body: [
                        "Estimated delivery dates are shown at checkout when available. Delays caused by courier partners, weather, holidays or incorrect address details are handled according to our shipping and support policies.",
                    ],
                },
                {
                    title: "Returns and refunds",
                    body: [
                        "Return eligibility, refund methods and inspection rules are described in our Return & refund policy. Some products are excluded from return because of hygiene, safety or legal requirements.",
                    ],
                },
                {
                    title: "Seller content and reviews",
                    body: [
                        "Sellers are responsible for the accuracy of their listings, images and descriptions. Reviews must be honest and must not contain abusive, misleading or unlawful content.",
                    ],
                },
                {
                    title: "Prohibited use",
                    list: [
                        "Attempting to interfere with platform security or payment systems.",
                        "Posting false orders, fake reviews or fraudulent return claims.",
                        "Copying, scraping or reselling platform content without permission.",
                        "Using Facevaly for unlawful, harmful or deceptive activity.",
                    ],
                },
                {
                    title: "Limitation of liability",
                    body: [
                        "Facevaly is provided on an as-available basis. To the fullest extent permitted by law, we are not liable for indirect losses arising from delays, third-party seller actions or events outside our reasonable control.",
                    ],
                },
                {
                    title: "Changes to these terms",
                    body: [
                        "We may update these terms from time to time. Material changes will be posted on this page with an updated date. Continued use of Facevaly after changes take effect means you accept the revised terms.",
                    ],
                },
            ]}
        />
    );
}
