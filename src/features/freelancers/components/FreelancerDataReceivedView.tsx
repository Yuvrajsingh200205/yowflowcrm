import React, { useState } from 'react';
import { Freelancer, FreelancerAssignment, FreelancerDataReceived } from '@/types';
import { HardDrive, Plus, ExternalLink, CheckCircle, Clock, AlertTriangle, X, Check } from 'lucide-react';

interface FreelancerDataReceivedViewProps {
  dataReceivedList: FreelancerDataReceived[];
  freelancers: Freelancer[];
  assignments: FreelancerAssignment[];
  onSaveDataReceived: (record: FreelancerDataReceived) => void;
  onUpdateDataStatus: (dataId: string, status: FreelancerDataReceived['dataStatus']) => void;
}

export const FreelancerDataReceivedView: React.FC<FreelancerDataReceivedViewProps> = ({
  dataReceivedList,
  freelancers,
  assignments,
  onSaveDataReceived,
  onUpdateDataStatus,
}) => {
  const [showLogModal, setShowLogModal] = useState(false);

  // Modal form states
  const [selectedFreelancerId, setSelectedFreelancerId] = useState(freelancers[0]?.id || '');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [dataType, setDataType] = useState<'RAW Photos' | '4K S-Log Video' | 'Drone Footage' | 'Audio Stems'>('RAW Photos');
  const [cardsCount, setCardsCount] = useState<number>(3);
  const [approxGB, setApproxGB] = useState<number>(128);
  const [isRawReceived, setIsRawReceived] = useState(true);
  const [isBackupDone, setIsBackupDone] = useState(true);
  const [cloudDriveLink, setCloudDriveLink] = useState('');
  const [dataStatus, setDataStatus] = useState<FreelancerDataReceived['dataStatus']>('verified');
  const [notes, setNotes] = useState('');

  const handleCreateDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fl = freelancers.find((f) => f.id === selectedFreelancerId);
    const assign = assignments.find((a) => a.id === selectedAssignmentId);

    const created: FreelancerDataReceived = {
      id: `f-data-${Date.now()}`,
      freelancerId: selectedFreelancerId,
      freelancerName: fl?.name || 'Freelancer',
      assignmentId: selectedAssignmentId || undefined,
      projectName: assign?.projectName || 'Wedding Shoot',
      dataType,
      numberOfCardsOrDrives: Number(cardsCount) || 1,
      approxDataSizeGB: Number(approxGB) || 0,
      dataReceivedDate: new Date().toISOString().split('T')[0],
      isRawReceived,
      isBackupDone,
      cloudDriveLink: cloudDriveLink.trim(),
      dataStatus,
      receivedBy: 'Studio Editor',
      notes: notes.trim(),
    };

    onSaveDataReceived(created);
    setShowLogModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#24291E] flex items-center justify-center font-bold text-white shadow-xs">
            <HardDrive className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Data Received & Raw Footage Logs</h2>
            <p className="text-xs text-slate-500">Track memory cards, hard drives, footage sizes & cloud links from freelancers</p>
          </div>
        </div>

        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2 bg-[#24291E] hover:bg-[#1C2018] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Log Received Data</span>
        </button>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataReceivedList.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#24291E] block">{item.dataType}</span>
                <h3 className="text-sm font-black text-slate-900">{item.projectName}</h3>
                <p className="text-xs text-slate-500">From Freelancer: <strong>{item.freelancerName}</strong></p>
              </div>

              <select
                value={item.dataStatus}
                onChange={(e) => onUpdateDataStatus(item.id, e.target.value as any)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border font-mono ${
                  item.dataStatus === 'verified' || item.dataStatus === 'backed_up'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="verified">Verified</option>
                <option value="backed_up">Backed Up</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Cards / Drives</span>
                <span className="font-black text-slate-900">{item.numberOfCardsOrDrives} Media</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Data Volume</span>
                <span className="font-black text-[#1C2018] font-mono">{item.approxDataSizeGB} GB</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Received Date</span>
                <span className="font-bold text-slate-700">{item.dataReceivedDate}</span>
              </div>
            </div>

            {item.cloudDriveLink && (
              <a
                href={item.cloudDriveLink}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#24291E] hover:underline flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Google Drive / Dropbox Folder</span>
              </a>
            )}
          </div>
        ))}
      </div>

      {/* LOG DATA MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm">Log Received Media Data</h3>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDataSubmit} className="p-5 space-y-3">
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Data Type</label>
                  <input
                    type="text"
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Approx Size (GB)</label>
                  <input
                    type="number"
                    value={approxGB}
                    onChange={(e) => setApproxGB(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Cloud Storage Link</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/..."
                  value={cloudDriveLink}
                  onChange={(e) => setCloudDriveLink(e.target.value)}
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
                  Save Data Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
