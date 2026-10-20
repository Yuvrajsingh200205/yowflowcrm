import type { ChangeEvent, FormEvent } from 'react';
import type { LeadQuotationFile, OwnerLead } from '@/types';
import { ChevronDown, Download, Eye, FileText, Paperclip, Trash2, Upload } from 'lucide-react';
import { LeadModalShell } from './LeadModalShell';

interface LeadQuotationModalProps {
  lead: OwnerLead | null;
  fileName: string;
  fileType: string;
  notes: string;
  isOwner: boolean;
  userName: string;
  onClose: () => void;
  onPreview: (file: LeadQuotationFile, lead: OwnerLead) => void;
  onDelete: (leadId: string, quoteId: string, fileName?: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFileNameChange: (value: string) => void;
  onFileTypeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function LeadQuotationModal(props: LeadQuotationModalProps) {
  const { lead, fileName, fileType, notes, isOwner, userName, onClose, onPreview, onDelete, onFileChange, onFileNameChange, onFileTypeChange, onNotesChange, onSubmit } = props;
  if (!lead) return null;
  const files = lead.quotations || [];

  return (
    <LeadModalShell
      icon={Paperclip}
      eyebrow={`Lead #${lead.id.slice(-4)}`}
      title="Quotation Documents"
      description={<>Attached for <strong>{lead.clientName || 'Inquiry Record'}</strong> · {lead.mobile}</>}
      onClose={onClose}
      maxWidth="max-w-3xl"
    >
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[.12em] text-[#161A13]">Attached quotation files</h3>
            <p className="mt-1 text-sm text-[#766b6f]">Review, download or remove saved client quotations.</p>
          </div>
          <span className="rounded-full bg-[#eaf1f0] px-3 py-1 text-sm font-black text-[#1F2319]">{files.length}</span>
        </div>

        {files.length === 0 ? (
          <div className="grid min-h-36 place-items-center rounded-3xl border-2 border-dashed border-[#D3D6D1] bg-[#F9FCF3] p-6 text-center">
            <div><FileText className="mx-auto size-8 text-[#313929]" /><p className="mt-3 text-base font-bold text-[#554b4f]">No quotation files attached yet</p><p className="mt-1 text-sm text-[#83787c]">Upload a PDF, Word, Excel or image quotation below.</p></div>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <article key={file.id} className="flex flex-col gap-3 rounded-2xl border border-[#e0d4d2] bg-[#FAFCF5] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#1D2218] text-xs font-black uppercase text-white">{file.fileType || 'PDF'}</span>
                  <div className="min-w-0"><p className="truncate text-base font-extrabold text-[#352c30]">{file.fileName}</p><p className="mt-1 text-sm text-[#786e72]">{file.fileSize || '1.5 MB'} · Uploaded by <strong>{file.uploadedBy}</strong> on {file.uploadedDate}</p>{file.notes && <p className="mt-1 text-sm italic text-[#22271D]">“{file.notes}”</p>}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => onPreview(file, lead)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#1D2218] px-3 text-sm font-extrabold text-white transition hover:bg-[#171A13]"><Eye className="size-4" />View</button>
                  {file.fileUrl ? <a href={file.fileUrl} download={file.fileName} aria-label="Download quotation" className="grid size-10 place-items-center rounded-xl border border-[#d9ceca] bg-white text-[#5f4f55] transition hover:border-[#313929] hover:text-[#1F2319]"><Download className="size-4" /></a> : <button type="button" onClick={() => alert(`Simulated Download for ${file.fileName}`)} aria-label="Download quotation" className="grid size-10 place-items-center rounded-xl border border-[#d9ceca] bg-white text-[#5f4f55]"><Download className="size-4" /></button>}
                  {(isOwner || file.uploadedBy === userName) && <button type="button" onClick={() => onDelete(lead.id, file.id, file.fileName)} aria-label="Delete quotation" className="grid size-10 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"><Trash2 className="size-4" /></button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-[#e0d4d2] bg-[#F4F9EB] p-4 sm:p-5">
        <div><h3 className="flex items-center gap-2 text-base font-black text-[#131510]"><Upload className="size-5 text-[#477a67]" />Upload new quotation</h3><p className="mt-1 text-sm text-[#786e72]">Add the client-facing quotation and an optional internal note.</p></div>
        <label className="block text-sm font-extrabold text-[#4c4145]">Select quotation file <span className="mt-1 block text-xs font-medium text-[#84797d]">PDF, Word, Excel or image</span><input type="file" onChange={onFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" className="mt-2 w-full text-sm text-[#61565a] file:mr-3 file:rounded-xl file:border-0 file:bg-[#1D2218] file:px-4 file:py-2.5 file:text-sm file:font-extrabold file:text-white hover:file:bg-[#171A13]" /></label>
        <label className="block text-sm font-extrabold text-[#4c4145]">File name / reference name<input type="text" required placeholder="e.g. ClientName_Wedding_Quotation_v1.pdf" value={fileName} onChange={(event) => onFileNameChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#d9ceca] bg-white px-4 text-base font-semibold text-[#342d30] outline-none transition placeholder:text-[#aaa1a4] focus:border-[#2C3325] focus:ring-4 focus:ring-[#2C3325]/10" /></label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm font-extrabold text-[#4c4145]">Format type<div className="relative mt-2"><select value={fileType} onChange={(event) => onFileTypeChange(event.target.value)} className="min-h-12 w-full appearance-none rounded-xl border border-[#d9ceca] bg-white px-4 pr-10 text-base font-semibold text-[#342d30] outline-none focus:border-[#2C3325]"><option value="pdf">PDF Document</option><option value="excel">Excel Spreadsheet (.xlsx)</option><option value="word">Word File (.docx)</option><option value="image">Image / JPG Quote</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#20251B]" /></div></label>
          <label className="text-sm font-extrabold text-[#4c4145]">Quotation notes / discount<input type="text" placeholder="e.g. Includes 10% booking discount" value={notes} onChange={(event) => onNotesChange(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#d9ceca] bg-white px-4 text-base font-semibold outline-none placeholder:text-[#aaa1a4] focus:border-[#2C3325]" /></label>
        </div>
        <div className="flex justify-end border-t border-[#e2d8d4] pt-4"><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1D2218] px-5 text-sm font-black text-white shadow-lg shadow-[#1D2218]/15 transition hover:-translate-y-0.5 hover:bg-[#171A13]"><Upload className="size-4" />Save Quotation File</button></div>
      </form>
    </LeadModalShell>
  );
}
