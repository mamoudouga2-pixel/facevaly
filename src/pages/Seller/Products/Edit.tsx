import {
    Navigate,
    useParams,
} from "react-router-dom";

import ProductForm
    from "./ProductForm";


export default function SellerProductEdit() {
    const {
        productId,
    } =
        useParams();

    const id =
        Number(
            productId
        );

    /*
     * Protect ProductForm from an invalid route parameter.
     */
    if (
        !Number.isInteger(id) ||
        id < 1
    ) {
        return (
            <Navigate
                to="/seller/products"
                replace
            />
        );
    }

    return (
        <ProductForm
            productId={id}
        />
    );
}
