# Project: Clothing Catalog Website

## Stack
- React (Vite), Tailwind CSS, react-router-dom
- Firebase: Firestore (data), Storage (images), Authentication (email/password, single admin user), Hosting (deploy)
- react-easy-crop (Admin only) — interactive photo crop/zoom for the hero image upload
- No Bootstrap, no other CSS framework — Tailwind utility classes only
- No JS animation libraries (Framer Motion, etc.) — CSS transitions only. Interactive elements (buttons, links, inputs) use `transition-all duration-300 ease-in-out` on hover/focus/active states for a smooth, professional feel (relaxed from the earlier "minimal transitions" rule).
- shadcn/ui explicitly declined — stays plain hand-written Tailwind elements, not a component library, to keep bundle size down (performance is a standing priority).
- Design-system rules now in force site-wide: every padding/margin/gap value must be a multiple of 8px (8pt grid); every interactive element (button/link/input/slider) needs a visible focus state, not just hover; main page-level containers use `max-w-7xl mx-auto px-4 md:px-6 lg:px-8` — except `Navbar.jsx` and `Catalog.jsx`, both explicitly reverted to full-width after the user saw the capped version live and didn't like the dead space (lean toward full-width as the default for new sections, not the 1280px cap).
- Standing priorities, all equal weight: security, performance, and responsive design. Default to the more secure/performant/responsive option and flag tradeoffs proactively rather than waiting to be asked.

## User context
- User has a CS background, knows HTML/CSS/JS, is new to React/Firebase/web tooling.
- User wants to participate in coding, not just receive finished output. When making non-trivial changes, explain what the code does and why, in comments or a short summary — don't just silently generate files.
- Prefer clear, readable code over clever/terse code.

## Data model
Firestore collections (all added ad hoc during Phase 5, beyond the original single-collection plan):
- `products` — public read, authenticated write. `{ name: string, price: number, description: string, category: string, imageURL: string, createdAt: timestamp }`
- `archivedProducts` — authenticated read+write only. Same shape as `products`, same document ID — a product "moved" here via Admin's Archive button is invisible to the public Catalog with zero extra query logic, since Catalog only ever reads `products`.
- `productNotes` — authenticated read+write only. `{ notes: string }`, keyed by the same product ID. Kept in a separate collection (not a field on `products`) specifically so it's genuinely private — `products` has public read, so any field on that document would be technically fetchable by anyone regardless of UI.
- `siteSettings` — public read, authenticated write. Two documents: `hero` (`{ imageURL: string }`, set via Admin's Homepage tab, powers `Hero.jsx`) and `collectionHero` (same shape, set via Admin's Collection tab) — the latter is currently unused by the frontend since `Catalog.jsx` was reset to a placeholder, but the doc/upload path/rules all still exist.

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
│   │   ├── Navbar.jsx       # Louu/Collection/About Us links, full-width (no max-w-7xl, by request)
│   │   ├── Footer.jsx       # copyright line only, max-w-7xl mx-auto
│   │   ├── Hero.jsx         # homepage first viewport: photo (imageURL prop) + title/tagline + links + bg-black/30 contrast scrim
│   │   ├── AboutPreview.jsx # homepage second viewport: About Us teaser + "Learn More" link
│   │   ├── ProductsPreview.jsx # homepage third viewport: product teaser + "Shop Now" link
│   │   ├── HeroImageManager.jsx # reusable admin crop/upload flow (react-easy-crop) — powers both AdminHomepage and AdminCollectionHero
│   │   ├── ProductCard.jsx  # single product display (unused right now, kept for later)
│   │   └── ProductGrid.jsx  # responsive grid, maps products -> ProductCard (unused right now, kept for later)
│   └── pages/
│       ├── Home.jsx         # public "/", Navbar + Hero + AboutPreview + ProductsPreview + Footer
│       ├── Catalog.jsx      # public "/collection" — currently a blank "Coming soon" placeholder (see Current status)
│       ├── About.jsx        # public "/about", placeholder content
│       ├── Login.jsx        # admin sign-in
│       ├── Admin.jsx        # protected shell: auth-gate, header, tab nav (SECTIONS array): AdminProducts/AdminHomepage/AdminCollectionHero
│       ├── AdminProducts.jsx # Products tab: add/edit form, product list (expand/edit/archive/delete), Archived section
│       ├── AdminHomepage.jsx # Homepage tab: thin wrapper around HeroImageManager (settingId="hero")
│       └── AdminCollectionHero.jsx # Collection tab: thin wrapper around HeroImageManager (settingId="collectionHero") — unused by the frontend right now
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

**Public site**: `Home.jsx` (`/`) is a three-viewport hero-driven homepage — `Hero` (photo + title/tagline/links), `AboutPreview`, `ProductsPreview` (teasers linking to `/about` and `/collection`) — not the product catalog itself. `About.jsx` (`/about`) is a placeholder. `Navbar`/`Footer` are shared across all public pages.

**`Catalog.jsx` (`/collection`) is currently a blank "Coming soon" placeholder**, same minimal structure as `About.jsx`. This followed a significant detour: built a photo hero + "PRODUCTS" title viewport, a `CategoryShowcase` accordion (Tops/Trousers/Skirts drop-downs), then a full editorial numbered-tile grid (`NumberedProductGrid.jsx`, modeled on a reference image) with variable-width tiles, category labels, filter tabs — extensively iterated on (spacing, alignment, colors, row layouts), then the user decided none of it fit their concept and asked for a complete reset. `NumberedProductGrid.jsx` and `CategoryShowcase.jsx` are deleted; the original `ProductGrid.jsx`/`ProductCard.jsx` (Phase 1 vintage) were never touched and are still available to wire back up whenever real Collection page work resumes. The Admin "Collection" tab (hero photo upload for this page) and its backend (`siteSettings/collectionHero`) are still live but currently unused by the frontend.

**Admin (`/admin`)** was restructured from one long page into a tab-based shell (`Admin.jsx`) driven by a `SECTIONS` array, with each tab as its own component — adding a future section later is just one new file + one array entry:
- **`AdminProducts.jsx`**: the original product management, plus three features added ad hoc: **Edit** (dual-purpose form via `editingId`, keeps existing image unless replaced), **Archive/Restore** (moves a product to/from a separate `archivedProducts` collection, same doc ID), and **admin notes** (`productNotes` collection, kept separate from `products` specifically for real data-layer privacy, not just UI hiding). Each product row has an expand arrow revealing category/description/notes, with Edit/Archive/Delete living inside that expanded panel. Archive asks for confirmation, matching Delete.
- **`AdminHomepage.jsx`** and **`AdminCollectionHero.jsx`**: both thin wrappers around **`HeroImageManager.jsx`** (extracted as a reusable component once the second one was needed) — uploads to Storage, writes the URL to the relevant `siteSettings` doc, with an interactive crop tool (`react-easy-crop` — vetted: MIT license, 2.4M weekly downloads, actively maintained). Cropping only works on a newly-selected file (not the already-live photo) to avoid a canvas/CORS restriction on cross-origin images.
- Every new collection (`archivedProducts`, `productNotes`, `siteSettings`) needed its own `firestore.rules`/`storage.rules` block and a fresh `firebase deploy` before working against live data — easy to forget since `npm run build` alone doesn't push rules changes.

**Performance fixes**: fixed a flash-of-wrong-image bug on Home (waits with a loading state instead of showing the local fallback then swapping). Route-based code-splitting (`lazy()` + `Suspense` in `App.jsx`) so each page ships as a separate JS chunk. Image compression (the hero photo, currently ~2.3MB unoptimized) is a known remaining gap, explicitly deferred by the user for later.

**Standing constraints for this phase**: layout/structure only, site-wide — fonts and colors are deliberately deferred to a later pass. Security, performance, and responsive design are standing top priorities (default to the safer/faster/more-adaptive option, flag tradeoffs proactively). Confirm understanding of a request before writing any code, including small iterative tweaks — this was restated after it lapsed during a fast back-and-forth streak of UI changes.

**Not yet done from the original Phase 5 list**: mobile nav check (done — Navbar has no complex nav to break, ProductGrid already responsive from Phase 1, confirmed by user), optional category filter (not started, deprioritized in favor of the homepage/hero work above).
