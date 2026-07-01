// src/types.ts

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
  _count?: {
    phones: number;
  };
}

export interface Category {
  id: string;
  name: string;
  isHidden: boolean;
  orderIndex: number;
  _count?: {
    phones: number;
  };
}

export interface PhoneImage {
  id: string;
  phoneId: string;
  url: string;
  orderIndex: number;
}

export interface PhoneVariant {
  id: string;
  phoneId: string;
  color: string;
  storage: string;
  ram: string;
  priceModifier: number;
  stock: number;
}

export interface Review {
  id: string;
  phoneId: string;
  userName: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface Phone {
  id: string;
  name: string;
  brandId: string;
  brand?: Brand;
  categoryId: string;
  category?: Category;
  model: string;
  price: number;
  discount: number; // e.g. 10 for 10%
  stock: number;
  description: string;
  warranty: string;
  isFeatured: boolean;
  isFlashSale: boolean;
  videoUrl?: string;
  images: PhoneImage[];
  variants: PhoneVariant[];
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  phoneId: string;
  variantId?: string;
  name: string;
  color?: string;
  storage?: string;
  ram?: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  fullName: string;
  phoneNumber: string;
  altPhoneNumber?: string;
  email?: string;
  region: string;
  city: string;
  subCity: string;
  woreda: string;
  houseNumber?: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: "chapa" | "cod" | "bank_transfer";
  deliveryFee: number;
  total: number;
  status: "Pending" | "Confirmed" | "Preparing" | "Ready" | "Shipped" | "Delivered" | "Cancelled";
  couponCode?: string;
  discountApplied: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  expirationDate: string;
  usageLimit: number;
  usageCount: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
  author: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: "new_order" | "low_stock" | "contact_message";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface WebsiteSettings {
  storeName?: string;
  logoText?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  telegram?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  deliveryFee?: string;
  deliveryAreas?: string;
  warrantyInfo?: string;
  paymentMethods?: string; // JSON array string
  businessHours?: string;
  officeAddress?: string;
}

// Shopping Cart Interface (local storage)
export interface CartItem {
  phoneId: string;
  phone: Phone;
  variantId?: string; // optional variant
  selectedVariant?: PhoneVariant;
  quantity: number;
}
