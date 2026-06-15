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

export function DiagramViewer({ title, image, Component, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const syncFullscreen = useCallback(() => {
    setFullscreen(document.fullscreenElement === containerRef.current);
  }, []);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [syncFullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [fullscreen]);

  async function toggleFullscreen() {
    const node = containerRef.current;
    if (!node) return;
    if (document.fullscreenElement === node) {
      await document.exitFullscreen();
      return;
    }
    await node.requestFullscreen();
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-slate-100 via-white to-teal-50/40 shadow-sm ${
        fullscreen ? "flex h-dvh flex-col bg-[#eef2f6]" : ""
      } ${className ?? ""}`}
    >
      {fullscreen ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-brand-100 bg-white/90 px-4 py-3 sm:px-6">
          <p className="font-heading text-lg font-semibold text-brand-950">{title}</p>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
          >
            Exit fullscreen
          </button>
        </div>
      ) : null}

      <div className={`relative ${fullscreen ? "min-h-0 flex-1 p-4 sm:p-6" : "p-4 sm:p-6"}`}>
        <DiagramMedia
          image={image}
          alt={title}
          Component={Component}
          variant="full"
          className={
            fullscreen
              ? "mx-auto flex h-full min-h-0 max-h-[calc(100dvh-5.5rem)] w-full max-w-6xl items-center justify-center rounded-xl bg-white"
              : "mx-auto w-full max-w-5xl"
          }
        />
      </div>

      {!fullscreen ? (
        <div className="absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="rounded-xl border border-brand-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur transition hover:bg-white"
          >
            Fullscreen
          </button>
        </div>
      ) : null}
    </div>
  );
}
