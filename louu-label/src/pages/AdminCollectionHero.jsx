import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { doc, getDoc, setDoc } from 'firebase/firestore/lite'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db } from '../firebase'
import { storage } from '../firebaseAdmin'
import { deriveGalleryPhotos } from '../utils/galleryPhotos'
import {
  getCroppedImageBlob,
  SMALL_PHOTO_MAX_SIZE,
  LARGE_PHOTO_MAX_SIZE,
  LONG_CACHE_METADATA,
} from '../utils/cropImage'
import HeroImageManager from '../components/HeroImageManager'
import PhotoGridManager from '../components/PhotoGridManager'
import useModalA11y from '../hooks/useModalA11y'

const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900'
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
const focusRingText =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

// 16 keeps the same total capacity the old separate Tops (8) + Bottoms (8)
// managers had combined, now that they're one list.
const MAX_GALLERY_PHOTOS = 16

function AdminCollectionHero() {
  const [topsDescription, setTopsDescription] = useState('')
  const [galleryPhotos, setGalleryPhotos] = useState([])

  const [descSaving, setDescSaving] = useState(false)
  const [descSaved, setDescSaved] = useState(false)
  const [uploadingSlot, setUploadingSlot] = useState(null) // 'gallery-0' | null

  // Crop popup state — opens right after a file is picked. cropAspect is
  // always computed from that photo's own natural dimensions (not a fixed
  // ratio), so the row still shows each photo at its own natural width on
  // the live page.
  const [cropTarget, setCropTarget] = useState(null) // { index: number } | null
  const [cropFile, setCropFile] = useState(null)
  const [cropPreviewURL, setCropPreviewURL] = useState('')
  const [cropAspect, setCropAspect] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    async function fetchLayout() {
      const snapshot = await getDoc(doc(db, 'siteSettings', 'collectionLayout'))
      if (snapshot.exists()) {
        const data = snapshot.data()
        setTopsDescription(data.topsDescription || '')
        // Combines the old separate topsPhotos/bottomsPhotos (or even older
        // singular bottomsPhoto) into one list the first time this loads
        // after the Tops/Bottoms managers were merged, so nothing already
        // uploaded disappears or needs re-uploading.
        setGalleryPhotos(deriveGalleryPhotos(data))
      }
    }
    fetchLayout()
  }, [])

  useEffect(() => {
    if (!cropFile) {
      setCropPreviewURL('')
      setCropAspect(null)
      return
    }
    const objectURL = URL.createObjectURL(cropFile)
    setCropPreviewURL(objectURL)
    const image = new Image()
    image.onload = () => setCropAspect(image.naturalWidth / image.naturalHeight)
    image.src = objectURL
    return () => URL.revokeObjectURL(objectURL)
  }, [cropFile])

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const cropUploadingKey = cropTarget && `gallery-${cropTarget.index}`

  async function handleSaveDescriptions(e) {
    e.preventDefault()
    setDescSaving(true)
    setDescSaved(false)
    await setDoc(doc(db, 'siteSettings', 'collectionLayout'), { topsDescription }, { merge: true })
    setDescSaving(false)
    setDescSaved(true)
  }

  function openCropForSlot(index, file) {
    if (!file) return
    setCropTarget({ index })
    setCropFile(file)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  const closeCropModal = useCallback(() => {
    setCropTarget(null)
    setCropFile(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }, [])

  const modalRef = useModalA11y(Boolean(cropTarget), closeCropModal)

  async function handleConfirmCrop() {
    if (!cropFile || !croppedAreaPixels || !cropTarget) return
    const { index } = cropTarget
    setUploadingSlot(`gallery-${index}`)
    try {
      const [smallBlob, largeBlob] = await Promise.all([
        getCroppedImageBlob(cropPreviewURL, croppedAreaPixels, SMALL_PHOTO_MAX_SIZE),
        getCroppedImageBlob(cropPreviewURL, croppedAreaPixels, LARGE_PHOTO_MAX_SIZE),
      ])
      const smallRef = ref(storage, `site/collection-gallery-${index}-${Date.now()}-small-${cropFile.name}`)
      const largeRef = ref(storage, `site/collection-gallery-${index}-${Date.now()}-large-${cropFile.name}`)
      await Promise.all([
        uploadBytes(smallRef, smallBlob, LONG_CACHE_METADATA),
        uploadBytes(largeRef, largeBlob, LONG_CACHE_METADATA),
      ])
      const [small, large] = await Promise.all([getDownloadURL(smallRef), getDownloadURL(largeRef)])
      const nextPhotos = [...galleryPhotos]
      nextPhotos[index] = { small, large }
      setGalleryPhotos(nextPhotos)
      await setDoc(doc(db, 'siteSettings', 'collectionLayout'), { galleryPhotos: nextPhotos }, { merge: true })
      closeCropModal()
    } finally {
      setUploadingSlot(null)
    }
  }

  async function handleRemovePhoto(index) {
    if (!window.confirm('Remove this photo? This cannot be undone.')) return
    const nextPhotos = galleryPhotos.filter((_, i) => i !== index)
    setGalleryPhotos(nextPhotos)
    await setDoc(doc(db, 'siteSettings', 'collectionLayout'), { galleryPhotos: nextPhotos }, { merge: true })
  }

  return (
    <div>
      <HeroImageManager settingId="collectionHero" storagePrefix="site/collection-hero" label="Collection" />

      <form onSubmit={handleSaveDescriptions} className="mt-12 max-w-md flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Section Content</h2>
        <div>
          <label className="text-sm text-gray-500 mb-2 block">Description</label>
          <textarea
            value={topsDescription}
            onChange={(e) => {
              setTopsDescription(e.target.value)
              setDescSaved(false)
            }}
            className={`w-full border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={descSaving}
            className={`bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 self-start ${focusRing}`}
          >
            {descSaving ? 'Saving...' : 'Save descriptions'}
          </button>
          {descSaved && <span className="text-sm text-gray-500">Saved.</span>}
        </div>
      </form>

      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Gallery Photos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add up to {MAX_GALLERY_PHOTOS} photos for the row layout, one at a time. Click an
          existing photo to replace it. Each photo opens a crop/zoom popup that keeps that
          photo's own proportions, so widths still vary in the row.
        </p>
        <PhotoGridManager
          photos={galleryPhotos}
          maxPhotos={MAX_GALLERY_PHOTOS}
          keyPrefix="gallery"
          uploadingSlot={uploadingSlot}
          onSelectFile={openCropForSlot}
          onRemove={handleRemovePhoto}
        />
      </div>

      {cropTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={galleryPhotos[cropTarget.index] ? 'Replace photo' : 'Add photo'}
            className="w-full max-w-lg bg-white rounded shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">
              {galleryPhotos[cropTarget.index] ? 'Replace photo' : 'Add photo'}
            </h3>
            {cropAspect ? (
              <>
                <p className="text-sm text-gray-500 mb-2">
                  Drag to move, scroll or pinch to zoom — the crop keeps this photo's own
                  proportions.
                </p>
                <div className="relative w-full h-[60vh] bg-gray-100 rounded overflow-hidden">
                  <Cropper
                    image={cropPreviewURL}
                    crop={crop}
                    zoom={zoom}
                    aspect={cropAspect}
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
              </>
            ) : (
              <p className="text-sm text-gray-500">Loading photo...</p>
            )}
            <div className="flex items-center gap-4 mt-4">
              <button
                type="button"
                onClick={handleConfirmCrop}
                disabled={!cropAspect || uploadingSlot === cropUploadingKey}
                className={`bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 ${focusRing}`}
              >
                {uploadingSlot === cropUploadingKey ? 'Uploading...' : 'Confirm'}
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

export default AdminCollectionHero
