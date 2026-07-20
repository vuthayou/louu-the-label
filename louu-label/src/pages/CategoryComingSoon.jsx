import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Placeholder landing page for a single category (Tops, Bottoms, ...),
// linked from "Explore {category}" on the Collection page — same minimal
// style as About.jsx's placeholder.
function CategoryComingSoon({ category }) {
  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">{category}</h1>
        <p className="text-gray-500">Coming soon.</p>
      </div>
      <Footer />
    </div>
  )
}

export default CategoryComingSoon
