import { Link } from 'react-router-dom'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

function Navbar() {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200">
      <div className="px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          to="/"
          className={`text-xl font-bold tracking-wide transition-all duration-300 ease-in-out ${focusRing}`}
        >
          Louu
        </Link>
        <nav className="flex items-center gap-6 text-sm text-gray-600">
          <Link
            to="/collection"
            className={`hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRing}`}
          >
            Collection
          </Link>
          <Link
            to="/about"
            className={`hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRing}`}
          >
            About Us
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
