import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "" 
});

export interface ShiftData {
  shift: any;
  activities: any[];
  patrols: any[];
  visitors: any[];
  language?: string;
}

export async function generateHandoverSummary(data: ShiftData) {
  const { shift, activities, patrols, visitors, language = 'en' } = data;

  const languageMap: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    mr: 'Marathi',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    bn: 'Bengali',
    gu: 'Gujarati',
    es: 'Spanish',
    ar: 'Arabic'
  };

  const targetLanguage = languageMap[language] || 'English';

  if (activities.length === 0 && patrols.length === 0) {
    const prompt = `Translate the following message into ${targetLanguage}:
    "AI Handover Summary
    You didn't work today.
    Zero productive hours were recorded.
    No patrol, incident, or visitor logs were entered during this shift.
    Please ensure activities are recorded in the next shift."`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return response.text;
    } catch (e) {
      return "Zero productive hours were recorded.";
    }
  }

  const prompt = `
    You are an expert security supervisor. Based on the following activity logs from a security guard's shift, generate a professional handover report in ${targetLanguage}.
    
    Shift Info:
    - Guard Name: ${shift.user_name || 'Guard'}
    - Designation: ${shift.designation || 'Security Personnel'}
    - Shift Type: ${shift.type}
    - Start Time: ${shift.start_time}
    - End Time: ${shift.end_time || new Date().toISOString()}
    
    Activities:
    ${activities.map(a => `- [${a.timestamp}] ${a.type}: ${a.note || 'No notes'}${a.hazard_identification ? ` (Hazard: ${a.hazard_identification}, Severity: ${a.severity}, Status: ${a.status})` : ''}${a.emergency_type ? ` (EMERGENCY: ${a.emergency_type}, ERP ID: ${a.erp_id})` : ''}`).join('\n')}
    
    Patrols:
    ${patrols.length} patrols completed.

    Visitors:
    ${visitors.map(v => `- [${v.timestamp}] ${v.name} to meet ${v.person_to_meet}. Status: ${v.status}. Duration: ${v.duration || 'N/A'} mins`).join('\n')}
    
    Please generate the report with this EXACT structure:
    
    AI Shift Handover Summary 🤖
    
    Guard Name: ${shift.user_name || 'Guard'}
    Designation: ${shift.designation || 'Security Personnel'}
    Shift Type: ${shift.type}
    Date: ${new Date().toLocaleDateString()}
    Start Time: ${new Date(shift.start_time).toLocaleTimeString()}
    End Time: ${new Date(shift.end_time || new Date().toISOString()).toLocaleTimeString()}
    
    Activity Summary:
    • ${patrols.length} Patrol Rounds Completed
    • ${visitors.length} Visitors Logged (${visitors.filter(v => v.status === 'Completed').length} Completed)
    • ${activities.filter(a => a.type === 'Incident Report' || a.type === 'Safety Hazard').length} Safety Hazards/Incidents Reported
    • ${activities.filter(a => a.type === 'Emergency Alert').length} Emergency Alerts Triggered
    
    Emergency Alert Details:
    ${activities.filter(a => a.type === 'Emergency Alert').map(a => `- Emergency: ${a.emergency_type}, Location: ${a.location}, Time: ${new Date(a.timestamp).toLocaleTimeString()}, ERP ID: ${a.erp_id}, Status: ${a.status}${a.ai_report ? `\n    AI Analysis: ${a.ai_report}` : ''}`).join('\n') || 'No emergency alerts triggered.'}

    Safety Hazard Details:
    ${activities.filter(a => a.hazard_identification).map(a => `- Hazard: ${a.hazard_identification}, Location: ${a.location}, Severity: ${a.severity}, Status: ${a.status}, Assigned To: ${a.assigned_to_name || 'Unassigned'}`).join('\n') || 'No safety hazards reported.'}

    Visitor Details:
    ${visitors.map(v => `- Visitor: ${v.name}, Meeting With: ${v.person_to_meet}, Entry: ${new Date(v.timestamp).toLocaleTimeString()}, Exit: ${v.exit_time ? new Date(v.exit_time).toLocaleTimeString() : 'Still on site'}, Duration: ${v.duration || 'N/A'} mins`).join('\n')}

    Detailed Logs:
    ${activities.map(a => `- [${new Date(a.timestamp).toLocaleTimeString()}] ${a.type}: ${a.note}`).join('\n')}
    
    Overall Status: [Normal/Alert/Critical]
    
    Keep the tone professional and clear. Generate the report in ${targetLanguage}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI summary. Please write manually.";
  }
}

export async function processVoiceIncident(transcript: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract incident details from this transcript: "${transcript}". Return JSON with: type, location, time, reported_by.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          location: { type: Type.STRING },
          time: { type: Type.STRING },
          reported_by: { type: Type.STRING },
        },
        required: ["type", "location", "time", "reported_by"],
      },
    },
  });
  return JSON.parse(response.text || "{}");
}

export async function processPhotoIncident(base64Image: string, location: string) {
  const cleanBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
        { text: `Analyze this safety hazard photo at location: ${location}. 
        Perform a full HIRA (Hazard Identification & Risk Assessment) and CAPA (Corrective and Preventive Action).
        Return JSON with:
        - hazard_identification: Name of the hazard
        - severity: Low, Medium, High, or Critical
        - risk_description: Detailed description of the risk
        - root_cause: Analysis of why this happened
        - corrective_action: Immediate fix required
        - preventive_action: Future prevention steps
        - risk_priority: Priority level (e.g., P1, P2, P3)
        ` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hazard_identification: { type: Type.STRING },
          severity: { type: Type.STRING },
          risk_description: { type: Type.STRING },
          root_cause: { type: Type.STRING },
          corrective_action: { type: Type.STRING },
          preventive_action: { type: Type.STRING },
          risk_priority: { type: Type.STRING },
        },
        required: ["hazard_identification", "severity", "risk_description", "root_cause", "corrective_action", "preventive_action", "risk_priority"],
      },
    },
  });
  return JSON.parse(response.text || "{}");
}

export async function analyzeSecurityIncident(base64Image: string, type: string, location: string, description?: string) {
  const cleanBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
  const prompt = `Analyze this security incident photo for a "${type}" event at location: ${location}.
  ${description ? `User Description: "${description}"` : ""}
  
  Based on the incident type, provide a detailed report in JSON format.
  
  1. For "Theft / Missing Item":
     - possible_stolen_item: String
     - location: String
     - time_of_report: String (current time)
     - description_of_incident: String
     - suggested_security_action: String
     
  2. For "Suspicious Person":
     - description_of_person: String
     - suspicious_behavior_indicators: String
     - location: String
     - time_of_report: String
     - suggested_security_response: String
     
  3. For "Bomb Threat":
     - suspicious_object_detection: String
     - location: String
     - risk_level: "Low", "Medium", "High", or "Critical"
     - immediate_safety_instructions: String
     - suggested_emergency_response: String
     
  4. For "Active Shooter":
     - threat_detection_indicators: String
     - location: String
     - risk_level: "Critical"
     - immediate_safety_guidance: String
     - emergency_response_notification: String
     
  5. For "Unauthorized Access":
     - possible_unauthorized_entry: String
     - location: String
     - security_risk_level: "Low", "Medium", "High", or "Critical"
     - recommended_security_action: String
     
  6. For "Vandalism":
     - type_of_damage: String
     - affected_property: String
     - location: String
     - estimated_severity: "Low", "Medium", "High", or "Critical"
     - suggested_corrective_action: String

  Return ONLY the JSON object corresponding to the incident type.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text || "{}");
}

export async function getEmergencyGuidance(type: string) {
  const prompt = `Provide immediate safety instructions for a ${type} emergency in a facility. 
  The instructions should be concise, actionable, and prioritized. 
  Return JSON with:
  - instructions: Array of strings (3-5 key steps)
  - quick_report_summary: A short summary of the emergency for reporting
  - priority: High or Critical
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            quick_report_summary: { type: Type.STRING },
            priority: { type: Type.STRING }
          },
          required: ["instructions", "quick_report_summary", "priority"],
        },
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Gemini Emergency Guidance Error:", e);
    return {
      instructions: ["Activate the nearest alarm", "Evacuate the area", "Contact emergency services"],
      quick_report_summary: `${type} emergency reported.`,
      priority: "Critical"
    };
  }
}
