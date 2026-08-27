import { useState } from 'react';
import { Bell, Home, Plane, User } from 'lucide-react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import TripiAssistant from './components/TripiAssistant';
import FlightSearchEngine from './components/FlightSearchEngine';
import HomePage from './components/HomePage';
import TravelBlogPage from './components/TravelBlogPage';

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><Plane size={22} fill="currentColor"/>TripDeal</Link>
      <nav className="desktop-nav"><Link to="/">หน้าแรก</Link><Link to="/find-deal">ค้นหาเที่ยวบิน</Link><Link to="/alerts">แจ้งเตือนราคา</Link><Link to="/account">บัญชี</Link></nav>
    </header>
    <main>{children}</main>
    <nav className="bottom-nav"><Link to="/"><Home size={20}/>หน้าแรก</Link><Link to="/find-deal"><Plane size={20}/>เที่ยวบิน</Link><Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link><Link to="/account"><User size={20}/>บัญชี</Link></nav>
    <TripiAssistant/>
  </div>;
}

function FindDealPage(){
  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>ค้นหาเที่ยวบิน ✈️</h1><p>เลือกต้นทาง ปลายทาง วันเดินทาง และจำนวนผู้โดยสาร</p></div></section><div className="container narrow section"><FlightSearchEngine/></div></Shell>;
}

function AlertsPage(){
  const [enabled,setEnabled]=useState(true);
  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>🔔 แจ้งเตือนราคา</h1><p>ตั้งงบไว้ แล้วค่อยกลับมาเมื่อเจอดีลที่ใช่</p></div></section><div className="container narrow section alerts-section"><div className="panel form compact-form"><div className="form-grid"><label>ปลายทาง<input defaultValue="Tokyo"/></label><label>งบสูงสุด<input defaultValue="8000" type="number"/></label></div><button className="primary">ตั้งแจ้งเตือน</button></div><div className="results-header"><h2>การแจ้งเตือนของฉัน</h2></div><div className="alert-card"><div><h3>Tokyo, Japan</h3><p>งบไป–กลับไม่เกิน ฿8,000/คน</p></div><button className={enabled?'toggle on':'toggle'} onClick={()=>setEnabled(!enabled)} aria-label="เปิดปิดการแจ้งเตือน"><span/></button></div></div></Shell>;
}

function AccountPage(){
  return <Shell><div className="container narrow section account-section"><div className="profile"><div className="avatar">TD</div><div><h2>ผู้ใช้งาน TripDeal</h2><p>บัญชีทดลอง</p></div></div>{['การจองของฉัน','แจ้งเตือนราคา','รายการที่บันทึก','ข้อมูลผู้โดยสาร','ช่วยเหลือ','ตั้งค่า'].map(x=><div className="menu-row" key={x}>{x}<span>›</span></div>)}</div></Shell>;
}

export default function App(){
  return <Routes>
    <Route path="/" element={<HomePage/>}/>
    <Route path="/blog/:slug" element={<TravelBlogPage/>}/>
    <Route path="/find-deal" element={<FindDealPage/>}/>
    <Route path="/alerts" element={<AlertsPage/>}/>
    <Route path="/account" element={<AccountPage/>}/>
    <Route path="*" element={<Navigate to="/" replace/>}/>
  </Routes>;
}
