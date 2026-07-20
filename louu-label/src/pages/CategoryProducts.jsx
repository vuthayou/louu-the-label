import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore/lite'
import { db } from '../firebase'
import { readCache, writeCache } from '../utils/cache'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductGrid from '../components/ProductGrid'
import LoadingScreen from '../components/LoadingScreen'

// Product listing for a single category (Tops, Bottoms), linked from
// "Explore {category}" on the Collection page. Falls back to "Coming soon"
// if no products have that exact category yet — Category is a fixed
// button-choice in Admin now, so an exact match is reliable.
function CategoryProducts({ category }) {
  // Cached by the whole product list (shared with the other category page)
  // rather than per-category, since both pages read from the same
  // Firestore collection and just filter differently client-side.
  const cachedProducts = readCache('products')
  const [products, setProducts] = useState(() =>
    cachedProducts ? cachedProducts.filter((product) => product.category === category) : [],
  )
  const [loading, setLoading] = useState(() => !cachedProducts)

  useEffect(() => {
    async function load() {
      const snapshot = await getDocs(collection(db, 'products'))
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      writeCache('products', all)
      setProducts(all.filter((product) => product.category === category))
      setLoading(false)
    }

    load()
  }, [category])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-16 pb-8 text-center">
        <h1 className="text-2xl font-semibold">{category}</h1>
      </div>
      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <p className="text-gray-500 text-center pb-16">Coming soon.</p>
      )}
      <Footer />
    </div>
  )
}

export default CategoryProducts
