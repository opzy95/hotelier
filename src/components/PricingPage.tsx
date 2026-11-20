import { useEffect, useState } from 'react'
import { ArrowRight, Check, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchPublicPlans, formatPlanPrice, getPublicPlanOptions } from '../api/publicPlans'
import type { PublicPlan } from '../api/publicPlans'

export function PricingPage() {
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    void fetchPublicPlans()
      .then((result) => {
        if (!cancelled) setPlans(result)
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Could not load subscription plans.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [reloadKey])

  const planOptions = getPublicPlanOptions(plans)

  return (
    <div className="min-h-[70vh] bg-[#faf9f6] px-4 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-9 max-w-2xl text-center sm:mb-12">
          <p className="text-[9px] font-semibold tracking-[0.18em] text-amber-800">SIMPLE, TRANSPARENT PRICING</p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">Plans for every stay business</h1>
          <p className="mx-auto mt-3 max-w-xl text-xs leading-6 text-muted sm:text-sm">
            Manage rooms, reservations, payments and staff from one dashboard, and give guests a direct link to book from anywhere.
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted" role="status">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-forest" /> Loading plans…
          </div>
        ) : error ? (
          <div className="mx-auto max-w-xl border border-rose-200 bg-rose-50 p-4 text-center">
            <p role="alert" className="text-xs leading-5 text-rose-900">{error}</p>
            <button
              type="button"
              onClick={() => { setError(''); setLoading(true); setReloadKey((current) => current + 1) }}
              className="mt-3 text-xs font-semibold text-forest underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : planOptions.length === 0 ? (
          <p className="border border-stone-200 bg-white p-5 text-center text-xs text-muted">No public plans are available right now. Please check back soon.</p>
        ) : (
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planOptions.map((option, index) => (
              <article key={option.key} className={`flex min-w-0 flex-col border bg-white p-5 shadow-sm sm:p-6 ${index === 0 ? 'border-amber-700/50 ring-1 ring-amber-700/10' : 'border-stone-200'}`}>
                <div className="flex min-h-6 items-center justify-between gap-2">
                  <span className="text-[9px] font-semibold tracking-[0.14em] text-amber-800">{option.price ? option.price.billingInterval.replace(/_/g, ' ').toUpperCase() : 'NO PAYMENT REQUIRED'}</span>
                  {index === 0 && <span className="bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-900">START HERE</span>}
                </div>
                <h2 className="mt-3 font-display text-2xl text-ink">{option.name}</h2>
                <p className="mt-2 min-h-10 text-xs leading-5 text-muted">{option.description}</p>

                <div className="mt-5 min-h-[72px]">
                  {option.price ? (
                    <>
                      <p className="text-xl font-semibold text-forest">{formatPlanPrice(option.price)}</p>
                      <p className="mt-1 text-[10px] text-muted">Billed every {option.price.billingInterval.replace(/_/g, ' ')}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-semibold text-forest">Free</p>
                      <p className="mt-1 text-[10px] text-muted">{option.trialDays}-day free trial</p>
                    </>
                  )}
                </div>

                <div className="my-4 h-px bg-stone-200" />
                <p className="text-[9px] font-semibold tracking-[0.12em] text-ink">WHAT’S INCLUDED</p>
                <ul className="my-4 flex-1 space-y-2.5 text-[11px] leading-4 text-muted">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check aria-hidden="true" className="size-3.5 shrink-0 text-forest" />
                      <span className="capitalize">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/hotel/register"
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 bg-forest px-4 text-[10px] font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep"
                >
                  {option.price ? 'GET STARTED' : 'START FREE TRIAL'} <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              </article>
            ))}
          </div>
        )}

        <p className="mt-7 text-center text-[10px] leading-5 text-muted">
          You’ll choose your plan and billing period during hotel setup. <Link to="/hotel/register" className="font-semibold text-forest underline-offset-2 hover:underline">Register your property</Link> to get started.
        </p>
      </div>
    </div>
  )
}
