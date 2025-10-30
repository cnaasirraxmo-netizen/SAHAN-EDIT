import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Workbox } from 'workbox-window';

if ('serviceWorker' in navigator) {
  const wb = new Workbox('/service-worker.js');

  wb.addEventListener('waiting', (event) => {
    const shouldUpdate = window.confirm(
      'A new version of the app is available. Click OK to update now.'
    );
    if (shouldUpdate) {
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });
      wb.messageSkipWaiting();
    }
  });
  
  wb.register()
    .then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    })
    .catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);