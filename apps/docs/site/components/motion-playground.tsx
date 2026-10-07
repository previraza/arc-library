"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { motionTokens } from "manicat/lib/motion-tokens";
import { Button } from "manicat/registry/components/button/button";
import SegmentedControl from "manicat/registry/components/segmented-control/segmented-control";

const presets = ["responsive", "gentle", "snappy", "smooth", "morph"] as const;

type Preset = (typeof presets)[number];

const captions: Record<Preset, string> = {
  responsive: "UI that has to feel instant. Damped just past critical, so it settles without ringing.",
  gentle: "Large surfaces and page level movement, where overshoot would read as wobble.",
  snappy: "Presses, toggles and anything the finger is waiting on.",
  smooth: "Slow reveals and sheets. No bounce at all.",
  morph: "Text and shapes that change size in place, like a toast becoming its result.",
};

export function MotionPlayground() {
  const [preset, setPreset] = useState<Preset>("snappy");
  const [key, setKey] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  const transition = reduceMotion ? { duration: motionTokens.duration.instant } : motionTokens.spring[preset];

  return (
    <div className="not-prose my-6 grid gap-4 rounded-[var(--radius-surface)] border border-fd-border bg-fd-card p-5">
      <SegmentedControl value={preset} onValueChange={(value: string) => setPreset(value as Preset)} options={presets.map((name) => ({ value: name, label: name }))} />

      <div className="grid h-32 place-items-center overflow-hidden rounded-[var(--radius-panel)] bg-fd-muted/40">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.82, filter: `blur(${motionTokens.blur.soft}px)` }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: `blur(${motionTokens.blur.subtle}px)` }}
            transition={transition}
            className="size-14 rounded-[var(--radius-control)] bg-fd-primary"
          />
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={() => setKey((value) => value + 1)}>
          Replay
        </Button>
        <p className="text-sm text-fd-muted-foreground">{captions[preset]}</p>
      </div>

      {reduceMotion && <p className="text-sm text-fd-muted-foreground">Reduced motion is on, so movement becomes a short fade.</p>}
    </div>
  );
}