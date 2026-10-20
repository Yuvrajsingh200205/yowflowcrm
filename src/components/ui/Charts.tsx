'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Accessible SVG charts (no chart library).
 *  - One y-axis only. Thin marks, recessive grid, legend for ≥2 series (max 4, fixed order).
 *  - Crosshair/bar tooltip on hover AND keyboard focus; a table view is always available.
 *  - Series colours come from the validated --series-N tokens; a lone series uses the brand green.
 */
export type ChartSeries = { name: string; values: number[] };
type Props = {
  labels: string[];
  series: ChartSeries[];
  title: string;
  height?: number;
  format?: (n: number) => string;
  className?: string;
  loading?: boolean;
};

const W = 640;
const PAD = { t: 12, r: 12, b: 28, l: 44 };
const SERIES_VARS = ['--series-1', '--series-2', '--series-3', '--series-4'];
const color = (i: number, single: boolean) => (single ? 'var(--chart-single)' : `var(${SERIES_VARS[i % 4]})`);

function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

const defaultFmt = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);

function useGeometry({ labels, series, height = 260, format = defaultFmt }: Props) {
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const innerW = W - PAD.l - PAD.r;
  const innerH = height - PAD.t - PAD.b;
  const y = (v: number) => PAD.t + innerH - (v / max) * innerH;
  return { max, ticks, innerW, innerH, y, height, format, n: labels.length };
}

function Legend({ series }: { series: ChartSeries[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Legend">
      {series.map((s, i) => (
        <li key={s.name} className="flex items-center gap-2 text-xs text-fg-muted">
          <span className="size-2.5 rounded-sm" style={{ background: color(i, false) }} aria-hidden="true" />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function DataTable({ labels, series, format }: { labels: string[]; series: ChartSeries[]; format: (n: number) => string }) {
  return (
    <details className="mt-3 text-xs text-fg-muted">
      <summary className="w-fit cursor-pointer rounded px-1 py-0.5 font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-[var(--ring)]">View as table</summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-64 border-collapse text-left tabular">
          <thead>
            <tr>
              <th scope="col" className="border-b border-line py-1.5 pr-4 font-semibold text-fg">Period</th>
              {series.map((s) => <th key={s.name} scope="col" className="border-b border-line py-1.5 pr-4 text-right font-semibold text-fg">{s.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {labels.map((l, i) => (
              <tr key={l}>
                <th scope="row" className="border-b border-line-soft py-1.5 pr-4 font-normal">{l}</th>
                {series.map((s) => <td key={s.name} className="border-b border-line-soft py-1.5 pr-4 text-right text-fg">{format(s.values[i] ?? 0)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function Grid({ g, labels }: { g: ReturnType<typeof useGeometry>; labels: string[] }) {
  const step = Math.ceil(labels.length / 8);
  return (
    <>
      {g.ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={g.y(t)} y2={g.y(t)} stroke="var(--chart-grid)" strokeWidth="1" />
          <text x={PAD.l - 8} y={g.y(t) + 4} textAnchor="end" className="fill-[var(--text-muted)] text-[11px] tabular">{g.format(t)}</text>
        </g>
      ))}
      {labels.map((l, i) => i % step === 0 && (
        <text key={l} x={PAD.l + (g.innerW / g.n) * (i + 0.5)} y={g.height - 8} textAnchor="middle" className="fill-[var(--text-muted)] text-[11px]">{l}</text>
      ))}
    </>
  );
}

function Frame({ children, title, loading, className, legend, table }: { children: React.ReactNode; title: string; loading?: boolean; className?: string; legend: React.ReactNode; table: React.ReactNode }) {
  return (
    <figure className={cn('relative', className)} aria-label={title}>
      {legend}
      {loading ? <div className="h-64 animate-pulse rounded-[var(--radius-lg)] bg-surface-sunken motion-reduce:animate-none" role="status" aria-label="Loading chart" /> : children}
      {!loading && table}
    </figure>
  );
}

function Tip({ x, label, rows }: { x: number; label: string; rows: { name: string; value: string; color: string }[] }) {
  return (
    <div
      role="status"
      className="pointer-events-none absolute top-2 z-10 min-w-32 -translate-x-1/2 rounded-[var(--radius-md)] border border-line-soft bg-surface-raised px-3 py-2 text-xs shadow-[var(--elev-2)]"
      style={{ left: `clamp(70px, ${(x / W) * 100}%, calc(100% - 70px))` }}
    >
      <p className="mb-1 font-semibold text-fg">{label}</p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center justify-between gap-4 text-fg-muted">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden="true" />{r.name}</span>
          <span className="font-medium text-fg tabular">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function LineChart(props: Props) {
  const { labels, series, title, loading, className } = props;
  const g = useGeometry(props);
  const [active, setActive] = React.useState<number | null>(null);
  const single = series.length === 1;
  const xAt = (i: number) => PAD.l + (g.innerW / g.n) * (i + 0.5);
  return (
    <Frame title={title} loading={loading} className={className} legend={<Legend series={series} />} table={<DataTable labels={labels} series={series} format={g.format} />}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${g.height}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${title}. ${series.map((s) => s.name).join(', ')} across ${labels.length} periods. Use the table below for exact values.`}>
          <Grid g={g} labels={labels} />
          {series.map((s, i) => (
            <path key={s.name} d={s.values.map((v, k) => `${k ? 'L' : 'M'}${xAt(k)},${g.y(v)}`).join(' ')} fill="none" stroke={color(i, single)} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}
          {active !== null && (
            <g>
              <line x1={xAt(active)} x2={xAt(active)} y1={PAD.t} y2={PAD.t + g.innerH} stroke="var(--border-strong)" strokeWidth="1" />
              {series.map((s, i) => <circle key={s.name} cx={xAt(active)} cy={g.y(s.values[active] ?? 0)} r="4.5" fill={color(i, single)} stroke="var(--surface)" strokeWidth="2" />)}
            </g>
          )}
          {labels.map((l, i) => (
            <rect
              key={l}
              x={xAt(i) - g.innerW / g.n / 2}
              y={PAD.t}
              width={g.innerW / g.n}
              height={g.innerH}
              fill="transparent"
              tabIndex={0}
              role="img"
              aria-label={`${l}: ${series.map((s) => `${s.name} ${g.format(s.values[i] ?? 0)}`).join(', ')}`}
              className="outline-none focus-visible:stroke-[var(--ring)]"
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            />
          ))}
        </svg>
        {active !== null && <Tip x={xAt(active)} label={labels[active]} rows={series.map((s, i) => ({ name: s.name, value: g.format(s.values[active] ?? 0), color: color(i, single) }))} />}
      </div>
    </Frame>
  );
}

export function BarChart(props: Props) {
  const { labels, series, title, loading, className } = props;
  const g = useGeometry(props);
  const [active, setActive] = React.useState<number | null>(null);
  const single = series.length === 1;
  const slot = g.innerW / g.n;
  const group = slot * 0.62;
  const bw = Math.max(4, group / series.length - 2);
  const bx = (i: number, k: number) => PAD.l + slot * i + (slot - group) / 2 + k * (bw + 2);
  const bar = (x: number, v: number) => {
    const h = Math.max(0, g.y(0) - g.y(v)); const r = Math.min(4, bw / 2, h);
    const top = g.y(v);
    return h === 0 ? '' : `M${x},${g.y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${g.y(0)} Z`;
  };
  return (
    <Frame title={title} loading={loading} className={className} legend={<Legend series={series} />} table={<DataTable labels={labels} series={series} format={g.format} />}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${g.height}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${title}. ${series.map((s) => s.name).join(', ')} across ${labels.length} periods. Use the table below for exact values.`}>
          <Grid g={g} labels={labels} />
          {labels.map((l, i) => (
            <g key={l} opacity={active === null || active === i ? 1 : 0.55} style={{ transition: 'opacity var(--dur-base)' }}>
              {series.map((s, k) => <path key={s.name} d={bar(bx(i, k), s.values[i] ?? 0)} fill={color(k, single)} />)}
              <rect
                x={PAD.l + slot * i}
                y={PAD.t}
                width={slot}
                height={g.innerH}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${l}: ${series.map((s) => `${s.name} ${g.format(s.values[i] ?? 0)}`).join(', ')}`}
                className="outline-none focus-visible:stroke-[var(--ring)]"
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              />
            </g>
          ))}
        </svg>
        {active !== null && <Tip x={PAD.l + slot * (active + 0.5)} label={labels[active]} rows={series.map((s, i) => ({ name: s.name, value: g.format(s.values[active] ?? 0), color: color(i, single) }))} />}
      </div>
    </Frame>
  );
}
