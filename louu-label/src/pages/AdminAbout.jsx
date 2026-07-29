import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'

const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900'
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'

function AdminAbout() {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function fetchContent() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'about'))
      if (snapshot.exists()) {
        setContent(snapshot.data().content || '')
      }
    }
    fetchContent()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await setDoc(doc(db, 'siteSettings', 'about'), { content }, { merge: true })
    setSaving(false)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-4">
      <h2 className="text-lg font-semibold">About Us Content</h2>
      <div>
        <label className="text-sm text-gray-500 mb-2 block">Description</label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setSaved(false)
          }}
          rows={8}
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
  )
}

export default AdminAbout
