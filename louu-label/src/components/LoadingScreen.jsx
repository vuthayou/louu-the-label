// Shown while a page's data + images are still preloading (see
// preloadImages.js) — same wordmark as the Hero photo's title, styled
// plainly since there's no photo to lay it over yet.
function LoadingScreen() {
  return (
    <div className="min-h-svh flex items-center justify-center">
      <p className="font-serif text-2xl md:text-3xl tracking-wide">Louu The Label</p>
    </div>
  )
}

export default LoadingScreen
