
import { supabase } from '../lib/supabaseClient';
import { Sale, Payment, SkuCost, Supply, SupplyRecipeLine, SaleMargin } from '../types';

// Helper to handle Supabase errors
const handleSupabaseError = (error: any, context: string) => {
  if (error) {
    console.error(`Error in ${context}:`, error);
    throw new Error(error.message);
  }
};

// --- READ OPERATIONS ---

export const getSales = async (): Promise<Sale[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select('*, sale_items(*)')
    .order('sold_at', { ascending: false });
  handleSupabaseError(error, 'getSales');
  return (data as any[]) || [];
};

export const getPayments = async (): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('paid_at', { ascending: false });
  handleSupabaseError(error, 'getPayments');
  return data || [];
};

export const getSkuCosts = async (): Promise<SkuCost[]> => {
  const { data, error } = await supabase.from('sku_costs').select('*');
  handleSupabaseError(error, 'getSkuCosts');
  return data || [];
};

export const getSupplies = async (): Promise<Supply[]> => {
  const { data, error } = await supabase.from('supplies').select('*');
  handleSupabaseError(error, 'getSupplies');
  return data || [];
};

export const getRecipe = async (): Promise<SupplyRecipeLine[]> => {
  const { data, error } = await supabase.from('supply_recipe_lines').select('*');
  handleSupabaseError(error, 'getRecipe');
  return data || [];
};

// This reads from the app.v_sale_margin view
export const getSaleMargins = async (): Promise<SaleMargin[]> => {
  // We also need to fetch sale_items separately as views don't typically join them
  const { data: margins, error: marginsError } = await supabase.from('v_sale_margin').select('*').order('sold_at', { ascending: false });
  handleSupabaseError(marginsError, 'getSaleMargins');
  
  if (!margins) return [];

  const saleIds = margins.map(m => m.sale_id);
  const { data: items, error: itemsError } = await supabase.from('sale_items').select('*').in('sale_id', saleIds);
  handleSupabaseError(itemsError, 'getSaleItemsForMargins');
  
  const itemsBySaleId = (items || []).reduce((acc, item) => {
      if (!acc[item.sale_id]) acc[item.sale_id] = [];
      acc[item.sale_id].push(item);
      return acc;
  }, {} as Record<number, any[]>);

  return margins.map(margin => ({
      ...margin,
      items: itemsBySaleId[margin.sale_id] || []
  }));
};


// --- WRITE OPERATIONS ---

export const saveSkuCost = async (skuCost: Omit<SkuCost, 'id' | 'seller_id'> & { id?: number }): Promise<SkuCost> => {
  const { data, error } = await supabase.from('sku_costs').upsert(skuCost).select();
  handleSupabaseError(error, 'saveSkuCost');
  return data![0];
};

export const deleteSkuCost = async (id: number): Promise<void> => {
  const { error } = await supabase.from('sku_costs').delete().match({ id });
  handleSupabaseError(error, 'deleteSkuCost');
};

export const saveSupply = async (supply: Omit<Supply, 'id' | 'seller_id'> & { id?: number }): Promise<Supply> => {
  const { data, error } = await supabase.from('supplies').upsert(supply).select();
  handleSupabaseError(error, 'saveSupply');
  return data![0];
};

export const deleteSupply = async (id: number): Promise<void> => {
  const { error } = await supabase.from('supplies').delete().match({ id });
  handleSupabaseError(error, 'deleteSupply');
};

export const saveRecipeLine = async (recipeLine: Omit<SupplyRecipeLine, 'id' | 'seller_id'> & { id?: number }): Promise<SupplyRecipeLine> => {
  const { data, error } = await supabase.from('supply_recipe_lines').upsert(recipeLine).select();
  handleSupabaseError(error, 'saveRecipeLine');
  return data![0];
};

export const deleteRecipeLine = async (id: number): Promise<void> => {
  const { error } = await supabase.from('supply_recipe_lines').delete().match({ id });
  handleSupabaseError(error, 'deleteRecipeLine');
};
