"use client";

type NavigatorWithBadge = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

export async function setHomescreenBadge(count: number): Promise<void> {
  if (typeof navigator === "undefined") return;
  const nav = navigator as NavigatorWithBadge;
  try {
    if (count > 0) {
      if (typeof nav.setAppBadge === "function") await nav.setAppBadge(count);
    } else if (typeof nav.clearAppBadge === "function") {
      await nav.clearAppBadge();
    }
  } catch {
    // Unsupported or permission denied — ignore.
  }
}

export async function clearHomescreenBadge(): Promise<void> {
  await setHomescreenBadge(0);
}
