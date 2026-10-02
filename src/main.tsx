// Suppress benign SheetJS (xlsx) ZIP warnings where data descriptors trigger spurious console.error
if (typeof window !== 'undefined') {
  const originalConsoleError = window.console.error;
  window.console.error = function (...args: any[]) {
    const firstArg = args[0];
    if (typeof firstArg === 'string' && (
      firstArg.startsWith('Bad uncompressed size') ||
      firstArg.startsWith('Bad compressed size') ||
      firstArg.startsWith('Bad CRC32')
    )) {
      // Benign SheetJS notice for streaming ZIP files created by Excel/SAP; ignore to prevent false errors
      return;
    }
    return originalConsoleError.apply(this, args);
  };
}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

