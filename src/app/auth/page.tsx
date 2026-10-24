import "../home.css";
import { AuthPageClient } from "@/app/auth/auth-page-client";
import { HomeFooter } from "@/components/home-footer";
import { authEntryFromParams } from "@/lib/auth-ui";
import { homeShowsSamples } from "@/lib/home";

type SearchParams = Record<string, string | string[] | undefined>;

function toParams(record: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) params.set(key, first);
  }
  return params;
}

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = toParams(await searchParams);
  const entry = authEntryFromParams(params);
  const samples = homeShowsSamples(process.env.VERCEL_ENV);

  return (
    <div
      className="home-e2 sa-page"
      data-samples={samples ? "on" : "off"}
      data-testid="auth-page"
    >
      <main>
        {/* A new query (e.g. the footer's Register link) starts a fresh form. */}
        <AuthPageClient key={params.toString()} entry={entry} />
      </main>
      <HomeFooter samples={samples} />
    </div>
  );
}
