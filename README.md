# Machine Brain Coloring Books

Next.js storefront for Machine Brain coloring books.

## Book review QA

Private whole-book QA lives at `/review/[slug]` and is driven by a storage
manifest, not hardcoded book data. See [docs/book-review.md](docs/book-review.md).

### Server-only environment variables

Set these in Vercel (Production and Preview). Never commit values.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REVIEW_PASSWORD`
- `REVIEW_API_TOKEN`

The storefront still uses `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Review code reads `SUPABASE_URL` first and
can fall back to `NEXT_PUBLIC_SUPABASE_URL` for the project URL only.

### API read path

```
GET /api/review/[slug]/submissions
GET /api/review/[slug]/submissions?version=N
```

Authenticate with header `x-review-token: $REVIEW_API_TOKEN`. Omitting
`version` returns the latest submission plus the version list.
