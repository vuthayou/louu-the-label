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

  // On a repeat visit, start directly from the full cached photo, already
  // sharp — the browser almost certainly has it in its own HTTP cache
  // (Storage uploads set a long Cache-Control), so there's no reason to
  // blur it. The blur-up thumbnail is only for a genuine first-ever visit,
  // when nothing is cached anywhere yet — see the effect below.
  const [heroDisplayURL, setHeroDisplayURL] = useState(() =>
    cachedHero ? pickFullURL(cachedHero) : defaultHomeImage,
  )
  const [heroSharp, setHeroSharp] = useState(() => Boolean(cachedHero))
  const [loading, setLoading] = useState(() => !cachedHero)

  useEffect(() => {
    async function load() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
      const data = snapshot.exists() ? snapshot.data() : {}
      writeCache('hero', data)
      const fullURL = pickFullURL(data)

      if (!cachedHero) {
        // Genuine first visit — nothing real shown yet. Show the blurred
        // thumbnail (if any) while the full photo downloads, then sharpen.
        if (data.thumbnailURL) {
          setHeroDisplayURL(data.thumbnailURL)
          setHeroSharp(false)
        }
        setLoading(false)
        preloadImages([fullURL]).then(() => {
          setHeroDisplayURL(fullURL)
          setHeroSharp(true)
        })
      } else {
        setLoading(false)
        if (fullURL !== pickFullURL(cachedHero)) {
          // Repeat visit, but the photo actually changed since last time —
          // quietly swap once the new one is ready. Already showing
          // something real and sharp, so no blur step here.
          preloadImages([fullURL]).then(() => {
            setHeroDisplayURL(fullURL)
          })
        }
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
