'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarDays, Check, ChevronRight, LogOut, Menu, Plus, Search, Settings, X } from 'lucide-react';
import { activity, finance, freelancerId, panelNav, projects, shoots, statusTone, vendors, type Vendor } from './data';
import { getCurrentMockFreelancer, getMockPlan, logoutMockFreelancer, updateMockFreelancerAccount, type MockFreelancerAccount } from './mockFreelancerStore';
import { BRAND } from '@/config/brand';

const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
const totalReceived = finance.filter((item) => item.status === 'Received').reduce((sum, item) => sum + item.amount, 0);
const balanceDue = finance.filter((item) => item.status === 'Pending').reduce((sum, item) => sum + item.amount, 0);

export function PanelShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<MockFreelancerAccount | null>(null);
  const pathname = usePathname();
  useEffect(() => setAccount(getCurrentMockFreelancer()), []);
  return (
    <div className="min-h-screen bg-[#F7FCEE] text-[#0D1816] md:grid md:grid-cols-[280px_1fr]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-70 flex-col bg-[#171816] text-white md:flex">
        <PanelSidebar pathname={pathname} account={account} />
      </aside>
      <div className="md:col-start-2">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#EDE8E2] bg-[#F7FCEE]/90 px-4 backdrop-blur-xl md:px-7">
          <button type="button" onClick={() => setOpen(true)} className="grid size-11 place-items-center rounded-xl border border-[#EDE8E2] bg-white md:hidden" aria-label="Open panel navigation"><Menu className="size-5" /></button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.12em] text-[#B6E25D]">Freelancer Panel</p>
            <h1 className="text-lg font-black">{BRAND.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/panel/find-vendor" className="hidden min-h-10 items-center gap-2 rounded-full border border-[#EDE8E2] bg-white px-4 text-sm font-bold sm:inline-flex"><Search className="size-4 text-[#4F554C]" />Find Vendor</Link>
            <button className="grid size-10 place-items-center rounded-full border border-[#EDE8E2] bg-white" aria-label="Notifications"><Bell className="size-4" /></button>
          </div>
        </header>
        <main className="px-4 py-6 md:px-7">{children}</main>
      </div>
      {open && <div className="fixed inset-0 z-50 bg-[#171816] text-white md:hidden"><button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid size-11 place-items-center rounded-xl bg-white/10" aria-label="Close panel navigation"><X className="size-5" /></button><PanelSidebar pathname={pathname} account={account} /></div>}
    </div>
  );
}

function PanelSidebar({ pathname, account }: { pathname: string; account: MockFreelancerAccount | null }) {
  const studioName = account?.studioName ?? 'Demo Studio';
  const initials = studioName.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'RS';
  const plan = account ? getMockPlan(account.planId) : null;
  return (
    <div className="flex h-full flex-col p-5">
      <Link href="/panel" className="font-[var(--font-display)] text-2xl font-black leading-tight text-[#C7E982]">Wedding<br />Photo Planet</Link>
      <p className="mt-2 border-b border-[#B6E25D]/35 pb-5 text-[10px] font-black uppercase tracking-[.16em] text-white/45">Freelancer Panel</p>
      <div className="mt-5 rounded-2xl bg-white/8 p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-[#B6E25D] text-sm font-black text-[#171816]">{initials}</span>
          <div><p className="text-sm font-black">{studioName}</p><p className="text-xs text-white/50">{plan ? plan.name : 'Freelancer'}</p></div>
        </div>
      </div>
      <nav className="mt-6 space-y-1" aria-label="Freelancer panel">
        {panelNav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return <Link key={href} href={href} className={`flex min-h-11 items-center gap-3 rounded-xl border-l-3 px-3 text-sm font-bold transition ${active ? 'border-[#B6E25D] bg-white/10 text-white' : 'border-transparent text-white/62 hover:bg-white/8 hover:text-white'}`}><Icon className="size-4" />{label}</Link>;
        })}
      </nav>
      <div className="mt-auto space-y-3 border-t border-white/10 pt-5">
        <div className="flex items-center justify-between text-xs text-white/55"><span>Access</span><span className="flex items-center gap-1 text-[#C7E982]"><span className="size-2 rounded-full bg-emerald-400" />Active</span></div>
        <Link href="/login" onClick={logoutMockFreelancer} className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white/8 text-sm font-bold text-white/75 transition hover:bg-white/12"><LogOut className="size-4" />Logout</Link>
      </div>
    </div>
  );
}

export function PanelDashboard() {
  const [account, setAccount] = useState<MockFreelancerAccount | null>(null);
  useEffect(() => setAccount(getCurrentMockFreelancer()), []);
  return (
    <div className="space-y-6">
      <Welcome account={account} />
      <Stats />
      <QuickActions />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-2xl border border-[#EDE8E2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-[.08em]">Recent projects & deadlines</h2>
            <Link href="/panel/projects" className="text-xs font-black text-[#4F554C]">View all</Link>
          </div>
          <div className="mt-4 space-y-3">
            {projects.map((project) => <ProjectRow key={project.id} project={project} />)}
          </div>
        </section>
        <section className="rounded-2xl border border-[#EDE8E2] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><h2 className="text-sm font-black uppercase tracking-[.08em]">Upcoming shoots</h2><Link href="/panel/shoots" className="text-xs font-black text-[#4F554C]">Calendar</Link></div>
          <div className="mt-4 space-y-3">
            {shoots.filter((shoot) => shoot.status === 'Scheduled').map((shoot) => <div key={shoot.id} className="rounded-xl border border-[#EDE8E2] bg-[#FBFDF6] p-3 text-sm"><strong>{shoot.project}</strong><p className="mt-1 text-xs text-[#3A3F38]">{shoot.date} · {shoot.location}</p></div>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function Welcome({ account }: { account: MockFreelancerAccount | null }) {
  const plan = account ? getMockPlan(account.planId) : null;
  return <section className="overflow-hidden rounded-2xl bg-linear-to-r from-[#1F211E] to-[#272A26] p-6 text-white shadow-sm"><p className="text-xs font-black uppercase tracking-[.12em] text-[#B6E25D]">Freelancer dashboard overview • {BRAND.name}</p><h2 className="mt-2 text-3xl font-black">Welcome Back, {account?.studioName ?? 'Demo Studio'}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">{plan ? `${plan.name} is active with ${account?.billingCycle} billing.` : 'Your profile is active, three projects are in motion, and one balance needs follow-up this week.'}</p></section>;
}

function Stats() {
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Total Projects" value={projects.length} /><Stat label="Total Shoots" value={shoots.length} /><Stat label="Vendors In Network" value={vendors.filter((v) => v.scopeOwnerId === freelancerId).length} /><Stat label="Finance" value={money(totalReceived)} sub={<span><b className="text-[#2E8B57]">Received</b> / <b className="text-[#C0392B]">Due {money(balanceDue)}</b></span>} /></section>;
}

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: React.ReactNode }) {
  return <article className="rounded-2xl border border-[#EDE8E2] bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-[.1em] text-[#4F554C]">{label}</p><strong className="mt-3 block text-3xl font-black">{value}</strong>{sub && <p className="mt-2 text-xs font-bold text-[#3A3F38]">{sub}</p>}</article>;
}

function QuickActions() {
  const actions = [['Add Vendor', '/panel/my-vendors'], ['Find Vendor', '/panel/find-vendor'], ['Update Profile', '/panel/profile'], ['View Finance', '/panel/finance']];
  return <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{actions.map(([label, href]) => <Link key={label} href={href} className="flex min-h-18 items-center gap-3 rounded-2xl border border-[#EDE8E2] bg-white p-4 font-black shadow-sm transition hover:-translate-y-0.5 hover:border-[#B6E25D]"><span className="grid size-10 place-items-center rounded-full bg-[#EDF4F2] text-[#4F554C]"><Plus className="size-4" /></span>{label}</Link>)}</section>;
}

function ProjectRow({ project }: { project: typeof projects[number] }) {
  return <div className="rounded-xl border border-[#EDE8E2] bg-[#FBFDF6] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><strong>{project.name}</strong><p className="mt-1 text-xs text-[#3A3F38]">{project.client} · {project.location} · {project.date}</p></div><Badge value={project.status} /></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#EDE8E2]"><div className={`h-full rounded-full bg-[#4F554C] ${project.progress === 100 ? 'w-full' : project.progress > 50 ? 'w-2/3' : 'w-1/5'}`} /></div></div>;
}

function Badge({ value }: { value: keyof typeof statusTone }) {
  return <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em] ${statusTone[value]}`}>{value}</span>;
}

export function ProfilePage() {
  const [account, setAccount] = useState<MockFreelancerAccount | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    studioName: '',
    phone: '',
    email: '',
    city: '',
    headline: '',
    role: '',
    experienceYears: '0',
    skills: '',
    bio: '',
    portfolioLinks: '',
    dailyRate: '',
    eventRate: '',
    profilePhoto: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const current = getCurrentMockFreelancer();
    setAccount(current);
    if (!current) return;
    setForm({
      fullName: current.fullName || '',
      studioName: current.studioName || '',
      phone: current.phone || '',
      email: current.email || '',
      city: current.city || '',
      headline: current.headline || '',
      role: current.role || '',
      experienceYears: String(current.experienceYears ?? 0),
      skills: current.skills?.join(', ') || '',
      bio: current.bio || '',
      portfolioLinks: current.portfolioLinks || '',
      dailyRate: current.dailyRate || '',
      eventRate: current.eventRate || '',
      profilePhoto: current.profilePhoto || '',
    });
  }, []);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage('');
  };
  const handlePhotoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('profilePhoto', String(reader.result || ''));
    reader.readAsDataURL(file);
  };
  const save = () => {
    const updated = updateMockFreelancerAccount({
      fullName: form.fullName.trim(),
      studioName: form.studioName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      city: form.city.trim(),
      headline: form.headline.trim(),
      role: form.role.trim(),
      experienceYears: Number(form.experienceYears) || 0,
      skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      bio: form.bio.trim(),
      portfolioLinks: form.portfolioLinks.trim(),
      dailyRate: form.dailyRate,
      eventRate: form.eventRate,
      profilePhoto: form.profilePhoto,
    });
    setAccount(updated);
    setMessage('Profile saved.');
  };

  return <PanelPage title="My Profile" subtitle="Review and refine the details you submitted after purchase.">
    <div className="grid gap-5 rounded-2xl border border-[#EDE8E2] bg-white p-5 shadow-sm lg:grid-cols-[240px_1fr]">
      <aside className="rounded-2xl border border-[#EDE8E2] bg-[#FBFDF6] p-4 text-center">
        {form.profilePhoto ? <img src={form.profilePhoto} alt="Profile photo" className="mx-auto size-32 rounded-full object-cover ring-4 ring-white" /> : <div className="mx-auto grid size-32 place-items-center rounded-full bg-[#EDF4F2] text-4xl font-black text-[#4F554C]">{(form.fullName || account?.fullName || 'F').slice(0, 1).toUpperCase()}</div>}
        <label className="mt-4 inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#C7E982] bg-white px-4 text-sm font-black text-[#373B35] transition hover:bg-[#EDF4F2]">
          Upload Photo
          <input type="file" accept="image/*" className="hidden" onChange={(event) => handlePhotoUpload(event.target.files?.[0])} />
        </label>
        <p className="mt-3 text-xs font-bold text-[#3A3F38]">{account ? `${getMockPlan(account.planId).name} · ${account.billingCycle}` : 'Freelancer profile'}</p>
      </aside>
      <form className="grid gap-4 lg:grid-cols-2" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <Input label="Name" value={form.fullName} onChange={(value) => update('fullName', value)} />
        <Input label="Studio / brand" value={form.studioName} onChange={(value) => update('studioName', value)} />
        <Input label="Phone" value={form.phone} onChange={(value) => update('phone', value)} />
        <Input label="Email" value={form.email} readOnly onChange={(value) => update('email', value)} />
        <Input label="Base city" value={form.city} onChange={(value) => update('city', value)} />
        <Input label="Primary role" value={form.role} onChange={(value) => update('role', value)} />
        <Input label="Professional headline" value={form.headline} onChange={(value) => update('headline', value)} className="lg:col-span-2" />
        <Input label="Experience years" type="number" value={form.experienceYears} onChange={(value) => update('experienceYears', value)} />
        <Input label="Daily rate" value={form.dailyRate} onChange={(value) => update('dailyRate', value)} />
        <Input label="Skills, comma separated" value={form.skills} onChange={(value) => update('skills', value)} className="lg:col-span-2" />
        <TextArea label="Portfolio links" value={form.portfolioLinks} onChange={(value) => update('portfolioLinks', value)} placeholder="Instagram, YouTube, website or Behance link" />
        <TextArea label="Bio / notes" value={form.bio} onChange={(value) => update('bio', value)} placeholder="Tell studios about your work style, gear and best assignments." />
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2"><button type="submit" className="min-h-11 rounded-xl bg-[#373B35] px-4 text-sm font-black text-white">Save Profile</button>{message ? <p className="text-sm font-bold text-[#2E8B57]">{message}</p> : null}</div>
      </form>
    </div>
  </PanelPage>;
}

function Input({ label, value, readOnly, onChange, type = 'text', className = '' }: { label: string; value: string; readOnly?: boolean; onChange: (value: string) => void; type?: string; className?: string }) {
  return <label className={className}><span className="mb-2 block text-xs font-black uppercase tracking-[.1em] text-[#3A3F38]">{label}</span><input type={type} readOnly={readOnly} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#EDE8E2] bg-[#FBFDF6] px-3 outline-none focus:border-[#4F554C] focus:ring-4 focus:ring-[#EDF4F2] read-only:text-[#3A3F38]" /></label>;
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="lg:col-span-2"><span className="mb-2 block text-xs font-black uppercase tracking-[.1em] text-[#3A3F38]">{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-28 w-full rounded-xl border border-[#EDE8E2] bg-[#FBFDF6] p-3 outline-none focus:border-[#4F554C] focus:ring-4 focus:ring-[#EDF4F2]" /></label>;
}

export function VendorsPage() {
  return <PanelPage title="My Vendors" subtitle="Local vendors you already work with."><VendorGrid items={vendors.filter((vendor) => vendor.scopeOwnerId === freelancerId)} showAdd /></PanelPage>;
}

export function FindVendorPage() {
  const [location, setLocation] = useState('Delhi');
  const [category, setCategory] = useState('all');
  const scoped = useMemo(() => vendors.filter((vendor) => vendor.scopeOwnerId === freelancerId && vendor.location.toLowerCase().includes(location.toLowerCase()) && (category === 'all' || vendor.category === category)), [location, category]);
  return <PanelPage title="Find Vendor" subtitle="Location-scoped search within this freelancer network only."><div className="mb-5 grid gap-3 rounded-2xl border border-[#EDE8E2] bg-white p-4 sm:grid-cols-[1fr_220px_140px]"><input value={location} onChange={(e) => setLocation(e.target.value)} className="min-h-11 rounded-xl border border-[#EDE8E2] bg-[#FBFDF6] px-3 outline-none focus:border-[#4F554C]" aria-label="Vendor location" /><select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-11 rounded-xl border border-[#EDE8E2] bg-[#FBFDF6] px-3"><option value="all">All categories</option><option>Decorator</option><option>Makeup Artist</option><option>Venue</option><option>Transport</option></select><button className="min-h-11 rounded-xl bg-[#373B35] px-4 text-sm font-black text-white">Search</button></div>{scoped.length ? <VendorGrid items={scoped} actionLabel="Add to My Vendors" /> : <Empty title="No scoped vendors found" body="Try another city or category. Global vendor pools are intentionally hidden." />}</PanelPage>;
}

function VendorGrid({ items, showAdd, actionLabel }: { items: Vendor[]; showAdd?: boolean; actionLabel?: string }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{showAdd && <button className="min-h-48 rounded-2xl border border-dashed border-[#B6E25D] bg-white p-5 text-left font-black text-[#4F554C]"><Plus className="mb-3 size-5" />Add Vendor</button>}{items.map((vendor) => <article key={vendor.id} className="rounded-2xl border border-[#EDE8E2] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{vendor.name}</h3><p className="mt-1 text-sm text-[#3A3F38]">{vendor.category} · {vendor.location}</p></div><Badge value={vendor.status} /></div><p className="mt-4 text-sm font-bold text-[#3A3F38]">{vendor.contact}</p>{actionLabel && <button className="mt-4 min-h-10 rounded-xl border border-[#EDE8E2] px-3 text-sm font-black text-[#4F554C]">{actionLabel}</button>}</article>)}</div>;
}

export function ProjectsPage() {
  const [filter, setFilter] = useState('all');
  const rows = projects.filter((project) => filter === 'all' || project.status === filter);
  return <PanelPage title="Projects" subtitle="All assigned projects and completion status."><Filter value={filter} setValue={setFilter} options={['all', 'Upcoming', 'Ongoing', 'Completed']} /><Rows rows={rows.map((p) => [p.name, p.client, p.date, p.status, `${p.shoots} shoots`])} /></PanelPage>;
}

export function ShootsPage() {
  const [filter, setFilter] = useState('all');
  const rows = shoots.filter((shoot) => filter === 'all' || shoot.status === filter);
  return <PanelPage title="Shoots" subtitle="Shoot schedule, role and location."><Filter value={filter} setValue={setFilter} options={['all', 'Scheduled', 'Completed']} /><Rows rows={rows.map((s) => [s.date, s.project, s.location, s.status, s.role])} /></PanelPage>;
}

export function FinancePage() {
  return <PanelPage title="Finance" subtitle="Payments, balance due and transaction history."><section className="mb-5 grid gap-4 md:grid-cols-3"><Stat label="Total Earned" value={money(totalReceived + balanceDue)} /><Stat label="Total Received" value={money(totalReceived)} /><Stat label="Balance Due" value={money(balanceDue)} /></section><Rows rows={finance.map((f) => [f.date, f.label, money(f.amount), f.status, 'Invoice'])} /></PanelPage>;
}

function PanelPage({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="space-y-5"><section className="rounded-2xl bg-linear-to-r from-[#1F211E] to-[#272A26] p-6 text-white"><p className="text-xs font-black uppercase tracking-[.12em] text-[#B6E25D]">{BRAND.name}</p><h1 className="mt-2 text-3xl font-black">{title}</h1><p className="mt-2 text-sm text-white/65">{subtitle}</p></section>{children}</div>;
}

function Filter({ value, setValue, options }: { value: string; setValue: (value: string) => void; options: string[] }) {
  return <div className="mb-4 flex flex-wrap gap-2">{options.map((option) => <button key={option} onClick={() => setValue(option)} className={`min-h-10 rounded-full border px-4 text-sm font-black capitalize ${value === option ? 'border-[#373B35] bg-[#373B35] text-white' : 'border-[#EDE8E2] bg-white text-[#3A3F38]'}`}>{option}</button>)}</div>;
}

function Rows({ rows }: { rows: string[][] }) {
  return <div className="overflow-hidden rounded-2xl border border-[#EDE8E2] bg-white shadow-sm">{rows.map((row, index) => <div key={row.join('-')} className="grid gap-2 border-b border-[#EDE8E2] p-4 text-sm last:border-b-0 md:grid-cols-5 md:items-center"><strong>{row[0]}</strong>{row.slice(1).map((cell) => <span key={cell} className={index === -1 ? '' : 'text-[#3A3F38]'}>{cell}</span>)}<ChevronRight className="hidden size-4 justify-self-end text-[#4F554C] md:block" /></div>)}</div>;
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="rounded-2xl border border-dashed border-[#EDE8E2] bg-white p-10 text-center"><Settings className="mx-auto size-8 text-[#4F554C]" /><h3 className="mt-3 font-black">{title}</h3><p className="mt-2 text-sm text-[#3A3F38]">{body}</p></div>;
}
