import { useCallback, useEffect, useRef, useState } from 'react'
import { getPhotoURL } from '../utils/photoUrl'
import PhotoLightbox from './PhotoLightbox'

// Product detail's photo row — separate from ScatteredCategorySection
// (Collection page's category rows) because product info needs to stay in
// its own column and stay visible, not scroll away as part of the same
// horizontally-scrolling container the photos live in.
const ROW_HEIGHT = 'h-[60vh]'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'

function ProductGallery({ photos = [] }) {
  const realPhotos = photos.filter(Boolean)
  const scrollRef = useRef(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [openIndex, setOpenIndex] = useState(null)

  const closeLightbox = useCallback(() => setOpenIndex(null), [])

  // Chevron is just a first-visit hint — once the user scrolls at all, they
  // already know the row scrolls, so it hides for good rather than
  // reappearing/disappearing as they scroll back and forth.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    function handleScroll() {
      setHasScrolled(true)
      el.removeEventListener('scroll', handleScroll)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  if (realPhotos.length === 0) return null

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className={`flex items-stretch gap-4 md:gap-6 flex-nowrap overflow-x-auto ${ROW_HEIGHT}`}
      >
        {realPhotos.map((photo, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`View photo ${i + 1} of ${realPhotos.length} full screen`}
            className={`${ROW_HEIGHT} block flex-shrink-0 border-0 bg-transparent p-0 ${focusRing}`}
          >
            <img
              src={getPhotoURL(photo, 'large')}
              alt=""
              loading={i === 0 ? 'eager' : 'lazy'}
              className={`${ROW_HEIGHT} w-auto max-w-none shadow-md`}
            />
          </button>
        ))}
      </div>
      {realPhotos.length > 1 && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-16 items-center md:w-24">
          {!hasScrolled && (
            <svg
              aria-hidden="true"
              focusable="false"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-auto mr-4 h-8 w-8 text-gray-400 animate-[gallery-hint-nudge_1.6s_ease-in-out_infinite]"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
          )}
        </div>
      )}
      {openIndex !== null && (
        <PhotoLightbox photos={realPhotos} initialIndex={openIndex} onClose={closeLightbox} />
      )}
    </div>
  )
}

export default ProductGallery
