
export enum Restaurant {
  MIDIEBI = 'მიდიები',
  SAKHINKLE = 'სახინკლე',
}

export enum UserRole {
  CHEF = 'CHEF',
  ADMIN = 'ADMIN',
}

export type Language = 'ka' | 'en' | 'ru';

export interface User {
  role: UserRole;
  restaurant?: Restaurant;
  name?: string;
}

export interface Product {
  id: string;
  name_ka: string;
  name_en: string;
  name_ru: string;
  category_ka: string;
  category_en: string;
  category_ru: string;
  defaultUnit: 'კგ' | 'ლიტრი' | 'ცალი' | 'შეკვრა';
  restaurants: Restaurant[];
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  PURCHASED = 'PURCHASED',
  UNAVAILABLE = 'UNAVAILABLE',
  FORWARDED = 'FORWARDED',
}

export interface OrderItem {
  product: Product;
  status: OrderItemStatus;
  quantity: number;
  unit: string;
  actualQuantity?: number;
  pricePerUnit?: number;
}

export interface Order {
  id: string;
  restaurant: Restaurant;
  chef: string;
  date: string; // ISO string
  items: OrderItem[];
  completionDate?: string; // ISO string
}

export interface UnavailableItem {
  // FIX: Add id property to align with Firestore document structure and resolve casting error.
  id: string;
  product: Product;
  date: string; // ISO string
  orderId: string;
  restaurant: Restaurant;
}

export interface SupplierOrderItem {
    product: Product;
    quantity: number;
    unit: string;
    restaurant: Restaurant;
    chef: string;
    supplier?: string;
}

export interface OrderedHistoryItem {
    id: string;
    date: string; // ISO string
    items: SupplierOrderItem[];
}