"use client";

import { PWA } from "@/lib/pwa/config";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type PwaInstallMode = "android" | "ios" | null;

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // Legacy iOS Safari
    ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isIosSafari(): boolean {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent.toLowerCase();
  return !/crios|fxios|edgios|opr\//.test(ua);
}

export function readInstallDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PWA.installDismissKey) === "1";
  } catch {
    return false;
  }
}

export function persistInstallDismissed(): void {
  try {
    window.localStorage.setItem(PWA.installDismissKey, "1");
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

export function shouldRegisterServiceWorker(): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  return process.env.NEXT_PUBLIC_PWA_SW !== "false";
}

export async function registerPassPilotServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!shouldRegisterServiceWorker()) return null;

  try {
    const registration = await navigator.serviceWorker.register(PWA.swPath, {
      scope: PWA.swScope,
      updateViaCache: "none",
    });
    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });
    return registration;
  } catch {
    return null;
  }
}

export async function promptNativeInstall(deferred: BeforeInstallPromptEvent): Promise<boolean> {
  await deferred.prompt();
  const choice = await deferred.userChoice;
  return choice.outcome === "accepted";
}

export function resolveInstallMode(
  deferredPrompt: BeforeInstallPromptEvent | null,
): PwaInstallMode {
  if (deferredPrompt) return "android";
  if (isIosSafari() && !isStandaloneDisplayMode()) return "ios";
  return null;
}
