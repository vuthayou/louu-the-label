import { getPhotoURL } from '../utils/photoUrl'

// For a hidden file input wrapped in a <label> — the input is the real focus
// target, so the visible ring has to key off :focus-within on the label.
const focusWithinRing = 'focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-2'
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'

// Admin grid of uploaded photos for a category (Tops, Bottoms, ...): each
// existing photo shows as a thumbnail — click to replace it, or the red "x"
// to remove it entirely — plus one dashed "+ Add photo" tile for the next
// empty slot, so only one upload target is ever active at a time.
// onSelectFile(index, file) fires for both replace and add; the caller
// decides what happens next (e.g. open a crop popup) since the actual
// upload isn't this component's job. onRemove(index) fires after the
// caller's own confirmation step.
function PhotoGridManager({ photos, maxPhotos, keyPrefix, uploadingSlot, onSelectFile, onRemove }) {
  const filledCount = photos.filter(Boolean).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      {photos.map((photoUrl, i) =>
        photoUrl ? (
          <div key={i} className="relative aspect-square group">
            <label className={`absolute inset-0 cursor-pointer ${focusWithinRing}`}>
              <img
                src={getPhotoURL(photoUrl, 'small')}
                alt={`${keyPrefix} ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white text-sm opacity-0 transition-all duration-300 ease-in-out group-hover:bg-black/40 group-hover:opacity-100">
                {uploadingSlot === `${keyPrefix}-${i}` ? 'Uploading...' : 'Replace'}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  onSelectFile(i, e.target.files[0])
                  e.target.value = ''
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => onRemove(i)}
              aria-label={`Remove ${keyPrefix} photo ${i + 1}`}
              className={`absolute -top-2 -right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full border-2 border-white bg-red-600 text-white text-sm font-bold leading-none shadow-sm opacity-0 group-hover:opacity-60 focus-visible:opacity-100 hover:bg-red-700 transition-all duration-300 ease-in-out ${focusRing}`}
            >
              ×
            </button>
          </div>
        ) : null,
      )}
      {filledCount < maxPhotos && (
        <label
          className={`aspect-square flex items-center justify-center border border-dashed border-gray-300 text-gray-400 text-sm cursor-pointer transition-all duration-300 ease-in-out hover:border-gray-500 hover:text-gray-500 ${focusWithinRing}`}
        >
          {uploadingSlot === `${keyPrefix}-${filledCount}` ? 'Uploading...' : '+ Add photo'}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              onSelectFile(filledCount, e.target.files[0])
              e.target.value = ''
            }}
          />
        </label>
      )}
    </div>
  )
}

export default PhotoGridManager
