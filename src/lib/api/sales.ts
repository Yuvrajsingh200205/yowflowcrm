import { apiBaseUrl, apiBlobRequest, apiRequest, type ApiMeta } from './client';
import type { BackendProjectType } from './leads';

/**
 * Quote-in-seconds: the studio's price list, booking page, quotes and availability.
 * Staff calls need a session; everything under `publicSalesApi` is anonymous and addressed by slug or token.
 */

export type EventType = BackendProjectType;
export type CatalogKind = 'PACKAGE' | 'ADDON';
export type PricingType = 'FIXED' | 'PER_DAY' | 'PER_PERSON';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type QuoteViewState = 'NOT_SENT' | 'NOT_OPENED' | 'OPENED';
export type AutoQuoteMode = 'OFF' | 'APPROVAL' | 'AUTO';
export type SendChannel = 'EMAIL' | 'LINK' | 'WHATSAPP';
export type DayStatus = 'AVAILABLE' | 'LIMITED' | 'FULL' | 'CLOSED' | 'PAST' | 'TOO_SOON' | 'TOO_FAR';

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  ROKA: 'Roka',
  ENGAGEMENT: 'Engagement',
  PRE_WEDDING: 'Pre-wedding',
  WEDDING: 'Wedding',
  COMPLETE_WEDDING_SERVICES: 'Complete wedding services',
  HALDI_MEHENDI: 'Haldi & Mehendi',
  SANGEET: 'Sangeet',
  RECEPTION: 'Reception',
  ANNIVERSARY: 'Anniversary',
  CORPORATE: 'Corporate',
  OTHER: 'Other',
};
export const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[];

// ── Catalogue ───────────────────────────────────────────────────────────────
export interface CatalogItem {
  id: string;
  kind: CatalogKind;
  name: string;
  description: string | null;
  category: string | null;
  inclusions: string[];
  pricingType: PricingType;
  unitPrice: number;
  unitLabel: string | null;
  taxRate: number;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number | null;
  eventTypes: EventType[];
  isActive: boolean;
  isPublic: boolean;
  isPopular: boolean;
  /** Added from the ready-made library and not yet checked: the price is only an example. */
  isExample: boolean;
  templateKey: string | null;
  sortOrder: number;
}

export type CatalogInput = Omit<CatalogItem, 'id'>;

// ── Ready-made library and quick quote ─────────────────────────────────────
export interface TemplateGroup { id: string; label: string; eventTypes: EventType[]; blurb: string }
export interface TemplateItem {
  key: string;
  group: string;
  kind: CatalogKind;
  name: string;
  description: string;
  inclusions: string[];
  pricingType: PricingType;
  unitPrice: number;
  unitLabel: string | null;
  taxRate: number;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number | null;
  isPopular: boolean;
  inDefaultKit: boolean;
  /** The studio already has this one. */
  added: boolean;
}
export interface Readiness {
  packages: number;
  addons: number;
  /** Items whose price is still only an example. */
  examplePrices: number;
  paymentDetails: boolean;
  businessPhone: boolean;
  bookingPageOn: boolean;
  slug: string;
}
export interface QuickQuoteInput {
  name: string;
  phone: string;
  email?: string | null;
  eventType?: EventType | null;
  eventDate?: string | null;
  eventDays?: number;
  guestCount?: number | null;
  venueCity?: string | null;
  packageId?: string | null;
  addonIds?: string[];
  /** Instead of a package: one line the studio prices itself. */
  custom?: { service: string; unitPrice: number; taxRate?: number };
}
export interface QuickQuoteResult { id: string; quotationNumber: string; grandTotal: number; status: QuoteStatus; leadId: string; reusedLead: boolean }

// ── Settings ────────────────────────────────────────────────────────────────
export interface SalesSettings {
  business: {
    name: string; slug: string; legalName: string | null; email: string | null; phone: string | null; website: string | null; gstNumber: string | null;
    panNumber: string | null; addressLine: string | null; city: string | null; state: string | null; postalCode: string | null; timezone: string;
  };
  upiId: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  defaultTerms: string | null;
  brandColor: string | null;
  quoteValidDays: number;
  advancePercent: number;
  balanceDueDaysBefore: number;
  capacityPerDay: number;
  minLeadDays: number;
  maxAdvanceDays: number;
  remindersEnabled: boolean;
  remindersEmailClients: boolean;
}
/** What the setup screens can change: the settings themselves plus the studio contact details printed beside them. */
export type SalesSettingsInput = Partial<Omit<SalesSettings, 'business'>> &
  Partial<Pick<SalesSettings['business'], 'gstNumber' | 'phone' | 'email' | 'website' | 'addressLine' | 'city' | 'state' | 'postalCode'>>;

export interface EnquiryPageSettings {
  slug: string;
  isEnabled: boolean;
  headline: string;
  intro: string;
  thankYouMessage: string;
  autoQuoteMode: AutoQuoteMode;
  showPrices: boolean;
  askGuestCount: boolean;
  askVenue: boolean;
  eventTypes: EventType[];
}
export type EnquiryPageInput = Partial<Omit<EnquiryPageSettings, 'slug'>>;

export interface BlockedDate { id: string; startDate: string; endDate: string; reason: string | null }

export interface CalendarDay {
  date: string;
  status: DayStatus;
  booked: number;
  capacity: number;
  bookings?: Array<{ projectId: string; projectNumber: string; name: string }>;
  closedReason?: string | null;
}
export interface CalendarResult { settings: { capacityPerDay: number; minLeadDays: number; maxAdvanceDays: number; timezone: string }; days: CalendarDay[] }
export interface DateCheck { date: string; status: DayStatus; booked: number; capacity: number; sellable: boolean; reason: string }

// ── Quotes (staff) ──────────────────────────────────────────────────────────
export interface QuoteItem {
  id: string;
  service: string;
  description: string | null;
  inclusions: string[];
  kind: 'PACKAGE' | 'ADDON' | 'CUSTOM';
  catalogItemId: string | null;
  isOptional: boolean;
  isSelected: boolean;
  pricingType: PricingType;
  unitLabel: string | null;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number | null;
  quantity: number | string;
  unitPrice: number | string;
  discountAmount: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  lineTotal: number | string;
  sortOrder: number;
}

export interface QuoteSummary {
  id: string;
  quotationNumber: string;
  status: QuoteStatus;
  effectiveStatus: QuoteStatus;
  viewState: QuoteViewState;
  needsReview: boolean;
  autoGenerated: boolean;
  issueDate: string;
  validUntil: string | null;
  grandTotal: number | string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  eventType: EventType | null;
  eventDate: string | null;
  sentAt: string | null;
  sentVia: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  acceptedAt: string | null;
  lead: { id: string; name: string; phone: string } | null;
  client: { id: string; displayName: string; clientCode: string } | null;
  project: { id: string; projectNumber: string; name: string } | null;
  _count: { items: number };
}

export interface QuoteDetail extends Omit<QuoteSummary, '_count' | 'client' | 'lead' | 'project'> {
  eventDays: number;
  guestCount: number | null;
  venueName: string | null;
  venueCity: string | null;
  advancePercent: number | null;
  balanceDueDaysBefore: number | null;
  notes: string | null;
  termsAndConditions: string | null;
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  declinedAt: string | null;
  declineReason: string | null;
  acceptedByName: string | null;
  firstViewedAt: string | null;
  items: QuoteItem[];
  lead: { id: string; name: string; phone: string; email: string | null; status: string } | null;
  client: { id: string; displayName: string; clientCode?: string } | null;
  project: { id: string; projectNumber: string; name: string } | null;
  createdBy: { id: string; fullName: string } | null;
  publicUrl: string | null;
  publicPreviewUrl: string | null;
}

export interface QuoteLineInput {
  service: string;
  description?: string | null;
  inclusions?: string[];
  kind?: 'PACKAGE' | 'ADDON' | 'CUSTOM';
  catalogItemId?: string | null;
  isOptional?: boolean;
  isSelected?: boolean;
  pricingType?: PricingType;
  unitLabel?: string | null;
  allowQuantity?: boolean;
  minQuantity?: number;
  maxQuantity?: number | null;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
}

export interface QuoteHeaderInput {
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  eventType?: EventType | null;
  eventDate?: string | null;
  eventDays?: number;
  guestCount?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  advancePercent?: number | null;
  balanceDueDaysBefore?: number | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  validUntil?: string | null;
}
export type QuoteUpdateInput = QuoteHeaderInput & { items?: QuoteLineInput[]; discountAmount?: number };

export interface QuoteFromLeadInput {
  leadId: string;
  packageId?: string | null;
  addons?: Array<{ id: string; quantity?: number }>;
  customLines?: QuoteLineInput[];
  eventDate?: string | null;
  eventDays?: number;
  guestCount?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  discountAmount?: number;
  notes?: string | null;
  validDays?: number;
  advancePercent?: number;
}

export interface QuoteListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: QuoteStatus;
  leadId?: string;
  needsReview?: boolean;
}

export type QuoteEventType = 'CREATED' | 'APPROVED' | 'SENT' | 'VIEWED' | 'REVISED' | 'ACCEPTED' | 'DECLINED' | 'MESSAGE_RECEIVED' | 'REMINDER_SENT' | 'EXPIRED' | 'BOOKED';
export interface QuoteEvent { id: string; type: QuoteEventType; actorType: 'STAFF' | 'CLIENT' | 'SYSTEM'; meta: Record<string, unknown> | null; createdAt: string }

export interface SendResult { quotation: { id: string; status: QuoteStatus }; publicUrl: string; emailed: boolean; whatsappUrl: string | null }
export interface BookingResult {
  projectId: string;
  projectNumber: string;
  clientId: string;
  alreadyBooked: boolean;
  advanceAmount: number;
  milestones: Array<{ title: string; amount: number; dueDate: string }>;
}

export interface TodayQuoteRow { id: string; number: string; customer: string | null; total: number; hint: string; viewCount: number; whatsappUrl: string | null }
export interface TodayList {
  toReview: TodayQuoteRow[];
  notOpened: TodayQuoteRow[];
  openedNotAccepted: TodayQuoteRow[];
  expiringSoon: TodayQuoteRow[];
  payments: Array<{ id: string; projectId: string; project: string; client: string; title: string; amount: number; dueDate: string; daysUntil: number; overdue: boolean; whatsappUrl: string | null }>;
  followUps: Array<{ id: string; name: string; phone: string; dueAt: string | null; eventDate: string | null; whatsappUrl: string | null }>;
}

// ── Public ──────────────────────────────────────────────────────────────────
export interface PublicCatalogItem {
  id: string;
  kind: CatalogKind;
  name: string;
  description: string | null;
  category: string | null;
  inclusions: string[];
  pricingType: PricingType;
  unitLabel: string | null;
  isPopular: boolean;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number | null;
  eventTypes: EventType[];
  unitPrice: number | null;
  taxRate: number | null;
}

export interface PublicEnquiryPage {
  studio: { name: string; slug: string; phone: string | null; email: string | null; website: string | null; city: string | null; brandColor: string | null };
  page: { headline: string; intro: string | null; askGuestCount: boolean; askVenue: boolean; showPrices: boolean; quoteMode: AutoQuoteMode; eventTypes: EventType[] };
  packages: PublicCatalogItem[];
  addons: PublicCatalogItem[];
  rules: { minLeadDays: number; maxAdvanceDays: number; today: string };
}

export interface PublicDay { date: string; status: DayStatus; bookable: boolean }

export interface EnquiryInput {
  name: string;
  phone: string;
  email?: string | null;
  eventType: EventType;
  eventDate: string;
  eventDays?: number;
  guestCount?: number | null;
  venueName?: string | null;
  venueCity?: string | null;
  packageId?: string | null;
  addonIds?: string[];
  notes?: string | null;
  consent: true;
  website?: string;
}
export interface EnquiryResult { received: boolean; message: string; quoteToken: string | null }

export interface PublicQuoteItem {
  id: string;
  kind: 'PACKAGE' | 'ADDON' | 'CUSTOM';
  service: string;
  description: string | null;
  inclusions: string[];
  isOptional: boolean;
  isSelected: boolean;
  allowQuantity: boolean;
  minQuantity: number;
  maxQuantity: number | null;
  pricingType: PricingType;
  unitLabel: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountAmount: number;
  lineTotal: number;
}
export interface PaymentPlanStep { title: string; amount: number; dueDate: string }
export interface PublicPayment {
  amount: number;
  upiId: string | null;
  upiLink: string | null;
  bank: { accountName: string | null; bankName: string | null; accountNumber: string; ifsc: string | null } | null;
}
export interface PublicQuote {
  studio: { name: string; phone: string | null; email: string | null; website: string | null; gstNumber: string | null; address: string | null; brandColor: string | null };
  quote: {
    number: string;
    status: QuoteStatus;
    issueDate: string;
    validUntil: string | null;
    daysLeft: number | null;
    customerName: string | null;
    eventType: EventType | null;
    eventDate: string | null;
    eventDays: number;
    guestCount: number | null;
    venueName: string | null;
    venueCity: string | null;
    notes: string | null;
    terms: string | null;
    items: PublicQuoteItem[];
    totals: { subtotal: number; discount: number; tax: number; total: number };
    advancePercent: number;
    paymentPlan: PaymentPlanStep[];
    acceptedAt: string | null;
    acceptedByName: string | null;
    declinedAt: string | null;
  };
  canAct: boolean;
  dateStatus: { status: string; sellable: boolean; reason: string } | null;
  payment: PublicPayment | null;
}
export interface SelectionInput { itemId: string; selected?: boolean; quantity?: number }
export interface AcceptResult {
  accepted: boolean;
  already: boolean;
  quote: PublicQuote['quote'];
  payment: PublicPayment | null;
  studio: PublicQuote['studio'];
  booking?: { advanceAmount: number | string };
}

const query = (params: Record<string, string | number | boolean | undefined | null>) => {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') out.set(k, String(v));
  const s = out.toString();
  return s ? `?${s}` : '';
};
const json = (body: unknown) => ({ body: JSON.stringify(body) });
const enc = encodeURIComponent;

/** Plain numbers for amounts that arrive as decimal strings. */
export const num = (v: number | string | null | undefined): number => {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

// ── Staff API ───────────────────────────────────────────────────────────────
export const catalogApi = {
  list: async (q: { kind?: CatalogKind; active?: boolean; search?: string } = {}) =>
    (await apiRequest<CatalogItem[]>(`/catalog${query({ kind: q.kind, active: q.active === undefined ? undefined : String(q.active), search: q.search })}`, { fresh: true })).data,
  create: async (input: Partial<CatalogInput>) => (await apiRequest<CatalogItem>('/catalog', { method: 'POST', ...json(input) })).data,
  update: async (id: string, input: Partial<CatalogInput>) => (await apiRequest<CatalogItem>(`/catalog/${enc(id)}`, { method: 'PATCH', ...json(input) })).data,
  remove: async (id: string) => { await apiRequest<void>(`/catalog/${enc(id)}`, { method: 'DELETE' }); },
  seedStarter: async () => (await apiRequest<CatalogItem[]>('/catalog/starter', { method: 'POST' })).data,
};

export const templatesApi = {
  list: async () => (await apiRequest<{ groups: TemplateGroup[]; items: TemplateItem[] }>('/catalog/templates', { fresh: true })).data,
  add: async (keys: string[]) => (await apiRequest<{ added: number; skipped: number }>('/catalog/templates/import', { method: 'POST', ...json({ keys }) })).data,
  confirmPrices: async () => (await apiRequest<{ confirmed: number }>('/catalog/templates/confirm-prices', { method: 'POST' })).data,
};

export const salesSetupApi = {
  readiness: async () => (await apiRequest<Readiness>('/sales-setup/readiness', { fresh: true })).data,
  settings: async () => (await apiRequest<SalesSettings>('/sales-setup/settings', { fresh: true })).data,
  updateSettings: async (input: SalesSettingsInput) => (await apiRequest<SalesSettings>('/sales-setup/settings', { method: 'PUT', ...json(input) })).data,
  enquiryPage: async () => (await apiRequest<EnquiryPageSettings>('/sales-setup/enquiry-page', { fresh: true })).data,
  updateEnquiryPage: async (input: EnquiryPageInput) => (await apiRequest<EnquiryPageSettings>('/sales-setup/enquiry-page', { method: 'PUT', ...json(input) })).data,
  blockedDates: async (from?: string, to?: string) => (await apiRequest<BlockedDate[]>(`/sales-setup/blocked-dates${query({ from, to })}`, { fresh: true })).data,
  blockDates: async (input: { startDate: string; endDate: string; reason?: string | null }) => (await apiRequest<BlockedDate>('/sales-setup/blocked-dates', { method: 'POST', ...json(input) })).data,
  unblock: async (id: string) => { await apiRequest<void>(`/sales-setup/blocked-dates/${enc(id)}`, { method: 'DELETE' }); },
  calendar: async (from: string, to: string) => (await apiRequest<CalendarResult>(`/sales-setup/availability${query({ from, to })}`, { fresh: true })).data,
  checkDate: async (date: string, excludeProjectId?: string) => (await apiRequest<DateCheck>(`/sales-setup/availability/check${query({ date, excludeProjectId })}`, { fresh: true })).data,
};

export const quotesApi = {
  list: async (q: QuoteListQuery = {}): Promise<{ data: QuoteSummary[]; meta: ApiMeta }> => apiRequest<QuoteSummary[]>(`/quotations${query({ ...q, needsReview: q.needsReview === undefined ? undefined : String(q.needsReview), sortBy: 'createdAt', sortOrder: 'desc' })}`, { fresh: true }),
  get: async (id: string) => (await apiRequest<QuoteDetail>(`/quotations/${enc(id)}`, { fresh: true })).data,
  events: async (id: string) => (await apiRequest<QuoteEvent[]>(`/quotations/${enc(id)}/events`, { fresh: true })).data,
  quick: async (input: QuickQuoteInput) => (await apiRequest<QuickQuoteResult>('/quotations/quick', { method: 'POST', ...json(input) })).data,
  today: async () => (await apiRequest<TodayList>('/quotations/today', { fresh: true })).data,
  fromLead: async (input: QuoteFromLeadInput) => (await apiRequest<{ id: string; quotationNumber: string; grandTotal: number | string; status: QuoteStatus }>('/quotations/from-lead', { method: 'POST', ...json(input) })).data,
  update: async (id: string, input: QuoteUpdateInput) => (await apiRequest<QuoteDetail>(`/quotations/${enc(id)}`, { method: 'PATCH', ...json(input) })).data,
  send: async (id: string, channel: SendChannel) => (await apiRequest<SendResult>(`/quotations/${enc(id)}/send`, { method: 'POST', ...json({ channel }) })).data,
  convert: async (id: string, overrideAvailability?: boolean) => (await apiRequest<BookingResult>(`/quotations/${enc(id)}/convert`, { method: 'POST', ...json({ overrideAvailability }) })).data,
  preview: async (id: string) => (await apiRequest<PublicQuote>(`/quotations/${enc(id)}/preview`, { fresh: true })).data,
  cancel: async (id: string) => (await apiRequest<unknown>(`/quotations/${enc(id)}/status`, { method: 'PATCH', ...json({ status: 'CANCELLED' }) })).data,
  pdf: (id: string) => apiBlobRequest(`/quotations/${enc(id)}/pdf`),
};

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate: string | null;
  total: number | string;
  amountPaid: number | string;
  amountDue: number | string;
}

/** The invoices a booking creates, shown beside the quote they came from. */
export const invoicesApi = {
  forProject: async (projectId: string) => (await apiRequest<InvoiceRow[]>(`/invoices${query({ projectId, limit: 20 })}`, { fresh: true })).data,
  markIssued: async (id: string) => (await apiRequest<InvoiceRow>(`/invoices/${enc(id)}/status`, { method: 'PATCH', ...json({ status: 'SENT' }) })).data,
  pdf: (id: string) => apiBlobRequest(`/invoices/${enc(id)}/pdf`),
};

// ── Public API (no session) ─────────────────────────────────────────────────
export const publicSalesApi = {
  page: async (slug: string) => (await apiRequest<PublicEnquiryPage>(`/public/enquiry/${enc(slug)}`, { fresh: true })).data,
  availability: async (slug: string, from: string, to: string) => (await apiRequest<{ days: PublicDay[] }>(`/public/enquiry/${enc(slug)}/availability${query({ from, to })}`)).data.days,
  submit: async (slug: string, input: EnquiryInput) => (await apiRequest<EnquiryResult>(`/public/enquiry/${enc(slug)}`, { method: 'POST', ...json(input) })).data,
  quote: async (token: string, opts: { preview?: boolean } = {}) => (await apiRequest<PublicQuote>(`/public/quotes/${enc(token)}${opts.preview ? '?preview=1' : ''}`, { fresh: true })).data,
  price: async (token: string, selection: SelectionInput[]) => (await apiRequest<PublicQuote>(`/public/quotes/${enc(token)}/price`, { method: 'POST', ...json({ selection }) })).data,
  accept: async (token: string, input: { name: string; agree: true; selection?: SelectionInput[] }) => (await apiRequest<AcceptResult>(`/public/quotes/${enc(token)}/accept`, { method: 'POST', ...json(input) })).data,
  decline: async (token: string, reason?: string) => (await apiRequest<{ declined: boolean }>(`/public/quotes/${enc(token)}/decline`, { method: 'POST', ...json({ reason: reason?.trim() || null }) })).data,
  message: async (token: string, input: { message: string; name?: string | null; phone?: string | null }) => (await apiRequest<{ sent: boolean }>(`/public/quotes/${enc(token)}/message`, { method: 'POST', ...json(input) })).data,
  /** The PDF is a plain GET, so a link works for everyone, signed in or not. */
  pdfUrl: (token: string) => `${apiBaseUrl()}/public/quotes/${enc(token)}/pdf`,
};
