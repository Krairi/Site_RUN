export interface UserProfile {
  id: string;
  email: string;
}

export interface Product {
  id: number;
  name: string;
  category?: string;
  unit?: string;
  created_at?: string;
}

export interface StockItem {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  threshold: number;
  product?: Product;
}

export interface Receipt {
  id: number;
  user_id: string;
  store_name: string;
  total_amount: number;
  date: string;
  created_at: string;
}

export interface ReceiptItem {
  id: number;
  receipt_id: number;
  product_id: number;
  quantity: number;
  price_unit: number;
}

export interface ConsumptionLog {
  id: number;
  user_id: string;
  product_id: number;
  quantity: number;
  date: string;
  product?: Product;
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  features: string[];
}

export interface Subscription {
  id: number;
  user_id: string;
  plan_id: number;
  status: 'active' | 'trial' | 'cancelled';
  plan?: Plan;
}
