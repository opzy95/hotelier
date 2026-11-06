import { roomSuites } from '../data/roomSuites'
import type { Reservation } from './adminReservationsData'

export type RoomStatus = 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Maintenance'

export type Room = {
  id: string
  name: string
  type: string
  floor: number
  area: number
  rate: number
  guests: number
  status: RoomStatus
  image: string
  amenities: string[]
  guest?: string
  note?: string
}

export function getRoomReservation(roomId: string, reservations: Reservation[]) {
  const active = reservations.filter((reservation) => (
    reservation.assignedRoomId === roomId
    && Boolean(reservation.guest.trim())
    && ['Checked In', 'Confirmed', 'Pending Payment'].includes(reservation.folio)
  ))
  const checkedIn = active.find((reservation) => reservation.folio === 'Checked In')
  if (checkedIn) return checkedIn

  const today = new Date().toISOString().slice(0, 10)
  return active
    .filter((reservation) => reservation.checkOut > today)
    .sort((first, second) => first.checkIn.localeCompare(second.checkIn))[0]
}

export function getOperationalRooms(rooms: Room[], reservations: Reservation[]) {
  return rooms.map((room) => {
    const reservation = getRoomReservation(room.id, reservations)
    if (reservation) {
      return {
        ...room,
        status: reservation.folio === 'Checked In' ? 'Occupied' as const : 'Reserved' as const,
        guest: reservation.guest,
        note: reservation.reference,
      }
    }

    if (['Occupied', 'Reserved'].includes(room.status) && !room.guest?.trim()) {
      return { ...room, status: 'Available' as const, guest: undefined, note: undefined }
    }

    return room
  })
}

export function getRoomStatusCounts(rooms: Room[]) {
  return rooms.reduce((counts, room) => {
    counts[room.status] += 1
    return counts
  }, { Available: 0, Occupied: 0, Reserved: 0, Cleaning: 0, Maintenance: 0 })
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
    if (room.guests < guestCount || ['Cleaning', 'Maintenance'].includes(room.status) || !matches(room)) return false

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

const initialRooms: Room[] = [
  { id: '101', name: 'Room 101', type: 'Deluxe Lagoon Room', floor: 1, area: 45, rate: 380000, guests: 2, status: 'Available', image: roomSuites[0].image, amenities: ['King Bed', 'Lagoon View', 'Starlink WiFi'] },
  { id: '102', name: 'Room 102', type: 'Deluxe Lagoon Room', floor: 1, area: 45, rate: 380000, guests: 2, status: 'Occupied', image: roomSuites[0].image, amenities: ['King Bed', 'Garden View', 'In-room Dining'], guest: 'Dr. Obinna Okonkwo', note: 'DEPARTS 27 Oct' },
  { id: '201', name: 'Room 201', type: 'Executive Lagoon Suite', floor: 2, area: 78, rate: 620000, guests: 3, status: 'Available', image: roomSuites[1].image, amenities: ['Private Balcony', '24/7 Butler', 'Soaking Tub'] },
  { id: '204', name: 'Room 204', type: 'Deluxe Lagoon Room', floor: 2, area: 45, rate: 380000, guests: 2, status: 'Reserved', image: roomSuites[0].image, amenities: ['Lagoon Wing', 'Pre-Arrival Pack'], guest: 'Lord S. Kensington', note: 'ARRIVES 26 Oct (14:00)' },
  { id: '301', name: 'Room 301', type: 'Executive Lagoon Suite', floor: 3, area: 78, rate: 620000, guests: 3, status: 'Available', image: roomSuites[1].image, amenities: ['Priority Turnaround', 'Sanitization VIP'] },
  { id: '402', name: 'Room 402', type: 'Executive Lagoon Suite', floor: 4, area: 84, rate: 620000, guests: 3, status: 'Occupied', image: roomSuites[1].image, amenities: ['Lagoon Terrace', 'Maybach Escort'], guest: 'Chief Adeboye Adeleke', note: 'VIP BUTLER · ASSIGNED' },
  { id: 'P-A', name: 'Penthouse A', type: 'Presidential Waterfront Sanctuary', floor: 6, area: 160, rate: 1450000, guests: 4, status: 'Occupied', image: roomSuites[2].image, amenities: ['Private Chef', 'Helipad Priority'], guest: 'Dr. Folashade Akinja', note: 'PRIVATE ESCORT ACTIVE' },
  { id: 'V-02', name: 'Villa 02', type: 'The Lagoon Villa with Private Jetty', floor: 1, area: 280, rate: 2800000, guests: 6, status: 'Available', image: roomSuites[2].image, amenities: ['Private Jetty', 'Max 6 Guests'] },
]

const additionalStatuses: RoomStatus[] = Array<RoomStatus>(72).fill('Available')

export const initialRoomInventory: Room[] = [
  ...initialRooms,
  ...additionalStatuses.map((status, index) => {
    let number = 103
    let added = 0
    while (added < index + 1) {
      if (!initialRooms.some((room) => room.id === String(number))) added += 1
      if (added < index + 1) number += 1
    }

    const suite = roomSuites[index % roomSuites.length]
    const isVilla = index === 22
    return {
      id: String(number),
      name: `Room ${number}`,
      type: isVilla ? 'Waterfront Villa' : suite.fullName,
      floor: Math.floor(number / 100),
      area: isVilla ? 120 : [45, 78, 160][index % 3],
      rate: isVilla ? 925000 : suite.priceValue,
      guests: isVilla ? 6 : suite.maxGuests,
      status,
      image: suite.image,
      amenities: isVilla ? ['Private Jetty', 'Lagoon View'] : suite.amenities.slice(0, 2).map((amenity) => amenity.label),
    }
  }),
]
