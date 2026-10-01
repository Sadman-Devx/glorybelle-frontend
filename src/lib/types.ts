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

// ── Cart ──

export interface CartItem {
  id: number;
  variant: ProductVariant & { product_name: string; product_slug: string };
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
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total: string;
  email: string;
  items: OrderItem[];
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  created_at: string;
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
  label: string;
  recipient_name: string;
  street_address: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
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

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
}
