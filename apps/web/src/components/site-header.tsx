"use client";

import { useSyncExternalStore } from "react";

/** Past this many pixels the header leaves the photo and needs its own background. */
const SCROLLED_PAST_PX = 8;

const subscribeToScroll = (onChange: () => void) => {
  window.addEventListener("scroll", onChange, { passive: true });

  return () => window.removeEventListener("scroll", onChange);
};

const readIsScrolled = () => window.scrollY > SCROLLED_PAST_PX;
const readServerIsScrolled = () => false;

/**
 * Fixed over the page's photo: transparent at the top, a blurred card background
 * once the page scrolls under it.
 */
export function SiteHeader() {
  const isScrolled = useSyncExternalStore(subscribeToScroll, readIsScrolled, readServerIsScrolled);

  return (
    <header
      data-scrolled={isScrolled}
      className="fixed inset-x-0 top-0 z-20 border-transparent border-b transition-[background-color,border-color] duration-200 data-[scrolled=true]:border-border data-[scrolled=true]:bg-card/85 data-[scrolled=true]:backdrop-blur"
    >
      <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 lg:max-w-5xl">
        {/* biome-ignore lint/performance/noImgElement: a tiny SVG needs no optimisation */}
        <img src="/icon.svg" alt="" width={32} height={32} />
        <span className="font-heading font-semibold text-primary text-xl">Craftsman Bakery</span>
      </div>
    </header>
  );
}
