import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore/lite'
import { app } from './firebaseApp'

// Firestore Lite — every read/write in this app is one-time (getDoc,
// setDoc, etc.); nothing uses onSnapshot real-time listeners. The regular
// Firestore SDK's real-time sync + offline-persistence engine is most of
// its bundle weight, so the Lite build (same functions, no real-time
// engine) is a drop-in swap with no functional change. Every file that
// imports from 'firebase/firestore' has to use the '/lite' path too — a
// regular Firestore doc/getDoc call can't mix with a Lite-created db
// instance. Also kept separate from Storage/Auth (see firebaseAdmin.js) so
// public pages (Home, Catalog, About) only ever have to load the Firestore
// SDK to fetch their content, not the Storage/Auth code that only Admin
// actually needs.
export const db = getFirestore(app)

// import.meta.env.DEV is true only for `npm run dev`, false for production
// builds — so local development always talks to local emulators (isolated,
// throwaway data) and the deployed site always talks to real Firebase.
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
