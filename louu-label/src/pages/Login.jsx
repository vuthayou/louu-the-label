import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { auth } from '../firebase'

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
    <div className="max-w-sm mx-auto mt-24 px-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
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
          className="border border-gray-300 rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border border-gray-300 rounded px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="bg-gray-900 text-white rounded px-3 py-2 hover:bg-gray-700 transition-colors"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}

export default Login
