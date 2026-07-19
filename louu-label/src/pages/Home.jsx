import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { preloadImages } from '../utils/preloadImages'
import { readCache, writeCache } from '../utils/cache'
import defaultHomeImage from '../assets/home.jpeg'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Hero from '../components/Hero'
import AboutPreview from '../components/AboutPreview'
import ProductsPreview from '../components/ProductsPreview'
import LoadingScreen from '../components/LoadingScreen'

// Below Tailwind's md breakpoint (768px, same one used site-wide), prefer
// the smaller variant if one was generated — a phone doesn't need to
// download the full desktop-resolution photo.
function pickFullURL(data) {
  const isMobileViewport = window.innerWidth < 768
  return (isMobileViewport ? data.smallImageURL : data.imageURL) || data.imageURL || defaultHomeImage
}

function Home() {
  // Read once per mount (not module scope — a module stays loaded across
  // client-side navigations within the same visit, so a module-level read
  // would go stale after the first load).
  const cachedHero = readCache('hero')

  // On a repeat visit, start directly from the last-known content instead
  // of the local fallback — skips the loading screen and the blur-up step
  // entirely, since we already have real data to show. A fresh fetch still
  // runs below and corrects anything if it's changed since last time.
  const [heroDisplayURL, setHeroDisplayURL] = useState(() =>
    cachedHero ? cachedHero.thumbnailURL || pickFullURL(cachedHero) : defaultHomeImage,
  )
  const [heroSharp, setHeroSharp] = useState(() => !(cachedHero && cachedHero.thumbnailURL))
  const [loading, setLoading] = useState(() => !cachedHero)

  useEffect(() => {
    async function load() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
      const data = snapshot.exists() ? snapshot.data() : {}
      writeCache('hero', data)

      const fullURL = pickFullURL(data)
      if (data.thumbnailURL) {
        // Blurred thumbnail is already in hand (embedded in this same doc,
        // no extra request) — show it right away.
        setHeroDisplayURL(data.thumbnailURL)
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
