export type UUID = string;

// Tables in schema `app` (manually typed).

export type Sale = {
  id: UUID;
  seller_id: number;
  economic_id: string;
  order_id: string | null;
  pack_id: string | null;
  sold_at: string; // ISO timestamptz
  status: string;
  source_raw: unknown;
  created_at: string;
  updated_at: string;
};

export type SaleItem = {
  id: UUID;
  seller_id: number;
  sale_id: UUID;
  sku: string;
  title: string | null;
  qty: number;
  source_raw: unknown;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: UUID;
  seller_id: number;
  mp_payment_id: string;
  economic_id: string | null;
  order_id: string | null;
  pack_id: string | null;
  paid_at: string | null;
  gross_amount: string | null; // numeric
  fees_amount: string | null; // numeric
  net_amount: string; // numeric
  source_raw: unknown;
  created_at: string;
  updated_at: string;
};

export type SkuCost = {
  seller_id: number;
  sku: string;
  unit_cost: string; // numeric
  created_at: string;
  updated_at: string;
};

export type Supply = {
  id: UUID;
  seller_id: number;
  name: string;
  unit_cost: string; // numeric
  created_at: string;
  updated_at: string;
};

export type SupplyRecipeLine = {
  id: UUID;
  seller_id: number;
  supply_id: UUID;
  qty_per_sale: string; // numeric
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  seller_id: number;
  ml_site_id: string;
  created_at: string;
  updated_at: string;
};

// View: app.v_sale_margin
export type SaleMarginRow = {
  seller_id: number;
  sale_id: UUID;
  economic_id: string;
  order_id: string | null;
  pack_id: string | null;
  sold_at: string;
  status: string;
  net_amount: string | null;
  cogs: string | null;
  supplies: string | null;
  margin: string | null;
};