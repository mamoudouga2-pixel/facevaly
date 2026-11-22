import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import homepageService
    from "../services/homepageService";

import {
    persistStorefrontBootstrap,
    readStorefrontBootstrap,
} from "../utils/storefrontBootstrap";

import HomeBanner
    from "../components/frontend/homebanner/HomeBanner";

import CategoryShowcase
    from "../components/frontend/category/CategoryShowcase";

import FlashSaleSection
    from "../components/frontend/flashsale/FlashSaleSection";

import JustForYouSection
    from "../components/frontend/justforyou/JustForYouSection";


export default function Home() {
    const initialBootstrap =
        useMemo(
            () => readStorefrontBootstrap(),
            []
        );

    const [
        bootstrap,
        setBootstrap,
    ] = useState(
        initialBootstrap
    );


    useEffect(
        () => {
            let active = true;

            const syncBootstrap = (
                data
            ) => {
                if (
                    !active
                    || !data
                ) {
                    return;
                }

                setBootstrap(data);
                persistStorefrontBootstrap(data);
            };

            if (initialBootstrap) {
                homepageService
                    .show()
                    .then(
                        (response) => {
                            syncBootstrap(
                                response?.data
                                ?? null
                            );
                        }
                    )
                    .catch(
                        () => {
                            // Keep embedded / session data on background refresh failure.
                        }
                    );

                return () => {
                    active = false;
                };
            }

            homepageService
                .show()
                .then(
                    (response) => {
                        syncBootstrap(
                            response?.data
                            ?? null
                        );
                    }
                )
                .catch(
                    () => {
                        // Sections keep their own loading / error states.
                    }
                );

            return () => {
                active = false;
            };
        },
        [
            initialBootstrap,
        ]
    );


    return (
        <>
            <HomeBanner
                prefetched={bootstrap?.banner}
                skipFetch
            />

            <CategoryShowcase
                title="Categories"
                limit={32}
                prefetchedCategories={bootstrap?.categories}
                skipFetch
            />

            <FlashSaleSection
                slug="flash-sale"
                limit={24}
                prefetchedResponse={bootstrap?.flash_sale}
                skipFetch
            />

            <JustForYouSection
                perPage={18}
                prefetchedPage={bootstrap?.just_for_you}
                skipFetch
            />
        </>
    );
}
