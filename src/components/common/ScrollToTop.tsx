import {
    useLayoutEffect,
} from "react";

import {
    useLocation,
} from "react-router-dom";


/*
|--------------------------------------------------------------------------
| GLOBAL SCROLL TO TOP
|--------------------------------------------------------------------------
|
| Every React Router navigation:
|
| Product Card -> Product Details
| Category -> Category Page
| Store -> Seller Store
| Search -> Search Result
| Cart -> Checkout
| Footer Links
| Account Pages
|
| নতুন page সবসময় top থেকে শুরু হবে।
|
*/

export default function ScrollToTop() {
    const location =
        useLocation();


    useLayoutEffect(
        () => {

            /*
            |--------------------------------------------------------------------------
            | DISABLE BROWSER AUTOMATIC SCROLL RESTORATION
            |--------------------------------------------------------------------------
            */

            if (
                "scrollRestoration"
                in
                window.history
            ) {
                window.history.scrollRestoration =
                    "manual";
            }


            /*
            |--------------------------------------------------------------------------
            | RESET ALL POSSIBLE SCROLL CONTAINERS
            |--------------------------------------------------------------------------
            */

            const scrollTop =
                () => {

                    /*
                     * Main browser/window scroll.
                     */
                    window.scrollTo({
                        top:
                            0,

                        left:
                            0,

                        behavior:
                            "auto",
                    });


                    /*
                     * Chrome / Firefox / Safari fallback.
                     */
                    document.documentElement.scrollTop =
                        0;


                    document.body.scrollTop =
                        0;


                    /*
                     * If your React layout has its own scrollable <main>.
                     */
                    const main =
                        document.querySelector(
                            "main"
                        );


                    if (
                        main
                    ) {
                        main.scrollTop =
                            0;

                        main.scrollLeft =
                            0;
                    }


                    /*
                     * Facevaly page shell fallback.
                     */
                    const pageShell =
                        document.querySelector(
                            ".page-shell"
                        );


                    if (
                        pageShell
                    ) {
                        pageShell.scrollTop =
                            0;
                    }
                };


            /*
            |--------------------------------------------------------------------------
            | IMMEDIATE RESET
            |--------------------------------------------------------------------------
            */

            scrollTop();


            /*
            |--------------------------------------------------------------------------
            | RESET AFTER REACT PAINT
            |--------------------------------------------------------------------------
            |
            | Helps when the new page/layout mounts after the URL changes.
            |
            */

            const frame =
                window.requestAnimationFrame(
                    () => {
                        scrollTop();


                        window.requestAnimationFrame(
                            scrollTop
                        );
                    }
                );


            return () => {
                window.cancelAnimationFrame(
                    frame
                );
            };

        },

        /*
        |--------------------------------------------------------------------------
        | RUN ON EVERY ROUTE NAVIGATION
        |--------------------------------------------------------------------------
        */

        [
            location.pathname,
            location.search,
            location.key,
        ]
    );


    return null;
}