import Navbar from './Navbar'
import Footer from './Footer'

// Shared shell for every public page — keeps the page at least one full
// viewport tall and lets the content area grow to fill whatever's left, so
// Footer always sits at the bottom of the screen instead of right up
// against sparse content (e.g. a category page with only one product, or
// the About placeholder).
function PageLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}

export default PageLayout
