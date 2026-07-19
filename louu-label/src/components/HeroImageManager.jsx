import { useCallback, useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { doc, getDoc, setDoc } from 'firebase/firestore/lite'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db } from '../firebase'
import { storage } from '../firebaseAdmin'
import { getCroppedImageBlob, getCroppedThumbnailDataURL } from '../utils/cropImage'
import useModalA11y from '../hooks/useModalA11y'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
const focusRingText =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

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
  const fileInputRef = useRef(null)

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
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setError('')
  }

  const closeCropModal = useCallback(() => {
    setImageFile(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const modalRef = useModalA11y(Boolean(previewURL), closeCropModal)

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirmCrop() {
    if (!imageFile || !croppedAreaPixels) {
      setError('Please adjust the crop.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const croppedBlob = await getCroppedImageBlob(previewURL, croppedAreaPixels)
      const thumbnailURL = await getCroppedThumbnailDataURL(previewURL, croppedAreaPixels)
      const imageRef = ref(storage, `${storagePrefix}-${Date.now()}-${imageFile.name}`)
      await uploadBytes(imageRef, croppedBlob)
      const newImageURL = await getDownloadURL(imageRef)
      await setDoc(doc(db, 'siteSettings', settingId), { imageURL: newImageURL, thumbnailURL })
      setImageURL(newImageURL)
      closeCropModal()
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

      <div className="flex flex-col gap-4 max-w-md">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
        />

        {imageURL && (
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
        )}
      </div>

      {previewURL && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Update ${label.toLowerCase()} photo`}
            className="w-full max-w-lg bg-white rounded shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Update {label.toLowerCase()} photo</h3>
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
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex items-center gap-4 mt-4">
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={uploading}
                className={`bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 ${focusRing}`}
              >
                {uploading ? 'Uploading...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={closeCropModal}
                className={`text-sm text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRingText}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HeroImageManager
