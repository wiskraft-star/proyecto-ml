// This file should be placed in the /api directory for Vercel deployment.
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch payments from Mercado Pago (simplified example)
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateTo.getDate() - 30); // Default to last 30 days

    const paymentsUrl = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&begin_date=${dateFrom.toISOString()}&end_date=${dateTo.toISOString()}`;
    
    const paymentsResponse = await fetch(paymentsUrl, {
        headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });

    if (!paymentsResponse.ok) {
        throw new Error(`Failed to fetch payments from Mercado Pago: ${await paymentsResponse.text()}`);
    }
    const paymentsData = await paymentsResponse.json();

    // 2. Map and Upsert data
    let insertedCount = 0;
    
    if (paymentsData.results && paymentsData.results.length > 0) {
        // Fix: Convert numeric payment_id and order_id from API to strings to match the 'Payment' type.
        const paymentRecords = paymentsData.results.map((p: any) => ({
            mp_payment_id: p.id.toString(),
            seller_id: p.collector_id, // Assuming collector_id is the seller
            paid_at: p.date_approved || p.date_created,
            gross_amount: p.transaction_amount,
            fees_amount: p.fee_details.reduce((sum: number, fee: any) => sum + fee.amount, 0),
            net_amount: p.transaction_details.net_received_amount,
            order_id: p.order?.id ? p.order.id.toString() : null,
            economic_id: p.external_reference, // Often used for order correlation
            source_raw: p,
        }));

        const { error, count } = await supabaseAdmin
          .from('payments')
          .upsert(paymentRecords, { onConflict: 'seller_id, mp_payment_id' });
        
        if (error) throw error;
        insertedCount = count || 0;
    }

    return res.status(200).json({ inserted: insertedCount, updated: 0, errors: [] });
  } catch (error: any) {
    console.error('Error in /api/sync-payments:', error);
    return res.status(500).json({ message: error.message });
  }
}