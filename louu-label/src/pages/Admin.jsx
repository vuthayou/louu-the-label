import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebaseAdmin'
import Login from './Login'
import AdminProducts from './AdminProducts'
import AdminHomepage from './AdminHomepage'
import AdminCollectionHero from './AdminCollectionHero'

// Each entry is one nav item + the section it shows. Adding a future
// section (e.g. About page content) is just adding another entry here
// and a new AdminX.jsx component — nothing else in this file changes.
const SECTIONS = [
  { id: 'products', label: 'Products', Component: AdminProducts },
  { id: 'homepage', label: 'Homepage', Component: AdminHomepage },
  { id: 'collection', label: 'Collection', Component: AdminCollectionHero },
]

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

function Admin() {
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id)

  // This is what makes the page "auth-gated": we track sign-in state here
  // and render different UI for each case, rather than using a separate
  // route + redirect.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthChecked(true)
    })
    return unsubscribe
  }, [])

  if (!authChecked) {
    return <p className="text-center py-12 text-gray-500">Loading...</p>
  }

  if (!user) {
    return <Login />
  }

  const ActiveComponent = SECTIONS.find((s) => s.id === activeSection).Component

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className={`text-sm text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRing}`}
        >
          Louu
        </Link>
        <h1 className="text-xl font-semibold">Admin</h1>
        <button
          onClick={() => signOut(auth)}
          className={`text-sm text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRing}`}
        >
          Sign out
        </button>
      </div>

      <nav className="flex items-center gap-6 border-b border-gray-200 mb-8">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`pb-2 text-sm border-b-2 -mb-px transition-all duration-300 ease-in-out ${focusRing} ${
              activeSection === section.id
                ? 'border-gray-900 text-gray-900 font-medium'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <ActiveComponent />
    </div>
  )
}

export default Admin
