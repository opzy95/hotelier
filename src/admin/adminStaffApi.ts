import { apiRequest } from '../api'
import type { Department, StaffDraft, StaffMember, StaffStatus } from './adminStaffData'

type ApiRecord = Record<string, unknown>

export type DepartmentDraft = Omit<Department, 'id'>

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(record: ApiRecord, field: string) {
  const value = record[field]
  if (typeof value !== 'string') {
    throw new Error(`The hotel API returned a staff record with an invalid ${field}.`)
  }
  return value
}

function requiredStringField(record: ApiRecord, field: string) {
  const value = stringField(record, field)
  if (!value.trim()) {
    throw new Error(`The hotel API returned a staff record with an empty ${field}.`)
  }
  return value
}

function recordId(value: unknown) {
  if (typeof value === 'string' && value) return value
  if (!isRecord(value)) return undefined
  const id = value.id ?? value._id
  return typeof id === 'string' && id ? id : undefined
}

function validateRecords(values: unknown[], key: string) {
  return values.map((value) => {
    if (!isRecord(value)) throw new Error(`The hotel API returned an invalid ${key} record.`)
    return value
  })
}

function recordsFrom(payload: unknown, key: string): ApiRecord[] {
  if (Array.isArray(payload)) return validateRecords(payload, key)
  if (!isRecord(payload)) throw new Error(`The hotel API returned an invalid ${key} list.`)
  if (Array.isArray(payload[key])) return validateRecords(payload[key], key)
  if (Array.isArray(payload.data)) return validateRecords(payload.data, key)
  if (isRecord(payload.data) && Array.isArray(payload.data[key])) return validateRecords(payload.data[key], key)
  throw new Error(`The hotel API returned an invalid ${key} list.`)
}

function recordFrom(payload: unknown, keys: string[]) {
  if (!isRecord(payload)) throw new Error('The hotel API returned an invalid staff record.')
  for (const key of keys) {
    if (isRecord(payload[key])) return payload[key]
  }
  if (isRecord(payload.data)) {
    for (const key of keys) {
      if (isRecord(payload.data[key])) return payload.data[key]
    }
    return payload.data
  }
  return payload
}

function normalizeDepartment(value: unknown): Department {
  if (!isRecord(value)) throw new Error('The hotel API returned an invalid department.')
  const id = recordId(value)
  if (!id) throw new Error('A department returned by the hotel API is missing its ID.')
  return {
    id,
    name: requiredStringField(value, 'name'),
    shortName: requiredStringField(value, 'shortName'),
    description: typeof value.description === 'string' ? value.description : '',
    lead: typeof value.lead === 'string' ? value.lead : '',
  }
}

function normalizeStaffStatus(value: string): StaffStatus {
  const status = value.trim().toLowerCase().replaceAll('_', ' ')
  if (status === 'on duty') return 'On Duty'
  if (status === 'off duty') return 'Off Duty'
  if (status === 'on leave') return 'On Leave'
  throw new Error(`The hotel API returned an unsupported staff status: ${value}.`)
}

function normalizeStaffMember(value: unknown): StaffMember {
  if (!isRecord(value)) throw new Error('The hotel API returned an invalid staff member.')
  const id = recordId(value)
  const departmentId = recordId(value.departmentId ?? value.department)
  if (!id) throw new Error('A staff member returned by the hotel API is missing its ID.')
  if (!departmentId) throw new Error('A staff member returned by the hotel API is missing its department ID.')

  return {
    id,
    name: requiredStringField(value, 'name'),
    email: requiredStringField(value, 'email'),
    phone: requiredStringField(value, 'phone'),
    role: requiredStringField(value, 'role'),
    departmentId,
    shift: requiredStringField(value, 'shift'),
    status: normalizeStaffStatus(requiredStringField(value, 'status')),
    joinedAt: typeof value.joinedAt === 'string' ? value.joinedAt : requiredStringField(value, 'createdAt'),
  }
}

function hotelPath(hotelId: string) {
  return `/hotels/${encodeURIComponent(hotelId)}`
}

export async function fetchDepartments(hotelId: string): Promise<Department[]> {
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/departments`)
  return recordsFrom(payload, 'departments').map(normalizeDepartment)
}

export async function createDepartment(hotelId: string, draft: DepartmentDraft): Promise<Department> {
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/departments`, {
    method: 'POST',
    body: JSON.stringify(draft),
  })
  return normalizeDepartment(recordFrom(payload, ['department']))
}

export async function fetchStaff(hotelId: string): Promise<StaffMember[]> {
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/staff`)
  return recordsFrom(payload, 'staff').map(normalizeStaffMember)
}

export async function createStaff(hotelId: string, draft: StaffDraft): Promise<StaffMember> {
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/staff`, {
    method: 'POST',
    body: JSON.stringify({
      ...draft,
      status: draft.status.toLowerCase().replaceAll(' ', '_'),
    }),
  })
  return normalizeStaffMember(recordFrom(payload, ['staffMember', 'staff']))
}

export async function updateStaff(hotelId: string, staffId: string, draft: StaffDraft): Promise<StaffMember> {
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/staff/${encodeURIComponent(staffId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...draft,
      status: draft.status.toLowerCase().replaceAll(' ', '_'),
    }),
  })
  return normalizeStaffMember(recordFrom(payload, ['staffMember', 'staff']))
}
