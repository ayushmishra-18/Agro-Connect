import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Unauthenticated or Dev Mode Fallback
    if (!user) {
      return NextResponse.json([
        {
          order_item_id: 101,
          buyer_company: 'AgriCorp Procurement Ltd.',
          crop_name: 'Premium Wheat',
          quantity: 50,
          unit: 'Quintal',
          total_value_inr: 125000,
          status: 'PENDING',
          time_ago: '2 hours ago'
        },
        {
          order_item_id: 102,
          buyer_company: 'Nashik Wholesale Traders',
          crop_name: 'Red Onion Grade A',
          quantity: 20,
          unit: 'Quintal',
          total_value_inr: 45000,
          status: 'PENDING',
          time_ago: '5 hours ago'
        }
      ], { status: 200 });
    }

    // 2. Fetch active bids from marketplace
    // seller_user_id on m_listings must match authenticated user
    // m_orders.payment_status must be 'PENDING'
    const { data: bids, error } = await supabase
      .from('m_order_items')
      .select(`
        order_item_id,
        quantity,
        total_price,
        m_orders!inner (
          order_id,
          payment_status,
          created_at,
          u_users!buyer_user_id (full_name, company_name)
        ),
        m_listings!inner (
          listing_id,
          seller_user_id,
          unit_of_measure,
          c_crops (crop_name_en)
        )
      `)
      .eq('m_listings.seller_user_id', user.id)
      .eq('m_orders.payment_status', 'PENDING')
      .order('m_orders(created_at)', { ascending: false });

    if (error) throw error;

    // 3. Process and format data
    const processedBids = (bids || []).map((bid: any) => {
      const buyerInfo = bid.m_orders.u_users || {};
      const cropInfo = bid.m_listings.c_crops || {};

      const now = new Date();
      const orderDate = new Date(bid.m_orders.created_at);
      const diffHrs = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60));
      const timeStr = diffHrs < 1 ? "Just now" : diffHrs < 24 ? String(diffHrs) + " hours ago" : String(Math.floor(diffHrs/24)) + " days ago";

      return {
        order_item_id: bid.order_item_id,
        buyer_company: buyerInfo.company_name || buyerInfo.full_name || 'Verified Buyer',
        crop_name: cropInfo.crop_name_en || 'Farm Produce',
        quantity: bid.quantity,
        unit: bid.m_listings.unit_of_measure || 'Quintal',
        total_value_inr: bid.total_price,
        status: bid.m_orders.payment_status,
        time_ago: timeStr
      };
    });

    // If no real bids exist but the user IS logged in, 
    // we still return the mocked array below to ensure the UI renders for demo. 
    // In production, you would return processedBids empty.
    if (processedBids.length === 0) {
        return NextResponse.json([
          {
            order_item_id: 101,
            buyer_company: 'AgriCorp Procurement Ltd.',
            crop_name: 'Premium Wheat',
            quantity: 50,
            unit: 'Quintal',
            total_value_inr: 125000,
            status: 'PENDING',
            time_ago: '2 hours ago'
          },
          {
            order_item_id: 102,
            buyer_company: 'Nashik Wholesale Traders',
            crop_name: 'Red Onion Grade A',
            quantity: 20,
            unit: 'Quintal',
            total_value_inr: 45000,
            status: 'PENDING',
            time_ago: '5 hours ago'
          }
        ], { status: 200 });
    }

    return NextResponse.json(processedBids, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch marketplace bids (forced reload):', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
