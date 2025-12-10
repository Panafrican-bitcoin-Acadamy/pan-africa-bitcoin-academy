## Deploying the Bitcoin Learning Site to Vercel

This project lives in `/Users/samir/Sites/john/pan-africa-bitcoin-academy` and is a standard **Next.js + TypeScript + Tailwind** app, perfect for Vercel.

---

### 1. Prepare the project

From your terminal:

```bash
cd /Users/samir/Sites/john/pan-africa-bitcoin-academy
npm install        # if not already done
npm run lint       # optional but recommended
npm run dev        # optional, to verify locally at http://localhost:3000
```

If everything looks good in the browser, stop the dev server with `Ctrl + C`.

---

### 2. Initialize a Git repo (if you haven't already)

Inside `pan-africa-bitcoin-academy`:

```bash
cd /Users/samir/Sites/john/pan-africa-bitcoin-academy
git init
git add .
git commit -m "Initial Bitcoin learning site"
```

Create a new **empty** GitHub repo in your browser (no README/License/Node .gitignore pre-added), then:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values.

---

### 3. Connect the repo to Vercel

1. Go to `https://vercel.com` and log in (GitHub sign-in is easiest).
2. Click **"Add New" → "Project"**.
3. Under **Import Git Repository**, pick the repo you just pushed.
4. Vercel will auto-detect:
   - **Framework**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click **Deploy**.

The first deployment will take a minute; when done, Vercel gives you:

- A preview URL like `https://your-project-name.vercel.app`
- A production URL, usually the same, after you click **Promote to Production** (or on first deploy).

---

### 4. Configure your custom domain (optional)

1. In the Vercel dashboard, open your project.
2. Go to the **Settings → Domains** tab.
3. Click **Add** and enter your domain, e.g. `learnbitcoin.yourdomain.com` or `yourdomain.com`.
4. Follow the DNS instructions Vercel shows (usually:
   - Add a CNAME record pointing to `cname.vercel-dns.com`, or
   - Add A/AAAA records if using apex).
5. Wait for DNS to propagate; Vercel will show when the domain is active and secured with HTTPS.

---

### 5. Future updates

After the initial setup, you **don’t** deploy from your machine manually; you just push to Git:

```bash
cd /Users/samir/Sites/john/pan-africa-bitcoin-academy
git add .
git commit -m "Update content or features"
git push
```

Every push to the main branch (or whichever branch you configure) will trigger a new Vercel deployment automatically.

---

### 6. Optional: Deploy using Vercel CLI (without GitHub)

If you want a quick one-off deploy directly from your laptop:

```bash
npm install -g vercel
cd /Users/samir/Sites/john/pan-africa-bitcoin-academy
vercel          # first time – follow prompts, link project
vercel --prod   # deploy a production version
```

This is handy for prototypes, but using **GitHub + Vercel** is better long-term for history and collaboration.


