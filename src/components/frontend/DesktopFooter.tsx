import React from "react";

import { Link } from "react-router-dom";

import "./styles/DesktopFooter.css";

const LOGO_URL = "/img/logo.webp";

const appStores = [
    { id: "ios", eyebrow: "Download on the", name: "App Store", icon: "fa-brands fa-apple" },
    { id: "android", eyebrow: "Get it on", name: "Google Play", icon: "fa-brands fa-google-play" },
    { id: "huawei", eyebrow: "Explore it on", name: "AppGallery", icon: "fa-solid fa-mobile-screen-button" },
];

const socialLinks = [
    {
        id: "facebook",
        label: "Facebook",
        icon: "fa-brands fa-facebook-f",
        href: "https://www.facebook.com/",
    },
    {
        id: "x",
        label: "X",
        icon: "fa-brands fa-x-twitter",
        href: "https://x.com/",
    },
    {
        id: "youtube",
        label: "YouTube",
        icon: "fa-brands fa-youtube",
        href: "https://www.youtube.com/",
    },
    {
        id: "instagram",
        label: "Instagram",
        icon: "fa-brands fa-instagram",
        href: "https://www.instagram.com/",
    },
    {
        id: "tiktok",
        label: "TikTok",
        icon: "fa-brands fa-tiktok",
        href: "https://www.tiktok.com/",
    },
    {
        id: "linkedin",
        label: "LinkedIn",
        icon: "fa-brands fa-linkedin-in",
        href: "https://www.linkedin.com/",
    },
];

export default function DesktopFooter() {
    return (
        <footer className="fv-ft">
            <div className="fv-ft__shell">

                {/* Brand statement + app */}

                <div className="fv-ft__masthead">
                    <div className="fv-ft__statement">
                        <Link className="fv-ft__brand" to="/">
                            <img src={LOGO_URL} alt="" />
                            <strong>Facevaly</strong>
                        </Link>

                        <h2>
                            Experience personalized online shopping in
                            Bangladesh with Facevaly
                        </h2>

                        <p>
                            Facevaly brings fashion, electronics, beauty, home
                            essentials and everyday lifestyle products together
                            in one marketplace. Shop with clear product
                            information, convenient delivery across the country
                            and the same experience on desktop, mobile and the
                            app.
                        </p>
                    </div>

                    <div className="fv-ft__app">
                        <span className="fv-ft__eyebrow">Get the app</span>

                        <p>Order in a tap and track every parcel.</p>

                        <div className="fv-ft__stores">
                            {appStores.map((store) => (
                                <a
                                    className="fv-ft__store"
                                    href="#"
                                    key={store.id}
                                    aria-label={`${store.eyebrow} ${store.name}`}
                                >
                                    <i className={store.icon} aria-hidden="true" />

                                    <span>
                                        <small>{store.eyebrow}</small>
                                        <strong>{store.name}</strong>
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Legal */}

                <div className="fv-ft__base">
                    <div className="fv-ft__legal">
                        <span>
                            © {new Date().getFullYear()} Facevaly. All rights
                            reserved.
                        </span>

                        <span className="fv-ft__credit">
                            Developed by{" "}
                            <a
                                className="fv-ft__studio"
                                href="https://webbytestudio.com"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                WebByte Studio
                            </a>
                        </span>
                    </div>

                    <div className="fv-ft__social">
                        {socialLinks.map((social) => (
                            <a
                                href={social.href}
                                key={social.id}
                                aria-label={social.label}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <i className={social.icon} aria-hidden="true" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            <div className="fv-ft__monolith" aria-hidden="true">
                <span>FACEVALY</span>
            </div>
        </footer>
    );
}
