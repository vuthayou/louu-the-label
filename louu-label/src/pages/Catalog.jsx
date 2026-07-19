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
  // Nothing renders — not even Navbar — until the Firestore fetches AND
  // every Tops/Bottoms photo has fully downloaded, so that content appears
  // at once with zero pop-in. The background photo is the one exception: if
  // it has a thumbnail, it shows blurred immediately and sharpens in behind
  // the rest, instead of blocking the reveal too.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [layoutSnapshot, backgroundSnapshot] = await Promise.all([
        getDoc(doc(db, 'siteSettings', 'collectionLayout')),
        getDoc(doc(db, 'siteSettings', 'collectionHero')),
      ])

      let nextTopsDescription = FALLBACK_DESCRIPTION_TOPS
      let nextTopsPhotos = []
      let nextBottomsDescription = FALLBACK_DESCRIPTION_BOTTOMS
      let nextBottomsPhotos = []

      if (layoutSnapshot.exists()) {
        const data = layoutSnapshot.data()
        if (data.topsDescription) nextTopsDescription = data.topsDescription
        if (data.topsPhotos) nextTopsPhotos = data.topsPhotos
        if (data.bottomsDescription) nextBottomsDescription = data.bottomsDescription
        // bottomsPhotos is the current field; bottomsPhoto (singular) was the
        // old single-photo field, kept as a fallback so content saved before
        // this change still shows up.
        if (data.bottomsPhotos) nextBottomsPhotos = data.bottomsPhotos
        else if (data.bottomsPhoto) nextBottomsPhotos = [data.bottomsPhoto]
      }

      const backgroundData = backgroundSnapshot.exists() ? backgroundSnapshot.data() : {}
      const backgroundFullURL = backgroundData.imageURL || ''
      const backgroundThumbnailURL = backgroundData.thumbnailURL || ''

      if (backgroundThumbnailURL) {
        setBackgroundDisplayURL(backgroundThumbnailURL)
      }

      // Tops/Bottoms still fully block the reveal. The background's full
      // photo only blocks it too if there's no thumbnail to show meanwhile.
      await preloadImages([
        ...nextTopsPhotos,
        ...nextBottomsPhotos,
        ...(backgroundThumbnailURL ? [] : [backgroundFullURL]),
      ])

      setTopsDescription(nextTopsDescription)
      setTopsPhotos(nextTopsPhotos)
      setBottomsDescription(nextBottomsDescription)
      setBottomsPhotos(nextBottomsPhotos)
      if (!backgroundThumbnailURL) {
        setBackgroundDisplayURL(backgroundFullURL)
        setBackgroundSharp(true)
      }
      setLoading(false)

      if (backgroundThumbnailURL) {
        await preloadImages([backgroundFullURL])
        setBackgroundDisplayURL(backgroundFullURL)
        setBackgroundSharp(true)
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
