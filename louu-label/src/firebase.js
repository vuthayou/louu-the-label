import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { app } from './firebaseApp'

// Firestore only — kept separate from Storage/Auth (see firebaseAdmin.js) so
// public pages (Home, Catalog, About) only ever have to load the Firestore
// SDK to fetch their content, not the Storage/Auth code that only Admin
// actually needs. That split shrinks the JS that has to run before a public
// page's first Firestore read can even start.
export const db = getFirestore(app)

// import.meta.env.DEV is true only for `npm run dev`, false for production
// builds — so local development always talks to local emulators (isolated,
// throwaway data) and the deployed site always talks to real Firebase.
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
