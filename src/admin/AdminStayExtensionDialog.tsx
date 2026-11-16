import { useState } from 'react'
import type { FormEvent } from 'react'
import { Check, X } from 'lucide-react'
import type { Reservation } from './adminReservationsData'
import { formatReservationDate } from './adminReservationsData'

function addNightsToDate(date: string, nights: number) {
  const result = new Date(`${date}T12:00:00`)
  result.setDate(result.getDate() + nights)
  return result.toISOString().slice(0, 10)
}

export function AdminStayExtensionDialog({ reservation, onClose, onSave, saving, error }: {
  reservation: Reservation
  onClose: () => void
  onSave: (checkOut: string) => void
  saving: boolean
  error: string
}) {
  const [extraNights, setExtraNights] = useState('1')
  const nightsToAdd = Number(extraNights)
  const validAdditionalNights = Number.isInteger(nightsToAdd) && nightsToAdd >= 1 && nightsToAdd <= 30
  const newCheckOut = addNightsToDate(reservation.checkOut, validAdditionalNights ? nightsToAdd : 1)
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  function submitExtension(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (validAdditionalNights) onSave(newCheckOut)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-end bg-black/50 p-3 sm:p-5" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="extend-stay-title" className="flex h-[55vh] max-h-[420px] w-full max-w-[440px] flex-col bg-paper shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.15em] text-amber-800">IN-HOUSE RESERVATION</p>
            <h2 id="extend-stay-title" className="mt-1 font-display text-xl text-ink">Extend Stay</h2>
            <p className="mt-1 text-[12px] text-muted">{reservation.guest} · {reservation.room}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close stay extension" className="grid size-8 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
        </header>
        <form onSubmit={submitExtension} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12px] font-semibold tracking-wide text-ink">CURRENT CHECK-OUT
                <input className={fieldClass} type="date" value={reservation.checkOut} readOnly />
              </label>
              <label className="block text-[12px] font-semibold tracking-wide text-ink">ADD NIGHTS
                <input className={fieldClass} type="number" min="1" max="30" value={extraNights} onChange={(event) => setExtraNights(event.target.value)} required disabled={saving} />
              </label>
            </div>
            <div className="border border-amber-200 bg-amber-50/70 p-3">
              <p className="text-[11px] font-semibold tracking-wide text-amber-950">UPDATED STAY</p>
              <div className="mt-2 flex items-center justify-between gap-3 text-[12px]">
                <span className="text-muted">New check-out date</span>
                <strong className="font-semibold text-ink">{formatReservationDate(newCheckOut)} {newCheckOut.slice(0, 4)}</strong>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[12px]">
                <span className="text-muted">Additional nights</span>
                <strong className="font-semibold text-ink">{validAdditionalNights ? nightsToAdd : '—'}</strong>
              </div>
            </div>
            <section className="space-y-2 border border-stone-200 bg-white p-3">
              <h3 className="text-[11px] font-semibold tracking-wide text-ink">RATE &amp; AVAILABILITY</h3>
              <p className="text-[10px] leading-4 text-muted">The hotel server keeps the booked nightly rate, checks room availability, and recalculates the total and balance before saving.</p>
            </section>
            {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{error}</p>}
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} disabled={saving} className="border border-stone-300 px-4 py-2.5 text-[12px] font-semibold text-ink hover:bg-stone-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving || !validAdditionalNights} className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-50"><Check aria-hidden="true" className="size-3.5" /> {saving ? 'Extending…' : 'Save Stay Extension'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}
