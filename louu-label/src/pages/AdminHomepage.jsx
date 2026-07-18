import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

function AdminHomepage() {
  const [heroImageURL, setHeroImageURL] = useState('')
  const [heroImageFile, setHeroImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHeroImage()
  }, [])

  async function fetchHeroImage() {
    const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
    if (snapshot.exists()) {
      setHeroImageURL(snapshot.data().imageURL)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!heroImageFile) {
      setError('Please choose an image.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const imageRef = ref(storage, `site/hero-${Date.now()}-${heroImageFile.name}`)
      await uploadBytes(imageRef, heroImageFile)
      const imageURL = await getDownloadURL(imageRef)
      await setDoc(doc(db, 'siteSettings', 'hero'), { imageURL })
      setHeroImageURL(imageURL)
      setHeroImageFile(null)
      e.target.reset()
    } catch {
      setError('Update failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Homepage</h2>
      {heroImageURL && (
        <img
          src={heroImageURL}
          alt="Current hero"
          className="w-full max-w-sm aspect-[16/9] object-cover rounded mb-4"
        />
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setHeroImageFile(e.target.files[0])}
          className="border border-gray-300 rounded px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="bg-gray-900 text-white rounded px-3 py-2 text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 self-start"
        >
          {uploading ? 'Uploading...' : 'Update hero photo'}
        </button>
      </form>
    </div>
  )
}

export default AdminHomepage
