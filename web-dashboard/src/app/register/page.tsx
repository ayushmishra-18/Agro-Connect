'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Wheat, User, Phone, MapPin, Loader2, AlertCircle, Mail, Lock } from 'lucide-react';
import AuthCarousel from '@/components/AuthCarousel';
import { searchLocation, reverseGeocode } from '@/app/location-actions';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    userType: 'FARMER',
    locationName: '',
  });
  const [location, setLocation] = useState<{ lat: number, lon: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!formData.locationName || formData.locationName.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchLocation(formData.locationName);
        setLocationSuggestions(data);
      } catch (err) {
        console.warn("Autofill error:", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.locationName]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getLocation = () => {
    setLocationLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLocation({ lat, lon });

          try {
            const data = await reverseGeocode(lat, lon);
            const locName = data?.address?.city || data?.address?.state_district || data?.address?.state || data?.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            setFormData(prev => ({ ...prev, locationName: locName }));
          } catch (e) {
            console.warn("Geocoding failed", e);
            setFormData(prev => ({ ...prev, locationName: `${lat.toFixed(4)}, ${lon.toFixed(4)}` }));
          }

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
          location_name: formData.locationName,
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

  if (!mounted) return null;

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
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'FARMER' }))}
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
                  onClick={() => setFormData(prev => ({ ...prev, userType: 'BUYER' }))}
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
                Primary Location <span style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 400 }}>(Required for localized updates)</span>
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="input-with-icon" style={{ flex: 1, position: 'relative' }}>
                  <MapPin className="input-icon" size={18} />
                  <input
                    name="locationName" type="text" required
                    value={formData.locationName}
                    onChange={(e) => {
                      handleInputChange(e);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="modern-input"
                    placeholder="E.g. Pune, Maharashtra"
                    autoComplete="off"
                  />

                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-md)',
                      zIndex: 20,
                      maxHeight: '200px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}>
                      {locationSuggestions.map((sugg, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, locationName: sugg.display_name }));
                            setLocation({ lat: parseFloat(sugg.lat), lon: parseFloat(sugg.lon) });
                            setShowSuggestions(false);
                            setLocationSuggestions([]);
                          }}
                          style={{
                            padding: '10px 14px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            borderBottom: i < locationSuggestions.length - 1 ? '1px solid var(--color-border-light)' : 'none',
                            color: 'var(--color-text-primary)'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          {sugg.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={locationLoading}
                  className="btn-solid-primary"
                  style={{ width: 'auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                  title="Detect automatically"
                >
                  {locationLoading ? <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : <MapPin size={18} />}
                </button>
              </div>
              {location && formData.locationName && (
                <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '8px' }}>
                  ✓ Location coordinates secured
                </p>
              )}
            </div>

            <div style={{ marginTop: 32 }}>
              <button
                type="submit"
                disabled={loading || !formData.locationName}
                className="btn-solid-primary"
              >
                {loading ? <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> : 'Create Account'}
              </button>
              {!formData.locationName && (
                <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: 16 }}>
                  Please provide your location to continue.
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
