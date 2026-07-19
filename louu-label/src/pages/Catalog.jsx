import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ScatteredCategorySection from '../components/ScatteredCategorySection'

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
  const [backgroundPhoto, setBackgroundPhoto] = useState('')
  // Waits for both fetches before showing the real sections, rather than
  // flashing the fallback placeholder text/colors and then swapping —
  // same fix already applied to the Home page's hero photo. The background
  // photo isn't gated by this at all, so Navbar + background show first,
  // and the placeholder below stays transparent so it doesn't cover the
  // background photo while the Tops/Bottoms content is still loading.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLayout() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'collectionLayout'))
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (data.topsDescription) setTopsDescription(data.topsDescription)
        if (data.topsPhotos) setTopsPhotos(data.topsPhotos)
        if (data.bottomsDescription) setBottomsDescription(data.bottomsDescription)
        // bottomsPhotos is the current field; bottomsPhoto (singular) was the
        // old single-photo field, kept as a fallback so content saved before
        // this change still shows up.
        if (data.bottomsPhotos) setBottomsPhotos(data.bottomsPhotos)
        else if (data.bottomsPhoto) setBottomsPhotos([data.bottomsPhoto])
      }
    }

    async function fetchBackground() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'collectionHero'))
      if (snapshot.exists()) {
        setBackgroundPhoto(snapshot.data().imageURL)
      }
    }

    Promise.all([fetchLayout(), fetchBackground()]).then(() => setLoading(false))
  }, [])

  return (
    <div className="relative">
      {backgroundPhoto && (
        <img
          src={backgroundPhoto}
          alt=""
          aria-hidden="true"
          className="fixed inset-0 w-full h-full object-cover opacity-25 -z-10"
        />
      )}
      <Navbar />
      {loading ? (
        <div className="min-h-svh" />
      ) : (
        <>
          <ScatteredCategorySection title="Tops" description={topsDescription} photos={topsPhotos} />
          <ScatteredCategorySection title="Bottoms" description={bottomsDescription} photos={bottomsPhotos} />
        </>
      )}
      <Footer />
    </div>
  )
}

export default Catalog
