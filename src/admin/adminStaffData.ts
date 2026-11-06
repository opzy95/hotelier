export type StaffStatus = 'On Duty' | 'Off Duty' | 'On Leave'

export type Department = {
  id: string
  name: string
  shortName: string
  description: string
  lead: string
}

export type StaffMember = {
  id: string
  name: string
  email: string
  phone: string
  role: string
  departmentId: string
  shift: string
  status: StaffStatus
  joinedAt: string
}

export type StaffDraft = Omit<StaffMember, 'id' | 'joinedAt'>

export const initialDepartments: Department[] = [
  { id: 'front-office', name: 'Front Office & Concierge', shortName: 'FO', description: 'Guest arrivals, reservations, and concierge services.', lead: 'Tariq Adeleke' },
  { id: 'housekeeping', name: 'Housekeeping & Laundry', shortName: 'HK', description: 'Guest room care, laundry, and room turnaround.', lead: 'Mariam Okoye' },
  { id: 'food-beverage', name: 'Food & Beverage', shortName: 'F&B', description: 'Dining, in-room service, and culinary operations.', lead: 'Chidi Eze' },
  { id: 'security', name: 'Security & Marine Operations', shortName: 'SEC', description: 'Property safety, access control, and waterfront operations.', lead: 'Ibrahim Musa' },
  { id: 'engineering', name: 'Maintenance & Engineering', shortName: 'ENG', description: 'Building systems, room maintenance, and engineering.', lead: 'Amina Bello' },
  { id: 'administration', name: 'Administration & Finance', shortName: 'ADM', description: 'People operations, finance, and executive administration.', lead: 'Tariq Adeleke' },
]

export const initialStaff: StaffMember[] = [
  { id: 'OPZY-STF-001', name: 'Tariq Adeleke', email: 'tariq.adeleke@opzyhotel.com', phone: '+234 801 555 0101', role: 'General Manager', departmentId: 'administration', shift: 'Day · 08:00–17:00', status: 'On Duty', joinedAt: '2021-04-12' },
  { id: 'OPZY-STF-002', name: 'Nneka Okafor', email: 'nneka.okafor@opzyhotel.com', phone: '+234 801 555 0102', role: 'Front Office Manager', departmentId: 'front-office', shift: 'Day · 07:00–16:00', status: 'On Duty', joinedAt: '2022-02-08' },
  { id: 'OPZY-STF-003', name: 'Samuel Adeyemi', email: 'samuel.adeyemi@opzyhotel.com', phone: '+234 801 555 0103', role: 'Guest Relations Officer', departmentId: 'front-office', shift: 'Evening · 15:00–23:00', status: 'On Duty', joinedAt: '2023-08-21' },
  { id: 'OPZY-STF-004', name: 'Mariam Okoye', email: 'mariam.okoye@opzyhotel.com', phone: '+234 801 555 0104', role: 'Housekeeping Supervisor', departmentId: 'housekeeping', shift: 'Day · 07:00–16:00', status: 'On Duty', joinedAt: '2021-11-03' },
  { id: 'OPZY-STF-005', name: 'Bisi Lawal', email: 'bisi.lawal@opzyhotel.com', phone: '+234 801 555 0105', role: 'Room Attendant', departmentId: 'housekeeping', shift: 'Day · 08:00–17:00', status: 'Off Duty', joinedAt: '2024-01-15' },
  { id: 'OPZY-STF-006', name: 'Chidi Eze', email: 'chidi.eze@opzyhotel.com', phone: '+234 801 555 0106', role: 'Restaurant Manager', departmentId: 'food-beverage', shift: 'Evening · 14:00–23:00', status: 'On Duty', joinedAt: '2022-06-27' },
  { id: 'OPZY-STF-007', name: 'Zainab Yusuf', email: 'zainab.yusuf@opzyhotel.com', phone: '+234 801 555 0107', role: 'Executive Chef', departmentId: 'food-beverage', shift: 'Day · 06:00–15:00', status: 'On Leave', joinedAt: '2020-09-10' },
  { id: 'OPZY-STF-008', name: 'Ibrahim Musa', email: 'ibrahim.musa@opzyhotel.com', phone: '+234 801 555 0108', role: 'Security Supervisor', departmentId: 'security', shift: 'Night · 22:00–07:00', status: 'On Duty', joinedAt: '2021-07-05' },
  { id: 'OPZY-STF-009', name: 'Amina Bello', email: 'amina.bello@opzyhotel.com', phone: '+234 801 555 0109', role: 'Chief Engineer', departmentId: 'engineering', shift: 'Day · 08:00–17:00', status: 'On Duty', joinedAt: '2022-10-19' },
  { id: 'OPZY-STF-010', name: 'Femi Balogun', email: 'femi.balogun@opzyhotel.com', phone: '+234 801 555 0110', role: 'Maintenance Technician', departmentId: 'engineering', shift: 'Evening · 14:00–23:00', status: 'Off Duty', joinedAt: '2024-03-11' },
  { id: 'OPZY-STF-011', name: 'Ngozi Nwosu', email: 'ngozi.nwosu@opzyhotel.com', phone: '+234 801 555 0111', role: 'Finance Officer', departmentId: 'administration', shift: 'Day · 08:00–17:00', status: 'On Duty', joinedAt: '2023-05-22' },
  { id: 'OPZY-STF-012', name: 'David Akinola', email: 'david.akinola@opzyhotel.com', phone: '+234 801 555 0112', role: 'Marine Operations Officer', departmentId: 'security', shift: 'Day · 09:00–18:00', status: 'Off Duty', joinedAt: '2023-12-04' },
]