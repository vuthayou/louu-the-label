import { Link } from 'react-router-dom'
import defaultHomeImage from '../assets/home.jpeg'

// imageURL comes from Firestore (siteSettings/hero) via Home.jsx, set through
// Admin's "Homepage" section. Falls back to the local file below until an
// admin has ever set one, so the page never looks broken.
function Hero({ imageURL }) {
  return (
    <div className="relative w-full flex-1 overflow-hidden">
      <img
        src={imageURL || defaultHomeImage}
        alt="Louu the Label"
        className="absolute inset-0 w-full h-full object-cover object-[75%_15%]"
      />
      {/* Guarantees the white text stays readable (AA contrast) no matter
          how bright the admin-uploaded photo is — without this, a light
          photo could make the overlaid text unreadable. */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute inset-0 flex flex-col justify-center items-center px-6 md:px-16 text-white text-center">
        <h1 className="font-serif text-3xl sm:text-5xl md:text-7xl lg:text-8xl tracking-wide">
          LOUU THE LABEL
        </h1>
        <div className="mt-4 flex gap-8 md:gap-16 text-xs md:text-sm tracking-[0.2em] uppercase">
          <span>Gentle</span>
          <span>On</span>
          <span>The</span>
          <span>Planet</span>
        </div>
      </div>
      {/*Product Category && About us*/}
      <div className="absolute bottom-16 md:bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-8 md:gap-16 lg:gap-24 text-sm md:text-base uppercase tracking-wide text-white">
        <Link
          to="/collection"
          className="underline underline-offset-4 leading-tight text-center hover:opacity-80 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
        >
          Product
          <br />
          Category
        </Link>
        <Link
          to="/about"
          className="underline underline-offset-4 hover:opacity-80 transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-sm"
        >
          About Us
        </Link>
      </div>
    </div>
  )
}

export default Hero
