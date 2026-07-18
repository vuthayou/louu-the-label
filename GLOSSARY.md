# Glossary: Web Dev Terminology

A quick-reference companion to `LEARNING_GUIDE.md`. That file explains concepts in depth with narrative and examples; this one is for fast lookup — short definitions, organized by category. Terms are cross-referenced with **bold** where one definition uses another term from this glossary.

---

## General Web Dev

- **Frontend** — the part of an app that runs in the user's browser: what they see and interact with (our React app).
- **Backend** — server-side logic and data storage. We don't have a custom backend — Firebase plays that role for us (a **BaaS**).
- **Client-side** — code that runs in the browser, on the user's machine. Contrast with **server-side**.
- **BaaS (Backend-as-a-Service)** — a hosted platform (like Firebase) that gives you database, auth, storage, and hosting without writing your own server. You configure it instead of building it.
- **SPA (Single-Page Application)** — a web app that loads one HTML page and then swaps content in/out with JavaScript, instead of doing a full page reload for every navigation. Our app is an SPA — `react-router-dom` handles the illusion of "different pages."
- **API (Application Programming Interface)** — a defined way for one piece of software to talk to another. Firebase's SDK gives you an API for talking to Firestore/Storage/Auth without writing raw network requests yourself.
- **SDK (Software Development Kit)** — a package of tools/code a provider gives you to integrate with their service. The `firebase` npm package is Firebase's SDK.
- **CLI (Command Line Interface)** — a tool you run via terminal commands instead of a graphical app. `firebase` (the CLI) is how you run `firebase deploy`.
- **CDN (Content Delivery Network)** — a network of servers spread across locations that serve your static files (HTML/CSS/JS/images) from whichever server is closest to the visitor, for speed. Firebase Hosting serves your site over one.
- **DNS (Domain Name System)** — the system that translates a human-readable domain (`louu-the-label.web.app`) into the actual server address browsers connect to.
- **Domain / Subdomain** — `web.app` is a domain Google owns; `louu-the-label.web.app` is a subdomain of it, given to you for free.
- **HTTPS** — the encrypted version of HTTP (the protocol browsers use to talk to servers). The padlock icon in your browser bar. Firebase Hosting provides this automatically.
- **localhost** — a hostname that always means "this machine." `localhost:5173` is a server running only on your own computer, unreachable from anywhere else.
- **Port** — a number identifying a specific "channel" on a machine a server listens on. `5173` is Vite's default dev server port.

## Node / npm / Tooling

- **Node.js** — the JavaScript runtime that lets you run JS outside a browser (e.g. to run Vite, npm, the Firebase CLI).
- **npm (Node Package Manager)** — the tool for installing and managing JS packages (`npm install`, `npm run build`).
- **Package / dependency** — a piece of external code your project relies on (e.g. `firebase`, `react-router-dom`).
- **devDependency** — a package only needed during development/building (like `@tailwindcss/vite`), not shipped to the actual production site.
- **package.json** — the file listing your project's dependencies and scripts (`npm run dev`, `npm run build`).
- **package-lock.json** — records the *exact* installed versions of every dependency (and their dependencies), so installs are reproducible.
- **node_modules** — the folder where all installed packages actually live. Never edited by hand, never committed to git.
- **Bundler** — a tool that combines all your source files into optimized output files for the browser. Vite is our bundler (via Rollup/Rolldown under the hood).
- **Build** — the process of turning source code into the final, optimized files a browser actually runs (`npm run build` → `dist/`).
- **Dev server** — a local server (Vite) that serves your app while developing, with instant updates as you save files (**HMR**).
- **HMR (Hot Module Replacement)** — updating the running app in the browser instantly when you save a file, without a full page reload.

## React

- **Component** — a JS function that returns UI. The basic building block of a React app (e.g. `ProductCard`).
- **JSX** — the HTML-looking syntax you write inside React components (`<div className="...">`), which actually compiles down to plain JS function calls.
- **Props** — data passed into a component from its parent, read-only from the child's perspective. `<ProductCard product={x} />` passes `x` as the `product` prop.
- **State** — data a component owns and can change over time, causing it to re-render when updated. Managed with `useState`.
- **Hook** — a special React function (always starting with `use`) that lets you tap into React features like state or lifecycle from a plain function component. `useState` and `useEffect` are hooks.
- **useState** — a hook that gives a component a piece of state and a function to update it: `const [value, setValue] = useState(initial)`.
- **useEffect** — a hook for running code in response to a component rendering or specific values changing — most often used for data fetching, subscriptions, or anything that reaches "outside" React.
- **Render / re-render** — React calling your component function to figure out what the UI should look like. Happens on mount, and again whenever state or props change.
- **Conditional rendering** — showing different UI based on a condition, e.g. `Admin.jsx` rendering `<Login />` vs. the admin panel depending on whether `user` exists.
- **key prop** — a required, unique identifier React needs when rendering a list of elements (`products.map(...)`), so it can track which item is which across re-renders.
- **Controlled component** — a form input whose value is driven entirely by React state (`value={email}` + `onChange`), rather than the DOM managing it independently.
- **Event handler** — a function that runs in response to a user action, e.g. `onClick`, `onChange`, `onSubmit`.

## Routing

- **Route** — a mapping between a URL path and what should be shown, e.g. `/` → `Home`, `/collection` → `Catalog`.
- **Router** — the mechanism that watches the URL and renders the matching route. `<BrowserRouter>` provides this.
- **Client-side routing** — changing what's shown based on the URL *without* asking the server for a new page — the SPA pattern `react-router-dom` implements.
- **Rewrite rule** — a hosting-level config telling the server "for any URL, just serve `index.html` and let the client-side router figure out what to show." Necessary for SPAs so refreshing `/admin` doesn't 404 on a real server.

## Styling

- **Utility-first CSS** — Tailwind's approach: small, single-purpose classes (`text-xl`, `px-4`) composed directly in your markup instead of writing custom CSS classes.
- **className** — the JSX equivalent of HTML's `class` attribute (`class` is a reserved word in JS).
- **Responsive design** — layouts that adapt to different screen sizes, typically via breakpoint prefixes like Tailwind's `sm:`, `md:`, `lg:`.
- **Hero / hero section** — the large, prominent banner at the top of a page (usually an image with a headline overlaid), meant to be the first thing a visitor sees. `Hero.jsx` is this project's homepage banner.
- **`object-fit` / `object-position`** — CSS controlling how an image fills a box that doesn't match its natural proportions. `object-cover` (Tailwind: `object-cover`) scales the image to fill the box completely, cropping whatever doesn't fit; `object-position` (Tailwind: `object-[x%_y%]`) controls *which part* gets kept vs. cropped. Used in `Hero.jsx` to control which part of the portrait-shaped photo shows inside the wide banner.

## Firebase / Data

- **Firestore** — Firebase's NoSQL database.
- **NoSQL** — a database style storing flexible, document-shaped data rather than rigid rows/tables (contrast with SQL/relational databases). No fixed schema enforced by the database itself.
- **Document** — one record in Firestore (e.g. one product). Roughly analogous to a row in a SQL table, but schema-flexible.
- **Collection** — a group of documents in Firestore (e.g. `products`). Roughly analogous to a table.
- **Query** — a request to Firestore asking for documents matching some criteria (we currently just fetch *all* of `products`, no filtering yet).
- **Storage bucket** — the container in Firebase Storage where uploaded files live.
- **Authentication (Auth)** — the system verifying who a user is (login). Distinct from **authorization** (what they're allowed to do once identified).
- **Authorization** — controlling what an authenticated user is *permitted* to do. Our security rules (`request.auth != null`) are an authorization check.
- **Session** — the period a user stays logged in. **Persistence** setting controls how long: `browserLocalPersistence` (default, indefinite) vs `browserSessionPersistence` (ends when the tab closes) — we switched to the latter for the admin login.
- **Token** — a piece of data (usually cryptographically signed) proving a user is authenticated, used behind the scenes by Firebase Auth on every request instead of resending your password.
- **Security rules** — the config controlling who can read/write Firestore/Storage data, written in a rules-specific syntax, deployed via `firebase deploy`.
- **Data-layer privacy** — restricting access via security rules on the actual database, as opposed to just not displaying something in the UI. A field on a publicly-readable document is publicly readable in full, regardless of what your components render — real privacy means a separate collection (or field-level rules) that Firestore itself rejects unauthenticated requests for. See the Admin Notes feature: `productNotes` is a separate collection from `products` for exactly this reason.
- **Deploy / deployment** — publishing your built app (and rules) to the live environment.
- **Spark plan** — Firebase's free tier. No Storage access on new projects.
- **Blaze plan** — Firebase's pay-as-you-go tier (still has a free usage allowance within it); required to use Storage.
- **Environment config** (`firebaseConfig`) — the values identifying your Firebase project to the SDK. Public by design — not a secret, unlike a real API key/password for most other services.
- **Emulator / Local Emulator Suite** — locally-run, throwaway copies of Firestore/Storage/Auth with zero connection to the real cloud project, used so local development/testing never touches live data. Started with `npm run emulators`; the app auto-connects to them during `npm run dev` via `import.meta.env.DEV`.
- **Environment (dev vs. prod)** — "dev" (or "development") means your local, in-progress setup (`npm run dev`, now backed by emulators); "prod" (production) means the real, live, deployed version. The whole point of the emulator setup is keeping these two fully separate.

## Security

- **Credential** — something proving identity (username/password, API key, token).
- **MFA / 2FA (Multi-/Two-Factor Authentication)** — requiring a second proof of identity beyond a password (e.g. a code from your phone), so a leaked password alone isn't enough to log in.
- **Supply chain attack/risk** — malicious or risky code entering your project via a third-party dependency or tool you installed, rather than code you wrote yourself. The reason we scrutinized the third-party "skill" plugin before installing it.
- **Arbitrary code execution** — a program running code it wasn't specifically designed to run, e.g. what happens when you `npx` an unverified package — it can do anything your user account can do.
- **Encryption** — scrambling data so only authorized parties can read it. HTTPS encrypts traffic between browser and server.

## JavaScript Fundamentals (the mechanism behind "how files talk to each other")

- **Module** — a single JS file treated as a self-contained unit that can share code with other files. Every `.jsx`/`.js` file in `src/` is a module.
- **import / export** — how modules communicate. A file uses `export` to make something available (`export default Login`), and another file uses `import` to pull it in (`import Login from './pages/Login'`). This *is* the literal answer to "how do files communicate" in this codebase — there's no hidden global magic, it's just an explicit chain of imports.
- **Promise** — an object representing a value that isn't ready yet but will be (or will fail) — the standard way JS handles things that take time, like a network request to Firestore.
- **async / await** — syntax for working with Promises as if they were synchronous code. `await getDocs(...)` pauses that function until Firestore responds, without freezing the whole app. Every Firebase call in this project (`fetchProducts`, `handleUpload`, `signInWithEmailAndPassword`) is async for this reason.
- **JSON (JavaScript Object Notation)** — a plain-text data format (`{ "key": "value" }`) used everywhere: `package.json`, `firebase.json`, and it's also the shape Firestore documents come back as in your JS code.
- **Lookup map** — a plain JS object used as a dictionary, keyed by some ID, for instant lookups instead of looping/searching an array every time. `notesMap` in `Admin.jsx` (`{ [productId]: notesText }`) is one — built once from a Firestore fetch, then any product's notes are grabbed with `notesMap[id]` rather than searching a list.

## Essential Project Files (and how they connect)

Every file below exists for a specific reason — here's the minimal set for a Vite + React + Firebase project like this one, and how they actually chain together when the app runs.

**The request → render chain (what happens when someone visits the site):**
1. Browser requests a URL → the server (Vite in dev, Firebase Hosting in production) returns **`index.html`**.
2. `index.html` contains a `<div id="root">` and a `<script type="module" src="/src/main.jsx">` tag — this is the one and only real HTML page; it hands off to JS immediately.
3. **`src/main.jsx`** runs first. It imports `App` and `BrowserRouter`, and tells React to render `<App />` into that `<div id="root">`.
4. **`src/App.jsx`** imports the page components (`Catalog`, `Admin`) and, using the router, decides which one to render based on the current URL.
5. Whichever page renders imports **`src/firebase.js`** to get `db`/`storage`/`auth`, and imports whatever components it needs (`Navbar`, `ProductGrid`, etc.).
6. Those components import each other further down (`ProductGrid` imports `ProductCard`) — a tree of imports, all traceable back to `main.jsx`.

**File-by-file, why each one is "must-have":**

- **`package.json`** — the project's identity and dependency list. Without it, `npm install` has nothing to install and `npm run dev`/`build` don't exist as commands. Every project needs this.
- **`package-lock.json`** — auto-generated, don't hand-edit. Ensures you (and anyone else) get the exact same dependency versions every install. Should be committed to git, unlike `node_modules`.
- **`vite.config.js`** — tells Vite how to build this specific project (which plugins to use — React support, the Tailwind plugin). Without it, Vite falls back to defaults that wouldn't know about React/JSX or Tailwind.
- **`index.html`** — the real entry point a browser actually loads. See chain above.
- **`src/main.jsx`** — the JS entry point referenced by `index.html`. This is where React actually "starts."
- **`src/App.jsx`** — the root component; owns routing decisions.
- **`src/firebase.js`** — centralizes Firebase setup in one place so every other file that needs `db`/`storage`/`auth` imports it from here, instead of each file re-initializing Firebase separately (which would cause bugs).
- **`.gitignore`** — tells git which files/folders to *never* track: `node_modules` (huge, regeneratable via `npm install`), `dist` (regeneratable via `npm run build`), OS/editor junk files (`.DS_Store`), and log files. Without this, you'd accidentally commit hundreds of MB of installable/generatable files.
- **`README.md`** — plain-language description of what the project is and how to run it (`npm install`, `npm run dev`). Not read by any tool — it's for humans (including future-you) opening the repo cold.
- **`eslint.config.js`** — configures ESLint, a **linter** (see below) that catches likely bugs/style issues as you write code (e.g. an unused variable, a missing dependency in `useEffect`). Not required for the app to *run*, but catches mistakes early.

**Firebase-specific must-haves** (only needed once you add a backend like Firebase):
- **`firebase.json`** — tells the `firebase` CLI what to deploy and where from (`hosting.public: "dist"`) and where your rules files are.
- **`.firebaserc`** — which actual Firebase project (by ID) `firebase deploy` talks to.
- **`firestore.rules` / `storage.rules`** — see Security Rules above. Referenced *from* `firebase.json`, so `firebase deploy` knows to push them alongside your hosting files.

**A file this project does *not* have, but many will need — `.env`:** a file for secret values (real API keys, passwords, tokens) that must *never* be committed to git — listed in `.gitignore` for exactly that reason. We don't have one here because Firebase's client config is meant to be public (see Environment config above); a project with, say, a private third-party API key would need one. Vite reads variables from `.env` files prefixed `VITE_` and makes them available in your code via `import.meta.env.VITE_SOMETHING`.

## Version Control (Git)

- **Git** — the version control system tracking every change to your files over time, letting you see history and revert mistakes.
- **Repository (repo)** — a project folder tracked by git. This project is one.
- **Commit** — a saved snapshot of changes, with a message describing what changed and why.
- **Branch** — a parallel line of development (e.g. `main`) — lets you work on changes without affecting the main codebase until you're ready.
- **Remote** — a copy of the repo hosted elsewhere (e.g. GitHub), separate from the copy on your machine.
- **.gitignore** — see above; the file listing what git should never track.

## Code Quality Tools

- **Linter** — a tool that statically analyzes your code for likely bugs or style issues without running it (ESLint, configured via `eslint.config.js`).
- **Formatter** — a tool that automatically rewrites code to a consistent style (spacing, quotes, etc.) — e.g. Prettier. Not currently set up in this project, but common to pair with a linter.

## Process / Terminal

- **Terminal / shell** — the text-based interface for running commands (`npm run dev`, `firebase deploy`).
- **Process** — a running instance of a program. Each `npm run dev` you start is a separate process.
- **PID (Process ID)** — a unique number identifying a running process, useful for stopping *exactly* the right one instead of guessing by name.
- **Background process** — a process left running while you keep using the terminal for other things.
