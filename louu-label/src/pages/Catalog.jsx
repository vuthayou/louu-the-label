import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { preloadImages } from '../utils/preloadImages'
import { readCache, writeCache } from '../utils/cache'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScatteredCategorySection from '../components/ScatteredCategorySection'
import LoadingScreen from '../components/LoadingScreen'

const FALLBACK_DESCRIPTION_TOPS =
  'Placeholder introduction text — a short teaser about the Tops collection goes here.'
const FALLBACK_DESCRIPTION_BOTTOMS =
  'Placeholder introduction text — a short teaser about the Bottoms collection goes here.'

// Normalizes a raw collectionLayout doc (or null, if none cached/saved yet)
// into the four values the page actually needs — used for both cached and
// freshly-fetched data so the fallback/migration logic only lives once.
function deriveLayout(data) {
  let topsDescription = FALLBACK_DESCRIPTION_TOPS
  let topsPhotos = []
  let bottomsDescription = FALLBACK_DESCRIPTION_BOTTOMS
  let bottomsPhotos = []
  if (data) {
    if (data.topsDescription) topsDescription = data.topsDescription
    if (data.topsPhotos) topsPhotos = data.topsPhotos
    if (data.bottomsDescription) bottomsDescription = data.bottomsDescription
    // bottomsPhotos is the current field; bottomsPhoto (singular) was the
    // old single-photo field, kept as a fallback so content saved before
    // this change still shows up.
    if (data.bottomsPhotos) bottomsPhotos = data.bottomsPhotos
    else if (data.bottomsPhoto) bottomsPhotos = [data.bottomsPhoto]
  }
  return { topsDescription, topsPhotos, bottomsDescription, bottomsPhotos }
}

// Below Tailwind's md breakpoint (768px, same one used site-wide), prefer
// the smaller variant if one was generated.
function pickBackgroundURL(data) {
  const isMobileViewport = window.innerWidth < 768
  return (isMobileViewport ? data.smallImageURL : data.imageURL) || data.imageURL || ''
}

function Catalog() {
  // Read once per mount (not module scope — a module stays loaded across
  // client-side navigations within the same visit, so a module-level read
  // would go stale after the first load).
  const cachedLayout = readCache('collectionLayout')
  const cachedBackground = readCache('collectionHero')
  const initialLayout = deriveLayout(cachedLayout)

  // On a repeat visit, start directly from the last-known content instead
  // of placeholders — skips the loading screen entirely, since we already
  // have real data to show. A fresh fetch still runs below and corrects
  // anything if it's changed since last time.
  const [topsDescription, setTopsDescription] = useState(initialLayout.topsDescription)
  const [topsPhotos, setTopsPhotos] = useState(initialLayout.topsPhotos)
  const [bottomsDescription, setBottomsDescription] = useState(initialLayout.bottomsDescription)
  const [bottomsPhotos, setBottomsPhotos] = useState(initialLayout.bottomsPhotos)
  // Same reasoning as Home's hero photo: a repeat visit goes straight to
  // the full cached photo, already sharp, trusting the browser's own HTTP
  // cache (Storage uploads set a long Cache-Control) — blur-up is only for
  // a genuine first-ever visit, when nothing is cached anywhere yet.
  const [backgroundDisplayURL, setBackgroundDisplayURL] = useState(() =>
    cachedBackground ? pickBackgroundURL(cachedBackground) : '',
  )
  const [backgroundSharp, setBackgroundSharp] = useState(() => Boolean(cachedBackground))
  // Gated on the layout cache specifically — that's the content
  // (title/description/photos) that actually defines "is there something
  // real to show yet." The background photo has always been a secondary,
  // non-blocking enhancement.
  const [loading, setLoading] = useState(() => !cachedLayout)

  useEffect(() => {
    async function load() {
      const [layoutSnapshot, backgroundSnapshot] = await Promise.all([
        getDoc(doc(db, 'siteSettings', 'collectionLayout')),
        getDoc(doc(db, 'siteSettings', 'collectionHero')),
      ])

      const layoutData = layoutSnapshot.exists() ? layoutSnapshot.data() : null
      writeCache('collectionLayout', layoutData)
      const layout = deriveLayout(layoutData)
      setTopsDescription(layout.topsDescription)
      setTopsPhotos(layout.topsPhotos)
      setBottomsDescription(layout.bottomsDescription)
      setBottomsPhotos(layout.bottomsPhotos)

      const backgroundData = backgroundSnapshot.exists() ? backgroundSnapshot.data() : {}
      writeCache('collectionHero', backgroundData)
      const backgroundFullURL = pickBackgroundURL(backgroundData)

      if (!cachedBackground) {
        // Genuine first visit — nothing real shown yet. Show the blurred
        // thumbnail (if any) while the full photo downloads, then sharpen.
        if (backgroundData.thumbnailURL) {
          setBackgroundDisplayURL(backgroundData.thumbnailURL)
          setBackgroundSharp(false)
        }
        if (backgroundFullURL) {
          preloadImages([backgroundFullURL]).then(() => {
            setBackgroundDisplayURL(backgroundFullURL)
            setBackgroundSharp(true)
          })
        }
      } else if (backgroundFullURL && backgroundFullURL !== pickBackgroundURL(cachedBackground)) {
        // Repeat visit, but the photo actually changed since last time —
        // quietly swap once the new one is ready. Already showing
        // something real and sharp, so no blur step here.
        preloadImages([backgroundFullURL]).then(() => {
          setBackgroundDisplayURL(backgroundFullURL)
        })
      }

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div className="relative">
      {backgroundDisplayURL && (
        <img
          src={backgroundDisplayURL}
          alt=""
          aria-hidden="true"
          className={`fixed inset-0 w-full h-full object-cover opacity-25 -z-10 transition-all duration-300 ease-in-out ${backgroundSharp ? 'blur-none scale-100' : 'blur-xl scale-110'}`}
        />
      )}
      <Navbar />
      <ScatteredCategorySection title="Tops" description={topsDescription} photos={topsPhotos} />
      <ScatteredCategorySection title="Bottoms" description={bottomsDescription} photos={bottomsPhotos} />
      <Footer />
    </div>
  )
}

export default Catalog
