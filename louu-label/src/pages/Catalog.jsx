import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CategoryInfoSection from '../components/CategoryInfoSection'
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
  const [bottomsPhoto, setBottomsPhoto] = useState('')
  const [backgroundPhoto, setBackgroundPhoto] = useState('')

  useEffect(() => {
    async function fetchLayout() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'collectionLayout'))
      if (snapshot.exists()) {
        const data = snapshot.data()
        if (data.topsDescription) setTopsDescription(data.topsDescription)
        if (data.topsPhotos) setTopsPhotos(data.topsPhotos)
        if (data.bottomsDescription) setBottomsDescription(data.bottomsDescription)
        if (data.bottomsPhoto) setBottomsPhoto(data.bottomsPhoto)
      }
    }

    async function fetchBackground() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'collectionHero'))
      if (snapshot.exists()) {
        setBackgroundPhoto(snapshot.data().imageURL)
      }
    }

    fetchLayout()
    fetchBackground()
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
      <ScatteredCategorySection title="Tops" description={topsDescription} photos={topsPhotos} />
      <CategoryInfoSection
        title="Bottoms"
        description={bottomsDescription}
        photo={bottomsPhoto}
        imageFirst
      />
      <Footer />
    </div>
  )
}

export default Catalog
