import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

function Catalog() {
  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Products</h1>
        <p className="text-gray-500">Coming soon.</p>
      </div>
      <Footer />
    </div>
  )
}

export default Catalog
