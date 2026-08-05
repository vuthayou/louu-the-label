import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { readCache, writeCache } from '../utils/cache'
import PageLayout from '../components/PageLayout'
import LoadingScreen from '../components/LoadingScreen'

const FALLBACK_CONTENT = 'Coming soon.'

function About() {
  const cachedContent = readCache('about')
  const [content, setContent] = useState(() =>
    cachedContent ? cachedContent.content || FALLBACK_CONTENT : FALLBACK_CONTENT,
  )
  const [loading, setLoading] = useState(() => !cachedContent)

  useEffect(() => {
    async function load() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'about'))
      const data = snapshot.exists() ? snapshot.data() : {}
      writeCache('about', data)
      setContent(data.content || FALLBACK_CONTENT)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold mb-4">ABOUT US</h1>
        <p className="text-gray-500 whitespace-pre-line">{content}</p>
      </div>
    </PageLayout>
  )
}

export default About
