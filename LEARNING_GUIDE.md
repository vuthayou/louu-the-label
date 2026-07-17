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
- `<Routes>` / `<Route>` — maps a URL path to a component (set up in `App.jsx`): `path="/"` → `Catalog`, `path="/admin"` → `Admin`

### Firebase (four separate services under one umbrella)
- **Firestore** — the database. Stores data as *documents* inside *collections*. Our whole app has one collection, `products`, where each document is one product with fields `name`, `price`, `description`, `category`, `imageURL`, `createdAt`.
- **Storage** — file storage, used specifically for the uploaded product images.
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

---

## Part 3 — This Project's File Structure, Explained

```
louu-the-label/                  (repo root)
├── CLAUDE.md                    Instructions Claude reads every session: stack, phases, current status
├── LEARNING_GUIDE.md            This file
└── louu-label/                  All actual app code lives here
    ├── index.html               The single real HTML page; React mounts into <div id="root">
    ├── vite.config.js           Vite setup, includes the Tailwind plugin
    ├── package.json             Lists installed packages (firebase, react-router-dom, etc.)
    ├── firebase.json            Tells `firebase deploy` where your built site is (dist/) and where your rules files are
    ├── .firebaserc              Which Firebase project this connects to (louu-the-label)
    ├── firestore.rules          Firestore security rules (see Part 2)
    ├── storage.rules            Storage security rules
    └── src/
        ├── main.jsx             Entry point — mounts <App /> inside <BrowserRouter>
        ├── App.jsx              Defines the two routes: "/" and "/admin"
        ├── firebase.js          Initializes Firebase, exports `db`, `storage`, `auth` for the rest of the app to use
        ├── index.css            Just `@import "tailwindcss";`
        ├── components/
        │   ├── Navbar.jsx       Site header (currently just shows "Louu")
        │   ├── ProductCard.jsx  Displays one product (image, name, category, price)
        │   └── ProductGrid.jsx  Takes a list of products, renders a ProductCard for each
        └── pages/
            ├── Catalog.jsx      Public page ("/"). Fetches products from Firestore, shows loading state, renders ProductGrid
            ├── Login.jsx        Email/password form — not its own route, rendered by Admin.jsx when logged out
            └── Admin.jsx        The "/admin" route. Auth-gated: shows Login if signed out, otherwise the upload form + product list with delete buttons
```

**Why some things are structured the way they are:**
- `ProductGrid`/`ProductCard` never needed to change between Phase 1 (dummy data) and Phase 2 (real Firestore data) — they just take a `products` array as a prop and don't care where it came from. This is a deliberate pattern: keep display components "dumb," push data-fetching to the page level.
- `Login.jsx` isn't its own route. `Admin.jsx` renders it directly when nobody's signed in, and reacts automatically to sign-in success via `onAuthStateChanged` — no manual redirect code needed.
- Routing (`react-router-dom`) wasn't added until Phase 3, even though the package was installed in Phase 0 — there was nothing to route *between* until `/admin` existed. Avoid adding infrastructure before there's a use for it.

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

---

## Part 5 — Key Decisions & Lessons Log

- **Tailwind v4 over v3**: simpler setup (no separate config files), chosen when npm installed it by default and you confirmed you wanted the current version rather than pinning to match the original plan.
- **Firebase Storage needs Blaze plan**: Google removed Storage from the free tier for new projects; Blaze still has a free usage tier, just requires a card on file.
- **Test mode → real rules**: always start Firestore/Storage in test mode during development (open access, ~30-day expiry), replace with real rules before anything goes live.
- **Declined a third-party "skill" plugin**: a GitHub repo (`ui-ux-pro-max-skill`) had implausibly high stars for its age and an install step that would've run an unverified npm package via `npx` (arbitrary code execution) rather than just adding static instruction files. Good instinct to flag rather than blindly follow "install this" requests, even from convincing-looking repos.
- **A dev-server mishap**: while sanity-checking a build, a background dev server was started and then cleaned up with a too-broad `pkill -f "vite"`, which also killed your own already-running dev server by accident. Lesson: when cleaning up a process started just for a quick check, target its specific PID, don't pattern-kill.
- **Public Firebase config ≠ a secret**: the `apiKey` etc. in `firebase.js` are meant to be public; real security lives in the security rules, not in hiding config values.

---

## Part 6 — Living Log / What's Next

*(This section gets updated as we keep working on this project — check back here for the latest state.)*

- **Current phase**: Phase 5 (polish) in progress. Also just finished setting up the Local Emulator Suite for dev/prod data separation — about to test it live for the first time.
- **Open items to revisit eventually**: UID-specific write rule (currently "any authenticated user," fine only while you're the sole account), MFA on the admin account, periodic Firestore backups, orphaned Storage images on product delete (deleting a product doesn't currently delete its uploaded image file), mobile nav check, optional category filter.
