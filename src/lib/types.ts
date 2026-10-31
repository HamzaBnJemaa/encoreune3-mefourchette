export type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  price: number;
  salePrice: number | null;
  available: boolean;
  images: string[]; // stored file names
  createdAt: string;
  updatedAt?: string;
};

/** What the browser receives (image names already turned into URLs). */
export type PublicProduct = Omit<Product, 'images' | 'updatedAt'> & { images: string[] };

export const ORDER_STATUSES = ['new', 'confirmed', 'on_the_way', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
/** Statuses a livreur may set. */
export const COURIER_STATUSES: OrderStatus[] = ['confirmed', 'on_the_way', 'delivered', 'cancelled'];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: 'Nouvelle',
  confirmed: 'À livrer',
  on_the_way: 'En route',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export type OrderItem = { id: string; name: string; unit: string; qty: number; price: number; regularPrice: number; lineTotal: number };

export type HistoryEntry = {
  at: string;
  by: { role: 'admin' | 'courier' | 'system'; name: string; username?: string };
  from: OrderStatus;
  to: OrderStatus;
  note?: string;
};

export type CourierRef = { id: string; name: string; phone: string; username: string };

export type Order = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  status: OrderStatus;
  customer: { name: string; phone: string; address: string; note: string };
  items: OrderItem[];
  total: number;
  courier?: CourierRef | null;
  history?: HistoryEntry[];
};

export type Courier = {
  id: string;
  username: string;
  passHash: string;
  pv: number; // password version: bumping it logs the livreur out everywhere
  name: string;
  phone: string;
  profileDone: boolean;
  createdAt: string;
  lastLoginAt?: string;
};
export type PublicCourier = Omit<Courier, 'passHash' | 'pv'>;
