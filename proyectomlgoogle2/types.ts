
export type Page = 'metrics' | 'sales' | 'payments' | 'cogs' | 'supplies';

export interface Sale {
  id: number;
  economic_id: string;
  order_id: string | null;
  pack_id: string | null;
  sold_at: string;
  status: string;
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  sale_id: number;
  sku: string;
  title: string;
  quantity: number;
}

export interface Payment {
  id: number;
  mp_payment_id: string;
  economic_id: string | null;
  order_id: string | null;
  pack_id: string | null;
  paid_at: string;
  gross_amount: number;
  fees_amount: number;
  net_amount: number;
}

export interface SkuCost {
  id: number;
  sku: string;
  unit_cost: number;
  seller_id: number;
}

export interface Supply {
  id: number;
  name: string;
  unit_cost: number;
  seller_id: number;
}

export interface SupplyRecipeLine {
  id: number;
  supply_id: number;
  supply_name?: string; // For display purposes
  qty_per_sale: number;
  seller_id: number;
}

export interface SaleMargin {
  sale_id: number;
  sold_at: string;
  status: string;
  economic_id: string;
  order_id: string | null;
  pack_id: string | null;
  net_amount: number | null;
  cogs: number | null;
  supplies: number | null;
  margin: number | null;
  items: SaleItem[];
}

export interface SyncResult {
  inserted: number;
  updated: number;
  itemsInserted?: number;
  errors: string[];
}

export interface Kpi {
    title: string;
    value: string;
    change?: string;
    changeType?: 'increase' | 'decrease';
}
