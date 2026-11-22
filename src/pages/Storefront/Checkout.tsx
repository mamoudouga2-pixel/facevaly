import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import storefrontService
    from "../../services/storefrontService";

import customerAccountService
    from "../../services/customerAccountService";

import {
    useStorefrontToast,
} from "../../context/StorefrontToastContext";

import {
    useCart,
} from "../../context/CartContext";

import "./Checkout.css";


/* =========================================================
   MONEY
========================================================= */

const money = (
    value
) =>
    `৳${Number(
        value || 0
    ).toLocaleString(
        "en-BD",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }
    )}`;


/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm = {
    customer_name: "",
    customer_phone: "",
    address: "",
    customer_note: "",
    delivery_area: "inside_dhaka",
};


/* =========================================================
   DELIVERY AREA BANGLA LABEL
========================================================= */

const deliveryAreaLabel = (
    option
) => {
    if (
        option?.key ===
        "inside_dhaka"
    ) {
        return "ঢাকার ভিতরে";
    }

    if (
        option?.key ===
        "outside_dhaka"
    ) {
        return "ঢাকার বাইরে";
    }

    return (
        option?.label
        || ""
    );
};


const deliveryAreaDescription = (
    option
) => {
    if (
        option?.key ===
        "inside_dhaka"
    ) {
        return "ঢাকা শহরের ভিতরের ঠিকানার জন্য";
    }

    if (
        option?.key ===
        "outside_dhaka"
    ) {
        return "ঢাকার বাইরের সকল জেলার জন্য";
    }

    return (
        option?.description
        || ""
    );
};


const buildLiveTotals = (
    checkout,
    deliveryArea
) => {
    const base =
        checkout?.totals
        || {
            subtotal: 0,
            product_discount: 0,
            coupon_discount: 0,
            delivery_charge: 0,
            tax: 0,
            total: 0,
        };

    const serverDelivery =
        Number(
            base.delivery_charge
            || 0
        );

    const selectedDelivery =
        Number(
            checkout
                ?.delivery_options
                ?.find(
                    (
                        option
                    ) =>
                        option.key
                        === deliveryArea
                )
                ?.charge
            ?? serverDelivery
        );

    const total =
        Math.round(
            (
                Number(
                    base.total
                    || 0
                )
                - serverDelivery
                + selectedDelivery
            )
            * 100
        )
        / 100;

    return {
        ...base,
        delivery_charge: selectedDelivery,
        total,
    };
};


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function CheckoutImage({
    src,
    alt,
}) {
    const [
        failed,
        setFailed,
    ] =
        useState(false);


    useEffect(
        () => {
            setFailed(false);
        },
        [
            src,
        ]
    );


    if (
        !src
        ||
        failed
    ) {
        return (
            <span className="fvc2-image-fallback">
                <i className="fa-regular fa-image" />
            </span>
        );
    }


    return (
        <img
            src={src}
            alt={alt}
            draggable="false"
            onError={() =>
                setFailed(
                    true
                )
            }
        />
    );
}


/* =========================================================
   CHECKOUT
========================================================= */

export default function Checkout() {
    const navigate =
        useNavigate();


    const [
        searchParams,
        setSearchParams,
    ] =
        useSearchParams();


    const {
        showToast,
    } =
        useStorefrontToast();


    const {
        refreshCart,
    } =
        useCart();


    const [
        checkout,
        setCheckout,
    ] =
        useState(null);


    const [
        form,
        setForm,
    ] =
        useState(
            emptyForm
        );


    const [
        loading,
        setLoading,
    ] =
        useState(true);


    const [
        saving,
        setSaving,
    ] =
        useState(false);


    const [
        saved,
        setSaved,
    ] =
        useState(false);


    const [
        placing,
        setPlacing,
    ] =
        useState(false);


    const [
        error,
        setError,
    ] =
        useState("");


    const [
        couponCode,
        setCouponCode,
    ] =
        useState("");


    const [
        couponBusy,
        setCouponBusy,
    ] =
        useState(false);


    const [
        itemBusy,
        setItemBusy,
    ] =
        useState(null);


    const [
        summaryOpen,
        setSummaryOpen,
    ] =
        useState(true);


    const [
        couponOpen,
        setCouponOpen,
    ] =
        useState(false);


    const hasEdited =
        useRef(false);


    const token =
        searchParams.get(
            "token"
        );


    /* =====================================================
       HYDRATE CHECKOUT
    ===================================================== */

    const hydrateCheckout = (
        data,
        hydrateForm = true,
        merge = false
    ) => {
        setCheckout((previous) => {
            if (!merge || !previous) {
                return data;
            }

            return {
                ...previous,
                ...data,
                customer: {
                    ...(previous.customer || {}),
                    ...(data?.customer || {}),
                },
                totals:
                    data?.totals
                    || previous.totals,
                delivery_options:
                    data?.delivery_options
                    || previous.delivery_options,
                delivery_area:
                    data?.delivery_area
                    ?? previous.delivery_area,
            };
        });


        if (
            hydrateForm
        ) {
            setForm({
                customer_name:
                    data
                        ?.customer
                        ?.name
                    || "",

                customer_phone:
                    data
                        ?.customer
                        ?.phone
                    || "",

                address:
                    data
                        ?.customer
                        ?.address
                    || "",

                customer_note:
                    data
                        ?.customer
                        ?.note
                    || "",

                delivery_area:
                    data
                        ?.delivery_area
                    ||
                    "inside_dhaka",
            });
        }


        setCouponCode(
            data
                ?.coupon
                ?.code
            || ""
        );
    };


    /* =====================================================
       PREFILL FROM LOGGED-IN ACCOUNT
       Fill empty name / phone / address from profile +
       default saved delivery address. Does not overwrite
       values already on the checkout session.
    ===================================================== */

    const prefillFromLoggedInAccount =
        async (
            checkoutData
        ) => {
            const customer =
                checkoutData
                    ?.customer
                || {};

            const needsName =
                !String(
                    customer.name
                    || ""
                ).trim();

            const needsPhone =
                !String(
                    customer.phone
                    || ""
                ).trim();

            const needsAddress =
                !String(
                    customer.address
                    || ""
                ).trim();

            if (
                !needsName
                &&
                !needsPhone
                &&
                !needsAddress
            ) {
                return;
            }


            try {
                const [
                    settingsResponse,
                    addressesResponse,
                ] =
                    await Promise.all([
                        customerAccountService
                            .settings()
                            .catch(
                                () => null
                            ),

                        customerAccountService
                            .addresses()
                            .catch(
                                () => null
                            ),
                    ]);


                const profile =
                    settingsResponse
                        ?.data
                    || {};

                const addressList =
                    addressesResponse
                        ?.data
                        ?.addresses
                    || [];

                const savedAddress =
                    addressList.find(
                        (
                            row
                        ) =>
                            row
                                .is_default_shipping
                    )
                    ||
                    addressList[0]
                    ||
                    null;


                if (
                    !profile.name
                    &&
                    !profile.phone
                    &&
                    !savedAddress
                ) {
                    return;
                }


                setForm(
                    (
                        current
                    ) => ({
                        ...current,

                        customer_name:
                            String(
                                current
                                    .customer_name
                                || ""
                            ).trim()
                            ||
                            String(
                                savedAddress
                                    ?.name
                                || ""
                            ).trim()
                            ||
                            String(
                                profile.name
                                || ""
                            ).trim()
                            ||
                            "",

                        customer_phone:
                            String(
                                current
                                    .customer_phone
                                || ""
                            ).trim()
                            ||
                            String(
                                savedAddress
                                    ?.phone
                                || ""
                            ).trim()
                            ||
                            String(
                                profile.phone
                                || ""
                            ).trim()
                            ||
                            "",

                        address:
                            String(
                                current
                                    .address
                                || ""
                            ).trim()
                            ||
                            String(
                                savedAddress
                                    ?.address
                                || ""
                            ).trim()
                            ||
                            "",
                    })
                );
            } catch {
                // Guest checkout — ignore auth errors.
            }
        };


    /* =====================================================
       INITIAL CHECKOUT
    ===================================================== */

    useEffect(
        () => {
            let active =
                true;


            const start =
                async () => {
                    setLoading(
                        true
                    );

                    setError(
                        ""
                    );


                    try {
                        let response;


                        /* =================================
                           EXISTING CHECKOUT
                        ================================= */

                        if (
                            token
                        ) {
                            response =
                                await storefrontService.checkout(
                                    token
                                );


                            if (
                                response
                                    ?.data
                                    ?.order_number
                                &&
                                ![
                                    "incomplete",
                                    "checkout_session",
                                ].includes(
                                    response
                                        .data
                                        .status
                                )
                            ) {
                                navigate(
                                    `/order-success/${token}`,
                                    {
                                        replace:
                                            true,
                                    }
                                );


                                return;
                            }
                        }


                        /* =================================
                           BUY NOW
                        ================================= */

                        else {
                            const productId =
                                searchParams.get(
                                    "product"
                                );


                            const variantId =
                                searchParams.get(
                                    "variant"
                                );


                            if (
                                !productId
                            ) {
                                navigate(
                                    "/cart",
                                    {
                                        replace:
                                            true,
                                    }
                                );


                                return;
                            }


                            response =
                                await storefrontService.startBuyNow({
                                    product_id:
                                        Number(
                                            productId
                                        ),

                                    variant_id:
                                        variantId
                                            ? Number(
                                                variantId
                                            )
                                            : null,

                                    quantity:
                                        1,
                                });


                            const createdToken =
                                response
                                    ?.data
                                    ?.checkout_token;


                            if (
                                !createdToken
                            ) {
                                throw new Error(
                                    "চেকআউট টোকেন পাওয়া যায়নি।"
                                );
                            }


                            const params =
                                new URLSearchParams();


                            params.set(
                                "token",
                                createdToken
                            );


                            setSearchParams(
                                params,
                                {
                                    replace:
                                        true,
                                }
                            );
                        }


                        if (
                            !active
                        ) {
                            return;
                        }


                        hydrateCheckout(
                            response.data
                        );

                        await prefillFromLoggedInAccount(
                            response.data
                        );
                    } catch (
                        exception
                    ) {
                        if (
                            active
                        ) {
                            setError(
                                exception
                                    ?.message
                                ||
                                "চেকআউট লোড করা যায়নি।"
                            );
                        }
                    } finally {
                        if (
                            active
                        ) {
                            setLoading(
                                false
                            );
                        }
                    }
                };


            start();


            return () => {
                active =
                    false;
            };
        },
        []
    );


    /* =====================================================
       CHANGE FIELD
    ===================================================== */

    const change = (
        field,
        value
    ) => {
        hasEdited.current =
            true;


        setError(
            ""
        );


        setForm(
            (
                current
            ) => ({
                ...current,

                [field]:
                    value,
            })
        );
    };


    /* =====================================================
       AUTO SAVE
    ===================================================== */

    useEffect(
        () => {
            if (
                !token
                ||
                !hasEdited.current
                ||
                loading
                ||
                placing
            ) {
                return;
            }


            setSaved(
                false
            );


            const timer =
                window.setTimeout(
                    async () => {
                        try {
                            setSaving(
                                true
                            );


                            const response =
                                await storefrontService.saveDraft(
                                    token,
                                    form
                                );


                            hydrateCheckout(
                                response.data,
                                false,
                                true
                            );


                            setSaved(
                                true
                            );


                            window.setTimeout(
                                () =>
                                    setSaved(
                                        false
                                    ),
                                1200
                            );
                        } catch (
                            exception
                        ) {
                            setError(
                                exception
                                    ?.message
                                ||
                                "চেকআউট সংরক্ষণ করা যায়নি।"
                            );
                        } finally {
                            setSaving(
                                false
                            );
                        }
                    },
                    1500
                );


            return () => {
                window.clearTimeout(
                    timer
                );
            };
        },
        [
            form,
            token,
            loading,
            placing,
        ]
    );


    /* =====================================================
       UPDATE QUANTITY
    ===================================================== */

    const updateQuantity =
        async (
            item,
            nextQuantity
        ) => {
            if (
                !token
            ) {
                return;
            }


            const quantity =
                Math.max(
                    1,
                    Number(
                        nextQuantity
                        || 1
                    )
                );


            try {
                setItemBusy(
                    item.id
                );


                const response =
                    await storefrontService.updateCheckoutItem(
                        token,
                        item.id,
                        quantity
                    );


                hydrateCheckout(
                    response.data,
                    false
                );
            } catch (
                exception
            ) {
                showToast(
                    exception
                        ?.message
                    ||
                    "পণ্যের পরিমাণ আপডেট করা যায়নি।",
                    "error"
                );
            } finally {
                setItemBusy(
                    null
                );
            }
        };


    /* =====================================================
       REMOVE ITEM
    ===================================================== */

    const removeItem =
        async (
            item
        ) => {
            if (
                !token
            ) {
                return;
            }


            if (
                !window.confirm(
                    `চেকআউট থেকে "${item.name}" পণ্যটি সরাতে চান?`
                )
            ) {
                return;
            }


            try {
                setItemBusy(
                    item.id
                );


                const response =
                    await storefrontService.removeCheckoutItem(
                        token,
                        item.id
                    );


                hydrateCheckout(
                    response.data,
                    false
                );


                showToast(
                    response
                        .message
                    ||
                    "পণ্যটি সরানো হয়েছে।"
                );
            } catch (
                exception
            ) {
                showToast(
                    exception
                        ?.message
                    ||
                    "পণ্যটি সরানো যায়নি।",
                    "error"
                );
            } finally {
                setItemBusy(
                    null
                );
            }
        };


    /* =====================================================
       APPLY COUPON
    ===================================================== */

    const applyCoupon =
        async () => {
            if (
                !token
            ) {
                return;
            }


            const code =
                couponCode
                    .trim()
                    .toUpperCase();


            if (
                !code
            ) {
                showToast(
                    "কুপন কোড লিখুন।",
                    "warning"
                );


                return;
            }


            try {
                setCouponBusy(
                    true
                );


                await storefrontService.saveDraft(
                    token,
                    form
                );


                const response =
                    await storefrontService.applyCoupon(
                        token,
                        code
                    );


                hydrateCheckout(
                    response.data,
                    false
                );


                setCouponOpen(
                    false
                );


                showToast(
                    response
                        .message
                    ||
                    "কুপন প্রয়োগ করা হয়েছে।"
                );
            } catch (
                exception
            ) {
                showToast(
                    exception
                        ?.message
                    ||
                    "কুপন প্রয়োগ করা যায়নি।",
                    "error"
                );
            } finally {
                setCouponBusy(
                    false
                );
            }
        };


    /* =====================================================
       REMOVE COUPON
    ===================================================== */

    const removeCoupon =
        async () => {
            if (
                !token
            ) {
                return;
            }


            try {
                setCouponBusy(
                    true
                );


                const response =
                    await storefrontService.removeCoupon(
                        token
                    );


                hydrateCheckout(
                    response.data,
                    false
                );


                showToast(
                    response
                        .message
                    ||
                    "কুপন সরানো হয়েছে।"
                );
            } catch (
                exception
            ) {
                showToast(
                    exception
                        ?.message
                    ||
                    "কুপন সরানো যায়নি।",
                    "error"
                );
            } finally {
                setCouponBusy(
                    false
                );
            }
        };


    /* =====================================================
       VALIDATION
    ===================================================== */

    const validationError =
        () => {
            const name =
                String(
                    form
                        .customer_name
                    || ""
                ).trim();


            const phone =
                String(
                    form
                        .customer_phone
                    || ""
                )
                    .trim()
                    .replace(
                        /\s+/g,
                        ""
                    );


            const address =
                String(
                    form.address
                    || ""
                ).trim();


            if (
                !name
            ) {
                return "আপনার পুরো নাম লিখুন।";
            }


            if (
                !phone
            ) {
                return "আপনার মোবাইল নম্বর লিখুন।";
            }


            if (
                !/^01[3-9][0-9]{8}$/.test(
                    phone
                )
            ) {
                return "সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন।";
            }


            if (
                !address
            ) {
                return "সম্পূর্ণ ডেলিভারি ঠিকানা লিখুন।";
            }


            if (
                ![
                    "inside_dhaka",
                    "outside_dhaka",
                ].includes(
                    form
                        .delivery_area
                )
            ) {
                return "ডেলিভারি এলাকা নির্বাচন করুন।";
            }


            return "";
        };


    /* =====================================================
       PLACE ORDER
    ===================================================== */

    const placeOrder =
        async () => {
            if (
                !token
            ) {
                return;
            }


            const invalid =
                validationError();


            if (
                invalid
            ) {
                setError(
                    invalid
                );


                document
                    .querySelector(
                        ".fvc2-shipping"
                    )
                    ?.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start",
                    });


                return;
            }


            try {
                setPlacing(
                    true
                );


                setError(
                    ""
                );


                const response =
                    await storefrontService.placeOrder(
                        token,
                        {
                            customer_name:
                                form
                                    .customer_name
                                    .trim(),

                            customer_phone:
                                form
                                    .customer_phone
                                    .trim()
                                    .replace(
                                        /\s+/g,
                                        ""
                                    ),

                            customer_email:
                                null,

                            address:
                                form
                                    .address
                                    .trim(),

                            postal_code:
                                null,

                            customer_note:
                                form
                                    .customer_note
                                    .trim()
                                || null,

                            delivery_area:
                                form
                                    .delivery_area,
                        }
                    );


                await refreshCart()
                    .catch(
                        () => {}
                    );


                const payload =
                    response?.data
                    || response
                    || {};

                const successToken =
                    payload.checkout_token
                    || token;

                const redirectUrl =
                    payload.redirect_url
                    || (
                        successToken
                            ? `/order-success/${successToken}`
                            : "/shop"
                    );

                navigate(
                    redirectUrl,
                    {
                        replace:
                            true,
                    }
                );
            } catch (
                exception
            ) {
                const message =
                    exception
                        ?.message
                    ||
                    "অর্ডার সম্পন্ন করা যায়নি।";


                setError(
                    message
                );


                showToast(
                    message,
                    "error"
                );
            } finally {
                setPlacing(
                    false
                );
            }
        };


    /* =====================================================
       ITEMS
    ===================================================== */

    const items =
        checkout
            ?.items
        || [];


    /* =====================================================
       TOTALS
    ===================================================== */

    const totals =
        useMemo(
            () =>
                buildLiveTotals(
                    checkout,
                    form.delivery_area
                ),
            [
                checkout,
                form.delivery_area,
            ]
        );


    const quantityTotal =
        items.reduce(
            (
                total,
                item
            ) =>
                total
                +
                Number(
                    item.quantity
                    || 0
                ),
            0
        );


    /* =====================================================
       LOADING
    ===================================================== */

    if (
        loading
    ) {
        return (
            <div className="fvc2-state">
                <i className="fa-solid fa-spinner fa-spin" />

                চেকআউট প্রস্তুত হচ্ছে...
            </div>
        );
    }


    /* =====================================================
       LOAD ERROR
    ===================================================== */

    if (
        error
        &&
        !checkout
    ) {
        return (
            <div className="fvc2-page">

                <div className="fvc2-container">

                    <div className="fvc2-error">

                        <i className="fa-solid fa-circle-exclamation" />

                        {error}

                    </div>

                </div>

            </div>
        );
    }


    /* =====================================================
       SUMMARY ROWS
    ===================================================== */

    const SummaryRows =
        () => (
            <>

                <div className="fvc2-summary-line">

                    <span>
                        সাবটোটাল
                    </span>

                    <strong>
                        {money(
                            totals
                                .subtotal
                        )}
                    </strong>

                </div>


                {Number(
                    totals
                        .product_discount
                    || 0
                ) > 0 && (

                    <div className="fvc2-summary-line discount">

                        <span>
                            পণ্যের ছাড়
                        </span>

                        <strong>
                            -{money(
                                totals
                                    .product_discount
                            )}
                        </strong>

                    </div>

                )}


                {Number(
                    totals
                        .coupon_discount
                    || 0
                ) > 0 && (

                    <div className="fvc2-summary-line discount">

                        <span>
                            কুপন ছাড়
                        </span>

                        <strong>
                            -{money(
                                totals
                                    .coupon_discount
                            )}
                        </strong>

                    </div>

                )}


                <div className="fvc2-summary-line">

                    <span>
                        ডেলিভারি চার্জ
                    </span>

                    <strong>
                        {money(
                            totals
                                .delivery_charge
                        )}
                    </strong>

                </div>


                <div className="fvc2-summary-line">

                    <span>
                        পেমেন্ট
                    </span>

                    <strong>
                        ক্যাশ অন ডেলিভারি
                    </strong>

                </div>


                {/* COUPON */}

                <button
                    type="button"
                    className="fvc2-coupon-toggle"
                    onClick={() =>
                        setCouponOpen(
                            (
                                current
                            ) =>
                                !current
                        )
                    }
                >
                    <span>
                        কুপন বা গিফট ভাউচার আছে?
                    </span>

                    <i
                        className={
                            couponOpen
                                ? "fa-solid fa-chevron-up"
                                : "fa-solid fa-chevron-down"
                        }
                    />
                </button>


                {couponOpen && (

                    <div className="fvc2-coupon-box">

                        {checkout
                            ?.coupon
                            ?.code ? (

                            <div className="fvc2-applied-coupon">

                                <span>

                                    <i className="fa-solid fa-ticket" />

                                    {
                                        checkout
                                            .coupon
                                            .code
                                    }

                                </span>


                                <button
                                    type="button"
                                    disabled={
                                        couponBusy
                                    }
                                    onClick={
                                        removeCoupon
                                    }
                                >
                                    সরান
                                </button>

                            </div>

                        ) : (

                            <div className="fvc2-coupon-input">

                                <input
                                    type="text"
                                    placeholder="কুপন কোড লিখুন"
                                    value={
                                        couponCode
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setCouponCode(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    onKeyDown={(
                                        event
                                    ) => {
                                        if (
                                            event.key ===
                                            "Enter"
                                        ) {
                                            event.preventDefault();

                                            applyCoupon();
                                        }
                                    }}
                                />


                                <button
                                    type="button"
                                    disabled={
                                        couponBusy
                                    }
                                    onClick={
                                        applyCoupon
                                    }
                                >
                                    {couponBusy
                                        ? "..."
                                        : "প্রয়োগ করুন"
                                    }
                                </button>

                            </div>

                        )}

                    </div>

                )}


                <div className="fvc2-summary-total">

                    <span>
                        মোট
                    </span>

                    <strong>
                        {money(
                            totals.total
                        )}
                    </strong>

                </div>

            </>
        );


    /* =====================================================
       PAGE
    ===================================================== */

    return (
        <div className="fvc2-page">

            <div className="fvc2-container">


                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="fvc2-head">

                    <button
                        type="button"
                        aria-label="পেছনে যান"
                        onClick={() =>
                            navigate(
                                -1
                            )
                        }
                    >
                        <i className="fa-solid fa-arrow-left" />
                    </button>


                    <div>

                        <span>
                            নিরাপদ চেকআউট
                        </span>

                        <h1>
                            চেকআউট
                        </h1>

                    </div>


                    <i className="fa-solid fa-lock" />

                </header>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <div className="fvc2-error">

                        <i className="fa-solid fa-circle-exclamation" />

                        {error}

                    </div>

                )}


                <div className="fvc2-layout">


                    {/* =================================================
                        MAIN
                    ================================================= */}

                    <main className="fvc2-main">


                        {/* =================================================
                            1. ORDER REVIEW
                        ================================================= */}

                        <section className="fvc2-card">

                            <div className="fvc2-title">

                                <i className="fa-solid fa-bag-shopping" />

                                <strong>
                                    অর্ডার রিভিউ
                                </strong>

                                <span>
                                    {quantityTotal} টি পণ্য
                                </span>

                            </div>


                            <div className="fvc2-products">

                                {items.map(
                                    (
                                        item
                                    ) => (

                                        <article
                                            key={
                                                item.id
                                            }
                                        >

                                            <div className="fvc2-product-image">

                                                <CheckoutImage
                                                    src={
                                                        item.image
                                                    }
                                                    alt={
                                                        item.name
                                                    }
                                                />

                                            </div>


                                            <div className="fvc2-product-copy">

                                                <strong>
                                                    {item.name}
                                                </strong>


                                                <small>
                                                    {[
                                                        item
                                                            .variant_name,

                                                        item
                                                            .sku
                                                            ? `SKU: ${item.sku}`
                                                            : null,
                                                    ]
                                                        .filter(
                                                            Boolean
                                                        )
                                                        .join(
                                                            " · "
                                                        )
                                                    }
                                                </small>


                                                <div>

                                                    <span className="fvc2-qty">

                                                        <button
                                                            type="button"
                                                            aria-label="পরিমাণ কমান"
                                                            disabled={
                                                                Number(
                                                                    itemBusy
                                                                )
                                                                ===
                                                                Number(
                                                                    item.id
                                                                )
                                                                ||
                                                                Number(
                                                                    item.quantity
                                                                )
                                                                <= 1
                                                            }
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item,
                                                                    Number(
                                                                        item.quantity
                                                                    ) - 1
                                                                )
                                                            }
                                                        >
                                                            −
                                                        </button>


                                                        <b>
                                                            {item.quantity}
                                                        </b>


                                                        <button
                                                            type="button"
                                                            aria-label="পরিমাণ বাড়ান"
                                                            disabled={
                                                                Number(
                                                                    itemBusy
                                                                )
                                                                ===
                                                                Number(
                                                                    item.id
                                                                )
                                                            }
                                                            onClick={() =>
                                                                updateQuantity(
                                                                    item,
                                                                    Number(
                                                                        item.quantity
                                                                    ) + 1
                                                                )
                                                            }
                                                        >
                                                            +
                                                        </button>

                                                    </span>


                                                    <strong className="fvc2-line-price">
                                                        {money(
                                                            item
                                                                .line_total
                                                        )}
                                                    </strong>

                                                </div>

                                            </div>


                                            <button
                                                type="button"
                                                className="fvc2-remove"
                                                aria-label="পণ্য সরান"
                                                disabled={
                                                    Number(
                                                        itemBusy
                                                    )
                                                    ===
                                                    Number(
                                                        item.id
                                                    )
                                                }
                                                onClick={() =>
                                                    removeItem(
                                                        item
                                                    )
                                                }
                                            >
                                                <i className="fa-solid fa-trash-can" />
                                            </button>

                                        </article>

                                    )
                                )}

                            </div>

                        </section>


                        {/* =================================================
                            2. CUSTOMER / SHIPPING INFO
                        ================================================= */}

                        <section className="fvc2-card fvc2-shipping">

                            <div className="fvc2-title">

                                <i className="fa-solid fa-location-dot" />

                                <strong>
                                    ডেলিভারি তথ্য
                                </strong>

                            </div>


                            <div className="fvc2-fields">


                                {/* NAME */}

                                <label>

                                    <span>
                                        পুরো নাম *
                                    </span>


                                    <div>

                                        <i className="fa-regular fa-user" />


                                        <input
                                            type="text"
                                            autoComplete="name"
                                            placeholder="আপনার পুরো নাম লিখুন"
                                            value={
                                                form
                                                    .customer_name
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                change(
                                                    "customer_name",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        />

                                    </div>

                                </label>


                                {/* PHONE */}

                                <label>

                                    <span>
                                        মোবাইল নম্বর *
                                    </span>


                                    <div>

                                        <i className="fa-solid fa-phone" />


                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            autoComplete="tel"
                                            maxLength="11"
                                            placeholder="যেমন: 01XXXXXXXXX"
                                            value={
                                                form
                                                    .customer_phone
                                            }
                                            onChange={(
                                                event
                                            ) => {
                                                const value =
                                                    event
                                                        .target
                                                        .value
                                                        .replace(
                                                            /[^0-9]/g,
                                                            ""
                                                        )
                                                        .slice(
                                                            0,
                                                            11
                                                        );


                                                change(
                                                    "customer_phone",
                                                    value
                                                );
                                            }}
                                        />

                                    </div>

                                </label>


                                {/* ADDRESS */}

                                <label className="address">

                                    <span>
                                        সম্পূর্ণ ঠিকানা *
                                    </span>


                                    <div>

                                        <i className="fa-solid fa-location-crosshairs" />


                                        <textarea
                                            rows="2"
                                            placeholder="বাড়ি/ফ্ল্যাট, রোড, এলাকা, থানা/উপজেলা, জেলা লিখুন"
                                            value={
                                                form.address
                                            }
                                            onChange={(
                                                event
                                            ) =>
                                                change(
                                                    "address",
                                                    event
                                                        .target
                                                        .value
                                                )
                                            }
                                        />

                                    </div>

                                </label>

                            </div>

                        </section>


                        {/* =================================================
                            3. DELIVERY AREA
                        ================================================= */}

                        <section className="fvc2-card">

                            <div className="fvc2-title">

                                <i className="fa-solid fa-truck-fast" />

                                <strong>
                                    ডেলিভারি এলাকা
                                </strong>

                            </div>


                            <div className="fvc2-area-grid">

                                {(
                                    checkout
                                        ?.delivery_options
                                    || []
                                ).map(
                                    (
                                        option
                                    ) => {
                                        const active =
                                            form
                                                .delivery_area
                                            ===
                                            option.key;


                                        return (
                                            <button
                                                type="button"
                                                className={
                                                    active
                                                        ? "active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    change(
                                                        "delivery_area",
                                                        option.key
                                                    )
                                                }
                                                key={
                                                    option.key
                                                }
                                            >

                                                <span>

                                                    <i
                                                        className={
                                                            active
                                                                ? "fa-solid fa-circle-check"
                                                                : "fa-regular fa-circle"
                                                        }
                                                    />

                                                </span>


                                                <div>

                                                    <strong>
                                                        {
                                                            deliveryAreaLabel(
                                                                option
                                                            )
                                                        }
                                                    </strong>


                                                    <small>
                                                        {
                                                            deliveryAreaDescription(
                                                                option
                                                            )
                                                        }
                                                    </small>

                                                </div>


                                                <b>
                                                    {Number(
                                                        option
                                                            .charge
                                                        || 0
                                                    ) > 0
                                                        ? money(
                                                            option
                                                                .charge
                                                        )
                                                        : "ফ্রি"
                                                    }
                                                </b>

                                            </button>
                                        );
                                    }
                                )}

                            </div>

                        </section>


                        {/* =================================================
                            4. ORDER NOTE
                        ================================================= */}

                        <section className="fvc2-card">

                            <div className="fvc2-title">

                                <i className="fa-regular fa-note-sticky" />

                                <strong>
                                    অর্ডার নোট
                                </strong>

                                <span>
                                    ঐচ্ছিক
                                </span>

                            </div>


                            <label className="fvc2-note">

                                <textarea
                                    rows="3"
                                    maxLength="90"
                                    placeholder="ডেলিভারি সম্পর্কে বিশেষ নির্দেশনা থাকলে লিখুন..."
                                    value={
                                        form
                                            .customer_note
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        change(
                                            "customer_note",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                />


                                <small>
                                    {
                                        form
                                            .customer_note
                                            .length
                                    }
                                    {" / 90"}
                                </small>

                            </label>

                        </section>


                        {/* =================================================
                            5. MOBILE SUMMARY
                        ================================================= */}

                        <section className="fvc2-mobile-summary">

                            <button
                                type="button"
                                className="fvc2-summary-toggle"
                                onClick={() =>
                                    setSummaryOpen(
                                        (
                                            current
                                        ) =>
                                            !current
                                    )
                                }
                            >

                                <span>

                                    <i className="fa-solid fa-receipt" />

                                    অর্ডার সারাংশ

                                </span>


                                <strong>
                                    {money(
                                        totals.total
                                    )}
                                </strong>


                                <i
                                    className={
                                        summaryOpen
                                            ? "fa-solid fa-chevron-up"
                                            : "fa-solid fa-chevron-down"
                                    }
                                />

                            </button>


                            {summaryOpen && (

                                <div className="fvc2-summary-body">

                                    <SummaryRows />

                                </div>

                            )}

                        </section>

                    </main>


                    {/* =================================================
                        DESKTOP SUMMARY
                    ================================================= */}

                    <aside className="fvc2-desktop-summary">

                        <div className="fvc2-card">

                            <div className="fvc2-title">

                                <i className="fa-solid fa-receipt" />

                                <strong>
                                    অর্ডার সারাংশ
                                </strong>

                            </div>


                            <div className="fvc2-summary-body">

                                <SummaryRows />


                                <button
                                    type="button"
                                    className="fvc2-place-order desktop"
                                    disabled={
                                        placing
                                        ||
                                        items.length ===
                                            0
                                    }
                                    onClick={
                                        placeOrder
                                    }
                                >
                                    <i className="fa-solid fa-lock" />


                                    {placing
                                        ? "অর্ডার সম্পন্ন হচ্ছে..."
                                        : "অর্ডার করুন"
                                    }


                                    <span>
                                        {money(
                                            totals.total
                                        )}
                                    </span>

                                </button>

                            </div>

                        </div>


                        {/* SAVE STATE */}

                        {(saving || saved) && (

                            <div className="fvc2-save-state">

                                {saving ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin" />

                                        সংরক্ষণ হচ্ছে...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-circle-check" />

                                        সংরক্ষিত
                                    </>
                                )}

                            </div>

                        )}

                    </aside>

                </div>

            </div>


            {/* =================================================
                MOBILE FIXED ACTION
            ================================================= */}

            <div className="fvc2-mobile-fixed">

                <div>

                    <small>
                        মোট
                    </small>

                    <strong>
                        {money(
                            totals.total
                        )}
                    </strong>

                </div>


                <button
                    type="button"
                    className="fvc2-place-order"
                    disabled={
                        placing
                        ||
                        items.length ===
                            0
                    }
                    onClick={
                        placeOrder
                    }
                >
                    <i className="fa-solid fa-lock" />


                    {placing
                        ? "অর্ডার হচ্ছে..."
                        : "অর্ডার করুন"
                    }

                </button>

            </div>

        </div>
    );
}