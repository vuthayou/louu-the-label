import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import ProductGrid from '../components/ProductGrid'

function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const snapshot = await getDocs(collection(db, 'products'))
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setProducts(fetched)
      setLoading(false)
    }

    fetchProducts()
  }, [])

  return (
    <div>
      <Navbar />
      {loading ? (
        <p className="text-center py-12 text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-center py-12 text-gray-500">No products yet.</p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  )
}

export default Catalog
