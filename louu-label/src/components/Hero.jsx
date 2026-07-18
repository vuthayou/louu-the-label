import { Link } from 'react-router-dom'
import homeImage from '../assets/home.jpeg'

function Hero() {
  return (
    <div className="relative w-full h-[85vh] overflow-hidden">
      <img
        src={homeImage}
        alt="Louu the Label"
        className="absolute inset-0 w-full h-full object-cover object-[75%_15%]"
      />

      <div className="absolute inset-0 flex flex-col justify-center items-center px-6 md:px-16 text-white text-center">
        <h1 className="font-serif text-5xl md:text-8xl tracking-wide">LOUU THE LABEL</h1>
        <div className="mt-4 flex gap-8 md:gap-16 text-xs md:text-sm tracking-[0.2em] uppercase">
          <span>Gentle</span>
          <span>On</span>
          <span>The</span>
          <span>Planet</span>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-10 text-xs md:text-sm uppercase tracking-wide text-white">
        <Link
          to="/collection"
          className="underline underline-offset-4 leading-tight hover:opacity-80 transition-opacity"
        >
          Product
          <br />
          Category
        </Link>
        <Link to="/about" className="underline underline-offset-4 hover:opacity-80 transition-opacity">
          About Us
        </Link>
      </div>
    </div>
  )
}

export default Hero
