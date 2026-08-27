import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import TripiAssistant from './components/TripiAssistant';
import FlightSearchEngine from './components/FlightSearchEngine';
import HomePage from './components/HomePage';
import TravelBlogPage from './components/TravelBlogPage';
import ExplorePage from './components/ExplorePage';
import { SiteBottomNav, SiteHeader } from './components/SiteChrome';
import { LanguageProvider, useLanguage } from './lib/i18n';

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <SiteHeader/>
    <main>{children}</main>
    <SiteBottomNav/>
    <TripiAssistant/>
  </div>;
}

function FindDealPage(){
  const { t } = useLanguage();
  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>{t('nav.flights')} ✈️</h1><p>{t('explore.finalSub')}</p></div></section><div className="container narrow section"><FlightSearchEngine/></div></Shell>;
}

function AlertsPage(){
  const { t } = useLanguage();
  const [enabled,setEnabled]=useState(true);
  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>🔔 {t('nav.alerts')}</h1><p>ตั้งงบไว้ แล้วค่อยกลับมาเมื่อเจอดีลที่ใช่</p></div></section><div className="container narrow section alerts-section"><div className="panel form compact-form"><div className="form-grid"><label>ปลายทาง<input defaultValue="Tokyo"/></label><label>งบสูงสุด<input defaultValue="8000" type="number"/></label></div><button className="primary">ตั้งแจ้งเตือน</button></div><div className="results-header"><h2>การแจ้งเตือนของฉัน</h2></div><div className="alert-card"><div><h3>Tokyo, Japan</h3><p>งบไป–กลับไม่เกิน ฿8,000/คน</p></div><button className={enabled?'toggle on':'toggle'} onClick={()=>setEnabled(!enabled)} aria-label="เปิดปิดการแจ้งเตือน"><span/></button></div></div></Shell>;
}

function AccountPage(){
  const { t } = useLanguage();
  return <Shell><div className="container narrow section account-section"><div className="profile"><div className="avatar">TD</div><div><h2>{t('nav.account')} TripDeal</h2><p>TripDeal member</p></div></div>{['การจองของฉัน','แจ้งเตือนราคา','รายการที่บันทึก','ข้อมูลผู้โดยสาร','ช่วยเหลือ','ตั้งค่า'].map(x=><div className="menu-row" key={x}>{x}<span>›</span></div>)}</div></Shell>;
}

function AppRoutes(){
  return <Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/explore" element={<ExplorePage/>}/>
    <Route path="/blog/:slug" element={<TravelBlogPage/>}/>
    <Route path="/find-deal" element={<FindDealPage/>}/>
    <Route path="/alerts" element={<AlertsPage/>}/>
    <Route path="/account" element={<AccountPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}

export default function App(){
  return <LanguageProvider><AppRoutes/></LanguageProvider>;
}
