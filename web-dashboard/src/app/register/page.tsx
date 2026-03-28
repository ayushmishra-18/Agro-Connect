'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Wheat, User, Phone, MapPin, Loader2, AlertCircle, Mail, Lock } from 'lucide-react';
import AuthCarousel from '@/components/AuthCarousel';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    userType: 'FARMER',
  });
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getLocation = () => {
    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setLocationLoading(false);
        },
        (err) => {
          setError('Could not get location. ' + err.message);
          setLocationLoading(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phone,
          user_type: formData.userType,
          lat: location?.lat?.toString(),
          lon: location?.lon?.toString(),
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      // If we don't have email confirmation turned on, it logs them in
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left Side: Form Section */}
      <div className="auth-form-section">
        <div className="auth-form-container" style={{ maxWidth: 520 }}>
          
          <div className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon"><Wheat size={24} /></div>
              <span className="auth-logo-text">Agro-Connect</span>
            </div>
            <h1 className="auth-title">Create an Account</h1>
            <p className="auth-subtitle">
              Join the ecosystem and manage your farm operations.
            </p>
          </div>

          {error && (
            <div className="auth-error-alert">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="auth-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">First Name</label>
              <div className="input-with-icon">
                <User className="input-icon" size={18} />
                <input
                  name="firstName" type="text" required
                  value={formData.firstName} onChange={handleInputChange}
                  className="modern-input"
                  placeholder="Ram"
                />
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Last Name</label>
              <div className="input-with-icon">
                <User className="input-icon" size={18} />
                <input
                  name="lastName" type="text" required
                  value={formData.lastName} onChange={handleInputChange}
                  className="modern-input"
                  placeholder="Kumar"
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                name="email" type="email" required
                value={formData.email} onChange={handleInputChange}
                className="modern-input"
                placeholder="ram@example.com"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Phone Number</label>
              <div className="input-with-icon">
                <Phone className="input-icon" size={18} />
                <input
                  name="phone" type="tel" required
                  value={formData.phone} onChange={handleInputChange}
                  className="modern-input"
                  placeholder="+91 987654321"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  name="password" type="password" required minLength={6}
                  value={formData.password} onChange={handleInputChange}
                  className="modern-input"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
            <label className="input-label">I am registering as a:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <button
                type="button"
                onClick={() => setFormData(prev => ({...prev, userType: 'FARMER'}))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: '8px', cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: formData.userType === 'FARMER' ? 'var(--color-primary)' : 'rgba(0,0,0,0.2)',
                  border: formData.userType === 'FARMER' ? '1px solid var(--color-primary-light)' : '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontWeight: 600
                }}
              >
                <Wheat size={18} /> Farmer
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({...prev, userType: 'BUYER'}))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: '8px', cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: formData.userType === 'BUYER' ? 'var(--color-info)' : 'rgba(0,0,0,0.2)',
                  border: formData.userType === 'BUYER' ? '1px solid #4FC3F7' : '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontWeight: 600
                }}
              >
                <User size={18} /> Buyer
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Primary Location <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-100)', fontWeight: 400 }}>(Required for localized updates)</span>
            </label>
            {location ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(27, 94, 32, 0.2)', border: '1px solid var(--color-primary)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#A5D6A7', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={16} /> Location captured successfully
                </span>
                <button type="button" onClick={getLocation} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }}>
                  Update
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={getLocation}
                disabled={locationLoading}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed rgba(255,255,255,0.4)', borderRadius: '8px', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary-100)'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
              >
                {locationLoading ? <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={16} />}
                {locationLoading ? 'Getting location...' : 'Get Current Location'}
              </button>
            )}
          </div>

          <div style={{ marginTop: 32 }}>
            <button
              type="submit"
              disabled={loading || !location}
              className="btn-solid-primary"
            >
              {loading ? <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : 'Create Account'}
            </button>
            {!location && (
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 16 }}>
                Please capture your location to continue.
              </p>
            )}
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>Already have an account? </span>
          <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>

        </div>
      </div>

      {/* Right Side: Image/Branding Section (Hidden on Mobile) */}
      <AuthCarousel />
    </div>
  );
}
