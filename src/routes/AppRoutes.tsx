import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
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
import { AdminRooms } from '../admin/AdminRooms'
import { AdminGuests } from '../admin/AdminGuests'
import { AdminCheckIn } from '../admin/AdminCheckIn'
import { AdminPayments } from '../admin/AdminPayments'
import { AdminReports } from '../admin/AdminReports'
import { AdminStaff } from '../admin/AdminStaff'
import { SuperAdminDashboard } from '../admin/SuperAdminDashboard'
import { EmailVerificationPage, HotelDashboardGate, HotelOnboardingPage } from '../components/HotelOnboardingPages'
import { HotelAdminLoginPage, HotelAdminRegistrationPage, HotelForgotPasswordPage, HotelResetPasswordPage, SuperAdminLoginPage } from '../components/PortalAuthPages'

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

function ExpiredSessionRedirect() {
  const navigate = useNavigate()

  useEffect(() => {
    function redirectToSignIn() {
      const isPlatformPortal = window.location.pathname.startsWith('/platform') || window.location.pathname.startsWith('/super-admin')
      sessionStorage.removeItem('selectedHotelId')
      navigate(isPlatformPortal ? '/platform/login' : '/hotel/login', { replace: true })
    }

    window.addEventListener('auth:expired', redirectToSignIn)
    return () => window.removeEventListener('auth:expired', redirectToSignIn)
  }, [navigate])

  return null
}

export function AppRoutes() {
  return (
    <>
    <ExpiredSessionRedirect />
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
      <Route path="/dashboard" element={<HotelDashboardGate><AdminLayout /></HotelDashboardGate>}>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<AdminDashboard />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route path="rooms" element={<AdminRooms />} />
        <Route path="guests" element={<AdminGuests />} />
        <Route path="check-in" element={<AdminCheckIn />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="staff" element={<AdminStaff />} />
        <Route path=":section" element={<AdminSectionPlaceholder />} />
      </Route>
      <Route path="/hotel/login" element={<HotelAdminLoginPage />} />
      <Route path="/hotel/register" element={<HotelAdminRegistrationPage />} />
      <Route path="/hotel/forgot-password" element={<HotelForgotPasswordPage />} />
      <Route path="/reset-password" element={<HotelResetPasswordPage />} />
      <Route path="/hotel/onboarding" element={<HotelOnboardingPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route path="/platform/login" element={<SuperAdminLoginPage />} />
      <Route path="/super-admin" element={<SuperAdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
