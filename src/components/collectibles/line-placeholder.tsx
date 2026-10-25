/**
 * Single-ink stand-in for a collectible that has no still.
 * A future `art` path replaces this without moving the slot.
 */
export function LinePlaceholder({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 220"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M58 78c0-22 18-36 42-36s42 14 42 36c0 16-8 28-18 36-6 5-10 12-10 20H86c0-8-4-15-10-20-10-8-18-20-18-36Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M64 78h72" stroke="currentColor" strokeWidth="1.5" />
      <path d="M94 134h12v28" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M70 168h60M84 168l6 28h20l6-28"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M74 196h52" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
