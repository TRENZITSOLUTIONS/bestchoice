export interface Paginated<T> {
  count: number;
  page: number;
  page_size: number;
  num_pages: number;
  results: T[];
}

export interface SalesPoint {
  date: string;
  revenue: string;
  orders: number;
}

export interface DashboardStats {
  period_days: number;
  revenue_total: string;
  revenue_period: string;
  orders_total: number;
  orders_period: number;
  orders_awaiting_action: number;
  orders_by_status: Record<string, number>;
  refunds_pending: number;
  reviews_pending: number;
  products_active: number;
  products_out_of_stock: number;
  customers_total: number;
  sales_chart: SalesPoint[];
}

export interface ReportsResponse {
  period_days: number;
  top_products: {
    product_id: number | null;
    name: string;
    slug: string | null;
    units: number;
    revenue: string;
  }[];
  revenue_by_category: {
    category: string;
    slug: string | null;
    units: number;
    revenue: string;
  }[];
  by_delivery_type: {
    delivery_type: string;
    orders: number;
    revenue: string;
  }[];
}

export interface OrderListItem {
  order_id: string;
  total: string;
  status: string;
  payment_status: string;
  delivery_type: string;
  item_count: number;
  created_at: string;
}

export interface Refund {
  id: number;
  order_id: string;
  amount: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface InventoryRow {
  id: number;
  auto_product_id: string;
  name: string;
  slug: string;
  category: string | null;
  category_id: number | null;
  brand: string | null;
  brand_id: number | null;
  mrp: string;
  selling_price: string;
  total_stock: number;
  weight_g: number;
  short_description: string;
  description: string;
  is_active: boolean;
  variant_count: number;
  stock_state: 'out' | 'low' | 'ok';
}

export interface InventoryResponse extends Paginated<InventoryRow> {
  out_of_stock_count: number;
}

export interface ReviewRow {
  id: number;
  product: string;
  product_slug: string;
  user: string;
  rating: number;
  text: string;
  is_approved: boolean;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface ReviewQueueResponse extends Paginated<ReviewRow> {
  pending_count: number;
}

export interface CouponRow {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_cart_value: string;
  max_discount: string | null;
  valid_from: string;
  valid_till: string;
  usage_limit: number;
  used_count: number;
  per_user_limit: number;
  is_active: boolean;
  description: string;
}

export interface PincodeRow {
  id: number;
  pincode: string;
  city: string;
  delivery_type: string;
  estimated_days_text: string;
  store_pickup_available: boolean;
  is_active: boolean;
}

export type PincodeResponse = Paginated<PincodeRow>;

export interface DeliveryRates {
  tamil_nadu: {
    local_charge: string;
    standard_charge: string;
    free_delivery_threshold: string;
    weight_surcharge_per_500g: string;
    weight_allowance_g: number;
    estimated_days_text: string;
  };
  outside_tamil_nadu: {
    is_active: boolean;
    base_charge: string;
    free_delivery_threshold: string;
    weight_surcharge_per_500g: string;
    weight_allowance_g: number;
    estimated_days_text: string;
    cod_available: boolean;
  };
}
