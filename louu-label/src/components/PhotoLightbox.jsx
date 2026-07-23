import { useEffect, useRef } from 'react'
import { getPhotoURL } from '../utils/photoUrl'
import useModalA11y from '../hooks/useModalA11y'

// Full-screen photo viewer for ProductDetail: click any thumbnail in
// ProductGallery to open here, scrolled to that photo, then scroll
// vertically to browse the rest of the product's photos.
function PhotoLightbox({ photos, initialIndex, onClose }) {
  const itemRefs = useRef([])
  const containerRef = useModalA11y(true, onClose)

  useEffect(() => {
    itemRefs.current[initialIndex]?.scrollIntoView({ block: 'start' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Unlike the site's other modals (short, centered, non-scrolling), this
    // one holds a tall stack of full-size photos with its own vertical
    // scroll — without locking body scroll, reaching the top/bottom of that
    // stack lets further scroll gestures leak through to the page behind it.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Product photos"
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-900"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo view"
        className="fixed top-4 right-4 md:top-8 md:right-8 z-10 flex h-12 w-12 items-center justify-center border-0 bg-transparent text-white outline-none transition-all duration-300 ease-in-out hover:opacity-70"
      >
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex flex-col items-center gap-2 px-4 py-16 md:px-8">
        {photos.map((photo, i) => (
          <img
            key={i}
            ref={(node) => (itemRefs.current[i] = node)}
            src={getPhotoURL(photo, 'large')}
            alt=""
            className="max-h-[90vh] w-auto max-w-full object-contain"
          />
        ))}
      </div>
    </div>
  )
}

export default PhotoLightbox
