import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { BriefcaseBusiness, Check, CircleCheck, Clock3, Mail, Pencil, Phone, Plus, Search, UsersRound, X } from 'lucide-react'
import { useAdminStaff } from './AdminStaffContext'
import type { Department, StaffDraft, StaffMember, StaffStatus } from './adminStaffData'
import { createDepartment, createStaff, updateStaff } from './adminStaffApi'
import type { DepartmentDraft } from './adminStaffApi'

type StaffFilter = 'All Staff' | StaffStatus

function statusStyle(status: StaffStatus) {
  if (status === 'On Duty') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'On Leave') return 'border-amber-200 bg-amber-50 text-amber-900'
  return 'border-stone-200 bg-stone-100 text-stone-600'
}

function StaffForm({ member, departments, onClose, onSave, saving, error }: {
  member?: StaffMember
  departments: Department[]
  onClose: () => void
  onSave: (draft: StaffDraft) => void
  saving: boolean
  error: string
}) {
  const [name, setName] = useState(member?.name ?? '')
  const [role, setRole] = useState(member?.role ?? '')
  const [departmentId, setDepartmentId] = useState(member?.departmentId ?? departments[0]?.id ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [phone, setPhone] = useState(member?.phone ?? '')
  const [shift, setShift] = useState(member?.shift ?? '')
  const [status, setStatus] = useState<StaffStatus>(member?.status ?? 'On Duty')
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ name: name.trim(), role: role.trim(), departmentId, email: email.trim(), phone: phone.trim(), shift: shift.trim(), status })
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/50" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="staff-form-title" className="flex h-full w-full max-w-[440px] flex-col bg-paper shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div><p className="text-[10px] font-semibold tracking-[0.15em] text-amber-800">STAFF DIRECTORY</p><h2 id="staff-form-title" className="mt-1 font-display text-xl text-ink">{member ? 'Edit Staff Profile' : 'Add Staff Member'}</h2><p className="mt-1 text-[11px] text-muted">Maintain the staff contact, department, and shift details.</p></div>
          <button type="button" onClick={onClose} aria-label="Close staff form" className="grid size-8 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
        </header>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <label className="block text-[10px] font-semibold tracking-wide text-ink">FULL NAME *<input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required /></label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">JOB TITLE *<input className={fieldClass} value={role} onChange={(event) => setRole(event.target.value)} required /></label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">DEPARTMENT *
              <select className={fieldClass} value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} required>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-[10px] font-semibold tracking-wide text-ink">EMAIL *<input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
              <label className="block text-[10px] font-semibold tracking-wide text-ink">PHONE *<input className={fieldClass} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required /></label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[10px] font-semibold tracking-wide text-ink">SHIFT *<input className={fieldClass} value={shift} onChange={(event) => setShift(event.target.value)} placeholder="Day · 08:00–17:00" required /></label>
              <label className="block text-[10px] font-semibold tracking-wide text-ink">STATUS
                <select className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value as StaffStatus)}>{(['On Duty', 'Off Duty', 'On Leave'] as StaffStatus[]).map((option) => <option key={option}>{option}</option>)}</select>
              </label>
            </div>
            {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-800">{error}</p>}
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} disabled={saving} className="border border-stone-300 px-4 py-2.5 text-[10px] font-semibold text-ink hover:bg-stone-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving || !departments.length} className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[10px] font-semibold text-white hover:bg-forest-deep disabled:cursor-wait disabled:opacity-50"><Check aria-hidden="true" className="size-3.5" /> {saving ? 'Saving…' : member ? 'Save Profile' : 'Add Staff Member'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function DepartmentForm({ onClose, onSave, saving, error }: {
  onClose: () => void
  onSave: (draft: DepartmentDraft) => void
  saving: boolean
  error: string
}) {
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [description, setDescription] = useState('')
  const [lead, setLead] = useState('')
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ name: name.trim(), shortName: shortName.trim(), description: description.trim(), lead: lead.trim() })
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/50" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="department-form-title" className="flex h-full w-full max-w-[440px] flex-col bg-paper shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div><p className="text-[10px] font-semibold tracking-[0.15em] text-amber-800">TEAM STRUCTURE</p><h2 id="department-form-title" className="mt-1 font-display text-xl text-ink">Add Department</h2><p className="mt-1 text-[11px] text-muted">Create the department before assigning staff to it.</p></div>
          <button type="button" onClick={onClose} aria-label="Close department form" className="grid size-8 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
        </header>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <label className="block text-[10px] font-semibold tracking-wide text-ink">DEPARTMENT NAME *<input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">SHORT NAME *<input className={fieldClass} value={shortName} onChange={(event) => setShortName(event.target.value)} maxLength={8} placeholder="e.g. FO" required /></label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">DESCRIPTION<input className={fieldClass} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">DEPARTMENT LEAD<input className={fieldClass} value={lead} onChange={(event) => setLead(event.target.value)} /></label>
            {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-800">{error}</p>}
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} disabled={saving} className="border border-stone-300 px-4 py-2.5 text-[10px] font-semibold text-ink hover:bg-stone-50 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[10px] font-semibold text-white hover:bg-forest-deep disabled:cursor-wait disabled:opacity-50"><Check aria-hidden="true" className="size-3.5" /> {saving ? 'Saving…' : 'Add Department'}</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export function AdminStaff() {
  const { staff, setStaff, departments, setDepartments, loading, error, refresh } = useAdminStaff()
  const [hotelId] = useState(() => sessionStorage.getItem('selectedHotelId') ?? '')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<StaffFilter>('All Staff')
  const [departmentFilter, setDepartmentFilter] = useState('All Departments')
  const [selectedId, setSelectedId] = useState(staff[0]?.id ?? '')
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showDepartmentForm, setShowDepartmentForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const query = search.trim().toLowerCase()

  const filteredStaff = useMemo(() => staff.filter((member) => {
    const matchesQuery = !query || `${member.name} ${member.role} ${member.email} ${member.phone} ${member.id}`.toLowerCase().includes(query)
    const matchesStatus = filter === 'All Staff' || member.status === filter
    const matchesDepartment = departmentFilter === 'All Departments' || member.departmentId === departmentFilter
    return matchesQuery && matchesStatus && matchesDepartment
  }), [departmentFilter, filter, query, staff])

  const selectedMember = staff.find((member) => member.id === selectedId) ?? filteredStaff[0]
  const onDutyCount = staff.filter((member) => member.status === 'On Duty').length
  const onLeaveCount = staff.filter((member) => member.status === 'On Leave').length

  async function saveStaff(draft: StaffDraft, member?: StaffMember) {
    if (!hotelId) {
      setActionError('Select a hotel before saving staff.')
      return
    }
    if (!departments.some((department) => department.id === draft.departmentId)) {
      setActionError('Choose a department that exists before saving this staff member.')
      return
    }

    setSaving(true)
    setActionError('')
    try {
      const saved = member
        ? await updateStaff(hotelId, member.id, draft)
        : await createStaff(hotelId, draft)
      setStaff((current) => member
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current])
      setSelectedId(saved.id)
      setShowAddForm(false)
      setEditingMember(null)
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : 'Could not save the staff member.')
    } finally {
      setSaving(false)
    }
  }

  async function saveDepartment(draft: DepartmentDraft) {
    if (!hotelId) {
      setActionError('Select a hotel before adding a department.')
      return
    }

    setSaving(true)
    setActionError('')
    try {
      const department = await createDepartment(hotelId, draft)
      setDepartments((current) => [department, ...current])
      setDepartmentFilter('All Departments')
      setShowDepartmentForm(false)
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : 'Could not add the department.')
    } finally {
      setSaving(false)
    }
  }

  const departmentStats = departments.map((department) => {
    const members = staff.filter((member) => member.departmentId === department.id)
    return { department, total: members.length, onDuty: members.filter((member) => member.status === 'On Duty').length }
  })
  const tabs: { label: StaffFilter; count: number }[] = [
    { label: 'All Staff', count: staff.length },
    { label: 'On Duty', count: onDutyCount },
    { label: 'Off Duty', count: staff.filter((member) => member.status === 'Off Duty').length },
    { label: 'On Leave', count: onLeaveCount },
  ]
  const selectClass = 'h-9 border border-stone-200 bg-stone-50 px-2 text-[10px] text-ink outline-none focus:border-amber-800'

  return (
    <section className="mx-auto max-w-[1600px]">
      <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div><p className="text-[10px] font-semibold tracking-[0.17em] text-amber-800">PEOPLE &amp; OPERATIONS</p><h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Staff &amp; Departments</h1><p className="mt-1 max-w-2xl text-[11px] text-muted sm:text-[13px]">Manage staff profiles, department assignments, and daily availability.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setActionError(''); setShowDepartmentForm(true) }} disabled={loading || saving} className="inline-flex h-9 items-center justify-center gap-1.5 border border-stone-300 bg-white px-3 text-[10px] font-semibold text-ink hover:bg-stone-50 disabled:opacity-50"><Plus aria-hidden="true" className="size-3.5" /> Add Department</button>
          <button type="button" onClick={() => { setActionError(''); setShowAddForm(true) }} disabled={loading || saving || !departments.length} title={!departments.length ? 'Add a department before adding staff' : undefined} className="inline-flex h-9 items-center justify-center gap-1.5 bg-forest px-3 text-[10px] font-semibold text-white hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-50"><Plus aria-hidden="true" className="size-3.5" /> Add Staff Member</button>
        </div>
      </header>

      {(error || actionError) && (
        <div role="alert" className="mb-4 flex items-center justify-between gap-3 border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10px] text-rose-800">
          <span>{actionError || error}</span>
          {error && <button type="button" onClick={refresh} className="shrink-0 font-semibold underline underline-offset-2">Retry</button>}
        </div>
      )}
      {loading && <p role="status" className="mb-3 text-[10px] text-muted">Loading staff and departments…</p>}

      <div className="mb-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
        {[
          { label: 'TOTAL STAFF', value: staff.length, note: 'Profiles in staff directory', icon: UsersRound },
          { label: 'ON DUTY', value: onDutyCount, note: 'Available for current shifts', icon: CircleCheck },
          { label: 'ON LEAVE', value: onLeaveCount, note: 'Currently away from duty', icon: Clock3 },
          { label: 'DEPARTMENTS', value: departments.length, note: 'Operational teams', icon: BriefcaseBusiness },
        ].map(({ label, value, note, icon: Icon }) => <article key={label} className="border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold tracking-[0.12em] text-muted">{label}</span><Icon aria-hidden="true" className="size-4 text-forest" /></div><strong className="mt-2 block font-display text-2xl text-ink">{value}</strong><p className="mt-1 text-[9px] text-muted">{note}</p></article>)}
      </div>

      <section className="mb-4 border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-[9px] font-semibold tracking-[0.13em] text-amber-800">TEAM STRUCTURE</p><h2 className="mt-1 font-display text-lg text-ink">Department Overview</h2></div><span className="text-[9px] text-muted">{departments.length} departments · {staff.length} staff profiles</span></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {departmentStats.map(({ department, total, onDuty }) => (
            <button type="button" key={department.id} onClick={() => setDepartmentFilter((current) => current === department.id ? 'All Departments' : department.id)} className={`border p-3 text-left transition-colors ${departmentFilter === department.id ? 'border-forest bg-forest/5' : 'border-stone-200 hover:border-stone-400'}`}>
              <div className="flex items-start justify-between gap-3"><span className="grid size-8 shrink-0 place-items-center bg-paper text-[9px] font-bold text-forest">{department.shortName}</span><span className="text-right text-[9px] text-muted">{onDuty} on duty<br />{total} assigned</span></div>
              <h3 className="mt-2 text-[11px] font-semibold text-ink">{department.name}</h3><p className="mt-1 text-[9px] leading-4 text-muted">{department.description}</p><p className="mt-2 text-[9px] text-muted">Department lead · <strong className="font-medium text-ink">{department.lead}</strong></p>
            </button>
          ))}
          {!departments.length && !loading && <p className="border border-dashed border-stone-300 p-4 text-[10px] text-muted sm:col-span-2 xl:col-span-3">No departments yet. Add a department before adding staff.</p>}
        </div>
      </section>

      <section className="overflow-hidden border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-100 p-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter staff by availability">
              {tabs.map(({ label, count }) => <button key={label} type="button" role="tab" aria-selected={filter === label} onClick={() => setFilter(label)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-2.5 py-2 text-[10px] ${filter === label ? 'border-forest font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'}`}>{label}<span className="text-[9px]">{count}</span></button>)}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex h-9 min-w-0 items-center gap-2 border border-stone-200 bg-stone-50 px-2 sm:w-64"><Search aria-hidden="true" className="size-3.5 shrink-0 text-muted" /><span className="sr-only">Search staff</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, title, or contact..." className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-muted/70" /></label>
              <label><span className="sr-only">Filter by department</span><select className={selectClass} value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="All Departments">All Departments</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead className="bg-stone-50 text-[9px] font-semibold tracking-[0.1em] text-muted"><tr><th className="px-3 py-3">STAFF MEMBER</th><th className="px-3 py-3">DEPARTMENT</th><th className="px-3 py-3">CONTACT</th><th className="px-3 py-3">SHIFT</th><th className="px-3 py-3">STATUS</th><th className="px-3 py-3">ACTION</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {filteredStaff.map((member) => <tr key={member.id} onClick={() => setSelectedId(member.id)} className={`cursor-pointer text-[10px] hover:bg-paper/60 ${selectedMember?.id === member.id ? 'bg-amber-50/50' : ''}`}>
                <td className="px-3 py-3"><strong className="block font-medium text-ink">{member.name}</strong><span className="mt-1 block text-[9px] text-muted">{member.role} · {member.id}</span></td>
                <td className="px-3 py-3 text-ink">{departments.find((department) => department.id === member.departmentId)?.name ?? 'Unassigned'}</td>
                <td className="px-3 py-3"><span className="flex items-center gap-1.5 text-muted"><Mail aria-hidden="true" className="size-3 shrink-0" />{member.email}</span><span className="mt-1 flex items-center gap-1.5 text-muted"><Phone aria-hidden="true" className="size-3 shrink-0" />{member.phone}</span></td>
                <td className="whitespace-nowrap px-3 py-3 text-ink">{member.shift}</td>
                <td className="px-3 py-3"><span className={`inline-flex border px-2 py-1 text-[8px] font-semibold ${statusStyle(member.status)}`}>{member.status}</span></td>
                <td className="px-3 py-3" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => setEditingMember(member)} aria-label={`Edit ${member.name}`} className="inline-flex items-center gap-1 border border-stone-300 px-2 py-1.5 text-[9px] font-semibold text-ink hover:bg-stone-50"><Pencil aria-hidden="true" className="size-3" /> Edit</button></td>
              </tr>)}
              {!filteredStaff.length && <tr><td colSpan={6} className="px-4 py-10 text-center text-[10px] text-muted">No staff match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-stone-100 bg-stone-50/70 px-3 py-2.5 text-[9px] text-muted">Showing {filteredStaff.length} of {staff.length} staff profiles</footer>
      </section>

      {selectedMember && <aside className="mt-4 border border-stone-200 bg-white shadow-sm">
        <header className="flex items-start justify-between gap-3 bg-forest px-4 py-3 text-white"><div><p className="text-[8px] font-semibold tracking-[0.14em] text-champagne">STAFF PROFILE</p><h2 className="mt-1 font-display text-lg">{selectedMember.name}</h2><p className="mt-1 text-[9px] text-white/60">{selectedMember.role} · {selectedMember.id}</p></div><button type="button" onClick={() => setEditingMember(selectedMember)} aria-label="Edit staff profile" className="grid size-8 place-items-center text-white/75 hover:bg-white/10 hover:text-white"><Pencil aria-hidden="true" className="size-3.5" /></button></header>
        <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <div><p className="text-[8px] font-semibold tracking-wide text-muted">DEPARTMENT</p><p className="mt-1 text-[10px] font-medium text-ink">{departments.find((department) => department.id === selectedMember.departmentId)?.name ?? 'Unassigned'}</p></div>
          <div><p className="text-[8px] font-semibold tracking-wide text-muted">EMAIL</p><p className="mt-1 break-all text-[10px] text-ink">{selectedMember.email}</p></div>
          <div><p className="text-[8px] font-semibold tracking-wide text-muted">PHONE</p><p className="mt-1 text-[10px] text-ink">{selectedMember.phone}</p></div>
          <div><p className="text-[8px] font-semibold tracking-wide text-muted">SHIFT / STATUS</p><p className="mt-1 text-[10px] text-ink">{selectedMember.shift} · {selectedMember.status}</p></div>
        </div>
      </aside>}

      {showDepartmentForm && <DepartmentForm onClose={() => setShowDepartmentForm(false)} onSave={saveDepartment} saving={saving} error={actionError} />}
      {showAddForm && <StaffForm departments={departments} onClose={() => setShowAddForm(false)} onSave={(draft) => { void saveStaff(draft) }} saving={saving} error={actionError} />}
      {editingMember && <StaffForm member={editingMember} departments={departments} onClose={() => setEditingMember(null)} onSave={(draft) => { void saveStaff(draft, editingMember) }} saving={saving} error={actionError} />}
    </section>
  )
}