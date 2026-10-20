import React from 'react';
import { Project } from '@/types';
import { X, Printer, Camera } from 'lucide-react';
import { BRAND } from '@/config/brand';

interface InvoiceModalProps {
  project: Project | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ project, onClose }) => {
  if (!project) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-xl overflow-hidden my-6 max-h-[95vh] flex flex-col">
        
        {/* Modal Action Bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">
            Client Quotation & Payment Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs hover:bg-indigo-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-6 bg-white text-slate-900 overflow-y-auto space-y-5 print:p-0 print:bg-white print:text-black">
          
          {/* Studio Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 font-black text-xl tracking-tight">
                <Camera className="w-6 h-6 text-indigo-600" />
                <span>{BRAND.name}</span>
              </div>
              <p className="text-xs font-bold text-slate-700 mt-0.5">
                {BRAND.tagline}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {BRAND.domain}
              </p>
              <p className="text-[10px] text-slate-500">{BRAND.supportPhone ? `Phone: ${BRAND.supportPhone} | ` : ''}Email: {BRAND.supportEmail}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 font-bold text-[10px] uppercase border border-slate-200">
                OFFICIAL RECEIPT
              </span>
              <p className="text-xs font-mono font-bold text-slate-600 mt-1.5">
                Date: {new Date().toISOString().split('T')[0]}
              </p>
              <p className="text-[10px] font-mono text-slate-500">Project Ref: #{project.id.toUpperCase()}</p>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">CLIENT / WEDDING TITLE</span>
              <strong className="text-xs text-slate-900 block font-bold">{project.clientWeddingTitle}</strong>
              <p className="text-slate-600 mt-0.5 text-[11px]">Mobile: {project.clientContactMobile || 'N/A'}</p>
              <p className="text-slate-600 text-[11px]">Venue: {project.venueLocation || 'N/A'}</p>
            </div>

            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">SERVICE & DATES</span>
              <strong className="text-xs text-slate-900 block font-bold">{project.primaryServiceType}</strong>
              <p className="text-slate-600 mt-0.5 text-[11px]">Function Dates: {project.weddingFunctionDates || 'N/A'}</p>
              <p className="text-slate-600 text-[11px]">Final Delivery: {project.finalDeliveryDeadline || 'N/A'}</p>
            </div>
          </div>

          {/* Budget Breakdown Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[9px]">
                <tr>
                  <th className="py-2 px-3">Service Description</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-slate-900 block text-xs">{project.primaryServiceType} Package</span>
                    <span className="text-slate-500 text-[10px]">
                      Cinematic Wedding Films, High-Res Candid Photography, Teaser, Reels, RAW Data & Printed Albums
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900 text-xs">
                    ₹{project.totalBudget.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payments Received Summary */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Payment Collection Summary</h4>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-600 text-[11px]">Total Agreed Budget:</span>
              <span className="font-bold text-slate-900">₹{project.totalBudget.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-green-700 font-bold text-[11px]">Total Advance & Installments Received:</span>
              <span className="font-bold text-green-700">₹{project.advanceReceived.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 pt-1.5 text-xs">
              <span className="font-bold text-red-600">Balance Due Amount:</span>
              <span className="font-black text-red-600">₹{project.balanceDue.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Terms & Signature */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
            <div>
              <p className="font-bold text-slate-700 mb-0.5">Terms & Conditions:</p>
              <p>• 100% balance payment must be cleared prior to final high-resolution deliverable handover.</p>
              <p>• Album printing proofs approved by client will be processed at the print lab.</p>
            </div>

            <div className="text-center">
              <div className="font-bold text-slate-900 text-xs italic font-serif">Alex Morgan</div>
              <p className="text-[9px] text-slate-500 border-t border-slate-300 pt-0.5 mt-0.5 font-semibold">
                Authorized Signature • {BRAND.name}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

