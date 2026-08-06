# Employee Performance Tracking System

An IT-company employee performance tracker: manual + bulk employee entry,
an automated diminishing-returns/accelerating-penalty scoring engine, and a
searchable dashboard. Built as a React + Vite app at the repo root so it
deploys straight to **GitHub Pages**, with an optional Spring Boot + MySQL
backend included for a real-database version.

```
.
├── .github/workflows/deploy.yml   ← builds & deploys to GitHub Pages on every push to main
├── index.html                     ← Vite entry HTML (root of the deployed site)
├── vite.config.js                 ← sets the GitHub Pages "base" path
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx                   ← mounts the app
│   ├── App.jsx                    ← the full application (dashboard, table, forms, scoring)
│   └── index.css                  ← Tailwind entry stylesheet
├── public/
│   └── .nojekyll                  ← tells GitHub Pages not to run Jekyll on the build output
└── backend/                       ← Spring Boot + MySQL API (NOT deployed by GitHub Pages — see below)
```

## 1. Deploying to GitHub Pages

1. **Set the base path.** Open `vite.config.js` and change:
   ```js
   base: '/employee-performance-tracker/',
   ```
   to match your actual GitHub repository name exactly (case-sensitive),
   e.g. if your repo is `github.com/yourname/perf-tracker`, use
   `base: '/perf-tracker/'`. If this repo will be published as a
   user/organization Pages site (`yourname.github.io`), set `base: '/'` instead.

2. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo-name>.git
   git push -u origin main
   ```

3. **Enable Pages via GitHub Actions.** In your repo on GitHub, go to
   **Settings → Pages → Build and deployment → Source**, and select
   **"GitHub Actions"**.

4. That's it. The workflow at `.github/workflows/deploy.yml` runs
   automatically on every push to `main`: it installs dependencies, runs
   `npm run build` (output goes to `dist/`), and deploys `dist/` to Pages.
   Your site will be live at:
   ```
   https://<you>.github.io/<repo-name>/
   ```

## 2. Local development

```bash
npm install
npm run dev       # local dev server with hot reload
npm run build      # production build → dist/
npm run preview    # preview the production build locally
```

## 3. About data persistence

The deployed app is a fully static site — there's no server, so it stores
employee records in the browser's `localStorage`. That means data persists
across visits on the same browser/device, but isn't shared across devices
and resets if the user clears site data. This is intentional: it keeps the
app deployable as pure static files with zero backend cost.

## 4. Optional: the real backend

`backend/` contains a complete Spring Boot + MySQL implementation of the
same scoring logic, with a REST API, bulk-import via Apache POI, and a
proper relational schema — see `backend/README.md`. It is **not** part of
the GitHub Pages deployment (Pages only serves static files and can't run a
Java process or a database). If you want the real, multi-device,
database-backed version:

1. Deploy `backend/` somewhere that runs Java (Render, Railway, a VM, etc.)
   with a MySQL instance.
2. In `src/App.jsx`, replace the `localStorage` calls in the `persist`
   function and the initial-load `useEffect` with `fetch` calls to your
   deployed API (endpoints are documented in `backend/README.md`).
3. Rebuild and push — the GitHub Pages workflow picks up the change
   automatically.
