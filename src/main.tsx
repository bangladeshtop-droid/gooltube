import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress known Telegram WebApp SDK warning from bubbling up in error logs
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('CloudStorage is not supported')) {
    return;
  }
  originalConsoleError(...args);
};

window.addEventListener('error', (event) => {
  if (event.message?.includes('CloudStorage is not supported') || 
      (typeof event.error === 'string' && event.error.includes('CloudStorage is not supported'))) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('CloudStorage is not supported') || 
      (typeof event.reason === 'string' && event.reason.includes('CloudStorage is not supported'))) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
