'use client';

import { 
  PlusCircle, 
  TrendingUp, 
  FileText, 
  ScanLine, 
  CloudSun, 
  MessagesSquare 
} from 'lucide-react';
import Link from 'next/link';

export default function QuickActionsRow() {
  const actions = [
    { label: '+ Crop', icon: PlusCircle, href: '/dashboard/farm/add-crop', color: 'var(--color-primary)' },
    { label: 'Market', icon: TrendingUp, href: '/dashboard/market', color: 'var(--color-info)' },
    { label: 'Scheme', icon: FileText, href: '/dashboard/schemes', color: 'var(--color-warning)' },
    { label: 'Disease', icon: ScanLine, href: '/dashboard/disease-scanner', color: 'var(--color-danger)' },
    { label: 'Weather', icon: CloudSun, href: '/dashboard/weather', color: 'var(--color-primary)' },
    { label: 'Expert', icon: MessagesSquare, href: '/dashboard/forum', color: 'var(--color-success)' },
  ];

  return (
    <div style={{ marginTop: 'var(--space-2xl)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-md)' }}>
        Quick Actions
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: 'var(--space-md)',
      }}>
        {actions.map((act) => {
          const IconComponent = act.icon;
          return (
            <Link 
              key={act.label} 
              href={act.href}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-lg) var(--space-sm)',
                textDecoration: 'none',
                gap: 12,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
              }}
            >
              <div style={{
                background: "var(--color-bg-secondary)",
                padding: 12,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: act.color
              }}>
                <IconComponent size={24} />
              </div>
              <span style={{ 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: 'var(--color-text-secondary)',
                textAlign: 'center'
              }}>
                {act.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
