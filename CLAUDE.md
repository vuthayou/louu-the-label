# Project: Clothing Catalog Website

## Stack
- React (Vite), Tailwind CSS, react-router-dom
- Firebase: Firestore (data), Storage (images), Authentication (email/password, single admin user), Hosting (deploy)
- No Bootstrap, no other CSS framework — Tailwind utility classes only
- No animation libraries. Keep transitions minimal (simple hover states only).

## User context
- User has a CS background, knows HTML/CSS/JS, is new to React/Firebase/web tooling.
- User wants to participate in coding, not just receive finished output. When making non-trivial changes, explain what the code does and why, in comments or a short summary — don't just silently generate files.
- Prefer clear, readable code over clever/terse code.

## Data model
Firestore collection `products`, each document:
```
{ name: string, price: number, description: string, category: string, imageURL: string, createdAt: timestamp }
```

## File structure
All project files live under `louu-label/` (not the repo root).
```
louu-label/
├── index.html
├── vite.config.js           # includes @tailwindcss/vite plugin
├── package.json
├── src/
│   ├── main.jsx
│   ├── App.jsx              # routes: "/" (Catalog), "/admin" (Login/Admin)
│   ├── firebase.js          # Firebase init, exports db/storage/auth
│   ├── index.css            # `@import "tailwindcss";` only
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ProductCard.jsx  # single product display
│   │   └── ProductGrid.jsx  # responsive grid, maps products -> ProductCard
│   └── pages/
│       ├── Catalog.jsx      # public, fetches products from Firestore
│       ├── Login.jsx        # admin sign-in
│       └── Admin.jsx        # protected: upload form + product list w/ delete
├── firebase.json            # public: "dist", SPA rewrite enabled
└── .firebaserc
```

## Development phases

**Phase 0 — Setup**
- Scaffold via `npm create vite@latest 
. -- --template react`
- Install: firebase, react-router-dom
- Install Tailwind CSS v4 via `@tailwindcss/vite` plugin (added to vite.config.js); `src/index.css` is just `@import "tailwindcss";` — no tailwind.config.js/postcss.config.js needed (v4 auto-detects content, no separate config)
- Firebase project/console setup is done manually by user (not agent-actionable)

**Phase 1 — Static UI, dummy data**
- Build Navbar, ProductCard, ProductGrid, Catalog page using a local `src/data/dummyProducts.js` array (placeholder images OK, e.g. picsum.photos)
- Goal: responsive layout finished and looking right before backend is touched
- Delete dummyProducts.js once Phase 2 is done

**Phase 2 — Connect Firestore**
- Create `src/firebase.js` with config (ask user for their Firebase console config values — do not invent them)
- Rewrite Catalog.jsx to fetch from Firestore via useEffect + useState, with a loading state
- ProductGrid/ProductCard should not need changes — they just take a `products` prop

**Phase 3 — Auth + Admin upload**
- Login.jsx: email/password form using signInWithEmailAndPassword, redirect to /admin on success
- Admin.jsx: auth-gated (onAuthStateChanged), upload form (image + name/price/description/category) that uploads to Storage, writes doc to Firestore, and lists existing products with delete buttons

**Phase 4 — Security rules + deploy**
- Firestore + Storage rules: public read, authenticated-only write (user applies these in Firebase console, but agent can draft the rules text)
- Confirm firebase.json has correct public dir + SPA rewrite
- `npm run build` then `firebase deploy` (user runs deploy, has own Firebase CLI login)
- Custom domain connection is manual, done by user in Firebase console

**Phase 5 — Polish**
- Mobile nav check, image loading/empty states, favicon/meta tags
- Optional: client-side category filter over already-fetched products (no new backend logic)

## Current status
Phases 0-4 done. Site is live at https://louu-the-label.web.app. Firestore + Storage rules are deployed and locked down (public read, authenticated-write-only) — verified in the Firebase console to match firestore.rules/storage.rules exactly. firebase.json/.firebaserc are set up so `firebase deploy` pushes hosting + both rule sets together. Note: react-router-dom routing (`/` and `/admin`) was deferred until Phase 3 rather than added in Phase 1, since there was nothing to route between until `/admin` existed. Post-Phase-4 hardening: Login.jsx now sets browserSessionPersistence before sign-in, so admin sessions end when the tab closes rather than persisting indefinitely — deployed live. Next: Phase 5 — polish (mobile nav check, image loading/empty states, favicon/meta tags, optional category filter).
