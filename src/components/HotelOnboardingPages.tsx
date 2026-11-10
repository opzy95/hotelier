import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ArrowRight, Check, Hotel, LoaderCircle, ShieldCheck } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ApiError, apiRequest } from '../api'
import type { HotelOnboardingResponse, PlatformProfileResponse } from '../api'

function OnboardingFrame({ eyebrow, title, description, wide = false, children }: {
  eyebrow: string
  title: string
  description: string
  wide?: boolean
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-10 font-body text-ink sm:px-8 sm:py-14">
      <div className={`mx-auto ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}>
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

type OnboardingPlan = {
  id: string
  code: string
  name: string
  description: string
  trialDays: number
  features: string[]
  prices: {
    amount: number
    currency: string
    billingInterval: string
  }[]
}

type OnboardingPlanOption = {
  key: string
  id: string
  code: string
  name: string
  description: string
  trialDays: number
  features: string[]
  price?: OnboardingPlan['prices'][number]
}

export function EmailVerificationPage() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [email, setEmail] = useState(() => sessionStorage.getItem('pendingVerificationEmail') ?? '')
  const [code, setCode] = useState('')
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (!email) {
      const storedEmail = sessionStorage.getItem('pendingVerificationEmail') ?? ''
      if (storedEmail) setEmail(storedEmail)
    }
  }, [email])

  useEffect(() => {
    if (cooldownSeconds <= 0) return

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldownSeconds])

  async function sendVerificationCode() {
    const cleanEmail = email.trim()
    if (!cleanEmail || isSendingCode || cooldownSeconds > 0) return
    setError('')
    setNotice('')
    setIsSendingCode(true)
    try {
      await apiRequest<{ message: string }>('/auth/send-verification-code', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      })
      setNotice('A 6-digit verification code has been sent to your email.')
      setCooldownSeconds(60)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send the verification code. Please try again.')
    } finally {
      setIsSendingCode(false)
    }
  }

  async function verifyEmailCode() {
    const cleanEmail = email.trim()
    const cleanCode = code.trim()
    if (!cleanEmail || cleanCode.length !== 6 || isVerifying) return
    setError('')
    setNotice('')
    setIsVerifying(true)
    try {
      await apiRequest<{ message: string }>('/auth/verify-code', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      })
      setIsVerified(true)
      sessionStorage.removeItem('pendingVerificationEmail')
      setEmail('')
      setCode('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The verification code is invalid or has expired. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <OnboardingFrame eyebrow="EMAIL VERIFICATION" title={isVerified ? 'Email verified' : 'Verify your email'} description={isVerified ? 'Your account is ready. Sign in to choose a plan and finish setting up your hotel.' : 'Enter your registration email and the 6-digit code we send to it to continue.'}>
      {isVerified ? (
        <Notice tone="success">Your email is verified. Sign in to continue to plan selection and hotel setup.</Notice>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={(event) => { event.preventDefault(); void verifyEmailCode() }}>
          <label className="block text-[10px] font-semibold tracking-wide">REGISTRATION EMAIL
            <input className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-3 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10" type="email" name="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
          </label>

          <div>
            <label className="block text-[10px] font-semibold tracking-wide">VERIFICATION CODE
              <input className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-3 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" required />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => { void sendVerificationCode() }} disabled={isSendingCode || cooldownSeconds > 0} className="min-h-10 border border-forest px-4 text-xs font-semibold text-forest transition-colors hover:bg-forest hover:text-white disabled:cursor-wait disabled:opacity-60">
              {isSendingCode ? 'SENDING…' : cooldownSeconds > 0 ? `RESEND IN ${cooldownSeconds}s` : 'SEND CODE'}
            </button>
            <button type="submit" disabled={isVerifying || code.length !== 6} className="inline-flex min-h-11 items-center gap-2 bg-forest px-5 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">
              {isVerifying ? 'VERIFYING…' : 'VERIFY CODE'} {isVerifying ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Check aria-hidden="true" className="size-4" />}
            </button>
          </div>

          {notice && <Notice tone="success">{notice}</Notice>}
          {error && <Notice>{error}</Notice>}
        </form>
      )}

      <p className="mt-5 text-xs text-muted">
        {isVerified ? 'Next step: ' : 'Already verified? '}
        <Link to="/hotel/login" className="font-semibold text-forest underline-offset-2 hover:underline">Sign in to your hotel account</Link>
      </p>
    </OnboardingFrame>
  )
}

function formatPlanPrice(price: OnboardingPlan['prices'][number]) {
  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: 2,
  }).format(price.amount)
  const months = Number(price.billingInterval.match(/^\d+/)?.[0])
  const interval = Number.isFinite(months)
    ? `${months} ${months === 1 ? 'month' : 'months'}`
    : price.billingInterval.replace(/_/g, ' ')
  return `${formattedPrice} / ${interval}`
}

function isPlanDefinition(value: unknown): value is {
  id: string
  code: string
  name: string
  description: string
  trial_days: number
  sort_order: number
  features: Record<string, boolean>
} {
  if (typeof value !== 'object' || value === null) return false
  if (!('id' in value) || !('code' in value) || !('name' in value) || !('description' in value) || !('trial_days' in value) || !('sort_order' in value) || !('features' in value)) return false
  if (typeof value.features !== 'object' || value.features === null || Array.isArray(value.features)) return false

  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.trial_days === 'number'
    && Number.isFinite(value.trial_days)
    && typeof value.sort_order === 'number'
    && Number.isFinite(value.sort_order)
    && Object.values(value.features).every((feature) => typeof feature === 'boolean')
}

function isPlanPrice(value: unknown): value is {
  plan_code: string
  billing_interval: string
  amount: number
  currency: string
} {
  if (typeof value !== 'object' || value === null) return false
  if (!('plan_code' in value) || !('billing_interval' in value) || !('amount' in value) || !('currency' in value)) return false

  return typeof value.plan_code === 'string'
    && typeof value.billing_interval === 'string'
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && typeof value.currency === 'string'
}

function getPublicPlans(payload: unknown): OnboardingPlan[] {
  if (typeof payload !== 'object' || payload === null || !('plans' in payload) || !Array.isArray(payload.plans) || !('plan_prices' in payload) || !Array.isArray(payload.plan_prices)) {
    throw new Error('The hotel API returned an invalid plans response.')
  }
  if (!payload.plans.every(isPlanDefinition) || !payload.plan_prices.every(isPlanPrice)) {
    throw new Error('The hotel API returned an invalid plans response.')
  }

  const pricesByPlan = new Map<string, OnboardingPlan['prices']>()
  for (const price of payload.plan_prices) {
    const prices = pricesByPlan.get(price.plan_code) ?? []
    prices.push({
      amount: price.amount,
      currency: price.currency,
      billingInterval: price.billing_interval,
    })
    pricesByPlan.set(price.plan_code, prices)
  }

  return [...payload.plans]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      trialDays: plan.trial_days,
      features: Object.entries(plan.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature.replace(/_/g, ' ')),
      prices: pricesByPlan.get(plan.code) ?? [],
    }))
}

function getPlanOptions(plans: OnboardingPlan[]): OnboardingPlanOption[] {
  return plans.flatMap((plan) => {
    const options = plan.prices.length > 0
      ? [...plan.prices].sort((left, right) => Number(right.billingInterval.match(/^\d+/)?.[0] ?? 0) - Number(left.billingInterval.match(/^\d+/)?.[0] ?? 0))
      : [undefined]

    return options.map((price) => ({
      key: `${plan.code}-${price?.billingInterval ?? 'trial'}`,
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      trialDays: plan.trialDays,
      features: plan.features,
      price,
    }))
  })
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
  const [plans, setPlans] = useState<OnboardingPlan[]>([])
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
          const result = await apiRequest<unknown>('/public/plans')
          const availablePlans = getPublicPlans(result)
          if (!cancelled) setPlans(availablePlans)
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

  async function selectPlan(planId: string, billingInterval?: string) {
    setSaving(true)
    setError('')
    try {
      const result = await apiRequest<{ paymentRequired: boolean }>(`/hotels/${encodeURIComponent(hotelId)}/subscription`, {
        method: 'PUT',
        body: JSON.stringify({ planId, ...(billingInterval ? { billingInterval } : {}) }),
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

  const planOptions = getPlanOptions(plans)

  return (
    <OnboardingFrame wide eyebrow="HOTEL SETUP" title="Let’s prepare your hotel" description="Choose a subscription and configure the essential settings before opening your hotel workspace.">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.16em] text-amber-800">STEP 1 OF 3</p>
              <h2 className="mt-1 font-display text-2xl">Find the right plan for your hotel</h2>
              <p className="mt-1 max-w-xl text-xs leading-5 text-muted">Start with a free trial or choose a Professional billing period. You can continue to hotel setup after selecting a plan.</p>
            </div>
            <p className="shrink-0 text-[10px] text-muted">All plans include the features below</p>
          </div>
          {error && <Notice>{error}</Notice>}
          {plans.length === 0 ? error ? (
            <button type="button" onClick={() => { setReloadKey((key) => key + 1) }} className="mt-4 text-xs font-semibold text-forest underline-offset-2 hover:underline">Try again</button>
          ) : <Notice>No active plans are available yet. Please contact the platform administrator.</Notice> : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {planOptions.map((option, index) => (
                <article key={option.key} className={`flex min-w-0 flex-col rounded-sm border bg-white p-5 shadow-sm ${index === 0 ? 'border-amber-700/50 ring-1 ring-amber-700/10' : 'border-stone-200'}`}>
                  <div className="flex min-h-6 items-center justify-between gap-2">
                    <span className="text-[9px] font-semibold tracking-[0.14em] text-amber-800">{option.price ? option.price.billingInterval.replace(/_/g, ' ').toUpperCase() : 'NO PAYMENT REQUIRED'}</span>
                    {index === 0 && <span className="bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-900">GET STARTED</span>}
                  </div>
                  <h3 className="mt-3 font-display text-xl">{option.name}</h3>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-muted">{option.description}</p>
                  <div className="mt-4 min-h-[58px]">
                    {option.price ? (
                      <>
                        <p className="text-lg font-semibold text-forest">{formatPlanPrice(option.price)}</p>
                        <p className="mt-1 text-[10px] text-muted">Billed every {option.price.billingInterval.replace(/_/g, ' ')}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-forest">Free</p>
                        <p className="mt-1 text-[10px] text-muted">{option.trialDays}-day free trial</p>
                      </>
                    )}
                  </div>
                  <div className="my-4 h-px bg-stone-200" />
                  <p className="text-[9px] font-semibold tracking-[0.12em] text-ink">INCLUDED FEATURES</p>
                  <ul className="my-3 flex-1 space-y-2 text-[11px] leading-4 text-muted">
                    {option.features.map((feature) => <li key={feature} className="flex gap-2"><Check aria-hidden="true" className="size-3.5 shrink-0 text-forest" /><span className="capitalize">{feature}</span></li>)}
                  </ul>
                  <button type="button" disabled={saving} onClick={() => { void selectPlan(option.id, option.price?.billingInterval) }} className="mt-4 flex min-h-11 items-center justify-center gap-2 bg-forest px-3 text-[10px] font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">
                    {saving ? 'SAVING…' : 'CHOOSE THIS PLAN'} {!saving && <ArrowRight aria-hidden="true" className="size-3.5" />}
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
