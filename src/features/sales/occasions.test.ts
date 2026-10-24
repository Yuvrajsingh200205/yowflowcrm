import { describe, expect, it } from 'vitest';
import { eventTypeFor, occasionChips, occasionOf, OTHER_OCCASION, unitSuffix } from './occasions';
import { stepsFor } from './GettingStarted';

describe('occasions', () => {
  it('makes one chip per occasion, known ones first in a fixed order, then the studio’s own', () => {
    const chips = occasionChips([
      { category: 'Corporate & Events' }, { category: 'Wedding' }, { category: 'Wedding' }, { category: null }, { category: 'Birthday & Kids' }, { category: 'Fashion look-book' },
    ]);
    expect(chips.find((c) => c.label === 'Wedding')?.count).toBe(2);
    expect(chips.map((c) => c.label)).toEqual(['Wedding', 'Birthday & Kids', 'Corporate & Events', 'Fashion look-book', OTHER_OCCASION]);
  });

  it('files a package without a category under "My packages"', () => {
    expect(occasionOf({ category: '  ' })).toBe(OTHER_OCCASION);
    expect(occasionOf({ category: 'Wedding' })).toBe('Wedding');
  });

  it('knows what kind of event an occasion is, and falls back to what the package says', () => {
    expect(eventTypeFor('Wedding')).toBe('WEDDING');
    expect(eventTypeFor('Engagement & Roka')).toBe('ENGAGEMENT');
    expect(eventTypeFor('Birthday & Kids')).toBe('OTHER');
    expect(eventTypeFor('My look-book', { eventTypes: ['CORPORATE'] })).toBe('CORPORATE');
    expect(eventTypeFor('My look-book')).toBeNull();
  });

  it('says how a price is counted', () => {
    expect(unitSuffix({ pricingType: 'PER_DAY', unitLabel: 'day' })).toBe('per day');
    expect(unitSuffix({ pricingType: 'PER_PERSON', unitLabel: null })).toBe('per guest');
    expect(unitSuffix({ pricingType: 'FIXED', unitLabel: 'copy' })).toBe('per copy');
    expect(unitSuffix({ pricingType: 'FIXED', unitLabel: null })).toBe('');
  });
});

describe('get-started checklist', () => {
  const base = { packages: 0, addons: 0, examplePrices: 0, paymentDetails: false, businessPhone: false, bookingPageOn: false, slug: 'x' };
  const done = (r: typeof base) => stepsFor(r).map((s) => s.done);
  it('starts with nothing done, and asks for packages first', () => {
    expect(done(base)).toEqual([false, false, false, false]);
    expect(stepsFor(base)[1].hint).toMatch(/Add packages first/);
  });
  it('only counts prices as checked once packages exist and none are still examples', () => {
    expect(done({ ...base, packages: 5, examplePrices: 5 })).toEqual([true, false, false, false]);
    expect(stepsFor({ ...base, packages: 5, examplePrices: 1 })[1].hint).toBe('1 price is still an example.');
    expect(done({ ...base, packages: 5, examplePrices: 0 })).toEqual([true, true, false, false]);
  });
  it('needs both a phone number and a way to be paid', () => {
    expect(done({ ...base, businessPhone: true })[2]).toBe(false);
    expect(done({ ...base, paymentDetails: true })[2]).toBe(false);
    expect(done({ ...base, businessPhone: true, paymentDetails: true })[2]).toBe(true);
  });
});
