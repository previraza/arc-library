/** Clipboard state for actions that render their own button or menu, for the Vue and Svelte ports: `idle`, `copied` or `error`. */
export type CopyFeedbackState = "idle" | "copied" | "error";

export function createCopyFeedback(onChange: (state: CopyFeedbackState) => void, duration = 1900) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const reset = () => {
    clearTimeout(timer);
    timer = undefined;
    onChange("idle");
  };
  return {
    async copy(value: string) {
      clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(value);
        onChange("copied");
        timer = setTimeout(reset, duration);
        return true;
      } catch {
        onChange("error");
        timer = setTimeout(reset, duration);
        return false;
      }
    },
    reset,
    destroy: () => clearTimeout(timer),
  };
}
