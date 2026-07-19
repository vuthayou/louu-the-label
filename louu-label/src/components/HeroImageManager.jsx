import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { getCroppedImageBlob } from '../utils/cropImage'

// Reusable admin upload+crop flow for any page's hero-style banner image.
// settingId: the Firestore doc under siteSettings/ this manages.
// storagePrefix: the Storage path prefix uploads go under.
// label: display text.
// objectPositionClass: a Tailwind object-position class (e.g. "object-center"
// or "object-[75%_15%]") — a class string, not a raw CSS value, since inline
// styles aren't used in this project.
function HeroImageManager({
  settingId,
  storagePrefix,
  label,
  objectPositionClass = 'object-center',
}) {
  const [imageURL, setImageURL] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewURL, setPreviewURL] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    fetchImage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingId])

  useEffect(() => {
    if (!imageFile) {
      setPreviewURL('')
      return
    }
    const objectURL = URL.createObjectURL(imageFile)
    setPreviewURL(objectURL)
    return () => URL.revokeObjectURL(objectURL)
  }, [imageFile])

  async function fetchImage() {
    const snapshot = await getDoc(doc(db, 'siteSettings', settingId))
    if (snapshot.exists()) {
      setImageURL(snapshot.data().imageURL)
    }
  }

  function handleFileChange(e) {
    setImageFile(e.target.files[0])
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!imageFile || !croppedAreaPixels) {
      setError('Please choose an image and adjust the crop.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const croppedBlob = await getCroppedImageBlob(previewURL, croppedAreaPixels)
      const imageRef = ref(storage, `${storagePrefix}-${Date.now()}-${imageFile.name}`)
      await uploadBytes(imageRef, croppedBlob)
      const newImageURL = await getDownloadURL(imageRef)
      await setDoc(doc(db, 'siteSettings', settingId), { imageURL: newImageURL })
      setImageURL(newImageURL)
      setImageFile(null)
      setCroppedAreaPixels(null)
      e.target.reset()
    } catch {
      setError('Update failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{label}</h2>
      <p className="text-sm text-gray-500 mb-4">
        Recommended: landscape orientation, roughly 16:9 to 2:1, at least 1920px wide, and
        compressed to under ~500KB (JPEG or WebP) for fast loading.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
        />

        {previewURL ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              Drag to move, scroll or pinch to zoom — this is exactly what will show live:
            </p>
            <div className="relative w-full aspect-video bg-gray-100 rounded overflow-hidden">
              <Cropper
                image={previewURL}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-500 mt-2">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded-sm"
              />
            </label>
          </div>
        ) : (
          imageURL && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Current live photo (choose a new file above to reposition/crop):
              </p>
              <div className="w-full aspect-video border border-gray-300 rounded overflow-hidden bg-gray-100">
                <img
                  src={imageURL}
                  alt={`Current ${label} photo`}
                  className={`w-full h-full object-cover ${objectPositionClass}`}
                />
              </div>
            </div>
          )
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
        >
          {uploading ? 'Uploading...' : `Update ${label.toLowerCase()} photo`}
        </button>
      </form>
    </div>
  )
}

export default HeroImageManager
