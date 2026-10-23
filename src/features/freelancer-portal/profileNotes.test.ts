import { describe, expect, it } from 'vitest';
import { composeNotes, parseNotes } from './profileNotes';

const JOIN_NOTES = 'Headline: Candid photographer\nBio: Ten years of weddings.\nSecond line of bio.\nPortfolio: https://x.test/me\nAvailability: Open to Work\nOpen to travel / outstation work.\nRates negotiable by project.';

describe('freelancer profile notes', () => {
  it('splits each field and keeps the lines it does not own', () => {
    const p = parseNotes(JOIN_NOTES);
    expect(p.fields).toEqual({ Headline: 'Candid photographer', Studio: '', Bio: 'Ten years of weddings.\nSecond line of bio.', Portfolio: 'https://x.test/me' });
    expect(p.extra).toBe('Availability: Open to Work\nOpen to travel / outstation work.\nRates negotiable by project.');
  });

  it('editing one field leaves every other field untouched', () => {
    const p = parseNotes(JOIN_NOTES);
    p.fields.Headline = 'Cinematic storyteller';
    const next = parseNotes(composeNotes(p));
    expect(next.fields.Headline).toBe('Cinematic storyteller');
    expect(next.fields.Bio).toBe('Ten years of weddings.\nSecond line of bio.');
    expect(next.fields.Portfolio).toBe('https://x.test/me');
    expect(next.extra).toContain('Open to travel');
  });

  it('round-trips and handles empty or missing notes', () => {
    expect(composeNotes(parseNotes(composeNotes(parseNotes(JOIN_NOTES))))).toBe(composeNotes(parseNotes(JOIN_NOTES)));
    expect(parseNotes(null).fields.Headline).toBe('');
    expect(composeNotes(parseNotes(''))).toBe('');
    expect(parseNotes('just a plain note').extra).toBe('just a plain note');
  });
});
