"use client";

import { useEffect } from "react";
import { AnimatePresence, animate, motion, useIsPresent, useMotionValue, useReducedMotion, useTransform, type HTMLMotionProps, type TargetAndTransition, type Transition } from "motion/react";
import { Check } from "lucide-react";
import { motionTokens } from "@/lib/motion-tokens";
import { cn } from "@/lib/cn";
import styles from "./progress.module.css";

export interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  /** Extend the inner, named parts of the progress: meta, label, line, value, done, count, track or fill. */
  classNames?: {
    meta?: string;
    label?: string;
    line?: string;
    value?: string;
    done?: string;
    count?: string;
    track?: string;
    fill?: string;
  };
}

const exitFast: Transition = { duration: motionTokens.duration.fast, ease: [...motionTokens.ease.standard] };
const textIn: TargetAndTransition = { opacity: 0, y: "0.3em", filter: `blur(${motionTokens.blur.soft}px)` };
const textOut: TargetAndTransition = { opacity: 0, y: "-0.3em", filter: `blur(${motionTokens.blur.subtle}px)`, transition: exitFast };
const iconIn: TargetAndTransition = { opacity: 0, scale: .6, filter: `blur(${motionTokens.blur.subtle}px)` };
const shown: TargetAndTransition = { opacity: 1, y: "0em", scale: 1, filter: "blur(0px)" };
const fadeOut: TargetAndTransition = { opacity: 0, transition: { duration: motionTokens.duration.instant } };

/** Outgoing copies are hidden from assistive tech while they fade. */
function Swap(props: HTMLMotionProps<"span">) {
  const present = useIsPresent();
  return <motion.span {...props} aria-hidden={present ? props["aria-hidden"] : true} />;
}

export function Progress({ value = 0, max = 100, label, showValue = false, className, classNames, ...props }: ProgressProps) {
  const reduce = useReducedMotion();
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const percentage = Math.round((safeValue / safeMax) * 100);
  const complete = percentage >= 100;
  // One spring drives both the fill and the counted label, so the number always matches the bar.
  const progress = useMotionValue(percentage);
  // The fill slides in from the left instead of scaling, so its rounded end keeps its shape at every value.
  const x = useTransform(progress, latest => `${Math.min(Math.max(latest, 0), 100) - 100}%`);
  const counted = useTransform(progress, latest => `${Math.round(Math.min(Math.max(latest, 0), 100))}%`);
  useEffect(() => {
    if (reduce) { progress.jump(percentage); return; }
    const controls = animate(progress, percentage, motionTokens.spring.smooth);
    return () => controls.stop();
  }, [percentage, progress, reduce]);
  const enter: Transition = reduce ? { duration: motionTokens.duration.instant } : { duration: motionTokens.duration.standard, ease: [...motionTokens.ease.enter] };
  const classes = cn(styles.progress, className);
  return <div {...props} className={classes} data-complete={complete ? "" : undefined} role="progressbar" aria-label={label ?? "Progress"} aria-valuemin={0} aria-valuemax={safeMax} aria-valuenow={safeValue} aria-valuetext={`${percentage}%`}>
    {(label || showValue) ? <div className={cn(styles.meta, classNames?.meta)}>
      {label ? <span className={cn(styles.label, classNames?.label)}><AnimatePresence mode="popLayout" initial={false}><Swap key={label} className={cn(styles.line, classNames?.line)} initial={reduce ? { opacity: 0 } : textIn} animate={shown} exit={reduce ? fadeOut : textOut} transition={enter}>{label}</Swap></AnimatePresence></span> : <span />}
      {showValue ? <span className={cn(styles.value, classNames?.value)}>
        {/* Completion lands as the fill arrives: a check settles in beside the final count. */}
        <AnimatePresence initial={false}>{complete && <motion.span key="done" className={cn(styles.done, classNames?.done)} initial={reduce ? { opacity: 0 } : iconIn} animate={shown} exit={reduce ? fadeOut : { ...iconIn, transition: exitFast }} transition={reduce ? enter : { ...motionTokens.spring.snappy, delay: .24 }}><Check size={14} strokeWidth={1.75} aria-hidden="true" /></motion.span>}</AnimatePresence>
        <motion.span className={cn(styles.count, classNames?.count)}>{counted}</motion.span>
      </span> : null}
    </div> : null}
    <div className={cn(styles.track, classNames?.track)}><motion.span className={cn(styles.fill, classNames?.fill)} style={{ x }} /></div>
  </div>;
}

export default Progress;
