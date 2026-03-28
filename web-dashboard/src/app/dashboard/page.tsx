'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import {
  Sun,
  Sunset,
  Moon,
  LayoutDashboard,
  Sprout,
  Lock,
} from 'lucide-react';
import FarmSummaryStrip from '@/components/dashboard/FarmSummaryStrip';
import ImmediateActionBar from '@/components/dashboard/ImmediateActionBar';
import MarketIntelligence from '@/components/dashboard/MarketIntelligence';

export default function DashboardPage() {
  const { t } = useTranslation();
  const [userName, setUserName] = useState('');
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return { text: t('goodMorning', 'Good Morning'), icon: <Sun size={28} className="greeting-icon morning" /> };
    } else if (hour < 17) {
      return { text: t('goodAfternoon', 'Good Afternoon'), icon: <Sun size={28} className="greeting-icon afternoon" /> };
    } else {
      return { text: t('goodEvening', 'Good Evening'), icon: <Moon size={28} className="greeting-icon evening" /> };
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata) {
        const firstName = user.user_metadata.first_name || user.user_metadata.name || '';
        setUserName(firstName);
      }
    };
    fetchUser();
  }, []);

  const greeting = getGreeting();

  return (
    <div>
      {/* Farm Summary Strip — flush to page-content edges */}
      <div style={{ margin: 'calc(-1 * var(--space-xl)) calc(-1 * var(--space-xl)) var(--space-lg) calc(-1 * var(--space-xl))' }}>
        <FarmSummaryStrip />
      </div>

      {/* Greeting Banner */}
      <div className="greeting-banner">
        <div className="greeting-content">
          {greeting.icon}
          <div>
            <h2 className="greeting-text">
              {greeting.text}{userName ? ', ' : ''}<span className="greeting-name">{userName}</span> 👋
            </h2>
            <p className="greeting-subtext">
              {t('dashboardSubtitle', "Here's what's happening with your farm today")}
            </p>
          </div>
        </div>
      </div>

      {/* Zone 1 — Immediate Actions */}
      <ImmediateActionBar />

      {/* Zone 2 — Market Intelligence */}
      <MarketIntelligence />

      {/* Zone 3 — Farm & Inventory (Placeholder) */}
      <div className="animate-in stagger-3" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🌱 Farm & Inventory</h2>
        </div>
        <div className="grid-2">
          <div className="card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)',
            border: '1.5px dashed var(--color-border)', background: 'var(--color-bg-secondary)',
          }}>
            <Sprout size={32} color="var(--color-primary)" style={{ opacity: 0.5, marginBottom: 12 }} />
            <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: 6 }}>Crop Lifecycle Tracker</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Visual progress bars for your active crops (Sowing → Harvest).
            </p>
            <span className="badge badge-success" style={{ marginTop: 12 }}>Phase 1.4</span>
          </div>

          <div className="card" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: 'var(--space-2xl) var(--space-xl)',
            border: '1.5px dashed var(--color-border)', background: 'var(--color-bg-secondary)',
          }}>
            <LayoutDashboard size={32} color="var(--color-info)" style={{ opacity: 0.5, marginBottom: 12 }} />
            <h4 style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-primary)', marginBottom: 6 }}>Active Marketplace Bids</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Review, Accept, or Counter offers on your listings.
            </p>
            <span className="badge badge-info" style={{ marginTop: 12 }}>Phase 1.5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
