import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Hero from '../components/Hero'

function Home() {
  const [heroImageURL, setHeroImageURL] = useState('')
  const [heroLoading, setHeroLoading] = useState(true)

  useEffect(() => {
    async function fetchHeroImage() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
      if (snapshot.exists()) {
        setHeroImageURL(snapshot.data().imageURL)
      }
      setHeroLoading(false)
    }

    fetchHeroImage()
  }, [])

  return (
    <div>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        {/* Wait for the real photo before showing anything, rather than
            flashing the local fallback and then swapping to it. */}
        {heroLoading ? <div className="flex-1 bg-gray-100" /> : <Hero imageURL={heroImageURL} />}
      </div>
      <Footer />
    </div>
  )
}

export default Home
