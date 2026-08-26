import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useLocation } from 'react-router-dom';
import App from './App';
import LiveResultsPage from './components/LiveResultsPage';
import './styles.css';
import './flight-detail.css';
import './fare.css';
import './tripi.css';
import './live-results.css';

function Root() {
  const location = useLocation();
  return location.pathname === '/results' ? <LiveResultsPage /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
);
