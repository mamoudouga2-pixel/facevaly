import React, {
    useEffect,
    useState,
} from "react";

import homeBannerAdminService
    from "../../services/homeBannerAdminService";

import "./HomeBannerManager.css";


const emptySlide = {
    admin_name: "",
    link_url: "",
    link_target: "_self",
    sort_order: 0,
    starts_at: "",
    ends_at: "",
    is_active: true,
    image: null,
    mobile_image: null,
};


export default function HomeBannerManager() {
    const [
        slides,
        setSlides,
    ] =
        useState([]);

    const [
        settings,
        setSettings,
    ] =
        useState(null);

    const [
        slideForm,
        setSlideForm,
    ] =
        useState(
            emptySlide
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
        notice,
        setNotice,
    ] =
        useState("");

    const [
        error,
        setError,
    ] =
        useState("");


    const load =
        async () => {
            setLoading(
                true
            );

            setError("");

            try {
                const response =
                    await homeBannerAdminService.index();

                setSlides(
                    response?.data
                        ?.slides
                    ||
                    []
                );

                setSettings(
                    response?.data
                        ?.settings
                    ||
                    null
                );
            } catch (
                exception
            ) {
                setError(
                    exception.message
                );
            } finally {
                setLoading(
                    false
                );
            }
        };


    useEffect(
        () => {
            load();
        },
        []
    );


    const createSlide =
        async (
            event
        ) => {
            event.preventDefault();

            if (
                !slideForm.image
            ) {
                setError(
                    "Desktop banner image is required."
                );

                return;
            }

            const data =
                new FormData();

            Object.entries(
                slideForm
            ).forEach(
                ([
                    key,
                    value,
                ]) => {
                    if (
                        value === null
                        ||
                        value === ""
                    ) {
                        return;
                    }

                    if (
                        key ===
                        "is_active"
                    ) {
                        data.append(
                            key,
                            value
                                ? "1"
                                : "0"
                        );

                        return;
                    }

                    data.append(
                        key,
                        value
                    );
                }
            );

            try {
                setSaving(
                    true
                );

                setError("");

                const response =
                    await homeBannerAdminService.createSlide(
                        data
                    );

                setNotice(
                    response.message
                );

                setSlideForm(
                    emptySlide
                );

                await load();
            } catch (
                exception
            ) {
                setError(
                    exception.message
                );
            } finally {
                setSaving(
                    false
                );
            }
        };


    const toggleSlide =
        async (
            slide
        ) => {
            try {
                await homeBannerAdminService.toggleSlide(
                    slide.id,
                    !slide.is_active
                );

                await load();
            } catch (
                exception
            ) {
                setError(
                    exception.message
                );
            }
        };


    const deleteSlide =
        async (
            slide
        ) => {
            if (
                !window.confirm(
                    `Delete "${slide.admin_name || `Slide ${slide.id}`}"?`
                )
            ) {
                return;
            }

            try {
                await homeBannerAdminService.deleteSlide(
                    slide.id
                );

                await load();
            } catch (
                exception
            ) {
                setError(
                    exception.message
                );
            }
        };


    const saveSettings =
        async (
            event
        ) => {
            event.preventDefault();

            if (
                !settings
            ) {
                return;
            }

            const data =
                new FormData();

            [
                "autoplay_ms",
                "app_title",
                "rating_text",
                "promo_heading",
                "benefit_one_text",
                "benefit_two_text",
                "app_store_url",
                "play_store_url",
                "footer_text",
            ].forEach(
                (
                    field
                ) => {
                    data.append(
                        field,
                        settings[
                            field
                        ]
                        ?? ""
                    );
                }
            );

            data.append(
                "pause_on_hover",
                settings.pause_on_hover
                    ? "1"
                    : "0"
            );

            data.append(
                "show_right_panel",
                settings.show_right_panel
                    ? "1"
                    : "0"
            );

            if (
                settings.app_icon_file
            ) {
                data.append(
                    "app_icon",
                    settings.app_icon_file
                );
            }

            if (
                settings.qr_image_file
            ) {
                data.append(
                    "qr_image",
                    settings.qr_image_file
                );
            }

            try {
                setSaving(
                    true
                );

                setError("");

                const response =
                    await homeBannerAdminService.updateSettings(
                        data
                    );

                setNotice(
                    response.message
                );

                await load();
            } catch (
                exception
            ) {
                setError(
                    exception.message
                );
            } finally {
                setSaving(
                    false
                );
            }
        };


    if (
        loading
    ) {
        return (
            <div className="fv-hbm-loading">
                Loading Home Banner Manager...
            </div>
        );
    }


    return (
        <div className="fv-hbm-page">

            <div className="fv-hbm-head">
                <div>
                    <h1>
                        Home Banner Manager
                    </h1>

                    <p>
                        Manage slider images and the desktop app-download panel.
                    </p>
                </div>
            </div>


            {error && (
                <div className="fv-hbm-alert error">
                    {
                        error
                    }
                </div>
            )}


            {notice && (
                <div className="fv-hbm-alert success">
                    {
                        notice
                    }
                </div>
            )}


            {/* ============================================================
                ADD SLIDE
            ============================================================ */}

            <form
                className="fv-hbm-card"
                onSubmit={
                    createSlide
                }
            >

                <h2>
                    Add Banner Slide
                </h2>


                <div className="fv-hbm-grid">

                    <label>
                        <span>
                            Internal Name
                        </span>

                        <input
                            type="text"
                            value={
                                slideForm.admin_name
                            }
                            onChange={(
                                event
                            ) =>
                                setSlideForm(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        admin_name:
                                            event.target.value,
                                    })
                                )
                            }
                        />
                    </label>


                    <label>
                        <span>
                            Link URL
                        </span>

                        <input
                            type="text"
                            value={
                                slideForm.link_url
                            }
                            onChange={(
                                event
                            ) =>
                                setSlideForm(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        link_url:
                                            event.target.value,
                                    })
                                )
                            }
                        />
                    </label>


                    <label>
                        <span>
                            Desktop Image *
                        </span>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(
                                event
                            ) =>
                                setSlideForm(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        image:
                                            event.target.files
                                                ?.[0]
                                            ||
                                            null,
                                    })
                                )
                            }
                        />
                    </label>


                    <label>
                        <span>
                            Mobile Image
                        </span>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(
                                event
                            ) =>
                                setSlideForm(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        mobile_image:
                                            event.target.files
                                                ?.[0]
                                            ||
                                            null,
                                    })
                                )
                            }
                        />
                    </label>


                    <label>
                        <span>
                            Start At
                        </span>

                        <input
                            type="datetime-local"
                            value={
                                slideForm.starts_at
                            }
                            onChange={(
                                event
                            ) =>
                                setSlideForm(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        starts_at:
                                            event.target.value,
                                    })
                                )
                            }
                        />
                    </label>


                    <label>
                        <span>
                            End At
                        </span>

                        <input
                            type="datetime-local"
                            value={
                                slideForm.ends_at
                            }
                            onChange={(
                                event
                            ) =>
                                setSlideForm(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        ends_at:
                                            event.target.value,
                                    })
                                )
                            }
                        />
                    </label>

                </div>


                <button
                    type="submit"
                    disabled={
                        saving
                    }
                >
                    Add Slide
                </button>

            </form>


            {/* ============================================================
                SLIDE LIST
            ============================================================ */}

            <section className="fv-hbm-card">

                <h2>
                    Slider Images
                </h2>


                <div className="fv-hbm-slides">

                    {slides.map(
                        (
                            slide
                        ) => (

                            <article
                                key={
                                    slide.id
                                }
                            >

                                <div>
                                    <strong>
                                        {
                                            slide.admin_name
                                            ||
                                            `Slide ${slide.id}`
                                        }
                                    </strong>

                                    <small>
                                        Order: {
                                            slide.sort_order
                                        }
                                    </small>
                                </div>


                                <button
                                    type="button"
                                    onClick={() =>
                                        toggleSlide(
                                            slide
                                        )
                                    }
                                >
                                    {
                                        slide.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                </button>


                                <button
                                    type="button"
                                    className="delete"
                                    onClick={() =>
                                        deleteSlide(
                                            slide
                                        )
                                    }
                                >
                                    Delete
                                </button>

                            </article>

                        )
                    )}

                </div>

            </section>


            {/* ============================================================
                RIGHT PANEL CONTENT
            ============================================================ */}

            {settings && (

                <form
                    className="fv-hbm-card"
                    onSubmit={
                        saveSettings
                    }
                >

                    <h2>
                        Desktop Right Panel
                    </h2>


                    <div className="fv-hbm-grid">

                        {[
                            [
                                "app_title",
                                "App Title",
                            ],

                            [
                                "rating_text",
                                "Rating Text",
                            ],

                            [
                                "promo_heading",
                                "Promo Heading",
                            ],

                            [
                                "benefit_one_text",
                                "Benefit One",
                            ],

                            [
                                "benefit_two_text",
                                "Benefit Two",
                            ],

                            [
                                "footer_text",
                                "Footer Text",
                            ],

                            [
                                "app_store_url",
                                "App Store URL",
                            ],

                            [
                                "play_store_url",
                                "Google Play URL",
                            ],
                        ].map(
                            ([
                                field,
                                label,
                            ]) => (

                                <label
                                    key={
                                        field
                                    }
                                >
                                    <span>
                                        {
                                            label
                                        }
                                    </span>

                                    <input
                                        type="text"
                                        value={
                                            settings[
                                                field
                                            ]
                                            ??
                                            ""
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSettings(
                                                (
                                                    current
                                                ) => ({
                                                    ...current,

                                                    [field]:
                                                        event.target.value,
                                                })
                                            )
                                        }
                                    />
                                </label>

                            )
                        )}


                        <label>
                            <span>
                                Auto Slide Milliseconds
                            </span>

                            <input
                                type="number"
                                min="2000"
                                max="30000"
                                value={
                                    settings.autoplay_ms
                                }
                                onChange={(
                                    event
                                ) =>
                                    setSettings(
                                        (
                                            current
                                        ) => ({
                                            ...current,

                                            autoplay_ms:
                                                Number(
                                                    event.target.value
                                                ),
                                        })
                                    )
                                }
                            />
                        </label>


                        <label>
                            <span>
                                App Icon
                            </span>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(
                                    event
                                ) =>
                                    setSettings(
                                        (
                                            current
                                        ) => ({
                                            ...current,

                                            app_icon_file:
                                                event.target.files
                                                    ?.[0]
                                                ||
                                                null,
                                        })
                                    )
                                }
                            />
                        </label>


                        <label>
                            <span>
                                QR Image
                            </span>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(
                                    event
                                ) =>
                                    setSettings(
                                        (
                                            current
                                        ) => ({
                                            ...current,

                                            qr_image_file:
                                                event.target.files
                                                    ?.[0]
                                                ||
                                                null,
                                        })
                                    )
                                }
                            />
                        </label>

                    </div>


                    <label className="fv-hbm-check">
                        <input
                            type="checkbox"
                            checked={
                                Boolean(
                                    settings.pause_on_hover
                                )
                            }
                            onChange={(
                                event
                            ) =>
                                setSettings(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        pause_on_hover:
                                            event.target.checked,
                                    })
                                )
                            }
                        />

                        Pause slider on hover
                    </label>


                    <label className="fv-hbm-check">
                        <input
                            type="checkbox"
                            checked={
                                Boolean(
                                    settings.show_right_panel
                                )
                            }
                            onChange={(
                                event
                            ) =>
                                setSettings(
                                    (
                                        current
                                    ) => ({
                                        ...current,

                                        show_right_panel:
                                            event.target.checked,
                                    })
                                )
                            }
                        />

                        Show right panel on desktop
                    </label>


                    <button
                        type="submit"
                        disabled={
                            saving
                        }
                    >
                        Save Panel Content
                    </button>

                </form>

            )}

        </div>
    );
}
