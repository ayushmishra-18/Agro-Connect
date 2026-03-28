import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Run all count queries in parallel
    const [
      cropsResponse,
      alertsResponse,
      tasksResponse,
      bidsResponse
    ] = await Promise.all([
      // 1. Count Active Crops
      supabase
        .from('f_farmer_crops')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'ACTIVE'),
      
      // 2. Count Unread/Active High/Critical Alerts
      supabase
        .from('a_advisories')
        .select('*', { count: 'exact', head: true })
        .in('urgency', ['HIGH', 'CRITICAL']),

      // 3. Count Pending Tasks due today or earlier
      supabase
        .from('t_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_completed', false)
        .lte('due_date', new Date().toISOString().split('T')[0]),

      // 4. Count Open bids / pending payments on listings
      supabase
        .from('m_listings')
        .select('*', { count: 'exact', head: true })
        .eq('seller_user_id', userId)
        .eq('listing_status', 'PENDING_PAYMENT')
    ]);

    return NextResponse.json({
      activeCrops: cropsResponse.count || 0,
      highAlerts: alertsResponse.count || 0,
      tasksDue: tasksResponse.count || 0,
      openBids: bidsResponse.count || 0,
    });

  } catch (err: any) {
    console.error('Error fetching dashboard summary:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
