import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BedDouble,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CirclePlus,
  ClipboardList,
  Grid2X2,
  List,
  Pencil,
  Plus,
  Search,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UsersRound,
  Waves,
  X,
} from 'lucide-react'
import { roomSuites } from '../data/roomSuites'

type RoomStatus = 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Maintenance'

type Room = {
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

const rooms: Room[] = [
  ...initialRooms,
  ...additionalStatuses.map((status, index) => {
    let number = 103
    let added = 0
    while (added < index + 1) {
      if (!initialRooms.some((room) => room.id === String(number))) added += 1
      if (added < index + 1) number += 1
    }

    const suite = roomSuites[index % roomSuites.length]
    return {
      id: String(number),
      name: `Room ${number}`,
      type: suite.fullName,
      floor: Math.floor(number / 100),
      area: [45, 78, 160][index % 3],
      rate: suite.priceValue,
      guests: suite.maxGuests,
      status,
      image: suite.image,
      amenities: suite.amenities.slice(0, 2).map((amenity) => amenity.label),
    }
  }),
]

const statusDetails: Record<RoomStatus, { color: string; accent: string }> = {
  Available: { color: 'border-emerald-200 bg-emerald-50 text-emerald-800', accent: 'bg-emerald-600' },
  Occupied: { color: 'border-sky-200 bg-sky-50 text-sky-800', accent: 'bg-sky-700' },
  Reserved: { color: 'border-amber-200 bg-amber-50 text-amber-900', accent: 'bg-amber-700' },
  Cleaning: { color: 'border-cyan-200 bg-cyan-50 text-cyan-800', accent: 'bg-cyan-700' },
  Maintenance: { color: 'border-rose-200 bg-rose-50 text-rose-800', accent: 'bg-rose-700' },
}

const currency = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 })
const pageSize = 8

function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold ${statusDetails[status].color}`}>
      <i className={`size-1.5 rounded-full ${statusDetails[status].accent}`} />
      {status === 'Cleaning' ? 'Cleaning (Turnaround)' : status}
    </span>
  )
}

function RoomDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (room: Room) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState(roomSuites[0].fullName)
  const [floor, setFloor] = useState('1')

  function submitRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const suite = roomSuites.find((item) => item.fullName === type) ?? roomSuites[0]
    onAdd({
      id: `N${String(Date.now()).slice(-4)}`,
      name: name.trim(),
      type: suite.fullName,
      floor: Number(floor),
      area: Number(suite.details[0].label.replace(' sqm', '')),
      rate: suite.priceValue,
      guests: suite.maxGuests,
      status: 'Available',
      image: suite.image,
      amenities: suite.amenities.slice(0, 2).map((amenity) => amenity.label),
    })
  }

  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/50" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-room-title"
        className="flex h-full w-full max-w-[440px] flex-col bg-paper shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-amber-800">ROOM INVENTORY</p>
            <h2 id="add-room-title" className="mt-1 font-display text-xl text-ink">Add New Room</h2>
            <p className="mt-1 text-[11px] text-muted">Create a room record for the property inventory.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="grid size-8 place-items-center text-muted hover:bg-stone-100">
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>
        <form onSubmit={submitRoom} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 p-5">
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              ROOM NAME
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Room 501" required />
            </label>
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              ROOM TYPE
              <select className={fieldClass} value={type} onChange={(event) => setType(event.target.value)}>
                {roomSuites.map((suite) => <option key={suite.id} value={suite.fullName}>{suite.fullName}</option>)}
              </select>
            </label>
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              FLOOR
              <select className={fieldClass} value={floor} onChange={(event) => setFloor(event.target.value)}>
                {[1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>Floor {value}</option>)}
              </select>
            </label>
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} className="border border-stone-300 px-4 py-2.5 text-[11px] font-semibold text-ink hover:bg-stone-50">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-forest-deep"><Plus aria-hidden="true" className="size-3.5" /> Add Room</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function RoomEditDialog({ room, onClose, onSave }: {
  room: Room
  onClose: () => void
  onSave: (room: Room) => void
}) {
  const [name, setName] = useState(room.name)
  const [type, setType] = useState(room.type)
  const [floor, setFloor] = useState(String(room.floor))
  const [area, setArea] = useState(String(room.area))
  const [rate, setRate] = useState(String(room.rate))
  const [guests, setGuests] = useState(String(room.guests))
  const [amenities, setAmenities] = useState(room.amenities.join(', '))
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  function submitChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const suiteImage = roomSuites.find((suite) => suite.fullName === type)?.image
    onSave({
      ...room,
      name: name.trim(),
      type: type.trim(),
      floor: Number(floor),
      area: Number(area),
      rate: Number(rate),
      guests: Number(guests),
      amenities: amenities.split(',').map((amenity) => amenity.trim()).filter(Boolean),
      image: suiteImage ?? room.image,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/50" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-room-title"
        className="flex h-full w-full max-w-[440px] flex-col bg-paper shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.15em] text-amber-800">ROOM SPECIFICATIONS</p>
            <h2 id="edit-room-title" className="mt-1 font-display text-xl text-ink">Edit {room.name}</h2>
            <p className="mt-1 text-[11px] text-muted">Update this room’s inventory details and amenities.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close room editor" className="grid size-8 place-items-center text-muted hover:bg-stone-100">
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>
        <form onSubmit={submitChanges} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              ROOM NAME
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              ROOM TYPE
              <select className={fieldClass} value={type} onChange={(event) => setType(event.target.value)} required>
                {!roomSuites.some((suite) => suite.fullName === type) && <option value={type}>{type}</option>}
                {roomSuites.map((suite) => <option key={suite.id} value={suite.fullName}>{suite.fullName}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[11px] font-semibold tracking-wide text-ink">
                FLOOR
                <input className={fieldClass} type="number" min="1" max="99" value={floor} onChange={(event) => setFloor(event.target.value)} required />
              </label>
              <label className="block text-[11px] font-semibold tracking-wide text-ink">
                AREA (SQM)
                <input className={fieldClass} type="number" min="1" value={area} onChange={(event) => setArea(event.target.value)} required />
              </label>
              <label className="block text-[11px] font-semibold tracking-wide text-ink">
                NIGHTLY RATE (₦)
                <input className={fieldClass} type="number" min="0" step="1000" value={rate} onChange={(event) => setRate(event.target.value)} required />
              </label>
              <label className="block text-[11px] font-semibold tracking-wide text-ink">
                MAX GUESTS
                <input className={fieldClass} type="number" min="1" value={guests} onChange={(event) => setGuests(event.target.value)} required />
              </label>
            </div>
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              AMENITIES
              <textarea className={`${fieldClass} min-h-24 resize-y`} value={amenities} onChange={(event) => setAmenities(event.target.value)} placeholder="Separate amenities with commas" />
              <span className="mt-1 block text-[10px] font-normal normal-case tracking-normal text-muted">Separate each amenity with a comma.</span>
            </label>
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} className="border border-stone-300 px-4 py-2.5 text-[11px] font-semibold text-ink hover:bg-stone-50">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-forest-deep"><Save aria-hidden="true" className="size-3.5" /> Save Changes</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function RoomInspector({ room, onClose, onStatusChange, onEdit }: {
  room: Room
  onClose: () => void
  onStatusChange: (status: RoomStatus) => void
  onEdit: () => void
}) {
  return (
    <aside className="self-start border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-forest px-3 py-2 text-white">
        <span className="text-[10px] font-semibold tracking-wide">INSPECTOR DRAWER</span>
        <div className="flex items-center gap-2 text-[10px] text-white/70">
          Wing B · Floor {room.floor}
          <button type="button" onClick={onClose} aria-label="Close room details" className="text-white/70 hover:text-white"><X aria-hidden="true" className="size-3.5" /></button>
        </div>
      </div>
      <div className="space-y-4 p-3">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="font-display text-xl leading-none text-ink">{room.name.replace('Room ', 'Room #')}</h2>
          <p className="mt-1 text-[10px] text-muted">{room.type} · {room.area} sqm</p>
        </div>
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-[10px] font-semibold tracking-wide text-ink">LIVE STATUS SWITCHER</h3>
            <span className="text-[9px] text-amber-800">{room.status === 'Occupied' ? 'Active in-house' : 'Update room status'}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-sm border border-stone-200 bg-stone-50 p-1">
            {(['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'] as RoomStatus[]).map((status) => (
              <button
                type="button"
                key={status}
                aria-pressed={room.status === status}
                onClick={() => onStatusChange(status)}
                className={`px-1 py-2 text-[9px] transition-colors ${room.status === status ? 'bg-forest text-white' : 'text-muted hover:bg-white hover:text-ink'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </section>
        <section className="border border-amber-200 bg-amber-50/70 p-3">
          <h3 className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-950"><ShieldCheck aria-hidden="true" className="size-3.5" /> PMS Security Lockout Active</h3>
          <p className="mt-1.5 text-[9px] leading-4 text-amber-950/75">Active guest reservation in-house. Room cannot be manually marked Available without a formal checkout.</p>
        </section>
        {(room.status === 'Occupied' || room.status === 'Reserved') && (
          <section className="bg-paper p-3">
            <h3 className="text-[10px] font-semibold tracking-wide text-ink">STAY FOLIO BREAKDOWN</h3>
            <div className="mt-2 grid grid-cols-2 gap-3 text-[9px]">
              <span className="text-muted">Check-in<strong className="mt-1 block font-medium text-ink">24 Oct, 15:20</strong></span>
              <span className="text-muted">Scheduled Check-out<strong className="mt-1 block font-medium text-ink">28 Oct, 12:00</strong></span>
              <span className="text-muted">Duration<strong className="mt-1 block font-medium text-ink">4 Nights (VIP Tier 1)</strong></span>
              <span className="text-muted">Total Room Folio<strong className="mt-1 block font-medium text-amber-900">₦{currency.format(room.rate * 4)}.00</strong></span>
            </div>
            {room.guest && <p className="mt-2 border-t border-stone-200 pt-2 text-[9px] text-muted">Current guest <strong className="font-medium text-ink">{room.guest}</strong></p>}
          </section>
        )}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold tracking-wide text-ink">VERIFIED AMENITIES IN ROOM</h3>
          <div className="flex flex-wrap gap-1.5">
            {[...room.amenities, 'Freestanding Soaking Tub'].map((amenity) => (
              <span key={amenity} className="inline-flex items-center gap-1 bg-stone-100 px-2 py-1 text-[9px] text-stone-700"><Check aria-hidden="true" className="size-2.5 text-amber-800" />{amenity}</span>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onEdit} className="col-span-2 inline-flex items-center justify-center gap-2 bg-forest px-3 py-2.5 text-[10px] font-semibold text-white hover:bg-forest-deep"><Pencil aria-hidden="true" className="size-3" /> Edit Room Specifications</button>
          <button type="button" className="border border-stone-300 px-2 py-2 text-[9px] text-ink hover:bg-stone-50"><ClipboardList aria-hidden="true" className="mr-1 inline size-3" />Folio #{room.id}</button>
          <button type="button" onClick={onClose} className="border border-stone-300 px-2 py-2 text-[9px] text-ink hover:bg-stone-50">Close Panel</button>
        </div>
      </div>
    </aside>
  )
}

function RoomCard({ room, selected, onSelect, onEdit }: { room: Room; selected: boolean; onSelect: () => void; onEdit: () => void }) {
  return (
    <article className={`min-w-0 overflow-hidden border bg-white shadow-sm transition-shadow hover:shadow-md ${selected ? 'border-amber-700 ring-1 ring-amber-700/20' : 'border-stone-200'}`}>
      <button type="button" onClick={onSelect} className="block w-full text-left" aria-label={`View details for ${room.name}`}>
        <div className="relative h-32 overflow-hidden bg-stone-100 sm:h-36">
          <img src={room.image} alt={`${room.type} interior`} className="size-full object-cover" />
          <span className="absolute left-2 top-2"><RoomStatusBadge status={room.status} /></span>
          <span className="absolute bottom-2 right-2 bg-forest/90 px-2 py-1 text-[10px] font-semibold text-white">₦{currency.format(room.rate)} / Night</span>
          {room.status === 'Occupied' && selected && <span className="absolute right-2 top-2 bg-amber-800 px-2 py-1 text-[9px] text-white">Active Inspector View</span>}
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-display text-base text-ink">{room.name}</h3>
              <p className="truncate text-[10px] text-muted">{room.type}</p>
            </div>
            <span className="shrink-0 bg-stone-100 px-1.5 py-1 text-[9px] text-muted">FLOOR {room.floor}</span>
          </div>
          {(room.guest || room.note) && (
            <div className={`mt-2 border px-2 py-1.5 text-[9px] ${room.status === 'Occupied' ? 'border-stone-200 bg-stone-50 text-stone-600' : room.status === 'Cleaning' ? 'border-cyan-200 bg-cyan-50 text-cyan-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
              {room.guest && <strong className="block truncate font-medium">{room.guest}</strong>}
              {room.note && <span>{room.note}</span>}
            </div>
          )}
          <div className="mt-2 flex items-center gap-3 text-[9px] text-muted">
            <span className="inline-flex items-center gap-1"><Waves aria-hidden="true" className="size-3" />{room.area} sqm</span>
            <span className="inline-flex items-center gap-1"><UsersRound aria-hidden="true" className="size-3" />Max {room.guests} Guests</span>
          </div>
          <div className="mt-2 flex min-h-6 flex-wrap gap-1">
            {room.amenities.slice(0, 3).map((amenity) => <span key={amenity} className="bg-stone-100 px-1.5 py-1 text-[8px] text-stone-600">{amenity}</span>)}
          </div>
        </div>
      </button>
      <footer className="flex items-center justify-between border-t border-stone-100 px-3 py-2">
        <button type="button" onClick={onSelect} className="text-[9px] font-medium text-ink hover:text-amber-800">
          {room.status === 'Cleaning' ? 'Mark as Inspected' : room.status === 'Reserved' ? 'View Reservation' : room.status === 'Maintenance' ? 'View Maintenance Work Order' : room.status === 'Occupied' ? 'View Folio' : 'View Details'}
          <span aria-hidden="true" className="ml-1">›</span>
        </button>
        <button type="button" onClick={onEdit} aria-label={`Edit ${room.name}`} className="grid size-6 place-items-center text-muted hover:text-ink"><Pencil aria-hidden="true" className="size-3" /></button>
      </footer>
    </article>
  )
}

export function AdminRooms() {
  const [roomData, setRoomData] = useState(rooms)
  const [selectedId, setSelectedId] = useState('402')
  const [search, setSearch] = useState('')
  const [roomType, setRoomType] = useState('All Room Types')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [floorFilter, setFloorFilter] = useState('All Floors')
  const [page, setPage] = useState(1)
  const [listView, setListView] = useState(false)
  const [dialog, setDialog] = useState<'room' | 'types' | null>(null)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)

  const selectedRoom = roomData.find((room) => room.id === selectedId)
  const editingRoom = roomData.find((room) => room.id === editingRoomId)
  const counts = useMemo(() => roomData.reduce((result, room) => {
    result[room.status] += 1
    return result
  }, { Available: 0, Occupied: 0, Reserved: 0, Cleaning: 0, Maintenance: 0 }), [roomData])

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase()
    return roomData.filter((room) => (
      (!query || `${room.name} ${room.type} ${room.id}`.toLowerCase().includes(query))
      && (roomType === 'All Room Types' || room.type === roomType)
      && (statusFilter === 'All Statuses' || room.status === statusFilter)
      && (floorFilter === 'All Floors' || room.floor === Number(floorFilter))
    ))
  }, [floorFilter, roomData, roomType, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRooms = filteredRooms.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const roomTypes = [...new Set(roomData.map((room) => room.type))]

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  function updateSelectedStatus(status: RoomStatus) {
    if (!selectedRoom) return
    setRoomData((current) => current.map((room) => room.id === selectedRoom.id ? { ...room, status } : room))
  }

  function addRoom(room: Room) {
    setRoomData((current) => [room, ...current])
    setSelectedId(room.id)
    setPage(1)
    setDialog(null)
  }

  function saveRoomChanges(updatedRoom: Room) {
    setRoomData((current) => current.map((room) => room.id === updatedRoom.id ? updatedRoom : room))
    setEditingRoomId(null)
  }

  function editRoom(room: Room) {
    setSelectedId(room.id)
    setEditingRoomId(room.id)
  }

  const selectClass = 'h-9 min-w-0 border border-stone-200 bg-stone-50 px-2 text-[10px] text-ink outline-none focus:border-amber-800'

  return (
    <section className="mx-auto max-w-[1600px]">
      <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.17em] text-amber-800">PROPERTY INVENTORY</p>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Rooms Management</h1>
          <p className="mt-1 max-w-2xl text-[11px] text-muted sm:text-[13px]">Manage live room inventory, room configurations, night pricing, luxury amenities, and operational turnarounds across Victoria Island wings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDialog('types')} className="inline-flex items-center justify-center gap-2 border border-stone-300 bg-white px-3 py-2.5 text-[10px] font-semibold text-ink hover:bg-stone-50"><SlidersHorizontal aria-hidden="true" className="size-3.5" /> Manage Room Types</button>
          <button type="button" onClick={() => setDialog('room')} className="inline-flex items-center justify-center gap-2 bg-forest px-3 py-2.5 text-[10px] font-semibold text-white hover:bg-forest-deep"><CirclePlus aria-hidden="true" className="size-3.5" /> Add New Room</button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {([
          { label: 'TOTAL ROOMS', status: null, value: roomData.length, icon: BedDouble, note: 'Across 4 residential floors' },
          { label: 'AVAILABLE', status: 'Available' as RoomStatus, value: counts.Available, icon: CircleCheck, note: 'Ready for immediate guest use' },
          { label: 'OCCUPIED', status: 'Occupied' as RoomStatus, value: counts.Occupied, icon: UsersRound, note: 'Active in-house VIP guests' },
          { label: 'RESERVED', status: 'Reserved' as RoomStatus, value: counts.Reserved, icon: ClipboardList, note: 'Arrivals scheduled within 48h' },
          { label: 'TURNAROUND', status: 'Cleaning' as RoomStatus, value: counts.Cleaning + counts.Maintenance, icon: Sparkles, note: `${counts.Cleaning} Cleaning · ${counts.Maintenance} Maintenance` },
        ]).map(({ label, status, value, icon: Icon, note }) => (
          <button
            type="button"
            key={label}
            onClick={() => status && changeFilter(setStatusFilter, statusFilter === status ? 'All Statuses' : status)}
            className={`border-l-2 border-stone-300 bg-white p-3 text-left shadow-sm transition-colors hover:bg-stone-50 ${status ? statusDetails[status].accent.replace('bg-', 'border-') : 'border-forest'}`}
          >
            <span className="flex items-center justify-between gap-1 text-[9px] font-semibold tracking-[0.12em] text-muted">
              {label}<Icon aria-hidden="true" className="size-3.5 text-forest" />
            </span>
            <span className="mt-1.5 flex items-baseline gap-1 font-display text-2xl text-ink">{value}<small className="font-body text-[10px] text-muted">{label === 'TOTAL ROOMS' ? 'Keys' : ''}</small></span>
            <span className="mt-1 block truncate text-[9px] text-muted">{note}</span>
          </button>
        ))}
      </div>

      <section className="mb-4 border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm text-ink">Inventory Allocation &amp; Live Capacity</h2>
            <p className="text-[9px] text-muted">{roomData.length} Total Operational Units</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[9px] text-forest"><i className="size-1.5 rounded-full bg-emerald-600" /> Real-time PMS sync active</span>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden bg-stone-100" aria-label="Room status allocation">
          {(['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'] as RoomStatus[]).map((status) => (
            <div key={status} title={`${status}: ${counts[status]}`} className={`${statusDetails[status].accent} h-full`} style={{ width: `${counts[status] / roomData.length * 100}%` }} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] text-muted">
          {(['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'] as RoomStatus[]).map((status) => (
            <span key={status} className="inline-flex items-center gap-1"><i className={`size-1.5 rounded-full ${statusDetails[status].accent}`} />{status}: {counts[status]} ({(counts[status] / roomData.length * 100).toFixed(1)}%)</span>
          ))}
        </div>
        <p className="mt-2 text-[9px] text-muted">Victoria Island Waterfront Wing &amp; Marina Residences</p>
      </section>

      <section className="mb-4 border border-stone-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(180px,1.3fr)_minmax(130px,1fr)_minmax(110px,.7fr)_minmax(110px,.7fr)_auto]">
          <label className="flex h-9 min-w-0 items-center gap-2 border border-stone-200 bg-stone-50 px-2">
            <Search aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
            <span className="sr-only">Search room number or type</span>
            <input value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="Search room number (e.g. 101, 204)..." className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-muted/70" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by room type</span>
            <select className={`${selectClass} w-full appearance-none pr-7`} value={roomType} onChange={(event) => changeFilter(setRoomType, event.target.value)}>
              <option>All Room Types</option>
              {roomTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-3 size-3 text-muted" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by status</span>
            <select className={`${selectClass} w-full appearance-none pr-7`} value={statusFilter} onChange={(event) => changeFilter(setStatusFilter, event.target.value)}>
              <option>All Statuses</option>
              {(['Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance'] as RoomStatus[]).map((status) => <option key={status}>{status}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-3 size-3 text-muted" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by floor</span>
            <select className={`${selectClass} w-full appearance-none pr-7`} value={floorFilter} onChange={(event) => changeFilter(setFloorFilter, event.target.value)}>
              <option>All Floors</option>
              {[1, 2, 3, 4, 5, 6].map((floor) => <option key={floor} value={floor}>Floor {floor}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-3 size-3 text-muted" />
          </label>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button type="button" onClick={() => { setSearch(''); setRoomType('All Room Types'); setStatusFilter('All Statuses'); setFloorFilter('All Floors'); setPage(1) }} className="whitespace-nowrap text-[9px] text-muted hover:text-ink">Clear Filters</button>
            <span className="whitespace-nowrap text-[9px] text-muted">Showing {filteredRooms.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredRooms.length)} of {filteredRooms.length}</span>
            <div className="flex border border-stone-200">
              <button type="button" onClick={() => setListView(false)} aria-label="Grid view" aria-pressed={!listView} className={`grid size-8 place-items-center ${!listView ? 'bg-forest text-white' : 'text-muted hover:bg-stone-50'}`}><Grid2X2 aria-hidden="true" className="size-3.5" /></button>
              <button type="button" onClick={() => setListView(true)} aria-label="List view" aria-pressed={listView} className={`grid size-8 place-items-center ${listView ? 'bg-forest text-white' : 'text-muted hover:bg-stone-50'}`}><List aria-hidden="true" className="size-3.5" /></button>
            </div>
          </div>
        </div>
      </section>

      <div className={`grid items-start gap-4 ${selectedRoom ? 'xl:grid-cols-[minmax(0,1.8fr)_minmax(260px,.8fr)]' : 'grid-cols-1'}`}>
        <div className={listView ? 'grid gap-2' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
          {visibleRooms.map((room) => (
            <RoomCard key={room.id} room={room} selected={room.id === selectedId} onSelect={() => setSelectedId(room.id)} onEdit={() => editRoom(room)} />
          ))}
          {visibleRooms.length === 0 && (
            <div className="col-span-full border border-dashed border-stone-300 bg-white px-5 py-12 text-center">
              <BedDouble aria-hidden="true" className="mx-auto size-6 text-muted" />
              <p className="mt-2 font-display text-lg text-ink">No rooms match those filters</p>
              <p className="mt-1 text-[11px] text-muted">Try another room number, type, status, or floor.</p>
            </div>
          )}
        </div>
        {selectedRoom && <RoomInspector room={selectedRoom} onClose={() => setSelectedId('')} onStatusChange={updateSelectedStatus} onEdit={() => editRoom(selectedRoom)} />}
      </div>

      <footer className="mt-4 flex flex-col gap-3 border border-stone-200 bg-white px-3 py-3 text-[9px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Showing {filteredRooms.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRooms.length)} of {filteredRooms.length} rooms across 4 Residential Wings</span>
        <div className="flex items-center gap-2">
          <span>Rows per view:</span>
          <span className="inline-flex items-center gap-1 border border-stone-200 bg-stone-50 px-2 py-1.5 text-ink">{pageSize} keys <ChevronDown aria-hidden="true" className="size-3" /></span>
          <div className="ml-2 flex items-center gap-1">
            <button type="button" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous page" className="grid size-7 place-items-center disabled:opacity-40"><ChevronLeft aria-hidden="true" className="size-3.5" /></button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map((pageNumber) => (
              <button type="button" key={pageNumber} aria-current={currentPage === pageNumber ? 'page' : undefined} onClick={() => setPage(pageNumber)} className={`grid size-7 place-items-center ${currentPage === pageNumber ? 'bg-forest font-semibold text-white' : 'hover:bg-stone-100'}`}>{pageNumber}</button>
            ))}
            {totalPages > 3 && <><span>…</span><button type="button" onClick={() => setPage(totalPages)} className={`grid size-7 place-items-center ${currentPage === totalPages ? 'bg-forest font-semibold text-white' : 'hover:bg-stone-100'}`}>{totalPages}</button></>}
            <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} aria-label="Next page" className="grid size-7 place-items-center disabled:opacity-40"><ChevronRight aria-hidden="true" className="size-3.5" /></button>
          </div>
        </div>
      </footer>

      {dialog === 'room' && <RoomDialog onClose={() => setDialog(null)} onAdd={addRoom} />}
      {editingRoom && <RoomEditDialog room={editingRoom} onClose={() => setEditingRoomId(null)} onSave={saveRoomChanges} />}
      {dialog === 'types' && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" onMouseDown={() => setDialog(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="room-types-title" className="w-full max-w-md border border-stone-200 bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div><p className="text-[10px] font-semibold tracking-[0.15em] text-amber-800">ROOM CONFIGURATION</p><h2 id="room-types-title" className="mt-1 font-display text-xl text-ink">Manage Room Types</h2></div>
              <button type="button" onClick={() => setDialog(null)} aria-label="Close room types" className="grid size-8 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
            </div>
            <div className="mt-4 divide-y divide-stone-100">
              {roomSuites.map((suite) => <div key={suite.id} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0"><strong className="block truncate text-[11px] font-semibold text-ink">{suite.fullName}</strong><small className="text-[10px] text-muted">{suite.details[0].label} · Max {suite.maxGuests} guests</small></span><strong className="shrink-0 text-[11px] text-amber-900">₦{currency.format(suite.priceValue)} / night</strong></div>)}
            </div>
            <button type="button" onClick={() => setDialog(null)} className="mt-3 w-full bg-forest px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-forest-deep">Done</button>
          </section>
        </div>
      )}
    </section>
  )
}
