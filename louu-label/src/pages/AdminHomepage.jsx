import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import HeroImageManager from '../components/HeroImageManager'

const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900'
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'

function AdminHomepage() {
  const [aboutPreviewText, setAboutPreviewText] = useState('')
  const [productsPreviewText, setProductsPreviewText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchLayout() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'homeLayout'))
      if (snapshot.exists()) {
        const data = snapshot.data()
        setAboutPreviewText(data.aboutPreviewText || '')
        setProductsPreviewText(data.productsPreviewText || '')
      }
    }
    fetchLayout()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await setDoc(
      doc(db, 'siteSettings', 'homeLayout'),
      { aboutPreviewText, productsPreviewText },
      { merge: true },
    )
    setSaving(false)
    setSaved(true)
  }

  return (
    <div>
      <HeroImageManager
        settingId="hero"
        storagePrefix="site/hero"
        label="Homepage"
        objectPositionClass="object-[75%_15%]"
      />

      <form onSubmit={handleSubmit} className="mt-12 max-w-md flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Section Content</h2>
        <div>
          <label className="text-sm text-gray-500 mb-2 block">About Us preview text</label>
          <textarea
            value={aboutPreviewText}
            onChange={(e) => {
              setAboutPreviewText(e.target.value)
              setSaved(false)
            }}
            className={`w-full border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-2 block">Our Products preview text</label>
          <textarea
            value={productsPreviewText}
            onChange={(e) => {
              setProductsPreviewText(e.target.value)
              setSaved(false)
            }}
            className={`w-full border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className={`bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 self-start ${focusRing}`}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saved && <span className="text-sm text-gray-500">Saved.</span>}
        </div>
      </form>

      <div className="mt-12">
        <HeroImageManager
          settingId="aboutPreviewPhoto"
          storagePrefix="site/about-preview"
          label="About Us preview photo"
          cropAspect={4 / 5}
          previewAspectClass="aspect-[4/5]"
        />
      </div>

      <div className="mt-12">
        <HeroImageManager
          settingId="productsPreviewPhoto"
          storagePrefix="site/products-preview"
          label="Our Products preview photo"
          cropAspect={4 / 5}
          previewAspectClass="aspect-[4/5]"
        />
      </div>
    </div>
  )
}

export default AdminHomepage
