
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App'; // Corrected import path
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
