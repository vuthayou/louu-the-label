import { useCallback, useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

// Draws just the selected crop rectangle onto a canvas and reads it back out
// as a Blob — this is how react-easy-crop's on-screen crop selection turns
// into an actual new image file. imageSrc must be same-origin (a local
// blob: URL from a freshly-picked file works; a remote Storage URL can hit
// browser CORS restrictions on canvas reads), which is why this is only
// ever called on a newly-selected file, never the already-uploaded photo.
function getCroppedImageBlob(imageSrc, cropPixels) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = cropPixels.width
      canvas.height = cropPixels.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        cropPixels.x,
        cropPixels.y,
        cropPixels.width,
        cropPixels.height,
        0,
        0,
        cropPixels.width,
        cropPixels.height,
      )
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas is empty'))
      }, 'image/jpeg')
    }
    image.onerror = reject
    image.src = imageSrc
  })
}

function AdminHomepage() {
  const [heroImageURL, setHeroImageURL] = useState('')
  const [heroImageFile, setHeroImageFile] = useState(null)
  const [previewURL, setPreviewURL] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  // Interactive crop state, driven by the Cropper component below.
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  useEffect(() => {
    fetchHeroImage()
  }, [])

  // Lets the cropper (and fallback preview) work off a newly-picked file
  // before it's actually uploaded. createObjectURL makes a temporary local
  // URL for the file sitting in the browser's memory; it must be revoked
  // when no longer needed or it leaks memory.
  useEffect(() => {
    if (!heroImageFile) {
      setPreviewURL('')
      return
    }
    const objectURL = URL.createObjectURL(heroImageFile)
    setPreviewURL(objectURL)
    return () => URL.revokeObjectURL(objectURL)
  }, [heroImageFile])

  async function fetchHeroImage() {
    const snapshot = await getDoc(doc(db, 'siteSettings', 'hero'))
    if (snapshot.exists()) {
      setHeroImageURL(snapshot.data().imageURL)
    }
  }

  function handleFileChange(e) {
    setHeroImageFile(e.target.files[0])
    // Reset crop/zoom for the new image rather than carrying over the
    // previous photo's positioning.
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
  }

  // react-easy-crop calls this whenever the crop settles (after a drag or
  // zoom), handing back the selection in actual image pixels — that's what
  // getCroppedImageBlob needs to cut out the final image.
  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!heroImageFile || !croppedAreaPixels) {
      setError('Please choose an image and adjust the crop.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const croppedBlob = await getCroppedImageBlob(previewURL, croppedAreaPixels)
      const imageRef = ref(storage, `site/hero-${Date.now()}-${heroImageFile.name}`)
      await uploadBytes(imageRef, croppedBlob)
      const imageURL = await getDownloadURL(imageRef)
      await setDoc(doc(db, 'siteSettings', 'hero'), { imageURL })
      setHeroImageURL(imageURL)
      setHeroImageFile(null)
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
      <h2 className="text-lg font-semibold mb-4">Homepage</h2>
      <p className="text-sm text-gray-500 mb-4">
        Recommended: landscape orientation, roughly 16:9 to 2:1, at least 1920px wide, and
        compressed to under ~500KB (JPEG or WebP) for fast loading.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border border-gray-300 rounded px-3 py-2"
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
                className="flex-1"
              />
            </label>
          </div>
        ) : (
          heroImageURL && (
            <div>
              <p className="text-sm text-gray-500 mb-2">
                Current live photo (choose a new file above to reposition/crop):
              </p>
              <div className="w-full aspect-video border border-gray-300 rounded overflow-hidden bg-gray-100">
                <img
                  src={heroImageURL}
                  alt="Current hero"
                  className="w-full h-full object-cover object-[75%_15%]"
                />
              </div>
            </div>
          )
        )}

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
