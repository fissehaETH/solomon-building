
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('Index: Starting...');
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Index: Root element NOT found');
  throw new Error("Could not find root element to mount to");
}
console.log('Index: Root element found', rootElement);

const root = ReactDOM.createRoot(rootElement);
console.log('Index: Root created');
root.render(
  <App />
);
console.log('Index: Render called');
