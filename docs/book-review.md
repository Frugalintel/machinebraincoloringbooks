# Book review QA

`/review/[slug]` is a private, manifest-driven QA page for a whole coloring
book. It is not hardcoded to any title. Auth is a shared password cookie for
the page, plus an API token for machine reads.

## Adding a new book

1. Create a private Storage prefix in the `book-review` bucket:
   `books/<slug>/`.
2. Upload the cover wrap, matter templates, page color JPEGs, line-art PNGs,
   SVGs, and any `assets/` or `frame/` files the templates reference.
3. Upload `books/<slug>/manifest.json` using the same shape as the Ottoline
   sample (cover, `front_matter`, `pages`, `back_matter`). All asset paths in
   the manifest are bucket-relative.
4. Open `/review/<slug>`.

No app deploy is required when the slug and manifest already follow this
contract.

## Live templates

Templates are fetched server-side. The review app:

- injects fields by replacing
  `<script id="fields" type="application/json">...</script>`
  (`</` is escaped as `<\/`)
- rewrites relative `assets/...` and `../frame/...` URLs to signed URLs
- replaces `file://` `@font-face` rules with Google Fonts (Cormorant Garamond,
  Lora)

Images are never served from the private bucket directly. The server creates
signed URLs in batches (`createSignedUrls`, 1 hour).

## Auth

- `/review/*` shows a password form until a signed `review_session` cookie is
  set. `POST /api/review/login` compares `REVIEW_PASSWORD` in constant time
  and sets an httpOnly, Secure (production), SameSite=Lax HMAC cookie.
  Failed logins are stored as HMAC-hashed IPs in
  `public.book_review_login_attempts` (service role only). IPv6 addresses are
  normalized to their /64 prefix before hashing so rotating interface IDs
  share one key. Five failures per key in 15 minutes, or 50 failures across
  all keys in that window, return 429.
- `src/proxy.ts` blocks `/api/review/*` without that cookie, except login,
  logout, and the token submissions API.
- `GET /api/review/[slug]/submissions` authenticates with
  `x-review-token: $REVIEW_API_TOKEN`.

## Submission payload

Submit writes `public.book_review_submissions` as
`version = max(version) + 1` for the slug:

```json
{
  "order": ["p01", "insert-…"],
  "deleted": [],
  "flags": { "p01": { "flag": true, "note": "check line weight" } },
  "inserts": [
    { "after": "p04", "description": "new garden gate", "id": "insert-…" }
  ],
  "fields": { "cover": {}, "title": {} },
  "uploads": ["books/<slug>/uploads/…"],
  "submitted_at": "2026-10-12T00:00:00.000Z"
}
```

Drafts also autosave to `localStorage` under `book-review-draft:<slug>`.

## Environment variables

Server-only (no `NEXT_PUBLIC_`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVIEW_PASSWORD`
- `REVIEW_API_TOKEN`

The submissions table already exists (`unique(book_slug, version)`), with RLS
enabled and only `service_role` granted. Concurrent submits retry on
Postgres `23505` by re-reading `max(version)+1` (up to 3 tries). Review
reads and writes go through the service role on the server.

`public.book_review_login_attempts` is added by
`supabase/migrations/20261012192600_book_review_login_attempts.sql` with
REVOKE for `anon`/`authenticated`, GRANT to `service_role` only, RLS
enabled, and a `service_role` policy.
