import { useEffect, useRef, useState } from 'react';
import { Plus, Save, Sheet, Trash2 } from 'lucide-react';
import { usePersonalSheet } from '@/hooks/usePersonalSheet';
import type { PersonalSheetData, SheetCellValue } from '@/lib/api/personalSheet';

const columnLabel = (index: number) => {
  let value = index + 1;
  let label = '';
  while (value > 0) {
    const remainder = (value - 1) % 26;
    label = String.fromCharCode(65 + remainder) + label;
    value = Math.floor((value - 1) / 26);
  }
  return label;
};

const rowId = () => `row-${crypto.randomUUID()}`;
const columnId = () => `column-${crypto.randomUUID()}`;

export function OwnerExcelSheet() {
  const { data: loadedSheet, loading, error, save } = usePersonalSheet();
  const [sheet, setSheet] = useState<PersonalSheetData | null>(null);
  const [status, setStatus] = useState('Saved');
  const sheetRef = useRef<PersonalSheetData | null>(null);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const changeVersionRef = useRef(0);
  const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null);
  const cellRefs = useRef(new Map<string, HTMLInputElement>());

  useEffect(() => {
    if (loadedSheet && !sheetRef.current) {
      sheetRef.current = loadedSheet;
      setSheet(loadedSheet);
      setStatus('Saved');
    }
  }, [loadedSheet]);

  const saveNow = async () => {
    const snapshot = sheetRef.current;
    if (!snapshot || !dirtyRef.current || savingRef.current) return;
    savingRef.current = true;
    const version = changeVersionRef.current;
    setStatus('Saving…');
    try {
      await save(snapshot);
      if (changeVersionRef.current === version) {
        dirtyRef.current = false;
        setStatus('Saved just now');
      } else {
        setStatus('Unsaved changes');
      }
    } catch {
      setStatus('Could not save — changes are kept locally');
    } finally {
      savingRef.current = false;
    }
  };

  const changeSheet = (next: PersonalSheetData) => {
    sheetRef.current = next;
    dirtyRef.current = true;
    changeVersionRef.current += 1;
    setSheet(next);
    setStatus('Unsaved changes');
  };

  const focusCell = (row: number, column: number) => {
    if (!sheet || row < 0 || column < 0 || row >= sheet.rows.length || column >= sheet.columns.length) return;
    const key = `${sheet.rows[row].id}:${sheet.columns[column].id}`;
    cellRefs.current.get(key)?.focus();
  };

  const updateCell = (rowIdValue: string, columnIdValue: string, input: string) => {
    if (!sheet) return;
    const value: SheetCellValue = input !== '' && /^-?(?:\d+|\d*\.\d+)$/.test(input) ? Number(input) : input;
    changeSheet({ ...sheet, rows: sheet.rows.map((row) => row.id === rowIdValue ? { ...row, cells: { ...row.cells, [columnIdValue]: value } } : row) });
  };

  if (loading && !sheet) return <section className="rounded-3xl border border-[#dfd9d2] bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">Loading Excel Sheet…</section>;
  if (error || !sheet) return <section className="rounded-3xl border border-[#dfd9d2] bg-white p-6 text-sm font-semibold text-rose-700 shadow-sm">{error?.message || 'Unable to load your Excel Sheet.'}</section>;

  return (
    <section className="space-y-4 rounded-3xl border border-[#dfd9d2] bg-white p-4 shadow-sm sm:p-6">
      <header className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-rose-700"><Sheet className="size-6" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-black text-slate-900">Excel Sheet</h3><span className="text-sm font-semibold text-slate-500">{status}</span></div>
            <p className="text-sm leading-relaxed text-slate-600">Private spreadsheet — changes stay on this screen until you press Save.</p>
          </div>
        </div>
        <button type="button" onClick={() => void saveNow()} disabled={!dirtyRef.current} className="flex items-center gap-2 rounded-xl bg-[#464B43] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#383D36] disabled:cursor-not-allowed disabled:opacity-50"><Save className="size-5" />Save</button>
      </header>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
        <span className="rounded bg-white px-2 py-1 shadow-sm">{selectedCell ? `${columnLabel(selectedCell.column)}${selectedCell.row + 1}` : 'Select a cell'}</span>
        <span className="h-5 w-px bg-slate-200" />
        <span>Enter moves down · Tab moves across · click headers to rename</span>
      </div>

      <div className="overflow-auto rounded-xl border border-slate-300 bg-white">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[#f3f1ef]">
            <tr><th className="w-12 border-b border-r border-slate-300 p-2 text-xs font-extrabold text-slate-500">#</th>{sheet.columns.map((column, index) => <th key={column.id} className="min-w-44 border-b border-r border-slate-300 p-1"><div className="flex items-center gap-1"><input aria-label={`Column ${index + 1} name`} value={column.label} onChange={(event) => changeSheet({ ...sheet, columns: sheet.columns.map((item) => item.id === column.id ? { ...item, label: event.target.value || columnLabel(index) } : item) })} className="min-w-0 flex-1 rounded-md bg-transparent px-2 py-1.5 text-center font-extrabold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-rose-300" /><button type="button" disabled={sheet.columns.length === 1} onClick={() => changeSheet({ ...sheet, columns: sheet.columns.filter((item) => item.id !== column.id), rows: sheet.rows.map((row) => { const { [column.id]: _removed, ...cells } = row.cells; return { ...row, cells }; }) })} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-30" title="Remove column"><Trash2 className="size-4" /></button></div></th>)}<th className="border-b border-slate-300 p-1"><button type="button" onClick={() => changeSheet({ ...sheet, columns: [...sheet.columns, { id: columnId(), label: columnLabel(sheet.columns.length) }] })} className="rounded-md p-2 text-rose-700 hover:bg-rose-50" title="Add column"><Plus className="size-5" /></button></th></tr>
          </thead>
          <tbody>{sheet.rows.map((row, rowIndex) => <tr key={row.id} className="group"><th className="border-b border-r border-slate-300 bg-[#f7f6f5] p-1 text-xs font-extrabold text-slate-500"><div className="flex items-center justify-center gap-1"><span>{rowIndex + 1}</span><button type="button" disabled={sheet.rows.length === 1} onClick={() => changeSheet({ ...sheet, rows: sheet.rows.filter((item) => item.id !== row.id) })} className="hidden rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700 group-hover:block disabled:cursor-not-allowed disabled:opacity-30" title="Remove row"><Trash2 className="size-3.5" /></button></div></th>{sheet.columns.map((column, columnIndex) => { const active = selectedCell?.row === rowIndex && selectedCell.column === columnIndex; const key = `${row.id}:${column.id}`; return <td key={column.id} className={`border-b border-r border-slate-300 p-0 ${active ? 'bg-rose-50' : 'bg-white'}`}><input ref={(element) => { if (element) cellRefs.current.set(key, element); else cellRefs.current.delete(key); }} aria-label={`${column.label} row ${rowIndex + 1}`} value={row.cells[column.id] ?? ''} onFocus={() => setSelectedCell({ row: rowIndex, column: columnIndex })} onChange={(event) => updateCell(row.id, column.id, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); focusCell(rowIndex + 1, columnIndex); } }} className={`h-10 w-full min-w-44 bg-transparent px-3 text-slate-800 outline-none ${active ? 'ring-2 ring-inset ring-[#464B43]' : 'focus:ring-2 focus:ring-inset focus:ring-rose-300'}`} /></td>; })}<td className="border-b border-slate-300" /></tr>)}</tbody>
        </table>
      </div>
      <button type="button" onClick={() => changeSheet({ ...sheet, rows: [...sheet.rows, { id: rowId(), cells: {} }] })} className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200"><Plus className="size-5" />Add Row</button>
    </section>
  );
}
