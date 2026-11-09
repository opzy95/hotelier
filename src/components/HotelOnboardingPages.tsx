import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, Check, Hotel, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError, apiRequest } from '../api'
import type { HotelOnboardingResponse, HotelPlan, PlatformProfileResponse } from '../api'

function OnboardingFrame({ eyebrow, title, description, children }: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-10 font-body text-ink sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-forest no-underline">
          <Hotel aria-hidden="true" className="size-5" /> OPZY HOSPITALITY
        </Link>
        <div className="mt-8 border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-[9px] font-semibold tracking-[0.19em] text-amber-800">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-xl text-xs leading-5 text-muted">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  )
}

function Notice({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'success' }) {
  const styles = tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
    : 'border-rose-200 bg-rose-50 text-rose-950'
  return <p role="status" className={`mt-4 border px-3 py-2.5 text-xs leading-5 ${styles}`}>{children}</p>
}

export function EmailVerificationPage() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [resendNotice, setResendNotice] = useState('')
  const token = new URLSearchParams(window.location.search).get('token') ?? ''

  async function verifyEmail() {
    if (!token || isVerifying) return
    setError('')
    setIsVerifying(true)
    try {
      await apiRequest<{ message: string }>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
      setIsVerified(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Email verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  async function resendVerificationEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setResendNotice('')
    setIsResending(true)
    try {
      const result = await apiRequest<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setResendNotice(result.message)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not resend the verification email.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <OnboardingFrame eyebrow="EMAIL VERIFICATION" title={isVerified ? 'Email verified' : 'Verify your email'} description={isVerified ? 'Your account is ready. Sign in to choose a plan and finish setting up your hotel.' : 'Verify the email address you used to register your hotel account.'}>
      {isVerified ? (
        <Notice tone="success">Your email is verified. Sign in to continue to plan selection and hotel setup.</Notice>
      ) : token ? (
        <>
          <button type="button" onClick={() => { void verifyEmail() }} disabled={isVerifying} className="mt-2 inline-flex min-h-11 items-center gap-2 bg-forest px-5 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">
            {isVerifying ? 'VERIFYING…' : 'VERIFY EMAIL'} {isVerifying ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Check aria-hidden="true" className="size-4" />}
          </button>
          {error && <Notice>{error}</Notice>}
        </>
      ) : (
        <Notice>The verification link is missing its token. Enter your registration email to request a new link.</Notice>
      )}
      {!isVerified && (error || !token) && (
        <form onSubmit={(event) => { void resendVerificationEmail(event) }} className="mt-4">
          <label className="block text-[10px] font-semibold tracking-wide">REGISTRATION EMAIL
            <input className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-3 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10" type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
          </label>
          <button type="submit" disabled={isResending} className="mt-3 min-h-10 border border-forest px-4 text-xs font-semibold text-forest transition-colors hover:bg-forest hover:text-white disabled:cursor-wait disabled:opacity-60">{isResending ? 'SENDING…' : 'RESEND VERIFICATION EMAIL'}</button>
          {resendNotice && <Notice tone="success">{resendNotice}</Notice>}
          {error && !token && <Notice>{error}</Notice>}
        </form>
      )}
      <p className="mt-5 text-xs text-muted">
        {isVerified ? 'Next step: ' : 'Already verified? '}
        <Link to="/hotel/login" className="font-semibold text-forest underline-offset-2 hover:underline">Sign in to your hotel account</Link>
      </p>
    </OnboardingFrame>
  )
}

function formatPlanPrice(plan: HotelPlan) {
  const fractionDigits = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: plan.currency,
  }).resolvedOptions().maximumFractionDigits ?? 2
  const price = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: plan.currency,
  }).format(plan.amountMinor / 10 ** fractionDigits)
  return `${price} / ${plan.interval === 'month' ? 'month' : 'year'}`
}

function LoadingPanel() {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-muted" role="status">
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-forest" /> Loading your hotel setup…
    </div>
  )
}

function HotelSettingsStep({ onComplete, isSaving, error }: {
  onComplete: (settings: Record<string, string>) => void
  isSaving: boolean
  error: string
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const setting = (name: string) => String(data.get(name) ?? '').trim()
    onComplete({
      timezone: setting('timezone'),
      locale: setting('locale'),
      currency: setting('currency').toUpperCase(),
      checkInTime: setting('check-in-time'),
      checkOutTime: setting('check-out-time'),
    })
  }

  const inputClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-3 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-[10px] font-semibold tracking-wide">TIMEZONE
          <input className={inputClass} name="timezone" defaultValue="Africa/Lagos" placeholder="Africa/Lagos" minLength={1} maxLength={80} required />
        </label>
        <label className="text-[10px] font-semibold tracking-wide">LOCALE
          <input className={inputClass} name="locale" defaultValue="en-NG" placeholder="en-NG" minLength={2} maxLength={20} required />
        </label>
        <label className="text-[10px] font-semibold tracking-wide">CURRENCY CODE
          <input className={inputClass} name="currency" defaultValue="NGN" placeholder="NGN" minLength={3} maxLength={3} pattern="[A-Za-z]{3}" title="Enter a three-letter currency code, such as NGN." required />
        </label>
        <label className="text-[10px] font-semibold tracking-wide">CHECK-IN TIME
          <input className={inputClass} type="time" name="check-in-time" defaultValue="14:00" required />
        </label>
        <label className="text-[10px] font-semibold tracking-wide">CHECK-OUT TIME
          <input className={inputClass} type="time" name="check-out-time" defaultValue="11:00" required />
        </label>
      </div>
      {error && <Notice>{error}</Notice>}
      <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center gap-2 bg-forest px-5 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">
        {isSaving ? 'SAVING…' : 'SAVE AND CONTINUE'} {!isSaving && <ArrowRight aria-hidden="true" className="size-4" />}
      </button>
    </form>
  )
}

export function HotelOnboardingPage() {
  const navigate = useNavigate()
  const [token] = useState(() => sessionStorage.getItem('hotelAccessToken') ?? '')
  const [hotelId] = useState(() => sessionStorage.getItem('selectedHotelId') ?? '')
  const [onboarding, setOnboarding] = useState<HotelOnboardingResponse | null>(null)
  const [plans, setPlans] = useState<HotelPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [paymentNotice, setPaymentNotice] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!token || !hotelId) return
    let cancelled = false

    async function loadSetup() {
      setLoading(true)
      setError('')
      try {
        const profile = await apiRequest<PlatformProfileResponse>('/auth/me', {}, token)
        const membership = profile.memberships.find((item) => item.hotelId === hotelId && item.role === 'manager')
        if (!membership) throw new Error('You do not have manager access to this hotel.')

        const current = await apiRequest<HotelOnboardingResponse>(`/hotels/${encodeURIComponent(hotelId)}/onboarding`, {}, token)
        if (cancelled) return
        setOnboarding(current)
        if (current.currentStep === 'choose_plan') {
          const result = await apiRequest<{ data: HotelPlan[] }>('/public/plans')
          if (!cancelled) setPlans(result.data)
        }
      } catch (requestError) {
        if (!cancelled) {
          if (requestError instanceof ApiError && requestError.status === 401) {
            sessionStorage.removeItem('hotelAccessToken')
            sessionStorage.removeItem('selectedHotelId')
            navigate('/hotel/login', { replace: true })
            return
          }
          setError(requestError instanceof Error ? requestError.message : 'Could not load hotel setup.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSetup()
    return () => { cancelled = true }
  }, [hotelId, navigate, reloadKey, token])

  async function selectPlan(planId: string) {
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest<{ paymentRequired: boolean }>(`/hotels/${encodeURIComponent(hotelId)}/subscription`, {
        method: 'PUT',
        body: JSON.stringify({ planId }),
      }, token)
      setPaymentNotice(result.paymentRequired)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save your plan selection.')
    } finally {
      setSaving(false)
    }
  }

  async function saveHotelSettings(settings: Record<string, string>) {
    setSaving(true)
    setError('')
    try {
      await apiRequest(`/hotels/${encodeURIComponent(hotelId)}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }, token)
      setReloadKey((key) => key + 1)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save hotel settings.')
    } finally {
      setSaving(false)
    }
  }

  if (!token || !hotelId) return <Navigate to="/hotel/login" replace />
  if (onboarding?.currentStep === 'complete' && !loading) return <Navigate to="/dashboard/overview" replace />

  return (
    <OnboardingFrame eyebrow="HOTEL SETUP" title="Let’s prepare your hotel" description="Choose a subscription and configure the essential settings before opening your hotel workspace.">
      <div className="mb-6 flex items-center gap-2 text-[10px] font-semibold tracking-wide text-muted">
        <span className={`inline-flex items-center gap-1.5 ${onboarding?.currentStep !== 'choose_plan' ? 'text-forest' : 'text-amber-800'}`}><span className="grid size-5 place-items-center rounded-full border border-current">1</span> PLAN</span>
        <span className="h-px flex-1 bg-stone-200" />
        <span className={`inline-flex items-center gap-1.5 ${onboarding?.currentStep === 'configure_hotel' ? 'text-amber-800' : 'text-muted'}`}><span className="grid size-5 place-items-center rounded-full border border-current">2</span> HOTEL DETAILS</span>
        <span className="h-px flex-1 bg-stone-200" />
        <span className="inline-flex items-center gap-1.5 text-muted"><span className="grid size-5 place-items-center rounded-full border border-current">3</span> DASHBOARD</span>
      </div>

      {loading ? <LoadingPanel /> : error && !onboarding ? (
        <><Notice>{error}</Notice><button type="button" onClick={() => { setReloadKey((key) => key + 1) }} className="mt-4 text-xs font-semibold text-forest underline-offset-2 hover:underline">Try again</button></>
      ) : onboarding?.currentStep === 'choose_plan' ? (
        <section>
          <h2 className="font-display text-xl">Choose a plan</h2>
          <p className="mt-1 text-xs text-muted">You can continue to hotel setup after selecting a plan.</p>
          {error && <Notice>{error}</Notice>}
          {plans.length === 0 ? <Notice>No active plans are available yet. Please contact the platform administrator.</Notice> : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <article key={plan._id} className="flex flex-col border border-stone-200 p-4">
                  <h3 className="font-display text-lg">{plan.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-forest">{formatPlanPrice(plan)}</p>
                  {plan.trialDays > 0 && <p className="mt-1 text-[10px] text-muted">{plan.trialDays}-day free trial</p>}
                  <ul className="my-4 flex-1 space-y-2 text-xs text-muted">
                    {plan.features.map((feature) => <li key={feature} className="flex gap-2"><Check aria-hidden="true" className="size-3.5 shrink-0 text-forest" />{feature}</li>)}
                  </ul>
                  <button type="button" disabled={saving} onClick={() => { void selectPlan(plan._id) }} className="flex min-h-10 items-center justify-center gap-2 bg-forest px-3 text-[10px] font-semibold tracking-wide text-white hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">
                    {saving ? 'SAVING…' : 'CHOOSE PLAN'} {!saving && <ArrowRight aria-hidden="true" className="size-3.5" />}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : onboarding?.currentStep === 'configure_hotel' ? (
        <section>
          <h2 className="font-display text-xl">Set your hotel preferences</h2>
          <p className="mt-1 text-xs text-muted">These settings control the hotel’s local time, language, currency, and check-in schedule.</p>
          {paymentNotice && <Notice tone="success">Plan selected. Payment for this plan is still pending; online payment is not available yet. You can finish setting up your hotel.</Notice>}
          {onboarding.hotelStatus === 'pending_approval' && <p className="mt-3 flex items-start gap-2 border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5 text-[10px] leading-5 text-amber-950"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />After setup, your hotel will still need platform administrator approval before activation.</p>}
          <HotelSettingsStep onComplete={(settings) => { void saveHotelSettings(settings) }} isSaving={saving} error={error} />
        </section>
      ) : (
        <><Notice>{error || 'Hotel setup is not available. Please sign in again or contact the platform administrator.'}</Notice><Link to="/hotel/login" className="mt-4 inline-block text-xs font-semibold text-forest underline-offset-2 hover:underline">Return to sign in</Link></>
      )}
    </OnboardingFrame>
  )
}

export function HotelDashboardGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [token] = useState(() => sessionStorage.getItem('hotelAccessToken') ?? '')
  const [hotelId] = useState(() => sessionStorage.getItem('selectedHotelId') ?? '')
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token || !hotelId) return
    let cancelled = false

    async function verifySetup() {
      try {
        const profile = await apiRequest<PlatformProfileResponse>('/auth/me', {}, token)
        const membership = profile.memberships.find((item) => item.hotelId === hotelId && item.role === 'manager')
        if (!membership) throw new Error('You do not have manager access to this hotel.')
        const status = await apiRequest<HotelOnboardingResponse>(`/hotels/${encodeURIComponent(hotelId)}/onboarding`, {}, token)
        if (cancelled) return
        if (status.currentStep === 'complete') setIsReady(true)
        else navigate('/hotel/onboarding', { replace: true })
      } catch (requestError) {
        if (cancelled) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          sessionStorage.removeItem('hotelAccessToken')
          sessionStorage.removeItem('selectedHotelId')
          navigate('/hotel/login', { replace: true })
          return
        }
        setError(requestError instanceof Error ? requestError.message : 'Could not verify hotel access.')
      }
    }

    void verifySetup()
    return () => { cancelled = true }
  }, [hotelId, navigate, token])

  if (!token || !hotelId) return <Navigate to="/hotel/login" replace />
  if (error) return <OnboardingFrame eyebrow="HOTEL ACCESS" title="Could not open your dashboard" description="We could not verify your account and hotel setup."><Notice>{error}</Notice><button type="button" onClick={() => window.location.reload()} className="mt-4 text-xs font-semibold text-forest underline-offset-2 hover:underline">Try again</button></OnboardingFrame>
  if (!isReady) return <OnboardingFrame eyebrow="HOTEL ACCESS" title="Checking your setup" description="Confirming your hotel account and onboarding status."><LoadingPanel /></OnboardingFrame>
  return children
}
