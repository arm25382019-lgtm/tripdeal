import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import LiveResultsPage from './components/LiveResultsPage';
import LiveDealPage from './components/LiveDealPage';
import LegacyFlightBridge from './components/LegacyFlightBridge';
import AirlineSearchPage from './components/AirlineSearchPage';
import AirlineBookingPage from './components/AirlineBookingPage';
import './styles.css';
import './flight-detail.css';
import './fare.css';
import './tripi.css';
import './live-results.css';
import './live-deal.css';
import './flight-search.css';

function Root() {
  const location = useLocation();
  if (location.pathname === '/search') return <AirlineSearchPage />;
  if (location.pathname === '/book') return <AirlineBookingPage />;
  if (location.pathname === '/results') return <LiveResultsPage />;
  if (location.pathname === '/deal') return <LiveDealPage />;
  if (location.pathname === '/flight') return <LegacyFlightBridge />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
);
