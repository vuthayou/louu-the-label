// For a hidden file input wrapped in a <label> — the input is the real focus
// target, so the visible ring has to key off :focus-within on the label.
const focusWithinRing = 'focus-within:ring-2 focus-within:ring-gray-900 focus-within:ring-offset-2'

// Admin grid of uploaded photos for a category (Tops, Bottoms, ...): each
// existing photo shows as a thumbnail — click to replace it — plus one
// dashed "+ Add photo" tile for the next empty slot, so only one upload
// target is ever active at a time. onSelectFile(index, file) fires for both
// replace and add; the caller decides what happens next (e.g. open a crop
// popup) since the actual upload isn't this component's job.
function PhotoGridManager({ photos, maxPhotos, keyPrefix, uploadingSlot, onSelectFile }) {
  const filledCount = photos.filter(Boolean).length

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      {photos.map((photoUrl, i) =>
        photoUrl ? (
          <label
            key={i}
            className={`relative block aspect-square cursor-pointer group ${focusWithinRing}`}
          >
            <img src={photoUrl} alt={`${keyPrefix} ${i + 1}`} className="w-full h-full object-cover" />
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
