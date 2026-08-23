import { useEffect } from 'react'

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return

    const scrollY = window.scrollY
    const { style: bodyStyle } = document.body
    const { style: htmlStyle } = document.documentElement
    const previous = {
      bodyOverflow: bodyStyle.overflow,
      bodyPosition: bodyStyle.position,
      bodyTop: bodyStyle.top,
      bodyLeft: bodyStyle.left,
      bodyRight: bodyStyle.right,
      bodyWidth: bodyStyle.width,
      htmlOverflow: htmlStyle.overflow,
    }

    bodyStyle.overflow = 'hidden'
    bodyStyle.position = 'fixed'
    bodyStyle.top = `-${scrollY}px`
    bodyStyle.left = '0'
    bodyStyle.right = '0'
    bodyStyle.width = '100%'
    htmlStyle.overflow = 'hidden'

    const preventTouchMove = (event: TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      const scrollable = (target as Element).closest('[data-overlay-scroll]')
      if (!scrollable) event.preventDefault()
    }

    document.addEventListener('touchmove', preventTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventTouchMove)
      bodyStyle.overflow = previous.bodyOverflow
      bodyStyle.position = previous.bodyPosition
      bodyStyle.top = previous.bodyTop
      bodyStyle.left = previous.bodyLeft
      bodyStyle.right = previous.bodyRight
      bodyStyle.width = previous.bodyWidth
      htmlStyle.overflow = previous.htmlOverflow
      window.scrollTo(0, scrollY)
    }
  }, [locked])
}
