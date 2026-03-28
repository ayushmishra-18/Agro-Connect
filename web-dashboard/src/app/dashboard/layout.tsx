'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  CloudSun,
  BookOpen,
  Settings,
  Menu,
  X,
  Sprout,
  LogOut,
  Globe,
} from 'lucide-react';
import i18n from '@/lib/i18n';

/* ─── Language Context ─── */
type Language = 'en' | 'hi' | 'mr';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
});

export const useLang = () => useContext(LanguageContext);

const langLabels: Record<Language, string> = { en: 'EN', hi: 'हिं', mr: 'मर' };

/* ─── Nav Items ─── */
const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', labelHi: 'डैशबोर्ड', labelMr: 'डॅशबोर्ड' },
  { href: '/dashboard/predictions', icon: TrendingUp, label: 'Price Forecasts', labelHi: 'मूल्य पूर्वानुमान', labelMr: 'किंमत अंदाज' },
  { href: '/dashboard/marketplace', icon: ShoppingCart, label: 'Marketplace', labelHi: 'बाज़ार', labelMr: 'बाजारपेठ' },
  { href: '/dashboard/weather', icon: CloudSun, label: 'Weather', labelHi: 'मौसम', labelMr: 'हवामान' },
  { href: '/dashboard/advisories', icon: BookOpen, label: 'Farming Tips', labelHi: 'खेती की सलाह', labelMr: 'शेती टिप्स' },
];

const secondaryItems = [
  { href: '/dashboard/settings', icon: Settings, label: 'Settings', labelHi: 'सेटिंग्स', labelMr: 'सेटिंग्ज' },
];

function getLabel(item: { label: string; labelHi: string; labelMr: string }, lang: Language) {
  return lang === 'hi' ? item.labelHi : lang === 'mr' ? item.labelMr : item.label;
}

/* ─── Dashboard Layout ─── */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<Language>('en');

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const pageTitle = (() => {
    const found = [...navItems, ...secondaryItems].find(
      (item) => pathname === item.href
    );
    return found ? getLabel(found, lang) : lang === 'hi' ? 'डैशबोर्ड' : lang === 'mr' ? 'डॅशबोर्ड' : 'Dashboard';
  })();

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div className="app-shell">
        {/* Sidebar Overlay (mobile) */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Sprout size={22} />
            </div>
            <div>
              <h1>Agro-Connect</h1>
              <span>Smart Farming Platform</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">
              {lang === 'hi' ? 'मुख्य' : lang === 'mr' ? 'मुख्य' : 'Main'}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  {getLabel(item, lang)}
                </Link>
              );
            })}

            <div className="sidebar-section-label" style={{ marginTop: 16 }}>
              {lang === 'hi' ? 'सेटिंग्स' : lang === 'mr' ? 'सेटिंग्ज' : 'Account'}
            </div>
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={20} />
                  {getLabel(item, lang)}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              className="sidebar-link" 
              style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
              onClick={async () => {
                const { createClient } = await import('@/utils/supabase/client');
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              <LogOut size={20} />
              {lang === 'hi' ? 'लॉगआउट' : lang === 'mr' ? 'लॉगआउट' : 'Logout'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <header className="top-header">
            <div className="header-left">
              <button
                className="menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h2 className="header-title">{pageTitle}</h2>
            </div>
            <div className="header-right">
              {/* Language Switcher */}
              <div className="lang-switcher">
                {(['en', 'hi', 'mr'] as Language[]).map((l) => (
                  <button
                    key={l}
                    className={`lang-btn ${lang === l ? 'active' : ''}`}
                    onClick={() => {
                      setLang(l);
                      if (i18n.changeLanguage) i18n.changeLanguage(l);
                      localStorage.setItem('agro_lang', l);
                    }}
                    aria-label={`Switch to ${l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : 'Marathi'}`}
                  >
                    {langLabels[l]}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <div className="page-content animate-in">
            {children}
          </div>
        </main>
      </div>
    </LanguageContext.Provider>
  );
}
