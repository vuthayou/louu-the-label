import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import ChunkErrorBoundary from './components/ChunkErrorBoundary'

// lazy() + dynamic import() tells Vite to build each page as its own
// separate file, only downloaded when a visitor actually navigates there —
// e.g. a homepage visitor never downloads Admin's code (react-easy-crop,
// upload logic, etc.) at all.
const Home = lazy(() => import('./pages/Home'))
const Catalog = lazy(() => import('./pages/Catalog'))
const About = lazy(() => import('./pages/About'))
const Admin = lazy(() => import('./pages/Admin'))

function App() {
  // A successful render here means chunk loading is working — clear the
  // ChunkErrorBoundary's one-time reload guard so it's armed again for the
  // next deploy, not just the first one this tab ever hits.
  useEffect(() => {
    sessionStorage.removeItem('chunk-error-reloaded')
  }, [])

  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<p className="text-center py-12 text-gray-500">Loading...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Catalog />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Suspense>
    </ChunkErrorBoundary>
  )
}

export default App
