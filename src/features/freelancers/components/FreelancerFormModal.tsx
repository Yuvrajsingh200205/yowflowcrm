import React, { useState } from 'react';
import { Freelancer, FreelancerApplicationStatus, FreelancerCategory, FreelancerWorkingStatus } from '@/types';
import { UserPlus } from 'lucide-react';
import { BTN_GHOST, BTN_PRIMARY, FIELD, LABEL, Modal, ModalHero } from '@/features/team/components/TeamUiKit';
import { indianMobileError, nextIndianMobileValue } from '@/lib/validation/indianMobile';
import { BRAND } from '@/config/brand';

interface FreelancerFormModalProps {
  existingFreelancer?: Freelancer | null;
  categories: FreelancerCategory[];
  onSave: (freelancer: Freelancer) => void;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-4 rounded-2xl border border-[#eee7e2] bg-[#fbfaf8] p-4">
    <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#6d2f45]">{title}</h3>
    {children}
  </section>
);

export const FreelancerFormModal: React.FC<FreelancerFormModalProps> = ({
  existingFreelancer,
  categories,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(existingFreelancer?.name || '');
  const [freelancerId, setFreelancerId] = useState(existingFreelancer?.freelancerId || `FL-${Math.floor(1000 + Math.random() * 9000)}`);
  const [profilePhoto, setProfilePhoto] = useState(existingFreelancer?.profilePhoto || '');
  const [mobile, setMobile] = useState(existingFreelancer?.mobile || '');
  const [whatsapp, setWhatsapp] = useState(existingFreelancer?.whatsapp || '');
  const [email, setEmail] = useState(existingFreelancer?.email || '');
  const [address, setAddress] = useState(existingFreelancer?.address || '');
  const [city, setCity] = useState(existingFreelancer?.city || 'Jaipur');
  const [emergencyContact, setEmergencyContact] = useState(existingFreelancer?.emergencyContact || '');
  const [joiningDate, setJoiningDate] = useState(existingFreelancer?.joiningDate || new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'active' | 'inactive'>(existingFreelancer?.status || 'active');
  const [applicationStatus, setApplicationStatus] = useState<FreelancerApplicationStatus>(existingFreelancer?.applicationStatus || 'approved');
  const [workingStatus, setWorkingStatus] = useState<FreelancerWorkingStatus>(existingFreelancer?.workingStatus || (existingFreelancer?.status === 'inactive' ? 'inactive' : 'active'));
  const [mainCategory, setMainCategory] = useState(existingFreelancer?.mainCategory || categories[0]?.name || 'Photographer');
  const selectedCatObj = categories.find((c) => c.name === mainCategory);
  const availableSubCats = selectedCatObj ? selectedCatObj.subCategories : ['Candid Photographer'];
  const [subCategory, setSubCategory] = useState(existingFreelancer?.subCategory || availableSubCats[0] || 'Candid Photographer');
  const [experienceYears, setExperienceYears] = useState<number>(existingFreelancer?.experienceYears || 3);
  const [skillsStr, setSkillsStr] = useState(existingFreelancer?.skills ? existingFreelancer.skills.join(', ') : '');
  const [bio, setBio] = useState(existingFreelancer?.bio || '');
  const [languages, setLanguages] = useState((existingFreelancer?.languages || []).join(', '));
  const [preferredLocations, setPreferredLocations] = useState((existingFreelancer?.preferredLocations || []).join(', '));
  const [equipmentAvailable, setEquipmentAvailable] = useState(existingFreelancer?.equipmentAvailable || '');
  const [cameraDetails, setCameraDetails] = useState(existingFreelancer?.cameraDetails || '');
  const [lensDetails, setLensDetails] = useState(existingFreelancer?.lensDetails || '');
  const [otherEquipment, setOtherEquipment] = useState(existingFreelancer?.otherEquipment || '');
  const [perDayCharges, setPerDayCharges] = useState<number>(existingFreelancer?.perDayCharges || 0);
  const [halfDayCharges, setHalfDayCharges] = useState<number>(existingFreelancer?.halfDayCharges || 0);
  const [eventCharges, setEventCharges] = useState<number>(existingFreelancer?.eventCharges || 0);
  const [overtimeCharges, setOvertimeCharges] = useState<number>(existingFreelancer?.overtimeCharges || 0);
  const [extraHourCharges, setExtraHourCharges] = useState<number>(existingFreelancer?.extraHourCharges || 0);
  const [travelCharges, setTravelCharges] = useState<number>(existingFreelancer?.travelCharges || 0);
  const [otherCharges, setOtherCharges] = useState<number>(existingFreelancer?.otherCharges || 0);
  const [notes, setNotes] = useState(existingFreelancer?.notes || '');
  const [internalNotes, setInternalNotes] = useState(existingFreelancer?.internalNotes || '');
  const [instagramUrl, setInstagramUrl] = useState(existingFreelancer?.instagramUrl || '');
  const [websiteUrl, setWebsiteUrl] = useState(existingFreelancer?.websiteUrl || '');
  const [travelAvailability, setTravelAvailability] = useState(existingFreelancer?.travelAvailability ?? true);
  const [maxShootsPerDay, setMaxShootsPerDay] = useState(existingFreelancer?.maxShootsPerDay || 1);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer' | 'Cash' | 'Other'>(existingFreelancer?.paymentMethod || 'UPI');
  const [upiId, setUpiId] = useState(existingFreelancer?.upiId || '');
  const [bankName, setBankName] = useState(existingFreelancer?.bankName || '');
  const [accountHolderName, setAccountHolderName] = useState(existingFreelancer?.accountHolderName || '');
  const [accountNumber, setAccountNumber] = useState(existingFreelancer?.accountNumber || '');
  const [ifsc, setIfsc] = useState(existingFreelancer?.ifsc || '');
  const [paymentNotes, setPaymentNotes] = useState(existingFreelancer?.paymentNotes || '');
  const [gstNumber, setGstNumber] = useState(existingFreelancer?.gstNumber || '');
  const [panNumber, setPanNumber] = useState(existingFreelancer?.panNumber || '');
  const [preferredTier, setPreferredTier] = useState(existingFreelancer?.preferredTier || 'new');

  const catLower = mainCategory.toLowerCase();
  const showPhotoRate = /photo/.test(catLower);
  const showVideoRate = /video|cinema|edit/.test(catLower);
  const showDroneRate = /drone/.test(catLower);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') setProfilePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryChange = (catName: string) => {
    setMainCategory(catName);
    const catObj = categories.find((c) => c.name === catName);
    if (catObj?.subCategories.length) setSubCategory(catObj.subCategories[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const mobileError = indianMobileError(mobile, true);
    if (mobileError) { window.alert(mobileError); return; }
    const whatsappError = indianMobileError(whatsapp, false);
    if (whatsappError) { window.alert(`WhatsApp: ${whatsappError}`); return; }
    const skills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
    onSave({
      ...(existingFreelancer || ({} as Freelancer)),
      id: existingFreelancer ? existingFreelancer.id : `fl-${Date.now()}`,
      freelancerId: freelancerId.trim(),
      name: name.trim(),
      profilePhoto,
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim() || mobile.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      emergencyContact: emergencyContact.trim(),
      joiningDate,
      status: workingStatus === 'active' ? 'active' : 'inactive',
      applicationStatus,
      workingStatus,
      preferredTier,
      bio: bio.trim(),
      languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
      preferredLocations: preferredLocations.split(',').map((s) => s.trim()).filter(Boolean),
      internalNotes: internalNotes.trim(),
      instagramUrl: instagramUrl.trim(),
      websiteUrl: websiteUrl.trim(),
      travelAvailability,
      maxShootsPerDay,
      gstNumber: gstNumber.trim(),
      panNumber: panNumber.trim(),
      mainCategory,
      subCategory,
      experienceYears: Number(experienceYears) || 0,
      skills,
      equipmentAvailable: equipmentAvailable.trim(),
      cameraDetails: cameraDetails.trim(),
      lensDetails: lensDetails.trim(),
      otherEquipment: otherEquipment.trim(),
      perDayCharges: Number(perDayCharges) || 0,
      halfDayCharges: Number(halfDayCharges) || 0,
      eventCharges: Number(eventCharges) || 0,
      overtimeCharges: Number(overtimeCharges) || 0,
      extraHourCharges: Number(extraHourCharges) || 0,
      travelCharges: Number(travelCharges) || 0,
      otherCharges: Number(otherCharges) || 0,
      notes: notes.trim(),
      paymentMethod,
      upiId: upiId.trim(),
      bankName: bankName.trim(),
      accountHolderName: accountHolderName.trim() || name.trim(),
      accountNumber: accountNumber.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      paymentNotes: paymentNotes.trim(),
      availabilityStatus: existingFreelancer?.availabilityStatus || 'Available',
      documents: existingFreelancer?.documents || [],
    });
  };

  return (
    <Modal isOpen onClose={onClose} labelledBy="freelancer-form-title" widthClass="max-w-4xl">
      <ModalHero
        icon={UserPlus}
        eyebrow="Production Network"
        title={existingFreelancer ? 'Edit Freelancer' : 'Add Freelancer'}
        description={existingFreelancer ? existingFreelancer.freelancerId : `Create a talent profile for ${BRAND.name} shoots.`}
        onClose={onClose}
        labelledBy="freelancer-form-title"
      />
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <Section title="Basic information">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <span className="grid size-16 place-items-center overflow-hidden rounded-2xl bg-[#f0dce3] text-sm font-black text-[#6d2f45]">
              {profilePhoto ? <img src={profilePhoto} alt="" className="size-16 object-cover" /> : name.slice(0, 2).toUpperCase() || 'FL'}
            </span>
            <label className={BTN_GHOST}>
              Upload photo
              <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
            </label>
            {profilePhoto && <button type="button" className={BTN_GHOST} onClick={() => setProfilePhoto('')}>Remove</button>}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label><span className={LABEL}>Full name *</span><input required className={FIELD} value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label><span className={LABEL}>Freelancer ID</span><input className={FIELD} value={freelancerId} onChange={(e) => setFreelancerId(e.target.value)} /></label>
            <label><span className={LABEL}>Joining date</span><input type="date" className={FIELD} value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} /></label>
            <label><span className={LABEL}>Mobile *</span><input required type="tel" inputMode="numeric" maxLength={10} className={FIELD} value={mobile} onChange={(e) => setMobile(nextIndianMobileValue(e.target.value, mobile))} placeholder="9876543210" /></label>
            <label><span className={LABEL}>WhatsApp</span><input type="tel" inputMode="numeric" maxLength={10} className={FIELD} value={whatsapp} onChange={(e) => setWhatsapp(nextIndianMobileValue(e.target.value, whatsapp))} placeholder="9876543210" /></label>
            <label><span className={LABEL}>Email</span><input type="email" className={FIELD} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label><span className={LABEL}>City</span><input className={FIELD} value={city} onChange={(e) => setCity(e.target.value)} /></label>
            <label><span className={LABEL}>Emergency contact</span><input className={FIELD} value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} /></label>
            <label><span className={LABEL}>Shortlist</span>
              <select className={FIELD} value={preferredTier} onChange={(e) => setPreferredTier(e.target.value as Freelancer['preferredTier'])}>
                <option value="new">New</option>
                <option value="preferred">Preferred</option>
                <option value="backup">Backup</option>
                <option value="under_review">Under Review</option>
              </select>
            </label>
            <label className="sm:col-span-3"><span className={LABEL}>Full address</span><input className={FIELD} value={address} onChange={(e) => setAddress(e.target.value)} /></label>
            <label>
              <span className={LABEL}>Application status</span>
              <select className={FIELD} value={applicationStatus} onChange={(e) => setApplicationStatus(e.target.value as FreelancerApplicationStatus)}>
                <option value="applied">Applied</option>
                <option value="under_review">Under Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="verification">Verification</option>
                <option value="changes_requested">Action Required</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label>
              <span className={LABEL}>Working status</span>
              <select className={FIELD} value={workingStatus} onChange={(e) => { const v = e.target.value as FreelancerWorkingStatus; setWorkingStatus(v); setStatus(v === 'active' ? 'active' : 'inactive'); }}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="unavailable">Temporarily Unavailable</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>
        </Section>

        <Section title="Professional information">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label><span className={LABEL}>Main category</span>
              <select className={FIELD} value={mainCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </label>
            <label><span className={LABEL}>Subcategory</span>
              <select className={FIELD} value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                {availableSubCats.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </label>
            <label><span className={LABEL}>Experience (years)</span><input type="number" min={0} className={FIELD} value={experienceYears} onChange={(e) => setExperienceYears(Number(e.target.value))} /></label>
            <label className="sm:col-span-3"><span className={LABEL}>Skills</span><input className={FIELD} value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} placeholder="Candid, Traditional, Lighting" /></label>
            <label className="sm:col-span-3"><span className={LABEL}>Professional bio</span><textarea className={`${FIELD} min-h-20`} value={bio} onChange={(e) => setBio(e.target.value)} /></label>
            <label><span className={LABEL}>Languages</span><input className={FIELD} value={languages} onChange={(e) => setLanguages(e.target.value)} /></label>
            <label className="sm:col-span-2"><span className={LABEL}>Preferred work locations</span><input className={FIELD} value={preferredLocations} onChange={(e) => setPreferredLocations(e.target.value)} /></label>
          </div>
        </Section>

        <Section title="Equipment">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label><span className={LABEL}>Camera bodies</span><input className={FIELD} value={cameraDetails} onChange={(e) => setCameraDetails(e.target.value)} /></label>
            <label><span className={LABEL}>Lens set</span><input className={FIELD} value={lensDetails} onChange={(e) => setLensDetails(e.target.value)} /></label>
            <label className="sm:col-span-2"><span className={LABEL}>Drone, gimbal, lighting, audio & other</span><input className={FIELD} value={otherEquipment} onChange={(e) => setOtherEquipment(e.target.value)} /></label>
            <label className="sm:col-span-2"><span className={LABEL}>Equipment overview</span><input className={FIELD} value={equipmentAvailable} onChange={(e) => setEquipmentAvailable(e.target.value)} /></label>
          </div>
        </Section>

        <Section title="Commercial information">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(showPhotoRate || showVideoRate || !showDroneRate) && (
              <label><span className={LABEL}>Day rate</span><input type="number" min={0} className={FIELD} value={perDayCharges} onChange={(e) => setPerDayCharges(Number(e.target.value))} /></label>
            )}
            <label><span className={LABEL}>Half-day rate</span><input type="number" min={0} className={FIELD} value={halfDayCharges} onChange={(e) => setHalfDayCharges(Number(e.target.value))} /></label>
            {showDroneRate && <label><span className={LABEL}>Drone / event rate</span><input type="number" min={0} className={FIELD} value={eventCharges} onChange={(e) => setEventCharges(Number(e.target.value))} /></label>}
            {showVideoRate && !showDroneRate && <label><span className={LABEL}>Editing / event rate</span><input type="number" min={0} className={FIELD} value={eventCharges} onChange={(e) => setEventCharges(Number(e.target.value))} /></label>}
            <label><span className={LABEL}>Travel</span><input type="number" min={0} className={FIELD} value={travelCharges} onChange={(e) => setTravelCharges(Number(e.target.value))} /></label>
            <label><span className={LABEL}>Overtime</span><input type="number" min={0} className={FIELD} value={overtimeCharges} onChange={(e) => setOvertimeCharges(Number(e.target.value))} /></label>
            <label><span className={LABEL}>Extra hour</span><input type="number" min={0} className={FIELD} value={extraHourCharges} onChange={(e) => setExtraHourCharges(Number(e.target.value))} /></label>
            <label><span className={LABEL}>Other charges</span><input type="number" min={0} className={FIELD} value={otherCharges} onChange={(e) => setOtherCharges(Number(e.target.value))} /></label>
            <label className="col-span-2 sm:col-span-4"><span className={LABEL}>Rate notes</span><input className={FIELD} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          </div>
        </Section>

        <Section title="Availability">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={travelAvailability} onChange={(e) => setTravelAvailability(e.target.checked)} />
              Available for travel / destination
            </label>
            <label><span className={LABEL}>Max shoots per day</span><input type="number" min={1} className={FIELD} value={maxShootsPerDay} onChange={(e) => setMaxShootsPerDay(Number(e.target.value))} /></label>
            <label><span className={LABEL}>Instagram</span><input className={FIELD} value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} /></label>
            <label className="sm:col-span-2"><span className={LABEL}>Portfolio website</span><input className={FIELD} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} /></label>
          </div>
        </Section>

        <Section title="Documents & payout (admin only)">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label><span className={LABEL}>PAN</span><input className={FIELD} value={panNumber} onChange={(e) => setPanNumber(e.target.value)} /></label>
            <label><span className={LABEL}>GST</span><input className={FIELD} value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} /></label>
            <label><span className={LABEL}>Payment method</span>
              <select className={FIELD} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as Freelancer['paymentMethod'])}>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label><span className={LABEL}>UPI ID</span><input className={FIELD} value={upiId} onChange={(e) => setUpiId(e.target.value)} /></label>
            <label><span className={LABEL}>Bank name</span><input className={FIELD} value={bankName} onChange={(e) => setBankName(e.target.value)} /></label>
            <label><span className={LABEL}>Account holder</span><input className={FIELD} value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} /></label>
            <label><span className={LABEL}>Account number</span><input className={FIELD} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} /></label>
            <label><span className={LABEL}>IFSC</span><input className={FIELD} value={ifsc} onChange={(e) => setIfsc(e.target.value)} /></label>
            <label className="sm:col-span-3"><span className={LABEL}>Payment notes</span><input className={FIELD} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} /></label>
            <label className="sm:col-span-3"><span className={LABEL}>Internal admin notes</span><textarea className={`${FIELD} min-h-20`} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} /></label>
          </div>
        </Section>

        <div className="flex justify-end gap-2 border-t border-[#eee7e2] pt-4">
          <button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button>
          <button type="submit" className={BTN_PRIMARY}>{existingFreelancer ? 'Update Freelancer' : 'Save Freelancer'}</button>
        </div>
      </form>
    </Modal>
  );
};
