// Hand-rolled shadcn-style primitives — one cohesive system used everywhere.
'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ---------- Button ---------- */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type BtnSize = 'sm' | 'md' | 'lg' | 'icon';
export function Button({
  variant = 'primary', size = 'md', className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-gold-600 text-white shadow-sm hover:bg-gold-700 hover:shadow-lift active:scale-[0.98] dark:bg-gold-500 dark:hover:bg-gold-400 dark:text-ink-950',
    secondary: 'bg-stone-900 text-white hover:bg-stone-700 active:scale-[0.98] dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white',
    ghost: 'text-stone-600 hover:bg-stone-900/5 hover:text-stone-900 active:scale-[0.98] dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white',
    outline: 'border border-stone-300 bg-transparent text-stone-800 hover:border-gold-600 hover:text-gold-700 active:scale-[0.98] dark:border-ink-700 dark:text-stone-200 dark:hover:border-gold-400 dark:hover:text-gold-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
  };
  const s: Record<BtnSize, string> = {
    sm: 'h-8 px-3 text-[13px] rounded-lg', md: 'h-11 px-5 text-sm rounded-xl',
    lg: 'h-13 px-7 text-base rounded-xl', icon: 'h-10 w-10 rounded-xl',
  };
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 font-semibold tracking-tight transition-all duration-200 select-none disabled:pointer-events-none disabled:opacity-50', v[variant], s[size], className)}
      {...props}
    />
  );
}

/* ---------- Card ---------- */
export function Card({ className, hover = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-stone-200/80 bg-white shadow-card dark:border-ink-700/60 dark:bg-ink-900',
        hover && 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lift',
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Badge / Chip ---------- */
export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase', className)} {...props} />
  );
}
export function Chip({ className, active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-all duration-200 active:scale-95',
        active
          ? 'border-gold-600 bg-gold-600/10 text-gold-700 dark:border-gold-400 dark:bg-gold-400/10 dark:text-gold-300'
          : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:text-stone-900 dark:border-ink-700 dark:text-stone-300 dark:hover:border-stone-500 dark:hover:text-white',
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Inputs ---------- */
const inputCls = 'h-11 w-full rounded-xl border border-stone-300 bg-white px-4 text-[15px] text-stone-900 placeholder:text-stone-400 transition-all duration-200 hover:border-stone-400 focus:border-gold-600 dark:border-ink-700 dark:bg-ink-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:hover:border-stone-600';
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, 'h-auto min-h-28 py-3', props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputCls, 'appearance-none pr-10 bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%2378716c%27 stroke-width=%272%27%3E%3Cpath d=%27m4 6 4 4 4-4%27/%3E%3C/svg%3E")] bg-[position:right_0.9rem_center] bg-no-repeat', props.className)} />
  );
}

/* ---------- Dialog ---------- */
const DialogCtx = createContext<{ close: () => void }>({ close: () => {} });
export function Dialog({ open, onClose, children, labelledBy }: { open: boolean; onClose: () => void; children: ReactNode; labelledBy?: string }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <DialogCtx.Provider value={{ close: onClose }}>
      <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm animate-[fade-up_0.2s_ease]" onClick={onClose} />
        <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-stone-200 bg-white p-6 shadow-lift dark:border-ink-700 dark:bg-ink-900 animate-[fade-up_0.25s_cubic-bezier(0.22,1,0.36,1)] max-h-[92dvh] overflow-y-auto">
          {children}
        </div>
      </div>
    </DialogCtx.Provider>
  );
}
export function DialogTitle({ children, id }: { children: ReactNode; id?: string }) {
  const { close } = useContext(DialogCtx);
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <h3 id={id} className="font-display text-xl font-semibold tracking-tight">{children}</h3>
      <button onClick={close} aria-label="Close dialog" className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, className }: {
  tabs: Array<{ value: T; label: string }>; value: T; onChange: (v: T) => void; className?: string;
}) {
  return (
    <div className={cn('inline-flex rounded-xl bg-stone-900/5 p-1 dark:bg-white/10', className)} role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value} role="tab" aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200',
            value === t.value
              ? 'bg-white text-stone-900 shadow-card dark:bg-ink-800 dark:text-white'
              : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200',
          )}
        >{t.label}</button>
      ))}
    </div>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} aria-hidden="true" />;
}

/* ---------- Section heading ---------- */
export function SectionHeading({ kicker, title, action, className }: { kicker?: string; title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-5 flex items-end justify-between gap-4', className)}>
      <div>
        {kicker && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-600 dark:text-gold-400">{kicker}</p>}
        <h2 className="font-display text-2xl font-semibold tracking-tight text-stone-900 dark:text-white sm:text-[28px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 px-6 py-12 text-center dark:border-ink-700">
      {icon && <div className="mb-3 text-3xl">{icon}</div>}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-stone-500 dark:text-stone-400">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- Toast ---------- */
interface ToastMsg { id: number; text: string; tone: 'ok' | 'err' | 'info' }
const ToastCtx = createContext<{ toast: (text: string, tone?: ToastMsg['tone']) => void }>({ toast: () => {} });
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }: { children: ReactNode }) {  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toast = (text: string, tone: ToastMsg['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };
  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-8" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cn(
            'pointer-events-auto flex max-w-md items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium shadow-lift animate-[fade-up_0.25s_ease]',
            t.tone === 'ok' && 'bg-stone-900 text-white dark:bg-white dark:text-stone-900',
            t.tone === 'err' && 'bg-red-600 text-white',
            t.tone === 'info' && 'bg-gold-600 text-white',
          )}>
            <span className="text-base">{t.tone === 'ok' ? '✓' : t.tone === 'err' ? '⚠' : 'ℹ'}</span>
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
