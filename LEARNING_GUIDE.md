# Learning Guide: Building a Website with Claude Code

This is a personal reference document, written for you (not for Claude to follow as instructions the way CLAUDE.md is). It captures two things:

1. **How to work with Claude Code** — including things you learned by asking, like "is it only for coding?"
2. **Every concept and technology used in this project**, explained from scratch, plus a narrative of what we actually did and why.

**How to use this later:** when you start your personal website project in a new folder, copy this file into that folder (or just open it and paste relevant sections into the chat) and tell Claude Code something like: *"Read LEARNING_GUIDE.md — I want you to teach me the same way, explaining concepts before I write code, and checking my work as I go."* That gives a fresh session the context this one has built up.

**Important caveat on memory:** Claude Code's memory system is scoped to the specific project folder it's working in. This guide is the portable part — the actual "memory" of everything we discussed in *this* project won't automatically follow you into a new folder. This file is the bridge.

---

## Part 1 — How to Work With Claude Code

- **It's not just for writing code.** You can have open-ended conversations, ask "why" questions, ask for concept explanations, debate tradeoffs — exactly like a normal chat — and *also* have it read/write/run your actual files. The advantage over a plain chat tool is that it can see your real files, run your build, and catch actual errors instead of just discussing code in the abstract.
- **Two ways to collaborate on any given piece of work**, and it's worth stating which one you want each time:
  1. **You write the code, Claude directs** — Claude explains what a file should do and the concepts involved, you write the actual code, Claude reviews it.
  2. **Claude writes the code, explaining as it goes** — faster, but still narrated so you understand what happened and why.
  You went back and forth between these during this project — that's completely fine, just say which mode you want for a given chunk of work.
- **Ask it to verify, not just claim.** Claude can run `npm run build`, start dev servers, check things actually work — ask for that instead of taking "should work" on faith.
- **Be skeptical partner, not just executor.** When you asked about installing a random third-party "skill" plugin, Claude checked the repo's trustworthiness (inflated star count for its age, code-execution risk) before doing anything — that kind of pushback is something to expect and lean on, not a hindrance.

---

## Part 2 — The Tech Stack, Concept by Concept

### Vite
The build tool / dev server. When you run `npm run dev`, Vite starts a local server (`localhost:5173`) that serves your app with instant hot-reloading as you edit files. When you run `npm run build`, it compiles everything into a `dist/` folder of plain HTML/CSS/JS that any web host can serve. Vite itself doesn't know anything about React — it's just the plumbing.

### React
The UI library. Instead of writing raw HTML, you write JavaScript functions that *return* what the UI should look like, using a syntax called **JSX** (HTML-looking tags inside JS). Key concepts:

- **Components** — a function that returns UI. `ProductCard.jsx` is a component; it's just a JS function.
- **Props** — how a parent passes data into a child component. `<ProductCard product={someProduct} />` passes `someProduct` in as the `product` prop.
- **State** (`useState`) — data a component tracks that can change over time and triggers a re-render when it does. E.g. in `Login.jsx`:
  ```js
  const [email, setEmail] = useState('')
  ```
  `email` is the current value, `setEmail` is the function you call to change it (and trigger a re-render).
- **Effects** (`useEffect`) — code that runs in response to a component appearing on screen (or specific values changing), for things outside React's normal render flow — most commonly, fetching data. `Catalog.jsx` uses this to fetch products from Firestore once, when the page first loads:
  ```js
  useEffect(() => {
    fetchProducts()
  }, []) // empty array = run once, on mount
  ```
- **Conditional rendering with ternaries** — JSX's `{ }` only accepts *expressions*, not statements, so you can't write a plain `if`/`else` inside them. JS's ternary operator (`condition ? valueIfTrue : valueIfFalse`) is the workaround — it's an if/else that evaluates to a value. `Catalog.jsx` chains two of them to pick between three mutually-exclusive states:
  ```jsx
  {loading ? (
    <p>Loading products...</p>
  ) : products.length === 0 ? (
    <p>No products yet.</p>
  ) : (
    <ProductGrid products={products} />
  )}
  ```
  Read it as nested if/else: `loading ? (...)` is the "if"; everything after the *first* `:` is the "else," which happens to itself be another ternary (`products.length === 0 ? ... : ...`). There's no explicit `&&` ("AND") anywhere, but the nesting encodes "not loading AND products.length === 0" implicitly — the second check only ever gets reached once the first has already failed. You could write the same logic flatter with explicit `&&`:
  ```jsx
  {!loading && products.length === 0 && <p>No products yet.</p>}
  {!loading && products.length > 0 && <ProductGrid products={products} />}
  ```
  but that's two separate expressions instead of one, and reads less cleanly for "exactly one of these three things renders." Both are valid — the ternary chain is just the more common pattern for this shape of problem.

### Tailwind CSS
A utility-class styling approach — instead of writing custom CSS classes in a separate `.css` file, you compose small pre-made classes directly on elements: `className="text-xl font-bold text-gray-900"`. We used **Tailwind v4**, which is simpler to set up than older versions — no `tailwind.config.js` or `postcss.config.js` needed, just a Vite plugin (`@tailwindcss/vite`) and one line in your CSS file: `@import "tailwindcss";`.

### react-router-dom
Lets a single-page React app show different "pages" based on the URL, without a real page reload. Three pieces:
- `<BrowserRouter>` — wraps the whole app, watches the URL (set up in `main.jsx`)
- `<Routes>` / `<Route>` — maps a URL path to a component (set up in `App.jsx`): `path="/"` → `Home`, `path="/collection"` → `Catalog`, `path="/about"` → `About`, `path="/admin"` → `Admin`
- `<Link>` — the router's version of `<a>`. Renders as a real link in the DOM, but navigation happens client-side instead of triggering a full page reload. Used for every internal link in this app (Navbar, Footer, Hero's "Product Category"/"About Us").

### Firebase (four separate services under one umbrella)
- **Firestore** — the database. Stores data as *documents* inside *collections*. Now four collections: `products` (public), `archivedProducts` (private, archived items), `productNotes` (private, admin notes), `siteSettings` (public read — currently just the hero photo's URL).
- **Storage** — file storage, for uploaded product images (`products/`) and the hero photo (`site/`).
- **Authentication** — handles login. We use email/password, with exactly one admin account (no public sign-up).
- **Hosting** — where the built site is actually served from publicly, plus deployment tooling (`firebase deploy`).

### Security Rules (Firestore & Storage)
Firestore and Storage are reachable directly from the internet — there's no traditional backend server checking permissions. **Rules** are the only gatekeeper. Ours say: anyone can *read* (needed for the public catalog), but only a signed-in user can *write*:
```
allow read: if true;
allow write: if request.auth != null;
```
Rules live in `firestore.rules` / `storage.rules`, get compiled and deployed by `firebase deploy`, and can be double-checked live in the Firebase console under each service's "Rules" tab.

**Firestore has a "test mode" option** when you first create it — open read/write, no auth required, expires after ~30 days. Useful for early development before real rules exist, but must be replaced before going live (which we did in Phase 4).

### Data-layer privacy vs. UI-only hiding
A pattern worth internalizing: **not rendering something in the UI is not the same as it being private.** `products` has `allow read: if true` — that grants access to the *entire document*, every field, to anyone with the Firestore SDK, regardless of what `ProductCard.jsx` actually chooses to display. If you added a `notes` field to that same document intending it to be admin-only, a customer could still read it directly (open browser dev tools, call the SDK) even though your React code never renders it anywhere.

The fix, used for both the admin notes and the archived-products features: put anything that needs *real* privacy in its **own collection**, with its own `firestore.rules` block restricting access at the data layer (`allow read, write: if request.auth != null`). Then it doesn't matter what the UI does or doesn't render — unauthenticated requests are rejected by Firestore itself before your app code ever runs.

### Lookup maps (an object as a dictionary)
When you have two related pieces of data in separate collections (products, and their notes) but want to look one up by the other's ID quickly, a common pattern is building a plain JS object keyed by ID — effectively using it as a dictionary/hash map:
```js
const map = {}
snapshot.docs.forEach((d) => {
  map[d.id] = d.data().notes
})
// later: notesMap[product.id] — instant lookup, no searching/looping needed
```
This avoids looping through the notes array every time you need one product's notes — you fetch once, build the map once, then any lookup is instant (`notesMap[someId]`).

### Local Emulator Suite (dev/prod data separation)
Once the site was live, a new problem appeared: `localhost` and the live site both pointed at the *same* real Firestore/Storage/Auth. Every test upload or delete during local development was actually happening to real, live customer-facing data — there was no separation between "testing" and "real."

The **Firebase Local Emulator Suite** solves this: it runs local, throwaway copies of Firestore/Storage/Auth entirely on your machine, with zero connection to the real cloud project. This is the standard professional pattern — in a real team, every engineer runs the app against local emulators while coding, so nothing they do locally can ever touch production data.

How it's wired up:
- `firebase.json` has an `"emulators"` block declaring which services to emulate and on what ports.
- `src/firebase.js` uses Vite's built-in `import.meta.env.DEV` flag — `true` only when running `npm run dev`, `false` in a production build — to connect to the emulators *only* during local development:
  ```js
  if (import.meta.env.DEV) {
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectStorageEmulator(storage, '127.0.0.1', 9199)
    connectAuthEmulator(auth, 'http://127.0.0.1:9099')
  }
  ```
- Day-to-day usage needs **two terminals running at once**: `npm run emulators` (starts the local Firestore/Storage/Auth + a dashboard at `localhost:4000`) and `npm run dev` (the usual dev server, now automatically talking to those emulators instead of real Firebase).
- The emulator's Auth/Firestore/Storage data starts **completely empty and separate** from real Firebase — your real admin login doesn't exist there. A test admin account has to be created once via the Emulator UI (`localhost:4000` → Authentication → Add user).
- `--export-on-exit`/`--import` flags (baked into the `npm run emulators` script) save emulator data to a local `emulator-data/` folder on shutdown (`Ctrl+C`) and reload it next time, so that test account and any test products persist across sessions instead of resetting every time. This folder is git-ignored — it's local-only, regeneratable data, same reasoning as `node_modules`.
- The emulators enforce the *same* `firestore.rules`/`storage.rules` as production, so testing locally also validates your real security rules — just against fake data.

**A subtlety worth remembering:** the `apiKey` and other values in `firebaseConfig` (inside `firebase.js`) look like secrets but aren't — they're meant to be public in client-side code. Actual security comes entirely from the rules above, not from hiding this config.

### Filling the viewport with flexbox (`flex-1`)
`Home.jsx` wraps `Navbar` + `Hero` in a `min-h-screen flex flex-col` container, with `Hero` set to `flex-1` instead of a fixed height like `h-[85vh]`. `flex-1` means "grow to fill whatever space is left in the flex container" — so regardless of the Navbar's actual rendered height (which we never have to calculate or hardcode), Hero automatically fills exactly what remains of the screen. This is the standard, robust pattern for "fill the rest of the viewport below a header" — a fixed-height guess (`85vh`) is fragile and was literally the cause of a visible gap bug we had to fix.

### Third-party library vetting checklist
Before adding a new npm package (like `react-easy-crop`), worth actually checking rather than assuming:
- **License** — is it actually free for your use case? MIT/Apache/BSD are permissive (commercial use fine); check the real `LICENSE` file text, not just a label.
- **Download counts** (`npm` registry) — is it genuinely widely used?
- **GitHub stars vs. repo age** — organic growth over years is a good sign; huge star counts on a very young repo is a red flag (this is what sank the `ui-ux-pro-max-skill` plugin earlier).
- **Recent commits / open issue count** — actively maintained, not abandoned.
- **What the install step actually does** — adding a static dependency via `npm install` is very different from a setup script that runs arbitrary code (`npx some-package init`).

### Browser image editing: canvas, object URLs, and CORS
The hero photo crop tool touches three related browser concepts:
- **`URL.createObjectURL(file)`** — makes a temporary local URL pointing at a file still sitting in browser memory, before it's uploaded anywhere. Lets the crop preview show your file instantly. Must be "revoked" (`URL.revokeObjectURL`) when done, or it leaks memory — handled automatically by a `useEffect` cleanup function.
- **`<canvas>` for image manipulation** — drawing a specific rectangle of a source image onto a canvas, then reading that canvas back out as a file (`canvas.toBlob()`), is the standard way to actually "cut out" a crop selection into a new image. This is how the crop tool turns your drag/zoom selection into the real uploaded file.
- **CORS and "tainted" canvases** — a browser security rule: if you draw an image from a *different origin* (e.g. a Firebase Storage URL) onto a canvas, and that server didn't send permissive CORS headers, the canvas becomes "tainted" and refuses to let you read its pixel data back out (`toBlob`/`toDataURL` fail). This is why the crop tool only works on a *newly selected file* (a same-origin `blob:` URL, always safe) and not the already-uploaded live photo (a cross-origin Storage URL, might fail).

### Code-splitting (`lazy` + `Suspense`)
By default, a Vite/React build bundles your entire app — every page, every route — into one JS file that every visitor downloads, whether they need it or not. `React.lazy(() => import('./pages/Admin'))` tells the bundler to build that page as a *separate* file, only fetched when someone actually navigates there. Paired with `<Suspense fallback={...}>` (which shows a fallback UI while a lazy chunk is being fetched), this is standard practice on real production sites — confirmed in our build output: `Admin.js` (37.72KB, including the crop library) is now completely absent from what a homepage visitor downloads, only fetched the moment someone visits `/admin`.

---

## Part 3 — This Project's File Structure, Explained

```
louu-the-label/                  (repo root)
├── CLAUDE.md                    Instructions Claude reads every session: stack, phases, current status
├── LEARNING_GUIDE.md            This file
├── GLOSSARY.md                  Quick-reference terminology companion to this guide
└── louu-label/                  All actual app code lives here
    ├── index.html               The single real HTML page; React mounts into <div id="root">
    ├── vite.config.js           Vite setup, includes the Tailwind plugin
    ├── package.json             Lists installed packages (firebase, react-router-dom, react-easy-crop, etc.)
    ├── firebase.json            Tells `firebase deploy`/`firebase emulators:start` where your built site and rules files are, and emulator ports
    ├── .firebaserc              Which Firebase project this connects to (louu-the-label)
    ├── firestore.rules          Rules for all four collections (see Part 2)
    ├── storage.rules            Rules for products/ and site/ upload paths
    └── src/
        ├── main.jsx             Entry point — mounts <App /> inside <BrowserRouter>
        ├── App.jsx              Routes, all lazy-loaded (code-splitting, see Part 2): "/" "/collection" "/about" "/admin"
        ├── firebase.js          Initializes Firebase, exports `db`, `storage`, `auth`; connects to emulators when `import.meta.env.DEV`
        ├── index.css            Just `@import "tailwindcss";`
        ├── assets/
        │   └── home.jpeg        Local fallback hero photo, used until an admin sets a real one via Storage
        ├── components/
        │   ├── Navbar.jsx       Louu/Collection/About Us links, shared across public pages
        │   ├── Footer.jsx       Copyright line, shared across public pages
        │   ├── Hero.jsx         Homepage banner — takes `imageURL` prop, falls back to the local asset
        │   ├── ProductCard.jsx  Displays one product (image, name, category, price)
        │   └── ProductGrid.jsx  Takes a list of products, renders a ProductCard for each
        └── pages/
            ├── Home.jsx           Public "/" — Navbar + Hero (fetches siteSettings/hero) + Footer
            ├── Catalog.jsx        Public "/collection" — the actual product grid, fetches from `products`
            ├── About.jsx          Public "/about" — placeholder content
            ├── Login.jsx          Email/password form — not its own route, rendered by Admin.jsx when logged out
            ├── Admin.jsx          "/admin" shell — auth-gate, header, tab nav (SECTIONS array) switching sections
            ├── AdminProducts.jsx  Products tab — add/edit form, product list (expand/Edit/Archive/Delete), Archived section
            └── AdminHomepage.jsx  Homepage tab — hero photo upload with interactive crop (react-easy-crop)
```

**Why some things are structured the way they are:**
- `ProductGrid`/`ProductCard` never needed to change between Phase 1 (dummy data) and Phase 2 (real Firestore data) — they just take a `products` array as a prop and don't care where it came from. This is a deliberate pattern: keep display components "dumb," push data-fetching to the page level.
- `Login.jsx` isn't its own route. `Admin.jsx` renders it directly when nobody's signed in, and reacts automatically to sign-in success via `onAuthStateChanged` — no manual redirect code needed.
- Routing (`react-router-dom`) wasn't added until Phase 3, even though the package was installed in Phase 0 — there was nothing to route *between* until `/admin` existed. Avoid adding infrastructure before there's a use for it.
- `Home.jsx` and `Catalog.jsx` are separate pages/routes, not one combined page — a deliberate split after noticing "Catalog" was a misleading name once it started showing a hero banner instead of products. Now the Navbar's "Collection" link and the Hero's "Product Category" link both have a real, honest destination (`/collection`) instead of pointing at a page that no longer matched its name.
- `Admin.jsx` is a thin shell (auth-gate, header, tab nav) around `AdminProducts.jsx`/`AdminHomepage.jsx`, each fully self-contained (own state, own Firestore fetches). Adding a future Admin section is "write a new file, add one line to the `SECTIONS` array" — no changes needed to the shell itself. Chosen over real sub-routes (`/admin/products`) for now since it's less to build; tabs use simple state instead of the URL, meaning switching tabs remounts the hidden one fresh rather than preserving its exact UI state (e.g. which panel was expanded) — an accepted tradeoff for the "simple for now" version.

---

## Part 4 — Build Narrative: What We Did, Phase by Phase

**Phase 0 — Setup.** Scaffolded with `npm create vite@latest`, installed `firebase` and `react-router-dom`. Discovered mid-setup that the scaffold landed in a `louu-label/` subfolder instead of the repo root — decided to keep it that way and updated CLAUDE.md to match reality rather than force a restructure. Also hit a version surprise: Tailwind installed as v4, which uses a different (simpler) setup than the v3-style plan originally written in CLAUDE.md — chose to adopt v4 and updated the docs.

**Phase 1 — Static UI, dummy data.** Built `Navbar`, `ProductCard`, `ProductGrid`, and `Catalog` against a local `dummyProducts.js` array (8 fake products, 3 categories, picsum.photos placeholder images) so the layout could be finished before touching any backend.

**Phase 2 — Connect Firestore.** Created `firebase.js` from your real Firebase console config. Rewrote `Catalog.jsx` to fetch from Firestore via `useEffect`/`useState` with a loading state, deleted the now-unused dummy data. Learned that Firebase Storage now requires the paid **Blaze plan** to even enable (though its free tier is generous) — you enabled it.

**Phase 3 — Auth + Admin upload.** Added real routing. Built `Login.jsx` (sign-in form) and `Admin.jsx` (auth-gated: upload form that pushes an image to Storage, then writes a Firestore doc with the resulting URL; product list with delete). Tested the whole flow end-to-end in the browser — login, upload, delete, and confirmed new products appeared on the public Catalog too.

**Phase 4 — Security rules + deploy.** Both Firestore and Storage had been left in "test mode" (open access) up to this point. Wrote `firestore.rules`/`storage.rules` (public read, authenticated-write-only), wired them into `firebase.json` so `firebase deploy` pushes rules and hosting together, then actually deployed. Verified live in the Firebase console that the deployed rules matched the source files exactly. Site went live at `https://louu-the-label.web.app`.

**Post-Phase-4 — Security hardening (ad hoc, prompted by your questions).**
- Discussed what "public" actually means for this site given it has no customer accounts/payments yet, and what would need to change if that scope grew later (the write rule currently trusts "any signed-in user," which is fine only because you're the *only* account that can exist).
- Discussed defenses against a stolen admin login: MFA (not yet implemented — bigger lift, requires console setup), strong/unique password, incident response via the Firebase console (disable account / revoke sessions), and periodic backups.
- Implemented one concrete fix: admin sessions used to persist indefinitely (`browserLocalPersistence`, Firebase's default). Switched `Login.jsx` to `browserSessionPersistence`, so closing the browser tab now signs you out automatically. Tested and deployed.

**Phase 5 — Polish (in progress).**
- `index.html`: real `<title>` and `<meta name="description">`.
- `Catalog.jsx`: chained-ternary conditional rendering for three states — loading / empty (`products.length === 0`) / populated.
- `Admin.jsx`: `window.confirm()` guard before delete, after realizing delete was instant and permanent with no "are you sure."
- Still to do: mobile nav check, optional category filter.

**Dev/prod data separation (ad hoc, prompted by realizing local testing was hitting live data).** After deploying, local development (`localhost`) and the live site were both pointed at the same real Firestore/Storage/Auth — every local test upload/delete was a real change to live data, with no safety net. Set up the **Firebase Local Emulator Suite** to fix this properly (see Part 2) rather than just being careful by hand: installed Java (a Firestore emulator dependency, via Homebrew), added an `"emulators"` block to `firebase.json`, and wired `firebase.js` to connect to the emulators only when `import.meta.env.DEV` is true. Verified the emulators actually start and bind their ports correctly. Local dev now needs `npm run emulators` + `npm run dev` running together, with a separate test admin account created once via the Emulator UI.

**Admin feature additions (ad hoc, beyond the original Phase 3 spec, built during Phase 5).**
- **Navigation**: added a "Louu" link (using `<Link>`, not a plain `<a>`, to preserve SPA behavior) on both `Login.jsx` and `Admin.jsx`, back to the public Catalog — there was previously no way back without editing the URL by hand.
- **Edit**: `Admin.jsx`'s form became dual-purpose. New `editingId` state (`null` = adding, otherwise the product being edited) makes `handleSubmit` branch between `addDoc` and `updateDoc`. Editing doesn't force a new image upload — the image field is only `required` when *not* editing, and the existing `imageURL` is kept unless a new file is chosen. `createdAt` is deliberately never touched on edit.
- **Archive / Restore**: introduced the idea of "moving" a document between Firestore collections — there's no native "move" operation, so it's actually a `setDoc` (writing the same data, and deliberately the *same document ID*, to the new collection) immediately followed by a `deleteDoc` on the original. Chose a genuinely separate `archivedProducts` collection over a boolean `archived` field on `products`, specifically so `Catalog.jsx` needs zero changes to stay correct — it only ever queries `products`, so archived items are invisible to the public site automatically, with no filtering logic required anywhere. Required a new `firestore.rules` block for `archivedProducts` (authenticated-only, no public read — there's no legitimate reason a customer needs to read archived inventory).
- **Admin notes + expand panel**: a `notes` textarea per product, for admin reference only. This is where a real security nuance came up: `products` has `allow read: if true`, meaning *every field* on those documents — not just what `ProductCard.jsx` chooses to render — is technically fetchable by anyone via the Firestore SDK directly. Putting `notes` on the same document would only hide it by UI convention, not actually restrict access. So notes live in a *separate* `productNotes` collection (keyed by the same product ID, looked up via a `notesMap` — see Part 2), with its own `firestore.rules` block requiring authentication for both read and write. This is the same reasoning as the Archive decision, applied to a genuine privacy requirement rather than a display-organization one. An expand arrow (▼/▲) per product row, backed by a single `expandedId` state (one row open at a time), reveals category/description/notes without needing a separate detail page.

**Admin UI iteration (several rounds of direct feedback, all Phase 5).** The expand feature evolved through a few rounds: `expandedId` became `expandedIds` (a `Set`) so any number of products can be expanded simultaneously, not just one at a time. Edit moved out of the always-visible button row and into the expand panel itself — clicking Edit now opens that row's panel directly in an editable state, rather than jumping to a form at the top of the page (which had a known "no auto-scroll" rough edge). Then, on a design-standpoint question, Archive and Delete moved into the expand panel too, leaving the top row as just the ▼ arrow — the reasoning: Archive had no confirmation dialog and sat right next to a low-stakes, frequently-clicked button, a real mis-click risk; Archive now also asks for confirmation, matching Delete. Finally, the Admin page itself was restructured so **products are the default view on login** (not a big form) — a `showAddForm` toggle reveals the Add form on demand via an "Add product" button instead.

**Building the homepage (Hero) — a real design constraint, not just code.** Given a mockup image and a real photo to use, the two didn't match: the mockup was an ultra-wide banner (~2.2:1), the photo was portrait (~0.8:1) — forcing it into the mockup's shape would've cropped away more than half of it. This got resolved by directly asking what tradeoff was acceptable (the user confirmed the mockup itself already showed a similar crop, so matching that crop was the answer, not preserving the whole photo) rather than silently picking an approach. Built as: a `Hero` component using `object-cover` + `object-position` (tuned via trial — `object-[75%_15%]` — to keep her face/hands in frame and crop from the bottom), a large `font-serif` title, a tracked-out tagline, and two bottom links, with everything progressively centered per direct feedback (title/tagline first, then the bottom links too). A separate, explicit standing rule came out of this: **layout/positioning work now, fonts and colors deferred to later** — and when first stated as homepage-specific, the user corrected that it actually applies **site-wide**.

**Home vs. Catalog split.** Once the Hero replaced the product grid on `/`, "Catalog.jsx" stopped being an honest name for a page showing a hero banner. Rather than silently rename, this became an explicit question: one combined homepage-with-catalog, or two separate pages? Chose two — `Home.jsx` (`/`, hero-only) and `Catalog.jsx` (`/collection`, product grid, unchanged) — which also gave the Hero's "Product Category" link and the Navbar's "Collection" link a real, correct destination for the first time.

**Two viewport-fill bugs, both simple once found.** (1) The Hero left a visible gap of white space below it — root cause: `h-[85vh]` is a fixed height that doesn't account for the Navbar's actual size. Fixed by switching to the `flex-1` pattern (see Part 2). (2) After that fix, a *second* gap appeared, this time between the Hero and the Footer — root cause: `Footer.jsx` had a leftover `mt-12` margin from when it always sat in normal document flow after page content; once Footer became a sibling of the `min-h-screen` Hero wrapper, that margin rendered as a visible gap. Removed it from `Footer.jsx` since the other pages (Catalog, About) already have their own bottom padding and didn't need it either. Lesson: a shared component's own margin can conflict with how a *different* page chooses to lay things out around it — spacing is often better owned by the page than baked into the shared component.

**Making the hero photo admin-editable.** Originally a hardcoded, bundled file — turned into real content: a `siteSettings/hero` Firestore doc storing an `imageURL`, a new `site/` Storage path, a new Admin "Homepage" tab to upload it, and `Hero.jsx` taking `imageURL` as a prop with the original local file kept only as a fallback for "nothing's been set yet." This is also where the Admin page got restructured from one long page into **tabs** (`Admin.jsx` shell + `AdminProducts.jsx` + `AdminHomepage.jsx`), explicitly to make room for "all the other pages I need in the future" without every new section growing one giant file.

**Interactive crop tool.** Went from a static preview box to genuine drag/zoom/crop control, using `react-easy-crop` (explicitly vetted before installing — see Part 2's library checklist, and the MIT license was double-checked against the actual `LICENSE` file text, not just a label, since this is for a commercial site). The real technical constraint that shaped the design: cropping only works on a *newly selected* file, not the already-live photo, because drawing a cross-origin image onto a `<canvas>` and reading it back out can hit a browser CORS security restriction — a same-origin local file has no such risk.

**Two performance fixes.** (1) The hero photo flashed the local fallback image, then swapped to the real one once Firestore responded — fixed with a `heroLoading` state so nothing renders until the real answer is known, same pattern as `Catalog.jsx`'s loading state. (2) Route-based code-splitting (`lazy()` + `Suspense` in `App.jsx`) so each page ships as its own JS file — confirmed in the build output that `Admin.js` (37.72KB, including the crop library) is no longer part of what a homepage visitor downloads. Image compression (the hero photo is currently ~2.3MB, unoptimized) was identified as the next lever but explicitly deferred by the user for later.

---

## Part 5 — Key Decisions & Lessons Log

- **Tailwind v4 over v3**: simpler setup (no separate config files), chosen when npm installed it by default and you confirmed you wanted the current version rather than pinning to match the original plan.
- **Firebase Storage needs Blaze plan**: Google removed Storage from the free tier for new projects; Blaze still has a free usage tier, just requires a card on file.
- **Test mode → real rules**: always start Firestore/Storage in test mode during development (open access, ~30-day expiry), replace with real rules before anything goes live.
- **Declined a third-party "skill" plugin**: a GitHub repo (`ui-ux-pro-max-skill`) had implausibly high stars for its age and an install step that would've run an unverified npm package via `npx` (arbitrary code execution) rather than just adding static instruction files. Good instinct to flag rather than blindly follow "install this" requests, even from convincing-looking repos.
- **A dev-server mishap**: while sanity-checking a build, a background dev server was started and then cleaned up with a too-broad `pkill -f "vite"`, which also killed your own already-running dev server by accident. Lesson: when cleaning up a process started just for a quick check, target its specific PID, don't pattern-kill.
- **Public Firebase config ≠ a secret**: the `apiKey` etc. in `firebase.js` are meant to be public; real security lives in the security rules, not in hiding config values.
- **New standing rule (Phase 5)**: before writing any code for a request, summarize the main points of what's being built and wait for confirmation, rather than implementing immediately. Applies to actual code changes, not pure Q&A.
- **UI-hidden ≠ access-controlled**: realized while adding admin notes that a field on a publicly-readable document is publicly readable in full, no matter what the UI renders. Real privacy requires rules enforcement at the data layer (a separate collection with its own auth-only rules), not just leaving something out of a component. See Part 2, "Data-layer privacy vs. UI-only hiding."
- **Standing rule broadened (Phase 5)**: "layout only, no font/color changes yet" was first stated for the homepage build specifically, then explicitly corrected to apply to the *whole site* — a reminder to double-check the scope of a standing instruction rather than assume it's narrower than intended.
- **A shared photo, two very different aspect ratios**: a design mockup and its source photo didn't match in shape (wide banner vs. portrait photo). Resolved by asking directly what tradeoff was acceptable rather than guessing — turned out the mockup itself already showed the same crop compromise.
- **`flex-1` beats a fixed `vh` height** for "fill the rest of the screen below a header" — a hardcoded height guess doesn't adapt to the header's real size and was the direct cause of a visible layout gap.
- **A component's own margin can fight the page around it**: `Footer.jsx`'s `mt-12` made sense when it always sat in normal document flow, but broke once a page (`Home.jsx`) used it as a flex sibling instead — spacing is often safer left to the page than baked into a shared component.
- **Vetted `react-easy-crop` properly before installing**: checked npm download counts (2.4M/week), GitHub stars-vs-age (organic growth since 2018, not suspicious), open issue count, last-commit recency, and read the actual `LICENSE` file text (not just the label) to confirm MIT applies cleanly to commercial use — the same rigor as the earlier declined plugin, applied to a case that checked out fine.
- **CORS can block canvas image reads**: drawing a cross-origin image onto a `<canvas>` and reading pixels back out can be silently blocked by browser security unless the source server sends permissive CORS headers. Designed around this rather than fighting it — the crop tool only ever operates on freshly-selected local files.
- **A hardcoded asset loads instantly; database-driven content doesn't** — turning the hero photo into admin-editable content traded "instant, but requires a code change to update" for "no code change needed, but has a real network fetch delay (and a sequential one: Firestore for the URL, then Storage for the image itself)." Neither is strictly better; it's what the feature actually needs.

---

## Part 6 — Living Log / What's Next

*(This section gets updated as we keep working on this project — check back here for the latest state.)*

- **Current phase**: Phase 5 (polish), well beyond its original scope. Public site: `Home.jsx` (hero homepage) + `Catalog.jsx` (product grid, moved to `/collection`) + `About.jsx` (placeholder), all sharing `Navbar`/`Footer`. Admin is now tab-based (`Admin.jsx` shell + `AdminProducts.jsx` + `AdminHomepage.jsx`), with Edit/Archive/Restore/Notes on products and a full interactive crop tool for the hero photo. Code-splitting is live (each page/route ships as its own JS chunk, confirmed via build output and network-tab verification). Deployed and confirmed working, including the crop tool and code-splitting.
- **Firestore collections in play**: `products` (public read), `archivedProducts` (auth-only), `productNotes` (auth-only), `siteSettings` (public read, currently just `hero`). All four have matching `firestore.rules` blocks, deployed and verified.
- **Mobile nav check**: confirmed done by the user — Navbar has no complex menu to break, `ProductGrid`'s responsive classes from Phase 1 hold up fine.
- **Not done / deprioritized**: optional category filter (original Phase 5 item, hasn't come up again since the homepage/Admin work took over); image compression for the hero photo (currently ~2.3MB, explicitly deferred by the user "for now").
- **Open items to revisit eventually**: UID-specific write rule (currently "any authenticated user," fine only while you're the sole account), MFA on the admin account, periodic Firestore backups, orphaned Storage images on product delete (deleting a product doesn't currently delete its uploaded image file — same is true for hero photo replacements now too), no auto-scroll when opening a product's expand panel further down a long list, real sub-routes for Admin tabs if the "resets on tab switch" tradeoff ever becomes annoying, fonts/colors (deliberately untouched site-wide, waiting on the user).
