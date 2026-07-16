import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

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
