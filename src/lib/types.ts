/* =============================================================================
   GLORYBELLE — API Types
   Matches the Django REST API response shapes
   ============================================================================= */

// ── Catalog ──

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  parent: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface ProductImage {
  id: number;
  image: string;
  image_alt: string | null;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  metal: 'gold' | 'rose' | 'silver';
  metal_display: string;
  size: string;
  sku: string;
  price: string;
  price_override: string | null;
  stock_quantity: number;
  available_stock: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price: string;
  metal: string;
  metal_display: string;
  gem: string;
  gem_display: string;
  purity: string;
  category: Category;
  is_active: boolean;
  is_featured: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  primary_image: ProductImage | null;
  available_metals: string[];
}

export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  base_price: string;
  metal: string;
  metal_display: string;
  gem: string;
  gem_display: string;
  category_name: string;
  category_slug: string;
  is_featured: boolean;
  primary_image: string | null;
  hover_image: string | null;
  available_metals: string[];
  min_price: string;
}

// ── Pagination ──

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface PublicHeroImage {
  id: number;
  image_url: string;
  alt_text: string;
  sort_order: number;
}

export interface PublicInstagramImage {
  image_url: string;
  alt_text: string;
}

export interface PublicInstagramGrid {
  link: string;
  images: PublicInstagramImage[];
}

export interface PublicTestimonial {
  id: number;
  name: string;
  quote: string;
  photo_url: string;
}

// ── Cart ──

export interface CartItem {
  id: number;
  variant: ProductVariant & {
    product_name: string;
    product_slug: string;
    /** Optional image URL — backend's CartItemSerializer may include it. If absent, the UI falls back to /products/{slug}.jpg */
    image_url?: string;
  };
  quantity: number;
  line_total: string;
  reservation_expires_at: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
  item_count: number;
}

// ── Orders ──

export interface OrderItem {
  id: number;
  product_name: string;
  variant_info: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  // Present when the backend serializer returns the detailed item shape
  variant_metal_display?: string;
  variant_size?: string;
  sku?: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  total: string;
  email: string;
  items: OrderItem[];
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
  // Present when the backend serializer returns the detailed order shape
  status_display?: string;
  /** The order LIST endpoint returns item_count instead of items. */
  item_count?: number;
  discount_percent?: string;
  discount_amount?: string;
  has_discount?: boolean;
  subtotal?: string;
  shipping_cost?: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_line1?: string;
  shipping_line2?: string;
  shipping_province?: string;
}

// ── Auth ──

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Address {
  id: number;
  first_name: string;
  last_name: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// ── Wishlist ──

export interface WishlistItem {
  id: number;
  product: ProductListItem;
  created_at: string;
}

// ── Reviews ──

export interface Review {
  id: number;
  user_name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  created_at: string;
}

// ── Payments ──

/** Response of POST /api/checkout/ — order + Stripe PaymentIntent in one call. */
export interface CheckoutResponse {
  order: Order;
  client_secret: string;
  payment_intent_id: string;
  idempotent_replay?: boolean;
}

export interface FirstPurchaseDiscount {
  eligible: boolean;
  percent: string;
  message: string;
}

export type EnquiryTopic = 'prodotto' | 'ordine' | 'atelier' | 'altro';
export type AtelierType = 'anelli' | 'collane' | 'orecchini';

export interface EnquirySubmission {
  name: string;
  email: string;
  topic: EnquiryTopic;
  message: string;
  atelier_type?: AtelierType;
  website?: string;
}

export interface EnquirySubmissionResponse {
  message: string;
}