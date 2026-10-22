export const dynamic = "force-dynamic";

export default function ReviewIndexPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary">
        Private QA
      </p>
      <h1 className="mt-3 font-heading text-3xl uppercase tracking-tight">
        Book review
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Open a book by slug, for example{" "}
        <code className="rounded bg-surface-1 px-1.5 py-0.5 text-xs">
          /review/ottoline-garden
        </code>
        . Each book is loaded from its storage manifest.
      </p>
    </main>
  );
}
