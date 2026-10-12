"use client";

import { ImageCompare } from "manicat/registry/components/image-compare/image-compare";
import { Carousel } from "manicat/registry/components/carousel/carousel";
import { CardStack } from "manicat/registry/components/card-stack/card-stack";
import { FileDropzone } from "manicat/registry/components/file-dropzone/file-dropzone";
import { SignaturePad } from "manicat/registry/components/signature-pad/signature-pad";

import type { FileDropzoneItem } from "manicat/registry/components/file-dropzone/file-dropzone";

export function ImageCompareDemo() {
  return (
    <ImageCompare
      aspectRatio="16/10"
      labels={["Original", "Retouched"]}
      before={
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1e3a5f,#3b5b8c)]">
          <span className="text-sm font-medium text-white/80">Original</span>
        </div>
      }
      after={
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#0ea5e9,#22c55e)]">
          <span className="text-sm font-medium text-white/80">Retouched</span>
        </div>
      }
    />
  );
}

const slides = [
  { title: "Harbour suites", tone: "from-sky-400 to-blue-600" },
  { title: "Old town lofts", tone: "from-rose-400 to-red-600" },
  { title: "Wine cellar stay", tone: "from-amber-400 to-orange-600" },
  { title: "Hilltop villa", tone: "from-emerald-400 to-green-600" },
  { title: "Lakeside cabin", tone: "from-indigo-400 to-violet-600" },
];

export function CarouselDemo() {
  return (
    <Carousel label="From the Harbour suites" slideSize="72cqw">
      {slides.map((slide) => (
        <div
          key={slide.title}
          className={`flex aspect-[4/3] items-center justify-center rounded-[var(--radius-panel)] bg-gradient-to-br ${slide.tone}`}
        >
          <p className="font-medium text-white">{slide.title}</p>
        </div>
      ))}
    </Carousel>
  );
}

type Destination = { name: string; tag: string; emoji: string };

const destinations: Destination[] = [
  { name: "Lisbon", tag: "Seven hills, ocean light", emoji: "🌊" },
  { name: "Kyoto", tag: "Temples and quiet lanes", emoji: "⛩️" },
  { name: "Reykjavik", tag: "Lava fields, hot springs", emoji: "🌋" },
  { name: "Auckland", tag: "Harbour and rainforest", emoji: "⛵" },
];

export function CardStackDemo() {
  return (
    <CardStack
      items={destinations}
      getKey={(item) => item.name}
      getLabel={(item) => item.name}
      labels={{ left: "Skip", right: "Shortlist" }}
      outcomes={{ left: "skipped", right: "shortlisted" }}
      label="Trip ideas"
      renderCard={(item) => (
        <div className="flex aspect-[5/3] flex-col justify-between p-6">
          <span className="text-4xl">{item.emoji}</span>
          <div>
            <p className="text-lg font-semibold">{item.name}</p>
            <p className="text-sm text-fd-muted-foreground">{item.tag}</p>
          </div>
        </div>
      )}
      renderEmpty={(reset) => (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-fd-muted-foreground">Every idea was decided.</p>
          <button type="button" className="text-sm font-medium text-fd-primary" onClick={reset}>
            Start over
          </button>
        </div>
      )}
    />
  );
}

const preloadedFiles: FileDropzoneItem[] = [
  { id: "f1", name: "logo.svg", size: 12_853, status: "uploaded" },
  { id: "f2", name: "hero.png", size: 402_134, status: "failed", error: "Too large", retryable: true },
];

export function FileDropzoneDemo() {
  return (
    <FileDropzone
      label="Add files"
      description="The cover art and its variants live here."
      maxSize={5 * 1024 * 1024}
      defaultItems={preloadedFiles}
      listPlacement="below"
      note="SVG, PNG or JPG, up to 5 MB."
    />
  );
}

export function SignaturePadDemo() {
  return <SignaturePad signer="Ada Lovelace" hint="Sign above the line" />;
}