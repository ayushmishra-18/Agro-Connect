'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, Flame, Clock } from 'lucide-react';

interface Advisory {
  advisory_id: number;
  title_en: string;
  advisory_type: string;
  urgency: string;
}

const URGENCY_STYLES: Record<string, { bg: string; border: string; iconColor: string }> = {
  CRITICAL: { bg: '#FFF1F0', border: '#EF4444', iconColor: '#DC2626' },
  HIGH: { bg: '#FFF7ED', border: '#F59E0B', iconColor: '#D97706' },
  MEDIUM: { bg: '#FFFBEB', border: '#FCD34D', iconColor: '#B45309' },
  LOW: { bg: '#ECFDF5', border: '#10B981', iconColor: '#059669' },
};

export default function PriorityActionsCard() {
  const { t } = useTranslation();
  const [actions, setActions] = useState<Advisory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPriority() {
      try {
        const res = await fetch('/api/advisories/priority');
        if (res.ok) {
          const data = await res.json();
          setActions(data);
        }
      } catch (err) {
        console.error('Failed to load priority actions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPriority();
  }, []);

  const getIcon = (urgency: string) => {
    const color = URGENCY_STYLES[urgency]?.iconColor || URGENCY_STYLES.LOW.iconColor;
    switch (urgency) {
      case 'CRITICAL': return <Flame size={15} color={color} />;
      case 'HIGH': return <AlertTriangle size={15} color={color} />;
      case 'MEDIUM': return <Clock size={15} color={color} />;
      default: return <CheckCircle size={15} color={color} />;
    }
  };

  return (
    <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '0.95rem' }}>
          <AlertTriangle size={17} color="#F59E0B" />
          {t('priorityActions', 'Priority Actions')}
        </h3>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: 'var(--space-md)' }}>
        {loading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 44, borderRadius: 'var(--radius-sm)' }} />
          ))
        ) : actions.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
            <CheckCircle size={28} color="var(--color-primary)" style={{ opacity: 0.4, marginBottom: 8 }} />
            <span style={{ fontSize: '0.85rem' }}>{t('noPriorityActions', 'All caught up! No urgent actions.')}</span>
          </div>
        ) : (
          actions.map((action) => {
            const style = URGENCY_STYLES[action.urgency] || URGENCY_STYLES.LOW;
            return (
              <div
                key={action.advisory_id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: style.bg,
                  borderLeft: `3px solid ${style.border}`,
                  cursor: 'pointer',
                  transition: 'box-shadow var(--transition-fast)',
                }}
              >
                <span style={{ marginTop: 2, flexShrink: 0 }}>{getIcon(action.urgency)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                    lineHeight: 1.35,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {action.title_en}
                  </p>
                  <p style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: style.iconColor,
                    margin: '3px 0 0 0',
                    opacity: 0.85,
                  }}>
                    {action.advisory_type}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
