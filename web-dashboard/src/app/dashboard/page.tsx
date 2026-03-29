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
import SellHoldIndicator from '@/components/dashboard/SellHoldIndicator';
import CropLifecycleTracker from '@/components/dashboard/CropLifecycleTracker';
import ActiveBidsPanel from '@/components/dashboard/ActiveBidsPanel';

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

      {/* Zone 2 — AI Recommendations */}
      <SellHoldIndicator />

      {/* Zone 3 — Farm & Inventory (Placeholder) */}
      <div className="animate-in stagger-3" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="section-header" style={{ marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🌱 Farm & Inventory</h2>
        </div>
        <div className="grid-2">
          <CropLifecycleTracker />

          <ActiveBidsPanel />
        </div>
      </div>
    </div>
  );
}
