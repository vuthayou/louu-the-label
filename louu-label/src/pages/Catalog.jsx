import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { preloadImages } from '../utils/preloadImages'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScatteredCategorySection from '../components/ScatteredCategorySection'
import LoadingScreen from '../components/LoadingScreen'

const FALLBACK_DESCRIPTION_TOPS =
  'Placeholder introduction text — a short teaser about the Tops collection goes here.'
const FALLBACK_DESCRIPTION_BOTTOMS =
  'Placeholder introduction text — a short teaser about the Bottoms collection goes here.'

function Catalog() {
  // All admin-controlled (Admin > Collection tab). Falls back to placeholder
  // text/empty photos until the admin has ever saved real content.
  const [topsDescription, setTopsDescription] = useState(FALLBACK_DESCRIPTION_TOPS)
  const [topsPhotos, setTopsPhotos] = useState([])
  const [bottomsDescription, setBottomsDescription] = useState(FALLBACK_DESCRIPTION_BOTTOMS)
  const [bottomsPhotos, setBottomsPhotos] = useState([])
  const [backgroundDisplayURL, setBackgroundDisplayURL] = useState('')
  const [backgroundSharp, setBackgroundSharp] = useState(false)
  // Only gates the page on the Firestore fetches themselves (fast,
  // low-risk) — never on the Tops/Bottoms photos or the background photo.
  // Those load in the background and pop in as they're ready, the normal
  // way browsers handle images, so one slow/broken photo can't hang the
  // whole page.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [layoutSnapshot, backgroundSnapshot] = await Promise.all([
        getDoc(doc(db, 'siteSettings', 'collectionLayout')),
        getDoc(doc(db, 'siteSettings', 'collectionHero')),
      ])

      if (layoutSnapshot.exists()) {
        const data = layoutSnapshot.data()
        if (data.topsDescription) setTopsDescription(data.topsDescription)
        if (data.topsPhotos) setTopsPhotos(data.topsPhotos)
        if (data.bottomsDescription) setBottomsDescription(data.bottomsDescription)
        // bottomsPhotos is the current field; bottomsPhoto (singular) was the
        // old single-photo field, kept as a fallback so content saved before
        // this change still shows up.
        if (data.bottomsPhotos) setBottomsPhotos(data.bottomsPhotos)
        else if (data.bottomsPhoto) setBottomsPhotos([data.bottomsPhoto])
      }

      const backgroundData = backgroundSnapshot.exists() ? backgroundSnapshot.data() : {}
      const backgroundFullURL = backgroundData.imageURL || ''
      const backgroundThumbnailURL = backgroundData.thumbnailURL || ''

      if (backgroundThumbnailURL) {
        setBackgroundDisplayURL(backgroundThumbnailURL)
      }

      setLoading(false)

      // Full background photo loads in the background and swaps in
      // whenever it's ready — doesn't block the page from showing.
      if (backgroundFullURL) {
        preloadImages([backgroundFullURL]).then(() => {
          setBackgroundDisplayURL(backgroundFullURL)
          setBackgroundSharp(true)
        })
      }
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
