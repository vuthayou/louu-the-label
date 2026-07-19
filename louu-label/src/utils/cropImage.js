// Draws just the selected crop rectangle onto a canvas and reads it back out
// as a Blob — this is how react-easy-crop's on-screen crop selection turns
// into an actual new image file. imageSrc must be same-origin (a local
// blob: URL from a freshly-picked file works; a remote Storage URL can hit
// browser CORS restrictions on canvas reads), which is why this is only
// ever called on a newly-selected file, never an already-uploaded photo.
export function getCroppedImageBlob(imageSrc, cropPixels) {
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
