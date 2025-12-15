export type MlOrderSearchResponse = {
  results?: MlOrder[];
  paging?: { total?: number; limit?: number; offset?: number };
  // Some variants might use 'orders' (defensive)
  orders?: MlOrder[];
};

export type MlOrder = {
  id: number | string;
  status?: string;
  pack_id?: number | string | null;
  date_created?: string;
  date_closed?: string | null;
  order_items?: Array<{
    quantity?: number;
    item?: {
      id?: string;
      title?: string;
      seller_sku?: string | null;
    };
  }>;
};

export type MlOAuthTokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  user_id?: number;
};
