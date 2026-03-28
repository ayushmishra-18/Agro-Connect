'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  TrendingDown,
  MapPin,
  Minus,
  Sprout,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface CropPrice {
  crop_id: number;
  crop_name: string;
  latest_price: number;
  prev_price: number;
  change_pct: number;
}

interface PriceHistory {
  date: string;
  price: number;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function MarketIntelligence() {
  const { t } = useTranslation();
  const [cropPrices, setCropPrices] = useState<CropPrice[]>([]);
  const [totalMandis, setTotalMandis] = useState(0);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [localMandi, setLocalMandi] = useState<{ id: number; name: string }>({ id: 47, name: 'Delhi' });
  const [primaryCrop, setPrimaryCrop] = useState<{ id: number; name: string }>({ id: 1, name: 'Wheat' });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadData(pos.coords.latitude, pos.coords.longitude),
        () => loadData()
      );
    } else {
      loadData();
    }
  }, []);

  async function loadData(userLat?: number, userLon?: number) {
    try {
      let targetMandi = { id: 47, name: 'Delhi' };
      
      if (userLat && userLon) {
        const { data: mandis } = await supabase.from('c_mandis').select('mandi_id, mandi_name, latitude, longitude');
        if (mandis && mandis.length > 0) {
          let nearest = mandis[0];
          let minDist = getDistance(userLat, userLon, nearest.latitude, nearest.longitude);
          for (const m of mandis) {
            const d = getDistance(userLat, userLon, m.latitude, m.longitude);
            if (d < minDist) {
              minDist = d;
              nearest = m;
            }
          }
          targetMandi = { id: nearest.mandi_id, name: nearest.mandi_name };
        }
      }
      setLocalMandi(targetMandi);

      const { data: recentPrices } = await supabase
        .from('p_daily_market_prices')
        .select('crop_id, c_crops(crop_name_en)')
        .eq('mandi_id', targetMandi.id)
        .order('date', { ascending: false })
        .limit(200);

      let localCrops: { id: number; name: string }[] = [];
      if (recentPrices && recentPrices.length > 0) {
        const uniqueCropMap = new Map();
        for (const row of recentPrices) {
          if (!uniqueCropMap.has(row.crop_id)) {
            const cropData = row.c_crops as any;
            uniqueCropMap.set(row.crop_id, cropData?.crop_name_en || 'Unknown');
          }
        }
        localCrops = Array.from(uniqueCropMap.entries()).slice(0, 6).map(([id, name]) => ({ id, name }));
      }

      if (localCrops.length === 0) {
        const { data: crops } = await supabase
          .from('c_crops')
          .select('crop_id, crop_name_en')
          .in('crop_id', [1, 2, 7, 8, 9, 4]);
        localCrops = crops ? crops.map(c => ({ id: c.crop_id, name: c.crop_name_en })) : [];
      }

      const mainCrop = localCrops[0] || { id: 1, name: 'Wheat' };
      setPrimaryCrop(mainCrop);

      const pricePromises = localCrops.map(async (crop) => {
        const { data: latest } = await supabase
          .from('p_daily_market_prices')
          .select('price_per_quintal, date')
          .eq('crop_id', crop.id)
          .eq('mandi_id', targetMandi.id)
          .order('date', { ascending: false })
          .limit(2);

        const latestPrice = latest?.[0]?.price_per_quintal || 0;
        const prevPrice = latest?.[1]?.price_per_quintal || latestPrice;
        const changePct = prevPrice > 0 ? ((latestPrice - prevPrice) / prevPrice) * 100 : 0;

        return {
          crop_id: crop.id,
          crop_name: crop.name,
          latest_price: latestPrice,
          prev_price: prevPrice,
          change_pct: Math.round(changePct * 100) / 100,
        };
      });
      const prices = await Promise.all(pricePromises);
      setCropPrices(prices);

      const { count } = await supabase.from('c_mandis').select('*', { count: 'exact', head: true });
      setTotalMandis(count || 0);

      const { data: histData } = await supabase
        .from('p_daily_market_prices')
        .select('date, price_per_quintal')
        .eq('crop_id', mainCrop.id)
        .eq('mandi_id', targetMandi.id)
        .order('date', { ascending: true })
        .limit(30);

      if (histData) {
        setPriceHistory(histData.map(d => ({
          date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          price: d.price_per_quintal,
        })));
      }
    } catch (err) {
      console.error('Market intelligence load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const cropEmoji = (id: number) => {
    const map: Record<number, string> = { 1: '🌾', 2: '🍚', 4: '🫘', 7: '🧅', 8: '🍅', 9: '🥔' };
    return map[id] || '🌿';
  };

  if (loading) {
    return (
      <div className="animate-in stagger-2" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📊 Market Intelligence</h2>
        </div>
        <div className="grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)' }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: '80%', height: 28 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in stagger-2" style={{ marginBottom: 'var(--space-xl)' }}>
      <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📊 Market Intelligence</h2>
      </div>

      {/* Stat Cards Row */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <div className="stat-icon green"><Sprout size={24} /></div>
          <div className="stat-info">
            <h4>{t('cropsTracked', 'Crops Tracked')}</h4>
            <div className="stat-value">{cropPrices.length}</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> {t('activePredictions', 'Active predictions')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><IndianRupee size={24} /></div>
          <div className="stat-info">
            <h4>{primaryCrop.name} (Avg)</h4>
            <div className="stat-value">
              ₹{cropPrices.find(c => c.crop_id === primaryCrop.id)?.latest_price?.toLocaleString('en-IN') || '—'}
            </div>
            {(() => {
              const main = cropPrices.find(c => c.crop_id === primaryCrop.id);
              if (!main) return null;
              return (
                <div className={`stat-change ${main.change_pct >= 0 ? 'up' : 'down'}`}>
                  {main.change_pct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(main.change_pct)}%
                </div>
              );
            })()}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><MapPin size={24} /></div>
          <div className="stat-info">
            <h4>{t('marketsListed', 'Markets Listed')}</h4>
            <div className="stat-value">{totalMandis}</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> {t('acrossIndia', 'Across India')}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon brown"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <h4>Market Status</h4>
            <div className="stat-value">Live</div>
            <div className="stat-change up"><ArrowUpRight size={12} /> Real-time</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2">
        {/* Price History Chart */}
        <div className="card card-accent">
          <div className="card-header">
            <h3>📈 Price History ({primaryCrop.name} — {localMandi.name})</h3>
            <Link href="/dashboard/predictions" className="btn btn-sm btn-outline">
              {t('viewAll', 'View All')}
            </Link>
          </div>
          <div className="card-body" style={{ padding: 'var(--space-md) var(--space-lg) var(--space-lg)' }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}/qtl`, 'Price']}
                />
                <Area type="monotone" dataKey="price" stroke="#059669" strokeWidth={2.5} fill="url(#colorPrice)" dot={false} activeDot={{ r: 5, fill: '#059669', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Mandi Board */}
        <div className="card">
          <div className="card-header">
            <h3>💰 Live Mandi Board</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th style={{ textAlign: 'right' }}>Latest (₹/qtl)</th>
                  <th style={{ textAlign: 'right' }}>Change</th>
                  <th style={{ textAlign: 'center' }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {cropPrices.map((cp) => (
                  <tr key={cp.crop_id}>
                    <td style={{ fontWeight: 500 }}>
                      <span style={{ marginRight: 6 }}>{cropEmoji(cp.crop_id)}</span>
                      {cp.crop_name}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>₹{cp.latest_price.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={cp.change_pct >= 0 ? 'trend-up' : 'trend-down'} style={{ fontWeight: 600 }}>
                        {cp.change_pct >= 0 ? '+' : ''}{cp.change_pct}%
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {cp.change_pct > 0.5
                        ? <TrendingUp size={16} color="var(--color-success)" />
                        : cp.change_pct < -0.5
                        ? <TrendingDown size={16} color="var(--color-danger)" />
                        : <Minus size={16} color="var(--color-text-tertiary)" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
