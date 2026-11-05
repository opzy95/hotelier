import { roomSuites } from '../data/roomSuites'

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

const initialRooms: Room[] = [
  { id: '101', name: 'Room 101', type: 'Deluxe Lagoon Room', floor: 1, area: 45, rate: 380000, guests: 2, status: 'Available', image: roomSuites[0].image, amenities: ['King Bed', 'Lagoon View', 'Starlink WiFi'] },
  { id: '102', name: 'Room 102', type: 'Deluxe Lagoon Room', floor: 1, area: 45, rate: 380000, guests: 2, status: 'Occupied', image: roomSuites[0].image, amenities: ['King Bed', 'Garden View', 'In-room Dining'], guest: 'Dr. Obinna Okonkwo', note: 'DEPARTS 27 Oct' },
  { id: '201', name: 'Room 201', type: 'Executive Lagoon Suite', floor: 2, area: 78, rate: 620000, guests: 3, status: 'Available', image: roomSuites[1].image, amenities: ['Private Balcony', '24/7 Butler', 'Soaking Tub'] },
  { id: '204', name: 'Room 204', type: 'Deluxe Lagoon Room', floor: 2, area: 45, rate: 380000, guests: 2, status: 'Reserved', image: roomSuites[0].image, amenities: ['Lagoon Wing', 'Pre-Arrival Pack'], guest: 'Lord S. Kensington', note: 'ARRIVES 26 Oct (14:00)' },
  { id: '301', name: 'Room 301', type: 'Executive Lagoon Suite', floor: 3, area: 78, rate: 620000, guests: 3, status: 'Cleaning', image: roomSuites[1].image, amenities: ['Priority Turnaround', 'Sanitization VIP'], note: 'Est. 40 min left' },
  { id: '402', name: 'Room 402', type: 'Executive Lagoon Suite', floor: 4, area: 84, rate: 620000, guests: 3, status: 'Occupied', image: roomSuites[1].image, amenities: ['Lagoon Terrace', 'Maybach Escort'], guest: 'Chief Adeboye Adeleke', note: 'VIP BUTLER · ASSIGNED' },
  { id: 'P-A', name: 'Penthouse A', type: 'Presidential Waterfront Sanctuary', floor: 6, area: 160, rate: 1450000, guests: 4, status: 'Occupied', image: roomSuites[2].image, amenities: ['Private Chef', 'Helipad Priority'], guest: 'Dr. Folashade Akinja', note: 'PRIVATE ESCORT ACTIVE' },
  { id: 'V-02', name: 'Villa 02', type: 'The Lagoon Villa with Private Jetty', floor: 1, area: 280, rate: 2800000, guests: 6, status: 'Maintenance', image: roomSuites[2].image, amenities: ['Private Jetty', 'Max 6 Guests'], note: 'Team Lead: Engineer Musa' },
]

const additionalStatuses: RoomStatus[] = [
  ...Array<RoomStatus>(23).fill('Available'),
  ...Array<RoomStatus>(39).fill('Occupied'),
  ...Array<RoomStatus>(7).fill('Reserved'),
  ...Array<RoomStatus>(2).fill('Cleaning'),
  'Maintenance',
]

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
