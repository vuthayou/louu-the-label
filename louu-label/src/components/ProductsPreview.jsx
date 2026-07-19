import { Link } from 'react-router-dom'

const focusRingText =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

// A teaser/introduction for the product catalog, not the full grid — that
// lives at /collection (linked below) and is reached via the Navbar. Sized
// to roughly fill its own viewport, same "one section per screen" rhythm
// as Hero and AboutPreview. Column order is flipped from AboutPreview
// (image first here) so the two sections don't look identical on scroll.
function ProductsPreview() {
  return (
    <section className="min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        <div className="aspect-square md:aspect-[4/5] bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm order-2 md:order-1">
          Image placeholder
        </div>
        <div className="order-1 md:order-2">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">Our Products</h2>
          <p className="text-gray-500 mb-6">
            Placeholder introduction text — a short teaser about the collection goes here, with
            the full catalog living on the Collection page.
          </p>
          <Link
            to="/collection"
            className={`inline-block text-sm underline underline-offset-4 hover:opacity-70 transition-all duration-300 ease-in-out ${focusRingText}`}
          >
            Explore Now
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ProductsPreview
