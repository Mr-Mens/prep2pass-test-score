"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { BRAND_ICONS, PRODUCT } from "@/lib/constants";
import {
  type BeforeInstallPromptEvent,
  isStandaloneDisplayMode,
  persistInstallDismissed,
  promptNativeInstall,
  readInstallDismissed,
  registerPassPilotServiceWorker,
  resolveInstallMode,
  type PwaInstallMode,
} from "@/lib/pwa/install";

export function PwaProvider() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<PwaInstallMode>(null);
  const [installing, setInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setMounted(true);
    void registerPassPilotServiceWorker();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isStandaloneDisplayMode() || readInstallDismissed()) return;

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (isStandaloneDisplayMode() || readInstallDismissed()) {
      setVisible(false);
      return;
    }

    const nextMode = resolveInstallMode(deferredPrompt);
    setMode(nextMode);
    setVisible(nextMode !== null);
  }, [mounted, deferredPrompt]);

  const dismiss = useCallback(() => {
    persistInstallDismissed();
    setVisible(false);
    setDeferredPrompt(null);
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
      <div className="pointer-events-auto mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-brand-200/90 bg-white p-4 shadow-[0_16px_48px_rgba(28,34,48,0.18)] ring-1 ring-black/[0.04]">
        <Image
          src={BRAND_ICONS.icon192}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-xl ring-1 ring-brand-100"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-950">Install {PRODUCT.name}</p>
          {mode === "android" ? (
            <p className="mt-1 text-sm leading-relaxed text-brand-600">
              Add {PRODUCT.name} to your home screen for full-screen access, faster launch and an app-like experience.
            </p>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-brand-600">
              On iPhone, tap <span className="font-semibold text-brand-900">Share</span>, then{" "}
              <span className="font-semibold text-brand-900">Add to Home Screen</span> to install {PRODUCT.name}.
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {mode === "android" ? (
              <Button type="button" onClick={() => void install()} disabled={installing} className="min-h-[44px] px-4 py-2.5 text-sm">
                {installing ? "Installing…" : "Install app"}
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={dismiss} className="min-h-[44px] px-3 py-2.5 text-sm">
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg p-2 text-brand-500 transition hover:bg-brand-50 hover:text-brand-800"
          aria-label="Dismiss install banner"
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}

export function PwaRootEffects() {
  return <PwaProvider />;
}
