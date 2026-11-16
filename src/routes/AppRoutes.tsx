import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
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
import { useHotelSession } from '../admin/HotelSessionContext'
import { SuperAdminDashboard } from '../admin/SuperAdminDashboard'
import { EmailVerificationPage, HotelDashboardGate, HotelOnboardingPage } from '../components/HotelOnboardingPages'
import { HotelAdminLoginPage, HotelAdminRegistrationPage, HotelForgotPasswordPage, HotelResetPasswordPage, StaffInvitationAcceptancePage, SuperAdminLoginPage } from '../components/PortalAuthPages'

function DashboardLandingRedirect() {
  const { managerRole, permissions } = useHotelSession()
  if (managerRole.toLowerCase() === 'manager') return <Navigate to="overview" replace />
  const destination = [
    { path: 'check-in', permissions: ['reservations.view', 'reservations.check_in', 'reservations.check_out', 'reservations.create'] },
    { path: 'reservations', permissions: ['reservations.view'] },
    { path: 'guests', permissions: ['guests.view', 'guests.create'] },
    { path: 'rooms', permissions: ['rooms.availability.view'] },
  ].find((item) => item.path === 'check-in'
    ? permissions.includes('reservations.view') && item.permissions.slice(1).some((permission) => permissions.includes(permission))
    : item.permissions.some((permission) => permissions.includes(permission)))
  return <Navigate to={destination ? `/dashboard/${destination.path}` : '/dashboard/not-authorized'} replace />
}

function DashboardAccessRoute({ requiredPermissions, requiredAllPermissions = [], children }: {
  requiredPermissions: string[]
  requiredAllPermissions?: string[]
  children: ReactNode
}) {
  const { managerRole, permissions } = useHotelSession()
  const isManager = managerRole.toLowerCase() === 'manager'
  const hasPermission = requiredPermissions.some((permission) => permissions.includes(permission))
    && requiredAllPermissions.every((permission) => permissions.includes(permission))
  return isManager || hasPermission ? children : <Navigate to="/dashboard/not-authorized" replace />
}

function DashboardNotAuthorized() {
  return (
    <section className="mx-auto max-w-xl border border-stone-200 bg-white p-6">
      <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-800">FRONT DESK WORKSPACE</p>
      <h1 className="mt-2 font-display text-2xl text-ink">This section isn’t available</h1>
      <p className="mt-2 text-xs leading-5 text-muted">Your account does not have permission to open this section. You can return to the workspace sections assigned to you or ask your hotel manager to update your access.</p>
      <Link to="/dashboard" className="mt-4 inline-flex min-h-9 items-center bg-forest px-3 text-[10px] font-semibold text-white hover:bg-forest-deep">Return to my workspace</Link>
    </section>
  )
}

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
        <Route index element={<DashboardLandingRedirect />} />
        <Route path="overview" element={<DashboardAccessRoute requiredPermissions={[]}><AdminDashboard /></DashboardAccessRoute>} />
        <Route path="reservations" element={<DashboardAccessRoute requiredPermissions={['reservations.view']}><AdminReservations /></DashboardAccessRoute>} />
        <Route path="rooms" element={<DashboardAccessRoute requiredPermissions={['rooms.availability.view']}><AdminRooms /></DashboardAccessRoute>} />
        <Route path="guests" element={<DashboardAccessRoute requiredPermissions={['guests.view', 'guests.create']}><AdminGuests /></DashboardAccessRoute>} />
        <Route path="check-in" element={<DashboardAccessRoute requiredPermissions={['reservations.check_in', 'reservations.check_out', 'reservations.create']} requiredAllPermissions={['reservations.view']}><AdminCheckIn /></DashboardAccessRoute>} />
        <Route path="payments" element={<DashboardAccessRoute requiredPermissions={[]}><AdminPayments /></DashboardAccessRoute>} />
        <Route path="reports" element={<DashboardAccessRoute requiredPermissions={[]}><AdminReports /></DashboardAccessRoute>} />
        <Route path="staff" element={<DashboardAccessRoute requiredPermissions={[]}><AdminStaff /></DashboardAccessRoute>} />
        <Route path="not-authorized" element={<DashboardNotAuthorized />} />
        <Route path=":section" element={<AdminSectionPlaceholder />} />
      </Route>
      <Route path="/hotel/login" element={<HotelAdminLoginPage />} />
      <Route path="/accept-invitation" element={<StaffInvitationAcceptancePage />} />
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
