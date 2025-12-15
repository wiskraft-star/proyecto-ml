// This file should be placed in the /api directory for Vercel deployment.
// Note: Vercel serverless functions do not support ES Modules by default in the same way as the browser.
// We'll write this in a way that's compatible with Vercel's Node.js runtime.
// In a local `vercel dev` environment, you might need a `package.json` with `type: "commonjs"`.
// For this project setup, we will assume a modern Node runtime on Vercel.

import { createClient } from '@supabase/supabase-js';

// This function would be the Vercel Serverless Function handler.
// In a real project, the Request/Response types would come from '@vercel/node' or a similar package.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Initialize Admin Supabase Client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // TODO: Add authentication check here to ensure only logged-in users can trigger a sync.
    // const { data: { user } } = await supabase.auth.getUser(req.headers.authorization);
    // if (!user) return res.status(401).json({ message: 'Unauthorized' });
    
    // For now, we'll proceed without auth check as this is a prototype evolution.

    // 2. Refresh Mercado Libre Token (A real implementation would cache this)
    const tokenResponse = await fetch('https://api.mercadolibre.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: process.env.ML_CLIENT_ID!,
            client_secret: process.env.ML_CLIENT_SECRET!,
            refresh_token: process.env.ML_REFRESH_TOKEN!
        })
    });

    if (!tokenResponse.ok) {
        throw new Error('Failed to refresh Mercado Libre token');
    }
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const sellerId = tokenData.user_id; // or from env

    // 3. Fetch orders from Mercado Libre (simplified example)
    // A real implementation needs pagination.
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateTo.getDate() - 30); // Default to last 30 days

    const ordersUrl = `https://api.mercadolibre.com/orders/search?seller=${sellerId}&order.date_created.from=${dateFrom.toISOString()}&order.date_created.to=${dateTo.toISOString()}`;
    
    const ordersResponse = await fetch(ordersUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders from Mercado Libre');
    }
    const ordersData = await ordersResponse.json();

    // 4. Map and Upsert data to Supabase
    let insertedCount = 0;
    let updatedCount = 0;

    if (ordersData.results && ordersData.results.length > 0) {
      for (const order of ordersData.results) {
        // Fix: Convert numeric order_id and pack_id from API to strings to match the 'Sale' type.
        const saleRecord = {
          economic_id: order.id.toString(), // Use order_id as economic_id
          order_id: order.id.toString(),
          pack_id: order.pack_id ? order.pack_id.toString() : null,
          sold_at: order.date_created,
          status: order.status,
          seller_id: sellerId,
          source_raw: order,
        };

        const { error: upsertError, count } = await supabaseAdmin
          .from('sales')
          .upsert(saleRecord, { onConflict: 'seller_id, order_id', ignoreDuplicates: false });
        
        if (upsertError) throw upsertError;

        // This is a simplified count. A real upsert returns the data, not a reliable count of insert/update.
        // We can infer based on whether the record existed before. For now, let's assume new ones are inserted.
        if (count) {
             insertedCount++;
        }
       
        // TODO: Upsert sale_items
      }
    }


    return res.status(200).json({ inserted: insertedCount, updated: updatedCount, errors: [] });
  } catch (error: any) {
    console.error('Error in /api/sync-sales:', error);
    return res.status(500).json({ message: error.message });
  }
}