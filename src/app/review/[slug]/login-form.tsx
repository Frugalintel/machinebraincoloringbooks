export function ReviewLoginForm({
  slug,
  error,
}: {
  slug: string;
  error: boolean;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
        Private QA
      </p>
      <h1 className="mt-3 font-heading text-3xl uppercase tracking-tight">
        Unlock review
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Enter the review password to open{" "}
        <span className="font-mono text-foreground">{slug}</span>.
      </p>
      {error ? (
        <p className="mt-4 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          That password did not match.
        </p>
      ) : null}
      <form
        action="/api/review/login"
        method="post"
        className="mt-8 space-y-4"
      >
        <input type="hidden" name="next" value={`/review/${slug}`} />
        <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Password
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            className="mt-2 h-11 w-full rounded-md border border-[#333] bg-[#111] px-3 text-base text-foreground outline-none focus-visible:border-primary"
          />
        </label>
        <button
          type="submit"
          className="h-11 w-full rounded-md bg-primary font-heading uppercase tracking-wide text-primary-foreground"
        >
          Unlock
        </button>
      </form>
    </main>
  );
}
