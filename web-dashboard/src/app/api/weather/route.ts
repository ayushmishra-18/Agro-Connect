import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let lat = 18.5204; // Pune fallback
    let lon = 73.8567; // Pune fallback
    let userCrops: string[] = ['Tomato', 'Wheat']; // Demo Fallback

    // If authenticated, attempt to fetch user crops & location
    if (user) {
      // Fetch coordinates (assuming stored in metadata or profile table ideally)
      // Since u_farmer_profile may or may not have structured lat/lon ready, 
      // we perform a robust check.
      const { data: profile } = await supabase
        .from('u_users')
        .select('latitude, longitude')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.latitude && profile?.longitude) {
        lat = profile.latitude;
        lon = profile.longitude;
      }

      // Fetch ACTIVE crops from f_farmer_crops
      const { data: cropsList } = await supabase
        .from('f_farmer_crops')
        .select('c_crops!inner(crop_name_en)')
        .eq('user_id', user.id)
        .eq('status', 'ACTIVE');
      
      if (cropsList && cropsList.length > 0) {
        userCrops = cropsList.map((c: any) => c.c_crops.crop_name_en);
      }
    }

    // Call Open-Meteo
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon + "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&hourly=temperature_2m,relative_humidity_2m,precipitation,soil_moisture_0_to_7cm&daily=temperature_2m_min&timezone=Asia%2FKolkata";
    const mRes = await fetch(url, { cache: 'no-store' });
    if (!mRes.ok) throw new Error("Open-Meteo fetch failed");
    const mData = await mRes.json();

    // Parse weather logic
    const currentTemp = mData.current.temperature_2m;
    const currentHumidity = mData.current.relative_humidity_2m;
    const currentWind = mData.current.wind_speed_10m;
    
    // Arrays for next 24 hours
    const next24Precip = mData.hourly.precipitation.slice(0, 24);
    const next3hPrecipSum = next24Precip.slice(0, 3).reduce((a: number, b: number) => a + (b || 0), 0);
    const next24hPrecipSum = next24Precip.reduce((a: number, b: number) => a + (b || 0), 0);
    const soilMoisture = (mData.hourly.soil_moisture_0_to_7cm[0] || 0.3) * 100; // rough % conversion
    const tempMin = mData.daily.temperature_2m_min[0] || currentTemp;

    // Evaluate rule conditions
    const w = {
      precipitation_next_3h: next3hPrecipSum,
      precipitation_next_24h: next24hPrecipSum,
      humidity: currentHumidity,
      temp: currentTemp,
      temp_min: tempMin,
      soil_moisture: soilMoisture
    };

    const rules = [
      {
        condition: (w: any) => w.precipitation_next_3h > 5,
        crops: ['ALL'],
        alert: 'Heavy rain expected. Delay pesticide and fertilizer application.',
        urgency: 'HIGH'
      },
      {
        condition: (w: any) => w.humidity > 80 && w.temp > 22,
        crops: ['Tomato', 'Potato', 'Grapes', 'Onion'],
        alert: 'High humidity + warmth: elevated blight and fungal risk today.',
        urgency: 'HIGH'
      },
      {
        condition: (w: any) => w.temp_min < 5,
        crops: ['Banana', 'Papaya', 'Sugarcane'],
        alert: 'Frost risk tonight. Consider covering young plants.',
        urgency: 'CRITICAL'
      },
      {
        condition: (w: any) => w.soil_moisture < 30 && w.precipitation_next_24h < 2,
        crops: ['ALL'],
        alert: 'Dry conditions ahead. Schedule irrigation today.',
        urgency: 'MEDIUM'
      }
    ];

    // Filter rules
    const activeAlerts: any[] = [];
    for (const rule of rules) {
      if (rule.condition(w)) {
        // Crop intersection check
        const appliesToAll = rule.crops.includes('ALL');
        const overlap = rule.crops.some(c => userCrops.some((uc: string) => uc.toLowerCase().includes(c.toLowerCase())));
        if (appliesToAll || overlap) {
          activeAlerts.push({
            alert: rule.alert,
            urgency: rule.urgency,
            related_crops: appliesToAll ? 'General' : rule.crops.filter(c => userCrops.some((uc: string) => uc.toLowerCase().includes(c.toLowerCase()))).join(', ')
          });
        }
      }
    }

    // Build hourly forecast arrays (next 24 hours)
    const hourlyTemp = mData.hourly.temperature_2m.slice(0, 24);
    const hourlyHumidity = mData.hourly.relative_humidity_2m.slice(0, 24);
    const hourlyPrecip = mData.hourly.precipitation.slice(0, 24);
    const hourlyTimes = mData.hourly.time ? mData.hourly.time.slice(0, 24) : [];

    // Default payload structure
    const payload = {
      current: {
        temp: currentTemp,
        humidity: currentHumidity,
        wind: currentWind,
        rain_chance: next24hPrecipSum > 0 ? (next24hPrecipSum > 5 ? 90 : 40) : 0,
        irrigation_suggestion: next24hPrecipSum > 2 ? 'Skip — rain expected' : (soilMoisture < 30 ? 'Irrigate today' : 'Optimal moisture'),
        soil_moisture: Math.round(soilMoisture),
        temp_min: Math.round(tempMin),
        precip_24h: Math.round(next24hPrecipSum * 10) / 10,
      },
      location: lat === 18.5204 ? 'Pune (Default)' : 'Your Farm',
      alerts: activeAlerts,
      hourly: {
        time: hourlyTimes,
        temperature: hourlyTemp,
        humidity: hourlyHumidity,
        precipitation: hourlyPrecip,
      }
    };

    // If completely clear weather, append a default ALL clear message
    if (activeAlerts.length === 0) {
      activeAlerts.push({
        alert: 'Weather conditions are stable for all currently tracked crops.',
        urgency: 'MEDIUM',
        related_crops: 'General'
      });
    }

    return NextResponse.json(payload, { status: 200 });

  } catch (error) {
    console.error('Weather fetching failed:', error);
    // Silent Fallback to dummy data
    return NextResponse.json({
      current: {
        temp: 32,
        humidity: 45,
        wind: 12,
        rain_chance: 0,
        irrigation_suggestion: 'Irrigate today'
      },
      location: 'Pune (Mocked)',
      alerts: [
        {
          alert: 'Dry conditions ahead. Schedule irrigation today.',
          urgency: 'MEDIUM',
          related_crops: 'General'
        }
      ]
    }, { status: 200 });
  }
}
