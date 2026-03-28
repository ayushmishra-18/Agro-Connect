'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sprout, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import Link from 'next/link';

interface SummaryData {
  activeCrops: number;
  highAlerts: number;
  tasksDue: number;
  openBids: number;
}

export default function FarmSummaryStrip() {
  const { t } = useTranslation();
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch('/api/dashboard/summary');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading || !data) {
    return (
      <div style={{
        width: '100%',
        background: 'var(--color-primary-50)',
        borderBottom: '1px solid var(--color-primary-200)',
        padding: '10px 24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '42px',
      }}>
        <div style={{ display: 'flex', gap: '24px', opacity: 0.4 }}>
          <div className="skeleton" style={{ height: 14, width: 90, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: 70, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: 110, borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 14, width: 100, borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  const items = [
    {
      href: '/dashboard',
      icon: <Sprout size={15} />,
      label: `${data.activeCrops} ${t('activeCrops', 'crops active')}`,
      color: 'var(--color-primary-dark)',
      highlight: false,
    },
    {
      href: '/dashboard/advisories',
      icon: <AlertTriangle size={15} />,
      label: `${data.highAlerts} ${t('alerts', data.highAlerts === 1 ? 'alert' : 'alerts')}`,
      color: data.highAlerts > 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)',
      highlight: data.highAlerts > 0,
    },
    {
      href: '/dashboard',
      icon: <CheckCircle size={15} />,
      label: `${data.tasksDue} ${t('tasksDueToday', data.tasksDue === 1 ? 'task due today' : 'tasks due today')}`,
      color: data.tasksDue > 0 ? 'var(--color-warning-dark)' : 'var(--color-text-secondary)',
      highlight: data.tasksDue > 0,
    },
    {
      href: '/dashboard/marketplace',
      icon: <Package size={15} />,
      label: `${data.openBids} ${t('openBids', data.openBids === 1 ? 'open bid' : 'marketplace bids')}`,
      color: data.openBids > 0 ? 'var(--color-info)' : 'var(--color-text-secondary)',
      highlight: data.openBids > 0,
    },
  ];

  return (
    <div style={{
      width: '100%',
      background: 'var(--color-primary-50)',
      borderBottom: '1px solid var(--color-primary-200)',
      padding: '10px 24px',
      overflowX: 'auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontFamily: 'var(--font-primary)',
        fontSize: '0.82rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        {items.map((item, i) => (
          <span key={i} style={{ display: 'contents' }}>
            <Link
              href={item.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                color: item.color,
                textDecoration: 'none',
                fontWeight: item.highlight ? 700 : 600,
                transition: 'opacity 0.15s',
                letterSpacing: '-0.01em',
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
            {i < items.length - 1 && (
              <span style={{
                display: 'inline-block',
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                opacity: 0.4,
                margin: '0 8px',
                flexShrink: 0,
              }} />
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
