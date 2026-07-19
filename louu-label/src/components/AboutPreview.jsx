import { Link } from 'react-router-dom'

const focusRingText =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

// A teaser/preview of the About Us page, not the full content — that lives
// at /about (linked below) and is reached via the Navbar. This section is
// sized to roughly fill its own viewport so scrolling past the Hero lands
// on a second full "screen," matching the Hero's one-section-per-screen feel.
function AboutPreview() {
  return (
    <section className="min-h-svh flex items-center">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">About Us</h2>
          <p className="text-gray-500 mb-6">
            Placeholder introduction text — a short teaser about the brand goes here, with the
            full story living on the About Us page.
          </p>
          <Link
            to="/about"
            className={`inline-block text-sm underline underline-offset-4 hover:opacity-70 transition-all duration-300 ease-in-out ${focusRingText}`}
          >
            Learn More
          </Link>
        </div>
        <div className="aspect-square md:aspect-[4/5] bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 text-sm">
          Image placeholder
        </div>
      </div>
    </section>
  )
}

export default AboutPreview
