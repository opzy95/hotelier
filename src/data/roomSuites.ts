import { Bath, BedDouble, ConciergeBell, LockKeyhole, Sparkles, Waves, Wifi } from 'lucide-react'
import deluxeImage from '../img/Background (16).png'
import executiveImage from '../img/Background (17).png'
import presidentialImage from '../img/Background (18).png'

export const roomSuites = [
  {
    id: 'deluxe',
    name: 'Deluxe Room',
    fullName: 'Deluxe Lagoon Room',
    category: 'DELUXE ENCLAVE',
    tier: 'Deluxe Rooms',
    price: '₦380,000',
    priceValue: 380000,
    image: deluxeImage,
    imageAlt: 'Deluxe lagoon room with a private balcony and waterfront views',
    badge: 'LAGOON HARBOR FACING',
    description: 'Harmonious proportions bathed in natural daylight with bespoke teak lounge chairs, floor-to-ceiling soundproof acoustics, and tranquil panoramic views of Lagos Lagoon.',
    details: [
      { icon: Waves, label: '45 sqm' },
      { icon: BedDouble, label: '1 King Bed' },
      { icon: ConciergeBell, label: 'Max 2 Guests' },
      { icon: LockKeyhole, label: 'Lagoon Balcony' },
    ],
    amenities: [
      { icon: Bath, label: 'Rain Shower' },
      { icon: Wifi, label: 'Starlink WiFi' },
      { icon: Sparkles, label: 'Nespresso Bar' },
      { icon: ConciergeBell, label: '24/7 Sommelier' },
    ],
  },
  {
    id: 'executive',
    name: 'Executive Suite',
    fullName: 'Executive Lagoon Suite',
    category: 'EXECUTIVE TIER',
    tier: 'Executive Suites',
    price: '₦620,000',
    priceValue: 620000,
    image: executiveImage,
    imageAlt: 'Executive lagoon suite with separate sitting area and water views',
    badge: 'CORNER PANORAMA',
    description: 'Generous spatial division between entertaining lounge and restorative sleeping quarters, complemented by an oversized soaking tub overlooking sunset horizons.',
    details: [
      { icon: Waves, label: '78 sqm' },
      { icon: BedDouble, label: '1 Super King Bed' },
      { icon: ConciergeBell, label: 'Max 3 Guests' },
      { icon: ConciergeBell, label: 'Separate Salon' },
    ],
    amenities: [
      { icon: Sparkles, label: 'Dedicated Butler' },
      { icon: Bath, label: 'Soaking Tub' },
      { icon: LockKeyhole, label: 'Walk-in Wardrobe' },
      { icon: Waves, label: 'Lagoon Terrace' },
    ],
  },
  {
    id: 'presidential',
    name: 'Presidential Suite',
    fullName: 'Presidential Sanctuary',
    category: 'PRESIDENTIAL SANCTUARY',
    tier: 'Presidential Sanctuary',
    price: '₦1,450,000',
    priceValue: 1450000,
    image: presidentialImage,
    imageAlt: 'Presidential suite with private infinity pool above the Lagos Lagoon',
    badge: 'TOP FLOOR APEX',
    description: 'The pinnacle of discretion, with private keyed elevator entry, alfresco temperature-moderated plunge pool, dual primary bedrooms, and a dedicated private chef.',
    details: [
      { icon: Waves, label: '160 sqm' },
      { icon: BedDouble, label: '2 Master Kings' },
      { icon: ConciergeBell, label: 'Max 4 Guests' },
      { icon: Waves, label: 'Plunge Pool' },
    ],
    amenities: [
      { icon: Waves, label: 'Heated Pool' },
      { icon: LockKeyhole, label: 'Private Lift' },
      { icon: ConciergeBell, label: 'Private Chef' },
      { icon: Sparkles, label: 'Private Lagoon Slip' },
    ],
  },
]