// A single-row photo layout for a category — title card + photos all share
// one fixed height, but each keeps its own natural width. For real photos
// that width comes from the image's intrinsic aspect ratio (height fixed,
// width auto — the browser does the math). The row never wraps, so if the
// total content is wider than the viewport it scrolls horizontally instead
// of breaking onto a second row — this keeps the section's height (and how
// far you have to scroll to reach the next section) constant no matter how
// many photos an admin uploads, on both desktop and mobile.
const ROW_HEIGHT = 'h-96'
const MOBILE_ROW_HEIGHT = 'h-64'

// Only used when no real photos have been uploaded yet, so the section
// still looks reasonable rather than empty. Colors are paired with fixed
// widths since there's no real image to derive an aspect ratio from.
const PLACEHOLDERS = [
  { color: 'bg-red-200', width: 'w-48' },
  { color: 'bg-blue-200', width: 'w-64' },
  { color: 'bg-green-200', width: 'w-40' },
  { color: 'bg-yellow-200', width: 'w-56' },
]

function ScatteredCategorySection({ title, description, photos = [] }) {
  const realPhotos = photos.filter(Boolean)
  const hasRealPhotos = realPhotos.length > 0
  const items = hasRealPhotos ? realPhotos : PLACEHOLDERS

  return (
    <section className="min-h-screen flex items-center pt-16 pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 w-full">
        {/* Mobile: title block, then photos in their own horizontally-scrolling row */}
        <div className="flex flex-col gap-8 md:hidden">
          <div>
            <h2 className="text-2xl font-semibold mb-4">{title}</h2>
            <p className="text-gray-500">{description}</p>
          </div>
          <div className={`flex items-stretch gap-4 flex-nowrap overflow-x-auto ${MOBILE_ROW_HEIGHT}`}>
            {items.map((item, i) =>
              hasRealPhotos ? (
                <img
                  key={i}
                  src={item}
                  alt=""
                  loading="lazy"
                  className={`${MOBILE_ROW_HEIGHT} w-auto flex-shrink-0 shadow-md`}
                />
              ) : (
                <div
                  key={i}
                  className={`${MOBILE_ROW_HEIGHT} ${item.width} flex-shrink-0 shadow-md ${item.color}`}
                />
              ),
            )}
          </div>
        </div>

        {/* Desktop: one row, fixed height, natural widths, scrolls if it overflows */}
        <div className={`hidden md:flex items-stretch gap-6 flex-nowrap overflow-x-auto ${ROW_HEIGHT}`}>
          <div
            className={`${ROW_HEIGHT} w-64 flex-shrink-0 bg-white/50 border border-gray-200 shadow-md p-6 flex flex-col justify-center`}
          >
            <h2 className="text-2xl font-semibold mb-2">{title}</h2>
            <p className="text-gray-500 text-sm">{description}</p>
          </div>
          {items.map((item, i) =>
            hasRealPhotos ? (
              <img
                key={i}
                src={item}
                alt=""
                loading="lazy"
                className={`${ROW_HEIGHT} w-auto flex-shrink-0 shadow-md`}
              />
            ) : (
              <div key={i} className={`${ROW_HEIGHT} ${item.width} flex-shrink-0 shadow-md ${item.color}`} />
            ),
          )}
        </div>
      </div>
    </section>
  )
}

export default ScatteredCategorySection
