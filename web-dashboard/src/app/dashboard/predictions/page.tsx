'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight,
  AlertCircle, CheckCircle, BarChart3, CalendarDays,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine, BarChart, Bar, Legend,
} from 'recharts';

interface Crop {
  crop_id: number;
  crop_name_en: string;
}

interface Mandi {
  mandi_id: number;
  mandi_name: string;
  state_code: string;
}

interface Prediction {
  forecast_day_index: number;
  forecast_date: string;
  predicted_price: number;
  confidence_lower: number | null;
  confidence_upper: number | null;
}

interface PricePoint {
  date: string;
  price: number;
}

export default function PredictionsPage() {
  const supabase = createClient();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<number>(1);
  const [selectedMandi, setSelectedMandi] = useState<number>(47);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [historyData, setHistoryData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [predictionMeta, setPredictionMeta] = useState<any>(null);

  useEffect(() => {
    loadCropsAndMandis();
  }, []);

  useEffect(() => {
    if (selectedCrop && selectedMandi) {
      loadPredictions();
    }
  }, [selectedCrop, selectedMandi]);

  async function loadCropsAndMandis() {
    const [{ data: cropData }, { data: mandiData }] = await Promise.all([
      supabase.from('c_crops').select('crop_id, crop_name_en').order('crop_id'),
      supabase.from('c_mandis').select('mandi_id, mandi_name, state_code').order('mandi_name'),
    ]);
    setCrops(cropData || []);
    setMandis(mandiData || []);
  }

  async function loadPredictions() {
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      // Fire-and-forget background sync to ensure fresh data
      fetch(`${supabaseUrl}/functions/v1/sync-mandi-prices`, { method: 'POST' }).catch(() => {});

      let resultMeta = null;
      let cachedPredictions = [];

      // Call the Edge Function for fresh prediction
      const response = await fetch(`${supabaseUrl}/functions/v1/predict-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop_id: selectedCrop, mandi_id: selectedMandi }),
      });

      if (response.ok) {
        const result = await response.json();
        setPredictions(result.predictions || []);
        resultMeta = result;
        setPredictionMeta(result);
      } else {
        // Fallback: load from cached predictions
        const { data } = await supabase
          .from('p_prediction_outputs')
          .select('*')
          .eq('crop_id', selectedCrop)
          .eq('mandi_id', selectedMandi)
          .order('forecast_day_index')
          .limit(7);
        cachedPredictions = data || [];
        setPredictions(cachedPredictions);
      }

      // Load historical prices (last 30 days)
      const { data: histData } = await supabase
        .from('p_daily_market_prices')
        .select('date, price_per_quintal')
        .eq('crop_id', selectedCrop)
        .eq('mandi_id', selectedMandi)
        .order('date', { ascending: true })
        .limit(30);

      if (histData && histData.length > 0) {
        // Reverse to chronological order for charts
        const chronologicalData = [...histData].reverse();
        
        setHistoryData(chronologicalData.map(d => ({
          date: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          price: d.price_per_quintal,
        })));

        // If Edge Function failed, compute stats locally from historical data
        if (!resultMeta && histData.length >= 7) {
          const prices = histData.map(d => d.price_per_quintal).reverse(); // chronological
          
          const ma7 = prices.slice(-7).reduce((a, b) => a + b, 0) / 7;
          const ma14 = prices.slice(-14).reduce((a, b) => a + b, 0) / Math.min(14, prices.length);
          
          let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
          const n = Math.min(14, prices.length);
          const recentPrices = prices.slice(-n);
          for (let i = 0; i < n; i++) {
            sumX += i; sumY += recentPrices[i]; sumXY += i * recentPrices[i]; sumXX += i * i;
          }
          const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
          const trendDirection = slope > 1 ? 'UP' : slope < -1 ? 'DOWN' : 'STABLE';
          
          const mean = sumY / n;
          const stdDev = Math.sqrt(recentPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / n);
          const cv = stdDev / mean;
          const confidenceScore = Math.min(95, Math.max(60, Math.round((1 - (cv * 10)) * 100)));

          // Find peak from cached predictions
          let bestDay = 1;
          let bestPrice = 0;
          let bestDate = '';
          
          if (cachedPredictions && cachedPredictions.length > 0) {
             cachedPredictions.forEach((p: any) => {
               if (p.predicted_price > bestPrice) {
                 bestPrice = p.predicted_price;
                 bestDay = p.forecast_day_index;
                 bestDate = p.forecast_date;
               }
             });
          }

          setPredictionMeta({
            confidence_score: confidenceScore,
            trend_direction: trendDirection,
            sell_window: bestPrice > 0 ? {
              recommended_day: bestDay,
              recommended_date: bestDate,
              predicted_peak_price: bestPrice,
              reason: trendDirection === 'UP' ? 'Prices are trending upward. Consider waiting for the peak.' : 'Prices are stable or declining. Evaluate your holding capacity.'
            } : null,
            historical_summary: {
              last_price: prices[prices.length - 1],
              ma_7day: Math.round(ma7 * 100) / 100,
              ma_14day: Math.round(ma14 * 100) / 100,
              daily_trend: Math.round(slope * 100) / 100,
              volatility: Math.round(stdDev * 100) / 100,
            }
          });
        }
      } else {
        setHistoryData([]);
      }
    } catch (err) {
      console.error('Prediction load error:', err);
    } finally {
      setLoading(false);
    }
  }

  const cropName = crops.find(c => c.crop_id === selectedCrop)?.crop_name_en || 'Crop';
  const mandiName = mandis.find(m => m.mandi_id === selectedMandi)?.mandi_name || 'Market';

  const confidenceScore = predictionMeta?.confidence_score || 85;
  const trendDirection = predictionMeta?.trend_direction || 'STABLE';
  const sellWindow = predictionMeta?.sell_window;
  const historicalSummary = predictionMeta?.historical_summary;

  const confidenceLevel = confidenceScore >= 80 ? 'high' : confidenceScore >= 65 ? 'medium' : 'low';

  // Chart data combining history + predictions
  const chartData = [
    ...historyData.slice(-14).map(h => ({ ...h, type: 'history' as const, predicted: null as number | null, lower: null as number | null, upper: null as number | null })),
    ...predictions.map(p => ({
      date: new Date(p.forecast_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      price: null as number | null,
      type: 'prediction' as const,
      predicted: p.predicted_price,
      lower: p.confidence_lower,
      upper: p.confidence_upper,
    })),
  ];

  return (
    <div>
      {/* Crop & Mandi Selection */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
              <label className="form-label">Select Crop</label>
              <select
                className="form-select"
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(Number(e.target.value))}
              >
                {crops.map(c => (
                  <option key={c.crop_id} value={c.crop_id}>{c.crop_name_en}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 200 }}>
              <label className="form-label">Select Mandi</label>
              <select
                className="form-select"
                value={selectedMandi}
                onChange={(e) => setSelectedMandi(Number(e.target.value))}
              >
                {mandis.map(m => (
                  <option key={m.mandi_id} value={m.mandi_id}>
                    {m.mandi_name} ({m.state_code})
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={loadPredictions}
              disabled={loading}
              style={{ height: 42 }}
            >
              <BarChart3 size={16} />
              {loading ? 'Predicting...' : 'Get Forecast'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {predictionMeta && (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <div className="stat-card animate-in stagger-1">
            <div className="stat-icon green">
              {trendDirection === 'UP' ? <TrendingUp size={24} /> : trendDirection === 'DOWN' ? <TrendingDown size={24} /> : <Minus size={24} />}
            </div>
            <div className="stat-info">
              <h4>Trend</h4>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                {trendDirection === 'UP' ? '📈 Upward' : trendDirection === 'DOWN' ? '📉 Downward' : '➡️ Stable'}
              </div>
              <div className="stat-change" style={{ color: 'var(--color-text-secondary)' }}>
                Slope: ₹{historicalSummary?.daily_trend}/day
              </div>
            </div>
          </div>

          <div className="stat-card animate-in stagger-2">
            <div className="stat-icon orange">
              <CalendarDays size={24} />
            </div>
            <div className="stat-info">
              <h4>Best Day to Sell</h4>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                Day {sellWindow?.recommended_day}
              </div>
              <div className="stat-change">
                {sellWindow?.recommended_date && new Date(sellWindow.recommended_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>

          <div className="stat-card animate-in stagger-3">
            <div className={`stat-icon ${confidenceLevel === 'high' ? 'green' : confidenceLevel === 'medium' ? 'orange' : 'brown'}`}>
              <CheckCircle size={24} />
            </div>
            <div className="stat-info">
              <h4>Confidence</h4>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                {confidenceScore}%
              </div>
              <span className={`confidence-pill confidence-${confidenceLevel}`}>
                {confidenceLevel === 'high' ? 'High' : confidenceLevel === 'medium' ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>

          <div className="stat-card animate-in stagger-4">
            <div className="stat-icon blue">
              <BarChart3 size={24} />
            </div>
            <div className="stat-info">
              <h4>Peak Price (Predicted)</h4>
              <div className="stat-value" style={{ fontSize: '1.25rem' }}>
                ₹{sellWindow?.predicted_peak_price?.toLocaleString('en-IN')}
              </div>
              <div className="stat-change" style={{ color: 'var(--color-text-secondary)' }}>
                per Quintal
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sell Recommendation */}
      {sellWindow && (
        <div className="card" style={{ marginBottom: 24, background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
          <div className="card-body" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'var(--color-primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 4 }}>
                📊 Selling Recommendation for {cropName}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-earth)' }}>
                {sellWindow.reason}{' '}
                <strong>
                  Best estimated price: ₹{sellWindow.predicted_peak_price?.toLocaleString('en-IN')}/qtl on{' '}
                  {new Date(sellWindow.recommended_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Chart */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card card-accent">
          <div className="card-header">
            <h3>📈 Historical + Predicted Prices</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1B5E20" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#689F38" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#689F38" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#757575' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#757575' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #E0E0E0', borderRadius: 10, fontSize: 12 }}
                  formatter={(value: any, name: any) => {
                    if (value === null || value === undefined) return ['-', name];
                    return [`₹${Number(value).toLocaleString('en-IN')}/qtl`, name === 'price' ? 'Historical' : 'Predicted'];
                  }}
                />
                <Area type="monotone" dataKey="price" stroke="#1B5E20" strokeWidth={2} fill="url(#colorHist)" dot={false} connectNulls={false} />
                <Area type="monotone" dataKey="predicted" stroke="#689F38" strokeWidth={2.5} fill="url(#colorPred)" dot={{ r: 4, fill: '#689F38', stroke: '#fff', strokeWidth: 2 }} strokeDasharray="6 3" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Forecast Table */}
        <div className="card card-accent">
          <div className="card-header">
            <h3>📅 7-Day Forecast — {cropName}</h3>
          </div>
          <div className="card-body" style={{ paddingTop: 0 }}>
            {predictions.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Day</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Price (₹/qtl)</th>
                    <th style={{ textAlign: 'right' }}>Range</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, i) => {
                    const isBest = sellWindow?.recommended_day === p.forecast_day_index;
                    return (
                      <tr key={p.forecast_day_index} style={isBest ? { background: 'var(--color-primary-50)' } : {}}>
                        <td>
                          <span style={{ fontWeight: 600 }}>Day {p.forecast_day_index}</span>
                          {isBest && <span className="badge badge-success" style={{ marginLeft: 6 }}>BEST</span>}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {new Date(p.forecast_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          ₹{p.predicted_price.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          {p.confidence_lower && p.confidence_upper ?
                            `₹${Math.round(p.confidence_lower).toLocaleString('en-IN')} – ₹${Math.round(p.confidence_upper).toLocaleString('en-IN')}` :
                            '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>No predictions available for this combination.<br />Try selecting a different crop or mandi.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Summary */}
      {historicalSummary && (
        <div className="card">
          <div className="card-header">
            <h3>📊 Historical Analysis — {mandiName}</h3>
          </div>
          <div className="card-body">
            <div className="grid-4">
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Last Price</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>₹{historicalSummary.last_price?.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>per Quintal</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>7-Day Avg</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>₹{historicalSummary.ma_7day?.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Moving Average</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>14-Day Avg</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>₹{historicalSummary.ma_14day?.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Moving Average</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Volatility</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '4px 0' }}>₹{historicalSummary.volatility}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>Std Deviation</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
