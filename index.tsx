
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('Index: Starting...');

// Viewport height fix for mobile browsers
// We only update on orientation change or initial load to prevent keyboard-induced jumps
let lastWidth = window.innerWidth;
const setVH = () => {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  lastWidth = window.innerWidth;
};

setVH();

// Only trigger on resize if the width actually changed (e.g. orientation change)
// This prevents the keyboard from triggering a resize that shrinks the app
window.addEventListener('resize', () => {
  if (window.innerWidth !== lastWidth) {
    setVH();
  }
});

window.addEventListener('orientationchange', () => {
  // Small delay to ensure innerHeight is updated after orientation change
  setTimeout(setVH, 100);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Index: Root element NOT found');
  throw new Error("Could not find root element to mount to");
}
console.log('Index: Root element found', rootElement);

const root = ReactDOM.createRoot(rootElement);
console.log('Index: Root created');
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
console.log('Index: Render called');
