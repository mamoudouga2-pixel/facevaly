export const TEMPLATES = {
    "classic-natural": "Classic Natural",
    "axolyt-organic": "Axolyt Organic (Special)",
} as const;

/** Back-compat for older studio imports / stale HMR */
export const PAGE_TEMPLATES = [
    {
        id: "classic-natural",
        name: TEMPLATES["classic-natural"],
        description: "Nebuloid classic product funnel",
        sectionTypes: ["hero", "benefits", "promo", "usage", "reviews", "order", "footer"],
    },
    {
        id: "axolyt-organic",
        name: TEMPLATES["axolyt-organic"],
        description: "Axolyt organic special template",
        sectionTypes: ["hero", "benefits", "promo", "usage", "reviews", "order", "footer"],
    },
];

export const SECTION_TYPES = [
    { type: "hero", label: "Hero Section" },
    { type: "benefits", label: "Benefits" },
    { type: "promo", label: "Promo Banner" },
    { type: "usage", label: "Usage" },
    { type: "reviews", label: "Reviews" },
    { type: "order", label: "Order Form" },
    { type: "footer", label: "Footer" },
] as const;

export type SectionType = (typeof SECTION_TYPES)[number]["type"];

export function slugify(value: string) {
    return String(value || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 255);
}

export function defaultTheme() {
    return {
        primary: "#4f9000",
        primary_dark: "#3c7000",
        secondary: "#68b900",
        accent: "#ffbd00",
        accent_dark: "#eaa900",
        light_green: "#efffd3",
        cream: "#fff8e4",
        background: "#fff8e4",
        surface: "#ffffff",
        text: "#121212",
        muted: "#6b7280",
        border: "#d7dce1",
    };
}

export function defaultSections(productName = "আপনার পণ্যের নাম") {
    return [
        {
            type: "hero",
            label: "Hero Section",
            is_enabled: true,
            sort_order: 10,
            content: {
                brand_name: "FACEVALY",
                title_1: "মাত্র ৭ দিনেই",
                title_2: "আপনার প্রয়োজনের সেরা সমাধান",
                title_3: productName,
                promise_title: "প্রিমিয়াম মানের পণ্য",
                promise_text: "আপনার পণ্যের প্রধান সুবিধা এখানে লিখুন।",
                refund_text: "সন্তুষ্ট না হলে ১০০% টাকা ফেরত",
                customer_heading: "উপকৃত হয়েছেন",
                customer_count: "০২ লক্ষ+ কাস্টমারস",
                rating: 4.8,
                gallery_images: [] as string[],
                customer_avatars: [] as string[],
            },
        },
        {
            type: "benefits",
            label: "Benefits Section",
            is_enabled: true,
            sort_order: 20,
            content: {
                heading: productName,
                subheading: "যে সমস্যা গুলোর সমাধান করে",
                badge: "100% QUALITY",
                left_top_label: "প্রকৃতির স্পর্শে",
                right_top_label: "শরীরের সুস্থতা",
                certificate_text: "ISO সার্টিফিকেট",
                items: [
                    "প্রধান সুবিধা এখানে লিখুন",
                    "দ্বিতীয় সুবিধা এখানে লিখুন",
                    "তৃতীয় সুবিধা এখানে লিখুন",
                    "চতুর্থ সুবিধা এখানে লিখুন",
                    "পঞ্চম সুবিধা এখানে লিখুন",
                    "ষষ্ঠ সুবিধা এখানে লিখুন",
                ],
            },
        },
        {
            type: "promo",
            label: "Promo Banner",
            is_enabled: true,
            sort_order: 30,
            content: {
                eyebrow: "FACEVALY SELECTED PRODUCT",
                title: productName,
                text: "আপনার পণ্যের প্রধান সুবিধা এখানে লিখুন।",
                button_text: "এখনই অর্ডার করুন",
                image: "",
            },
        },
        {
            type: "usage",
            label: "Usage Section",
            is_enabled: true,
            sort_order: 40,
            content: {
                title: "সহজ ব্যবহারবিধি",
                text: "পণ্যের নির্দেশনা অনুযায়ী ব্যবহার করুন।",
                highlight: "সেরা ফলাফলের জন্য নিয়মিত ব্যবহার করুন",
                features: ["অরিজিনাল পণ্য", "দ্রুত ডেলিভারি", "ক্যাশ অন ডেলিভারি"],
            },
        },
        {
            type: "reviews",
            label: "Customer Experience",
            is_enabled: true,
            sort_order: 50,
            content: {
                heading: "আমাদের কাস্টমারদের অভিজ্ঞতা",
                subheading: "আমাদের কাস্টমারদের বাস্তব অভিজ্ঞতার স্ক্রিনশট",
                screenshots: [] as string[],
            },
        },
        {
            type: "order",
            label: "Order Form",
            is_enabled: true,
            sort_order: 60,
            content: {
                title: "অর্ডার ফর্ম",
                subtitle: "অর্ডারটি সম্পন্ন করতে নিচের তথ্যগুলো পূরণ করুন",
                refund_text: "সন্তুষ্ট না হলে ১০০% টাকা ফেরত",
                name_label: "আপনার পূর্ণ নাম",
                phone_label: "ফোন নম্বর",
                email_label: "ইমেইল (ঐচ্ছিক)",
                address_label: "বাসার পূর্ণ ঠিকানা",
                delivery_heading: "ডেলিভারি এলাকা",
                payment_title: "ক্যাশ অন ডেলিভারি (COD)",
                payment_text: "পণ্য হাতে পাওয়ার পর মূল্য পরিশোধ করবেন।",
                button_text: "অর্ডারটি প্লেস করুন",
                success_title: "অর্ডার গ্রহণ করা হয়েছে",
                success_text: "ধন্যবাদ। আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।",
                free_shipping: false,
            },
        },
        {
            type: "footer",
            label: "Footer",
            is_enabled: true,
            sort_order: 70,
            content: {
                heading: "কোনো কিছু জানতে কিংবা সরাসরি অর্ডার করতে যোগাযোগ করুন",
                whatsapp_number: "8801732474420",
                phone_number: "8801732474420",
                address: "",
                copyright: "© 2026 All Rights Reserved by Facevaly",
            },
        },
    ];
}

export function sectionsForTemplate(
    _template: keyof typeof TEMPLATES | string,
    productName = "আপনার পণ্যের নাম"
) {
    // Classic Natural is the Nebuloid funnel; Axolyt reuses the same section shell for now
    // with product-name defaults (special Axolyt visual theme can layer later).
    return defaultSections(productName);
}

export function blankDraft(product?: { id?: number; name?: string } | null) {
    const name = product?.name || "আপনার পণ্যের নাম";
    return {
        id: null as number | null,
        product_id: product?.id || null,
        title: name,
        slug: "",
        template: "classic-natural" as keyof typeof TEMPLATES,
        is_active: true,
        show_footer_products: false,
        theme: defaultTheme(),
        seo: {
            meta_title: "",
            meta_description: "",
        },
        settings: {},
        sections: defaultSections(name),
    };
}

// Back-compat exports used by older imports
export const SECTION_TYPE_VALUES = SECTION_TYPES.map((item) => item.type);
export function uid() {
    return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
export function makeSection(type: string) {
    const found = defaultSections().find((section) => section.type === type);
    return found || { type, label: type, is_enabled: true, sort_order: 0, content: {} };
}
export function draftFromTemplate() {
    return blankDraft();
}
export function defaultHeader() {
    return { links: [] };
}
export function defaultFooter() {
    return { columns: [] };
}
export function defaultStyle() {
    return {};
}
