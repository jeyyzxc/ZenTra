This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Payment proof storage

The Payment & History module stores receipt files in a private Supabase Storage bucket. Before accepting payment changes:

1. Run `supabase/storage-buckets.sql` in the Supabase SQL editor.
2. Set `SUPABASE_URL` and preferably `SUPABASE_SECRET_KEY` in the server environment.
3. Optionally set `SUPABASE_PAYMENT_PROOFS_BUCKET`; it defaults to `payment-proofs`.

The service-role key must remain server-only and must never use the `NEXT_PUBLIC_` prefix.

## Documentation

Implementation plans, architecture notes, and n8n workflow documentation live in `docs/`.
Command Center production prerequisites and rollout gates are documented in
[`docs/zentra-command-center-deployment.md`](docs/zentra-command-center-deployment.md).
The canonical Vercel + Supabase + Render runbook is
[`docs/deployment/vercel-supabase-render.md`](docs/deployment/vercel-supabase-render.md).

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
