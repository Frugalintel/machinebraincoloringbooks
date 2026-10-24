import { STORE_COPY } from "@/lib/store";

/** F7 loading for a book: the top plate, cover and buy column, as bones. */
export default function ProductLoading() {
  return (
    <main id="main" aria-busy="true">
      <section className="plate top" aria-label="Book">
        <p className="mono text-signal" role="status" aria-live="polite">
          {STORE_COPY.loading}
        </p>
        <div className="top-bones" aria-hidden="true">
          <span className="cover s-bone dark motion-safe:animate-pulse" />
          <span className="s-bone dark block h-4 w-24" />
          <span className="s-bone dark block h-14 w-3/4" />
          <span className="s-bone dark block h-11 w-full" />
        </div>
      </section>
    </main>
  );
}
