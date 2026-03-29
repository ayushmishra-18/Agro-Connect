'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Globe,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Bug,
  Leaf,
} from 'lucide-react';
import i18n from '@/lib/i18n';
import VoiceAssistant from '@/components/dashboard/VoiceAssistant';
import { createClient } from '@/utils/supabase/client';

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
  { href: '/dashboard', icon: LayoutDashboard, tKey: 'dashboard', fallback: 'Dashboard' },
  { href: '/dashboard/farm', icon: Leaf, tKey: 'cropTracker', fallback: 'Crop Tracker' },
  { href: '/dashboard/predictions', icon: TrendingUp, tKey: 'priceForecasts', fallback: 'Price Forecasts' },
  { href: '/dashboard/marketplace', icon: ShoppingCart, tKey: 'marketplace', fallback: 'Marketplace' },
  { href: '/dashboard/weather', icon: CloudSun, tKey: 'weather', fallback: 'Weather' },
  { href: '/dashboard/schemes', icon: FileText, tKey: 'govtSchemes', fallback: 'Govt Schemes' },
  { href: '/dashboard/disease-scanner', icon: Bug, tKey: 'diseaseScanner', fallback: 'Disease Scanner' },
  { href: '/dashboard/advisories', icon: BookOpen, tKey: 'farmingTips', fallback: 'Farming Tips' },
];

/* ─── Dashboard Layout ─── */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [lang, setLang] = useState<Language>('en');
  const [isMobile, setIsMobile] = useState(false);

  // Sync i18n language when lang context changes
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const pageTitle = (() => {
    const found = [...navItems].find(
      (item) => pathname === item.href
    );
    return found ? i18n.t(found.tKey, found.fallback) : i18n.t('dashboard', 'Dashboard');
  })();

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <div className={`app-shell ${sidebarCollapsed && !isMobile ? 'sidebar-collapsed' : ''}`}>
        {/* Sidebar Overlay (mobile) */}
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed && !isMobile ? 'collapsed' : ''}`}>
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Sprout size={22} />
            </div>
            <div className="sidebar-brand-text">
              <h1>Agro-Connect</h1>
              <span>{i18n.t('smartFarming', 'Smart Farming Platform')}</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">
              {i18n.t('main', 'Main')}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  title={i18n.t(item.tKey, item.fallback)}
                >
                  <Icon size={20} />
                  <span className="sidebar-link-text">{i18n.t(item.tKey, item.fallback)}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            title={i18n.t('logout', 'Logout')}
          >
            <LogOut size={20} />
            <span className="sidebar-link-text">
              {i18n.t('logout', 'Logout')}
            </span>
          </button>

          {/* Sidebar collapse toggle (desktop) */}
          {!isMobile && (
            <button
              className="sidebar-collapse-btn"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <header className="top-header">
            <div className="header-left">
              <button
                className="menu-toggle"
                onClick={handleSidebarToggle}
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

              {/* Account Settings Button */}
              <button
                className={`header-settings-btn ${pathname === '/dashboard/settings' ? 'active' : ''}`}
                onClick={() => router.push('/dashboard/settings')}
                aria-label="Account Settings"
                title={lang === 'hi' ? 'सेटिंग्स' : lang === 'mr' ? 'सेटिंग्ज' : 'Account Settings'}
              >
                <Settings size={20} />
              </button>
            </div>
          </header>

          <div className="page-content animate-in">
            {children}
          </div>
        </main>
      </div>

      <VoiceAssistant />
    </LanguageContext.Provider>
  );
}
