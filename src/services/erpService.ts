import { EmergencyAlert } from '../types';

export interface ERPIncident {
  id: string;
  type: string;
  location: string;
  reported_by: string;
  timestamp: string;
  status: 'Open' | 'In Progress' | 'Closed';
  assigned_to: string[];
  notifications_sent_to: string[];
}

export async function createEmergencyIncident(data: {
  type: string;
  location: string;
  reported_by: string;
  timestamp: string;
}): Promise<ERPIncident> {
  // Simulate API call to ERP
  console.log("ERP: Creating emergency incident...", data);
  
  const erpId = `ERP-EMG-${Math.floor(Math.random() * 10000)}`;
  
  const incident: ERPIncident = {
    id: erpId,
    ...data,
    status: 'Open',
    assigned_to: ['Safety Team', 'Emergency Response Team (ERT)'],
    notifications_sent_to: ['Safety Team', 'Facility Management', 'Department Head']
  };

  // Simulate notification delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`ERP: Incident ${erpId} created and notifications sent.`);
  
  return incident;
}

export async function updateIncidentStatus(id: string, status: 'Open' | 'In Progress' | 'Closed') {
  console.log(`ERP: Updating incident ${id} status to ${status}`);
  return { success: true };
}
