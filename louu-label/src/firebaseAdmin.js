import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { app } from './firebaseApp'

// Storage + Auth — only imported by Admin-related files (Login, Admin,
// AdminProducts, AdminCollectionHero, HeroImageManager). Kept out of
// firebase.js so public pages don't have to load this code at all; see the
// comment there for why.
export const storage = getStorage(app)
export const auth = getAuth(app)

if (import.meta.env.DEV) {
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099')
}
