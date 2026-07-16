function ProductCard({ product }) {
  const { name, price, description, category, imageURL } = product

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <img
        src={imageURL}
        alt={name}
        className="w-full aspect-[4/5] object-cover"
      />
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-gray-400">{category}</p>
        <h3 className="font-medium text-gray-900">{name}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{description}</p>
        <p className="mt-2 font-semibold">${price}</p>
      </div>
    </div>
  )
}

export default ProductCard
