'use client'

import { RefObject, useEffect } from 'react'

interface RevealOptions {
  /** The scrollable element ScrollTrigger should watch. Defaults to the window. */
  scroller?: RefObject<HTMLElement | null>
  /** Re-run when this value changes (e.g. search results length). */
  deps?: unknown[]
}

/**
 * App-wide scroll reveal powered by GSAP + ScrollTrigger.
 *
 * Attach the returned ref to a container, then mark children with
 * `data-reveal` (optionally `data-reveal="left" | "right" | "scale"`).
 * Elements fade/slide in as they enter the viewport, with a subtle stagger
 * for siblings revealed together. Respects `prefers-reduced-motion`.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  rootRef: RefObject<T | null>,
  { scroller, deps = [] }: RevealOptions = {}
) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!targets.length) return

    if (reduced) {
      targets.forEach((el) => {
        el.style.visibility = 'visible'
      })
      return
    }

    let cleanup = () => {}

    Promise.all([
      import('gsap').then((m) => m.default ?? m.gsap),
      import('gsap/ScrollTrigger').then((m) => m.ScrollTrigger),
    ]).then(([gsap, ScrollTrigger]) => {
      gsap.registerPlugin(ScrollTrigger)
      const scrollerEl = scroller?.current ?? undefined

      const triggers = targets.map((el, i) => {
        const dir = el.dataset.reveal || 'up'
        const from: gsap.TweenVars = { opacity: 0, duration: 0.8, ease: 'power3.out' }
        if (dir === 'left') from.x = -48
        else if (dir === 'right') from.x = 48
        else if (dir === 'scale') from.scale = 0.92
        else from.y = 42

        el.style.visibility = 'visible'
        return gsap.from(el, {
          ...from,
          delay: (i % 6) * 0.06,
          scrollTrigger: {
            trigger: el,
            scroller: scrollerEl,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        })
      })

      ScrollTrigger.refresh()
      cleanup = () => {
        triggers.forEach((t) => t.scrollTrigger?.kill())
        triggers.forEach((t) => t.kill())
      }
    })

    return () => cleanup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
