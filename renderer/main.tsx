/**
 * main.tsx
 * Renderer process entry point
 * Dependencies: React, App component
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './globals.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
