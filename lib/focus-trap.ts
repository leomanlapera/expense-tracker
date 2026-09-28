// Restrict Tab / Shift+Tab to focusable descendants of `container`.
// Returns a cleanup function.
//
// Also autofocuses the first non-close focusable so users don't land on the
// dismiss button by default.

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function trapFocus(container: HTMLElement): () => void {
  const previouslyFocused = document.activeElement as HTMLElement | null;

  const list = () =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute("data-focus-skip") && el.offsetParent !== null,
    );

  // Prefer the first non-close control on open.
  const initial = list();
  const firstReal = initial.find((el) => el.getAttribute("aria-label") !== "Close") ?? initial[0];
  firstReal?.focus();

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== "Tab") return;
    const focusables = list();
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey && (active === first || !container.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !container.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("keydown", onKeyDown);

  return () => {
    document.removeEventListener("keydown", onKeyDown);
    previouslyFocused?.focus?.();
  };
}
