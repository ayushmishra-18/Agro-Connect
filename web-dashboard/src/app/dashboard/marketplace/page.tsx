'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Package,
  Plus,
  Search,
  Filter,
  IndianRupee,
  Tag,
  User,
  X,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Listing {
  listing_id: number;
  seller_user_id: string;
  item_type: 'CROP' | 'EQUIPMENT';
  crop_id: number | null;
  equipment_details: string | null;
  quantity: number;
  unit_of_measure: string;
  listed_price: number;
  listing_status: string;
  created_at: string;
}

interface Crop {
  crop_id: number;
  crop_name_en: string;
}

const EMOJI_MAP: Record<number, string> = {
  1: '🌾', 2: '🍚', 3: '🌽', 4: '🌿', 5: '🫘', 6: '☕',
  7: '🧅', 8: '🍅', 9: '🥔', 10: '🌶️', 11: '🥜', 12: '🫑',
};

export default function MarketplacePage() {
  const { t } = useTranslation();
  const supabase = createClient();
  const [listings, setListings] = useState<Listing[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [showForm, setShowForm] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Live Market Price State
  const [marketPrice, setMarketPrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Form state
  const [formType, setFormType] = useState<'CROP' | 'EQUIPMENT'>('CROP');
  const [formCropId, setFormCropId] = useState(1);
  const [formQty, setFormQty] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formUnit, setFormUnit] = useState('Quintal');
  const [formEquipment, setFormEquipment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      // Try getUser first, then fall back to session
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        setCurrentUserId(user.id);
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUserId(session?.user?.id ?? null);
      }
    })();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: cropData } = await supabase.from('c_crops').select('crop_id, crop_name_en');
    if (cropData) setCrops(cropData);

    let query = supabase
      .from('m_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (tab === 'browse') {
      query = query.eq('listing_status', 'ACTIVE');
    } else if (currentUserId) {
      query = query.eq('seller_user_id', currentUserId);
    }

    const { data } = await query;
    setListings(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [tab, currentUserId]);

  // Fetch Live Market Prices dynamically when crop is changed
  useEffect(() => {
    if (!formCropId || formType !== 'CROP') {
      setMarketPrice(null);
      return;
    }

    let isMounted = true;
    (async () => {
      setLoadingPrice(true);
      const { data, error } = await supabase
        .from('p_daily_market_prices')
        .select('price_per_quintal')
        .eq('crop_id', Number(formCropId))
        .order('ingested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isMounted) {
        if (data && data.price_per_quintal) {
          setMarketPrice(data.price_per_quintal);
        } else {
          setMarketPrice(null);
        }
        setLoadingPrice(false);
      }
    })();
    return () => { isMounted = false; };
  }, [formCropId, formType]);

  const cropMap = Object.fromEntries(crops.map(c => [c.crop_id, c.crop_name_en]));

  const filtered = listings.filter(l => {
    if (!search) return true;
    const name = cropMap[l.crop_id ?? 0] ?? 'Equipment';
    return name.toLowerCase().includes(search.toLowerCase()) ||
           l.item_type.toLowerCase().includes(search.toLowerCase());
  });

  async function handleSubmit(e?: any) {
    if (e?.preventDefault) e.preventDefault();
    
    // Last-resort: re-fetch user if it wasn't loaded
    let userId = currentUserId;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      if (userId) setCurrentUserId(userId);
    }
    
    console.log('[Marketplace] handleSubmit called', { userId, formType, formCropId, formQty, formPrice, formUnit });
    if (!userId) {
      console.warn('[Marketplace] No currentUserId — aborting submit');
      alert('Not logged in. Please refresh and try again.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('m_listings').insert({
      seller_user_id: userId,
      item_type: formType,
      crop_id: formType === 'CROP' ? formCropId : null,
      equipment_details: formType === 'EQUIPMENT' ? formEquipment : null,
      quantity: Number(formQty),
      unit_of_measure: formUnit,
      listed_price: Number(formPrice),
      listing_status: 'ACTIVE',
    });
    setSubmitting(false);
    if (error) {
      console.error('Publish listing error:', error);
      alert('Failed to publish: ' + error.message);
      return;
    }
    setShowForm(false);
    setFormQty('');
    setFormPrice('');
    setFormEquipment('');
    loadData();
  }

  async function markSold(id: number) {
    await supabase.from('m_listings').update({ listing_status: 'SOLD' }).eq('listing_id', id);
    loadData();
  }

  async function deleteListing(id: number) {
    await supabase.from('m_listings').delete().eq('listing_id', id);
    loadData();
  }

  const INR = new Intl.NumberFormat('en-IN');

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>🛒 {t('marketplace', 'Marketplace')}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Buy and sell agricultural products</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> {t('sellYourProduce', 'Sell Your Produce')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '2px solid var(--border-color)' }}>
        {(['browse', 'mine'] as const).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: tab === tabKey ? 700 : 400,
              color: tab === tabKey ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderBottom: tab === tabKey ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.2s',
            }}
          >
            {tabKey === 'browse' ? t('browseListings', 'Browse All') : t('myListings', 'My Listings')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={18} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-secondary)' }} />
        <input
          type="text"
          placeholder="Search crops, equipment…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 40px',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            fontSize: 14,
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" />
          <p style={{ marginTop: 12, color: 'var(--text-secondary)' }}>Loading listings…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <Package size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto' }} />
          <h3 style={{ marginTop: 16 }}>{tab === 'browse' ? 'No listings yet' : 'You haven\'t listed anything'}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {tab === 'browse' ? 'Be the first to sell your produce!' : 'Click "Sell Your Produce" to get started'}
          </p>
        </div>
      )}

      {/* Listing Grid */}
      {!loading && filtered.length > 0 && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            🛒 {filtered.length} listing{filtered.length !== 1 ? 's' : ''} found
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(listing => {
              const cropName = cropMap[listing.crop_id ?? 0] ?? 'Equipment';
              const emoji = EMOJI_MAP[listing.crop_id ?? 0] ?? '📦';
              const isOwn = listing.seller_user_id === currentUserId;

              return (
                <div key={listing.listing_id} className="card" style={{ padding: 20, transition: 'transform 0.15s', cursor: 'default' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 32 }}>{emoji}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                          {listing.item_type === 'CROP' ? cropName : 'Equipment'}
                        </h3>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {listing.quantity} {listing.unit_of_measure}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-primary)' }}>
                        ₹{INR.format(listing.listed_price)}
                      </span>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>per {listing.unit_of_measure}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${listing.listing_status === 'ACTIVE' ? 'success' : listing.listing_status === 'SOLD' ? 'danger' : 'info'}`}>
                      {listing.listing_status}
                    </span>
                    <span className="badge">{listing.item_type}</span>

                    {isOwn && listing.listing_status === 'ACTIVE' && (
                      <>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => markSold(listing.listing_id)}
                          style={{ marginLeft: 'auto', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <CheckCircle size={14} /> Mark Sold
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => deleteListing(listing.listing_id)}
                          aria-label="Delete listing"
                          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-danger)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  {listing.item_type === 'EQUIPMENT' && listing.equipment_details && (
                    <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                      {listing.equipment_details}
                    </p>
                  )}

                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-secondary)' }}>
                    Listed {new Date(listing.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create Listing Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflow: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>📝 {t('publishListing', 'Create Listing')}</h2>
              <button 
                onClick={() => setShowForm(false)} 
                aria-label="Close modal"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Type */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>What are you selling?</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['CROP', 'EQUIPMENT'] as const).map(typeKey => (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setFormType(typeKey)}
                      className={`btn btn-sm ${formType === typeKey ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {typeKey === 'CROP' ? '🌾 ' + t('cropType', 'Crop') : '🔧 ' + t('equipmentType', 'Equipment')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop or Equipment */}
              {formType === 'CROP' ? (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('selectCrop', 'Select Crop')}</label>
                  <select
                    value={formCropId}
                    onChange={e => setFormCropId(Number(e.target.value))}
                    style={{
                      width: '100%', padding: 10, borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14,
                    }}
                  >
                    {crops.map(c => (
                      <option key={c.crop_id} value={c.crop_id}>{c.crop_name_en}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Equipment Details</label>
                  <textarea
                    value={formEquipment}
                    onChange={e => setFormEquipment(e.target.value)}
                    placeholder="e.g. Tractor, Water Pump, Sprayer..."
                    rows={2}
                    style={{
                      width: '100%', padding: 10, borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14,
                      resize: 'vertical',
                    }}
                  />
                </div>
              )}

              {/* Quantity */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('quantity', 'Quantity')}</label>
                <input
                  type="number"
                  value={formQty}
                  onChange={e => setFormQty(e.target.value)}
                  placeholder="Enter quantity"
                  required
                  min="0.01"
                  step="0.01"
                  style={{
                    width: '100%', padding: 10, borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14,
                  }}
                />
              </div>

              {/* Unit */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Unit</label>
                <select
                  value={formUnit}
                  onChange={e => setFormUnit(e.target.value)}
                  style={{
                    width: '100%', padding: 10, borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14,
                  }}
                >
                  {['Quintal', 'Kg', 'Ton', 'Piece', 'Bag'].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>{t('pricePerUnit', 'Price (₹ per unit)')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="Enter price per unit"
                    required
                    min="1"
                    step="0.01"
                    style={{
                      width: '100%', padding: '10px 10px 10px 25px', borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: 14,
                    }}
                  />
                  <span style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-secondary)' }}>₹</span>
                </div>
                {formType === 'CROP' && formCropId && (
                  <div style={{ marginTop: '8px', fontSize: '13px' }}>
                    {loadingPrice ? (
                        <span style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Loading Mandi rates...</span>
                    ) : marketPrice !== null ? (
                        <span style={{ color: '#0ea5e9', fontWeight: 500 }}>📈 Live Mandi Avg: <strong>₹{marketPrice}/Quintal</strong></span>
                    ) : (
                        <span style={{ color: 'var(--text-secondary)' }}>Market price unavailable</span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={submitting || !formQty || !formPrice}
                onClick={handleSubmit}
                style={{ marginTop: 8, padding: '12px 0', fontSize: 15, fontWeight: 700, width: '100%', cursor: 'pointer' }}
              >
                {submitting ? t('publishing', 'Publishing…') : '🚀 ' + t('publish', 'Publish Listing')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
