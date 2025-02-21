import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from './components/ui/tooltip';

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <App />
      </TooltipProvider>
    </BrowserRouter>
  </ThemeProvider>
);
