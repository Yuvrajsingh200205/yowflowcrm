export interface EquipmentItem {
  id: string;
  name: string;
  category: 'Cameras' | 'Lenses' | 'Drones' | 'Lighting' | 'Audio' | 'Gimbals & Stabilizers' | 'Accessories' | 'Other';
  customCategory?: string;
  serialNumber?: string;
  status: 'available' | 'in_use' | 'maintenance';
  assignedToShoot?: string;
  assignedMember?: string;
  conditionNote?: string;
  purchaseDate?: string;
}

export const EQUIPMENT_CATEGORIES: EquipmentItem['category'][] = ['Cameras', 'Lenses', 'Drones', 'Lighting', 'Audio', 'Gimbals & Stabilizers', 'Accessories', 'Other'];

export const INITIAL_EQUIPMENT: EquipmentItem[] = [
  { id: 'eq-1', name: 'Sony FX3 Cinema Camera Body', category: 'Cameras', serialNumber: 'FX3-98210', status: 'in_use', assignedToShoot: 'Rohan & Ananya Royal Wedding', assignedMember: 'Alex Morgan', conditionNote: 'Pristine condition. Clean sensor.' },
  { id: 'eq-2', name: 'Sony A7IV Full Frame Body #1', category: 'Cameras', serialNumber: 'A74-11022', status: 'available', conditionNote: 'Dual SD card loaded.' },
  { id: 'eq-3', name: 'Sony A7IV Full Frame Body #2', category: 'Cameras', serialNumber: 'A74-11023', status: 'available' },
  { id: 'eq-4', name: 'Sony 24-70mm f/2.8 GM II Lens', category: 'Lenses', serialNumber: 'GM2470-33', status: 'in_use', assignedToShoot: 'Siddharth & Meera Pre-Wedding', assignedMember: 'Tokir' },
  { id: 'eq-5', name: 'Sony 85mm f/1.4 GM Lens', category: 'Lenses', serialNumber: 'GM85-004', status: 'available' },
  { id: 'eq-6', name: 'Sony 70-200mm f/2.8 GM OSS II Lens', category: 'Lenses', serialNumber: 'GM70200-12', status: 'available' },
  { id: 'eq-7', name: 'DJI Mini 4 Pro Drone + Fly More Combo', category: 'Drones', serialNumber: 'M4P-8812', status: 'available', conditionNote: '3 batteries charged to 100%.' },
  { id: 'eq-8', name: 'DJI RS3 Pro Gimbal Stabilizer', category: 'Gimbals & Stabilizers', serialNumber: 'RS3P-091', status: 'in_use', assignedToShoot: 'Rohan & Ananya Royal Wedding', assignedMember: 'Mohit' },
  { id: 'eq-9', name: 'Godox AD600 Pro Strobe Flash (Set of 2)', category: 'Lighting', serialNumber: 'AD600-SET1', status: 'available' },
  { id: 'eq-10', name: 'Aputure 300d II Daylight LED Light', category: 'Lighting', serialNumber: 'AP300-441', status: 'available' },
  { id: 'eq-11', name: 'Sennheiser AVX Wireless Lavalier Mic Kit', category: 'Audio', serialNumber: 'AVX-991', status: 'available' },
  { id: 'eq-12', name: 'Godox V1 Speedlight Flash for Sony', category: 'Lighting', serialNumber: 'GV1-221', status: 'maintenance', conditionNote: 'Hotshoe mount loose - sent for warranty repair.' },
];
