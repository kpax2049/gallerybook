/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TURNSTILE_SITE_KEY?: string;
}

interface Window {
  turnstile?: {
    render: (
      element: HTMLElement,
      options: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
        theme?: 'light' | 'dark' | 'auto';
      }
    ) => string;
    reset: (widgetId?: string) => void;
    remove: (widgetId: string) => void;
  };
}
