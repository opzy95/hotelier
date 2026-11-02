import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { SiteHeader } from './components/SiteHeader'
import { HeroSection } from './components/HeroSection'
import { AboutPage } from './components/AboutPage'
import { RoomsPage } from './components/RoomsPage'
import { ExperiencesPage } from './components/ExperiencesPage'
import { BookingsPage } from './components/BookingsPage'
import { ContactPage } from './components/ContactPage'
import { BookYourStayPage } from './components/BookYourStayPage'
import {
  AboutSection,
  ExperiencesSection,
  FeaturesSection,
  ReservationSection,
  RoomsSection,
  SiteFooter,
} from './components/HotelSections'

function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <RoomsSection />
      <ExperiencesSection />
      <ReservationSection />
    </>
  )
}

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
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/experiences" element={<ExperiencesPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/book" element={<BookYourStayPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SiteFooter />
    </>
  )
}

export default App
