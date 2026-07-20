import { Link } from 'react-router-dom'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'

function ProductCard({ product }) {
  const { id, name, imageURL, smallImageURL } = product
  // Below Tailwind's md breakpoint (768px, same one used site-wide), prefer
  // the smaller variant if one was generated — same pattern as Home/Catalog.
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768
  const displayURL = (isMobileViewport ? smallImageURL : imageURL) || imageURL

  return (
    <Link
      to={`/product/${id}`}
      className={`block rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 ease-in-out ${focusRing}`}
    >
      <img
        src={displayURL}
        alt={name}
        loading="lazy"
        className="w-full aspect-[4/5] object-cover bg-gray-100"
      />
      <div className="p-4">
        <h3 className="font-medium text-gray-900">{name}</h3>
      </div>
    </Link>
  )
}

export default ProductCard
