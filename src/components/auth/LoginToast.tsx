'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface LoginToastProps {
  message: { type: 'error' | 'info'; text: string } | null;
  onDismiss: () => void;
}

export function LoginToast({ message, onDismiss }: LoginToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    const enterFrame = window.requestAnimationFrame(() => setVisible(true));
    const exitTimer = window.setTimeout(() => setVisible(false), 2700);
    const removeTimer = window.setTimeout(onDismiss, 3000);
    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [message, onDismiss]);

  if (!message) return null;
  const isError = message.type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div className={`fixed right-4 top-4 z-100 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-300 sm:right-6 sm:top-6 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'} ${isError ? 'border-red-200 bg-red-50/95 text-red-800' : 'border-[#c3d8d3] bg-white/95 text-[#253E38]'}`} role={isError ? 'alert' : 'status'} aria-live="polite">
      <Icon className={`size-5 shrink-0 ${isError ? 'text-red-600' : 'text-[#387265]'}`} />
      <p className="text-sm font-semibold leading-snug sm:text-base">{message.text}</p>
      <button type="button" onClick={() => { setVisible(false); window.setTimeout(onDismiss, 200); }} aria-label="Dismiss notification" className="ml-1 rounded-md p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100"><X className="size-4" /></button>
    </div>
  );
}
