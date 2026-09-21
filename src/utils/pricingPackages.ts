import { Room } from '../types';

export interface RoomPackage {
  id: string;
  name: string;
  hours: number;
  badge?: string;
  tagline: string;
  discountPercent: number;
  totalPrice: number;
  effectiveHourlyRate: number;
  standardPrice: number;
  savings: number;
  perks: string[];
  popular?: boolean;
}

/**
 * Generates curated hourly party packages for a given room.
 * Turns raw hourly rates into high-value tiered celebration packages.
 */
export function getRoomHourlyPackages(room: Room): RoomPackage[] {
  const rate = room.pricePerHour;

  return [
    {
      id: 'pkg-2h',
      name: 'Starter Bash',
      hours: 2,
      badge: 'Starter Pass',
      tagline: 'Ideal for intimate gatherings, happy hours & pre-games',
      discountPercent: 0,
      standardPrice: rate * 2,
      totalPrice: rate * 2,
      effectiveHourlyRate: rate,
      savings: 0,
      perks: [
        'Full private room access (2 Hours)',
        'HD surround sound & mood lighting',
        'Lounge seating up to full guest capacity',
        'Party Media Vault upload access for all guests',
        'Post-event standard cleanup included',
      ],
      popular: false,
    },
    {
      id: 'pkg-3h',
      name: 'Prime Celebration',
      hours: 3,
      badge: '★ Most Popular',
      tagline: 'Peak celebration duration for birthdays, milestones & parties',
      discountPercent: 5,
      standardPrice: rate * 3,
      totalPrice: Math.round(rate * 3 * 0.95),
      effectiveHourlyRate: Math.round((rate * 3 * 0.95) / 3),
      savings: Math.round(rate * 3 * 0.05),
      perks: [
        'Extended private celebration (3 Hours)',
        '5% Package Discount included',
        'Dynamic party laser presets & DJ booth ready',
        'Dual wireless microphones setup',
        'Priority sound check & AUX / Bluetooth pairing',
      ],
      popular: true,
    },
    {
      id: 'pkg-4h',
      name: 'Night Owl Rave',
      hours: 4,
      badge: 'Extended Fest',
      tagline: 'For squads who want an extended DJ bash and dance session',
      discountPercent: 10,
      standardPrice: rate * 4,
      totalPrice: Math.round(rate * 4 * 0.90),
      effectiveHourlyRate: Math.round((rate * 4 * 0.90) / 4),
      savings: Math.round(rate * 4 * 0.10),
      perks: [
        'Full 4-Hour marathon celebration',
        '10% Package Discount included',
        'High-intensity strobe & smoke FX synchronized',
        'Dual microphone / karaoke gear ready',
        'Complimentary ice bins & party cooler station',
      ],
      popular: false,
    },
    {
      id: 'pkg-6h',
      name: 'All-Night Extravaganza',
      hours: 6,
      badge: '👑 Ultimate Premium',
      tagline: 'The complete takeover for epic celebrations and afterparties',
      discountPercent: 15,
      standardPrice: rate * 6,
      totalPrice: Math.round(rate * 6 * 0.85),
      effectiveHourlyRate: Math.round((rate * 6 * 0.85) / 6),
      savings: Math.round(rate * 6 * 0.15),
      perks: [
        '6 Hours total venue takeover',
        '15% Maximum Package Discount',
        'Dedicated concierge & audio equipment specialist on call',
        'Full Event Vault hosting with ultra-high resolution',
        'Complete setup, sound engineer & clean-up included',
      ],
      popular: false,
    },
  ];
}

/**
 * Calculates custom hours pricing with tiered scale
 */
export function calculateCustomHours(room: Room, hours: number) {
  const rate = room.pricePerHour;
  let discount = 0;
  if (hours >= 6) discount = 0.15;
  else if (hours >= 4) discount = 0.10;
  else if (hours >= 3) discount = 0.05;

  const standardPrice = rate * hours;
  const totalPrice = Math.round(standardPrice * (1 - discount));
  const savings = standardPrice - totalPrice;

  return {
    hours,
    totalPrice,
    standardPrice,
    savings,
    discountPercent: discount * 100,
  };
}

