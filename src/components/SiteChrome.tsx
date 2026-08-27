import { Bell, Compass, Home, Plane, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../lib/i18n';

export function SiteHeader() {
  const { t } = useLanguage();
  const location = useLocation();
  return <header className="topbar site-topbar">
    <Link to="/" className="brand"><Plane size={22} fill="currentColor"/>TripDeal</Link>
    <nav className="desktop-nav">
      <Link className={location.pathname === '/' ? 'active' : ''} to="/">{t('nav.home')}</Link>
      <Link className={location.pathname.startsWith('/explore') ? 'active' : ''} to="/explore">{t('nav.explore')}</Link>
      <Link className={location.pathname.startsWith('/find-deal') || location.pathname === '/search' ? 'active' : ''} to="/find-deal">{t('nav.flights')}</Link>
      <Link className={location.pathname.startsWith('/alerts') ? 'active' : ''} to="/alerts">{t('nav.alerts')}</Link>
      <Link className={location.pathname.startsWith('/account') ? 'active' : ''} to="/account">{t('nav.account')}</Link>
    </nav>
    <LanguageSwitcher/>
  </header>;
}

export function SiteBottomNav() {
  const { t } = useLanguage();
  const location = useLocation();
  return <nav className="bottom-nav five-nav">
    <Link className={location.pathname === '/' ? 'active' : ''} to="/"><Home size={20}/>{t('nav.home')}</Link>
    <Link className={location.pathname.startsWith('/explore') ? 'active' : ''} to="/explore"><Compass size={20}/>{t('nav.explore')}</Link>
    <Link className={location.pathname.startsWith('/find-deal') || location.pathname === '/search' ? 'active' : ''} to="/find-deal"><Plane size={20}/>{t('nav.flights')}</Link>
    <Link className={location.pathname.startsWith('/alerts') ? 'active' : ''} to="/alerts"><Bell size={20}/>{t('nav.alerts')}</Link>
    <Link className={location.pathname.startsWith('/account') ? 'active' : ''} to="/account"><User size={20}/>{t('nav.account')}</Link>
  </nav>;
}
