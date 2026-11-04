import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'

function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
      } else {
        window.scrollTo(0, 0)
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <>
      <ScrollToTop />
      <AppRoutes />
    </>
  )
}

export default App
