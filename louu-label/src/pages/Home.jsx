import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Hero from '../components/Hero'

function Home() {
  const [heroImageURL, setHeroImageURL] = useState('')

  useEffect(() => {
    async function fetchHeroImage() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
      if (snapshot.exists()) {
        setHeroImageURL(snapshot.data().imageURL)
      }
    }

    fetchHeroImage()
  }, [])

  return (
    <div>
      <Navbar />
      <Hero imageURL={heroImageURL} />
      <Footer />
    </div>
  )
}

export default Home
