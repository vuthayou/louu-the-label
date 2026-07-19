// One roughly-full-viewport section introducing a single category — used
// twice on the Collection page (Tops, Bottoms), same "one section per
// screen" pattern as Home.jsx's Hero/AboutPreview/ProductsPreview.
// imageFirst flips which side the placeholder image sits on, so the two
// sections don't look identical stacked one after another.
function CategoryInfoSection({ title, description, imageFirst = false, photo }) {
  return (
    <section className="min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        <div
          className={`aspect-square md:aspect-[4/5] bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm overflow-hidden ${
            imageFirst ? 'order-2 md:order-1' : 'order-2'
          }`}
        >
          {photo ? (
            <img src={photo} alt={title} className="w-full h-full object-cover" />
          ) : (
            'Image placeholder'
          )}
        </div>
        <div className={imageFirst ? 'order-1 md:order-2' : 'order-1'}>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">{title}</h2>
          <p className="text-gray-500">{description}</p>
        </div>
      </div>
    </section>
  )
}

export default CategoryInfoSection
