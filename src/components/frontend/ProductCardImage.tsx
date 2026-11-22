import {
    useEffect,
    useState,
} from "react";

import {
    mediaUrl,
} from "../../config/api";

type ProductCardImageProps = {
    src?: string | null;
    alt?: string;
    className?: string;
};

export default function ProductCardImage({
    src,
    alt = "",
    className = "",
}: ProductCardImageProps) {
    const [
        failed,
        setFailed,
    ] = useState(false);

    const resolved =
        mediaUrl(src);

    useEffect(
        () => {
            setFailed(false);
        },
        [
            src,
        ]
    );

    if (
        !resolved
        ||
        failed
    ) {
        return (
            <span className={className}>
                <i className="fa-regular fa-image" />
            </span>
        );
    }

    return (
        <img
            className={className}
            src={resolved}
            alt={alt}
            loading="lazy"
            onError={() =>
                setFailed(true)
            }
        />
    );
}
