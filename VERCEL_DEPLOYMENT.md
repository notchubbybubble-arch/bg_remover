# Vercel Deployment Guide for bettercallghaith

This guide explains how to deploy this background removal tool to Vercel.

## Prerequisites

1. A Vercel account (https://vercel.com)
2. A Replicate API token (https://replicate.com/account/api-tokens)

## Deployment Steps

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bettercallghaith.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - Framework Preset: Other
   - Build Command: `pnpm build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Description | How to Get |
|----------|-------------|------------|
| `REPLICATE_API_TOKEN` | Replicate API key for background removal | https://replicate.com/account/api-tokens |

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

## Alternative Background Removal APIs

If you prefer not to use Replicate, you can modify `/api/remove-bg.ts` to use:

### Remove.bg API
- Website: https://www.remove.bg/api
- Pricing: 50 free API calls/month, then paid
- Pros: High quality, fast

### Photoroom API
- Website: https://www.photoroom.com/api
- Pricing: Free tier available
- Pros: Good quality, easy to use

### Clipdrop API
- Website: https://clipdrop.co/apis
- Pricing: Free tier with limits
- Pros: Multiple image editing features

## Updating the API

To switch to a different background removal API:

1. Edit `/api/remove-bg.ts`
2. Replace the Replicate API call with your preferred service
3. Update the environment variables in Vercel
4. Redeploy

## Troubleshooting

### Build Errors
- Make sure all dependencies are in `package.json`
- Check that `pnpm-lock.yaml` is committed

### API Errors
- Verify environment variables are set correctly
- Check API token permissions
- Review Vercel function logs

## Local Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Support

For issues with:
- Vercel deployment: https://vercel.com/docs
- Replicate API: https://replicate.com/docs
- This project: Create an issue on GitHub
