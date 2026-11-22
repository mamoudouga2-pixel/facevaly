import React from "react";
import { Link } from "react-router-dom";
import CartItemRow from "./CartItemRow";
import "./CartVendorGroup.css";

export default function CartVendorGroup({
    group,
    selected,
    busyItem,
    onSelect,
    onQuantity,
    onWishlist,
    onDelete,
}) {
    const availableIds = group.items
        .filter((item) => item.available)
        .map((item) => item.id);

    const groupSelected =
        availableIds.length > 0 &&
        availableIds.every((id) => selected.includes(id));

    const toggleGroup = () => {
        const shouldSelect = !groupSelected;

        availableIds.forEach((id) => {
            const has = selected.includes(id);

            if (has !== shouldSelect) {
                onSelect(id);
            }
        });
    };

    const vendorSlug = group.vendor?.slug;
    const vendorName = group.vendor?.name || "Seller";

    return (
        <section className="fv-cart-vendor-group">
            <div className="fv-cart-vendor-head">
                <label className="fv-cart-checkbox">
                    <input
                        type="checkbox"
                        checked={groupSelected}
                        onChange={toggleGroup}
                    />
                </label>

                {vendorSlug ? (
                    <Link
                        to={`/store/${vendorSlug}`}
                        className="fv-cart-vendor-name"
                    >
                        <i className="fa-solid fa-store" aria-hidden="true" />
                        <span>{vendorName}</span>
                        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                    </Link>
                ) : (
                    <div className="fv-cart-vendor-name">
                        <i className="fa-solid fa-store" aria-hidden="true" />
                        <span>{vendorName}</span>
                        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                    </div>
                )}
            </div>

            {group.items.map((item) => (
                <CartItemRow
                    item={item}
                    selected={selected.includes(item.id)}
                    busy={Number(busyItem) === Number(item.id)}
                    onSelect={onSelect}
                    onQuantity={onQuantity}
                    onWishlist={onWishlist}
                    onDelete={onDelete}
                    key={item.id}
                />
            ))}
        </section>
    );
}
