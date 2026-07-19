import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { preloadImages } from '../utils/preloadImages'
import defaultHomeImage from '../assets/home.jpeg'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import AboutPreview from '../components/AboutPreview'
import ProductsPreview from '../components/ProductsPreview'
import LoadingScreen from '../components/LoadingScreen'

function Home() {
  // Starts as the local fallback, shown at full sharpness — a real,
  // complete image, not a degraded placeholder, so no blur applies to it.
  const [heroDisplayURL, setHeroDisplayURL] = useState(defaultHomeImage)
  const [heroSharp, setHeroSharp] = useState(true)
  // Only gates the page on the Firestore fetch itself (fast, low-risk) —
  // never on images. Images load in the background and swap in whenever
  // they're ready, so one slow/broken photo can't hang the whole page.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
      const data = snapshot.exists() ? snapshot.data() : {}
      const fullURL = data.imageURL || defaultHomeImage
      const thumbnailURL = data.thumbnailURL || ''

      if (thumbnailURL) {
        // Blurred thumbnail is already in hand (embedded in this same doc,
        // no extra request) — show it right away.
        setHeroDisplayURL(thumbnailURL)
        setHeroSharp(false)
      }
      setLoading(false)

      // Full photo loads in the background and swaps in whenever it's
      // ready — doesn't block the page from showing in the meantime.
      preloadImages([fullURL]).then(() => {
        setHeroDisplayURL(fullURL)
        setHeroSharp(true)
      })
    }

    load()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div>
      <div className="h-dvh flex flex-col">
        <Navbar />
        <Hero imageURL={heroDisplayURL} sharp={heroSharp} />
      </div>
      <AboutPreview />
      <ProductsPreview />
      <Footer />
    </div>
  )
}

export default Home
