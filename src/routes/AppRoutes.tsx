import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AboutPage } from '../components/AboutPage'
import { BookingsPage } from '../components/BookingsPage'
import { BookYourStayPage } from '../components/BookYourStayPage'
import { ContactPage } from '../components/ContactPage'
import { ExperiencesPage } from '../components/ExperiencesPage'
import { HeroSection } from '../components/HeroSection'
import { RoomsPage } from '../components/RoomsPage'
import { SiteHeader } from '../components/SiteHeader'
import {
  AboutSection,
  ExperiencesSection,
  FeaturesSection,
  ReservationSection,
  RoomsSection,
  SiteFooter,
} from '../components/HotelSections'
import { AdminLayout, AdminSectionPlaceholder } from '../admin/AdminLayout'
import { AdminDashboard } from '../admin/AdminDashboard'
import { AdminReservations } from '../admin/AdminReservations'

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

function PublicLayout() {
  return (
    <>
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/experiences" element={<ExperiencesPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/book" element={<BookYourStayPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
      <Route path="/dashboard" element={<AdminLayout />}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminDashboard />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route path=":section" element={<AdminSectionPlaceholder />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
