import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Client-side route changes don't reload the page, so the browser has no
// reason to reset scroll position — without this, navigating away from a
// scrolled-down page lands on the new page at that same scroll offset.
function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default ScrollToTop
