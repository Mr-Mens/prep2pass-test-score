"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { BRAND_ICONS, PRODUCT } from "@/lib/constants";
import {
  type BeforeInstallPromptEvent,
  clearInstallDismissed,
  isStandaloneDisplayMode,
  promptNativeInstall,
  registerPassPilotServiceWorker,
  resolveInstallMode,
  type PwaInstallMode,
} from "@/lib/pwa/install";

function IosShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M6 12H5a2 2 0 00-2 2v5a2 2 0 002 2h14a2 2 0 002-2v-5a2 2 0 00-2-2h-1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PwaProvider() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<PwaInstallMode>(null);
  const [installing, setInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setMounted(true);
    clearInstallDismissed();
    void registerPassPilotServiceWorker();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isStandaloneDisplayMode()) return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (isStandaloneDisplayMode()) {
      setVisible(false);
      return;
    }

    const nextMode = resolveInstallMode(deferredPrompt);
    setMode(nextMode);
    setVisible(nextMode !== null);
  }, [mounted, deferredPrompt]);

  const dismiss = useCallback(() => {
    // Hide for this page view only; prompt returns on the next refresh or visit.
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      const accepted = await promptNativeInstall(deferredPrompt);
      if (accepted) {
        setVisible(false);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  if (!mounted || !visible || !mode) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-3 pb-safe-fixed pt-3 sm:px-4"
      role="region"
      aria-label="Install Pass Pilot"
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-2xl border border-brand-200/90 bg-white p-4 shadow-[0_16px_48px_rgba(28,34,48,0.18)] ring-1 ring-black/[0.04] sm:p-5">
        <div className="flex items-center gap-3">
          <Image
            src={BRAND_ICONS.icon192}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-brand-100"
          />
          <p className="min-w-0 flex-1 text-lg font-semibold text-brand-950">Install {PRODUCT.name} app</p>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1.5 text-brand-500 transition hover:bg-brand-50 hover:text-brand-800"
            aria-label="Dismiss install banner"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="my-4 border-t border-brand-100" />

        <p className="text-sm leading-relaxed text-brand-600">
          Install the app on your device to easily access it anytime. No app store, no hassle.
        </p>

        {mode === "android" ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void install()}
              disabled={installing}
              className="min-h-[44px] px-4 py-2.5 text-sm"
            >
              {installing ? "Installing…" : "Install app"}
            </Button>
            <Button type="button" variant="ghost" onClick={dismiss} className="min-h-[44px] px-3 py-2.5 text-sm">
              Not now
            </Button>
          </div>
        ) : (
          <ol className="mt-5 space-y-3 text-sm text-brand-800">
            <li className="flex items-center gap-2">
              <span className="shrink-0 text-brand-500">1.</span>
              <span>Tap on</span>
              <IosShareIcon className="h-5 w-5 shrink-0 text-brand-900" />
            </li>
            <li className="flex items-center gap-2">
              <span className="shrink-0 text-brand-500">2.</span>
              <span>Select</span>
              <span className="rounded-md bg-brand-100/80 px-2 py-1 font-medium text-brand-900">
                Add to Home Screen
              </span>
            </li>
          </ol>
        )}
      </div>
    </div>
  );
}

export function PwaRootEffects() {
  return <PwaProvider />;
}
