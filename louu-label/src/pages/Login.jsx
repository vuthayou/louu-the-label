import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { auth } from '../firebase'

// For elements that already declare their own `rounded`/`rounded-lg` class.
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
// For plain text links with no border-radius of their own — adds one so the
// focus ring isn't a hard rectangle around the text.
const focusRingText = `${focusRing} rounded-sm`
const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      // Session persistence (not the default "local") means the login is
      // tied to this browser tab — closing the tab signs you out.
      await setPersistence(auth, browserSessionPersistence)
      // On success, Admin.jsx's onAuthStateChanged listener picks up the
      // new auth state automatically and swaps this form out for the
      // admin panel — no manual redirect needed.
      await signInWithEmailAndPassword(auth, email, password)
    } catch {
      setError('Invalid email or password.')
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-24 px-4 md:px-6 lg:px-8">
      <Link
        to="/"
        className={`text-sm text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
      >
        Louu
      </Link>
      <h1 className="text-xl font-semibold mb-6">Admin Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={`border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className={`bg-gray-900 text-white rounded px-4 py-2 hover:bg-gray-700 transition-all duration-300 ease-in-out ${focusRing}`}
        >
          Sign in
        </button>
      </form>
    </div>
  )
}

export default Login
