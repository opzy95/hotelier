import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Archive,
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
  SlidersHorizontal,
  UsersRound,
  Waves,
  X,
} from 'lucide-react'
import { useAdminReservations } from './AdminReservationsContext'
import { createRoom, createRoomType, deactivateRoom, deactivateRoomType, deleteRoomTypePhoto, fetchRoomInventory, updateRoom, updateRoomType, uploadRoomTypePhotos } from './adminRoomsApi'
import { getRoomStatusCounts, getRoomStatusesForDate } from './adminRoomsData'
import type { BedSetupItem, Room, RoomDraft, RoomStatus, RoomType, RoomTypeDraft } from './adminRoomsData'

const statusDetails: Record<RoomStatus, { color: string; accent: string }> = {
  Available: { color: 'border-emerald-200 bg-emerald-50 text-emerald-800', accent: 'bg-emerald-600' },
  Occupied: { color: 'border-sky-200 bg-sky-50 text-sky-800', accent: 'bg-sky-700' },
  Reserved: { color: 'border-amber-200 bg-amber-50 text-amber-900', accent: 'bg-amber-700' },
}

const pageSize = 8

function currentDateKey() {
  return new Date().toISOString().slice(0, 10)
}

function formatCurrency(amount: number, currencyCode: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

function formatBedSetup(beds: BedSetupItem[]) {
  return beds.map(({ type, count }) => `${count} ${type} ${count === 1 ? 'bed' : 'beds'}`).join(', ')
}

function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[10px] font-semibold ${statusDetails[status].color}`}>
      <i className={`size-1.5 rounded-full ${statusDetails[status].accent}`} />
      {status}
    </span>
  )
}

function RoomDialog({ roomTypes, onClose, onSave, saving, error }: {
  roomTypes: RoomType[]
  onClose: () => void
  onSave: (draft: RoomDraft) => void
  saving: boolean
  error: string
}) {
  const [number, setNumber] = useState('')
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id ?? '')
  const [floor, setFloor] = useState('1')
  const [wing, setWing] = useState('')
  const [notes, setNotes] = useState('')

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
        <form onSubmit={(event) => { event.preventDefault(); onSave({ roomNumber: number.trim(), roomTypeId, floor: Number(floor), wing: wing.trim(), notes: notes.trim() }) }} className="flex flex-1 flex-col">
          <div className="flex-1 space-y-4 p-5">
            {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-900">{error}</p>}
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              ROOM NUMBER OR CODE *
              <input className={fieldClass} value={number} onChange={(event) => setNumber(event.target.value)} placeholder="e.g. 501" required />
            </label>
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              ROOM TYPE *
              <select className={fieldClass} value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)} required>
                {roomTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[11px] font-semibold tracking-wide text-ink">FLOOR<input className={fieldClass} type="number" min="1" value={floor} onChange={(event) => setFloor(event.target.value)} /></label>
              <label className="block text-[11px] font-semibold tracking-wide text-ink">WING / BUILDING<input className={fieldClass} value={wing} onChange={(event) => setWing(event.target.value)} placeholder="Optional" /></label>
            </div>
            <label className="block text-[11px] font-semibold tracking-wide text-ink">ROOM NOTES<textarea className={`${fieldClass} min-h-20 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional room-specific details" /></label>
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} className="border border-stone-300 px-4 py-2.5 text-[11px] font-semibold text-ink hover:bg-stone-50">Cancel</button>
            <button type="submit" disabled={saving || !roomTypes.length} className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-forest-deep disabled:opacity-50"><Plus aria-hidden="true" className="size-3.5" /> {saving ? 'Saving…' : 'Add Room'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function RoomEditDialog({ room, roomTypes, onClose, onSave, saving, error }: {
  room: Room
  roomTypes: RoomType[]
  onClose: () => void
  onSave: (draft: RoomDraft) => void
  saving: boolean
  error: string
}) {
  const [name, setName] = useState(room.name)
  const [roomTypeId, setRoomTypeId] = useState(room.roomTypeId ?? roomTypes.find((type) => type.name === room.type)?.id ?? '')
  const [floor, setFloor] = useState(String(room.floor))
  const [wing, setWing] = useState(room.wing ?? '')
  const [notes, setNotes] = useState(room.notes ?? '')
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  function submitChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ roomNumber: name.trim(), roomTypeId, floor: Number(floor), wing: wing.trim(), notes: notes.trim() })
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
            {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-900">{error}</p>}
            <label className="block text-[11px] font-semibold tracking-wide text-ink">
              ROOM NAME
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="block text-[11px] font-semibold tracking-wide text-ink">ROOM TYPE<select className={fieldClass} value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)} required>{roomTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[11px] font-semibold tracking-wide text-ink">FLOOR<input className={fieldClass} type="number" min="1" max="99" value={floor} onChange={(event) => setFloor(event.target.value)} /></label>
              <label className="block text-[11px] font-semibold tracking-wide text-ink">WING / BUILDING<input className={fieldClass} value={wing} onChange={(event) => setWing(event.target.value)} /></label>
            </div>
            <label className="block text-[11px] font-semibold tracking-wide text-ink">ROOM NOTES<textarea className={`${fieldClass} min-h-24 resize-y`} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} className="border border-stone-300 px-4 py-2.5 text-[11px] font-semibold text-ink hover:bg-stone-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[11px] font-semibold text-white hover:bg-forest-deep disabled:opacity-50"><Save aria-hidden="true" className="size-3.5" /> {saving ? 'Saving…' : 'Save Changes'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function RoomTypeForm({ roomType, onCancel, onSave, onDeletePhoto, saving }: {
  roomType?: RoomType
  onCancel: () => void
  onSave: (draft: RoomTypeDraft, roomTypeId?: string, photos?: File[]) => Promise<boolean>
  onDeletePhoto: (roomTypeId: string, photoId: string) => void
  saving: boolean
}) {
  const [name, setName] = useState(roomType?.name ?? '')
  const [description, setDescription] = useState(roomType?.description ?? '')
  const [area, setArea] = useState(String(roomType?.area ?? ''))
  const [maxGuests, setMaxGuests] = useState(String(roomType?.maxGuests ?? ''))
  const [bedSetup, setBedSetup] = useState<BedSetupItem[]>(roomType?.bedSetup.length ? roomType.bedSetup : [{ type: '', count: 1 }])
  const [rate, setRate] = useState(String(roomType?.rate ?? ''))
  const [amenities, setAmenities] = useState(roomType?.amenities.join(', ') ?? '')
  const [photos, setPhotos] = useState<File[]>([])
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const saved = await onSave({
      name: name.trim(),
      description: description.trim(),
      area: Number(area),
      maxGuests: Number(maxGuests),
      bedSetup: bedSetup.filter((bed) => bed.type.trim()).map((bed) => ({ type: bed.type.trim(), count: bed.count })),
      rate: Number(rate),
      amenities: amenities.split(',').map((amenity) => amenity.trim()).filter(Boolean),
    }, roomType?.id, photos)
    if (saved && !roomType) {
      form.reset()
      setName('')
      setDescription('')
      setArea('')
      setMaxGuests('')
      setBedSetup([{ type: '', count: 1 }])
      setRate('')
      setAmenities('')
      setPhotos([])
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-[10px] font-semibold tracking-wide text-ink">ROOM TYPE NAME *<input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Deluxe Lagoon Room" required /></label>
      <label className="block text-[10px] font-semibold tracking-wide text-ink">DESCRIPTION<textarea className={`${fieldClass} min-h-16 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe this room category" /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-[10px] font-semibold tracking-wide text-ink">SIZE (SQM) *<input className={fieldClass} type="number" min="1" step="0.1" value={area} onChange={(event) => setArea(event.target.value)} required /></label>
        <label className="block text-[10px] font-semibold tracking-wide text-ink">MAX GUESTS *<input className={fieldClass} type="number" min="1" step="1" value={maxGuests} onChange={(event) => setMaxGuests(event.target.value)} required /></label>
        <label className="block text-[10px] font-semibold tracking-wide text-ink">BASE RATE / NIGHT *<input className={fieldClass} type="number" min="0" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} required /><span className="mt-1 block text-[9px] font-normal normal-case tracking-normal text-muted">Entered in the hotel’s configured currency.</span></label>
      </div>
      <fieldset className="space-y-2"><legend className="text-[10px] font-semibold tracking-wide text-ink">BED SETUP *</legend>{bedSetup.map((bed, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_88px_32px] gap-2"><label className="sr-only" htmlFor={`bed-type-${index}`}>Bed type</label><input id={`bed-type-${index}`} className={fieldClass} value={bed.type} onChange={(event) => setBedSetup((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value } : item))} placeholder="e.g. queen" required /><label className="sr-only" htmlFor={`bed-count-${index}`}>Bed count</label><input id={`bed-count-${index}`} className={fieldClass} type="number" min="1" step="1" value={bed.count} onChange={(event) => setBedSetup((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, count: Number(event.target.value) } : item))} required /><button type="button" disabled={bedSetup.length === 1} onClick={() => setBedSetup((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove bed setup ${index + 1}`} className="grid size-8 place-items-center border border-stone-200 text-muted hover:text-rose-800 disabled:opacity-40"><X aria-hidden="true" className="size-3.5" /></button></div>)}<button type="button" onClick={() => setBedSetup((current) => [...current, { type: '', count: 1 }])} className="inline-flex items-center gap-1 text-[10px] font-semibold text-forest hover:underline"><Plus aria-hidden="true" className="size-3" />Add bed type</button></fieldset>
      <label className="block text-[10px] font-semibold tracking-wide text-ink">AMENITIES<textarea className={`${fieldClass} min-h-16 resize-y`} value={amenities} onChange={(event) => setAmenities(event.target.value)} placeholder="Wi-Fi, balcony, breakfast" /><span className="mt-1 block text-[9px] font-normal normal-case tracking-normal text-muted">Separate amenities with commas.</span></label>
      {roomType?.photos.length ? <div><p className="mb-1.5 text-[10px] font-semibold tracking-wide text-ink">ROOM TYPE PHOTOS</p><div className="grid grid-cols-3 gap-2">{roomType.photos.map((photo) => <div key={photo.id} className="relative aspect-[4/3] overflow-hidden border border-stone-200"><img src={photo.url} alt={`${roomType.name} room`} className="size-full object-cover" /><button type="button" onClick={() => onDeletePhoto(roomType.id, photo.id)} disabled={saving} aria-label="Remove photo" className="absolute right-1 top-1 grid size-6 place-items-center bg-white/90 text-rose-800 shadow-sm disabled:opacity-50"><X aria-hidden="true" className="size-3" /></button></div>)}</div></div> : null}
      <label className="block text-[10px] font-semibold tracking-wide text-ink">{roomType ? 'ADD PHOTOS' : 'PHOTOS'}<input className={`${fieldClass} file:mr-3 file:border-0 file:bg-forest file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-white`} type="file" accept="image/*" multiple onChange={(event) => setPhotos(Array.from(event.target.files ?? []))} /><span className="mt-1 block text-[9px] font-normal normal-case tracking-normal text-muted">Images upload after this room type is saved.</span></label>
      <div className="flex justify-end gap-2 border-t border-stone-200 pt-3">
        <button type="button" onClick={onCancel} className="border border-stone-300 px-3 py-2 text-[10px] font-semibold text-ink hover:bg-stone-50">Cancel</button>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-forest px-3 py-2 text-[10px] font-semibold text-white hover:bg-forest-deep disabled:opacity-50"><Save aria-hidden="true" className="size-3.5" />{saving ? 'Saving…' : roomType ? 'Save Type' : 'Add Type'}</button>
      </div>
    </form>
  )
}

function RoomTypeManagerDialog({ roomTypes, onClose, onSave, onDeactivate, onDeletePhoto, saving, error }: {
  roomTypes: RoomType[]
  onClose: () => void
  onSave: (draft: RoomTypeDraft, roomTypeId?: string, photos?: File[]) => Promise<boolean>
  onDeactivate: (roomTypeId: string) => void
  onDeletePhoto: (roomTypeId: string, photoId: string) => void
  saving: boolean
  error: string
}) {
  const [editing, setEditing] = useState<RoomType | null>(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/50 p-4" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="room-types-title" className="my-auto w-full max-w-3xl border border-stone-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 px-5 py-4">
          <div><p className="text-[10px] font-semibold tracking-[0.15em] text-amber-800">ROOM CONFIGURATION</p><h2 id="room-types-title" className="mt-1 font-display text-xl text-ink">Manage Room Types</h2><p className="mt-1 text-[11px] text-muted">Configure shared capacity, beds, amenities, and nightly pricing before adding rooms.</p></div>
          <button type="button" onClick={onClose} aria-label="Close room types" className="grid size-8 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
        </header>
        {error && <p role="alert" className="mx-5 mt-4 border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-900">{error}</p>}
        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,.8fr)]">
          <section>
            <div className="mb-2 flex items-center justify-between"><h3 className="text-[10px] font-semibold tracking-wide text-ink">SAVED ROOM TYPES</h3><span className="text-[10px] text-muted">{roomTypes.filter((type) => type.active).length} active</span></div>
            <div className="divide-y divide-stone-200 border-y border-stone-200">
              {roomTypes.length ? roomTypes.map((type) => (
                <article key={type.id} className={`flex items-start justify-between gap-3 py-3 ${!type.active ? 'opacity-55' : ''}`}>
                  <div className="min-w-0"><div className="flex items-center gap-2"><strong className="truncate text-xs font-semibold text-ink">{type.name}</strong><span className="text-[8px] font-semibold tracking-wide text-muted">{type.active ? 'ACTIVE' : 'INACTIVE'}</span></div><p className="mt-1 text-[10px] text-muted">{type.area} sqm · Max {type.maxGuests} guests · {formatBedSetup(type.bedSetup)}</p><p className="mt-1 text-[10px] font-semibold text-amber-900">{formatCurrency(type.rate, type.currency)} / night</p></div>
                  <div className="flex shrink-0 gap-1"><button type="button" onClick={() => { setEditing(type); setAdding(false) }} aria-label={`Edit ${type.name}`} className="grid size-8 place-items-center border border-stone-200 text-muted hover:text-ink"><Pencil aria-hidden="true" className="size-3.5" /></button>{type.active && <button type="button" onClick={() => { if (window.confirm(`Deactivate ${type.name}? Existing rooms will keep this type.`)) onDeactivate(type.id) }} disabled={saving} aria-label={`Deactivate ${type.name}`} title="Deactivate room type" className="grid size-8 place-items-center border border-stone-200 text-muted hover:text-rose-800 disabled:opacity-50"><Archive aria-hidden="true" className="size-3.5" /></button>}</div>
                </article>
              )) : <p className="py-8 text-center text-[11px] text-muted">No room types yet. Add one to start building your inventory.</p>}
            </div>
          </section>
          <section className="border border-stone-200 bg-paper p-4">
            {editing || adding ? <><div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-semibold tracking-wide text-ink">{editing ? 'EDIT ROOM TYPE' : 'NEW ROOM TYPE'}</h3><button type="button" onClick={() => { setEditing(null); setAdding(false) }} aria-label="Close room type form" className="grid size-7 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-3.5" /></button></div><RoomTypeForm key={editing?.id ?? 'new'} roomType={editing ? roomTypes.find((type) => type.id === editing.id) ?? editing : undefined} onCancel={() => { setEditing(null); setAdding(false) }} onSave={onSave} onDeletePhoto={onDeletePhoto} saving={saving} /></> : <div className="flex h-full min-h-40 flex-col items-start justify-center"><h3 className="font-display text-lg text-ink">Build your room catalog</h3><p className="mt-1 text-[10px] leading-5 text-muted">Each type stores shared features and pricing. Individual rooms reference one saved type.</p><button type="button" onClick={() => setAdding(true)} className="mt-4 inline-flex min-h-9 items-center gap-2 bg-forest px-3 text-[10px] font-semibold text-white hover:bg-forest-deep"><Plus aria-hidden="true" className="size-3.5" />Add Room Type</button></div>}
          </section>
        </div>
        <footer className="flex justify-end border-t border-stone-200 px-5 py-3"><button type="button" onClick={onClose} className="bg-forest px-4 py-2.5 text-[10px] font-semibold text-white hover:bg-forest-deep">Done</button></footer>
      </section>
    </div>
  )
}

function RoomInspector({ room, onClose, onEdit, onDeactivate, saving }: {
  room: Room
  onClose: () => void
  onEdit: () => void
  onDeactivate: () => void
  saving: boolean
}) {
  return (
    <aside className="self-start border border-stone-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-forest px-3 py-2 text-white">
        <span className="text-[10px] font-semibold tracking-wide">INSPECTOR DRAWER</span>
        <div className="flex items-center gap-2 text-[10px] text-white/70">
          {room.wing ? `${room.wing} · ` : ''}Floor {room.floor}
          <button type="button" onClick={onClose} aria-label="Close room details" className="text-white/70 hover:text-white"><X aria-hidden="true" className="size-3.5" /></button>
        </div>
      </div>
      <div className="space-y-4 p-3">
        <div className="border-b border-stone-100 pb-3">
          <h2 className="font-display text-xl leading-none text-ink">Room {room.name.replace(/^Room\s*/i, '')}</h2>
          <p className="mt-1 text-[10px] text-muted">{room.type} · {room.area} sqm</p>
        </div>
        <section className="border border-stone-200 bg-stone-50 px-3 py-2.5"><h3 className="text-[10px] font-semibold tracking-wide text-ink">ROOM STATUS</h3><p className="mt-1 text-[9px] leading-4 text-muted">{room.status} · Updated from reservations and check-in records.</p>{!room.active && <p className="mt-1 text-[9px] font-semibold text-rose-800">Inactive</p>}{room.guest && <p className="mt-1 text-[9px] text-muted">Guest: <strong className="font-medium text-ink">{room.guest}</strong></p>}</section>
        <section>
          <h3 className="mb-2 text-[10px] font-semibold tracking-wide text-ink">VERIFIED AMENITIES IN ROOM</h3>
          <div className="flex flex-wrap gap-1.5">
            {room.amenities.map((amenity) => (
              <span key={amenity} className="inline-flex items-center gap-1 bg-stone-100 px-2 py-1 text-[9px] text-stone-700"><Check aria-hidden="true" className="size-2.5 text-amber-800" />{amenity}</span>
            ))}
          </div>
        </section>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={onEdit} className="col-span-2 inline-flex items-center justify-center gap-2 bg-forest px-3 py-2.5 text-[10px] font-semibold text-white hover:bg-forest-deep"><Pencil aria-hidden="true" className="size-3" /> Edit Room Specifications</button>
          {room.notes && <p className="col-span-2 text-[9px] text-muted">{room.notes}</p>}
          {room.active && <button type="button" onClick={onDeactivate} disabled={saving} className="col-span-2 inline-flex items-center justify-center gap-2 border border-rose-200 px-3 py-2 text-[10px] font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"><Archive aria-hidden="true" className="size-3" /> Deactivate Room</button>}
          <button type="button" onClick={onClose} className="col-span-2 border border-stone-300 px-2 py-2 text-[9px] text-ink hover:bg-stone-50">Close Panel</button>
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
          {room.image ? <img src={room.image} alt={`${room.type} interior`} className="size-full object-cover" /> : <div className="grid size-full place-items-center text-stone-400"><BedDouble aria-hidden="true" className="size-8" /></div>}
          <span className="absolute left-2 top-2"><RoomStatusBadge status={room.status} /></span>
          {!room.active && <span className="absolute right-2 top-2 bg-rose-800 px-2 py-1 text-[9px] font-semibold text-white">INACTIVE</span>}
          <span className="absolute bottom-2 right-2 bg-forest/90 px-2 py-1 text-[10px] font-semibold text-white">{formatCurrency(room.rate, room.currency)} / Night</span>
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
          {(room.status === 'Occupied' || room.status === 'Reserved') && (room.guest || room.note) && (
            <div className={`mt-2 border px-2 py-1.5 text-[9px] ${room.status === 'Occupied' ? 'border-stone-200 bg-stone-50 text-stone-600' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
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
          {room.status === 'Reserved' ? 'View Reservation' : room.status === 'Occupied' ? 'View Stay' : 'View Details'}
          <span aria-hidden="true" className="ml-1">›</span>
        </button>
        <button type="button" onClick={onEdit} aria-label={`Edit ${room.name}`} className="grid size-6 place-items-center text-muted hover:text-ink"><Pencil aria-hidden="true" className="size-3" /></button>
      </footer>
    </article>
  )
}

export function AdminRooms() {
  const {
    rooms: roomData,
    reservations,
    reservationsLoading,
    reservationsError,
    refreshReservations,
    roomTypes,
    includeInactiveRooms,
    roomLoading: isLoading,
    roomError: loadError,
    refreshRoomInventory,
  } = useAdminReservations()
  const [selectedId, setSelectedId] = useState('')
  const [hotelId] = useState(() => sessionStorage.getItem('selectedHotelId') ?? '')
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [roomType, setRoomType] = useState('All Room Types')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [floorFilter, setFloorFilter] = useState('All Floors')
  const [operationalDate] = useState(currentDateKey)
  const [page, setPage] = useState(1)
  const [listView, setListView] = useState(false)
  const [dialog, setDialog] = useState<'room' | 'types' | null>(null)
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)

  useEffect(() => {
    refreshReservations()
  }, [refreshReservations])

  const operationalRooms = useMemo(
    () => getRoomStatusesForDate(roomData, reservations, operationalDate),
    [operationalDate, reservations, roomData],
  )
  const activeRooms = operationalRooms.filter((room) => room.active)
  const selectedRoom = operationalRooms.find((room) => room.id === selectedId)
  const editingRoom = roomData.find((room) => room.id === editingRoomId)
  const counts = getRoomStatusCounts(activeRooms)

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase()
    return operationalRooms.filter((room) => (
      (!query || `${room.name} ${room.type} ${room.id}`.toLowerCase().includes(query))
      && (includeInactiveRooms || room.active)
      && (roomType === 'All Room Types' || room.type === roomType)
      && (statusFilter === 'All Statuses' || room.status === statusFilter)
      && (floorFilter === 'All Floors' || room.floor === Number(floorFilter))
    ))
  }, [floorFilter, includeInactiveRooms, operationalRooms, roomType, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRooms = filteredRooms.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const roomTypeNames = [...new Set(operationalRooms.filter((room) => includeInactiveRooms || room.active).map((room) => room.type))]
  const activeRoomTypes = roomTypes.filter((type) => type.active)

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  async function addRoom(draft: RoomDraft) {
    setSaving(true)
    setActionError('')
    try {
      await createRoom(hotelId, draft)
      setSelectedId('')
      setPage(1)
      setDialog(null)
      refreshRoomInventory()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not add this room.')
    } finally {
      setSaving(false)
    }
  }

  async function saveRoomChanges(draft: RoomDraft) {
    if (!editingRoomId) return
    setSaving(true)
    setActionError('')
    try {
      await updateRoom(hotelId, editingRoomId, draft)
      setEditingRoomId(null)
      refreshRoomInventory()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update this room.')
    } finally {
      setSaving(false)
    }
  }

  async function saveRoomType(draft: RoomTypeDraft, roomTypeId?: string, photos: File[] = []): Promise<boolean> {
    setSaving(true)
    setActionError('')
    try {
      let savedTypeId = roomTypeId
      if (roomTypeId) await updateRoomType(hotelId, roomTypeId, draft)
      else {
        const createdType = await createRoomType(hotelId, draft)
        savedTypeId = createdType?.id
        if (photos.length && !savedTypeId) {
          const inventory = await fetchRoomInventory(hotelId)
          savedTypeId = inventory.roomTypes.find((type) => type.name.toLowerCase() === draft.name.toLowerCase())?.id
        }
      }
      if (photos.length && savedTypeId) await uploadRoomTypePhotos(hotelId, savedTypeId, photos)
      else if (photos.length) throw new Error('Room type saved, but its ID was not returned. Reload the type and add photos from its edit form.')
      refreshRoomInventory()
      return true
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not save this room type.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function archiveRoomType(roomTypeId: string) {
    setSaving(true)
    setActionError('')
    try {
      await deactivateRoomType(hotelId, roomTypeId)
      refreshRoomInventory()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not deactivate this room type.')
    } finally {
      setSaving(false)
    }
  }

  async function removeRoomTypePhoto(roomTypeId: string, photoId: string) {
    setSaving(true)
    setActionError('')
    try {
      await deleteRoomTypePhoto(hotelId, roomTypeId, photoId)
      refreshRoomInventory()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not remove this room photo.')
    } finally {
      setSaving(false)
    }
  }

  async function archiveRoom(roomId: string) {
    setSaving(true)
    setActionError('')
    try {
      await deactivateRoom(hotelId, roomId)
      setSelectedId('')
      refreshRoomInventory()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not deactivate this room.')
    } finally {
      setSaving(false)
    }
  }

  function editRoom(room: Room) {
    setSelectedId(room.id)
    setEditingRoomId(roomData.find((item) => item.id === room.id)?.id ?? null)
  }

  const selectClass = 'h-9 min-w-0 border border-stone-200 bg-stone-50 px-2 text-[10px] text-ink outline-none focus:border-amber-800'

  return (
    <section className="mx-auto max-w-[1600px]">
      <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.17em] text-amber-800">PROPERTY INVENTORY</p>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Rooms Management</h1>
          <p className="mt-1 max-w-2xl text-[11px] text-muted sm:text-[13px]">Configure room categories, then assign physical rooms and track their reservation-driven availability.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setDialog('types')} className="inline-flex items-center justify-center gap-2 border border-stone-300 bg-white px-3 py-2.5 text-[10px] font-semibold text-ink hover:bg-stone-50"><SlidersHorizontal aria-hidden="true" className="size-3.5" /> Manage Room Types</button>
          <button type="button" onClick={() => setDialog(activeRoomTypes.length ? 'room' : 'types')} disabled={isLoading} className="inline-flex items-center justify-center gap-2 bg-forest px-3 py-2.5 text-[10px] font-semibold text-white hover:bg-forest-deep disabled:opacity-50"><CirclePlus aria-hidden="true" className="size-3.5" /> Add New Room</button>
        </div>
      </header>

      {(loadError || reservationsError || actionError) && (
        <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] text-rose-900">
          <span>{actionError || reservationsError || loadError}</span>
          <div className="flex gap-3">
            {loadError && <button type="button" onClick={() => refreshRoomInventory()} className="shrink-0 font-semibold underline underline-offset-2">Retry room inventory</button>}
            {reservationsError && <button type="button" onClick={refreshReservations} className="shrink-0 font-semibold underline underline-offset-2">Retry reservations</button>}
          </div>
        </div>
      )}
      {reservationsLoading && <p role="status" className="mb-3 text-[10px] text-muted">Syncing reservation statuses…</p>}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {([
          { label: 'TOTAL ROOMS', status: null, value: activeRooms.length, icon: BedDouble, note: 'Active physical rooms' },
          { label: 'AVAILABLE', status: 'Available' as RoomStatus, value: counts.Available, icon: CircleCheck, note: 'Ready for immediate guest use' },
          { label: 'OCCUPIED', status: 'Occupied' as RoomStatus, value: counts.Occupied, icon: UsersRound, note: 'Currently checked in' },
          { label: 'RESERVED', status: 'Reserved' as RoomStatus, value: counts.Reserved, icon: ClipboardList, note: 'Held for current or upcoming stays' },
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
            <p className="text-[9px] text-muted">{activeRooms.length} Total Operational Units</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[9px] text-forest"><i className="size-1.5 rounded-full bg-emerald-600" /> Room status reflects active reservations and hotel records</span>
        </div>
        <div className="mt-2 flex h-2 overflow-hidden bg-stone-100" aria-label="Room status allocation">
          {(['Available', 'Occupied', 'Reserved'] as RoomStatus[]).map((status) => (
            <div key={status} title={`${status}: ${counts[status]}`} className={`${statusDetails[status].accent} h-full`} style={{ width: `${activeRooms.length ? counts[status] / activeRooms.length * 100 : 0}%` }} />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[9px] text-muted">
          {(['Available', 'Occupied', 'Reserved'] as RoomStatus[]).map((status) => (
            <span key={status} className="inline-flex items-center gap-1"><i className={`size-1.5 rounded-full ${statusDetails[status].accent}`} />{status}: {counts[status]} ({(activeRooms.length ? counts[status] / activeRooms.length * 100 : 0).toFixed(1)}%)</span>
          ))}
        </div>
        {isLoading && <p className="mt-2 text-[9px] text-muted">Loading hotel rooms…</p>}
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
              {roomTypeNames.map((type) => <option key={type}>{type}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-3 size-3 text-muted" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by status</span>
            <select className={`${selectClass} w-full appearance-none pr-7`} value={statusFilter} onChange={(event) => changeFilter(setStatusFilter, event.target.value)}>
              <option>All Statuses</option>
              {(['Available', 'Occupied', 'Reserved'] as RoomStatus[]).map((status) => <option key={status}>{status}</option>)}
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
            <label className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[9px] text-muted"><input type="checkbox" checked={includeInactiveRooms} disabled={isLoading} onChange={(event) => { setPage(1); refreshRoomInventory(event.target.checked) }} />Include inactive</label>
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
          {isLoading && <div className="col-span-full border border-stone-200 bg-white px-5 py-12 text-center text-[11px] text-muted">Loading rooms from the hotel database…</div>}
          {!isLoading && visibleRooms.length === 0 && (
            <div className="col-span-full border border-dashed border-stone-300 bg-white px-5 py-12 text-center">
              <BedDouble aria-hidden="true" className="mx-auto size-6 text-muted" />
              <p className="mt-2 font-display text-lg text-ink">{roomData.length ? 'No rooms match those filters' : 'No rooms in this hotel yet'}</p>
              <p className="mt-1 text-[11px] text-muted">{roomData.length ? 'Try another room number, type, status, or floor.' : 'Create a room type first, then add physical rooms to your inventory.'}</p>
            </div>
          )}
        </div>
        {selectedRoom && <RoomInspector room={selectedRoom} onClose={() => setSelectedId('')} onEdit={() => editRoom(selectedRoom)} onDeactivate={() => { if (window.confirm(`Deactivate room ${selectedRoom.name}?`)) void archiveRoom(selectedRoom.id) }} saving={saving} />}
      </div>

      <footer className="mt-4 flex flex-col gap-3 border border-stone-200 bg-white px-3 py-3 text-[9px] text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>Showing {filteredRooms.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredRooms.length)} of {filteredRooms.length} rooms</span>
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

      {dialog === 'room' && <RoomDialog roomTypes={activeRoomTypes} onClose={() => setDialog(null)} onSave={addRoom} saving={saving} error={actionError} />}
      {editingRoom && <RoomEditDialog room={editingRoom} roomTypes={roomTypes} onClose={() => setEditingRoomId(null)} onSave={saveRoomChanges} saving={saving} error={actionError} />}
      {dialog === 'types' && <RoomTypeManagerDialog roomTypes={roomTypes} onClose={() => setDialog(null)} onSave={saveRoomType} onDeactivate={archiveRoomType} onDeletePhoto={removeRoomTypePhoto} saving={saving} error={actionError} />}
    </section>
  )
}
