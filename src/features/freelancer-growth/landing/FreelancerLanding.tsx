'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LandingFooter } from '@/features/landing/components/LandingFooter';
import { LandingNavbar } from '@/features/landing/components/LandingNavbar';
import { comparisonRows, featureSteps, finance, plans, projects, shoots, testimonials, type BillingCycle } from '../data';
import './freelancer-landing.css';
import { BRAND } from '@/config/brand';

const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

const capabilities = [
  { id: 'find', label: 'Find work', note: 'Studios look for a profile, a city and the kind of work you take.' },
  { id: 'paid', label: 'Get paid', note: 'Received and pending amounts stay on the assignment, not in a separate sheet.' },
  { id: 'shoots', label: 'Manage shoots', note: 'Call times, venues and your role sit on the shoot.' },
  { id: 'network', label: 'Grow network', note: 'Vendors you already work with stay in your own list.' },
];

const story = [
  { step: '01', title: 'Get discovered', body: 'A profile with your city, specialty and the work you want to be hired for.', rows: [['Profile', 'Lead photographer'], ['City', 'Delhi'], ['Specialty', 'Weddings']] },
  { step: '02', title: 'Get booked', body: 'A project shows the couple, the date and where the wedding is.', rows: [['Project', projects[0].name], ['Client', projects[0].client], ['When', projects[0].date]] },
  { step: '03', title: 'Manage the shoot', body: 'Each shoot keeps the role you were booked for.', rows: [['Date', shoots[0].date], ['Role', shoots[0].role], ['Place', shoots[0].location]] },
  { step: '04', title: 'Get paid', body: 'What has landed and what is still due, on that same job.', rows: [['Received', money(finance[0].amount)], ['Pending', money(finance[2].amount)], ['Status', finance[2].status]] },
  { step: '05', title: 'Build the network', body: 'People you work with, scoped to you. Not another creator’s list.', rows: [['Scope', 'Your vendors'], ['City filter', 'On the plan'], ['Shared pool', 'Not included']] },
];

const filters = [
  { city: 'Delhi', craft: 'Photography', when: 'This month' },
  { city: 'Jaipur', craft: 'Wedding films', when: 'Next month' },
  { city: 'Gurugram', craft: 'Editing', when: 'Open dates' },
];

const day = [
  ['09:00', 'Bridal prep'],
  ['11:30', 'Ceremony'],
  ['14:00', 'Portraits'],
  ['17:30', 'Reception'],
  ['20:00', 'Handover'],
];

const nodes = [
  { name: 'Studio', detail: 'Books the wedding and assigns the crew.' },
  { name: 'Photographer', detail: 'Lead or second shooter on the day.' },
  { name: 'Videographer', detail: 'Ceremony, speeches and the film.' },
  { name: 'Editor', detail: 'Selects, grade and the final cut.' },
];

const groups = [
  { title: 'Profile', items: ['Profile listing', 'Portfolio highlights', 'Priority discovery'] },
  { title: 'Work', items: ['10 active projects', 'Unlimited projects', 'Shoot calendar'] },
  { title: 'Finance', items: ['Payment tracker', 'Finance dashboard', 'Advanced finance view'] },
  { title: 'Network', items: ['Basic vendor network', 'Scoped vendor search', 'Multi-city vendor pools'] },
];

export function FreelancerLanding() {
  const hero = useRef<HTMLElement>(null);
  const [cap, setCap] = useState(capabilities[0]);
  const [feature, setFeature] = useState(0);
  const [step, setStep] = useState(0);
  const [filter, setFilter] = useState(0);
  const [node, setNode] = useState(0);
  const [quote, setQuote] = useState(0);
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const active = story[step];
  const chosen = filters[filter];
  const sample = projects[filter] ?? projects[0];

  useEffect(() => {
    const el = hero.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const progress = Math.min(1, window.scrollY / Math.max(window.innerHeight, 1));
      el.style.setProperty('--fl-p', progress.toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fl-page ui-ed">
      <LandingNavbar />
      <main>
        <section className="fl-hero" ref={hero}>
          <div className="fl-hero-photo">
            <Image src="/images/hero-aperture.svg" alt="A photographer working a wedding." fill priority sizes="100vw" />
          </div>
          <div className="fl-hero-shade" />
          <div className="fl-hero-copy">
            <div className="fl-wrap">
              <div className="fl-hero-grid">
                <div>
                  <p className="fl-line fl-d1 ed-label" style={{ color: '#C8E985' }}>For freelancers</p>
                  <h1 className="fl-title">
                    <span className="fl-line fl-d2 block">Get found.</span>
                    <em className="fl-line fl-d3 block">Stay clear.</em>
                    <span className="fl-line fl-d4 block">Get paid.</span>
                  </h1>
                  <p className="fl-line fl-d5 mt-6 max-w-[34rem] text-[1.02rem] leading-7 text-[rgba(243,250,229,0.78)]">
                    A calmer operating page for photographers, filmmakers and editors: profile, assignments, shoots and payouts in one {BRAND.name} record.
                  </p>
                  <div className="fl-line fl-d6 mt-8 flex flex-wrap gap-6">
                    <Link href="/freelancers/pricing" className="ed-action">Get Started</Link>
                    <Link href="#workspace" className="fl-text">See how it works</Link>
                  </div>
                  <div className="fl-line fl-d7" role="tablist" aria-label="What the workspace covers">
                    <div className="fl-caps">
                      {capabilities.map((item) => (
                        <button key={item.id} type="button" role="tab" aria-selected={cap.id === item.id} className={`fl-cap ${cap.id === item.id ? 'is-on' : ''}`} onClick={() => setCap(item)}>
                          {item.label}
                        </button>
                      ))}
                    </div>
                    <p className="fl-note">{cap.note}</p>
                  </div>
                </div>

                <aside className="fl-line fl-d6 fl-hero-card" aria-label="Freelancer workspace preview">
                  <div className="fl-card-top">
                    <div>
                      <p className="ed-label" style={{ color: 'var(--fl-gold)' }}>Live assignment</p>
                      <h2>{projects[0].name}</h2>
                    </div>
                    <span>{projects[0].status}</span>
                  </div>
                  <div className="fl-card-meter" aria-hidden="true"><i style={{ width: `${projects[0].progress}%` }} /></div>
                  <div className="fl-card-grid">
                    <div><span>Role</span><strong>{shoots[0].role}</strong></div>
                    <div><span>City</span><strong>{projects[0].location}</strong></div>
                    <div><span>Next shoot</span><strong>{shoots[0].date}</strong></div>
                    <div><span>Pending</span><strong>{money(finance[2].amount)}</strong></div>
                  </div>
                  <div className="fl-card-footer">
                    <span>Profile completeness</span>
                    <strong>86%</strong>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </section>

        <section className="fl-cred" aria-label="Freelancer workspace highlights">
          <div className="fl-wrap">
            {['Profile studios can scan', 'Assignments visible by shoot', 'Payouts tracked on the job'].map((item, index) => (
              <p key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</p>
            ))}
          </div>
        </section>

        <section id="features" className="fl-section fl-section--blush">
          <div className="fl-wrap grid items-start gap-12 lg:grid-cols-2">
            <div>
              <p className="fl-kicker">After the inquiry</p>
              <h2 className="fl-h mt-4 max-w-[14ch]">Everything after the booking, in one workspace.</h2>
            </div>
            <div>
              {featureSteps.map((item, index) => (
                <button key={item.eyebrow} type="button" className={`fl-feature ${feature === index ? 'is-on' : ''}`} aria-expanded={feature === index} onClick={() => setFeature(index)}>
                  <span className="ed-label text-[var(--ed-brass)]">{item.eyebrow}</span>
                  <span className="fl-feature-title mt-2 block">{item.title}</span>
                  <p className="text-[0.9rem] leading-6 text-[var(--ed-on-paper-dim)]">{item.body}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="workspace" className="fl-section fl-section--warm">
          <div className="fl-wrap">
            <p className="fl-kicker">The workspace</p>
            <h2 className="fl-h mt-4 max-w-[12ch]">One workspace. <em>Every shoot.</em></h2>
            <p className="mt-4 max-w-[42ch] text-[0.9rem] leading-7 text-[var(--ed-on-paper-dim)]">A preview of the records the freelancer panel already keeps. Sample names, not a live search.</p>
            <div className="fl-sticky mt-12">
              <ol>
                {story.map((item, index) => (
                  <li key={item.step}>
                    <button type="button" className={`fl-feature ${step === index ? 'is-on' : ''}`} onClick={() => setStep(index)}>
                      <span className="ed-label text-[var(--ed-brass)]">{item.step}</span>
                      <span className="fl-feature-title mt-2 block">{item.title}</span>
                      <p className="text-[0.9rem] leading-6 text-[var(--ed-on-paper-dim)]">{item.body}</p>
                    </button>
                  </li>
                ))}
              </ol>
              <div className="fl-sticky-visual" aria-live="polite">
                <p className="ed-label" style={{ color: 'var(--fl-gold)' }}>Preview · {active.step}</p>
                <p className="mt-2 text-[1.05rem] font-medium">{active.title}</p>
                <div key={active.step} className="fl-swap mt-5">
                  {active.rows.map(([label, value]) => (
                    <div key={label} className="fl-row">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="fl-section">
          <div className="fl-wrap grid gap-14 lg:grid-cols-2">
            <div>
              <p className="fl-kicker">Discover</p>
              <h2 className="fl-h mt-4">Your next opportunity should find you.</h2>
              <div className="fl-filters mt-8" role="tablist" aria-label="Example filters">
                {filters.map((item, index) => (
                  <button key={item.city} type="button" className={`fl-chip ${filter === index ? 'is-on' : ''}`} onClick={() => setFilter(index)}>
                    {item.city}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[0.9rem] text-[var(--ed-on-paper-dim)]">{chosen.craft} · {chosen.when}</p>
              <article className="fl-panel fl-swap mt-6" key={chosen.city}>
                <p className="ed-label text-[var(--ed-plum)]">Example project</p>
                <h3 className="fl-panel-title mt-3">{sample.name}</h3>
                <div className="fl-row"><span>Client</span><strong>{sample.client}</strong></div>
                <div className="fl-row"><span>Place</span><strong>{sample.location}</strong></div>
                <div className="fl-row"><span>Date</span><strong>{sample.date}</strong></div>
              </article>
            </div>
            <div>
              <p className="fl-kicker">Get paid</p>
              <h2 className="fl-h mt-4">See what has landed.</h2>
              <div className="fl-panel mt-8">
                <p className="ed-label text-[var(--ed-plum)]">Example · {finance[2].label}</p>
                <p className="mt-4 font-[var(--font-display)] text-[2.5rem] leading-none text-[var(--ed-plum-deep)]">{money(finance[1].amount + finance[2].amount)}</p>
                <div className="fl-line-track" aria-hidden="true"><i /></div>
                <div className="fl-row"><span>Received</span><strong>{money(finance[1].amount)}</strong></div>
                <div className="fl-row"><span>Pending</span><strong>{money(finance[2].amount)}</strong></div>
                <p className="mt-3 text-[0.8rem] text-[var(--ed-on-paper-dim)]">Illustration from the sample finance list. Not a live payout.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="fl-section bg-[var(--ed-paper-2)]">
          <div className="fl-wrap grid gap-12 lg:grid-cols-2">
            <div>
              <p className="fl-kicker">The day</p>
              <h2 className="fl-h mt-4">A shoot, in order.</h2>
              <ol className="fl-time mt-8">
                {day.map(([time, title]) => (
                  <li key={time}>
                    <span className="ed-numeral text-[0.85rem] text-[var(--ed-brass)]">{time}</span>
                    <span>{title}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="fl-network">
              <p className="ed-label" style={{ color: 'var(--fl-gold)' }}>The network</p>
              <h2 className="fl-h mt-4 text-[var(--fl-cream)]">Who stands next to you.</h2>
              <div className="fl-net mt-8">
                {nodes.map((item, index) => (
                  <button key={item.name} type="button" className={`fl-node ${node === index ? 'is-on' : ''}`} onClick={() => setNode(index)}>
                    {item.name}
                  </button>
                ))}
              </div>
              <p className="mt-6 max-w-[32ch] text-[0.9rem] leading-7 text-[rgba(243,250,229,0.72)]">{nodes[node].detail}</p>
            </div>
          </div>
        </section>

        <section id="proof" className="fl-section fl-proof">
          <div className="fl-wrap grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <blockquote className="fl-quote">
              <p className="fl-quote-text">{testimonials[quote].quote}”</p>
              <footer className="mt-6 text-[0.9rem]">
                <strong>{testimonials[quote].name}</strong>
                <span className="mt-1 block text-[var(--ed-on-paper-dim)]">{testimonials[quote].role}</span>
              </footer>
            </blockquote>
            <div>
              {testimonials.map((item, index) => (
                <button key={item.name} type="button" className={`fl-quote-btn ${quote === index ? 'is-on' : ''}`} onClick={() => setQuote(index)}>
                  <span className="block text-[0.95rem]">{item.name}</span>
                  <span className="mt-1 block text-[0.8rem]">{item.role}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="fl-section fl-pricing">
          <div className="fl-wrap">
            <p className="fl-kicker">Pricing</p>
            <h2 className="fl-h mt-4 max-w-[16ch]">Choose the setup that fits your season.</h2>
            <div className="fl-toggle mt-8" role="group" aria-label="Billing period">
              {(['monthly', 'yearly'] as BillingCycle[]).map((item) => (
                <button key={item} type="button" className={cycle === item ? 'is-on' : ''} onClick={() => setCycle(item)}>{item}</button>
              ))}
            </div>
            <div className="fl-plans">
              {plans.map((plan) => {
                const price = cycle === 'monthly' ? plan.monthly : plan.yearly;
                const lead = Boolean(plan.badge);
                return (
                  <article key={plan.id} className={`fl-plan ${lead ? 'is-lead' : ''}`}>
                    <p className="ed-label" style={{ color: lead ? 'var(--fl-gold)' : undefined }}>{plan.audience}</p>
                    <h3 className="fl-plan-name">{plan.name}</h3>
                    <p className="fl-plan-muted">{plan.description}</p>
                    <p className="fl-plan-price">{money(price)}<span className="ml-1 text-[0.75rem] font-sans font-medium opacity-70">/{cycle === 'monthly' ? 'mo' : 'yr'}</span></p>
                    <ul className="fl-plan-features">
                      {plan.features.slice(0, 4).map((featureName) => <li key={featureName}>{featureName}</li>)}
                    </ul>
                    <Link href={`/freelancers/checkout/${plan.id}?billingCycle=${cycle}`} className="ed-action">Get Started</Link>
                  </article>
                );
              })}
            </div>
            <div className="fl-groups mt-10">
              {groups.map((group) => (
                <details key={group.title}>
                  <summary>{group.title}</summary>
                  <ul className="pb-3 text-[0.88rem] leading-7 text-[var(--ed-on-paper-dim)]">
                    {group.items.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </details>
              ))}
            </div>
            <div className="fl-compare">
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Starter</th>
                    <th>Pro</th>
                    <th>Studio</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature}>
                      <td>{row.feature}</td>
                      <td>{row.starter}</td>
                      <td>{row.pro}</td>
                      <td>{row.studio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="fl-close">
          <div className="fl-close-photo">
            <Image src="/images/portrait-abstract.svg" alt="" fill sizes="100vw" />
          </div>
          <div className="fl-close-shade" aria-hidden="true" />
          <div className="fl-wrap py-[clamp(5rem,10vw,8rem)]">
            <h2 className="fl-h max-w-[14ch] text-[#F3FAE5]">Your work deserves a quieter way to run.</h2>
            <p className="mt-5 max-w-[34rem] text-[1rem] leading-7 text-[rgba(243,250,229,0.75)]">Profile, shoots and what you are owed — in the same language as the studio.</p>
            <div className="mt-8 flex flex-wrap gap-6">
              <Link href="/freelancers/pricing" className="ed-action">Get Started</Link>
              <Link href="/features" className="fl-text">Explore Features</Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
