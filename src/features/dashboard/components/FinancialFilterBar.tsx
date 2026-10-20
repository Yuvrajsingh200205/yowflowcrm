import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface Props {
  fromDate: string;
  toDate: string;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
}

export function FinancialFilterBar({
  fromDate: finFromDate,
  toDate: finToDate,
  setFromDate: setFinFromDate,
  setToDate: setFinToDate,
}: Props) {
  const [tempFromDate, setTempFromDate] = useState(finFromDate);
  const [tempToDate, setTempToDate] = useState(finToDate);

  const handleApply = () => {
    setFinFromDate(tempFromDate);
    setFinToDate(tempToDate);
  };

  // Sync temp state if parent state changes (e.g. cleared)
  React.useEffect(() => {
    setTempFromDate(finFromDate);
    setTempToDate(finToDate);
  }, [finFromDate, finToDate]);

  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 md:flex-row md:items-center">
      {/* Left Title section */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-800">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-800">
            MONTHLY FINANCIAL & EXPENSE LEDGER
          </h3>
          <p className="text-xs font-medium text-slate-500">
            Select a date range to view total client payments received vs office expenses & staff salaries
          </p>
        </div>
      </div>

      {/* Right Date Filter Section */}
      <div className="flex items-center gap-3">
        {/* Divider for desktop */}
        <div className="hidden h-10 w-px bg-slate-200 md:block md:mx-2" />

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            DATE RANGE
          </span>
          
          <div className="flex items-center gap-2">
            {/* From Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-rose-800">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                value={tempFromDate}
                onChange={(e) => setTempFromDate(e.target.value)}
                placeholder="From"
                className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 shadow-2xs transition focus:border-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-700/20"
              />
            </div>

            <span className="text-slate-400 font-bold">–</span>

            {/* To Input */}
            <div className="relative flex items-center">
              <span className="absolute left-3 text-rose-800">
                <Calendar className="h-4 w-4" />
              </span>
              <input
                type="date"
                value={tempToDate}
                onChange={(e) => setTempToDate(e.target.value)}
                placeholder="To"
                className="h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-700 shadow-2xs transition focus:border-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-700/20"
              />
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={handleApply}
              className="h-10 rounded-xl bg-[#2F322D] hover:bg-[#252823] px-5 text-xs font-extrabold text-white transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

