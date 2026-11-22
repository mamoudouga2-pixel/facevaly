import StaticInfoPage from "./StaticInfoPage";

export default function LegalPrivacy() {
    return (
        <StaticInfoPage
            eyebrow="Help & support"
            icon="fa-solid fa-user-shield"
            title="Privacy policy"
            intro="Facevaly respects your privacy. This policy explains what personal information we collect, why we use it, how we protect it and the choices available to you as a customer or seller on our platform."
            sections={[
                {
                    title: "Information we collect",
                    list: [
                        "Account details such as name, phone number, email address and password.",
                        "Order and delivery information including shipping address and payment method metadata.",
                        "Support messages, return requests, reviews and other content you submit to us.",
                        "Device, browser and usage data such as IP address, pages visited and approximate location.",
                        "Seller verification and business information when you apply to sell on Facevaly.",
                    ],
                },
                {
                    title: "How we use your information",
                    list: [
                        "Process orders, payments, refunds and customer support requests.",
                        "Deliver products, send order updates and prevent fraud or abuse.",
                        "Improve search, recommendations, platform performance and security.",
                        "Send service notices, policy updates and marketing messages where permitted.",
                        "Comply with legal obligations and respond to lawful requests.",
                    ],
                },
                {
                    title: "Sharing of information",
                    body: [
                        "We share necessary order details with sellers and courier partners so your purchase can be fulfilled. We may also use trusted service providers for hosting, analytics, payment processing and customer communication under appropriate confidentiality safeguards.",
                        "We do not sell your personal information. We may disclose data when required by law or to protect the rights, safety and integrity of Facevaly, our users and the public.",
                    ],
                },
                {
                    title: "Cookies and similar technologies",
                    body: [
                        "Facevaly uses cookies and similar tools to keep you signed in, remember preferences, measure traffic and improve the shopping experience. You can control cookies through your browser settings, although some features may not work correctly if cookies are disabled.",
                    ],
                },
                {
                    title: "Data retention and security",
                    body: [
                        "We retain personal information only for as long as needed to provide services, meet legal requirements and resolve disputes. We apply administrative, technical and organizational measures designed to protect your data, but no online service can guarantee absolute security.",
                    ],
                },
                {
                    title: "Your choices",
                    list: [
                        "Update profile and address details from your account settings.",
                        "Request correction or deletion of certain account information, subject to legal and operational limits.",
                        "Opt out of promotional messages using the unsubscribe option where available.",
                        "Contact us if you have questions about how your data is handled.",
                    ],
                },
                {
                    title: "Children's privacy",
                    body: [
                        "Facevaly is intended for users who can enter into a binding contract under applicable law. We do not knowingly collect personal information from children without appropriate consent.",
                    ],
                },
            ]}
        />
    );
}
