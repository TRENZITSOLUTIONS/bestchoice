export interface Category {
  id: number;
  name: string;
  slug: string;
  image: string;
  parent: number | null;
  children: Category[];
  product_count: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
}

export interface ProductListItem {
  id: number;
  auto_product_id: string;
  name: string;
  slug: string;
  short_description: string;
  category: string | null;
  brand: string | null;
  primary_image: string | null;
  mrp: string;
  selling_price: string;
  discount_percent: number;
  has_variants: boolean;
  in_stock: boolean;
  average_rating: number;
  review_count: number;
}

export interface ProductVariant {
  id: number;
  color: string;
  size: string;
  sku: string;
  stock: number;
  price_override: string | null;
  fabric: string;
  fit: string;
  age_group: string;
  sleeve_type: string;
  occasion: string;
  shade: string;
  volume: string;
  skin_type: string;
}

export interface ProductImage {
  id: number;
  image: string;
  thumb: string;
  small: string;
  medium: string;
  large: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductDetail {
  id: number;
  auto_product_id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category: { id: number; name: string; slug: string; parent: { id: number; name: string; slug: string } | null } | null;
  brand: Brand | null;
  images: ProductImage[];
  variants: ProductVariant[];
  highlights: { text: string }[];
  available_colors: string[];
  available_sizes: string[];
  pricing: { mrp: string; selling_price: string; discount_percent: number; gst_included: boolean };
  stock_status: { badge: 'in_stock' | 'low_stock' | 'out_of_stock'; label: string };
  gst_included: boolean;
  rating: { average: number; count: number; distribution: Record<string, number> };
  related: { similar: ProductListItem[]; recommended: ProductListItem[] };
  hide_if_out_of_stock: boolean;
  created_at: string;
  expiry_date: string | null;
  batch_number: string;
  ingredients: string;
  usage_instructions: string;
  care_instructions: string;
  compatible_devices: string;
  warranty: string;
}

export interface CartItem {
  id: number;
  product: number;
  product_name: string;
  product_slug: string;
  product_image: string | null;
  variant: number | null;
  variant_label: string;
  quantity: number;
  price: string;
  total_price: string;
}

export interface AppliedCoupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  max_discount: string | null;
  label: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: string;
  discount: string;
  /** Null when no coupon is applied, or when the applied one no longer qualifies. */
  coupon: AppliedCoupon | null;
  total: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  loyalty_points: number;
  /** Drives whether the staff dashboard is offered. The API enforces it too. */
  is_staff: boolean;
}

export interface Order {
  order_id: string;
  total: string;
  status: string;
  payment_status: string;
  delivery_type: string;
  item_count: number;
  created_at: string;
}

export interface OrderItemDetail {
  id: number;
  order: string;
  product: number | null;
  variant: number | null;
  product_snapshot: { name: string; sku: string; price: string };
  quantity: number;
  price: string;
}

export interface Refund {
  id: number;
  amount: string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'processed';
  created_at: string;
}

export interface OrderDetail {
  order_id: string;
  status: string;
  payment_status: string;
  items: OrderItemDetail[];
  subtotal: string;
  discount: string;
  total: string;
  delivery_charge: string;
  shipping_address: Record<string, string>;
  delivery_type: string;
  estimated_delivery: string | null;
  tracking: { tracking_provider: string; tracking_id: string; tracking_url: string } | null;
  refunds: Refund[];
  notes: string;
  created_at: string;
}

export interface OrderStatusHistoryEntry {
  status: string;
  note: string;
  created_at: string;
}

export interface OrderTracking {
  order_id: string;
  status: string;
  payment_status: string;
  estimated_delivery: string | null;
  tracking_provider: string;
  tracking_id: string;
  tracking_url: string;
  status_history: OrderStatusHistoryEntry[];
}

export interface LoyaltyBalance {
  points: number;
  lifetime_earned: number;
  lifetime_spent: number;
  expiring_soon: number;
  next_expiry_date: string | null;
}
