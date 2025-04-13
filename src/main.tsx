import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ThemeProvider } from './components/theme-provider.tsx';

document.addEventListener('pyloidReady', () => {
  createRoot(document.getElementById('root')!).render(
    <ThemeProvider defaultTheme="dark">
      <App />
    </ThemeProvider>
  );
});
