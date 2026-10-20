'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Briefcase,
  Camera,
  Clapperboard,
  ClipboardList,
  LucideIcon,
  Monitor,
  Palette,
  Plane,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { TeamMember } from '@/types';
import { getAvatarStyle, getInitials, getRoleIcon } from '../teamDomain';

const ROLE_ICONS = {
  drone: Plane,
  cinema: Clapperboard,
  video: Video,
  photo: Camera,
  album: BookOpen,
  retouch: Palette,
  editor: Monitor,
  assist: UserRound,
  coord: ClipboardList,
  sales: TrendingUp,
  manager: Briefcase,
  social: Smartphone,
  user: User,
} as const;

export function RoleIcon({ role, className = 'size-3.5' }: { role?: string; className?: string }) {
  const Icon = ROLE_ICONS[getRoleIcon(role)] || User;
  return <Icon className={className} />;
}

export const CARD = 'rounded-2xl border border-[#e2d9d3] bg-white shadow-[0_8px_24px_rgba(48,44,46,.05)]';
export const FIELD =
  'w-full rounded-xl border border-[#ded5cf] bg-[#fbfaf8] px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#366e61] focus:bg-white focus:ring-4 focus:ring-rose-100';
export const LABEL = 'mb-1 block text-[10px] font-extrabold uppercase tracking-[.1em] text-[#254b42]';

export const BTN_PRIMARY =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2f5f54] to-[#254b42] px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_8px_20px_rgba(37,75,66,.25)] transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0';
export const BTN_GHOST =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#ded5cf] bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:bg-[#fbfaf8] disabled:cursor-not-allowed disabled:opacity-50';
export const BTN_DANGER =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100';
export const BTN_CREAM =
  'group relative inline-flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-r from-[#f9eee7] to-[#edcfc3] px-4 py-2.5 text-sm font-extrabold text-[#254b42] shadow-[0_8px_20px_rgba(10,20,17,.18)] transition hover:-translate-y-0.5 hover:shadow-xl';

export const TOGGLE_WRAP = 'flex items-center rounded-xl border border-[#e2d9d3] bg-[#f6f1ee] p-1';
export const TOGGLE_ACTIVE = 'border border-[#efd9b0]/80 bg-white text-[#254b42] shadow-sm';
export const TOGGLE_IDLE = 'border border-transparent text-slate-600 hover:text-[#254b42]';
export const ACCENT = 'text-[#2f5f54]';
export const LINK = 'cursor-pointer font-bold text-[#2f5f54] underline hover:text-[#254b42]';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: 'neutral' | 'indigo' | 'rose' | 'emerald' | 'amber' | 'red' | 'blue' | 'purple' | 'violet' | 'stone';
  onClick?: () => void;
  active?: boolean;
}

const TONES: Record<NonNullable<KpiCardProps['tone']>, string> = {
  neutral: 'bg-stone-100 text-stone-700',
  indigo: 'bg-rose-50 text-rose-700',
  rose: 'bg-rose-50 text-rose-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  blue: 'bg-sky-50 text-sky-700',
  purple: 'bg-violet-50 text-violet-700',
  violet: 'bg-violet-50 text-violet-700',
  stone: 'bg-stone-100 text-stone-700',
};

export const KpiCard: React.FC<KpiCardProps> = ({ label, value, hint, icon: Icon, tone = 'rose', onClick, active }) => {
  const Wrapper = onClick ? 'button' : 'article';
  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`${CARD} group w-full p-4 text-left transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      } ${active ? 'border-rose-300 ring-2 ring-rose-100' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[.08em] text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</p>
        </div>
        {Icon && (
          <span className={`grid size-10 place-items-center rounded-xl ${TONES[tone]}`}>
            <Icon className="size-5" />
          </span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-sm font-medium text-slate-500">{hint}</p>}
    </Wrapper>
  );
};

export const Badge: React.FC<{ className?: string; children: React.ReactNode; title?: string }> = ({
  className = 'border-[#ded5cf] bg-[#f6f1ee] text-slate-700',
  children,
  title,
}) => (
  <span
    title={title}
    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${className}`}
  >
    {children}
  </span>
);

interface AvatarProps {
  member: Pick<TeamMember, 'id' | 'name' | 'profilePhoto'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const AVATAR_SIZES = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-2xl',
};

export const Avatar: React.FC<AvatarProps> = ({ member, size = 'md', className = '' }) => {
  const sizeClass = AVATAR_SIZES[size];
  if (member.profilePhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.profilePhoto}
        alt={member.name}
        className={`${sizeClass} flex-shrink-0 rounded-full border-2 border-white object-cover shadow-sm ${className}`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} ${getAvatarStyle(member.id || member.name)} flex flex-shrink-0 items-center justify-center rounded-full border-2 font-black tracking-wider ${className}`}
    >
      {getInitials(member.name)}
    </div>
  );
};

export const SectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, icon: Icon, actions, children, className = '' }) => (
  <section className={`${CARD} overflow-hidden ${className}`}>
    <header className="flex flex-col justify-between gap-3 border-b border-[#eee7e2] px-5 py-4 sm:flex-row sm:items-center">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-tight text-slate-900">
          {Icon && <Icon className="h-4 w-4 text-[#2f5f54]" />}
          <span>{title}</span>
        </h3>
        {subtitle && <p className="mt-0.5 text-[11px] font-medium text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

export const EmptyState: React.FC<{
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}> = ({ icon: Icon, title, message, action }) => (
  <div className="space-y-3 px-6 py-10 text-center">
    {Icon && (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[#2f5f54]">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <div>
      <p className="text-sm font-extrabold text-slate-800">{title}</p>
      {message && <p className="mx-auto mt-1 max-w-md text-xs font-medium text-slate-500">{message}</p>}
    </div>
    {action}
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ rows = 5, columns = 6 }) => (
  <div className="animate-pulse space-y-2" aria-hidden="true">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-3">
        {Array.from({ length: columns }).map((__, c) => (
          <div key={c} className={`h-8 rounded-lg bg-[#f6f1ee] ${c === 0 ? 'w-48' : 'flex-1'}`} />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid animate-pulse grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`${CARD} space-y-3 p-4`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#f6f1ee]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-[#f6f1ee]" />
            <div className="h-2.5 w-1/3 rounded bg-[#f6f1ee]" />
          </div>
        </div>
        <div className="h-16 rounded-xl bg-[#fbfaf8]" />
      </div>
    ))}
  </div>
);

export const ModalHero: React.FC<{
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  labelledBy?: string;
  actions?: React.ReactNode;
}> = ({ icon: Icon, eyebrow, title, description, onClose, labelledBy, actions }) => (
  <header className="relative shrink-0 overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(236,190,169,.24),transparent_32%),linear-gradient(125deg,#33514A,#55333f_52%,#1b2825)] px-5 py-5 text-white sm:px-7 sm:py-6">
    <div className="absolute -bottom-14 -right-8 size-44 rounded-full border-[24px] border-white/5" />
    <div className="relative flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-white/30 bg-white/15 shadow-inner">
          <Icon className="size-7 text-[#f6d9ca]" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[.18em] text-[#d2e2de]">
            <Sparkles className="size-3.5" />
            {eyebrow}
          </p>
          <h2 id={labelledBy} className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
            {title}
          </h2>
          {description && <div className="mt-1 text-sm font-medium leading-relaxed text-[#dfeae7]">{description}</div>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${title}`}
          className="grid size-10 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  </header>
);

export const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
  widthClass?: string;
}> = ({ isOpen, onClose, labelledBy, children, widthClass = 'max-w-3xl' }) => {
  if (!isOpen || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <div className="absolute inset-0 bg-[#111a18]/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative z-10 flex h-full w-full ${widthClass} flex-col bg-[#fbfaf8] shadow-[0_30px_90px_rgba(9,19,17,.42)]`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
  widthClass?: string;
}> = ({ isOpen, onClose, labelledBy, children, widthClass = 'max-w-2xl' }) => {
  if (!isOpen || typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111a18]/75 p-3 backdrop-blur-sm sm:p-6">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative z-10 max-h-[92vh] w-full ${widthClass} overflow-y-auto rounded-[2rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(9,19,17,.42)]`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export const ScrollArea: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`-mx-5 overflow-x-auto px-5 ${className}`}>{children}</div>
);

export const TH: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <th className={`whitespace-nowrap px-3 py-2.5 text-left text-[10px] font-extrabold uppercase tracking-wider text-slate-500 ${className}`}>
    {children}
  </th>
);

export const TD: React.FC<{ children: React.ReactNode; className?: string; colSpan?: number }> = ({
  children,
  className = '',
  colSpan,
}) => (
  <td colSpan={colSpan} className={`px-3 py-2.5 align-middle text-xs text-slate-700 ${className}`}>
    {children}
  </td>
);
