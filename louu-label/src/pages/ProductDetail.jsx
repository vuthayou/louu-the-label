import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { readCache, writeCache } from '../utils/cache'
import { formatSize } from '../utils/formatSize'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingScreen from '../components/LoadingScreen'
import ProductGallery from '../components/ProductGallery'

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
      <div>
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Product not found</h1>
        </div>
        <Footer />
      </div>
    )
  }

  const sizeText = formatSize(product.size)

  return (
    <div>
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-16 md:flex md:items-start md:gap-8">
        <div className="md:w-3/5 md:min-w-0">
          <ProductGallery photos={getProductPhotos(product)} />
        </div>

        <div className="mt-8 md:mt-0 md:w-2/5">
          <h1 className="text-2xl md:text-3xl font-semibold mb-4">{product.name}</h1>
          <p className="text-lg font-semibold text-gray-900 mb-4">${product.price}</p>
          {(product.color || sizeText) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.color && (
                <span className="text-sm text-gray-600 border border-gray-200 rounded-full px-4 py-2">
                  Color: {product.color}
                </span>
              )}
              {sizeText && (
                <span className="text-sm text-gray-600 border border-gray-200 rounded-full px-4 py-2">
                  Size: {sizeText}
                </span>
              )}
            </div>
          )}
          {product.description && <p className="text-gray-500 mb-4">{product.description}</p>}
          {product.modelDetail && (
            <div className="mb-4">
              <h2 className="text-sm font-medium text-gray-700 mb-2">Model Detail</h2>
              <p className="text-gray-500">{product.modelDetail}</p>
            </div>
          )}
          {product.sizeGuide && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 mb-2">Size Guide</h2>
              <p className="text-gray-500">{product.sizeGuide}</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ProductDetail
