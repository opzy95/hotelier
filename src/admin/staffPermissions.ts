export const receptionistPermissionOptions = [
  { value: 'reservations.view', label: 'View reservations' },
  { value: 'reservations.create', label: 'Create reservations and walk-in bookings' },
  { value: 'guests.view', label: 'Look up guest records' },
  { value: 'guests.create', label: 'Create guest records' },
  { value: 'reservations.check_in', label: 'Check guests in' },
  { value: 'reservations.check_out', label: 'Check guests out' },
  { value: 'rooms.availability.view', label: 'View room availability' },
  { value: 'payments.walk_in.create', label: 'Record payments on reservations and walk-ins' },
] as const

export type ReceptionistPermission = typeof receptionistPermissionOptions[number]['value']

export const defaultReceptionistPermissions: ReceptionistPermission[] =
  receptionistPermissionOptions.map(({ value }) => value)
