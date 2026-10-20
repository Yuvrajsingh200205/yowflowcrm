import React, { useEffect, useState } from 'react';
import { Freelancer, FreelancerAssignment, Project } from '@/types';
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';

interface ShootCalendarViewProps {
  assignments: FreelancerAssignment[];
  freelancers: Freelancer[];
  projects?: Project[];
  focusDate?: string;
  onAssignShoot?: () => void;
}

export const ShootCalendarView: React.FC<ShootCalendarViewProps> = ({
  assignments,
  freelancers,
  projects = [],
  focusDate,
  onAssignShoot,
}) => {
  // Calendar Month State (Year-Month)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(focusDate || new Date().toISOString().split('T')[0]);
  const [calView, setCalView] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    if (!focusDate) return;
    setSelectedDateStr(focusDate);
    setCurrentDate(new Date(`${focusDate}T00:00:00`));
  }, [focusDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map assignments by YYYY-MM-DD
  const assignmentsByDate: Record<string, FreelancerAssignment[]> = {};
  assignments.forEach((a) => {
    if (!assignmentsByDate[a.shootDate]) {
      assignmentsByDate[a.shootDate] = [];
    }
    assignmentsByDate[a.shootDate].push(a);
  });

  const dateAssignments = assignmentsByDate[selectedDateStr] || [];
  const selectedAsDate = new Date(`${selectedDateStr}T00:00:00`);
  const weekStart = new Date(selectedAsDate);
  weekStart.setDate(selectedAsDate.getDate() - selectedAsDate.getDay());
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="space-y-6">
      {/* Calendar Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2f5f54] flex items-center justify-center font-bold text-white shadow-xs">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Shoot Calendar & Availability</h2>
            <p className="text-xs text-slate-500">Visual schedule of freelancer shoots, events & double-booking alerts</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-extrabold text-sm text-slate-900 w-36 text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="ml-2 flex rounded-xl border border-[#e2d9d3] bg-[#f6f1ee] p-1">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setCalView(v)}
                className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold capitalize ${calView === v ? 'bg-white text-[#254b42] shadow-sm' : 'text-slate-600'}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 Cols wide on desktop) */}
        <div className={`lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 ${calView === 'day' ? 'hidden lg:hidden' : ''}`}>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading days */}
            {calView === 'month' &&
              Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-20 bg-slate-50/40 rounded-xl border border-transparent" />
              ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
              const formattedMonth = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
              const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
              if (calView === 'week' && !weekDates.includes(dateStr)) return null;

              const dayAssignments = assignmentsByDate[dateStr] || [];
              const isSelected = selectedDateStr === dateStr;

              // Check if any freelancer is double-booked on this day
              const flIdsOnDay = dayAssignments.map((a) => a.freelancerId);
              const hasDoubleBooking = flIdsOnDay.some((id, i) => flIdsOnDay.indexOf(id) !== i);

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`min-h-20 p-1.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-rose-50 border-[#2f5f54] ring-2 ring-rose-200'
                      : dayAssignments.length > 0
                      ? 'bg-white border-rose-200 hover:border-[#8ac4b6] shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-[#2f5f54] text-white font-extrabold' : 'text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </span>

                    {hasDoubleBooking && (
                      <span title="Double Booking Detected!" className="p-0.5 bg-red-100 text-red-600 rounded-full">
                        <ShieldAlert className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-1">
                    {dayAssignments.slice(0, 2).map((a, aIdx) => (
                      <div
                        key={aIdx}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate ${
                          a.assignmentStatus === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : a.assignmentStatus === 'confirmed'
                            ? 'bg-rose-50 text-[#253d37]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {a.freelancerName.split(' ')[0]}: {a.eventName}
                      </div>
                    ))}
                    {dayAssignments.length > 2 && (
                      <span className="text-[9px] font-bold text-[#2f5f54] block pl-1">
                        +{dayAssignments.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-[#2f5f54] tracking-wider">Selected Date</span>
              <h3 className="text-base font-black text-slate-900">{selectedDateStr}</h3>
            </div>
            <span className="px-2.5 py-1 bg-rose-50 text-[#254b42] text-xs font-bold rounded-lg border border-rose-200">
              {dateAssignments.length} Shoots
            </span>
          </div>

          {dateAssignments.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-extrabold text-slate-800">No shoots on this date</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Assign a freelancer to an existing client shoot for this day.</p>
              {onAssignShoot && (
                <button type="button" onClick={onAssignShoot} className="mt-3 text-xs font-extrabold text-[#2f5f54]">
                  Assign Shoot
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {dateAssignments.map((assignment) => (
                <div key={assignment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#2f5f54] block">{assignment.eventName}</span>
                      <h4 className="font-black text-xs text-slate-900">
                        {assignment.clientName || projects.find((p) => p.id === assignment.projectId)?.clientWeddingTitle || assignment.projectName}
                      </h4>
                      <p className="text-[11px] text-slate-500">{assignment.eventName} · {assignment.role || assignment.subCategory}</p>
                    </div>

                    <span className="px-2 py-0.5 bg-rose-50 text-[#253d37] text-[10px] font-bold rounded uppercase">
                      {assignment.assignmentStatus}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-1">
                    <p className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#2f5f54]" />
                      <strong>{assignment.freelancerName}</strong> ({assignment.subCategory})
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#2f5f54]" />
                      <span>{assignment.startTime} - {assignment.endTime}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2f5f54]" />
                      <span>{assignment.venue}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                    <span className="font-extrabold text-[#254b42] font-mono">
                      ₹{assignment.totalAgreedAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Paid: <strong className="text-emerald-600 font-mono">₹{assignment.advancePaid.toLocaleString('en-IN')}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Freelancers Availability Grid */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Availability · {selectedDateStr}</h4>
            {(() => {
              const booked = freelancers.filter((fl) => dateAssignments.some((a) => a.freelancerId === fl.id));
              const onLeave = freelancers.filter((fl) => !booked.includes(fl) && (fl.availabilityStatus === 'Leave' || fl.workingStatus === 'unavailable'));
              const unavailable = freelancers.filter((fl) => !booked.includes(fl) && !onLeave.includes(fl) && (fl.availabilityStatus === 'Unavailable' || fl.availabilityStatus === 'Busy'));
              const available = freelancers.filter((fl) => !booked.includes(fl) && !onLeave.includes(fl) && !unavailable.includes(fl) && fl.status === 'active');
              const groups = [
                { title: 'Available', items: available.map((fl) => fl.name) },
                { title: 'Already booked', items: booked.map((fl) => `${fl.name} — ${dateAssignments.find((a) => a.freelancerId === fl.id)?.clientName || dateAssignments.find((a) => a.freelancerId === fl.id)?.projectName}`) },
                { title: 'On leave', items: onLeave.map((fl) => fl.name) },
                { title: 'Unavailable', items: unavailable.map((fl) => fl.name) },
              ];
              return groups.map((group) => (
                <div key={group.title}>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{group.title}</p>
                  {group.items.length === 0 ? (
                    <p className="text-xs font-medium text-slate-400">None</p>
                  ) : (
                    group.items.map((name) => (
                      <p key={name} className="text-xs font-bold text-slate-800">{name}</p>
                    ))
                  )}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
