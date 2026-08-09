import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { readCache, writeCache } from '../utils/cache'
import { formatSize } from '../utils/formatSize'
import PageLayout from '../components/PageLayout'
import LoadingScreen from '../components/LoadingScreen'
import ProductGallery from '../components/ProductGallery'

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

// Collapsible "Model Detail"/"Size Guide" sections — collapsed by default
// since they're supplementary info, not primary product details. Controlled
// by the parent (isOpen/onToggle) rather than owning its own state, so the
// parent can enforce only one being open at a time.
function DetailDropdown({ title, content, isOpen, onToggle }) {
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`group flex items-center justify-start gap-2 text-base font-normal text-gray-500 transition-all duration-300 ease-in-out ${focusRing}`}
      >
        {title}
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-0' : '-rotate-90 group-hover:rotate-0'}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <p className="text-base font-normal text-gray-500 whitespace-pre-line mt-2">{content}</p>}
    </div>
  )
}

// Main photo (the one shown on the card that was clicked to get here)
// always comes first, followed by any additional gallery photos — main
// photo is stored as separate imageURL/smallImageURL fields (not the
// {small, large} shape gallery photos use), so it's normalized here into
// the same shape as the rest.
function getProductPhotos(product) {
  return [
    { small: product.smallImageURL || product.imageURL, large: product.imageURL },
    ...(product.galleryPhotos || []),
  ]
}

function ProductDetail() {
  const { id } = useParams()
  const cachedProduct = readCache(`product-${id}`)
  const [product, setProduct] = useState(cachedProduct)
  const [loading, setLoading] = useState(() => !cachedProduct)
  // Which DetailDropdown is open, if any — a single value (rather than one
  // boolean per dropdown) is what makes them mutually exclusive.
  const [openDropdown, setOpenDropdown] = useState(null)

  useEffect(() => {
    async function load() {
      const snapshot = await getDoc(doc(db, 'products', id))
      const data = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
      if (data) writeCache(`product-${id}`, data)
      setProduct(data)
      setLoading(false)
    }

    load()
  }, [id])

  if (loading) {
    return <LoadingScreen />
  }

  if (!product) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Product not found</h1>
        </div>
      </PageLayout>
    )
  }

  const sizeText = formatSize(product.size)

  return (
    <PageLayout>
      {product.category && (
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-8 mb-8">
          <Link
            to={`/collection/${product.category.toLowerCase()}`}
            className={`inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRing}`}
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
              className="h-4 w-4"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {product.category}
          </Link>
        </div>
      )}
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pb-16 md:flex md:items-start md:gap-8">
        <div className="md:w-3/5 md:min-w-0">
          <ProductGallery photos={getProductPhotos(product)} />
        </div>

        <div className="mt-8 md:mt-0 md:w-2/5">
          <h1 className="text-2xl md:text-3xl font-semibold mb-4">{product.name}</h1>
          <p className="text-base font-normal text-gray-500 mb-4">${product.price}</p>
          {(product.color || sizeText) && (
            <div className="flex flex-col items-start gap-2 mb-4">
              {product.color && (
                <span className="text-base font-normal text-gray-500">Color: {product.color}</span>
              )}
              {sizeText && (
                <span className="text-base font-normal text-gray-500">Size: {sizeText}</span>
              )}
            </div>
          )}
          {product.description && (
            <p className="text-base font-normal text-gray-500 whitespace-pre-line mb-4">{product.description}</p>
          )}
          {product.modelDetail && (
            <DetailDropdown
              title="Model Detail"
              content={product.modelDetail}
              isOpen={openDropdown === 'modelDetail'}
              onToggle={() => setOpenDropdown((prev) => (prev === 'modelDetail' ? null : 'modelDetail'))}
            />
          )}
          {product.sizeGuide && (
            <DetailDropdown
              title="Size Guide"
              content={product.sizeGuide}
              isOpen={openDropdown === 'sizeGuide'}
              onToggle={() => setOpenDropdown((prev) => (prev === 'sizeGuide' ? null : 'sizeGuide'))}
            />
          )}
        </div>
      </div>
    </PageLayout>
  )
}

export default ProductDetail
