import type { Reservation } from './adminReservationsData'

export type RoomStatus = 'Available' | 'Occupied' | 'Reserved'

export type RoomTypePhoto = {
  id: string
  url: string
}

export type BedSetupItem = {
  type: string
  count: number
}

export type RoomType = {
  id: string
  name: string
  description: string
  area: number
  maxGuests: number
  bedSetup: BedSetupItem[]
  rate: number
  currency: string
  amenities: string[]
  photos: RoomTypePhoto[]
  active: boolean
}

export type RoomTypeDraft = Omit<RoomType, 'id' | 'active' | 'photos' | 'currency'>

export type RoomDraft = {
  roomNumber: string
  roomTypeId: string
  floor?: number
  wing?: string
  notes?: string
}

export type Room = {
  id: string
  name: string
  roomTypeId?: string
  type: string
  floor: number
  wing?: string
  notes?: string
  area: number
  rate: number
  guests: number
  status: RoomStatus
  active: boolean
  currency: string
  image?: string
  amenities: string[]
  guest?: string
  note?: string
}

export function getRoomStatusCounts(rooms: Room[]) {
  return rooms.reduce((counts, room) => {
    counts[room.status] += 1
    return counts
  }, { Available: 0, Occupied: 0, Reserved: 0 })
}

export function getRoomStatusesForDate(rooms: Room[], reservations: Reservation[], date: string) {
  const reservationsByRoom = new Map<string, Reservation[]>()

  for (const reservation of reservations) {
    const checkIn = reservation.checkIn.slice(0, 10)
    const checkOut = reservation.checkOut.slice(0, 10)
    if (
      !reservation.assignedRoomId
      || checkIn > date
      || checkOut <= date
      || ['Cancelled', 'Checked Out', 'No Show'].includes(reservation.folio)
    ) continue

    const roomReservations = reservationsByRoom.get(reservation.assignedRoomId) ?? []
    roomReservations.push(reservation)
    reservationsByRoom.set(reservation.assignedRoomId, roomReservations)
  }

  return rooms.map((room) => {
    const currentReservations = reservationsByRoom.get(room.id)
    if (!currentReservations?.length) return room

    const checkedInReservation = currentReservations.find((reservation) => reservation.folio === 'Checked In')
    const reservation = checkedInReservation ?? currentReservations[0]
    const status: RoomStatus = checkedInReservation || room.status === 'Occupied' ? 'Occupied' : 'Reserved'
    return {
      ...room,
      status,
      guest: reservation.guest,
      note: reservation.reference,
    }
  })
}

export function getAvailableRoomsForStay(
  rooms: Room[],
  reservations: Reservation[],
  checkIn: string,
  checkOut: string,
  guestCount: number,
  matches: (room: Room) => boolean = () => true,
) {
  if (!checkIn || !checkOut || checkOut <= checkIn || guestCount < 1) return []

  return rooms.filter((room) => {
    if (!room.active || room.guests < guestCount || !matches(room)) return false

    const activeReservations = reservations.filter((reservation) => (
      reservation.assignedRoomId === room.id
      && !['Cancelled', 'Checked Out', 'No Show'].includes(reservation.folio)
    ))
    const hasDateConflict = activeReservations.some((reservation) => (
      checkIn < reservation.checkOut && reservation.checkIn < checkOut
    ))
    const statusAllowsAssignment = room.status === 'Available'
      || (activeReservations.length > 0 && !activeReservations.some((reservation) => reservation.folio === 'Checked In'))

    return statusAllowsAssignment && !hasDateConflict
  })
}

