import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, CreditCard, Search, Wallet, X } from 'lucide-react'
import { useAdminReservations } from './AdminReservationsContext'
import {
  formatReservationDate,
  reservationBalanceDue,
  reservationCollectedAmount,
  reservationCurrency,
  reservationOutstandingAmount,
  reservationPaidAmount,
} from './adminReservationsData'
import type { PaymentStatus, Reservation } from './adminReservationsData'

type PaymentFilter = 'All Payments' | 'Pending' | 'Partially Paid' | 'Paid'

function paymentStatusClass(status: PaymentStatus) {
  if (status === 'Paid') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'Partially Paid') return 'border-amber-200 bg-amber-50 text-amber-900'
  if (status === 'Refunded') return 'border-stone-200 bg-stone-100 text-stone-600'
  return 'border-rose-200 bg-rose-50 text-rose-800'
}

function RecordPaymentPanel({ reservation, onClose, onSave }: {
  reservation: Reservation
  onClose: () => void
  onSave: (amount: number) => void
}) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const balance = reservationBalanceDue(reservation)

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const received = Number(amount)
    if (!Number.isFinite(received) || received <= 0 || received > balance) {
      setError(`Enter an amount between ₦1 and ${reservationCurrency.format(balance)}.`)
      return
    }
    onSave(received)
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/50" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="record-payment-title" className="flex h-full w-full max-w-[440px] flex-col bg-paper shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-amber-800">PAYMENT COLLECTION</p>
            <h2 id="record-payment-title" className="mt-1 font-display text-xl text-ink">Record Payment</h2>
            <p className="mt-1 text-[11px] text-muted">{reservation.guest} · {reservation.reference}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close payment form" className="grid size-8 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
        </header>
        <form onSubmit={submitPayment} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <dl className="divide-y divide-stone-200 border border-stone-200 bg-white px-3">
              <div className="flex justify-between gap-3 py-3 text-[11px]"><dt className="text-muted">Stay total</dt><dd className="font-semibold text-ink">{reservationCurrency.format(reservation.amount)}</dd></div>
              <div className="flex justify-between gap-3 py-3 text-[11px]"><dt className="text-muted">Paid to date</dt><dd className="font-semibold text-emerald-800">{reservationCurrency.format(reservationPaidAmount(reservation))}</dd></div>
              <div className="flex justify-between gap-3 py-3 text-[11px]"><dt className="text-muted">Balance due</dt><dd className="font-semibold text-amber-900">{reservationCurrency.format(balance)}</dd></div>
            </dl>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">AMOUNT RECEIVED (₦)
              <input autoFocus className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10" type="number" min="1" max={balance} step="1" value={amount} onChange={(event) => { setAmount(event.target.value); setError('') }} required />
            </label>
            {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-800">{error}</p>}
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-5 py-4">
            <button type="button" onClick={onClose} className="px-3 py-2 text-[10px] font-semibold text-muted hover:bg-stone-100">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[10px] font-semibold text-white hover:bg-forest-deep"><Check aria-hidden="true" className="size-3.5" /> Save Payment</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export function AdminPayments() {
  const { reservations, setReservations } = useAdminReservations()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<PaymentFilter>('All Payments')
  const [selectedReference, setSelectedReference] = useState('')
  const query = search.trim().toLowerCase()

  const outstandingReservations = reservations.filter((reservation) => (
    reservation.folio !== 'Cancelled' && reservation.payment !== 'Refunded' && reservationBalanceDue(reservation) > 0
  ))
  const collectedAmount = reservationCollectedAmount(reservations)
  const outstandingAmount = reservationOutstandingAmount(reservations)

  const filteredReservations = useMemo(() => reservations.filter((reservation) => {
    const matchesSearch = !query || `${reservation.guest} ${reservation.reference} ${reservation.room} ${reservation.assignedRoomId ?? ''}`.toLowerCase().includes(query)
    const matchesStatus = filter === 'All Payments' || reservation.payment === filter
    return matchesSearch && matchesStatus
  }), [filter, query, reservations])

  const selectedReservation = reservations.find((reservation) => reservation.reference === selectedReference)

  function recordPayment(amount: number) {
    if (!selectedReservation) return
    setReservations((current) => current.map((reservation) => {
      if (reservation.reference !== selectedReservation.reference) return reservation
      const paidAmount = reservationPaidAmount(reservation) + amount
      const payment: PaymentStatus = paidAmount >= reservation.amount ? 'Paid' : 'Partially Paid'
      return {
        ...reservation,
        paidAmount,
        payment,
        folio: reservation.folio === 'Pending Payment' && payment === 'Paid' ? 'Confirmed' : reservation.folio,
      }
    }))
    setSelectedReference('')
  }

  const selectClass = 'h-9 border border-stone-200 bg-white px-3 text-[10px] text-ink outline-none focus:border-amber-800'

  return (
    <section className="mx-auto max-w-[1600px]">
      <header className="mb-4">
        <p className="text-[10px] font-semibold tracking-[0.17em] text-amber-800">FOLIO SETTLEMENTS</p>
        <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Payments</h1>
        <p className="mt-1 max-w-2xl text-[11px] text-muted sm:text-[13px]">Review reservation balances and record guest payments across the property.</p>
      </header>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <article className="border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-[9px] font-semibold tracking-[0.12em] text-muted">PAYMENTS RECEIVED</p>
          <strong className="mt-2 block font-display text-2xl text-ink">{reservationCurrency.format(collectedAmount)}</strong>
          <p className="mt-1 text-[10px] text-muted">Across recorded reservation folios</p>
        </article>
        <article className="border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-[9px] font-semibold tracking-[0.12em] text-muted">OUTSTANDING BALANCE</p>
          <strong className="mt-2 block font-display text-2xl text-amber-900">{reservationCurrency.format(outstandingAmount)}</strong>
          <p className="mt-1 text-[10px] text-muted">{outstandingReservations.length} reservations with an amount due</p>
        </article>
        <article className="border border-stone-200 bg-white p-4 shadow-sm">
          <p className="text-[9px] font-semibold tracking-[0.12em] text-muted">SETTLED FOLIOS</p>
          <strong className="mt-2 block font-display text-2xl text-ink">{reservations.filter((reservation) => reservation.payment === 'Paid').length}</strong>
          <p className="mt-1 text-[10px] text-muted">Reservations with no balance due</p>
        </article>
      </div>

      <section className="mb-3 flex flex-col gap-2 border border-stone-200 bg-white p-3 sm:flex-row sm:items-center">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 border border-stone-200 bg-stone-50 px-2 sm:max-w-md">
          <Search aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
          <span className="sr-only">Search payments</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest, folio or room..." className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-muted/70" />
        </label>
        <label className="flex items-center gap-2 text-[9px] text-muted">PAYMENT STATUS
          <select className={selectClass} value={filter} onChange={(event) => setFilter(event.target.value as PaymentFilter)}>
            {(['All Payments', 'Pending', 'Partially Paid', 'Paid'] as PaymentFilter[]).map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <span className="text-[9px] text-muted">{filteredReservations.length} folios</span>
      </section>

      <section className="overflow-hidden border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead className="bg-stone-50 text-[9px] font-semibold tracking-[0.1em] text-muted">
              <tr><th className="px-3 py-3">GUEST / FOLIO</th><th className="px-3 py-3">ROOM / STAY</th><th className="px-3 py-3">TOTAL</th><th className="px-3 py-3">PAID</th><th className="px-3 py-3">BALANCE</th><th className="px-3 py-3">STATUS</th><th className="px-3 py-3">ACTION</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReservations.map((reservation) => {
                const balance = reservationBalanceDue(reservation)
                const canRecordPayment = balance > 0 && reservation.folio !== 'Cancelled' && reservation.payment !== 'Refunded'
                return (
                  <tr key={reservation.reference} className="text-[10px] hover:bg-paper/60">
                    <td className="px-3 py-3"><strong className="block font-medium text-ink">{reservation.guest}</strong><span className="mt-1 block text-[9px] text-muted">{reservation.reference}</span></td>
                    <td className="px-3 py-3"><strong className="block font-medium text-ink">{reservation.room}</strong><span className="mt-1 block text-[9px] text-muted">{reservation.assignedRoomId ? `Room ${reservation.assignedRoomId} · ` : ''}{formatReservationDate(reservation.checkIn)} – {formatReservationDate(reservation.checkOut)}</span></td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium text-ink">{reservationCurrency.format(reservation.amount)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-emerald-800">{reservationCurrency.format(reservationPaidAmount(reservation))}</td>
                    <td className={`whitespace-nowrap px-3 py-3 font-semibold ${balance ? 'text-amber-900' : 'text-ink'}`}>{reservationCurrency.format(balance)}</td>
                    <td className="px-3 py-3"><span className={`inline-flex border px-2 py-1 text-[8px] font-semibold ${paymentStatusClass(reservation.payment)}`}>{reservation.payment}</span></td>
                    <td className="px-3 py-3">{canRecordPayment ? <button type="button" onClick={() => setSelectedReference(reservation.reference)} className="inline-flex items-center gap-1.5 border border-forest px-2.5 py-1.5 text-[9px] font-semibold text-forest hover:bg-forest hover:text-white"><CreditCard aria-hidden="true" className="size-3" /> Record Payment</button> : <span className="inline-flex items-center gap-1 text-[9px] text-muted"><Wallet aria-hidden="true" className="size-3" /> {reservation.payment === 'Refunded' ? 'Refunded' : 'Settled'}</span>}</td>
                  </tr>
                )
              })}
              {!filteredReservations.length && <tr><td colSpan={7} className="px-4 py-12 text-center"><CreditCard aria-hidden="true" className="mx-auto size-5 text-stone-400" /><p className="mt-2 font-display text-base text-ink">No matching payment folios</p><p className="mt-1 text-[10px] text-muted">Try another search or payment status.</p></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {selectedReservation && <RecordPaymentPanel reservation={selectedReservation} onClose={() => setSelectedReference('')} onSave={recordPayment} />}
    </section>
  )
}