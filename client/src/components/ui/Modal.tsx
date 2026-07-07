import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";

// A single shared modal shell — Radix handles focus trapping, Escape-to-close,
// body scroll lock, and correct dialog ARIA semantics, so none of that needs
// to be reimplemented per modal. Callers own everything inside: header,
// body, footer. Use <ModalTitle> for the heading (Radix requires one for
// accessibility, even if visually it's just a plain <h2>-styled string).
export const ModalTitle = Dialog.Title;

const MAX_WIDTH = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof MAX_WIDTH;
}

// None of the app's modals have a natural secondary description beyond their
// title, so aria-describedby is explicitly unset — otherwise Radix logs a
// dev-only console warning asking for a <Dialog.Description>.
//
// Centering uses `inset-0 m-auto` (auto margins within a fixed, fully-inset
// box) rather than the common `left-1/2 top-1/2 -translate-x-1/2
// -translate-y-1/2` trick — that trick relies on `transform`, which the open
// animation also needs for its scale effect. Tailwind composes translate/
// scale into `transform` via CSS variables, and the animation's literal
// keyframe values fought that composition, causing a visible jump from an
// off-center position to centered right after mount. Margin-based centering
// leaves `transform` free for the animation to use exclusively.
function Modal({ open, onClose, children, size = "md" }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50 animate-[modalFadeIn_150ms_ease-out]" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`fixed inset-0 m-auto z-50 h-fit w-[calc(100%-2rem)] ${MAX_WIDTH[size]} max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl animate-[modalScaleIn_150ms_ease-out] focus:outline-none`}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default Modal;
