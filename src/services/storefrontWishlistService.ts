import {
    storefrontCartRequest,
} from "./storefrontCartService";


const storefrontWishlistService = {
    get(): Promise<any> {
        return storefrontCartRequest(
            "storefront/wishlist",
            {
                method: "GET",
            }
        );
    },

    add(productId: string | number): Promise<any> {
        const id = Number(productId);

        if (!Number.isInteger(id) || id <= 0) {
            return Promise.reject(
                new Error(
                    "A valid product is required."
                )
            );
        }

        return storefrontCartRequest(
            `storefront/wishlist/${encodeURIComponent(
                String(id)
            )}`,
            {
                method: "POST",
                body: JSON.stringify({}),
            }
        );
    },

    remove(productId: string | number): Promise<any> {
        const id = Number(productId);

        if (!Number.isInteger(id) || id <= 0) {
            return Promise.reject(
                new Error(
                    "A valid product is required."
                )
            );
        }

        return storefrontCartRequest(
            `storefront/wishlist/${encodeURIComponent(
                String(id)
            )}`,
            {
                method: "DELETE",
            }
        );
    },
};


export default storefrontWishlistService;
