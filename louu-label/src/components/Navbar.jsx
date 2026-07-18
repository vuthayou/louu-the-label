import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold tracking-wide">
        Louu
      </Link>
      <nav className="flex items-center gap-6 text-sm text-gray-600">
        <Link to="/collection" className="hover:text-gray-900 transition-colors">
          Collection
        </Link>
        <Link to="/about" className="hover:text-gray-900 transition-colors">
          About Us
        </Link>
      </nav>
    </header>
  )
}

export default Navbar
