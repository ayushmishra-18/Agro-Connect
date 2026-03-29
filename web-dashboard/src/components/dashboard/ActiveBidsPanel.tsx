'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, CheckCircle, Handshake, CornerDownRight } from 'lucide-react';
import Link from 'next/link';

interface BidData {
  order_item_id: number;
  buyer_company: string;
  crop_name: string;
  quantity: number;
  unit: string;
  total_value_inr: number;
  status: string;
  time_ago: string;
}

export default function ActiveBidsPanel() {
  const { t } = useTranslation();
  const [bids, setBids] = useState<BidData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBids() {
      try {
        const res = await fetch('/api/marketplace/my-bids');
        if (res.ok) {
          const data = await res.json();
          setBids(data);
        }
      } catch (err) {
        console.error('Failed to load marketplace bids:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBids();
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-2xl) var(--space-xl)', textAlign: 'center', background: 'var(--color-bg-secondary)' }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px' }}></div>
        <div className="skeleton" style={{ width: '40%', height: 20, margin: '0 auto 8px' }}></div>
        <div className="skeleton" style={{ width: '60%', height: 14, margin: '0 auto' }}></div>
      </div>
    );
  }

  if (bids.length === 0) {
    return (
      <div className="card" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)',
        border: '1.5px dashed var(--color-border)', background: 'var(--color-bg-secondary)',
      }}>
        <LayoutDashboard size={32} color="var(--color-text-tertiary)" style={{ marginBottom: 12 }} />
        <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
          No Active Bids
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-tertiary)', margin: '0 0 16px', lineHeight: 1.5 }}>
          Your marketplace listings currently have no pending offers.
        </p>
        <Link href="/dashboard/marketplace" className="btn btn-sm btn-ghost">
          Manage Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header" style={{ paddingBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LayoutDashboard size={20} color="var(--color-info)" />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Marketplace Bids</h3>
        </div>
        <div className="badge badge-info">{bids.length} Pending</div>
      </div>

      <div className="card-body" style={{ paddingTop: 0, paddingBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {bids.map((bid) => (
            <div key={bid.order_item_id} style={{
              padding: 'var(--space-md)',
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {bid.buyer_company}
                  </h4>
                  <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                    {bid.quantity} {bid.unit} • {bid.crop_name}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                    ₹{bid.total_value_inr.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                    {bid.time_ago}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                <button 
                  className="btn btn-sm" 
                  style={{ flex: 1, gap: 6, background: 'var(--color-success)', color: '#fff', border: 'none' }}
                  onClick={() => alert('Accepting bid & moving to escrow...')}
                >
                  <CheckCircle size={16} /> Accept
                </button>
                <button 
                  className="btn btn-sm btn-ghost"
                  style={{ flex: 1, gap: 6, border: '1px solid var(--color-border)' }}
                  onClick={() => alert('Counter-offer modal opened')}
                >
                  <Handshake size={16} /> Counter
                </button>
              </div>

            </div>
          ))}
        </div>
        
        <Link href="/dashboard/marketplace" style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginTop: 'var(--space-md)', fontSize: '0.85rem', color: 'var(--color-primary)',
          fontWeight: 500, textDecoration: 'none' 
        }}>
          View all marketplace history <CornerDownRight size={14} />
        </Link>
      </div>
    </div>
  );
}
