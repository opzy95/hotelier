import diningImage from '../img/Container (6).png'
import wellnessImage from '../img/Container (7).png'
import yachtImage from '../img/Container (8).png'

export const hotelExperiences = [
  {
    id: 'dining',
    group: 'Gastronomy',
    image: diningImage,
    alt: 'An intimate candlelit dinner at Opzy',
    category: 'RESTAURANT OPZY LAGOS',
    title: 'Fine Dining',
    description: 'Signature Afro-Fusion meets Michelin-inspired culinary theater. Fresh Atlantic catch prepared over open olive-wood embers with a 600-label private cellar.',
    highlights: ['Seasonal Afro-Fusion tasting menus', 'Private waterfront dining', 'Curated 600-label wine cellar'],
  },
  {
    id: 'wellness',
    group: 'Wellness',
    image: wellnessImage,
    alt: 'The sanctuary spa pool surrounded by greenery',
    category: 'THE SANCTUARY SPA',
    title: 'Wellness & Relaxation',
    description: 'Traditional holistic spa rituals, restorative eucalyptus steam suites, and warm travertine plunge pools to replenish physical vitality and peace.',
    highlights: ['Restorative spa rituals', 'Eucalyptus steam suites', 'Heated travertine plunge pools'],
  },
  {
    id: 'lagoon',
    group: 'Lagoon Life',
    image: yachtImage,
    alt: 'A private yacht cruising the Lagos lagoon at sunset',
    category: 'LAGOON FLEET & CLUB',
    title: 'Lagoon & Lifestyle',
    description: 'Private yacht excursions across the tranquil Lagos Lagoon, sunrise yoga on floating teak pavilions, and an equipment-curated vitality gymnasium.',
    highlights: ['Private yacht excursions', 'Sunrise yoga on the water', 'Personalized fitness sessions'],
  },
]