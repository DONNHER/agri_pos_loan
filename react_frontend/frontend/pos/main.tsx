import React from 'react';
import ReactDOM from 'react-dom/client';
import { PosApp } from './PosApp';
import '../loan/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element for POS App');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PosApp />
  </React.StrictMode>
);
