import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ReviewLoginForm } from "@/app/review/[slug]/login-form";
import { ReviewWorkspace } from "@/components/review/review-workspace";
import { getReviewPassword, verifyReviewCookie } from "@/lib/review/auth";
import { REVIEW_COOKIE_NAME } from "@/lib/review/constants";
import { parseReviewSlug } from "@/lib/review/paths";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ReviewSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = parseReviewSlug(rawSlug);
  if (!slug) {
    notFound();
  }
  const query = await searchParams;
  const password = getReviewPassword();
  const cookieStore = await cookies();
  const authed = Boolean(
    password &&
      verifyReviewCookie(
        cookieStore.get(REVIEW_COOKIE_NAME)?.value,
        password,
      ),
  );

  if (!authed) {
    return <ReviewLoginForm slug={slug} error={query.error === "1"} />;
  }

  return <ReviewWorkspace slug={slug} />;
}
