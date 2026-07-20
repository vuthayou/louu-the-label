import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Placeholder product detail page — reached by clicking a ProductCard on
// the customer-facing Tops/Bottoms listing. Real content (photo, price,
// description, etc.) comes later; this just wires up the route/navigation.
function ProductDetail() {
  const { id } = useParams()

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Product</h1>
        <p className="text-gray-500">Coming soon.</p>
      </div>
      <Footer />
    </div>
  )
}

export default ProductDetail
