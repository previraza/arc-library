"use client";

import { useState } from "react";
import { PreviewSkeleton } from "@/site/library/preview-skeleton";

/** The demo of an item, shrunk and not clickable, loaded in a lazy frame. Blocks of skeleton stand in until it has painted. */
export function CardPreview({ name }: { name: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && <PreviewSkeleton />}
      <iframe
        src={`/frame/demo/${name}`}
        title={`${name} preview`}
        tabIndex={-1}
        scrolling="no"
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`pointer-events-none absolute left-0 top-0 h-[160%] w-[160%] origin-top-left scale-[0.625] border-0 transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </>
  );
}
