import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'

// lazy() + dynamic import() tells Vite to build each page as its own
// separate file, only downloaded when a visitor actually navigates there —
// e.g. a homepage visitor never downloads Admin's code (react-easy-crop,
// upload logic, etc.) at all.
const Home = lazy(() => import('./pages/Home'))
const Catalog = lazy(() => import('./pages/Catalog'))
const About = lazy(() => import('./pages/About'))
const Admin = lazy(() => import('./pages/Admin'))

function App() {
  return (
    <Suspense fallback={<p className="text-center py-12 text-gray-500">Loading...</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Catalog />} />
        <Route path="/about" element={<About />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Suspense>
  )
}

export default App
