# Vercel deployment

The Next.js app lives in **`passready/`**, not the repository root.

## Required project setting

In [Vercel](https://vercel.com) → your project → **Settings** → **General** → **Root Directory**:

1. Click **Edit**
2. Set Root Directory to: `passready`
3. Save and **Redeploy** (Deployments → … → Redeploy)

Without this, builds run at the repo root (no `app/`, no `next.config.mjs`) and every URL returns **404 NOT_FOUND**.

## Build settings (after Root Directory is `passready`)

| Setting | Value |
|--------|--------|
| Framework Preset | Next.js |
| Build Command | `npm run build` (default) |
| Output Directory | *(leave default — do not set `.next` manually)* |
| Install Command | `npm install` (default) |

## Environment variables

Set in Vercel → **Settings** → **Environment Variables** (same names as `.env.local` in `passready/`).
