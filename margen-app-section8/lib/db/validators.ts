import { z } from "zod";

export const sellerIdSchema = z.number().int().positive();

export const skuSchema = z.string().min(1).max(120);

export const economicIdSchema = z.string().min(1).max(120);

export const moneySchema = z.number().finite().min(0);

export const qtySchema = z.number().int().positive();

export const saleUpsertSchema = z.object({
  seller_id: sellerIdSchema,
  economic_id: economicIdSchema,
  order_id: z.string().min(1).max(120).nullable().optional(),
  pack_id: z.string().min(1).max(120).nullable().optional(),
  sold_at: z.string().min(1),
  status: z.string().min(1).max(60),
  source_raw: z.any().optional(),
});

export const saleItemInsertSchema = z.object({
  seller_id: sellerIdSchema,
  sale_id: z.string().uuid(),
  sku: skuSchema,
  title: z.string().max(240).nullable().optional(),
  qty: qtySchema,
  source_raw: z.any().optional(),
});

export const paymentUpsertSchema = z.object({
  seller_id: sellerIdSchema,
  mp_payment_id: z.string().min(1).max(120),
  economic_id: z.string().max(120).nullable().optional(),
  order_id: z.string().max(120).nullable().optional(),
  pack_id: z.string().max(120).nullable().optional(),
  paid_at: z.string().nullable().optional(),
  gross_amount: z.number().finite().nullable().optional(),
  fees_amount: z.number().finite().nullable().optional(),
  net_amount: z.number().finite(),
  source_raw: z.any().optional(),
});

export const skuCostUpsertSchema = z.object({
  seller_id: sellerIdSchema,
  sku: skuSchema,
  unit_cost: moneySchema,
});

export const supplyUpsertSchema = z.object({
  seller_id: sellerIdSchema,
  name: z.string().min(1).max(160),
  unit_cost: moneySchema,
});

export const recipeLineUpsertSchema = z.object({
  seller_id: sellerIdSchema,
  supply_id: z.string().uuid(),
  qty_per_sale: z.number().finite().min(0),
});

export const settingsUpsertSchema = z.object({
  seller_id: sellerIdSchema,
  ml_site_id: z.string().min(2).max(8).default("MLA"),
});
