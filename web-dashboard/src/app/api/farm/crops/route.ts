import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Unauthenticated Fallback
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch active crops for this farmer
    const { data: farmerCrops, error } = await supabase
      .from('f_farmer_crops')
      .select(`
        farmer_crop_id,
        plot_label,
        sowing_date,
        c_crops(crop_name_en, avg_cycle_days, lifecycle_stages)
      `)
      .eq('user_id', user.id)
      .eq('status', 'ACTIVE')
      .order('sowing_date', { ascending: true });

    if (error) throw error;

    // 3. Process growth stages and calculate progress
    const today = new Date();
    
    const processedCrops = (farmerCrops || []).map(fc => {
      const sowingDate = new Date(fc.sowing_date);
      const cropInfo = fc.c_crops as any;
      const cycleDays = cropInfo?.avg_cycle_days || 100; // default 100 days
      const rawStages = cropInfo?.lifecycle_stages || [];
      
      const diffTime = Math.abs(today.getTime() - sowingDate.getTime());
      const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let progressPct = Math.round((daysElapsed / cycleDays) * 100);
      progressPct = Math.min(100, Math.max(0, progressPct)); // cap 0-100

      // Map progress % to a specific stage
      let currentStageStr = 'Growing';
      if (rawStages.length > 0) {
        const matchingStage = rawStages.find((s: any) => progressPct >= s.start_pct && progressPct <= s.end_pct);
        if (matchingStage) {
          currentStageStr = matchingStage.stage;
        } else if (progressPct > 95) {
            currentStageStr = 'Ready for Harvest';
        }
      }

      // Determine bar color. Green normally, Amber towards harvest, Red if overdue
      let statusColor = 'var(--color-success)'; // active/healthy
      if (progressPct >= 85 && progressPct < 100) {
        statusColor = 'var(--color-warning)'; // nearing harvest
      } else if (progressPct >= 100) {
        statusColor = 'var(--color-danger)'; // immediate action needed
      }

      return {
        id: fc.farmer_crop_id,
        plot: fc.plot_label,
        crop_name: cropInfo?.crop_name_en || 'Unknown Crop',
        days_elapsed: daysElapsed,
        cycle_days: cycleDays,
        progress_pct: progressPct,
        current_stage: currentStageStr,
        status_color: statusColor,
      };
    });

    return NextResponse.json(processedCrops, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Failed to fetch farmer crops:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}
