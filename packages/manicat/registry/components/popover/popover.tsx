"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import styles from "./popover.module.css";

export const Popover = PopoverPrimitive.Root;
export const PopoverClose = PopoverPrimitive.Close;

/** The trigger anchors the panel, so it opts out of press-scale: a scaled rect measured on open would shift the panel as the trigger springs back. */
export const PopoverTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> & { classNames?: { anchor?: string } }
>(function PopoverTrigger({ className, classNames, ...props }, ref) {
  return <PopoverPrimitive.Trigger {...props} ref={ref} className={cn(styles.anchor, className, classNames?.anchor)}/>;
});

PopoverTrigger.displayName = "PopoverTrigger";

export const PopoverContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { classNames?: { content?: string } }
>(function PopoverContent({ className, classNames, align = "start", sideOffset = 6, collisionPadding = 10, ...props }, ref) {
  return <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      {...props}
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      className={cn(styles.content, className, classNames?.content)}
    />
  </PopoverPrimitive.Portal>;
});

PopoverContent.displayName = "PopoverContent";
