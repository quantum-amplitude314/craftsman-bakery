"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { publicEnv } from "@/lib/public-env";

/** Explicit-render API of https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit */
type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
};

type TurnstileRenderOptions = {
  sitekey: string;
  appearance: "always";
  theme: "light";
  size: "flexible";
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
  "timeout-callback": () => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const { NEXT_PUBLIC_TURNSTILE_SITE_KEY: siteKey } = publicEnv;

/**
 * Always-visible Turnstile widget, so the demo shows it. It renders inside the surrounding form,
 * where Turnstile adds the `cf-turnstile-response` input. A token is single-use: remount the
 * widget with a new `key` after each submission.
 */
export function TurnstileWidget({
  onTokenChange,
}: {
  onTokenChange: (token: string | null) => void;
}) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const { turnstile } = window;
    if (!isScriptReady || !container || !turnstile) return;

    const clearToken = () => onTokenChange(null);
    const widgetId = turnstile.render(container, {
      sitekey: siteKey,
      appearance: "always",
      theme: "light",
      size: "flexible",
      callback: onTokenChange,
      "expired-callback": clearToken,
      "error-callback": clearToken,
      "timeout-callback": clearToken,
    });

    return () => {
      turnstile.remove(widgetId);
      clearToken();
    };
  }, [container, isScriptReady, onTokenChange]);

  return (
    <>
      <Script src={TURNSTILE_SCRIPT_URL} onReady={() => setIsScriptReady(true)} />
      <div ref={setContainer} className="min-h-16.25" />
    </>
  );
}
