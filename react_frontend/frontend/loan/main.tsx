import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { applyAppTheme } from './shared/theme';

applyAppTheme();

createRoot(document.getElementById('root')!).render(<App />);
