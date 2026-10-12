"use client";

import { useEffect, useState } from "react";

import { CodeBlock } from "manicat/registry/components/code-block/code-block";
import { TextReveal } from "manicat/registry/components/text-reveal/text-reveal";
import { InViewTitle } from "manicat/registry/components/in-view-title/in-view-title";
import { TextMorph } from "manicat/registry/components/text-morph/text-morph";
import { TextShimmer } from "manicat/registry/components/text-shimmer/text-shimmer";
import { SlotText } from "manicat/registry/components/slot-text/slot-text";

export function CodeBlockDemo() {
  return (
    <CodeBlock
      code={`export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>You pressed {count} times.</p>
      <button onClick={() => setCount(count + 1)}>
        Press me
      </button>
    </div>
  );
}`}
      filename="counter.tsx"
      language="tsx"
    />
  );
}

export function TextRevealDemo() {
  return (
    <div className="w-full">
      <TextReveal text="Every word rises as it enters the viewport." as="h2" />
    </div>
  );
}

export function InViewTitleDemo() {
  return (
    <div className="w-full">
      <InViewTitle
        as="h2"
        text="The heading in view, line by line."
        lines={["The heading in view,", "line by line."]}
        variant="line"
      />
    </div>
  );
}

const morphWords = ["spacing", "grid", "rhythm", "order"];

export function TextMorphDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((current) => (current + 1) % morphWords.length), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <p className="w-full text-center text-sm text-fd-muted-foreground">
      Good interfaces are built on <TextMorph as="strong">{morphWords[index]}</TextMorph>.
    </p>
  );
}

export function TextShimmerDemo() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <TextShimmer>Synthesizing the registry…</TextShimmer>
      <TextShimmer active={false}>Mostly ready</TextShimmer>
    </div>
  );
}

const slotAmounts = [1_024, 12_480, 99_200, 736_000];

export function SlotTextDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((current) => (current + 1) % slotAmounts.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p className="text-2xl font-semibold tabular-nums">
        $<SlotText value={slotAmounts[index]} />
      </p>
      <p className="text-xs text-fd-muted-foreground">The last reel lands on the new digit as the length changes.</p>
    </div>
  );
}