export interface User {
  id: string;
  name: string;
  designation: string;
  whatsapp?: string;
  email?: string;
  selfie_url?: string;
}

export interface Shift {
  id: string;
  user_id: string;
  type: 'General' | 'Morning' | 'Afternoon' | 'Night';
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed';
}

export interface Activity {
  id: string;
  shift_id: string;
  type: 'Patrol Completed' | 'Visitor Entry' | 'Incident Report' | 'Maintenance Issue' | 'Suspicious Activity' | 'Emergency Alert';
  note?: string;
  photo_url?: string;
  timestamp: string;
  location?: string;
  emergency_type?: string;
  erp_id?: string;
  ai_report?: string;
  status?: 'Open' | 'In Progress' | 'Closed';
}

export interface EmergencyAlert {
  id: string;
  shift_id: string;
  type: string;
  location: string;
  timestamp: string;
  reported_by: string;
  photo_url?: string;
  actions_taken?: string[];
  erp_id: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

export interface Patrol {
  id: string;
  shift_id: string;
  start_time: string;
  end_time?: string;
}

export interface Visitor {
  id: string;
  shift_id: string;
  name: string;
  phone: string;
  purpose: string;
  person_to_meet: string;
  vehicle_number?: string;
  photo_url?: string;
  timestamp: string;
  exit_time?: string;
  duration?: number;
  qr_code?: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Denied';
  approval_status: 'Pending' | 'Approved' | 'Denied';
  location?: string;
}

export interface Incident {
  id: string;
  shift_id: string;
  type: string;
  location: string;
  reported_by: string;
  timestamp: string;
  note?: string;
  photo_url?: string;
  status: 'Open' | 'In Progress' | 'Closed';
  
  // HIRA fields
  hazard_identification?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  risk_description?: string;
  
  // CAPA fields
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  risk_priority?: string;
  
  // Assignment
  assigned_to_name?: string;
  assigned_to_phone?: string;
  
  // Verification
  after_photo_url?: string;
  closed_at?: string;
  
  // AI Report
  ai_report?: string;
}
