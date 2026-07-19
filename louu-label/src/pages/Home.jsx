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
  const [heroDisplayURL, setHeroDisplayURL] = useState('')
  const [heroSharp, setHeroSharp] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
      const data = snapshot.exists() ? snapshot.data() : {}
      const fullURL = data.imageURL || defaultHomeImage
      const thumbnailURL = data.thumbnailURL || ''

      if (thumbnailURL) {
        // Reveal immediately with the blurred thumbnail (already in hand,
        // no extra request needed), then swap to the full photo once it's
        // downloaded + decoded.
        setHeroDisplayURL(thumbnailURL)
        setLoading(false)
        await preloadImages([fullURL])
        setHeroDisplayURL(fullURL)
        setHeroSharp(true)
      } else {
        // No thumbnail (old photo, or the local fallback) — fall back to
        // waiting for the full photo before showing anything, same as
        // before, so there's still zero pop-in.
        await preloadImages([fullURL])
        setHeroDisplayURL(fullURL)
        setHeroSharp(true)
        setLoading(false)
      }
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
