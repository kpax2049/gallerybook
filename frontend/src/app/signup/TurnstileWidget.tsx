import { useEffect, useRef, useState } from 'react';

type TurnstileWidgetProps = {
  siteKey: string;
  resetSignal: number;
  onVerify: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
};

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstileScript() {
  const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
  if (existing) return;

  const script = document.createElement('script');
  script.id = TURNSTILE_SCRIPT_ID;
  script.src = TURNSTILE_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function TurnstileWidget({
  siteKey,
  resetSignal,
  onVerify,
  onExpire,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    loadTurnstileScript();

    const interval = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(interval);
        setScriptReady(true);
      }
    }, 100);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scriptReady || !window.turnstile || !containerRef.current) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      theme: 'auto',
      callback: onVerify,
      'expired-callback': onExpire,
      'error-callback': onError,
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, siteKey, onVerify, onExpire, onError]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [resetSignal]);

  return <div ref={containerRef} className="min-h-[65px]" />;
}
