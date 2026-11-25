"use client";

import Script from "next/script";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { publicEnv } from "@/lib/public-env";

/** Explicit-render API of https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit */
type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId: string) => void;
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
 * where Turnstile adds the `cf-turnstile-response` input. A token is single-use: a new `attempt`
 * resets the widget in place for a fresh one.
 */
export function TurnstileWidget({
  attempt,
  onTokenChange,
}: {
  attempt: number;
  onTokenChange: (token: string | null) => void;
}) {
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const reportToken = useEffectEvent((token: string | null) => onTokenChange(token));
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const { turnstile } = window;
    if (!isScriptReady || !container || !turnstile) return;

    const clearToken = () => reportToken(null);
    const widgetId = turnstile.render(container, {
      sitekey: siteKey,
      appearance: "always",
      theme: "light",
      size: "flexible",
      callback: reportToken,
      "expired-callback": clearToken,
      "error-callback": clearToken,
      "timeout-callback": clearToken,
    });
    widgetIdRef.current = widgetId;

    return () => {
      turnstile.remove(widgetId);
      widgetIdRef.current = null;
      clearToken();
    };
  }, [container, isScriptReady]);

  useEffect(() => {
    const { current: widgetId } = widgetIdRef;
    if (attempt === 0 || !widgetId) return;
    window.turnstile?.reset(widgetId);
    reportToken(null);
  }, [attempt]);

  return (
    <>
      <Script src={TURNSTILE_SCRIPT_URL} onReady={() => setIsScriptReady(true)} />
      <div ref={setContainer} className="min-h-16.25" />
    </>
  );
}
