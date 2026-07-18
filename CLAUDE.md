# Project: Clothing Catalog Website

## Stack
- React (Vite), Tailwind CSS, react-router-dom
- Firebase: Firestore (data), Storage (images), Authentication (email/password, single admin user), Hosting (deploy)
- react-easy-crop (Admin only) — interactive photo crop/zoom for the hero image upload
- No Bootstrap, no other CSS framework — Tailwind utility classes only
- No animation libraries. Keep transitions minimal (simple hover states only).

## User context
- User has a CS background, knows HTML/CSS/JS, is new to React/Firebase/web tooling.
- User wants to participate in coding, not just receive finished output. When making non-trivial changes, explain what the code does and why, in comments or a short summary — don't just silently generate files.
- Prefer clear, readable code over clever/terse code.

## Data model
Firestore collections (all added ad hoc during Phase 5, beyond the original single-collection plan):
- `products` — public read, authenticated write. `{ name: string, price: number, description: string, category: string, imageURL: string, createdAt: timestamp }`
- `archivedProducts` — authenticated read+write only. Same shape as `products`, same document ID — a product "moved" here via Admin's Archive button is invisible to the public Catalog with zero extra query logic, since Catalog only ever reads `products`.
- `productNotes` — authenticated read+write only. `{ notes: string }`, keyed by the same product ID. Kept in a separate collection (not a field on `products`) specifically so it's genuinely private — `products` has public read, so any field on that document would be technically fetchable by anyone regardless of UI.
- `siteSettings` — public read, authenticated write. Currently one document, `siteSettings/hero`: `{ imageURL: string }`, set via Admin's Homepage tab.

## File structure
All project files live under `louu-label/` (not the repo root).
```
louu-label/
├── index.html
├── vite.config.js           # includes @tailwindcss/vite plugin
├── package.json
├── firestore.rules          # products (public read), archivedProducts/productNotes/siteSettings (auth-only)
├── storage.rules            # products/ (public read), site/ (auth-only)
├── src/
│   ├── main.jsx
│   ├── App.jsx              # routes, all lazy()-loaded + Suspense for code-splitting: "/" (Home), "/collection" (Catalog), "/about" (About), "/admin" (Login/Admin)
│   ├── firebase.js          # Firebase init, exports db/storage/auth; connects to emulators when import.meta.env.DEV
│   ├── index.css            # `@import "tailwindcss";` only
│   ├── assets/
│   │   └── home.jpeg        # local fallback hero photo, used until an admin sets a real one
│   ├── components/
│   │   ├── Navbar.jsx       # Louu/Collection/About Us links
│   │   ├── Footer.jsx       # copyright line only
│   │   ├── Hero.jsx         # homepage banner: photo (imageURL prop) + title/tagline + Product Category/About Us links
│   │   ├── ProductCard.jsx  # single product display
│   │   └── ProductGrid.jsx  # responsive grid, maps products -> ProductCard
│   └── pages/
│       ├── Home.jsx         # public "/", Navbar + Hero + Footer; fetches siteSettings/hero for Hero's photo
│       ├── Catalog.jsx      # public "/collection", fetches products from Firestore
│       ├── About.jsx        # public "/about", placeholder content
│       ├── Login.jsx        # admin sign-in
│       ├── Admin.jsx        # protected shell: auth-gate, header, tab nav (SECTIONS array) switching between AdminProducts/AdminHomepage
│       ├── AdminProducts.jsx # Products tab: add/edit form, product list (expand/edit/archive/delete), Archived section
│       └── AdminHomepage.jsx # Homepage tab: hero photo upload with interactive crop (react-easy-crop)
├── firebase.json            # public: "dist", SPA rewrite enabled; also declares emulator ports
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
Phases 0-4 done and deployed live at https://louu-the-label.web.app, rules locked down and verified. Phase 5 (polish) is in progress, but scope has grown well beyond the original plan via ad hoc feature requests — see below. Firebase Local Emulator Suite is set up for local dev (`npm run emulators` + `npm run dev` together; Java via Homebrew was a prerequisite) so none of this local iteration has touched live data.

**Public site**: `Home.jsx` (`/`) is now a hero-driven homepage (photo fills the full viewport below the Navbar via flex-1, title/tagline/links overlaid), not the product catalog — that moved to its own route. `Catalog.jsx` (`/collection`) has the original product grid, unchanged. `About.jsx` (`/about`) is a placeholder. `Navbar`/`Footer` are shared across all public pages.

**Admin (`/admin`)** was restructured from one long page into a tab-based shell (`Admin.jsx`) driven by a `SECTIONS` array, with each tab as its own component — adding a future section later is just one new file + one array entry:
- **`AdminProducts.jsx`**: the original product management, plus three features added ad hoc: **Edit** (dual-purpose form via `editingId`, keeps existing image unless replaced), **Archive/Restore** (moves a product to/from a separate `archivedProducts` collection, same doc ID), and **admin notes** (`productNotes` collection, kept separate from `products` specifically for real data-layer privacy, not just UI hiding). Each product row has an expand arrow revealing category/description/notes, with Edit/Archive/Delete living inside that expanded panel (moved there after a design discussion about not putting consequential actions next to a low-stakes toggle). Archive now asks for confirmation, matching Delete.
- **`AdminHomepage.jsx`**: lets the admin replace the hero photo without touching code — uploads to Storage, writes the URL to `siteSettings/hero`. Includes an interactive crop tool (`react-easy-crop` — vetted: MIT license, 2.4M weekly downloads, actively maintained) so the admin can drag/zoom/position the photo and see exactly what will go live before uploading; the crop is baked into the actual uploaded file via a canvas step. Cropping only works on a newly-selected file (not the already-live photo) to avoid a canvas/CORS restriction on cross-origin images.
- Every new collection (`archivedProducts`, `productNotes`, `siteSettings`) needed its own `firestore.rules`/`storage.rules` block and a fresh `firebase deploy` before working against live data — easy to forget since `npm run build` alone doesn't push rules changes.

**Performance fixes**: fixed a flash-of-wrong-image bug on Home (was showing the local fallback photo, then swapping to the real Firestore-backed one once fetched — now waits with a loading state instead, same pattern as Catalog's loading state). Added route-based code-splitting (`lazy()` + `Suspense` in `App.jsx`) so each page ships as a separate JS chunk — confirmed via build output that `Admin.js` (37.72KB, including `react-easy-crop`) is no longer bundled into what homepage visitors download. Image compression (the hero photo, currently ~2.3MB unoptimized) is a known remaining gap, explicitly deferred by the user for later.

**Standing constraints for this phase**: layout/structure only, site-wide — fonts and colors are deliberately deferred to a later pass (see LEARNING_GUIDE.md and memory). Confirm understanding of a request before writing code, per user's explicit standing instruction.

**Not yet done from the original Phase 5 list**: mobile nav check (done — Navbar has no complex nav to break, ProductGrid already responsive from Phase 1, confirmed by user), optional category filter (not started, deprioritized in favor of the homepage/hero work above).
