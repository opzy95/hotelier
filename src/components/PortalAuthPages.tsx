import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Hotel, LockKeyhole, Mail, MapPin, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, apiRequest, clearAccessToken, setAccessToken } from '../api'
import type { HotelMembership, PlatformLoginResponse, PlatformProfileResponse } from '../api'
import heroImage from '../img/Opzy Luxury Hotel infinity lagoon pool at twilight in Victoria Island.png'

function PortalFrame({ eyebrow, title, description, children, previewOnly = true }: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  previewOnly?: boolean
}) {
  const [currentYear] = useState(() => new Date().getFullYear())

  return (
    <main className="min-h-screen bg-[#faf9f6] font-body text-ink">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[0.92fr_1.08fr]">
        <section className="relative flex min-h-[310px] flex-col justify-between overflow-hidden bg-forest p-5 text-white sm:min-h-[390px] sm:p-8 md:min-h-screen md:p-6 lg:p-9 xl:p-14">
          <img src={heroImage} alt="The Opzy Luxury Hotel lagoon pool at twilight" className="absolute inset-0 size-full object-cover object-center" />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,20,14,0.68)_0%,rgba(5,20,14,0.08)_38%,rgba(5,20,14,0.82)_100%)]" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-2.5 text-white no-underline">
              <span className="grid size-9 place-items-center border border-white/35 bg-white/10 backdrop-blur-sm"><Hotel aria-hidden="true" className="size-4 text-champagne" /></span>
              <span className="font-display text-sm tracking-wide">OPZY <span className="text-white/65">HOSPITALITY</span></span>
            </Link>
            <Link to="/" className="inline-flex items-center gap-1.5 text-[10px] font-medium text-white/85 transition-colors hover:text-champagne md:hidden"><ArrowLeft aria-hidden="true" className="size-3.5" /> Hotel site</Link>
          </div>
          <div className="relative z-10 mt-8 max-w-lg sm:mt-10 md:mt-8 lg:mt-16">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/15 px-3 py-1.5 text-[9px] font-semibold tracking-[0.18em] text-champagne backdrop-blur-sm"><Sparkles aria-hidden="true" className="size-3" /> OPZY HOTEL PLATFORM</p>
            <h1 className="mt-4 font-display text-[clamp(34px,5vw,58px)] leading-[1.06]">Hospitality, <em className="font-normal text-champagne">beautifully</em> in hand.</h1>
            <p className="mt-3 max-w-sm text-[11px] leading-5 text-white/80 sm:text-xs sm:leading-6">Your hotel’s private workspace for thoughtful service and seamless operations.</p>
          </div>
          <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/25 pt-4 sm:pt-5">
            <span className="inline-flex items-center gap-2 text-[9px] font-medium text-white/85 sm:text-[10px]"><MapPin aria-hidden="true" className="size-3.5 text-champagne" /> Victoria Island · Lagos</span>
            <span className="inline-flex items-center gap-1.5 text-[9px] text-white/70"><ShieldCheck aria-hidden="true" className="size-3.5 text-champagne" /> A dedicated space for hotel teams</span>
          </div>
        </section>

        <section className="relative flex min-h-[620px] items-center justify-center px-4 py-10 sm:px-8 sm:py-12 md:min-h-screen md:px-6 md:py-14 lg:px-10 lg:py-16 xl:px-16">
          <Link to="/" className="absolute right-5 top-6 hidden items-center gap-1.5 text-[10px] font-medium text-muted transition-colors hover:text-forest md:inline-flex lg:right-8 lg:top-8 xl:right-12 xl:top-9"><ArrowLeft aria-hidden="true" className="size-3.5" /> Back to hotel site</Link>
          <div className="w-full max-w-[440px]">
            <div className="mb-6 flex size-11 items-center justify-center border border-[#e9e2d3] bg-white text-amber-900 shadow-sm">
              <Hotel aria-hidden="true" className="size-5" />
            </div>
            <p className="text-[9px] font-semibold tracking-[0.19em] text-amber-800">{eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-[38px]">{title}</h2>
            <p className="mt-2 max-w-sm text-xs leading-5 text-muted">{description}</p>
            {previewOnly && <div className="mt-5 flex items-start gap-2.5 border-l-2 border-sky-700 bg-sky-50/80 px-3 py-2.5 text-[10px] leading-5 text-sky-950">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-sky-800" />
              <p><strong className="font-semibold">Preview mode.</strong> Authentication is not connected. Don’t enter a real password; nothing will be sent or saved.</p>
            </div>}
            <div className="mt-6">{children}</div>
            <p className="mt-7 text-center text-[9px] leading-5 text-muted">© {currentYear} OPZY HOSPITALITY <span className="mx-1.5 text-stone-300">·</span> PRIVATE HOTEL PORTAL</p>
          </div>
        </section>
      </div>
    </main>
  )
}

function PreviewNotice({ message }: { message: string }) {
  return <p role="status" className="mt-4 border border-amber-200 bg-amber-50 px-3 py-2.5 text-[10px] leading-5 text-amber-950">{message}</p>
}

const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-3 text-xs text-ink outline-none transition-colors placeholder:text-stone-400 hover:border-stone-300 focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

function EmailField() {
  return (
    <label className="block text-[10px] font-semibold tracking-wide text-ink">EMAIL ADDRESS
      <span className="relative mt-1.5 block"><Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" /><input className={`${fieldClass} pl-9`} type="email" name="email" autoComplete="email" placeholder="you@hotel.com" required /></span>
    </label>
  )
}

function PasswordField({ label = 'PASSWORD', autoComplete = 'current-password', name, minLength }: { label?: string; autoComplete?: string; name?: string; minLength?: number }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="block text-[10px] font-semibold tracking-wide text-ink">{label}
      <span className="relative mt-1.5 block">
        <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
        <input className={`${fieldClass} pl-9 pr-11`} type={visible ? 'text' : 'password'} name={name ?? label.toLowerCase().replaceAll(' ', '-')} autoComplete={autoComplete} minLength={minLength} required />
        <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-muted transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-forest">
          {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        </button>
      </span>
    </label>
  )
}

export function HotelAdminLoginPage() {
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hotelChoices, setHotelChoices] = useState<HotelMembership[]>([])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setNeedsVerification(false)
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    try {
      const { token } = await apiRequest<PlatformLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setAccessToken(token)
      const profile = await apiRequest<PlatformProfileResponse>('/auth/me')
      const memberships = profile.memberships.filter(({ role }) => role === 'manager')
      if (memberships.length === 0) {
        clearAccessToken()
        setNotice('This account does not have manager access to a hotel.')
        return
      }

      sessionStorage.removeItem('pendingVerificationEmail')
      if (memberships.length === 1) {
        continueToHotel(memberships[0].hotelId)
        return
      }

      setHotelChoices(memberships)
    } catch (error) {
      clearAccessToken()
      const isVerificationError = (error instanceof ApiError && error.code === 'email_not_verified') || (error instanceof Error && /verify|verification|not verified|email_not_verified/i.test(error.message))
      if (isVerificationError) {
        sessionStorage.setItem('pendingVerificationEmail', email)
        setNeedsVerification(true)
        setNotice('Your email has not been verified yet. Verify it to continue.')
        return
      }
      setNotice(error instanceof Error ? error.message : 'Sign-in failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function continueToHotel(hotelId: string) {
    sessionStorage.setItem('selectedHotelId', hotelId)
    navigate('/dashboard/overview', { replace: true })
  }

  return (
    <PortalFrame eyebrow="HOTEL TEAM PORTAL" title="Welcome back" description="Sign in to manage your hotel’s day-to-day operations." previewOnly={false}>
      {hotelChoices.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted">Choose the hotel you want to manage.</p>
          {hotelChoices.map((hotel) => (
            <button key={hotel.hotelId} type="button" onClick={() => continueToHotel(hotel.hotelId)} className="flex min-h-12 w-full items-center justify-between border border-stone-200 bg-white px-4 text-left text-xs font-semibold text-ink transition-colors hover:border-forest">
              <span>{hotel.hotelName}</span><ArrowRight aria-hidden="true" className="size-4 text-forest" />
            </button>
          ))}
          <button type="button" onClick={() => { clearAccessToken(); sessionStorage.removeItem('selectedHotelId'); setHotelChoices([]); sessionStorage.removeItem('pendingVerificationEmail') }} className="w-full py-2 text-[10px] font-semibold text-forest underline-offset-2 hover:underline">Use another account</button>
        </div>
      ) : (
        <form onSubmit={(event) => { void submit(event) }} className="space-y-5">
          <EmailField />
          <PasswordField />
          <div className="-mt-2 text-right">
            <Link to="/hotel/forgot-password" className="text-[10px] font-semibold text-forest underline-offset-2 hover:underline">Forgot password?</Link>
          </div>
          <button type="submit" disabled={isSubmitting} className="group mt-1 flex min-h-12 w-full items-center justify-center gap-2 bg-forest px-4 py-3 text-[10px] font-semibold tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">{isSubmitting ? 'SIGNING IN…' : 'SIGN IN'} {!isSubmitting && <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />}</button>
          {notice && <PreviewNotice message={notice} />}
          {needsVerification && (
            <div className="mt-3 text-center">
              <Link to="/verify-email" className="inline-flex items-center justify-center gap-2 text-[10px] font-semibold text-forest underline-offset-2 hover:underline">Verify your email now <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
            </div>
          )}
          <div className="border-t border-stone-200 pt-4 text-center">
            <p className="text-[10px] text-muted">New to the platform? <Link to="/hotel/register" className="font-semibold text-forest underline-offset-2 hover:underline">Register your hotel</Link></p>
          </div>
        </form>
      )}
    </PortalFrame>
  )
}

export function HotelForgotPasswordPage() {
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    try {
      const result = await apiRequest<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setNotice(result.message)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not request a password reset. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PortalFrame eyebrow="ACCOUNT RECOVERY" title="Reset your password" description="Enter your account email and we’ll send a link to reset your password." previewOnly={false}>
      <form onSubmit={(event) => { void submit(event) }} className="space-y-5">
        <EmailField />
        <button type="submit" disabled={isSubmitting} className="group flex min-h-12 w-full items-center justify-center gap-2 bg-forest px-4 py-3 text-[10px] font-semibold tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">{isSubmitting ? 'SENDING…' : 'SEND RESET LINK'} {!isSubmitting && <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />}</button>
        {notice && <PreviewNotice message={notice} />}
      </form>
      <div className="mt-6 border-t border-stone-200 pt-4 text-center">
        <p className="text-[10px] text-muted"><Link to="/hotel/login" className="font-semibold text-forest underline-offset-2 hover:underline">Back to sign in</Link></p>
      </div>
    </PortalFrame>
  )
}

export function HotelResetPasswordPage() {
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const token = new URLSearchParams(window.location.search).get('token') ?? ''

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    const formData = new FormData(event.currentTarget)
    const password = String(formData.get('password') ?? '')
    const confirmPassword = String(formData.get('confirm-password') ?? '')
    if (password !== confirmPassword) {
      setNotice('The passwords do not match. Please check both password fields.')
      return
    }
    if (!token) {
      setNotice('This password-reset link is missing its token. Request a new reset link.')
      return
    }

    setIsSubmitting(true)
    try {
      await apiRequest<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      })
      setIsComplete(true)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not reset your password. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PortalFrame eyebrow="ACCOUNT RECOVERY" title={isComplete ? 'Password updated' : 'Choose a new password'} description={isComplete ? 'Your password has been reset. You can now sign in with your new password.' : 'Enter a new password for your hotel administrator account.'} previewOnly={false}>
      {isComplete ? (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-4 text-xs leading-5 text-emerald-950" role="status">
          Your password has been reset successfully. <Link to="/hotel/login" className="font-semibold text-forest underline-offset-2 hover:underline">Sign in</Link>
        </div>
      ) : (
        <form onSubmit={(event) => { void submit(event) }} className="space-y-4">
          <PasswordField label="NEW PASSWORD" autoComplete="new-password" name="password" minLength={12} />
          <PasswordField label="CONFIRM PASSWORD" autoComplete="new-password" name="confirm-password" minLength={12} />
          <p className="text-[9px] leading-4 text-muted">Use at least 12 characters.</p>
          <button type="submit" disabled={isSubmitting} className="group flex min-h-12 w-full items-center justify-center gap-2 bg-forest px-4 py-3 text-[10px] font-semibold tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">{isSubmitting ? 'UPDATING…' : 'UPDATE PASSWORD'} {!isSubmitting && <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />}</button>
          {notice && <PreviewNotice message={notice} />}
          <div className="border-t border-stone-200 pt-4 text-center">
            <p className="text-[10px] text-muted"><Link to="/hotel/forgot-password" className="font-semibold text-forest underline-offset-2 hover:underline">Request a new reset link</Link></p>
          </div>
        </form>
      )}
    </PortalFrame>
  )
}

export function HotelAdminRegistrationPage() {
  const [notice, setNotice] = useState('')
  const [verificationEmail, setVerificationEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResending, setIsResending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setVerificationEmail('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const password = formData.get('password')
    const confirmPassword = formData.get('confirm-password')
    if (password !== confirmPassword) {
      setNotice('The passwords do not match. Please check both password fields.')
      return
    }

    setIsSubmitting(true)
    const value = (name: string) => String(formData.get(name) ?? '').trim()
    const registration = {
      hotel: {
        name: value('hotel-name'),
        email: value('hotel-email'),
        phone: value('hotel-phone'),
        address: {
          line1: value('hotel-address-line1'),
          line2: value('hotel-address-line2'),
          city: value('hotel-city'),
          region: value('hotel-region'),
          postalCode: value('hotel-postal-code'),
          country: value('hotel-country').toUpperCase(),
        },
        type: value('hotel-type'),
        roomCount: Number(value('hotel-room-count')),
      },
      manager: {
        name: value('full-name'),
        email: value('email'),
        password: String(password),
      },
    }

    try {
      const result = await apiRequest<{ emailVerificationRequired: boolean }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registration),
      })
      if (!result.emailVerificationRequired) {
        throw new Error('Registration completed without an email verification requirement. Please contact the platform administrator.')
      }
      sessionStorage.setItem('pendingVerificationEmail', registration.manager.email)
      setVerificationEmail(registration.manager.email)
      form.reset()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function resendVerificationEmail() {
    if (!verificationEmail || isResending) return
    setNotice('')
    setIsResending(true)
    try {
      await apiRequest<{ message: string }>('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email: verificationEmail }),
      })
      sessionStorage.setItem('pendingVerificationEmail', verificationEmail)
      setNotice('A new 6-digit verification code has been sent to your email.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not send the verification code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <PortalFrame eyebrow="HOTEL TEAM PORTAL" title="Register your hotel" description="Create a hotel profile and the first administrator account for your team." previewOnly={false}>
      {verificationEmail ? (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-950" role="status">
          <p className="font-semibold">Check your inbox for a 6-digit verification code.</p>
          <p className="mt-1 text-xs">We sent a code to <strong>{verificationEmail}</strong>. Enter it in the verification page to continue setting up your hotel.</p>
          <Link to="/verify-email" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-forest underline-offset-2 hover:underline">Continue to verification <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
          <button type="button" onClick={() => { void resendVerificationEmail() }} disabled={isResending} className="mt-3 block text-xs font-semibold text-forest underline-offset-2 hover:underline disabled:opacity-60">{isResending ? 'Sending…' : 'Resend verification code'}</button>
          {notice && <p role="status" className="mt-2 text-xs text-muted">{notice}</p>}
        </div>
      ) : <form onSubmit={(event) => { void submit(event) }} className="space-y-5">
        <div>
          <p className="mb-3 border-b border-stone-200 pb-2 text-[9px] font-semibold tracking-[0.16em] text-amber-800">HOTEL DETAILS</p>
          <div className="space-y-3">
            <label className="block text-[10px] font-semibold tracking-wide text-ink">HOTEL NAME
              <span className="relative mt-1.5 block"><Building2 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" /><input className={`${fieldClass} pl-9`} name="hotel-name" autoComplete="organization" placeholder="Your hotel name" minLength={2} maxLength={120} required /></span>
            </label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">HOTEL CONTACT EMAIL
              <span className="relative mt-1.5 block"><Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" /><input className={`${fieldClass} pl-9`} type="email" name="hotel-email" autoComplete="organization" placeholder="info@yourhotel.com" maxLength={254} required /></span>
            </label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">HOTEL PHONE
              <input className={fieldClass} type="tel" name="hotel-phone" autoComplete="tel" placeholder="+234 801 234 5678" minLength={3} maxLength={40} required />
            </label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">STREET ADDRESS
              <input className={fieldClass} name="hotel-address-line1" autoComplete="address-line1" placeholder="Street address" maxLength={120} required />
            </label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">ADDRESS LINE 2 <span className="font-normal text-muted">(OPTIONAL)</span>
              <input className={fieldClass} name="hotel-address-line2" autoComplete="address-line2" placeholder="Apartment, suite, etc." maxLength={120} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[10px] font-semibold tracking-wide text-ink">CITY
                <input className={fieldClass} name="hotel-city" autoComplete="address-level2" placeholder="Lagos" maxLength={100} required />
              </label>
              <label className="block text-[10px] font-semibold tracking-wide text-ink">STATE / REGION <span className="font-normal text-muted">(OPTIONAL)</span>
                <input className={fieldClass} name="hotel-region" autoComplete="address-level1" placeholder="Lagos State" maxLength={100} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[10px] font-semibold tracking-wide text-ink">POSTAL CODE <span className="font-normal text-muted">(OPTIONAL)</span>
                <input className={fieldClass} name="hotel-postal-code" autoComplete="postal-code" placeholder="Postal code" maxLength={20} />
              </label>
              <label className="block text-[10px] font-semibold tracking-wide text-ink">COUNTRY CODE
                <input className={fieldClass} name="hotel-country" autoComplete="country" placeholder="NG" minLength={2} maxLength={2} pattern="[A-Za-z]{2}" title="Enter the two-letter country code, such as NG." required />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[10px] font-semibold tracking-wide text-ink">HOTEL TYPE
                <input className={fieldClass} name="hotel-type" placeholder="Boutique, resort..." minLength={2} maxLength={60} required />
              </label>
              <label className="block text-[10px] font-semibold tracking-wide text-ink">ROOM COUNT
                <input className={fieldClass} type="number" name="hotel-room-count" placeholder="40" min={0} max={100000} step={1} required />
              </label>
            </div>
          </div>
        </div>
        <div>
          <p className="mb-3 border-b border-stone-200 pb-2 text-[9px] font-semibold tracking-[0.16em] text-amber-800">ADMINISTRATOR ACCOUNT</p>
          <div className="space-y-3">
            <label className="block text-[10px] font-semibold tracking-wide text-ink">YOUR FULL NAME
              <span className="relative mt-1.5 block"><UserRound aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" /><input className={`${fieldClass} pl-9`} name="full-name" autoComplete="name" placeholder="Hotel owner or administrator" minLength={2} maxLength={120} required /></span>
            </label>
            <EmailField />
            <PasswordField label="CREATE PASSWORD" autoComplete="new-password" name="password" minLength={12} />
            <PasswordField label="CONFIRM PASSWORD" autoComplete="new-password" name="confirm-password" minLength={12} />
          </div>
        </div>
        <p className="text-[9px] leading-4 text-muted">Use at least 12 characters. The first registered user becomes this hotel’s manager.</p>
        <button type="submit" disabled={isSubmitting} className="group flex min-h-12 w-full items-center justify-center gap-2 bg-forest px-4 py-3 text-[10px] font-semibold tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">{isSubmitting ? 'CREATING ACCOUNT…' : 'CREATE HOTEL ACCOUNT'} {!isSubmitting && <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />}</button>
        {notice && <PreviewNotice message={notice} />}
      </form>}
      <div className="mt-5 border-t border-stone-100 pt-4 text-center">
        <p className="text-[10px] text-muted">Already registered? <Link to="/hotel/login" className="font-semibold text-forest underline-offset-2 hover:underline">Sign in</Link></p>
      </div>
    </PortalFrame>
  )
}

export function SuperAdminLoginPage() {
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice('')
    setNeedsVerification(false)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    try {
      const { token } = await apiRequest<PlatformLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setAccessToken(token)
      const profile = await apiRequest<PlatformProfileResponse>('/auth/me')
      if (!profile.isPlatformOperator) {
        clearAccessToken()
        setNotice('This account does not have platform administrator access.')
        return
      }

      navigate('/super-admin', { replace: true })
    } catch (error) {
      clearAccessToken()
      const isVerificationError = (error instanceof ApiError && error.code === 'email_not_verified') || (error instanceof Error && /verify|verification|not verified|email_not_verified/i.test(error.message))
      if (isVerificationError) {
        sessionStorage.setItem('pendingVerificationEmail', email)
        setNeedsVerification(true)
        setNotice('Your email has not been verified yet. Verify it to continue.')
        return
      }
      setNotice(error instanceof Error ? error.message : 'Sign-in failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PortalFrame eyebrow="RESTRICTED ACCESS" title="Platform sign in" description="Sign in to administer the hotel platform. Platform administrator accounts are provisioned by the platform owner." previewOnly={false}>
      <form onSubmit={(event) => { void submit(event) }} className="space-y-4">
        <EmailField />
        <PasswordField />
        <button type="submit" disabled={isSubmitting} className="group mt-1 flex min-h-12 w-full items-center justify-center gap-2 bg-forest px-4 py-3 text-[10px] font-semibold tracking-[0.12em] text-white shadow-sm transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">{isSubmitting ? 'SIGNING IN…' : 'SIGN IN TO PLATFORM'} {!isSubmitting && <ArrowRight aria-hidden="true" className="size-3.5 transition-transform group-hover:translate-x-1" />}</button>
        {notice && <PreviewNotice message={notice} />}
        {needsVerification && (
          <div className="mt-3 text-center">
            <Link to="/verify-email" className="inline-flex items-center justify-center gap-2 text-[10px] font-semibold text-forest underline-offset-2 hover:underline">Verify your email now <ArrowRight aria-hidden="true" className="size-3.5" /></Link>
          </div>
        )}
      </form>
      <div className="mt-5 border-t border-stone-100 pt-4 text-center">
        <p className="text-[10px] text-muted">Hotel administrator? <Link to="/hotel/login" className="font-semibold text-forest underline-offset-2 hover:underline">Go to hotel sign in</Link></p>
        <p className="mt-2 text-[9px] text-muted">Platform accounts are invitation-only. There is no public registration.</p>
      </div>
    </PortalFrame>
  )
}
