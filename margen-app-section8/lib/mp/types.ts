// Minimal Mercado Pago types used by this app.

export type MpFeeDetail = {
  amount?: number;
  fee_payer?: string;
  type?: string;
};

export type MpPayment = {
  id: number | string;

  status?: string;
  status_detail?: string;

  date_created?: string;
  date_approved?: string;

  external_reference?: string | null;

  transaction_amount?: number; // gross
  fee_details?: MpFeeDetail[];

  transaction_details?: {
    net_received_amount?: number;
    total_paid_amount?: number;
  };

  order?: {
    id?: number | string;
    type?: string;
  };

  metadata?: Record<string, unknown>;
};

export type MpPaymentSearchResponse = {
  paging?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
  results?: MpPayment[];
};
