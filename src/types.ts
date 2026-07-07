/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CatalogItem {
  id: string;
  supplierId: string;
  title: string;
  category: string;
  code: string; // SKU
  price: number;
  compatibleWith: string; // compatibility model (e.g., Scania R450, Volvo FH540)
  description: string;
  image: string; // URL or placeholder style
  photos?: string[]; // Up to 2 photos of the item
  niche?: 'pesados' | 'passeio' | 'motos';
}

export interface Supplier {
  id: string;
  name: string;
  specialty: string;
  category: 'pecas' | 'mecanica' | 'postos' | 'pneus' | 'socorro';
  distance: number; // in km
  rating: number; // 1-5 stars
  reviewsCount: number;
  isOnline: boolean;
  contactPhone: string;
  whatsappNumber: string;
  address: string;
  isVerified: boolean;
  isFoundingPartner: boolean;
  niche?: 'pesados' | 'passeio' | 'motos';
}

export interface Message {
  id: string;
  sender: 'trucker' | 'supplier';
  text: string;
  timestamp: string; // HH:MM
  image?: string;
  isOffer?: boolean;
  offerPrice?: number;
  offerItem?: string;
}

export interface Chat {
  id: string;
  supplierId: string;
  supplierName: string;
  lastMessage: string;
  unreadCount: number;
  timestamp: string;
  messages: Message[];
  isOnline: boolean;
}

export interface TruckProfile {
  brand: string;
  model: string;
  year: number;
  plate: string;
  currentKm: number;
  engineType: string;
  lastOilChangeKm: number;
  lastTireChangeKm: number;
  lastBrakeChangeKm: number;
}

export interface SOSRequest {
  id: string;
  type: string; // "Pneu Furado", "Motor Fervendo", "Problema Elétrico", "Guincho", "Falta de Freio"
  description: string;
  status: 'searching' | 'accepted' | 'completed';
  matchedSupplierId?: string;
  matchedSupplierName?: string;
  etaMinutes?: number;
  timestamp: string;
}

export interface OrderStats {
  views: number;
  clicks: number;
  quotesCount: number;
  salesClosed: number;
}

export interface Seller {
  id: string;
  supplierId: string;
  name: string;
  email: string;
  phone: string;
  isAuthorized: boolean;
  registeredAt: string;
}

export interface Review {
  id: string;
  targetId: string; // The ID of the rated entity (e.g. supplier's supplierId, or trucker's phone/name)
  targetName: string; // Name of the entity being rated (e.g., Tietê Diesel, Roberto Motorista)
  targetType: 'supplier' | 'trucker'; // Who is being rated
  reviewerName: string; // Name of the reviewer
  reviewerRole: 'trucker' | 'supplier' | 'seller'; // Role of the reviewer
  rating: number; // 1 to 5 stars
  comment: string; // description or feedback
  timestamp: string; // ISO Date String
}


