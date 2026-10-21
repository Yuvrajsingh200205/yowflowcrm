import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Banknote, Check, Film, FolderKanban, Images, ShieldCheck, Target, UserCheck, Users, X, type LucideIcon } from 'lucide-react';
import { BRAND } from '@/config/brand';
import { FAQS, FEATURES, HERO, INTEGRATIONS, PROBLEM, PROOF_POINTS, SOLUTION, STEPS, TESTIMONIALS, USE_CASES } from '@/config/marketing';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';

const ICONS: Record<string, LucideIcon> = { Target, FolderKanban, Film, UserCheck, Banknote, Images, Users, ShieldCheck };

export function SectionHead({ eyebrow, title, body, center }: { eyebrow?: string; title: string; body?: string; center?: boolean }) {
  return (
    <div className={cn('max-w-2xl', center && 'mx-auto text-center')}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">{eyebrow}</p>}
      <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">{title}</h2>
      {body && <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">{body}</p>}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-32 sm:pt-40">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[44rem] w-[70rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(180,240,60,.2),transparent_62%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000,transparent)]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <Reveal>
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] px-3.5 py-1.5 text-xs font-medium text-fg-muted backdrop-blur">
            <span className="size-1.5 rounded-full bg-lime shadow-[0_0_10px_var(--accent)]" aria-hidden="true" />{HERO.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={0.06}>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-7xl">
            Every lead, shoot and delivery. <span className="bg-gradient-to-r from-[#B4F03C] to-[#E4FF9E] bg-clip-text text-transparent">One calm workspace.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">{HERO.subtitle}</p>
        </Reveal>
        <Reveal delay={0.18}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg"><Link href={HERO.primary.href}>{HERO.primary.label}<ArrowRight /></Link></Button>
            <Button asChild variant="secondary" size="lg"><Link href={HERO.secondary.href}>{HERO.secondary.label}</Link></Button>
          </div>
          <p className="mt-4 text-xs text-fg-subtle">{HERO.note}</p>
        </Reveal>

        <Reveal delay={0.24} y={36} className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute -inset-x-6 -top-6 -z-10 h-40 bg-[radial-gradient(ellipse_at_top,rgba(180,240,60,.28),transparent_70%)] blur-2xl" aria-hidden="true" />
          <div className="rounded-[1.4rem] border border-line bg-[linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.02))] p-1.5 shadow-[0_40px_120px_-30px_rgba(0,0,0,.8),0_0_0_1px_rgba(180,240,60,.08)]">
            <div className="overflow-hidden rounded-[1.1rem] border border-line-soft bg-surface">
              <div className="flex items-center gap-1.5 border-b border-line-soft bg-surface-sunken px-4 py-2.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-[#3a423a]" /><span className="size-2.5 rounded-full bg-[#3a423a]" /><span className="size-2.5 rounded-full bg-[#3a423a]" />
                <span className="ml-3 truncate rounded-md bg-surface px-3 py-0.5 text-[11px] text-fg-subtle">app.{BRAND.domain}/dashboard</span>
              </div>
              <Image src="/marketing/dashboard.webp" alt={`${BRAND.name} dashboard showing revenue, projects, deliveries and upcoming shoots`} width={1440} height={900} priority sizes="(min-width:1024px) 1024px, 100vw" className="h-auto w-full" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[var(--background)] to-transparent" aria-hidden="true" />
        </Reveal>
      </div>
    </section>
  );
}

export function ProofStrip() {
  return (
    <section aria-label="Highlights" className="border-y border-line-soft">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-line-soft sm:px-0 lg:grid-cols-4">
        {PROOF_POINTS.map((p) => (
          <div key={p.value} className="bg-canvas px-5 py-8 text-center sm:px-8">
            <dt className="font-display text-2xl font-semibold tracking-tight text-fg">{p.value}</dt>
            <dd className="mt-1.5 text-[13px] leading-snug text-fg-muted">{p.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ProblemSolution() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <Reveal><SectionHead eyebrow="Why studios switch" title="From scattered tools to one source of truth." center /></Reveal>
      <div className="mt-14 grid gap-5 lg:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-[var(--radius-xl)] border border-line-soft bg-surface p-7 sm:p-9">
            <h3 className="font-display text-xl font-semibold tracking-tight text-fg-muted">{PROBLEM.title}</h3>
            <ul className="mt-6 space-y-4">
              {PROBLEM.points.map((t) => <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-fg-muted"><X className="mt-1 size-4 shrink-0 text-bad" aria-hidden="true" />{t}</li>)}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="relative h-full overflow-hidden rounded-[var(--radius-xl)] border border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-surface p-7 shadow-[0_0_80px_-30px_rgba(180,240,60,.35)] sm:p-9">
            <div className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-[radial-gradient(circle,rgba(180,240,60,.18),transparent_65%)]" aria-hidden="true" />
            <h3 className="relative font-display text-xl font-semibold tracking-tight text-fg">{SOLUTION.title}</h3>
            <ul className="relative mt-6 space-y-4">
              {SOLUTION.points.map((t) => <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-fg"><Check className="mt-1 size-4 shrink-0 text-brand" aria-hidden="true" />{t}</li>)}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function FeatureBento() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
      <Reveal><SectionHead eyebrow="Everything in one place" title="The whole studio, in one workspace." body="Eight connected modules that share one record per client, so nothing is typed twice." center /></Reveal>
      <div className="mt-14 grid auto-rows-[minmax(11.5rem,auto)] md:grid-flow-dense gap-4 md:grid-cols-4">
        {FEATURES.map((f, i) => {
          const Icon = ICONS[f.icon] ?? Target;
          return (
            <Reveal key={f.id} delay={(i % 4) * 0.05} className={cn(f.span === 'wide' && 'md:col-span-2', f.span === 'tall' && 'md:row-span-2')}>
              <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line-soft bg-surface p-6 transition-[border-color,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)] hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--accent)_45%,var(--border))] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[radial-gradient(circle,rgba(180,240,60,.16),transparent_65%)] opacity-0 transition-opacity duration-[var(--dur-slow)] group-hover:opacity-100" aria-hidden="true" />
                <span className="grid size-11 place-items-center rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-brand"><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-fg-muted">{f.body}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-line-soft bg-surface-sunken">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal><SectionHead eyebrow="How it works" title="From first enquiry to final payment." center /></Reveal>
        <ol className="mt-16 grid gap-8 md:grid-cols-5 md:gap-5">
          {STEPS.map((s, i) => (
            <li key={s.n} className="relative">
              <Reveal delay={i * 0.07}>
                {i < STEPS.length - 1 && <span className="absolute left-10 top-5 hidden h-px w-[calc(100%-1rem)] bg-gradient-to-r from-[var(--accent)]/50 to-transparent md:block" aria-hidden="true" />}
                <span className="relative grid size-10 place-items-center rounded-full border border-[color-mix(in_srgb,var(--accent)_50%,var(--border))] bg-surface font-mono text-xs font-semibold text-brand">{s.n}</span>
                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{s.body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function UseCases() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <Reveal><SectionHead eyebrow="Built for studios like yours" title="Whatever you shoot, the workflow fits." center /></Reveal>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map((u, i) => (
          <Reveal key={u.title} delay={i * 0.06}>
            <article className="h-full rounded-[var(--radius-xl)] border border-line-soft bg-surface p-6">
              <h3 className="font-display text-lg font-semibold tracking-tight">{u.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{u.body}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="border-y border-line-soft bg-surface-sunken">
      <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
        <Reveal><SectionHead eyebrow="What studios tell us" title="Less admin. More time behind the lens." center /></Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.quote} delay={i * 0.07}>
              <figure className="flex h-full flex-col rounded-[var(--radius-xl)] border border-line-soft bg-surface p-7">
                <blockquote className="flex-1 text-[15px] leading-relaxed text-fg">“{t.quote}”</blockquote>
                <figcaption className="mt-6 border-t border-line-soft pt-4 text-sm"><span className="font-medium text-fg">{t.who}</span><span className="block text-fg-subtle">{t.where}</span></figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Integrations() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
      <Reveal><SectionHead eyebrow="Integrations" title="Plays well with the tools you already use." center /></Reveal>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {INTEGRATIONS.map((x, i) => (
          <Reveal key={x.name} delay={i * 0.05}>
            <div className="h-full rounded-[var(--radius-lg)] border border-line-soft bg-surface p-5">
              <p className="font-display text-base font-semibold tracking-tight">{x.name}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-fg-muted">{x.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function Faq({ limit }: { limit?: number }) {
  const items = limit ? FAQS.slice(0, limit) : FAQS;
  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-24 sm:px-6 sm:py-32">
      <Reveal><SectionHead eyebrow="FAQ" title="Questions, answered." center /></Reveal>
      <div className="mt-12 divide-y divide-line-soft rounded-[var(--radius-xl)] border border-line-soft bg-surface">
        {items.map((f) => (
          <details key={f.q} className="group px-6 py-1 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-5 text-left text-base font-medium text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]">
              {f.q}
              <span className="relative grid size-6 shrink-0 place-items-center text-fg-subtle" aria-hidden="true">
                <span className="absolute h-px w-3.5 bg-current" /><span className="absolute h-3.5 w-px bg-current transition-transform duration-[var(--dur-base)] group-open:rotate-90 group-open:opacity-0" />
              </span>
            </summary>
            <p className="pb-5 pr-10 text-[15px] leading-relaxed text-fg-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="px-4 pb-24 sm:px-6 sm:pb-32">
      <Reveal>
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-[color-mix(in_srgb,var(--accent)_35%,var(--border))] bg-surface px-6 py-16 text-center sm:px-12 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(180,240,60,.3),transparent_60%)]" aria-hidden="true" />
          <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-tight text-balance sm:text-5xl">Give your studio a calmer way to run.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-base text-fg-muted sm:text-lg">Start a 14-day trial, or book a walkthrough and we’ll set it up around your workflow.</p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="accent" size="lg"><Link href="/signup">Start free trial<ArrowRight /></Link></Button>
            <Button asChild variant="secondary" size="lg"><Link href="/contact">Book a demo</Link></Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
