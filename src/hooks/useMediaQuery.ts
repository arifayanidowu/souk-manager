import { useEffect, useState } from "react";

/**
 * A reusable hook that returns whether the given media query matches.
 *
 * @param query - The media query to match against
 * @returns boolean indicating whether the media query matches
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 * const isLandscape = useMediaQuery('(orientation: landscape)');
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Predefined media query hooks for common breakpoints
 */
export const useBreakpoints = () => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
  const isDesktop = useMediaQuery("(min-width: 1025px)");
  const isLargeDesktop = useMediaQuery("(min-width: 1280px)");

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
  };
};

/**
 * Predefined media query hooks for system preferences
 */
export const useSystemPreferences = () => {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)"
  );
  const prefersHighContrast = useMediaQuery("(prefers-contrast: high)");

  return {
    prefersDark,
    prefersReducedMotion,
    prefersHighContrast,
  };
};

/**
 * Predefined media query hooks for device characteristics
 */
export const useDeviceCharacteristics = () => {
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const isPortrait = useMediaQuery("(orientation: portrait)");
  const isTouchDevice = useMediaQuery("(pointer: coarse)");
  const isHoverDevice = useMediaQuery("(hover: hover)");

  return {
    isLandscape,
    isPortrait,
    isTouchDevice,
    isHoverDevice,
  };
};
