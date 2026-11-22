import { useEffect, useState } from "react";

export type FrontendStickyState = {
  desktopStuck: boolean;
  mobileSearchStuck: boolean;
};

export default function useFrontendStickyState(): FrontendStickyState {
  const [desktopStuck, setDesktopStuck] = useState(false);
  const [mobileSearchStuck, setMobileSearchStuck] = useState(false);

  useEffect(() => {
    const update = () => {
      const y =
        window.scrollY || document.documentElement.scrollTop || 0;

      const desktopTopbar = document.querySelector(
        ".desktop-topbar"
      ) as HTMLElement | null;

      const mobileAppbar = document.getElementById("mobileAppbar");

      setDesktopStuck(
        Boolean(desktopTopbar) && y >= (desktopTopbar?.offsetHeight ?? 0)
      );

      setMobileSearchStuck(
        Boolean(mobileAppbar) && y >= mobileAppbar.offsetHeight
      );
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return {
    desktopStuck,
    mobileSearchStuck,
  };
}
