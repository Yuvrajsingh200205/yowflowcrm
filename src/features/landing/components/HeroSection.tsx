import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, Camera, Image as ImageIcon, Mouse, Users } from 'lucide-react';
import { BRAND } from '@/config/brand';

const heroStats = [
  { value: '500+', label: 'Studios' },
  { value: '2,500+', label: 'Freelancers' },
  { value: '15,000+', label: 'Weddings' },
  { value: '1M+', label: 'Memories Delivered' },
];

const heroRails = [
  { icon: Camera, title: 'Manage', body: 'Your Business' },
  { icon: Users, title: 'Connect', body: 'With Talent' },
  { icon: ImageIcon, title: 'Deliver', body: 'Unforgettable Memories' },
  { icon: BarChart3, title: 'Grow', body: 'A Stronger Brand' },
];

export function HeroSection() {
  return (
    <section className="ed-hero-scene ed-ink relative isolate min-h-[100svh] overflow-hidden bg-[#210912]">
      <Image
        src="/images/hero-aperture.svg"
        alt="Bride under a floral stone arch at sunset with wedding photographs, a camera and burgundy silk."
        fill
        priority
        sizes="100vw"
        className="absolute inset-0 -z-30 object-cover object-[54%_50%]"
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(30,8,16,0.76)_0%,rgba(35,9,18,0.36)_34%,rgba(35,9,18,0.05)_62%,rgba(35,9,18,0.24)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-[27vh] bg-[linear-gradient(180deg,transparent_0%,rgba(30,8,15,0.72)_36%,rgba(31,8,15,0.98)_100%)]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col px-[clamp(1.25rem,5vw,7.5rem)] pb-7 pt-[calc(var(--nav-h)+1.5rem)] lg:pb-8 lg:pt-[calc(var(--nav-h)+2.25rem)]">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(31rem,0.52fr)_1fr]">
          <div className="max-w-[42rem] self-center lg:-mt-8">
            <div className="mb-6 flex items-center gap-4">
              <span className="h-px w-10 bg-[#C9A55A]" aria-hidden="true" />
              <span className="ed-label text-[#D2AF72]">More than a CRM</span>
            </div>

            <h1 className="ed-display text-[clamp(3.2rem,5.15vw,6.35rem)] font-medium leading-[0.88] text-[#FFF8EE]">
              <span className="block">A Season</span>
              <span className="block pl-[0.02em]">of Weddings.</span>
              <em className="block font-light leading-[0.9] text-[#E5C792]">
                A Lifetime
              </em>
              <span className="block pl-[0.08em]">of Stories.</span>
            </h1>

            <p className="mt-6 max-w-[37rem] text-[clamp(0.95rem,1.1vw,1.15rem)] font-medium leading-[1.65] text-[rgba(255,248,238,0.78)]">
              The all-in-one workspace for wedding photography studios, freelancers and clients. Manage
              inquiries, projects, shoots, payments and client galleries - beautifully, in one place.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link
                href="/contact"
                className="inline-flex h-14 min-w-[16.5rem] items-center justify-center gap-4 rounded-full border border-[rgba(231,190,124,0.28)] bg-[linear-gradient(180deg,#C75F8B_0%,#B54674_100%)] px-8 text-base font-bold text-white shadow-[0_18px_44px_rgba(174,61,103,0.42),inset_0_1px_0_rgba(255,255,255,0.2)] transition-transform hover:-translate-y-0.5"
              >
                Get Started Today
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>

            <dl className="mt-11 grid w-full max-w-[48rem] grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4 sm:gap-x-0 lg:w-[62vw] lg:max-w-[58rem] xl:w-[54vw]">
              {heroStats.map((item, index) => (
                <div
                  key={item.label}
                  className={`min-w-0 ${index > 0 ? 'sm:border-l sm:border-[rgba(255,248,238,0.35)] sm:pl-6 lg:pl-8 xl:pl-10' : ''} ${
                    index < heroStats.length - 1 ? 'sm:pr-6 lg:pr-8 xl:pr-10' : ''
                  }`}
                >
                  <dt className="font-[var(--font-display)] text-[clamp(1.9rem,2.05vw,2.55rem)] leading-none text-[#E7CA94]">
                    {item.value}
                  </dt>
                  <dd className="mt-2 max-w-[8rem] text-sm font-medium leading-snug text-[rgba(255,248,238,0.72)]">
                    {item.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative hidden min-h-[36rem] lg:block">
            <p className="absolute right-[4%] top-[4%] max-w-[18rem] rotate-[-9deg] font-[var(--font-display)] text-[2.55rem] italic leading-[1.05] text-[#D8B074] opacity-90">
              Capturing what forever feels like
            </p>
          </div>
        </div>

        <div className="relative mt-7 border-t border-[rgba(223,181,111,0.48)] pt-6">
          <div className="grid gap-5 md:grid-cols-4 lg:grid-cols-[1fr_1fr_1.2fr_1fr_auto]">
            {heroRails.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={`flex items-center gap-4 ${index > 0 ? 'md:border-l md:border-[rgba(255,248,238,0.18)] md:pl-8' : ''}`}
                >
                  <Icon className="h-8 w-8 text-[#E7CA94]" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-bold uppercase text-[#FFF8EE]">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-sm text-[rgba(255,248,238,0.62)]">{item.body}</span>
                  </span>
                </div>
              );
            })}

            <div className="hidden items-center justify-end gap-4 text-[0.72rem] font-bold uppercase text-[rgba(255,248,238,0.42)] lg:flex">
              <Mouse className="h-9 w-9 text-[#E7CA94]" aria-hidden="true" />
              <span>
                Scroll
                <br />
                to explore
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
