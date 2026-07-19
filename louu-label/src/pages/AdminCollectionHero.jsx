import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { getCroppedImageBlob } from '../utils/cropImage'
import HeroImageManager from '../components/HeroImageManager'

const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900'
const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
const focusRingText =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'
// For a hidden file input wrapped in a <label> — the input is the real focus
// target, so the visible ring has to key off :focus-within on the label.
const focusWithinRing = 'focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-2'

const MAX_TOPS_PHOTOS = 8

function AdminCollectionHero() {
  const [topsDescription, setTopsDescription] = useState('')
  const [topsPhotos, setTopsPhotos] = useState([])
  const [bottomsDescription, setBottomsDescription] = useState('')
  const [bottomsPhoto, setBottomsPhoto] = useState('')

  const [descSaving, setDescSaving] = useState(false)
  const [descSaved, setDescSaved] = useState(false)
  const [uploadingSlot, setUploadingSlot] = useState(null) // 'tops-0' | 'bottoms' | null

  // Tops crop popup state — opens right after a file is picked for a slot.
  // cropAspect is computed from that photo's own natural dimensions (not a
  // fixed ratio) so each Tops photo keeps its own proportions, same as the
  // scattered row on the live page.
  const [cropTarget, setCropTarget] = useState(null) // index of the slot being edited, or null when closed
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
        setBottomsPhoto(data.bottomsPhoto || '')
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

  function openCropForSlot(index, file) {
    if (!file) return
    setCropTarget(index)
    setCropFile(file)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  function closeCropModal() {
    setCropTarget(null)
    setCropFile(null)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  async function handleConfirmCrop() {
    if (!cropFile || !croppedAreaPixels || cropTarget === null) return
    const index = cropTarget
    setUploadingSlot(`tops-${index}`)
    try {
      const croppedBlob = await getCroppedImageBlob(cropPreviewURL, croppedAreaPixels)
      const imageRef = ref(storage, `site/collection-tops-${index}-${Date.now()}-${cropFile.name}`)
      await uploadBytes(imageRef, croppedBlob)
      const url = await getDownloadURL(imageRef)
      const nextPhotos = [...topsPhotos]
      nextPhotos[index] = url
      setTopsPhotos(nextPhotos)
      await setDoc(doc(db, 'siteSettings', 'collectionLayout'), { topsPhotos: nextPhotos }, { merge: true })
      closeCropModal()
    } finally {
      setUploadingSlot(null)
    }
  }

  async function handleUploadBottomsPhoto(file) {
    if (!file) return
    setUploadingSlot('bottoms')
    try {
      const imageRef = ref(storage, `site/collection-bottoms-${Date.now()}-${file.name}`)
      await uploadBytes(imageRef, file)
      const url = await getDownloadURL(imageRef)
      setBottomsPhoto(url)
      await setDoc(doc(db, 'siteSettings', 'collectionLayout'), { bottomsPhoto: url }, { merge: true })
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
          Add up to {MAX_TOPS_PHOTOS} photos for the scattered layout, one at a time. Click an
          existing photo to replace it. Each photo opens a crop/zoom popup that keeps that
          photo's own proportions, so widths still vary in the row.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {topsPhotos.map((photoUrl, i) =>
            photoUrl ? (
              <label
                key={i}
                className={`relative block aspect-square cursor-pointer group ${focusWithinRing}`}
              >
                <img src={photoUrl} alt={`Tops ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white text-sm opacity-0 transition-all duration-300 ease-in-out group-hover:bg-black/40 group-hover:opacity-100">
                  {uploadingSlot === `tops-${i}` ? 'Uploading...' : 'Replace'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    openCropForSlot(i, e.target.files[0])
                    e.target.value = ''
                  }}
                />
              </label>
            ) : null,
          )}
          {topsPhotos.filter(Boolean).length < MAX_TOPS_PHOTOS && (
            <label
              className={`aspect-square flex items-center justify-center border border-dashed border-gray-300 text-gray-400 text-sm cursor-pointer transition-all duration-300 ease-in-out hover:border-gray-500 hover:text-gray-500 ${focusWithinRing}`}
            >
              {uploadingSlot === `tops-${topsPhotos.filter(Boolean).length}` ? 'Uploading...' : '+ Add photo'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  openCropForSlot(topsPhotos.filter(Boolean).length, e.target.files[0])
                  e.target.value = ''
                }}
              />
            </label>
          )}
        </div>
      </div>

      {cropTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-white rounded shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {topsPhotos[cropTarget] ? 'Replace photo' : 'Add photo'}
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
                disabled={!cropAspect || uploadingSlot === `tops-${cropTarget}`}
                className={`bg-gray-900 text-white rounded px-4 py-2 text-sm hover:bg-gray-700 transition-all duration-300 ease-in-out disabled:opacity-50 ${focusRing}`}
              >
                {uploadingSlot === `tops-${cropTarget}` ? 'Uploading...' : 'Confirm'}
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

      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Bottoms Photo</h2>
        {bottomsPhoto && (
          <img
            src={bottomsPhoto}
            alt="Bottoms"
            className="w-full max-w-xs aspect-[4/5] object-cover mb-2"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleUploadBottomsPhoto(e.target.files[0])}
          className={`text-sm max-w-xs border border-gray-300 rounded px-4 py-2 transition-all duration-300 ease-in-out ${inputFocus}`}
        />
        {uploadingSlot === 'bottoms' && <p className="text-xs text-gray-500 mt-2">Uploading...</p>}
      </div>
    </div>
  )
}

export default AdminCollectionHero
