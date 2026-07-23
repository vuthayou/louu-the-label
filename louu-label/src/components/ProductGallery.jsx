import { getPhotoURL } from '../utils/photoUrl'

// Product detail's photo row — separate from ScatteredCategorySection
// (Collection page's category rows) because product info needs to stay in
// its own column and stay visible, not scroll away as part of the same
// horizontally-scrolling container the photos live in.
const ROW_HEIGHT = 'h-[60vh]'

function ProductGallery({ photos = [] }) {
  const realPhotos = photos.filter(Boolean)

  if (realPhotos.length === 0) return null

  return (
    <div className="relative">
      <div className={`flex items-stretch gap-4 md:gap-6 flex-nowrap overflow-x-auto ${ROW_HEIGHT}`}>
        {realPhotos.map((photo, i) => (
          <img
            key={i}
            src={getPhotoURL(photo, 'large')}
            alt=""
            loading={i === 0 ? 'eager' : 'lazy'}
            className={`${ROW_HEIGHT} w-auto max-w-none flex-shrink-0 shadow-md`}
          />
        ))}
      </div>
      {realPhotos.length > 1 && (
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-16 items-center bg-gradient-to-l from-white/30 to-transparent md:w-24">
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
        </div>
      )}
    </div>
  )
}

export default ProductGallery
