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
  const [heroImageURL, setHeroImageURL] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
      const url = snapshot.exists() ? snapshot.data().imageURL : ''
      // Preload whichever photo will actually render — the real one, or the
      // local fallback if no admin photo is set yet — so nothing shows
      // until it's fully downloaded, not just once its URL is known.
      await preloadImages([url || defaultHomeImage])
      setHeroImageURL(url)
      setLoading(false)
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
        <Hero imageURL={heroImageURL} />
      </div>
      <AboutPreview />
      <ProductsPreview />
      <Footer />
    </div>
  )
}

export default Home
