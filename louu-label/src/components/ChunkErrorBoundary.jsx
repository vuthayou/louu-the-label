import { Component } from 'react'

const RELOADED_FLAG = 'chunk-error-reloaded'

// Wraps the lazy-loaded routes. Each deploy gives every page's JS chunk a
// new hashed filename, and old ones don't stick around on the server — so a
// tab that's been open since before a deploy can try to fetch a chunk URL
// that no longer exists when the user clicks a link, and React has no
// built-in recovery for that. Catching it here and doing one automatic
// reload fetches the current index.html (with correct chunk URLs) instead
// of leaving a blank screen. sessionStorage guards against reload-looping
// if the error isn't actually deploy-related; App.jsx clears the flag on
// every successful load so this stays ready to catch the next deploy too.
class ChunkErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    if (!sessionStorage.getItem(RELOADED_FLAG)) {
      sessionStorage.setItem(RELOADED_FLAG, '1')
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

export default ChunkErrorBoundary
