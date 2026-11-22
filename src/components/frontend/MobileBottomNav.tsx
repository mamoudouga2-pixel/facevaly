import React from "react";
import { NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import "./styles/MobileBottomNav.css";

const LOGO_URL = "/img/logo.webp";

function CategoriesIcon() {
    return (
        <svg
            className="mobile-bottom-nav__svg"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="4" cy="6" r="1.15" fill="currentColor" stroke="none" />
            <line x1="8" y1="6" x2="20" y2="6" />
            <circle cx="4" cy="12" r="1.15" fill="currentColor" stroke="none" />
            <line x1="8" y1="12" x2="20" y2="12" />
            <circle cx="4" cy="18" r="1.15" fill="currentColor" stroke="none" />
            <line x1="8" y1="18" x2="20" y2="18" />
        </svg>
    );
}

function CartIcon() {
    return (
        <svg
            className="mobile-bottom-nav__svg"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
            <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
            <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H7" />
        </svg>
    );
}

function AccountIcon() {
    return (
        <svg
            className="mobile-bottom-nav__svg"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="8" r="3.4" />
            <path d="M10.6 7.6c.35.55 1 .9 1.4.9s1.05-.35 1.4-.9" />
            <path d="M5.5 19.5c.8-3.2 3.2-5 6.5-5s5.7 1.8 6.5 5" />
        </svg>
    );
}

const items = [
    {
        id: "home",
        label: "Home",
        to: "/",
        end: true,
        home: true,
    },
    {
        id: "categories",
        label: "Categories",
        to: "/categories",
        Icon: CategoriesIcon,
    },
    {
        id: "cart",
        label: "Cart",
        to: "/cart",
        Icon: CartIcon,
        cart: true,
    },
    {
        id: "account",
        label: "Account",
        to: "/account",
        Icon: AccountIcon,
    },
];

export default function MobileBottomNav() {
    const { itemCount } = useCart();

    return (
        <nav className="mobile-bottom-nav" aria-label="Main navigation">
            <div className="mobile-bottom-nav__pill">
                {items.map((item) => (
                    <NavLink
                        key={item.id}
                        to={item.to}
                        end={Boolean(item.end)}
                        aria-label={item.label}
                        className={({ isActive }) =>
                            isActive
                                ? "mobile-bottom-nav__item is-active"
                                : "mobile-bottom-nav__item"
                        }
                    >
                        <span className="mobile-bottom-nav__icon-wrap">
                            {item.home ? (
                                <img
                                    className="mobile-bottom-nav__logo"
                                    src={LOGO_URL}
                                    alt=""
                                    draggable="false"
                                />
                            ) : item.Icon ? (
                                <item.Icon />
                            ) : null}

                            {item.cart && itemCount > 0 ? (
                                <b className="mobile-bottom-nav__badge">
                                    {itemCount > 99 ? "99+" : itemCount}
                                </b>
                            ) : null}
                        </span>

                        <span className="mobile-bottom-nav__label">
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
