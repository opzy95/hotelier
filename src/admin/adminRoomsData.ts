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
      && !['Cancelled', 'Checked Out'].includes(reservation.folio)
    ))
    const hasDateConflict = activeReservations.some((reservation) => (
      checkIn < reservation.checkOut && reservation.checkIn < checkOut
    ))
    const statusAllowsAssignment = room.status === 'Available'
      || (activeReservations.length > 0 && !activeReservations.some((reservation) => reservation.folio === 'Checked In'))

    return statusAllowsAssignment && !hasDateConflict
  })
}

