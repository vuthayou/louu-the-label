function ProductCard({ product }) {
  const { name, price, description, category, imageURL, smallImageURL } = product
  // Below Tailwind's md breakpoint (768px, same one used site-wide), prefer
  // the smaller variant if one was generated — same pattern as Home/Catalog.
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768
  const displayURL = (isMobileViewport ? smallImageURL : imageURL) || imageURL

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 ease-in-out">
      <img
        src={displayURL}
        alt={name}
        loading="lazy"
        className="w-full aspect-[4/5] object-cover bg-gray-100"
      />
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">{category}</p>
        <h3 className="font-medium text-gray-900">{name}</h3>
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{description}</p>
        <p className="mt-2 font-semibold">${price}</p>
      </div>
    </div>
  )
}

export default ProductCard
