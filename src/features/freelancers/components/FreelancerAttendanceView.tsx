import React, { useState } from 'react';
import { Freelancer, FreelancerAttendance } from '@/types';
import { Clock, CheckCircle, XCircle, Calendar, Plus, User, Search, MapPin, Check, X } from 'lucide-react';

interface FreelancerAttendanceViewProps {
  attendanceRecords: FreelancerAttendance[];
  freelancers: Freelancer[];
  onSaveAttendance: (record: FreelancerAttendance) => void;
  onUpdateAvailability: (freelancerId: string, status: Freelancer['availabilityStatus']) => void;
}

export const FreelancerAttendanceView: React.FC<FreelancerAttendanceViewProps> = ({
  attendanceRecords,
  freelancers,
  onSaveAttendance,
  onUpdateAvailability,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  // New Attendance Record state
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(freelancers[0]?.id || '');
  const [shootDate, setShootDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('08:30 AM');
  const [checkOutTime, setCheckOutTime] = useState('09:30 PM');
  const [attendanceStatus, setAttendanceStatus] = useState<FreelancerAttendance['attendanceStatus']>('present');
  const [remarks, setRemarks] = useState('');

  const handleCreateAttendanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fl = freelancers.find((f) => f.id === selectedFreelancerId);

    const record: FreelancerAttendance = {
      id: `att-${Date.now()}`,
      freelancerId: selectedFreelancerId,
      freelancerName: fl?.name || 'Freelancer',
      shootDate,
      checkInTime,
      checkOutTime,
      attendanceStatus,
      remarks: remarks.trim(),
    };

    onSaveAttendance(record);
    setShowLogModal(false);
  };

  const filteredFreelancers = freelancers.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.mainCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#24291E] flex items-center justify-center font-bold text-white shadow-xs">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Attendance & Availability Status</h2>
            <p className="text-xs text-slate-500">Track check-in/out times & set current availability for booking</p>
          </div>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2 bg-[#24291E] hover:bg-[#1C2018] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Log Shoot Attendance</span>
        </button>
      </div>

      {/* Freelancers Availability Cards */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Quick Availability Status Toggle</h3>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search freelancer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredFreelancers.map((fl) => (
            <div key={fl.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img src={fl.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'} alt={fl.name} className="w-9 h-9 rounded-full object-cover border border-[#293022]" />
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block">{fl.name}</span>
                  <span className="text-[10px] text-slate-500">{fl.subCategory}</span>
                </div>
              </div>

              <select
                value={fl.availabilityStatus || 'Available'}
                onChange={(e) => onUpdateAvailability(fl.id, e.target.value as any)}
                className={`px-2 py-1 text-[10px] font-black uppercase rounded-lg border transition ${
                  fl.availabilityStatus === 'Available'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : fl.availabilityStatus === 'On Shoot'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                <option value="Available">Available</option>
                <option value="On Shoot">On Shoot</option>
                <option value="Busy">Busy</option>
                <option value="Leave">Leave</option>
                <option value="Unavailable">Unavailable</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Shoot Attendance Logs</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Freelancer</th>
                <th className="p-3.5">Shoot Date</th>
                <th className="p-3.5">Check-In Time</th>
                <th className="p-3.5">Check-Out Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No attendance records logged yet.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900">{att.freelancerName}</td>
                    <td className="p-3.5 font-bold text-slate-600">{att.shootDate}</td>
                    <td className="p-3.5 text-slate-800">{att.checkInTime || '-'}</td>
                    <td className="p-3.5 text-slate-800">{att.checkOutTime || '-'}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
                        att.attendanceStatus === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {att.attendanceStatus}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">{att.remarks || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG ATTENDANCE MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">Log Shoot Attendance</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAttendanceSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Freelancer</label>
                <select
                  value={selectedFreelancerId}
                  onChange={(e) => setSelectedFreelancerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                >
                  {freelancers.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Shoot Date</label>
                <input
                  type="date"
                  value={shootDate}
                  onChange={(e) => setShootDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Check-In</label>
                  <input
                    type="text"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Check-Out</label>
                  <input
                    type="text"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Attendance Status</label>
                <select
                  value={attendanceStatus}
                  onChange={(e) => setAttendanceStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-bold"
                >
                  <option value="present">Present (Full Day)</option>
                  <option value="half_day">Half Day</option>
                  <option value="late">Late Arrival</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Arrived on location on time, all gear ready"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#24291E] text-white text-xs font-bold rounded-lg"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
