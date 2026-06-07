"use client"

import { useEffect } from "react"

export function ScrollToTop() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest("a")
      if (!t || !(t as HTMLAnchorElement).href) return
      const u = new URL((t as HTMLAnchorElement).href)
      if (u.pathname === location.pathname && u.hostname === location.hostname) {
        e.preventDefault()
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
    document.addEventListener("click", handler)
    return () => document.removeEventListener("click", handler)
  }, [])

  return null
}
