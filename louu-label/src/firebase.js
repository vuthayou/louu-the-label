import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyAzieM59J84OeLGJNgiKhV_aDZcawT_t1E',
  authDomain: 'louu-the-label.firebaseapp.com',
  projectId: 'louu-the-label',
  storageBucket: 'louu-the-label.firebasestorage.app',
  messagingSenderId: '805771143008',
  appId: '1:805771143008:web:5d3eb8203e0933738c6005',
  measurementId: 'G-WW7NFJX235',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)

// import.meta.env.DEV is true only for `npm run dev`, false for production
// builds — so local development always talks to local emulators (isolated,
// throwaway data) and the deployed site always talks to real Firebase.
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099')
}
