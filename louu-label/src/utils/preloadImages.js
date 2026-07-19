// Preloads a list of image URLs, resolving once every one is fully
// downloaded AND decoded — ready to paint with zero delay the moment it's
// mounted. decode() is what makes this different from just waiting for
// `onload`: `onload` only means the bytes finished downloading, but a large
// photo still takes a real, separate decode step before the browser can
// actually paint it, which is what causes a photo to visibly "pop in" a
// beat after everything else even though it was technically preloaded.
// Failures still resolve (not reject) so one broken URL can't hang a page
// waiting for a reveal that never comes.
export function preloadImages(urls) {
  return Promise.all(
    urls.filter(Boolean).map((url) => {
      const img = new Image()
      img.src = url
      return img.decode().catch(() => {})
    }),
  )
}
