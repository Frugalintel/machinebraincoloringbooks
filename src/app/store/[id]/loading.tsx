import { STORE_COPY } from "@/lib/store";

/** F7 loading for a book: the plate, gallery frame and buy column, as bones. */
export default function ProductLoading() {
  return (
    <main id="main" aria-busy="true">
      <section className="plate sp" aria-label="Book">
        <p className="mono text-signal" role="status" aria-live="polite">
          {STORE_COPY.loading}
        </p>
        <div className="sp-grid">
          <div className="sp-gallery">
            <span className="cover s-bone dark motion-safe:animate-pulse" />
          </div>
          <div className="sp-info flex flex-col gap-4" aria-hidden="true">
            <span className="s-bone dark block h-4 w-24" />
            <span className="s-bone dark block h-14 w-3/4" />
            <span className="s-bone dark block h-8 w-28" />
            <span className="s-bone dark block h-4 w-full" />
            <span className="s-bone dark block h-4 w-5/6" />
            <span className="s-bone dark mt-4 block h-11 w-full" />
          </div>
        </div>
      </section>
    </main>
  );
}
