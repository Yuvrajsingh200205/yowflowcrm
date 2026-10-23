/**
 * A freelancer's headline, studio name, bio and portfolio links are stored together in the profile's
 * free-text `notes`, one `Key: value` per line. Editing one of them must never disturb the others
 * (or the lines the join form adds, such as availability), so the text is split and re-joined here.
 */
export const NOTE_KEYS = ['Headline', 'Studio', 'Bio', 'Portfolio'] as const;
export type NoteKey = (typeof NOTE_KEYS)[number];
export interface ParsedNotes { fields: Record<NoteKey, string>; extra: string }

const KEY_RE = new RegExp(`^(${NOTE_KEYS.join('|')}):\\s?(.*)$`);

export function parseNotes(notes: string | null | undefined): ParsedNotes {
  const fields: Record<NoteKey, string> = { Headline: '', Studio: '', Bio: '', Portfolio: '' };
  const extra: string[] = [];
  let current: NoteKey | 'extra' = 'extra';
  for (const line of (notes ?? '').split('\n')) {
    const m = KEY_RE.exec(line);
    if (m) { current = m[1] as NoteKey; fields[current] = m[2]; continue; }
    // A line with its own "Label: value" that is not ours starts the preserved block.
    if (/^[A-Z][A-Za-z ]{1,30}:\s/.test(line)) current = 'extra';
    if (current === 'extra') extra.push(line);
    else fields[current] += `\n${line}`;
  }
  for (const k of NOTE_KEYS) fields[k] = fields[k].trim();
  return { fields, extra: extra.join('\n').trim() };
}

export function composeNotes(parsed: ParsedNotes): string {
  const lines: string[] = [];
  for (const k of NOTE_KEYS) if (parsed.fields[k].trim()) lines.push(`${k}: ${parsed.fields[k].trim()}`);
  if (parsed.extra.trim()) lines.push(parsed.extra.trim());
  return lines.join('\n');
}
