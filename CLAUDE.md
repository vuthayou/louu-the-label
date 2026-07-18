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
│   ├── App.jsx              # routes: "/" (Home), "/collection" (Catalog), "/about" (About), "/admin" (Login/Admin)
│   ├── firebase.js          # Firebase init, exports db/storage/auth
│   ├── index.css            # `@import "tailwindcss";` only
│   ├── assets/
│   │   └── home.jpeg        # hero photo
│   ├── components/
│   │   ├── Navbar.jsx       # Louu/Collection/About Us links
│   │   ├── Footer.jsx       # copyright line
│   │   ├── Hero.jsx         # homepage banner: photo + title/tagline + Product Category/About Us links
│   │   ├── ProductCard.jsx  # single product display
│   │   └── ProductGrid.jsx  # responsive grid, maps products -> ProductCard
│   └── pages/
│       ├── Home.jsx         # public "/", Navbar + Hero + Footer
│       ├── Catalog.jsx      # public "/collection", fetches products from Firestore
│       ├── About.jsx        # public "/about", placeholder content
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
Phases 0-4 done. Site is live at https://louu-the-label.web.app. Firestore + Storage rules are deployed and locked down (public read, authenticated-write-only) — verified in the Firebase console to match firestore.rules/storage.rules exactly. firebase.json/.firebaserc are set up so `firebase deploy` pushes hosting + both rule sets together. Note: react-router-dom routing (`/` and `/admin`) was deferred until Phase 3 rather than added in Phase 1, since there was nothing to route between until `/admin` existed. Post-Phase-4 hardening: Login.jsx now sets browserSessionPersistence before sign-in, so admin sessions end when the tab closes rather than persisting indefinitely — deployed live. Firebase Local Emulator Suite is now set up (firebase.json emulators block, firebase.js connects to emulators only when import.meta.env.DEV) so local dev never touches live data — requires `npm run emulators` + `npm run dev` running together, and a separate test admin user created via the Emulator UI (localhost:4000). Java (openjdk via Homebrew) was installed as a prerequisite. In progress: Phase 5 — polish. Done so far: index.html title/description, Catalog.jsx empty-state + loading conditional rendering, Admin.jsx delete confirmation (window.confirm), ProductCard image bg placeholder, "Louu" Link back to "/" on Login.jsx and Admin.jsx. Remaining: mobile nav check, optional category filter.

Admin feature additions beyond the original Phase 3 spec (built during Phase 5, ad hoc per user requests):
- **Edit**: Admin.jsx's form is dual-purpose (add vs edit) via `editingId` state; edit uses `updateDoc`, keeps existing image unless a new file is chosen, `createdAt` untouched on edit.
- **Archive/Restore**: products can be moved to a separate `archivedProducts` collection (same doc ID, via `setDoc` + `deleteDoc`) and restored the same way in reverse. Catalog.jsx needed zero changes since it only ever queries `products`. New firestore.rules block for `archivedProducts`, authenticated-only for read+write.
- **Admin notes + expand panel**: a `notes` field per product, deliberately stored in its own `productNotes` collection (keyed by product ID) rather than on the `products` doc itself, specifically so it's genuinely private (auth-only firestore.rules) rather than just hidden in the UI — `products` has public read, so anything on that document is technically fetchable by anyone regardless of what the UI renders. Each active product row has an expand arrow (▼/▲) revealing category/description/notes. Notes docs are cleaned up on product delete (active or archived); archiving/restoring leaves notes untouched since they're keyed by ID independent of which collection the product data lives in.
- All three of the above required a `firebase deploy` (not just `npm run build`) before working against live data, since they added new firestore.rules blocks.
