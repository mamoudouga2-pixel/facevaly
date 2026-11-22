import StaticInfoPage from "./StaticInfoPage";

export default function ReturnsPolicy() {
    return (
        <StaticInfoPage
            eyebrow="Help & support"
            icon="fa-solid fa-rotate-left"
            title="Returns & refunds"
            intro="We want you to shop with confidence on Facevaly. If something is not right with your order, this policy explains when you can return an item, how refunds are processed and what to expect at each step."
            sections={[
                {
                    title: "Return window",
                    body: [
                        "Most products can be returned within 7 days of delivery if the item is unused, in original packaging and includes all accessories, tags and free gifts that came with the order.",
                        "Some categories such as personal care, intimate apparel, perishable goods or custom-made products may not be eligible for return. The product page will clearly state when a non-returnable policy applies.",
                    ],
                },
                {
                    title: "Eligible reasons for return",
                    list: [
                        "You received the wrong item, size or colour.",
                        "The product arrived damaged, defective or not working as described.",
                        "Essential parts or accessories listed on the product page were missing.",
                        "You changed your mind on an eligible item within the return window.",
                    ],
                },
                {
                    title: "How to request a return",
                    ordered: [
                        "Sign in to your Facevaly account and open Orders.",
                        "Select the order and choose Return or refund.",
                        "Tell us the reason, upload clear photos if the item is damaged and submit the request.",
                        "Wait for approval. Once approved, follow the pickup or drop-off instructions sent to you.",
                        "After we receive and inspect the item, your refund or replacement will be processed.",
                    ],
                },
                {
                    title: "Refund timing",
                    body: [
                        "Approved refunds are sent back to your original payment method. Mobile wallet and card refunds usually appear within 3 to 10 business days depending on your bank or provider.",
                        "Cash-on-delivery refunds may be issued through mobile banking or another verified method linked to your account.",
                    ],
                },
                {
                    title: "Items we cannot accept",
                    list: [
                        "Products marked as non-returnable on the listing page.",
                        "Items with missing tags, broken seals or signs of use beyond inspection.",
                        "Products damaged because of misuse, alteration or improper storage.",
                        "Digital goods, vouchers or services after delivery or activation.",
                    ],
                },
            ]}
        />
    );
}
