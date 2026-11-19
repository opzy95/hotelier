import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, LoaderCircle } from 'lucide-react'
import { apiRequest, publicApiRequest } from '../api'
import type { HotelSettings, PlatformProfileResponse, PublicHotel } from '../api'

const EMPTY_SETTINGS: HotelSettings = {
  timezone: 'Africa/Lagos',
  locale: 'en-NG',
  currency: 'NGN',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  bankDetails: {
    bankName: '',
    bankAccountNumber: '',
    accountName: '',
  },
}

const inputClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-3 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(record: Record<string, unknown>, key: string, fallback: string) {
  return typeof record[key] === 'string' ? record[key] : fallback
}

function parseHotelSettings(payload: unknown): HotelSettings {
  if (!isRecord(payload)) throw new Error('The hotel API returned invalid settings.')

  const data = isRecord(payload.data) ? payload.data : payload
  const hotel = isRecord(data.hotel) ? data.hotel : undefined
  const hotelSettings = hotel && isRecord(hotel.settings) ? hotel.settings : undefined
  const current = isRecord(data.settings) ? data.settings : hotelSettings ?? data
  const bankDetails = isRecord(current.bankDetails)
    ? current.bankDetails
    : isRecord(data.bankDetails)
      ? data.bankDetails
      : hotel && isRecord(hotel.bankDetails)
        ? hotel.bankDetails
        : undefined
  const hasSettings = ['timezone', 'locale', 'currency', 'checkInTime', 'checkOutTime']
    .some((key) => key in current)

  if (!hasSettings && !bankDetails) {
    throw new Error('The hotel API response did not include hotel settings.')
  }

  return {
    timezone: stringField(current, 'timezone', EMPTY_SETTINGS.timezone),
    locale: stringField(current, 'locale', EMPTY_SETTINGS.locale),
    currency: stringField(current, 'currency', EMPTY_SETTINGS.currency),
    checkInTime: stringField(current, 'checkInTime', EMPTY_SETTINGS.checkInTime),
    checkOutTime: stringField(current, 'checkOutTime', EMPTY_SETTINGS.checkOutTime),
    bankDetails: {
      bankName: bankDetails ? stringField(bankDetails, 'bankName', '') : '',
      bankAccountNumber: bankDetails
        ? stringField(bankDetails, 'bankAccountNumber', stringField(bankDetails, 'accountNumber', ''))
        : '',
      accountName: bankDetails ? stringField(bankDetails, 'accountName', '') : '',
    },
  }
}

export function HotelSettingsPage() {
  const [hotelId] = useState(() => sessionStorage.getItem('selectedHotelId') ?? '')
  const [settings, setSettings] = useState<HotelSettings>(EMPTY_SETTINGS)
  const [isLoading, setIsLoading] = useState(Boolean(hotelId))
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(() => hotelId ? '' : 'Select a hotel before editing its settings.')
  const [notice, setNotice] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!hotelId) return

    let cancelled = false
    void Promise.all([
      apiRequest<PlatformProfileResponse>('/auth/me'),
      apiRequest<unknown>(`/hotels/${encodeURIComponent(hotelId)}/settings`),
    ])
      .then(async ([profile, settingsResponse]) => {
        if (cancelled) return
        const membership = profile.memberships.find((item) => item.hotelId === hotelId)
        if (!membership) throw new Error('You do not have access to this hotel.')
        const { hotel } = await publicApiRequest<{ hotel: PublicHotel }>(`/public/hotels/${encodeURIComponent(membership.hotelSlug)}`)
        if (cancelled) return
        const current = parseHotelSettings(settingsResponse)
        setSettings({
          ...current,
          bankDetails: {
            bankName: hotel.bankDetails?.bankName ?? '',
            bankAccountNumber: hotel.bankDetails?.bankAccountNumber ?? '',
            accountName: hotel.bankDetails?.accountName ?? '',
          },
        })
        setHasLoaded(true)
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : 'Could not load hotel settings.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [hotelId, reloadKey])

  function updateBankDetails(field: keyof HotelSettings['bankDetails'], value: string) {
    setSettings((current) => ({ ...current, bankDetails: { ...current.bankDetails, [field]: value } }))
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!hotelId || isSaving) return
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await Promise.all([
        apiRequest(`/hotels/${encodeURIComponent(hotelId)}/settings`, {
          method: 'PATCH',
          body: JSON.stringify({
            timezone: settings.timezone,
            locale: settings.locale,
            currency: settings.currency.toUpperCase(),
            checkInTime: settings.checkInTime,
            checkOutTime: settings.checkOutTime,
          }),
        }),
        apiRequest(`/hotels/${encodeURIComponent(hotelId)}/bank-details`, {
          method: 'PUT',
          body: JSON.stringify(settings.bankDetails),
        }),
      ])
      setNotice('Hotel settings saved.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save hotel settings.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl">
      <header className="mb-6">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-800">HOTEL CONFIGURATION</p>
        <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Settings</h1>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-muted">Manage the hotel’s operating preferences and the bank account guests should use for transfers.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 border border-stone-200 bg-white px-4 py-8 text-sm text-muted" role="status">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-forest" /> Loading hotel settings…
        </div>
      ) : hasLoaded ? (
        <form onSubmit={(event) => { void saveSettings(event) }} className="space-y-6 border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <section>
            <h2 className="font-display text-xl text-ink">Operating preferences</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-[10px] font-semibold tracking-wide">TIMEZONE
                <input className={inputClass} name="timezone" value={settings.timezone} onChange={(event) => setSettings((current) => ({ ...current, timezone: event.target.value }))} maxLength={80} required />
              </label>
              <label className="text-[10px] font-semibold tracking-wide">LOCALE
                <input className={inputClass} name="locale" value={settings.locale} onChange={(event) => setSettings((current) => ({ ...current, locale: event.target.value }))} maxLength={20} required />
              </label>
              <label className="text-[10px] font-semibold tracking-wide">CURRENCY CODE
                <input className={inputClass} name="currency" value={settings.currency} onChange={(event) => setSettings((current) => ({ ...current, currency: event.target.value }))} minLength={3} maxLength={3} pattern="[A-Za-z]{3}" required />
              </label>
              <label className="text-[10px] font-semibold tracking-wide">CHECK-IN TIME
                <input className={inputClass} type="time" name="checkInTime" value={settings.checkInTime} onChange={(event) => setSettings((current) => ({ ...current, checkInTime: event.target.value }))} required />
              </label>
              <label className="text-[10px] font-semibold tracking-wide">CHECK-OUT TIME
                <input className={inputClass} type="time" name="checkOutTime" value={settings.checkOutTime} onChange={(event) => setSettings((current) => ({ ...current, checkOutTime: event.target.value }))} required />
              </label>
            </div>
          </section>

          <section className="border-t border-stone-200 pt-5">
            <h2 className="font-display text-xl text-ink">Bank details for guest payments</h2>
            <p className="mt-1 text-xs leading-5 text-muted">These details are shown on the public booking confirmation page.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-[10px] font-semibold tracking-wide">BANK NAME
                <input className={inputClass} name="bankName" value={settings.bankDetails.bankName} onChange={(event) => updateBankDetails('bankName', event.target.value)} minLength={2} maxLength={100} required />
              </label>
              <label className="text-[10px] font-semibold tracking-wide">ACCOUNT NUMBER
                <input className={inputClass} name="bankAccountNumber" inputMode="numeric" autoComplete="off" value={settings.bankDetails.bankAccountNumber} onChange={(event) => updateBankDetails('bankAccountNumber', event.target.value)} minLength={4} maxLength={34} required />
              </label>
              <label className="text-[10px] font-semibold tracking-wide sm:col-span-2">ACCOUNT NAME
                <input className={inputClass} name="accountName" value={settings.bankDetails.accountName} onChange={(event) => updateBankDetails('accountName', event.target.value)} minLength={2} maxLength={120} required />
              </label>
            </div>
          </section>

          {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-950">{error}</p>}
          {notice && <p role="status" className="border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-950">{notice}</p>}
          <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center gap-2 bg-forest px-5 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-70">
            {isSaving ? 'SAVING…' : 'SAVE SETTINGS'} {!isSaving && <ArrowRight aria-hidden="true" className="size-4" />}
          </button>
        </form>
      ) : (
        <div className="border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-950" role="alert">
          {error || 'Hotel settings could not be loaded.'}
          {hotelId && <button type="button" onClick={() => { setError(''); setIsLoading(true); setReloadKey((key) => key + 1) }} className="ml-2 font-semibold underline underline-offset-2">Try again</button>}
        </div>
      )}
    </section>
  )
}
