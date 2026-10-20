import { TextLink } from './Editorial';
import { Reveal } from './Reveal';
import { BRAND } from '@/config/brand';

/**
 * Honest placeholder for legal copy.
 *
 * The previous pages said "Placeholder route … replace with approved legal copy
 * before launch" in customer-facing body text. That note belongs to the team,
 * not the reader — so it is stated once, plainly, as a dated notice, and the
 * page points somewhere useful instead of pretending to be a policy.
 */
export function LegalNotice({ document }: { document: string }) {
  return (
    <Reveal className="max-w-[58ch]">
      <div className="border-l-2 border-[var(--ed-brass)] pl-6">
        <span className="ed-label text-[var(--ed-plum)]">Not yet published</span>
        <p className="mt-4 text-[0.9375rem] leading-[1.8] text-[var(--ed-on-paper)]">
          The final {document} is with counsel and will be published here before {BRAND.name} is
          generally available.
        </p>
        <p className="mt-4 text-[0.875rem] leading-[1.8] text-[var(--ed-on-paper-dim)]">
          Until then, nothing on this page should be read as a binding agreement. Studios onboarding during
          this period receive terms in writing, directly, and those terms govern.
        </p>
      </div>
      <div className="mt-10 border-t border-[var(--ed-rule-paper)] pt-6">
        <TextLink href="/contact">Ask for the current terms</TextLink>
      </div>
    </Reveal>
  );
}
