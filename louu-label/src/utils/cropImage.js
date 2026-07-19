// Recommended max longest-edge sizes for the two responsive image variants
// generated at upload time — small for mobile, large for desktop. Same pair
// used for both Tops/Bottoms photos and Hero/background photos, kept here
// as the single source of truth.
export const SMALL_PHOTO_MAX_SIZE = 600
export const LARGE_PHOTO_MAX_SIZE = 1600

// Pass as the third argument to uploadBytes() for any admin-uploaded photo.
// Uploaded files are always saved under a fresh, unique, timestamped path
// (see the *Ref filenames at each call site), so a cached copy is never
// stale — a "replace" always uploads to a new URL rather than overwriting
// the old one. Safe to cache for a long time.
export const LONG_CACHE_METADATA = { cacheControl: 'public, max-age=31536000' }

// Draws just the selected crop rectangle onto a canvas and reads it back out
// as a Blob — this is how react-easy-crop's on-screen crop selection turns
// into an actual new image file. imageSrc must be same-origin (a local
// blob: URL from a freshly-picked file works; a remote Storage URL can hit
// browser CORS restrictions on canvas reads), which is why this is only
// ever called on a newly-selected file, never an already-uploaded photo.
// maxSize optionally downscales the longer edge (for the small/large
// responsive variants) — omit it to keep the crop at its original
// resolution. WebP at 0.8 quality gives a meaningfully smaller file than
// JPEG at an equivalent, still-indistinguishable-for-photos quality —
// broadly supported by every browser this project already requires (dvh/svh
// already assume iOS Safari 15.4+, well past WebP's iOS 14 support).
export function getCroppedImageBlob(imageSrc, cropPixels, maxSize) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const scale = maxSize ? Math.min(1, maxSize / Math.max(cropPixels.width, cropPixels.height)) : 1
      const width = Math.round(cropPixels.width * scale)
      const height = Math.round(cropPixels.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Canvas is empty'))
        },
        'image/webp',
        0.8,
      )
    }
    image.onerror = reject
    image.src = imageSrc
  })
}

// Same crop rectangle as getCroppedImageBlob, but drawn onto a tiny canvas
// and returned as a base64 data URL instead of a Blob — small enough to
// store directly as a Firestore string field, so it's available the instant
// the doc is fetched with zero extra network request. Used as a blurred
// low-quality placeholder while the full-resolution photo downloads.
export function getCroppedThumbnailDataURL(imageSrc, cropPixels, maxSize = 24) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(cropPixels.width, cropPixels.height))
      const width = Math.round(cropPixels.width * scale)
      const height = Math.round(cropPixels.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.5))
    }
    image.onerror = reject
    image.src = imageSrc
  })
}
