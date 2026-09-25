export interface Room {
  id: string;
  name: string;
  theme: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  pictures: string[];
  videoUrl: string;
  amenities: string[];
  soundLightingSpecs: string;
  active: boolean;
  featured?: boolean;
  minHours?: number;
}

export interface AddOnItem {
  id: string;
  name: string;
  category: 'balloons' | 'music' | 'lighting' | 'food' | 'entertainment';
  price: number;
  icon?: string;
  imageUrl?: string;
  description: string;
  defaultSelected?: boolean;
}

export interface SelectedAddOn {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  eventName: string;
  roomId: string;
  roomName: string;
  roomImage: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g., "18:00 - 21:00"
  durationHours: number;
  guestsCount: number;
  basePrice: number;
  addOnsTotal: number;
  discount: number;
  finalPrice: number;
  pointsEarned?: number;
  pointsUsed?: number;
  addOns: SelectedAddOn[];
  status: 'confirmed' | 'checked-in' | 'completed' | 'cancelled';
  notes?: string;
  shareCode: string;
  createdAt: string;
  updatedAt?: string;
}

export interface VaultMedia {
  id: string;
  bookingId?: string;
  folderId?: string;
  eventName: string;
  mediaType: 'image' | 'video';
  url: string;
  title: string;
  caption?: string;
  uploadedByUid: string;
  uploadedByName: string;
  likesCount: number;
  createdAt: string;
}

export interface EventFolder {
  id: string;
  userId?: string;
  name: string;
  date: string; // YYYY-MM-DD
  description: string;
  coverImage?: string;
  shareCode?: string;
  mediaCount?: number;
  createdAt: string;
}

export type DashboardTab = 'bookings' | 'vault';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  eventType?: string;
  eventDate?: string;
  guestsEstimated?: number;
  message: string;
  status: 'new' | 'contacted' | 'resolved';
  createdAt: string;
}

export interface VenueSettings {
  id?: string;
  whatsappNumber: string;
  businessName: string;
  supportEmail: string;
  venueAddress: string;
  gstin?: string;
  invoiceNotes?: string;
  updatedAt?: string;
}

export type AppView = 'home' | 'room-detail' | 'booking' | 'dashboard' | 'admin' | 'auth' | 'about' | 'contact' | 'mem-vault' | 'profile';
