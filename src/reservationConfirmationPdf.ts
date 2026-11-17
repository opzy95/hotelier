import type { PublicRoomPricing } from './api'

export type ReservationConfirmationPdfData = {
  hotelName: string
  hotelAddress?: string
  reference: string
  status?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  roomTypeName?: string
  assignedRoom?: string
  checkIn?: string
  checkOut?: string
  adults?: number
  children?: number
  pricing?: PublicRoomPricing
  paymentStatus?: string
}

function formatPdfAmount(amountMinor: number, currency: string) {
  const fractionDigits = new Intl.NumberFormat(undefined, { style: 'currency', currency }).resolvedOptions().maximumFractionDigits ?? 2
  const amount = new Intl.NumberFormat('en', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amountMinor / (10 ** fractionDigits))
  return `${currency} ${amount}`
}

export async function downloadReservationConfirmationPdf(data: ReservationConfirmationPdfData) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF()
  const left = 18
  const valueLeft = 76
  let y = 24

  pdf.setProperties({
    title: `Reservation confirmation ${data.reference}`,
    subject: `Reservation at ${data.hotelName}`,
    author: data.hotelName,
  })
  pdf.setFillColor(16, 35, 27)
  pdf.rect(0, 0, 210, 16, 'F')
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.setTextColor(255, 255, 255)
  pdf.text(data.hotelName, left, 10)

  pdf.setTextColor(29, 42, 33)
  pdf.setFontSize(20)
  pdf.text('Reservation confirmation', left, y)
  y += 12

  const rows: Array<[string, string]> = [['Reference', data.reference]]
  if (data.status) rows.push(['Status', data.status.toUpperCase()])
  if (data.guestName) rows.push(['Guest', data.guestName])
  if (data.guestEmail) rows.push(['Email', data.guestEmail])
  if (data.guestPhone) rows.push(['Phone', data.guestPhone])
  if (data.roomTypeName) rows.push(['Room type', data.roomTypeName])
  if (data.assignedRoom) rows.push(['Assigned room', data.assignedRoom])
  if (data.checkIn) rows.push(['Check-in', data.checkIn])
  if (data.checkOut) rows.push(['Check-out', data.checkOut])
  if (typeof data.adults === 'number' || typeof data.children === 'number') {
    rows.push([`Guests`, `${data.adults ?? 0} adult(s), ${data.children ?? 0} child(ren)`])
  }
  if (data.pricing) {
    rows.push(
      ['Nightly rate', formatPdfAmount(data.pricing.rateMinorPerNight, data.pricing.currency)],
      ['Subtotal', formatPdfAmount(data.pricing.subtotalMinor, data.pricing.currency)],
    )
    if (data.pricing.feesMinor > 0) rows.push(['Fees', formatPdfAmount(data.pricing.feesMinor, data.pricing.currency)])
    rows.push(['Final total', formatPdfAmount(data.pricing.totalMinor, data.pricing.currency)])
  }
  if (data.paymentStatus) rows.push(['Payment status', data.paymentStatus.toUpperCase()])
  if (data.hotelAddress) rows.push(['Hotel address', data.hotelAddress])

  for (const [label, value] of rows) {
    const lines = pdf.splitTextToSize(value || '-', 115) as string[]
    const rowHeight = Math.max(lines.length, 1) * 6 + 3
    if (y + rowHeight > 275) {
      pdf.addPage()
      y = 20
    }
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(105, 110, 103)
    pdf.text(label, left, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(29, 42, 33)
    pdf.text(lines, valueLeft, y)
    y += rowHeight
  }

  if (y + 10 > 275) {
    pdf.addPage()
    y = 20
  }
  pdf.setFontSize(8)
  pdf.setTextColor(105, 110, 103)
  pdf.text('This document confirms a reservation; it is not a payment receipt.', left, y + 4)

  const safeReference = data.reference.replace(/[^\w-]/g, '-') || 'reservation'
  pdf.save(`${safeReference}-confirmation.pdf`)
}
