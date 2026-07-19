import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Keyboard accessibility for a modal popup: Escape closes it, and Tab /
// Shift+Tab stay trapped inside it instead of escaping to the page behind.
// Attach the returned ref to the modal's dialog container (not the
// backdrop). Moves focus into the modal on open and back to whatever was
// focused before once it closes.
function useModalA11y(isOpen, onClose) {
  const containerRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement
    const container = containerRef.current
    container?.querySelector(FOCUSABLE_SELECTOR)?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !container) return

      const focusableEls = container.querySelectorAll(FOCUSABLE_SELECTOR)
      if (focusableEls.length === 0) return
      const first = focusableEls[0]
      const last = focusableEls[focusableEls.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  return containerRef
}

export default useModalA11y
