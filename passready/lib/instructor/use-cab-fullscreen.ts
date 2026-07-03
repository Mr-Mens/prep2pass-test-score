"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type CabFullscreenMode = "closed" | "native" | "overlay";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function isNativeFullscreenActive(node: HTMLElement | null): boolean {
  if (!node) return false;
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement === node || doc.webkitFullscreenElement === node;
}

async function requestNativeFullscreen(node: HTMLElement): Promise<void> {
  const target = node as FullscreenElement;
  if (typeof target.requestFullscreen === "function") {
    await target.requestFullscreen();
    return;
  }
  if (typeof target.webkitRequestFullscreen === "function") {
    await target.webkitRequestFullscreen();
    return;
  }
  throw new Error("Fullscreen API unavailable");
}

async function exitNativeFullscreen(node: HTMLElement | null): Promise<void> {
  if (!isNativeFullscreenActive(node)) return;
  const doc = document as FullscreenDocument;
  if (typeof doc.exitFullscreen === "function") {
    await doc.exitFullscreen();
    return;
  }
  await doc.webkitExitFullscreen?.();
}

export function useCabFullscreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<CabFullscreenMode>("closed");
  const isOpen = mode !== "closed";

  const syncNativeFullscreen = useCallback(() => {
    const node = containerRef.current;
    if (isNativeFullscreenActive(node)) {
      setMode("native");
      return;
    }
    setMode((current) => (current === "native" ? "closed" : current));
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncNativeFullscreen);
    document.addEventListener("webkitfullscreenchange", syncNativeFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncNativeFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncNativeFullscreen);
    };
  }, [syncNativeFullscreen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (mode !== "overlay") return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMode("closed");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);

  const open = useCallback(async () => {
    const node = containerRef.current;
    if (!node) {
      setMode("overlay");
      return;
    }
    try {
      await requestNativeFullscreen(node);
      setMode("native");
    } catch {
      setMode("overlay");
    }
  }, []);

  const close = useCallback(async () => {
    await exitNativeFullscreen(containerRef.current);
    setMode("closed");
  }, []);

  return {
    containerRef,
    isOpen,
    mode,
    open,
    close,
  };
}
