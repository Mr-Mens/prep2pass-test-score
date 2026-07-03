"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { DiagramMedia } from "@/components/instructor/diagrams/DiagramMedia";
import type { DiagramImageAsset } from "@/lib/instructor/diagrams/image-asset";
import type { DiagramSvgProps } from "@/lib/instructor/diagrams/types";

type Props = DiagramSvgProps & {
  title: string;
  image: DiagramImageAsset;
  Component?: React.ComponentType<DiagramSvgProps>;
};

type FullscreenMode = "closed" | "native" | "overlay";

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

export function DiagramViewer({ title, image, Component, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<FullscreenMode>("closed");
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

  async function openFullscreen() {
    const node = containerRef.current;
    if (!node) return;

    try {
      await requestNativeFullscreen(node);
      setMode("native");
    } catch {
      setMode("overlay");
    }
  }

  async function closeFullscreen() {
    await exitNativeFullscreen(containerRef.current);
    setMode("closed");
  }

  async function toggleFullscreen() {
    if (isOpen) {
      await closeFullscreen();
      return;
    }
    await openFullscreen();
  }

  return (
    <div
      ref={containerRef}
      role={mode === "overlay" ? "dialog" : undefined}
      aria-modal={mode === "overlay" ? true : undefined}
      aria-label={mode === "overlay" ? `${title} fullscreen` : undefined}
      className={`relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-slate-100 via-white to-teal-50/40 shadow-sm ${
        isOpen ? "flex h-dvh flex-col bg-[#eef2f6]" : ""
      } ${mode === "overlay" ? "fixed inset-0 z-[200] rounded-none border-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]" : ""} ${className ?? ""}`}
    >
      {isOpen ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-100 bg-white/90 px-4 py-3 sm:px-6">
          <p className="font-heading text-lg font-semibold text-brand-950">{title}</p>
          <button
            type="button"
            onClick={() => void closeFullscreen()}
            className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Exit fullscreen
          </button>
        </div>
      ) : null}

      <div className={`relative ${isOpen ? "min-h-0 flex-1 p-4 sm:p-6" : "p-4 sm:p-6"}`}>
        <DiagramMedia
          image={image}
          alt={title}
          Component={Component}
          variant="full"
          className={
            isOpen
              ? "mx-auto flex h-full min-h-0 max-h-[calc(100dvh-5.5rem)] w-full max-w-6xl items-center justify-center rounded-xl bg-white"
              : "mx-auto w-full max-w-5xl"
          }
        />
      </div>

      {!isOpen ? (
        <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
          <button
            type="button"
            onClick={() => void openFullscreen()}
            className="rounded-xl border border-brand-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur transition hover:bg-white"
          >
            Fullscreen
          </button>
        </div>
      ) : null}
    </div>
  );
}
