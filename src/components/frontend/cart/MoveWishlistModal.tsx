import React from "react";
import "./MoveWishlistModal.css";

export default function MoveWishlistModal({
    open,
    onCancel,
    onMove,
    busy,
}) {
    if (!open) return null;

    return (
        <div
            className="fv-wishlist-modal-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onCancel();
                }
            }}
        >
            <div className="fv-wishlist-modal">
                <div className="fv-wishlist-modal-head">
                    <h3>Move To Wishlist</h3>

                    <button
                        type="button"
                        onClick={onCancel}
                    >
                        ×
                    </button>
                </div>

                <p>
                    Item(s) will be moved to wishlist and removed from cart.
                </p>

                <div className="fv-wishlist-modal-actions">
                    <button
                        type="button"
                        className="cancel"
                        onClick={onCancel}
                    >
                        CANCEL
                    </button>

                    <button
                        type="button"
                        className="move"
                        disabled={busy}
                        onClick={onMove}
                    >
                        {busy ? "MOVING..." : "MOVE"}
                    </button>
                </div>
            </div>
        </div>
    );
}
