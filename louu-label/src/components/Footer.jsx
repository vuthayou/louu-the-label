const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 rounded-sm'

// rel="noopener noreferrer" on target="_blank" links prevents the opened
// page from getting a handle back to this one via window.opener (reverse
// tabnabbing) — standard practice for any external link on the site.
function Footer() {
  return (
    <footer className="border-t border-gray-200 text-sm text-gray-500">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 text-center">
        <div className="flex justify-center gap-4 mb-4">
          <a
            href="https://www.instagram.com/louu.thelabel?igsh=djF0dWJlbG8zaGk2"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Louu the Label on Instagram"
            className={`text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRing}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <a
            href="https://www.facebook.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Louu the Label on Facebook"
            className={`text-gray-500 hover:text-gray-900 transition-all duration-300 ease-in-out ${focusRing}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden="true"
              focusable="false"
            >
              <path d="M22 12a10 10 0 1 0-11.5 9.95v-7.04H7.9V12h2.6V9.8c0-2.57 1.53-4 3.87-4 1.12 0 2.3.2 2.3.2v2.5h-1.3c-1.28 0-1.68.8-1.68 1.62V12h2.86l-.46 2.9h-2.4v7.04A10 10 0 0 0 22 12z" />
            </svg>
          </a>
        </div>
        &copy; {new Date().getFullYear()} Louu the Label. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer
