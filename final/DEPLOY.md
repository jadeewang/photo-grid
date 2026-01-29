# Deploy this app (HTML + camera)

The app must be served over **HTTPS** so the browser allows camera access. Easiest options:

## Option 1: Vercel (recommended, one command)

1. Install Vercel CLI once: `npm i -g vercel`
2. From this folder run: `vercel`
3. Log in or sign up when prompted (browser).
4. Accept defaults (link to existing project or create new).
5. You get a URL like `https://your-project.vercel.app` — share it.

To redeploy after changes: run `vercel` again, or connect a Git repo in the Vercel dashboard for automatic deploys.

## Option 2: Netlify (drag and drop)

1. Build: `npm run build`
2. Open [https://app.netlify.com/drop](https://app.netlify.com/drop)
3. Sign in (or create a free account).
4. Drag the **dist** folder onto the page.
5. Netlify gives you a URL like `https://random-name.netlify.app`.

Redeploy: run `npm run build` again and drag the new **dist** folder.

## Option 3: Build only (host anywhere)

Run:

```bash
npm run build
```

Upload the contents of the **dist** folder to any static host (GitHub Pages, Cloudflare Pages, your own server, etc.). The site must be served over HTTPS for the camera to work.
