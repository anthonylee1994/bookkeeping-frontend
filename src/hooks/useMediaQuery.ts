import React from "react";

/** Tailwind `md` breakpoint：768px 以下當 mobile。 */
export const MOBILE_QUERY = "(max-width: 767px)";
export const TABLET_QUERY = "(min-width: 768px) and (max-width: 1023px)";
export const DESKTOP_QUERY = "(min-width: 1024px)";

function matchesMedia(query: string): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(query).matches;
}

/** 訂閱 CSS media query，供 responsive layout 使用；沒有 matchMedia 的環境安全回 false。 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = React.useState(() => matchesMedia(query));

    React.useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
        const media = window.matchMedia(query);
        const update = (): void => setMatches(media.matches);
        update();
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, [query]);

    return matches;
}
