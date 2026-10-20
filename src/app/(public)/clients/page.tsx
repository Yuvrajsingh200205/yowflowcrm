import Image from 'next/image';
import { Action, Container, Display, TextLink } from '@/features/landing/components/Editorial';
import { Reveal } from '@/features/landing/components/Reveal';

export const metadata = {
  title: 'For Clients',
  description: 'A calmer view of a wedding project: the days, the payments and the work still on its way.',
};

const moments = [
  { title: 'The project', body: 'Dates, venue and who at the studio is responsible for your wedding.' },
  { title: 'Payments', body: 'What has been received, and what is still due, held with the project.' },
  { title: 'Shoots', body: 'The days the studio has planned with you.' },
  { title: 'Documents', body: 'Notes and paperwork the studio keeps on that same record.' },
  { title: 'Deliverables', body: 'Selects, albums and films as they move through delivery.' },
  { title: 'The gallery', body: 'A place to see the photographs. Sign-in for couples is still being built.' },
];

export default function ClientsPage() {
  return (
    <>
      <header className="bg-[var(--ed-paper)]">
        <Container className="grid items-end gap-10 pb-8 pt-[clamp(8rem,14vw,11rem)] lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="ed-label text-[var(--ed-plum)]">For clients</p>
            <Display as="h1" step="ed-d1" className="mt-6 max-w-[14ch]">
              Your wedding, kept in one place.
            </Display>
          </div>
          <p className="max-w-[36ch] text-[0.9375rem] leading-[1.75] text-[var(--ed-on-paper-dim)] lg:col-span-4 lg:col-start-9">
            The studio holds the project. You should be able to see where it stands — without chasing a thread of messages.
          </p>
        </Container>
      </header>

      <section className="bg-[var(--ed-paper)]">
        <Container className="grid gap-14 pb-[clamp(4rem,8vw,6rem)] lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="text-[0.9375rem] leading-[1.75] text-[var(--ed-on-paper-dim)]">
              Client sign-in and the gallery are still being finished. The studio already tracks the moments below on your project.
            </p>
            <div className="mt-8">
              <Action href="/contact">Contact Us</Action>
            </div>
          </div>
          <ol className="relative border-l border-[var(--ed-rule-paper)] pl-8 lg:col-span-6 lg:col-start-7">
            {moments.map((moment, index) => (
              <Reveal as="li" key={moment.title} delay={index * 50} className="relative pb-10 last:pb-0">
                <span className="absolute -left-[2.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--ed-brass)]" aria-hidden="true" />
                <p className="ed-numeral text-[0.6875rem] text-[var(--ed-brass)]">{String(index + 1).padStart(2, '0')}</p>
                <h2 className="ed-display ed-d4 mt-2">{moment.title}</h2>
                <p className="mt-2 max-w-[36ch] text-[0.875rem] leading-[1.7] text-[var(--ed-on-paper-dim)]">{moment.body}</p>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="relative isolate min-h-[26rem] overflow-hidden">
        <Image
          src="/images/portrait-abstract.svg"
          alt="A quiet wedding portrait."
          fill
          sizes="100vw"
          className="object-cover object-[50%_28%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,12,15,0.78),rgba(20,12,15,0.2))]" />
        <Container className="relative flex min-h-[26rem] items-end py-14">
          <p className="ed-display max-w-[16ch] text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[#F7F1E8]">
            The photographs are the point. <em>The waiting should not be.</em>
          </p>
        </Container>
      </section>

      <section className="bg-[var(--ed-paper-2)]">
        <Container className="grid gap-8 py-16 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="ed-label text-[var(--ed-plum)]">Where this stands</p>
            <p className="mt-4 max-w-[48ch] text-[0.9375rem] leading-[1.75] text-[var(--ed-on-paper-dim)]">
              Your photographs come from your studio. If a gallery is late, the studio is the fastest way to it. We are building the couple’s own sign-in on the same record they already use.
            </p>
          </div>
          <div className="flex items-end lg:col-span-4 lg:col-start-9">
            <TextLink href="/client/login">Client sign-in</TextLink>
          </div>
        </Container>
      </section>
    </>
  );
}
