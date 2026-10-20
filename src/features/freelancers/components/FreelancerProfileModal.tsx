import React, { useState } from 'react';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { 
  Freelancer, 
  FreelancerAssignment, 
  FreelancerPayment, 
  FreelancerAttendance, 
  FreelancerDataReceived, 
  FreelancerActivityLog,
  FreelancerDocument
} from '@/types';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  CreditCard, 
  FileText, 
  HardDrive, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  ExternalLink,
  Award,
  Layers,
  Upload,
  Activity,
  Film,
  Trash2
} from 'lucide-react';
import { BRAND } from '@/config/brand';

interface FreelancerProfileModalProps {
  freelancer: Freelancer;
  assignments: FreelancerAssignment[];
  payments: FreelancerPayment[];
  attendanceRecords: FreelancerAttendance[];
  dataReceivedList: FreelancerDataReceived[];
  activityLogs: FreelancerActivityLog[];
  onEdit?: (freelancer: Freelancer) => void;
  onClose: () => void;
  onAddPaymentClick?: (freelancerId: string) => void;
  onAssignShootClick?: (freelancerId: string) => void;
  onUpdateDocument?: (freelancerId: string, doc: FreelancerDocument) => void;
  onDeleteFreelancer?: (freelancerId: string) => void;
  onSaveFreelancer?: (freelancer: Freelancer) => void;
}

export const FreelancerProfileModal: React.FC<FreelancerProfileModalProps> = ({
  freelancer,
  assignments,
  payments,
  attendanceRecords,
  dataReceivedList,
  activityLogs,
  onEdit,
  onClose,
  onAddPaymentClick,
  onAssignShootClick,
  onUpdateDocument,
  onDeleteFreelancer,
  onSaveFreelancer,
}) => {
  const [activeProfileTab, setActiveProfileTab] = useState<
    'shoots' | 'overview' | 'about' | 'portfolio' | 'reviews' | 'payments' | 'attendance' | 'data' | 'documents' | 'notes'
  >('about');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Filter freelancer specific records
  const myAssignments = assignments.filter((a) => a.freelancerId === freelancer.id);
  const myPayments = payments.filter((p) => p.freelancerId === freelancer.id);
  const myAttendance = attendanceRecords.filter((att) => att.freelancerId === freelancer.id);
  const myDataReceived = dataReceivedList.filter((d) => d.freelancerId === freelancer.id);
  const myLogs = activityLogs.filter((l) => l.freelancerId === freelancer.id || l.freelancerName === freelancer.name);

  // Stats calculation
  const totalShoots = myAssignments.length;
  const upcomingShoots = myAssignments.filter((a) => a.assignmentStatus === 'assigned' || a.assignmentStatus === 'confirmed').length;
  const completedShoots = myAssignments.filter((a) => a.assignmentStatus === 'completed').length;
  const isInterested = freelancer.preferredTier === 'under_review';
  const isApproved = freelancer.applicationStatus === 'approved' && freelancer.workingStatus === 'active' && freelancer.status === 'active';

  const totalEarnings = myAssignments.reduce((sum, a) => sum + (a.totalAgreedAmount || 0), 0);
  const paidAmount = myPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const pendingAmount = Math.max(0, totalEarnings - paidAmount);

  // New Document Upload State
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'id_proof' | 'agreement' | 'bank_details' | 'other'>('id_proof');
  const [docUrl, setDocUrl] = useState('');

  const handleAddDocumentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    const newDoc: FreelancerDocument = {
      id: `doc-${Date.now()}`,
      title: docTitle.trim(),
      type: docType,
      fileUrl: docUrl.trim() || `https://${BRAND.domain}/docs/placeholder.pdf`,
      fileName: `${docTitle.trim().replace(/\s+/g, '_')}.pdf`,
      status: 'uploaded',
      uploadDate: new Date().toISOString().split('T')[0],
    };

    if (onUpdateDocument) {
      onUpdateDocument(freelancer.id, newDoc);
    }
    setShowAddDocForm(false);
    setDocTitle('');
    setDocUrl('');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#151714]/75 p-3 backdrop-blur-xs sm:p-5">
      <div className="flex h-[min(820px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.5rem] border border-white/50 bg-white shadow-[0_30px_90px_rgba(14,15,13,.42)]">
        <div className="relative shrink-0 overflow-hidden bg-[radial-gradient(circle_at_86%_10%,rgba(236,190,169,.20),transparent_30%),linear-gradient(125deg,#41463E,#30342E_52%,#21241F)] px-4 py-4 text-white sm:px-5">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl border border-white/10 bg-[#302c2e]/80 text-slate-300 transition hover:bg-[#211e20] hover:text-white"
            aria-label="Close freelancer profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid gap-4 pr-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
            <div className="flex min-w-0 items-start gap-3">
              {freelancer.profilePhoto ? (
                <img
                  src={freelancer.profilePhoto}
                  alt={freelancer.name}
                  className="h-16 w-16 flex-shrink-0 rounded-2xl border-2 border-white/35 object-cover shadow-md sm:h-[4.5rem] sm:w-[4.5rem]"
                />
              ) : (
                <div className="grid h-16 w-16 flex-shrink-0 place-items-center rounded-2xl border-2 border-white/35 bg-white/15 text-lg font-black sm:h-[4.5rem] sm:w-[4.5rem]">
                  {freelancer.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-lg font-black tracking-tight sm:text-xl">{freelancer.name}</h2>
                  <span className="rounded-md border border-[#A5ACA2]/30 bg-[#50574D]/20 px-2 py-0.5 font-mono text-[11px] font-bold text-[#dfeae7]">
                    {freelancer.freelancerId}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                      freelancer.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}
                  >
                    {freelancer.status}
                  </span>
                  {freelancer.preferredTier === 'preferred' && (
                    <span className="rounded-full border border-amber-400/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-amber-200">
                      Preferred
                    </span>
                  )}
                </div>

                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300">
                  <span className="font-bold text-[#dfeae7]">{freelancer.mainCategory}</span>
                  <span>•</span>
                  <span>{freelancer.subCategory}</span>
                  <span>•</span>
                  <span>{freelancer.experienceYears} Yrs Experience</span>
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-300/80">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#A5ACA2]" />
                    <span>{freelancer.mobile}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#A5ACA2]" />
                    <span>{freelancer.city || 'Jaipur'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#A5ACA2]" />
                    <span>Joined {freelancer.joiningDate}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid w-full grid-cols-2 gap-2 text-xs">
              {onEdit && (
              <button
                onClick={() => onEdit(freelancer)}
                className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-[#302c2e]/85 px-3 py-2 font-bold text-white transition hover:bg-[#211e20]"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#A5ACA2]" />
                <span>Edit Profile</span>
              </button>
              )}

              {onSaveFreelancer && !isInterested && !isApproved && (
                <button
                  type="button"
                  onClick={() =>
                    onSaveFreelancer({
                      ...freelancer,
                      preferredTier: 'under_review',
                      applicationStatus: freelancer.applicationStatus || 'under_review',
                      workingStatus: freelancer.workingStatus || 'inactive',
                    })
                  }
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 font-bold text-white transition hover:bg-white/20"
                >
                  <Award className="w-3.5 h-3.5 text-[#A5ACA2]" />
                  <span>Mark Interested</span>
                </button>
              )}
              {onSaveFreelancer && isInterested && (
                <button
                  type="button"
                  onClick={() =>
                    onSaveFreelancer({
                      ...freelancer,
                      applicationStatus: 'approved',
                      workingStatus: 'active',
                      status: 'active',
                      preferredTier: 'new',
                    })
                  }
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#464B43] px-3 py-2 font-bold text-white shadow-xs transition hover:bg-[#373B35]"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              )}
              {onAssignShootClick && isApproved && (
                <button
                  onClick={() => onAssignShootClick(freelancer.id)}
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#464B43] px-3 py-2 font-bold text-white shadow-xs transition hover:bg-[#373B35]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Freelancer</span>
                </button>
              )}

              {onAddPaymentClick && (
                <button
                  onClick={() => onAddPaymentClick(freelancer.id)}
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-emerald-300/20 bg-[#527a68] px-3 py-2 font-bold text-white shadow-xs transition hover:bg-[#40725b]"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              )}
              {onDeleteFreelancer && (
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-red-400/30 bg-red-600/15 px-3 py-2 font-bold text-red-200 shadow-xs transition hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl border border-white/10 bg-[#302c2e]/75 p-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Total Shoots</span>
              <span className="text-lg font-black text-white">{totalShoots}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#302c2e]/75 p-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Upcoming</span>
              <span className="text-lg font-black text-[#A5ACA2]">{upcomingShoots}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#302c2e]/75 p-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Completed</span>
              <span className="text-lg font-black text-emerald-400">{completedShoots}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#302c2e]/75 p-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Total Earnings</span>
              <span className="text-lg font-black text-white font-mono">₹{totalEarnings.toLocaleString('en-IN')}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#302c2e]/75 p-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Paid Amount</span>
              <span className="text-lg font-black text-emerald-400 font-mono">₹{paidAmount.toLocaleString('en-IN')}</span>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#302c2e]/75 p-2.5">
              <span className="block text-[10px] font-bold uppercase text-slate-400">Pending Amount</span>
              <span className="text-lg font-black text-red-400 font-mono">₹{pendingAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Profile Navigation Tabs */}
        <div className="shrink-0 overflow-x-auto border-b border-[#e6ded8] bg-[#FBFDF6] px-3 sm:px-5">
          <div className="flex w-max min-w-full items-center gap-1">
          {[
            { id: 'about', label: 'Overview' },
            { id: 'overview', label: 'Skills & Equipment' },
            { id: 'shoots', label: 'Shoot History' },
            { id: 'payments', label: 'Payments' },
            { id: 'reviews', label: 'Performance' },
            { id: 'attendance', label: 'Availability' },
            { id: 'documents', label: 'Documents' },
            { id: 'notes', label: 'Internal Notes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveProfileTab(tab.id as any)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-extrabold transition ${
                activeProfileTab === tab.id
                  ? 'border-[#464B43] text-[#464B43]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {activeProfileTab === 'about' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-slate-700">{freelancer.bio || 'No professional bio yet.'}</p>
              <div className="flex flex-wrap gap-1">
                {(freelancer.skills || []).map((s) => (
                  <span key={s} className="rounded-full border border-[#ded5cf] bg-[#f6f1ee] px-2 py-0.5 text-[10px] font-bold">{s}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                  <p className="font-bold uppercase text-slate-400">Availability</p>
                  <p className="font-extrabold text-slate-900">{freelancer.availabilityStatus || 'Available'}</p>
                </div>
                <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                  <p className="font-bold uppercase text-slate-400">Rating</p>
                  <p className="font-extrabold text-slate-900">{freelancer.rating ? `${freelancer.rating}/5` : 'Not rated'}</p>
                </div>
                <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                  <p className="font-bold uppercase text-slate-400">Travel</p>
                  <p className="font-extrabold text-slate-900">{freelancer.travelAvailability === false ? 'Local only' : 'Destination OK'}</p>
                </div>
                <div className="rounded-xl border border-[#eee7e2] bg-[#FBFDF6] p-3">
                  <p className="font-bold uppercase text-slate-400">Locations</p>
                  <p className="font-extrabold text-slate-900">{(freelancer.preferredLocations || []).join(', ') || freelancer.city || '—'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {freelancer.instagramUrl && <a className="font-bold text-[#464B43]" href={freelancer.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
                {freelancer.websiteUrl && <a className="font-bold text-[#464B43]" href={freelancer.websiteUrl} target="_blank" rel="noreferrer">Website</a>}
                <a className="font-bold text-[#464B43]" href={`tel:${freelancer.mobile}`}>Call</a>
                <a className="font-bold text-[#464B43]" href={`https://wa.me/${(freelancer.whatsapp || freelancer.mobile || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">WhatsApp</a>
                {freelancer.email && <a className="font-bold text-[#464B43]" href={`mailto:${freelancer.email}`}>Email</a>}
              </div>
              {freelancer.verification && (
                <div className="flex flex-wrap gap-1">
                  {freelancer.verification.mobile && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Mobile</span>}
                  {freelancer.verification.email && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Email</span>}
                  {freelancer.verification.identity && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Identity</span>}
                  {freelancer.verification.portfolio && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Portfolio</span>}
                  {freelancer.verification.agreement && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Agreement</span>}
                  {freelancer.verification.bank && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Bank</span>}
                </div>
              )}
            </div>
          )}

          {activeProfileTab === 'portfolio' && (
            <div className="space-y-3">
              {(freelancer.portfolio || []).length === 0 && !freelancer.instagramUrl && !freelancer.websiteUrl ? (
                <p className="rounded-xl border border-dashed border-[#ded5cf] bg-[#FBFDF6] p-8 text-center text-xs font-medium text-slate-500">No portfolio items yet. Add Instagram or website links when editing the profile.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {freelancer.instagramUrl && <a href={freelancer.instagramUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[#eee7e2] p-4 text-sm font-bold text-[#464B43]">Instagram</a>}
                  {freelancer.websiteUrl && <a href={freelancer.websiteUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-[#eee7e2] p-4 text-sm font-bold text-[#464B43]">Portfolio site</a>}
                  {(freelancer.portfolio || []).map((item) => (
                    <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="rounded-xl border border-[#eee7e2] p-4 text-sm font-bold text-slate-800">
                      {item.title || item.kind}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeProfileTab === 'reviews' && (
            <div className="space-y-3">
              {(freelancer.reviews || []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#ded5cf] bg-[#FBFDF6] p-8 text-center text-xs font-medium text-slate-500">No internal reviews yet. Ratings stay private to studio staff.</p>
              ) : (
                (freelancer.reviews || []).map((r) => (
                  <div key={r.id} className="rounded-xl border border-[#eee7e2] p-4">
                    <p className="text-sm font-extrabold text-slate-900">{r.overall}/5 · {r.projectName || 'Shoot review'}</p>
                    <p className="mt-1 text-xs text-slate-600">{r.notes || 'No notes'}</p>
                    <p className="mt-1 text-[10px] font-bold text-slate-400">{r.createdAt}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeProfileTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rate Card & Charges */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <DollarSign className="w-4 h-4 text-[#464B43]" />
                  <span>Rate Card & Daily Charges</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Full Event</span>
                    <span className="font-extrabold text-[#373B35] text-sm font-mono">₹{freelancer.perDayCharges.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Small Event</span>
                    <span className="font-extrabold text-slate-800 font-mono">₹{freelancer.halfDayCharges.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Full Day Event</span>
                    <span className="font-extrabold text-slate-800 font-mono">₹{freelancer.eventCharges.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Travel Charges</span>
                    <span className="font-extrabold text-slate-800 font-mono">₹{freelancer.travelCharges.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {freelancer.notes && (
                  <p className="text-xs text-slate-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    <strong>Rate Terms:</strong> {freelancer.notes}
                  </p>
                )}
              </div>

              {/* Equipment & Gear Specs */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <Award className="w-4 h-4 text-[#464B43]" />
                  <span>Gear & Camera Equipment</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Camera Bodies:</span>
                    <p className="font-semibold text-slate-800">{freelancer.cameraDetails || 'Not specified'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Lens Kit:</span>
                    <p className="font-semibold text-slate-800">{freelancer.lensDetails || 'Not specified'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Lighting / Gimbal / Audio:</span>
                    <p className="font-semibold text-slate-800">{freelancer.otherEquipment || 'Not specified'}</p>
                  </div>

                  {freelancer.equipmentAvailable && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Complete Equipment Brief:</span>
                      <p className="text-slate-700">{freelancer.equipmentAvailable}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Key Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {freelancer.skills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-rose-50 text-[#373B35] border border-rose-200 rounded text-[11px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank & Payment Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 md:col-span-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <CreditCard className="w-4 h-4 text-[#464B43]" />
                  <span>Bank Account & Settlement Details</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Preferred Mode</span>
                    <span className="font-bold text-slate-900">{freelancer.paymentMethod}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">UPI ID</span>
                    <span className="font-mono font-bold text-[#373B35]">{freelancer.upiId || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Bank Name</span>
                    <span className="font-bold text-slate-800">{freelancer.bankName || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">A/C Holder</span>
                    <span className="font-bold text-slate-800">{freelancer.accountHolderName || freelancer.name}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Account Number</span>
                    <span className="font-mono font-bold text-slate-900">{freelancer.accountNumber || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-900">{freelancer.ifsc || 'N/A'}</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Emergency Contact</span>
                    <span className="font-bold text-slate-800">{freelancer.emergencyContact || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: ASSIGNED SHOOTS */}
          {activeProfileTab === 'shoots' && (
            <div className="space-y-4">
              {/* Filter Notice Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-[#21241F] to-slate-900 p-4 rounded-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-[#50574D]/30 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#464B43]/30 border border-[#A5ACA2]/40 text-[#dfeae7] rounded-xl flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5 text-[#dfeae7]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">{freelancer.name}'s Assigned Shoots</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#50574D]/30 text-rose-200 border border-[#A5ACA2]/30 rounded-full font-bold">
                        {freelancer.subCategory}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Showing strictly the shoots assigned to <strong className="text-amber-300">{freelancer.name}</strong> ({freelancer.freelancerId})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-extrabold px-3 py-1 bg-[#464B43] text-white rounded-lg shadow-2xs">
                    {totalShoots} {totalShoots === 1 ? 'Shoot' : 'Shoots'} Assigned
                  </span>
                  {onAssignShootClick && (
                    <button
                      onClick={() => {
                        onClose();
                        onAssignShootClick(freelancer.id);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-lg transition flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign New Shoot</span>
                    </button>
                  )}
                </div>
              </div>

              {myAssignments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Film className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-extrabold">No shoots assigned to {freelancer.name} yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">Click "+ Assign New Shoot" above to allocate upcoming wedding events.</p>
                </div>
              ) : (
                myAssignments.map((assignment) => {
                  const waMessage = `Hi ${freelancer.name},\nHere are your shoot assignment details:\n*Project:* ${assignment.projectName}\n*Event:* ${assignment.eventName}\n*Role:* ${assignment.role}\n*Date:* ${assignment.shootDate} (${assignment.startTime} - ${assignment.endTime})\n*Venue:* ${assignment.venue}, ${assignment.shootLocation}\n*Agreed Pay:* ₹${assignment.totalAgreedAmount.toLocaleString('en-IN')}\n*Advance:* ₹${assignment.advancePaid.toLocaleString('en-IN')}\n*Pending:* ₹${assignment.pendingAmount.toLocaleString('en-IN')}`;
                  const waUrl = `https://wa.me/${(freelancer.whatsapp || freelancer.mobile || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`;

                  return (
                    <div
                      key={assignment.id}
                      className="p-4.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-[#dfeae7] transition space-y-3"
                    >
                      {/* Top Row: Project & Status */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-slate-900">{assignment.projectName}</h4>
                            <span
                              className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-wider ${
                                assignment.assignmentStatus === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : assignment.assignmentStatus === 'confirmed'
                                  ? 'bg-rose-50 text-[#30342E] border border-rose-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              {assignment.assignmentStatus}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-[#464B43] mt-0.5">
                            Role: <span className="text-slate-800">{assignment.role}</span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-sm font-black text-[#373B35] font-mono">
                            ₹{assignment.totalAgreedAmount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Paid: <span className="text-emerald-600 font-bold font-mono">₹{assignment.advancePaid.toLocaleString('en-IN')}</span> | 
                            Pending: <span className="text-red-600 font-bold font-mono">₹{assignment.pendingAmount.toLocaleString('en-IN')}</span>
                          </p>
                        </div>
                      </div>

                      {/* Middle Grid: Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-[#464B43] flex-shrink-0" />
                          <span><strong>Date:</strong> {assignment.shootDate}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-[#464B43] flex-shrink-0" />
                          <span><strong>Time:</strong> {assignment.startTime} - {assignment.endTime}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700 col-span-1 sm:col-span-2">
                          <MapPin className="w-3.5 h-3.5 text-[#464B43] flex-shrink-0" />
                          <span><strong>Venue:</strong> {assignment.venue}, {assignment.shootLocation}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700 col-span-1 sm:col-span-2">
                          <Film className="w-3.5 h-3.5 text-[#464B43] flex-shrink-0" />
                          <span><strong>Event Coverage:</strong> {assignment.eventName}</span>
                        </div>
                      </div>

                      {/* Notes / Special Instructions */}
                      {assignment.notes && (
                        <p className="text-xs text-slate-600 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                          <strong>Note:</strong> {assignment.notes}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="pt-1 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          Shoot Ref: {assignment.id}
                        </span>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>Share Shoot Info on WhatsApp</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeProfileTab === 'payments' && (
            <div className="space-y-3">
              {myPayments.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-xs text-slate-500 font-medium">No payment transactions recorded for this freelancer.</p>
                </div>
              ) : (
                myPayments.map((pay) => (
                  <div key={pay.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{pay.projectName || 'General Shoot Payment'}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded font-mono">
                          {pay.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Date: {pay.paymentDate} {pay.transactionId && `• Txn Ref: ${pay.transactionId}`}
                      </p>
                      {pay.notes && <p className="text-xs text-slate-600 italic mt-0.5">"{pay.notes}"</p>}
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-emerald-600 font-mono">+₹{pay.amountPaid.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeProfileTab === 'attendance' && (
            <div className="space-y-3">
              {myAttendance.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-xs text-slate-500 font-medium">No attendance logs found for this freelancer.</p>
                </div>
              ) : (
                myAttendance.map((att) => (
                  <div key={att.id} className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{att.shootDate}</span>
                      <span className="text-slate-500 ml-2">• {att.projectName || 'Studio Duty'}</span>
                      {att.checkInTime && (
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Check-in: {att.checkInTime} {att.checkOutTime && `| Check-out: ${att.checkOutTime}`}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                      att.attendanceStatus === 'present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {att.attendanceStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: DATA RECEIVED */}
          {activeProfileTab === 'data' && (
            <div className="space-y-3">
              {myDataReceived.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-xs text-slate-500 font-medium">No data delivery records for this freelancer.</p>
                </div>
              ) : (
                myDataReceived.map((data) => (
                  <div key={data.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-slate-900">{data.projectName}</span>
                      <span className="px-2.5 py-0.5 bg-rose-50 text-[#30342E] text-[10px] font-bold rounded">
                        {data.dataStatus.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Media Type:</strong> {data.dataType} • <strong>Received Date:</strong> {data.dataReceivedDate} • <strong>Size:</strong> {data.approxDataSizeGB} GB ({data.numberOfCardsOrDrives} Drives/Cards)
                    </p>

                    {data.cloudDriveLink && (
                      <a
                        href={data.cloudDriveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#464B43] hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Cloud Storage Link</span>
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: DOCUMENTS */}
          {activeProfileTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Attached ID Proofs & Agreements</h3>
                <button
                  onClick={() => setShowAddDocForm(!showAddDocForm)}
                  className="px-3 py-1.5 bg-[#464B43] hover:bg-[#373B35] text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </button>
              </div>

              {showAddDocForm && (
                <form onSubmit={handleAddDocumentSubmit} className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Document Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Aadhaar Card / Agreement"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Document Type</label>
                      <select
                        value={docType}
                        onChange={(e) => setDocType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white font-bold"
                      >
                        <option value="id_proof">ID Proof (Aadhaar/PAN)</option>
                        <option value="agreement">Signed Agreement</option>
                        <option value="bank_details">Bank Passbook / Cheque</option>
                        <option value="other">Other Document</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Document URL / Link</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={docUrl}
                        onChange={(e) => setDocUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDocForm(false)}
                      className="px-3 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 bg-[#464B43] text-white text-xs font-bold rounded"
                    >
                      Save Document
                    </button>
                  </div>
                </form>
              )}

              {(!freelancer.documents || freelancer.documents.length === 0) ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-xs text-slate-500 font-medium">No documents uploaded for this freelancer.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {freelancer.documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-[#464B43]" />
                        <div>
                          <p className="font-bold text-xs text-slate-900">{doc.title}</p>
                          <p className="text-[10px] text-slate-500">Uploaded {doc.uploadDate}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: NOTES & ACTIVITY LOGS */}
          {activeProfileTab === 'notes' && (
            <div className="space-y-4">
              {freelancer.internalNotes && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-slate-800">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">Internal notes</p>
                  <p className="mt-1 whitespace-pre-wrap">{freelancer.internalNotes}</p>
                </div>
              )}
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Activity & Assignment History</h3>

              {myLogs.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-xs text-slate-500 font-medium">No recent logs recorded.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                        <span>{log.timestamp}</span>
                        <span>By {log.performedBy}</span>
                      </div>
                      <p className="font-medium text-slate-800">{log.action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e6ded8] bg-[#FBFDF6] p-3 sm:p-4">
          <div className="min-w-0 truncate text-xs font-medium text-slate-500">
            Category: <strong className="text-slate-800">{freelancer.mainCategory} ({freelancer.subCategory})</strong>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl bg-[#302c2e] px-5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#211e20]"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={showConfirmDelete}
        title="Delete Freelancer Profile"
        itemTitle={freelancer.name}
        message={`Are you sure you want to permanently delete freelancer profile "${freelancer.name}" (${freelancer.freelancerId})?`}
        onConfirm={() => {
          if (onDeleteFreelancer) {
            onDeleteFreelancer(freelancer.id);
          }
          setShowConfirmDelete(false);
          onClose();
        }}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </div>
  );
};
