import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Ensure this import matches
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
