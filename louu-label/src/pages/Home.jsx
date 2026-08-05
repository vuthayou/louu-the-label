import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { preloadImages } from '../utils/preloadImages'
import { readCache, writeCache } from '../utils/cache'
import defaultHomeImage from '../assets/home.jpeg'
import PageLayout from '../components/PageLayout'
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
  const cachedLayout = readCache('homeLayout')
  const cachedAboutPhoto = readCache('aboutPreviewPhoto')
  const cachedProductsPhoto = readCache('productsPreviewPhoto')

  // On a repeat visit, start directly from the full cached photo, already
  // sharp — the browser almost certainly has it in its own HTTP cache
  // (Storage uploads set a long Cache-Control), so there's no reason to
  // blur it. The blur-up thumbnail is only for a genuine first-ever visit,
  // when nothing is cached anywhere yet — see the effect below.
  const [heroDisplayURL, setHeroDisplayURL] = useState(() =>
    cachedHero ? pickFullURL(cachedHero) : defaultHomeImage,
  )
  const [heroSharp, setHeroSharp] = useState(() => Boolean(cachedHero))
  // Secondary, non-blocking content (same treatment as Catalog's background
  // photo) — starts from whatever's cached and quietly fills in once the
  // fetch below resolves, rather than gating the loading screen on it.
  const [aboutPreviewText, setAboutPreviewText] = useState(() => cachedLayout?.aboutPreviewText || '')
  const [productsPreviewText, setProductsPreviewText] = useState(
    () => cachedLayout?.productsPreviewText || '',
  )
  // Same non-blocking treatment — no blur-up thumbnail step for these
  // smaller decorative photos, unlike the main Hero photo; they just show
  // once ready, or the existing gray placeholder box until then.
  const [aboutPreviewPhotoURL, setAboutPreviewPhotoURL] = useState(() =>
    cachedAboutPhoto ? pickFullURL(cachedAboutPhoto) : '',
  )
  const [productsPreviewPhotoURL, setProductsPreviewPhotoURL] = useState(() =>
    cachedProductsPhoto ? pickFullURL(cachedProductsPhoto) : '',
  )
  const [loading, setLoading] = useState(() => !cachedHero)

  useEffect(() => {
    async function load() {
      const [heroSnapshot, layoutSnapshot, aboutPhotoSnapshot, productsPhotoSnapshot] = await Promise.all([
        getDoc(doc(db, 'siteSettings', 'hero')),
        getDoc(doc(db, 'siteSettings', 'homeLayout')),
        getDoc(doc(db, 'siteSettings', 'aboutPreviewPhoto')),
        getDoc(doc(db, 'siteSettings', 'productsPreviewPhoto')),
      ])
      const data = heroSnapshot.exists() ? heroSnapshot.data() : {}
      writeCache('hero', data)
      const fullURL = pickFullURL(data)

      const layoutData = layoutSnapshot.exists() ? layoutSnapshot.data() : {}
      writeCache('homeLayout', layoutData)
      setAboutPreviewText(layoutData.aboutPreviewText || '')
      setProductsPreviewText(layoutData.productsPreviewText || '')

      const aboutPhotoData = aboutPhotoSnapshot.exists() ? aboutPhotoSnapshot.data() : {}
      writeCache('aboutPreviewPhoto', aboutPhotoData)
      setAboutPreviewPhotoURL(aboutPhotoData.imageURL ? pickFullURL(aboutPhotoData) : '')

      const productsPhotoData = productsPhotoSnapshot.exists() ? productsPhotoSnapshot.data() : {}
      writeCache('productsPreviewPhoto', productsPhotoData)
      setProductsPreviewPhotoURL(productsPhotoData.imageURL ? pickFullURL(productsPhotoData) : '')

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
    <PageLayout>
      <div className="h-dvh flex flex-col">
        <Hero imageURL={heroDisplayURL} sharp={heroSharp} />
      </div>
      <AboutPreview description={aboutPreviewText} imageURL={aboutPreviewPhotoURL} />
      <ProductsPreview description={productsPreviewText} imageURL={productsPreviewPhotoURL} />
    </PageLayout>
  )
}

export default Home
