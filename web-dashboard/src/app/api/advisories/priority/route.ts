import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Priority strictly by urgency Level mapping: CRITICAL > HIGH > MEDIUM > LOW
    // In SQL, we can't sort by enum easily unless it's a real ENUM, here it's varchar.
    // So we just fetch all ACTIVE advisories (for now, simply by creating_at or all)
    // and sort them in JS if small, or query explicit IN clauses.
    
    // Let's just fetch all advisories and sort them in memory because there aren't many.
    // In a real production system, you'd add a "status" or "expires_at" column.
    const { data: advisories, error } = await supabase
      .from('a_advisories')
      .select('advisory_id, title_en, title_localization, advisory_type, urgency, content_en, content_localization')
      .order('created_at', { ascending: false })
      .limit(20); // fetch recent 20

    if (error) {
      throw error;
    }

    const urgencyWeights: Record<string, number> = {
      'CRITICAL': 4,
      'HIGH': 3,
      'MEDIUM': 2,
      'LOW': 1
    };

    const sorted = (advisories || []).sort((a, b) => {
      const waitA = urgencyWeights[a.urgency] || 0;
      const waitB = urgencyWeights[b.urgency] || 0;
      return waitB - waitA;
    });

    const top3 = sorted.slice(0, 3);

    return NextResponse.json(top3);

  } catch (err: any) {
    console.error('Error fetching priority advisories:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
