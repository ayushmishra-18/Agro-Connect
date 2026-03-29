'use client';

import { useTranslation } from 'react-i18next';
import { Sprout, MapPin, Plus, Lock } from 'lucide-react';
import Link from 'next/link';


export default function FarmManagementPage() {
  const { t } = useTranslation();

  return (
    <div className="animate-in fade-in" style={{ padding: 'var(--space-md)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 var(--space-xs)' }}>Farm Management</h1>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>Register and track your plots and active crops.</p>
        </div>
        <button className="btn btn-primary btn-sm" disabled style={{ opacity: 0.7 }}>
          <Plus size={16} /> Add Plot
        </button>
      </div>

      <div className="grid-2">
        {/* Placeholder Crop Form Area */}
        <div className="card" style={{ 
          minHeight: 400, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'var(--color-bg-secondary)',
          border: '1.5px dashed var(--color-border)',
          textAlign: 'center',
        }}>
          <Lock size={32} color="var(--color-primary)" style={{ opacity: 0.5, marginBottom: 'var(--space-md)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 var(--space-xs)' }}>Crop Seeding Setup</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: 300, margin: '0 auto var(--space-md)' }}>
            The interface to configure plot identifiers, select crop varieties, and establish sowing dates will go here.
          </p>
          <Link href="/dashboard" className="btn btn-sm btn-ghost">
            ← Return to Dashboard
          </Link>
        </div>

        {/* Informational Panel */}
        <div className="card">
          <div className="card-header">
            <h3>Lifecycle Tracking Requirements</h3>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              In order for the Dashboard AI to accurately track your crops and issue timely reminders, you must log:
            </p>
            <ul style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', paddingLeft: 'var(--space-lg)' }}>
              <li style={{ marginBottom: 4 }}>Precise Sowing Date</li>
              <li style={{ marginBottom: 4 }}>Tested Soil Ph & Structure</li>
              <li style={{ marginBottom: 4 }}>Primary Irrigation Method</li>
              <li style={{ marginBottom: 4 }}>Target Yield Estimate</li>
            </ul>
             <div className="badge badge-warning" style={{ marginTop: 'var(--space-md)' }}>
               Phase 2 Infrastructure
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
