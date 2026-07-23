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
  )
}

export default ProductGallery
