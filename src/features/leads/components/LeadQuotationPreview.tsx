import { BRAND } from '@/config/brand';
import type { LeadQuotationFile, OwnerLead } from '@/types';
import type { ReactNode } from 'react';
import { Calendar, Download, FileText, IndianRupee, Mail, Phone, Printer } from 'lucide-react';
import { LeadModalShell } from './LeadModalShell';

interface LeadQuotationPreviewProps {
  preview: { file: LeadQuotationFile; lead: OwnerLead } | null;
  onClose: () => void;
}

export function LeadQuotationPreview({ preview, onClose }: LeadQuotationPreviewProps) {
  if (!preview) return null;
  const { file, lead } = preview;
  const budget = (lead.budgetEstimate || 0).toLocaleString('en-IN');
  const actions = <><button type="button" onClick={() => window.print()} className="grid size-10 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/90 transition hover:bg-white/15" title="Print quotation"><Printer className="size-4" /></button>{file.fileUrl && <a href={file.fileUrl} download={file.fileName} className="grid size-10 place-items-center rounded-xl border border-white/15 bg-black/15 text-white/90 transition hover:bg-white/15" title="Download quotation"><Download className="size-4" /></a>}</>;

  return (
    <LeadModalShell icon={FileText} eyebrow="Quotation Preview" title={file.fileName} description={<><strong>{lead.clientName || 'Inquiry Client'}</strong> · {lead.mobile}</>} onClose={onClose} actions={actions} maxWidth="max-w-5xl" zIndex="z-[60]" bodyClassName="space-y-5 bg-[#f4efec] p-4 sm:p-6">
      {file.fileUrl?.startsWith('data:image/') && <div className="flex justify-center rounded-2xl border border-[#ddd1cd] bg-white p-3 shadow-sm"><img src={file.fileUrl} alt={file.fileName} className="max-h-[60vh] rounded-xl object-contain" /></div>}
      {file.fileUrl?.startsWith('data:application/pdf') && <div className="h-[65vh] rounded-2xl border border-[#ddd1cd] bg-white p-2 shadow-sm"><iframe src={file.fileUrl} title={file.fileName} className="h-full w-full rounded-xl" /></div>}

      <article className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-[#ddd1cd] bg-white p-5 text-[#342d30] shadow-xl shadow-[#1a2a26]/5 sm:p-8">
        <header className="flex flex-col justify-between gap-4 border-b-2 border-[#253d37] pb-5 sm:flex-row sm:items-center">
          <div><p className="text-xs font-black uppercase tracking-[.18em] text-[#35665a]">Official Studio Quotation</p><h2 className="mt-1 text-2xl font-black tracking-tight text-[#2f272a]">{BRAND.name.toUpperCase()}</h2><p className="mt-1 text-sm font-semibold text-[#796e72]">Wedding Photography & Cinematography Studio</p></div>
          <div className="min-w-48 rounded-2xl border border-[#e1d6d2] bg-[#faf7f5] p-3 sm:text-right"><span className="text-xs font-extrabold uppercase text-[#8b7f83]">Quotation reference</span><p className="mt-1 font-mono text-sm font-black text-[#285147]">#QT-{lead.id.slice(-6).toUpperCase()}</p><p className="mt-1 text-sm font-semibold text-[#786e72]">Date: {file.uploadedDate}</p></div>
        </header>

        <section className="grid grid-cols-1 gap-4 rounded-2xl border border-[#d2e1de] bg-[#f6faf9] p-4 sm:grid-cols-2">
          <InfoBlock title="Prepared for"><p className="text-base font-black">{lead.clientName || 'Inquiry Client'}</p><p><Phone className="size-4" />{lead.mobile}</p>{lead.email && <p><Mail className="size-4" />{lead.email}</p>}</InfoBlock>
          <InfoBlock title="Event requirement"><p className="text-base font-black">{lead.eventType}</p><p><Calendar className="size-4" />{lead.eventDate || 'To be confirmed'}</p><p className="font-extrabold text-emerald-700"><IndianRupee className="size-4" />Estimated budget: ₹{budget}</p></InfoBlock>
        </section>

        <section className="space-y-3"><h3 className="text-sm font-black uppercase tracking-[.12em] text-[#233631]">Services & pricing summary</h3><div className="overflow-hidden rounded-2xl border border-[#ded4d0]"><table className="w-full text-left text-sm"><thead className="bg-[#253d37] text-white"><tr><th className="p-3.5">Service / package description</th><th className="p-3.5 text-right">Estimated amount</th></tr></thead><tbody><tr className="align-top"><td className="p-4"><p className="font-black">{lead.eventType} Photography & Videography Package</p><p className="mt-1.5 leading-relaxed text-[#776c70]">Traditional and candid photography, cinematic teaser, highlights and colour-retouched high-resolution photos.</p>{file.notes && <p className="mt-2 rounded-lg bg-[#edf3f2] p-2 font-semibold italic text-[#285147]">Note: “{file.notes}”</p>}</td><td className="p-4 text-right text-base font-black">₹{budget}</td></tr><tr className="border-t border-[#ded4d0] bg-[#faf7f5]"><td className="p-3 text-right text-xs font-black uppercase">Total estimated quote</td><td className="p-3 text-right text-lg font-black text-emerald-700">₹{budget}</td></tr></tbody></table></div></section>

        <footer className="grid grid-cols-1 gap-4 border-t border-[#e2d8d4] pt-4 text-sm md:grid-cols-2"><div className="space-y-1 text-[#665b5f]"><p className="font-black uppercase text-[#3c3336]">Payment schedule</p><p>• 30% advance on booking confirmation.</p><p>• 60% on the function or shoot date.</p><p>• 10% at final album handover.</p></div><div className="flex flex-col items-end justify-end text-right"><p className="font-semibold text-[#786e72]">Uploaded by {file.uploadedBy}</p><p className="mt-5 border-t border-[#cfc2be] px-4 pt-2 font-black">Authorized Signature & Seal</p></div></footer>
      </article>
    </LeadModalShell>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return <div className="space-y-1.5 text-sm text-[#5e5357] [&_p]:flex [&_p]:items-center [&_p]:gap-2"><p className="text-xs font-black uppercase tracking-wide text-[#285147]">{title}</p>{children}</div>;
}
