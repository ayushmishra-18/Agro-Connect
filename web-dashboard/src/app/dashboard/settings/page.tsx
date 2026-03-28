'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Globe, User, Sprout, MapPin, Camera, LogOut, Mail, Phone, Shield, Save, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: string;
  locationName: string;
  avatarUrl: string;
}

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState('en');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userType: 'FARMER',
    locationName: '',
    avatarUrl: '',
  });

  // Fetch user data from Supabase auth metadata
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const meta = user.user_metadata || {};
          setProfile({
            firstName: meta.first_name || '',
            lastName: meta.last_name || '',
            email: user.email || '',
            phone: meta.phone_number || '',
            userType: meta.user_type || 'FARMER',
            locationName: meta.location_name || '',
            avatarUrl: meta.avatar_url || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `avatars/${user.id}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Fallback: use local preview
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setProfile(prev => ({ ...prev, avatarUrl: dataUrl }));
          supabase.auth.updateUser({
            data: { avatar_url: dataUrl }
          });
        };
        reader.readAsDataURL(file);
      } else {
        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;
        setProfile(prev => ({ ...prev, avatarUrl: publicUrl }));
        await supabase.auth.updateUser({
          data: { avatar_url: publicUrl }
        });
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      // Fallback: use local preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setProfile(prev => ({ ...prev, avatarUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  // Save profile
  async function handleSave() {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone_number: profile.phone,
          user_type: profile.userType,
          location_name: profile.locationName,
          avatar_url: profile.avatarUrl,
        }
      });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  // Logout
  async function handleLogout() {
    setLoggingOut(true);
    // Leverage the Next.js server route to completely flush secure HTTP-only cookies
    window.location.href = '/auth/signout';
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body" style={{ padding: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 200, height: 20 }} />
              <div className="skeleton" style={{ width: 160, height: 14 }} />
            </div>
          </div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="card" style={{ marginBottom: 24 }}>
            <div className="card-body" style={{ padding: 24 }}>
              <div className="skeleton" style={{ width: '40%', height: 18, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '100%', height: 42, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '100%', height: 42 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Profile Header with Avatar */}
      <div className="settings-profile-card">
        <div className="settings-avatar-section">
          <div className="settings-avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Profile" className="settings-avatar-img" />
            ) : (
              <div className="settings-avatar-placeholder">
                <User size={40} />
              </div>
            )}
            <div className="settings-avatar-overlay">
              {uploading ? <Loader2 size={20} className="spin-animation" /> : <Camera size={20} />}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
          </div>
          <div className="settings-profile-info">
            <h2 className="settings-profile-name">
              {profile.firstName} {profile.lastName}
            </h2>
            <div className="settings-profile-meta">
              <span className={`settings-user-badge ${profile.userType === 'FARMER' ? 'farmer' : 'buyer'}`}>
                {profile.userType === 'FARMER' ? '🌾 Farmer' : '🛒 Buyer'}
              </span>
              {profile.locationName && (
                <span className="settings-location-tag">
                  <MapPin size={13} /> {profile.locationName.split(',')[0]}
                </span>
              )}
            </div>
            <p className="settings-email-display">
              <Mail size={14} /> {profile.email}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card settings-card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3><User size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Personal Information</h3>
          {!isEditing && (
            <button className="btn btn-sm btn-outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>First Name</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={profile.firstName}
                  onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                  placeholder="Enter first name"
                />
              ) : (
                <div style={{ padding: '8px 0', fontWeight: 500 }}>{profile.firstName || 'Not provided'}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Last Name</label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={profile.lastName}
                  onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                  placeholder="Enter last name"
                />
              ) : (
                <div style={{ padding: '8px 0', fontWeight: 500 }}>{profile.lastName || 'Not provided'}</div>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
                <Phone size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  className="form-input"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 XXXXX XXXXX"
                />
              ) : (
                <div style={{ padding: '8px 0', fontWeight: 500 }}>{profile.phone || 'Not provided'}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                Email Address
              </label>
              <div style={{ padding: isEditing ? '10px' : '8px 0', fontWeight: 500, background: isEditing ? 'rgba(0,0,0,0.02)' : 'transparent', borderRadius: 8, color: profile.email ? 'inherit' : 'var(--text-secondary)' }}>
                {profile.email || 'No email registered'}
                {isEditing && <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>Email cannot be changed directly</span>}
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-secondary)' }}>Account Type</label>
            {isEditing ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  className={`settings-type-btn ${profile.userType === 'FARMER' ? 'active farmer' : ''}`}
                  onClick={() => setProfile(p => ({ ...p, userType: 'FARMER' }))}
                >
                  <Sprout size={18} /> Farmer
                </button>
                <button
                  type="button"
                  className={`settings-type-btn ${profile.userType === 'BUYER' ? 'active buyer' : ''}`}
                  onClick={() => setProfile(p => ({ ...p, userType: 'BUYER' }))}
                >
                  <User size={18} /> Buyer
                </button>
              </div>
            ) : (
              <div style={{ padding: '8px 0', fontWeight: 600 }}>
                {profile.userType === 'FARMER' ? '🌾 Farmer Account' : '🛒 Buyer Account'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location & Farming Preferences */}
      <div className="card settings-card">
        <div className="card-header">
          <h3><Sprout size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Farming Preferences</h3>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
              <MapPin size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Primary Location
            </label>
            {isEditing ? (
              <input
                className="form-input"
                value={profile.locationName}
                onChange={e => setProfile(p => ({ ...p, locationName: e.target.value }))}
                placeholder="Village / District / State"
              />
            ) : (
              <div style={{ padding: '8px 0', fontWeight: 500 }}>{profile.locationName || 'Location not set'}</div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Primary Crops (select up to 3)</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Wheat', 'Rice', 'Onion', 'Tomato', 'Potato', 'Soybean', 'Cotton', 'Sugarcane'].map(crop => (
                <button
                  key={crop}
                  className="btn btn-sm btn-secondary"
                  style={{ borderRadius: 100 }}
                >
                  {crop}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Land Size</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-input" type="number" placeholder="0" style={{ maxWidth: 120 }} />
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Acres</span>
            </div>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="card settings-card">
        <div className="card-header">
          <h3><Globe size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />Language / भाषा</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { code: 'en', name: 'English', native: 'English' },
              { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
              { code: 'mr', name: 'Marathi', native: 'मराठी' },
            ].map(lang => (
              <button
                key={lang.code}
                className={`btn ${language === lang.code ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setLanguage(lang.code)}
                style={{ minWidth: 140, flexDirection: 'column', padding: '14px 20px', gap: 2 }}
              >
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>{lang.native}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{lang.name}</span>
              </button>
            ))}
          </div>
          <p style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            ⓘ Punjabi and Bengali will be available in Phase 2.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="settings-actions">
        <div className="settings-actions-left">
          {saved && (
            <div className="settings-save-success">
              <Check size={16} /> Settings saved successfully!
            </div>
          )}
        </div>
        <div className="settings-actions-right">
          <button
            className="settings-logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? <Loader2 size={18} className="spin-animation" /> : <LogOut size={18} />}
            {loggingOut ? 'Logging out...' : 'Log Out'}
          </button>
          
          {isEditing && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => setIsEditing(false)} 
                style={{ padding: '12px 20px', fontWeight: 600, borderRadius: 12 }}
              >
                Cancel
              </button>
              <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 size={18} className="spin-animation" /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
