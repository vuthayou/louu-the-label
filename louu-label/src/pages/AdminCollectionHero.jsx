import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { doc, getDoc, setDoc } from 'firebase/firestore/lite'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db } from '../firebase'
import { storage } from '../firebaseAdmin'
import { getCroppedImageBlob } from '../utils/cropImage'
import HeroImageManager from '../components/HeroImageManager'
import PhotoGridManager from '../components/PhotoGridManager'
import useModalA11y from '../hooks/useModalA11y'

const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900'
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
const focusRingText =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

const MAX_PHOTOS_PER_CATEGORY = 8

function AdminCollectionHero() {
  const [topsDescription, setTopsDescription] = useState('')
  const [topsPhotos, setTopsPhotos] = useState([])
  const [bottomsDescription, setBottomsDescription] = useState('')
  const [bottomsPhotos, setBottomsPhotos] = useState([])

  const [descSaving, setDescSaving] = useState(false)
  const [descSaved, setDescSaved] = useState(false)
  const [uploadingSlot, setUploadingSlot] = useState(null) // 'tops-0' | 'bottoms-0' | null

  // Shared crop popup state for both Tops and Bottoms — opens right after a
  // file is picked. cropAspect is always computed from that photo's own
  // natural dimensions (not a fixed ratio), so both categories keep the same
  // "different widths, same height" row effect on the live page.
  const [cropTarget, setCropTarget] = useState(null) // { category: 'tops' | 'bottoms', index: number } | null
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
        setTopsPhotos(data.topsPhotos || [])
        setBottomsDescription(data.bottomsDescription || '')
        // bottomsPhoto (singular) was the old single-photo field — fold it
        // into the new array so a photo uploaded before this change doesn't
        // just disappear.
        setBottomsPhotos(data.bottomsPhotos || (data.bottomsPhoto ? [data.bottomsPhoto] : []))
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

  const cropUploadingKey = cropTarget && `${cropTarget.category}-${cropTarget.index}`

  async function handleSaveDescriptions(e) {
    e.preventDefault()
    setDescSaving(true)
    setDescSaved(false)
    await setDoc(
      doc(db, 'siteSettings', 'collectionLayout'),
      { topsDescription, bottomsDescription },
      { merge: true },
    )
    setDescSaving(false)
    setDescSaved(true)
  }

  function openCropForSlot(category, index, file) {
    if (!file) return
    setCropTarget({ category, index })
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
    const { category, index } = cropTarget
    setUploadingSlot(`${category}-${index}`)
    try {
      const croppedBlob = await getCroppedImageBlob(cropPreviewURL, croppedAreaPixels)
      const imageRef = ref(storage, `site/collection-${category}-${index}-${Date.now()}-${cropFile.name}`)
      await uploadBytes(imageRef, croppedBlob)
      const url = await getDownloadURL(imageRef)
      if (category === 'tops') {
        const nextPhotos = [...topsPhotos]
        nextPhotos[index] = url
        setTopsPhotos(nextPhotos)
        await setDoc(doc(db, 'siteSettings', 'collectionLayout'), { topsPhotos: nextPhotos }, { merge: true })
      } else {
        const nextPhotos = [...bottomsPhotos]
        nextPhotos[index] = url
        setBottomsPhotos(nextPhotos)
        await setDoc(doc(db, 'siteSettings', 'collectionLayout'), { bottomsPhotos: nextPhotos }, { merge: true })
      }
      closeCropModal()
    } finally {
      setUploadingSlot(null)
    }
  }

  return (
    <div>
      <HeroImageManager settingId="collectionHero" storagePrefix="site/collection-hero" label="Collection" />

      <form onSubmit={handleSaveDescriptions} className="mt-12 max-w-md flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Section Content</h2>
        <div>
          <label className="text-sm text-gray-500 mb-2 block">Tops description</label>
          <textarea
            value={topsDescription}
            onChange={(e) => {
              setTopsDescription(e.target.value)
              setDescSaved(false)
            }}
            className={`w-full border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
          />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-2 block">Bottoms description</label>
          <textarea
            value={bottomsDescription}
            onChange={(e) => {
              setBottomsDescription(e.target.value)
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
        <h2 className="text-lg font-semibold mb-4">Tops Photos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Add up to {MAX_PHOTOS_PER_CATEGORY} photos for the row layout, one at a time. Click an
          existing photo to replace it. Each photo opens a crop/zoom popup that keeps that
          photo's own proportions, so widths still vary in the row.
        </p>
        <PhotoGridManager
          photos={topsPhotos}
          maxPhotos={MAX_PHOTOS_PER_CATEGORY}
          keyPrefix="tops"
          uploadingSlot={uploadingSlot}
          onSelectFile={(index, file) => openCropForSlot('tops', index, file)}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Bottoms Photos</h2>
        <p className="text-sm text-gray-500 mb-4">
          Same as Tops — add up to {MAX_PHOTOS_PER_CATEGORY} photos, one at a time, each keeping
          its own proportions in the row.
        </p>
        <PhotoGridManager
          photos={bottomsPhotos}
          maxPhotos={MAX_PHOTOS_PER_CATEGORY}
          keyPrefix="bottoms"
          uploadingSlot={uploadingSlot}
          onSelectFile={(index, file) => openCropForSlot('bottoms', index, file)}
        />
      </div>

      {cropTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={
              (cropTarget.category === 'tops' ? topsPhotos : bottomsPhotos)[cropTarget.index]
                ? 'Replace photo'
                : 'Add photo'
            }
            className="w-full max-w-lg bg-white rounded shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold mb-4">
              {(cropTarget.category === 'tops' ? topsPhotos : bottomsPhotos)[cropTarget.index]
                ? 'Replace photo'
                : 'Add photo'}
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
