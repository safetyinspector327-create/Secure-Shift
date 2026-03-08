import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Clock, 
  Camera, 
  User as UserIcon, 
  Phone, 
  Mail, 
  ChevronRight, 
  Play, 
  Square, 
  FileText, 
  AlertTriangle, 
  Users, 
  Wrench, 
  Eye, 
  CheckCircle2,
  Mic,
  Send,
  LogOut,
  BarChart3,
  Share2,
  UserPlus,
  MapPin,
  QrCode,
  History,
  AlertOctagon,
  X,
  Plus,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { User, Shift, Activity, Patrol, Visitor, Incident, EmergencyAlert } from './types';
import { EMERGENCY_STRUCTURE } from './constants';
import { generateHandoverSummary, processVoiceIncident, processPhotoIncident, getEmergencyGuidance, analyzeSecurityIncident } from './services/geminiService';
import { createEmergencyIncident } from './services/erpService';
import { jsPDF } from "jspdf";

// --- Contexts ---

const AuthContext = createContext<{
  user: User | null;
  login: (data: Partial<User>) => Promise<void>;
  logout: () => void;
} | null>(null);

const LanguageContext = createContext<{
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
} | null>(null);

const translations: Record<string, Record<string, string>> = {
  en: {
    welcome: "Secure Shift",
    tagline: "Smart security management",
    select_lang: "Select Language",
    who_are_you: "Who are you?",
    full_name: "Full Name",
    designation: "Designation",
    contact_details: "Contact Details",
    whatsapp: "WhatsApp Number",
    email: "Email Address",
    continue: "Continue",
    finish: "Finish Setup",
    skip: "Skip for now",
    start_shift: "START SHIFT",
    ready_to_work: "Ready to work?",
    off_duty: "You are currently off-duty.",
    on_duty: "ON DUTY",
    patrol: "Patrol Tracking",
    start_patrol: "Start Patrol",
    end_patrol: "End Patrol",
    log_activity: "Log Activity",
    end_shift: "End Shift",
    shift_completed: "Shift Completed!",
    generating_report: "Generating your AI Handover Report...",
    share_whatsapp: "Share via WhatsApp",
    share_email: "Send via Email",
    back_home: "Back to Home",
    verify_identity: "Verify Identity",
    take_selfie: "TAKE SELFIE",
    select_shift: "Select Shift Type",
    start_now: "Start Now",
    speak_report: "Speak Report",
    visitor_entry: "Visitor Entry",
    photo_report: "Photo Report",
    emergency_alert: "Emergency Alert",
    activity_timeline: "Timeline",
    submit_report: "Submit Report",
    visitor_name: "Visitor Name",
    phone_number: "Phone Number",
    purpose: "Purpose",
    person_to_meet: "Person to Meet",
    generate_pass: "Generate Pass",
    emergency_confirmed: "Emergency reported at",
    confirm_end_shift: "Are you sure you want to end your shift?",
    cancel: "Cancel",
    confirm: "Confirm",
    shift_completed_msg: "Shift Completed Successfully",
    thank_you: "Thank you for your work today.",
    start_new_shift: "Start New Shift",
    go_to_dashboard: "Go to Dashboard",
    hazard_heatmap: "AI Hazard Heatmap",
    report_hazard: "Report Hazard",
    smart_insights: "AI Smart Insights",
    emergency_alert_title: "EMERGENCY ALERT",
    emergency_type_prompt: "What type of emergency is occurring?",
    emergency_location_captured: "GPS Location Captured",
    emergency_notifying: "Notifying Safety Team & ERP...",
    emergency_instructions: "Immediate Safety Instructions",
    emergency_reported: "Emergency Reported Successfully",
    emergency_erp_id: "ERP Incident ID",
    emergency_actions_taken: "Actions Taken",
    emergency_fire: "Fire",
    emergency_medical: "Medical Emergency",
    emergency_electrical: "Electrical Hazard",
    emergency_chemical: "Chemical Spill",
    emergency_gas: "Gas Leak",
    emergency_accident: "Accident or Injury",
    emergency_other: "Other Emergency",
    my_attendance: "My Attendance",
    team: "Team"
  },
  hi: {
    welcome: "सिक्योर शिफ्ट",
    tagline: "स्मार्ट सुरक्षा प्रबंधन",
    select_lang: "भाषा चुनें",
    who_are_you: "आप कौन हैं?",
    full_name: "पूरा नाम",
    designation: "पद",
    contact_details: "संपर्क विवरण",
    whatsapp: "व्हाट्सएप नंबर",
    email: "ईमेल पता",
    continue: "जारी रखें",
    finish: "सेटअप पूरा करें",
    skip: "अभी छोड़ें",
    start_shift: "शिफ्ट शुरू करें",
    ready_to_work: "काम के लिए तैयार?",
    off_duty: "आप अभी ड्यूटी पर नहीं हैं।",
    on_duty: "ड्यूटी पर",
    patrol: "गश्त ट्रैकिंग",
    start_patrol: "गश्त शुरू करें",
    end_patrol: "गश्त समाप्त करें",
    log_activity: "गतिविधि लॉग करें",
    end_shift: "शिफ्ट समाप्त करें",
    shift_completed: "शिफ्ट पूरी हुई!",
    generating_report: "आपकी AI हैंडओवर रिपोर्ट तैयार की जा रही है...",
    share_whatsapp: "व्हाट्सएप पर साझा करें",
    share_email: "ईमेल द्वारा भेजें",
    back_home: "होम पर वापस जाएं",
    verify_identity: "पहचान सत्यापित करें",
    take_selfie: "सेल्फी लें",
    select_shift: "शिफ्ट का प्रकार चुनें",
    start_now: "अभी शुरू करें",
    hazard_heatmap: "AI खतरा हीटमैप",
    report_hazard: "खतरे की रिपोर्ट करें",
    smart_insights: "AI स्मार्ट अंतर्दृष्टि",
    emergency_alert_title: "आपातकालीन अलर्ट",
    emergency_type_prompt: "किस प्रकार की आपात स्थिति हो रही है?",
    emergency_location_captured: "GPS स्थान कैप्चर किया गया",
    emergency_notifying: "सुरक्षा टीम और ERP को सूचित किया जा रहा है...",
    emergency_instructions: "तत्काल सुरक्षा निर्देश",
    emergency_reported: "आपातकाल की सूचना सफलतापूर्वक दी गई",
    emergency_erp_id: "ERP इंसिडेंट आईडी",
    emergency_actions_taken: "की गई कार्रवाई",
    emergency_fire: "आग",
    emergency_medical: "चिकित्सा आपातकाल",
    emergency_electrical: "बिजली का खतरा",
    emergency_chemical: "रासायनिक रिसाव",
    emergency_gas: "गैस रिसाव",
    emergency_accident: "दुर्घटना या चोट",
    emergency_other: "अन्य आपातकाल",
    my_attendance: "मेरी उपस्थिति",
    team: "टीम"
  },
  mr: {
    welcome: "सिक्योर शिफ्ट",
    tagline: "स्मार्ट सुरक्षा व्यवस्थापन",
    select_lang: "भाषा निवडा",
    who_are_you: "तुम्ही कोण आहात?",
    full_name: "पूर्ण नाव",
    designation: "पद",
    contact_details: "संपर्क तपशील",
    whatsapp: "व्हॉट्सॲप नंबर",
    email: "ईमेल पत्ता",
    continue: "पुढील",
    finish: "सेटअप पूर्ण करा",
    skip: "आता सोडा",
    start_shift: "शिफ्ट सुरू करा",
    ready_to_work: "कामासाठी तयार?",
    off_duty: "तुम्ही सध्या ड्युटीवर नाही आहात.",
    on_duty: "ड्युटीवर",
    patrol: "गस्त ट्रॅकिंग",
    start_patrol: "गस्त सुरू करा",
    end_patrol: "गस्त संपवा",
    log_activity: "कृती नोंदवा",
    end_shift: "शिफ्ट संपवा",
    shift_completed: "शिफ्ट पूर्ण झाली!",
    generating_report: "तुमचा AI हँडओव्हर रिपोर्ट तयार होत आहे...",
    share_whatsapp: "व्हॉट्सॲपवर शेअर करा",
    share_email: "ईमेलद्वारे पाठवा",
    back_home: "होमवर परत जा",
    verify_identity: "ओळख पटवा",
    take_selfie: "सेल्फी घ्या",
    select_shift: "शिफ्टचा प्रकार निवडा",
    start_now: "आता सुरू करा",
    hazard_heatmap: "AI धोका हीटमॅप",
    report_hazard: "धोक्याची तक्रार करा",
    smart_insights: "AI स्मार्ट अंतर्दृष्टी",
    emergency_alert_title: "आणीबाणी अलर्ट",
    emergency_type_prompt: "कोणत्या प्रकारची आणीबाणी उद्भवली आहे?",
    emergency_location_captured: "GPS स्थान टिपले गेले",
    emergency_notifying: "सुरक्षा टीम आणि ERP ला सूचित करत आहे...",
    emergency_instructions: "त्वरीत सुरक्षा सूचना",
    emergency_reported: "आणीबाणीची यशस्वीरित्या नोंद झाली",
    emergency_erp_id: "ERP इन्सिडेंट आयडी",
    emergency_actions_taken: "केलेली कारवाई",
    emergency_fire: "आग",
    emergency_medical: "वैद्यकीय आणीबाणी",
    emergency_electrical: "विद्युत धोका",
    emergency_chemical: "रासायनिक गळती",
    emergency_gas: "गॅस गळती",
    emergency_accident: "अपघात किंवा दुखापत",
    emergency_other: "इतर आणीबाणी",
    my_attendance: "माझी उपस्थिती",
    team: "टीम"
  },
  ta: {
    welcome: "செக்யூர் ஷிப்ட்",
    tagline: "ஸ்மார்ட் பாதுகாப்பு மேலாண்மை",
    select_lang: "மொழியைத் தேர்ந்தெடுக்கவும்",
    who_are_you: "நீங்கள் யார்?",
    full_name: "முழு பெயர்",
    designation: "பதவி",
    contact_details: "தொடர்பு விவரங்கள்",
    whatsapp: "வாட்ஸ்அப் எண்",
    email: "மின்னஞ்சல் முகவரி",
    continue: "தொடரவும்",
    finish: "அமைப்பை முடிக்கவும்",
    skip: "இப்போது தவிர்க்கவும்",
    start_shift: "ஷிப்ட் தொடங்கவும்",
    ready_to_work: "வேலைக்குத் தயாரா?",
    off_duty: "நீங்கள் தற்போது பணியில் இல்லை.",
    on_duty: "பணியில்",
    patrol: "ரோந்து கண்காணிப்பு",
    start_patrol: "ரோந்து தொடங்கவும்",
    end_patrol: "ரோந்து முடிக்கவும்",
    log_activity: "செயல்பாட்டைப் பதிவு செய்யவும்",
    end_shift: "ஷிப்ட் முடிக்கவும்",
    shift_completed: "ஷிப்ட் முடிந்தது!",
    generating_report: "உங்கள் AI ஹேண்டோவர் அறிக்கை தயாரிக்கப்படுகிறது...",
    share_whatsapp: "வாட்ஸ்அப்பில் பகிரவும்",
    share_email: "மின்னஞ்சல் மூலம் அனுப்பவும்",
    back_home: "முகப்புக்குச் செல்லவும்",
    verify_identity: "அடையாளத்தைச் சரிபார்க்கவும்",
    take_selfie: "செல்ஃபி எடுக்கவும்",
    select_shift: "ஷிப்ட் வகையைத் தேர்ந்தெடுக்கவும்",
    start_now: "இப்போது தொடங்கவும்",
    hazard_heatmap: "AI அபாய வெப்ப வரைபடம்",
    report_hazard: "அபாயத்தைப் புகாரளிக்கவும்",
    smart_insights: "AI ஸ்மார்ட் நுண்ணறிவு",
    emergency_alert_title: "அவசர எச்சரிக்கை",
    emergency_type_prompt: "என்ன வகையான அவசரநிலை ஏற்படுகிறது?",
    emergency_location_captured: "GPS இருப்பிடம் எடுக்கப்பட்டது",
    emergency_notifying: "பாதுகாப்பு குழு மற்றும் ERP-க்கு அறிவிக்கப்படுகிறது...",
    emergency_instructions: "உடனடி பாதுகாப்பு வழிமுறைகள்",
    emergency_reported: "அவசரநிலை வெற்றிகரமாக புகாரளிக்கப்பட்டது",
    emergency_erp_id: "ERP சம்பவ ஐடி",
    emergency_actions_taken: "எடுக்கப்பட்ட நடவடிக்கைகள்",
    emergency_fire: "தீ",
    emergency_medical: "மருத்துவ அவசரநிலை",
    emergency_electrical: "மின்சார அபாயம்",
    emergency_chemical: "ரசாயன கசிவு",
    emergency_gas: "எரிவாயு கசிவு",
    emergency_accident: "விபத்து அல்லது காயம்",
    emergency_other: "இதர அவசரநிலை",
    my_attendance: "எனது வருகை",
    team: "குழு"
  },
  es: {
    welcome: "Secure Shift",
    tagline: "Gestión de seguridad inteligente",
    select_lang: "Seleccionar idioma",
    who_are_you: "¿Quién eres?",
    full_name: "Nombre completo",
    designation: "Designación",
    contact_details: "Detalles de contacto",
    whatsapp: "Número de WhatsApp",
    email: "Correo electrónico",
    continue: "Continuar",
    finish: "Finalizar configuración",
    skip: "Omitir por ahora",
    start_shift: "INICIAR TURNO",
    ready_to_work: "¿Listo para trabajar?",
    off_duty: "Actualmente estás fuera de servicio.",
    on_duty: "EN SERVICIO",
    patrol: "Seguimiento de patrulla",
    start_patrol: "INICIAR PATRULLA",
    end_patrol: "FINALIZAR PATRULLA",
    log_activity: "Registrar actividad",
    end_shift: "FINALIZAR TURNO",
    shift_completed: "¡Turno completado!",
    generating_report: "Generando su informe de entrega de AI...",
    share_whatsapp: "Compartir por WhatsApp",
    share_email: "Enviar por correo electrónico",
    back_home: "Volver al inicio",
    verify_identity: "Verificar identidad",
    take_selfie: "TOMAR SELFIE",
    select_shift: "Seleccionar tipo de turno",
    start_now: "Iniciar ahora",
    hazard_heatmap: "Mapa de calor de peligros de IA",
    report_hazard: "Informar peligro",
    smart_insights: "Perspectivas inteligentes de IA",
    emergency_alert_title: "ALERTA DE EMERGENCIA",
    emergency_type_prompt: "¿Qué tipo de emergencia está ocurriendo?",
    emergency_location_captured: "Ubicación GPS capturada",
    emergency_notifying: "Notificando al equipo de seguridad y ERP...",
    emergency_instructions: "Instrucciones de seguridad inmediatas",
    emergency_reported: "Emergencia reportada con éxito",
    emergency_erp_id: "ID de incidente ERP",
    emergency_actions_taken: "Acciones tomadas",
    emergency_fire: "Fuego",
    emergency_medical: "Emergencia médica",
    emergency_electrical: "Peligro eléctrico",
    emergency_chemical: "Derrame químico",
    emergency_gas: "Fuga de gas",
    emergency_accident: "Accidente o lesión",
    emergency_other: "Otra emergencia",
    my_attendance: "Mi asistencia",
    team: "Equipo"
  }
};

const ShiftContext = createContext<{
  activeShift: Shift | null;
  startShift: (type: string) => Promise<void>;
  endShift: () => Promise<void>;
  activePatrol: Patrol | null;
  startPatrol: () => Promise<void>;
  endPatrol: () => Promise<void>;
} | null>(null);

// --- Components ---

const SafetyHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const lang = useContext(LanguageContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hRes, iRes] = await Promise.all([
          fetch('/api/safety/heatmap'),
          fetch('/api/safety/insights')
        ]);
        const hData = await hRes.json();
        const iData = await iRes.json();
        setHeatmapData(hData);
        setInsights(iData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getRiskColor = (score: number) => {
    if (score >= 15) return 'bg-rose-500';
    if (score >= 5) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 15) return 'High Risk';
    if (score >= 5) return 'Medium Risk';
    return 'Low Risk';
  };

  // Predefined areas for the facility map
  const areas = [
    { id: 'electrical', name: 'Electrical Room', x: 10, y: 10, w: 30, h: 30 },
    { id: 'warehouse', name: 'Warehouse Aisle', x: 50, y: 10, w: 40, h: 60 },
    { id: 'office', name: 'Office Area', x: 10, y: 50, w: 30, h: 40 },
    { id: 'gate', name: 'Main Gate', x: 50, y: 80, w: 40, h: 10 },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-48 bg-slate-200 rounded-[32px]" />
      <div className="h-24 bg-slate-200 rounded-[32px]" />
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-0 overflow-hidden border-2 border-slate-100">
        <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-sm"><MapPin size={16} /> {lang?.t('hazard_heatmap')}</h3>
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Live AI Analysis</span>
        </div>
        
        <div className="relative aspect-video bg-slate-50 p-4">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {areas.map(area => {
              const data = heatmapData.find(d => d.location.toLowerCase().includes(area.name.toLowerCase().split(' ')[0].toLowerCase()));
              const score = data?.risk_score || 0;
              const color = getRiskColor(score);
              
              return (
                <g key={area.id}>
                  <rect 
                    x={area.x} y={area.y} width={area.w} height={area.h} 
                    className={`${color} opacity-40 transition-all duration-500`}
                    rx="2"
                  />
                  <rect 
                    x={area.x} y={area.y} width={area.w} height={area.h} 
                    fill="none" stroke="currentColor" strokeWidth="0.5"
                    className="text-slate-300"
                    rx="2"
                  />
                  <text 
                    x={area.x + area.w/2} y={area.y + area.h/2} 
                    textAnchor="middle" 
                    className="text-[3.5px] font-black fill-slate-800"
                  >
                    {area.name}
                  </text>
                  <text 
                    x={area.x + area.w/2} y={area.y + area.h/2 + 4} 
                    textAnchor="middle" 
                    className="text-[2.5px] font-black fill-slate-500 uppercase tracking-tighter"
                  >
                    {getRiskLevel(score)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        
        <div className="p-3 bg-white border-t flex gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">High Risk</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Medium Risk</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Safe Zone</span>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
          <BarChart3 size={14} /> {lang?.t('smart_insights')}
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {insights.map((insight, idx) => (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: idx * 0.1 }}
              key={idx}
            >
              <Card className={`p-4 border-l-4 ${
                insight.priority === 'High' ? 'border-l-rose-500 bg-rose-50/30' : 'border-l-blue-500 bg-blue-50/30'
              }`}>
                <div className="flex gap-4">
                  <div className={`p-2.5 rounded-2xl shrink-0 h-fit ${
                    insight.type === 'patrol' ? 'bg-blue-100 text-blue-600' : 
                    insight.type === 'training' ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {insight.type === 'patrol' ? <MapPin size={20} /> : 
                     insight.type === 'training' ? <Users size={20} /> : <Wrench size={20} />}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{insight.title}</h5>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1 font-medium">{insight.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  icon: Icon,
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; 
  className?: string;
  icon?: any;
  disabled?: boolean;
}) => {
  const variants = {
    primary: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-95',
    secondary: 'bg-white text-slate-800 border border-slate-200 shadow-sm active:scale-95',
    danger: 'bg-rose-500 text-white shadow-lg shadow-rose-200 active:scale-95',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-50'
  };

  return (
    <button 
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={24} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string; key?: React.Key }) => (
  <div className={`bg-white rounded-3xl p-6 shadow-xl shadow-slate-100 border border-slate-50 ${className}`}>
    {children}
  </div>
);

// --- Pages ---

const LoginPage = () => {
  const auth = useContext(AuthContext);
  const lang = useContext(LanguageContext);
  const [step, setStep] = useState(0); // Step 0 for language selection
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    whatsapp: '',
    email: ''
  });

  const handleNext = () => setStep(s => s + 1);
  const handleLogin = () => auth?.login(formData);

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी (Hindi)' },
    { code: 'mr', name: 'मराठी (Marathi)' },
    { code: 'ta', name: 'தமிழ் (Tamil)' },
    { code: 'te', name: 'తెలుగు (Telugu)' },
    { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
    { code: 'bn', name: 'বাংলা (Bengali)' },
    { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
    { code: 'es', name: 'Español (Spanish)' },
    { code: 'ar', name: 'العربية (Arabic)' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-200 mb-6">
            <Shield className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">{lang?.t('welcome')}</h1>
          <p className="text-slate-500">{lang?.t('tagline')}</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <h2 className="text-xl font-bold mb-4 text-center">{lang?.t('select_lang')}</h2>
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => {
                        lang?.setLanguage(l.code);
                        handleNext();
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all text-left font-bold ${
                        lang?.language === l.code 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <h2 className="text-xl font-bold mb-4">{lang?.t('who_are_you')}</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500 block mb-1">{lang?.t('full_name')}</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 block mb-1">{lang?.t('designation')}</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. Senior Guard"
                      value={formData.designation}
                      onChange={e => setFormData({...formData, designation: e.target.value})}
                    />
                  </div>
                </div>
              </Card>
              <Button onClick={handleNext} className="w-full" disabled={!formData.name || !formData.designation}>
                {lang?.t('continue')} <ChevronRight size={20} />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card>
                <h2 className="text-xl font-bold mb-2">{lang?.t('contact_details')}</h2>
                <p className="text-slate-500 text-sm mb-6">Optional: We use this to send your reports.</p>
                <div className="space-y-4">
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                      type="tel" 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder={lang?.t('whatsapp')}
                      value={formData.whatsapp}
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                      type="email" 
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder={lang?.t('email')}
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </Card>
              <div className="flex flex-col gap-3">
                <Button onClick={handleLogin} className="w-full">
                  {lang?.t('finish')}
                </Button>
                <Button variant="ghost" onClick={handleLogin} className="w-full">
                  {lang?.t('skip')}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const EmergencyAlertView = ({ 
  data, 
  onSelectType, 
  onClose,
  loading,
  onCapturePhoto,
  capturedPhoto,
  onUpdateData
}: { 
  data: any; 
  onSelectType: (type: string, location: string, description: string) => void; 
  onClose: () => void;
  loading: boolean;
  onCapturePhoto: () => void;
  capturedPhoto: string | null;
  onUpdateData: (data: any) => void;
}) => {
  const lang = useContext(LanguageContext);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState(data?.location || '');
  const [descriptionInput, setDescriptionInput] = useState('');
  
  const currentCategoryData = selectedCategory 
    ? EMERGENCY_STRUCTURE.find(c => c.category === selectedCategory)
    : null;

  const isFormIncomplete = capturedPhoto && (!locationInput.trim() || !descriptionInput.trim());

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[60] bg-rose-600 p-6 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-center text-white mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
            <AlertOctagon size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">{lang?.t('emergency_alert_title')}</h2>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">AI Response Protocol Active</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 rounded-2xl text-white active:scale-90 transition-all">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-24 pr-1">
        {(!data || data.type === 'Pending Selection') ? (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-white/10 border-white/20 text-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">
                    {capturedPhoto ? 'Confirm Incident Location' : lang?.t('emergency_location_captured')}
                  </p>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className={capturedPhoto ? "text-amber-400" : "text-emerald-400"} />
                    {capturedPhoto ? (
                      <input 
                        type="text"
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        placeholder="Enter specific location..."
                        className="bg-transparent border-b border-white/30 outline-none font-bold text-xs w-full placeholder:text-white/30 focus:border-white/60 transition-colors"
                      />
                    ) : (
                      <p className="font-bold text-xs truncate">{data?.location || 'Capturing...'}</p>
                    )}
                  </div>
                </Card>
                <Card className="bg-white/10 border-white/20 text-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Time Recorded</p>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-400" />
                    <p className="font-bold text-xs">{data ? new Date(data.timestamp).toLocaleTimeString() : 'Recording...'}</p>
                  </div>
                </Card>
              </div>

              {capturedPhoto && (
                <Card className="bg-white/10 border-white/20 text-white p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Incident Description</p>
                  <div className="flex items-start gap-2">
                    <FileText size={14} className="text-purple-400 mt-1" />
                    <textarea 
                      value={descriptionInput}
                      onChange={(e) => setDescriptionInput(e.target.value)}
                      placeholder="Describe what you see in the photo..."
                      className="bg-transparent border-b border-white/30 outline-none font-bold text-xs w-full placeholder:text-white/30 focus:border-white/60 transition-colors resize-none h-12"
                    />
                  </div>
                </Card>
              )}
            </div>

            {/* AI Assistant Bubble */}
            <motion.div 
              key={selectedCategory ? 'cat-selected' : 'no-cat'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 p-5 rounded-[32px] border border-white/20 flex gap-4 items-start shadow-lg"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-900/20">
                <Shield size={20} className="text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-white font-bold text-sm leading-tight">
                  {isFormIncomplete
                    ? "Evidence attached. Please confirm the exact location and provide a brief description in the fields above before selecting the incident type."
                    : selectedCategory 
                      ? `Understood. I've noted the ${selectedCategory.toLowerCase()} incident. Please select the specific type below.`
                      : "I'm your AI Safety Assistant. I've alerted the team. Please tell me what kind of emergency this is."}
                </p>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">AI Assistant • Online</p>
              </div>
            </motion.div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-white font-black text-sm uppercase tracking-widest opacity-80">
                  {selectedCategory ? 'Select Incident Type' : 'Select Category'}
                </h3>
                <div className="flex gap-2">
                  {selectedCategory && (
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="px-4 py-2 rounded-xl bg-white/20 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Back
                    </button>
                  )}
                  <button 
                    onClick={onCapturePhoto}
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${capturedPhoto ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/40' : 'bg-white/20 text-white'}`}
                  >
                    <Camera size={14} />
                    {capturedPhoto ? 'Evidence Attached' : 'Take Photo'}
                  </button>
                </div>
              </div>
              
              {capturedPhoto && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-2"
                >
                  <div className="relative rounded-[32px] overflow-hidden aspect-video border-2 border-white/20 shadow-2xl">
                    <img src={capturedPhoto} alt="Emergency" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <p className="text-white text-[9px] font-black uppercase tracking-widest">Visual Evidence Secured</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <AnimatePresence mode="wait">
                  {!selectedCategory ? (
                    <motion.div 
                      key="categories"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="grid grid-cols-1 gap-3"
                    >
                      {EMERGENCY_STRUCTURE.map((cat) => (
                        <button
                          key={cat.category}
                          disabled={isFormIncomplete}
                          onClick={() => setSelectedCategory(cat.category)}
                          className="bg-white p-5 rounded-[28px] flex items-center gap-4 active:scale-95 transition-all shadow-xl shadow-rose-900/20 group disabled:opacity-50"
                        >
                          <div className={`p-3 ${cat.color} text-white rounded-2xl shadow-lg group-active:scale-90 transition-transform`}>
                            <cat.icon size={24} />
                          </div>
                          <div className="text-left">
                            <span className="font-black text-slate-900 text-lg block leading-none">{cat.category}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                              {cat.types.length} Types Available
                            </span>
                          </div>
                          <ChevronRight className="ml-auto text-slate-300" size={20} />
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="types"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="grid grid-cols-1 gap-3"
                    >
                      {currentCategoryData?.types.map((type) => (
                        <button
                          key={type.id}
                          disabled={loading || isFormIncomplete}
                          onClick={() => onSelectType(type.label, locationInput, descriptionInput)}
                          className="bg-white p-5 rounded-[28px] flex items-center gap-4 active:scale-95 transition-all shadow-xl shadow-rose-900/20 disabled:opacity-50 group"
                        >
                          <div className={`p-3 ${currentCategoryData.color} text-white rounded-2xl shadow-lg group-active:scale-90 transition-transform`}>
                            <type.icon size={24} />
                          </div>
                          <span className="font-black text-slate-900 text-lg">{type.label}</span>
                          <ChevronRight className="ml-auto text-slate-300" size={20} />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] p-8 shadow-2xl space-y-8"
            >
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center shadow-inner">
                  <AlertTriangle size={40} />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{data.type}</h3>
                  <p className="text-slate-500 font-bold text-sm mt-1">{data.location}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em]">{lang?.t('emergency_notifying')}</span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang?.t('emergency_erp_id')}</p>
                  <p className="font-mono font-bold text-slate-700">{data.erp_id}</p>
                </div>

                {data.ai_report && (
                  <div className="space-y-3 bg-blue-50 p-5 rounded-[32px] border border-blue-100">
                    <h4 className="font-black text-blue-900 uppercase tracking-tight flex items-center gap-2 text-sm">
                      <Eye size={18} className="text-blue-600" /> AI Security Incident Analysis
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(JSON.parse(data.ai_report)).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <textarea 
                            className="text-sm font-bold text-blue-900 leading-tight bg-transparent outline-none w-full resize-none h-auto min-h-[1.5rem]"
                            value={value as string}
                            onChange={e => {
                              const currentReport = JSON.parse(data.ai_report);
                              currentReport[key] = e.target.value;
                              onUpdateData({ ...data, ai_report: JSON.stringify(currentReport) });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <Shield size={18} className="text-emerald-600" /> {lang?.t('emergency_instructions')}
                </h4>
                <div className="space-y-2">
                  {data.instructions.map((step: string, i: number) => (
                    <div key={i} className="flex gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm font-bold text-emerald-900 leading-snug">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                  <History size={18} className="text-blue-600" /> {lang?.t('emergency_actions_taken')}
                </h4>
                <div className="space-y-2">
                  {data.actions_taken.map((action: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-xs font-bold text-slate-500">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="flex-1 bg-white text-emerald-600 border-emerald-100" 
                icon={Share2}
                onClick={() => {
                  let reportText = `🚨 *EMERGENCY REPORT: ${data.type}* 🚨\n\n📍 *Location:* ${data.location}\n🆔 *ERP ID:* ${data.erp_id}\n\n*AI Analysis:*`;
                  if (data.ai_report) {
                    const analysis = JSON.parse(data.ai_report);
                    Object.entries(analysis).forEach(([key, val]) => {
                      reportText += `\n• *${key.replace(/_/g, ' ')}:* ${val}`;
                    });
                  }
                  reportText += `\n\n*Instructions:*`;
                  data.instructions.forEach((ins: string, i: number) => {
                    reportText += `\n${i+1}. ${ins}`;
                  });
                  window.open(`https://wa.me/?text=${encodeURIComponent(reportText)}`, '_blank');
                }}
              >
                WhatsApp
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 bg-white text-blue-600 border-blue-100" 
                icon={Mail}
                onClick={() => {
                  const subject = `EMERGENCY REPORT: ${data.type} at ${data.location}`;
                  let body = `EMERGENCY REPORT: ${data.type}\n\nLocation: ${data.location}\nERP ID: ${data.erp_id}\n\nAI Analysis:`;
                  if (data.ai_report) {
                    const analysis = JSON.parse(data.ai_report);
                    Object.entries(analysis).forEach(([key, val]) => {
                      body += `\n- ${key.replace(/_/g, ' ')}: ${val}`;
                    });
                  }
                  body += `\n\nInstructions:`;
                  data.instructions.forEach((ins: string, i: number) => {
                    body += `\n${i+1}. ${ins}`;
                  });
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Email
              </Button>
            </div>

            <Button 
              variant="secondary"
              onClick={onClose} 
              className="w-full py-6 text-xl bg-white text-rose-600 border-rose-100 shadow-2xl shadow-rose-900/40 hover:bg-rose-50" 
              icon={CheckCircle2}
            >
              {lang?.t('back_home') || 'Complete Report'}
            </Button>
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-rose-600/80 backdrop-blur-sm flex flex-col items-center justify-center z-[70]">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-white font-black uppercase tracking-widest animate-pulse">AI Assistant Processing...</p>
        </div>
      )}
    </motion.div>
  );
};

const Dashboard = () => {
  const auth = useContext(AuthContext);
  const shift = useContext(ShiftContext);
  const lang = useContext(LanguageContext);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedShift, setSelectedShift] = useState('');
  const [view, setView] = useState<'guard' | 'supervisor'>('guard');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flowMode, setFlowMode] = useState<'main' | 'summary' | 'final'>('main');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showShiftModal && isCameraOpen) {
      stopCamera();
    }
  }, [showShiftModal, isCameraOpen]);

  useEffect(() => {
    if (shift?.activeShift) {
      setFlowMode('main');
    }
  }, [shift?.activeShift]);

  const startCamera = async () => {
    setIsCameraOpen(true);
    setCapturedSelfie(null);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera access is not supported by your browser or connection is not secure (HTTPS).");
      return;
    }

    const constraints = { 
      video: { facingMode: 'user' }, 
      audio: false 
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      
      // Fallback if specific constraints fail
      if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
            return;
          }
        } catch (fallbackErr: any) {
          err = fallbackErr;
        }
      }

      let message = "Could not access camera.";
      switch (err.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          message = "Camera permission denied. Please click the lock icon in your browser's address bar to allow camera access, then refresh the page.";
          break;
        case 'NotFoundError':
        case 'DevicesNotFoundError':
          message = "No camera found on this device. Please ensure a camera is connected.";
          break;
        case 'NotReadableError':
        case 'TrackStartError':
          message = "Camera is already in use by another application or hardware error occurred.";
          break;
        case 'SecurityError':
          message = "Camera access is blocked by security policy.";
          break;
        case 'AbortError':
          message = "Camera access was aborted. Please try again.";
          break;
        default:
          message = `Camera error: ${err.message || 'Unknown error'}`;
      }
      setCameraError(message);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (video.readyState < 2) {
        setCameraError("Camera is still loading. Please wait a moment.");
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setCapturedSelfie(dataUrl);
          stopCamera();
        } catch (e) {
          console.error("Capture failed:", e);
          setCameraError("Failed to capture image. Please try again.");
        }
      }
    }
  };

  const handleStart = async () => {
    await shift?.startShift(selectedShift);
    setShowShiftModal(false);
    setFlowMode('main');
  };

  if (shift?.activeShift || flowMode === 'summary' || flowMode === 'final') {
    return <ActiveShiftView flowMode={flowMode} setFlowMode={setFlowMode} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white p-6 rounded-b-[40px] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <UserIcon className="text-slate-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Hi, {auth?.user?.name}</h2>
              <p className="text-xs text-slate-500">{auth?.user?.designation}</p>
            </div>
          </div>
          <button onClick={() => auth?.logout()} className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors">
            <LogOut size={24} />
          </button>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setView('guard')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${view === 'guard' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
          >
            My Shift
          </button>
          <button 
            onClick={() => setView('supervisor')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${view === 'supervisor' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
          >
            Supervisor
          </button>
        </div>

        {view === 'guard' && (
          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
            <div className="flex items-center gap-3 text-emerald-700 mb-2">
              <Clock size={20} />
              <span className="font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <p className="text-emerald-600 text-sm">{lang?.t('off_duty')}</p>
          </div>
        )}
      </header>

      <main className="p-6 space-y-6">
        {view === 'guard' ? (
          <>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6"
            >
              <div className="w-32 h-32 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 animate-pulse">
                <Play className="text-white ml-2" size={48} fill="currentColor" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900">{lang?.t('ready_to_work')}</h3>
                <p className="text-slate-500">Start your shift to begin logging activities.</p>
              </div>
              <Button onClick={() => setShowShiftModal(true)} className="w-full max-w-xs py-6 text-xl rounded-3xl">
                {lang?.t('start_shift')}
              </Button>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-col items-center text-center gap-2">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <BarChart3 size={24} />
                </div>
                <span className="text-sm font-semibold">{lang?.t('my_attendance')}</span>
              </Card>
              <Card className="flex flex-col items-center text-center gap-2">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Users size={24} />
                </div>
                <span className="text-sm font-semibold">{lang?.t('team')}</span>
              </Card>
            </div>
          </>
        ) : (
          <SupervisorDashboard />
        )}
      </main>

      <AnimatePresence>
        {showShiftModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShiftModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-8 space-y-8"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2 sm:hidden" />
              
              {step === 1 && (
                <div className="space-y-6 text-center">
                  {isCameraOpen ? (
                    <div className="relative rounded-3xl overflow-hidden bg-black aspect-square max-w-[300px] mx-auto">
                      {cameraError ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900">
                          <AlertTriangle className="text-rose-500 mb-3" size={40} />
                          <p className="text-white text-sm font-medium mb-4">{cameraError}</p>
                          <Button variant="secondary" onClick={startCamera}>Try Again</Button>
                        </div>
                      ) : (
                        <>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover scale-x-[-1]"
                          />
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <button 
                              onClick={takePhoto}
                              className="w-16 h-16 bg-white rounded-full border-4 border-slate-200 flex items-center justify-center shadow-lg"
                            >
                              <div className="w-12 h-12 bg-blue-600 rounded-full" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : capturedSelfie ? (
                    <div className="relative rounded-3xl overflow-hidden bg-slate-100 aspect-square max-w-[300px] mx-auto">
                      <img src={capturedSelfie} alt="Selfie" className="w-full h-full object-cover scale-x-[-1]" />
                      <button 
                        onClick={() => setCapturedSelfie(null)}
                        className="absolute top-4 right-4 p-2 bg-rose-500 text-white rounded-full shadow-lg"
                      >
                        <Square size={16} className="rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
                      <Camera size={48} />
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />

                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold">{lang?.t('verify_identity')}</h2>
                    <p className="text-slate-500">Please take a quick selfie to start your shift.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {!isCameraOpen && !capturedSelfie && (
                      <Button onClick={startCamera} className="w-full" icon={Camera}>{lang?.t('take_selfie')}</Button>
                    )}
                    {capturedSelfie && (
                      <Button onClick={() => setStep(2)} className="w-full" icon={CheckCircle2}>{lang?.t('continue')}</Button>
                    )}
                    <Button variant="ghost" onClick={() => setStep(2)}>{lang?.t('skip')}</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center">{lang?.t('select_shift')}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {['General', 'Morning', 'Afternoon', 'Night'].map(type => (
                      <button
                        key={type}
                        onClick={() => setSelectedShift(type)}
                        className={`p-6 rounded-3xl border-2 transition-all text-center ${
                          selectedShift === type 
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                            : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <span className="font-bold">{type}</span>
                      </button>
                    ))}
                  </div>
                  <Button 
                    onClick={handleStart} 
                    className="w-full" 
                    disabled={!selectedShift}
                  >
                    {lang?.t('start_now')}
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActiveShiftView = ({ flowMode, setFlowMode }: { flowMode: 'main' | 'summary' | 'final', setFlowMode: (m: any) => void }) => {
  const shift = useContext(ShiftContext);
  const lang = useContext(LanguageContext);
  const auth = useContext(AuthContext);
  
  const [mode, setMode] = useState<'main' | 'voice' | 'photo' | 'visitor' | 'emergency' | 'timeline' | 'patrol'>('main');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [handoverNotes, setHandoverNotes] = useState('');
  
  // Voice Reporting States
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceData, setVoiceData] = useState<any>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  // Photo Reporting States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoAnalysis, setPhotoAnalysis] = useState<any>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoNote, setPhotoNote] = useState('');
  const [photoLocation, setPhotoLocation] = useState('');
  const [assignedToName, setAssignedToName] = useState('');
  const [assignedToPhone, setAssignedToPhone] = useState('');
  const [isCapturingAfterPhoto, setIsCapturingAfterPhoto] = useState(false);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  // Visitor States
  const [visitorForm, setVisitorForm] = useState({ name: '', phone: '', purpose: '', personToMeet: '', vehicleNumber: '', photo: '' });
  const [visitorPass, setVisitorPass] = useState<Visitor | null>(null);
  const [activeVisitors, setActiveVisitors] = useState<Visitor[]>([]);
  const [isCapturingVisitorPhoto, setIsCapturingVisitorPhoto] = useState(false);

  // Emergency States
  const [emergencyLocation, setEmergencyLocation] = useState<string>('Gate 3');
  const [emergencyData, setEmergencyData] = useState<{
    type: string;
    location: string;
    timestamp: string;
    instructions: string[];
    erp_id: string;
    status: 'Open' | 'In Progress' | 'Closed';
    actions_taken: string[];
  } | null>(null);
  const [isActivatingEmergency, setIsActivatingEmergency] = useState(false);

  const [emergencyPhoto, setEmergencyPhoto] = useState<string | null>(null);

  // Summary States
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [nextShiftPerson, setNextShiftPerson] = useState('');
  const [nextShiftDesignation, setNextShiftDesignation] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchTimeline();
  }, [mode]);

  const fetchTimeline = async () => {
    if (!shift?.activeShift) return;
    const res = await fetch(`/api/shifts/${shift.activeShift.id}/summary`);
    if (res.ok) {
      const data = await res.json();
      setActivities(data.activities);
      setActiveVisitors(data.visitors || []);
    }
  };

  const handleVisitorStatusUpdate = async (visitorId: string, status?: string, approval_status?: string) => {
    const res = await fetch(`/api/visitors/${visitorId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, approval_status })
    });
    if (res.ok) {
      if (visitorPass && visitorPass.id === visitorId) {
        setVisitorPass(prev => prev ? { ...prev, status: status as any || prev.status, approval_status: approval_status as any || prev.approval_status } : null);
      }
      fetchTimeline();
    }
  };

  const handleShareWhatsApp = () => {
    const text = `AI Shift Handover Summary:\n${summary}\n\nHandover Notes:\n${handoverNotes}\n\nShift Handed Over To:\nName: ${nextShiftPerson}\nDesignation: ${nextShiftDesignation}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSendEmail = () => {
    const subject = "AI Shift Handover Summary";
    const body = `AI Shift Handover Summary:\n${summary}\n\nHandover Notes:\n${handoverNotes}\n\nShift Handed Over To:\nName: ${nextShiftPerson}\nDesignation: ${nextShiftDesignation}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const text = `AI Shift Handover Summary:\n${summary}\n\nHandover Notes:\n${handoverNotes}\n\nShift Handed Over To:\nName: ${nextShiftPerson}\nDesignation: ${nextShiftDesignation}`;
    
    // Split text to fit page width
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, 10);
    doc.save("Shift_Handover_Summary.pdf");
  };

  const handleShareVisitorPass = (method: 'whatsapp' | 'email') => {
    if (!visitorPass) return;
    const text = `*Visitor Gate Pass - Site Alpha*\n\n*Visitor:* ${visitorPass.name}\n*Meeting With:* ${visitorPass.person_to_meet}\n*Purpose:* ${visitorPass.purpose}\n*Vehicle:* ${visitorPass.vehicle_number || 'None'}\n*Entry Time:* ${new Date(visitorPass.timestamp).toLocaleTimeString()}\n*Pass ID:* ${visitorPass.qr_code}\n\n*Status:* ${visitorPass.status}\n\n_Please show this pass at the security checkpoint._`;
    
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      const subject = `Visitor Gate Pass: ${visitorPass.name}`;
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    }
  };

  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    setIsCameraOpen(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
      alert("Could not access camera.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      
      if (mode === 'emergency') {
        setEmergencyPhoto(dataUrl);
        stopCamera();
      } else if (isCapturingVisitorPhoto) {
        setVisitorForm({ ...visitorForm, photo: dataUrl });
        setIsCapturingVisitorPhoto(false);
        stopCamera();
      } else if (isCapturingAfterPhoto) {
        setAfterPhoto(dataUrl);
        setIsCapturingAfterPhoto(false);
        stopCamera();
      } else {
        setCapturedImage(dataUrl);
        stopCamera();
        analyzePhoto(dataUrl);
      }
    }
  };

  const analyzePhoto = async (base64: string) => {
    if (!photoLocation) {
      alert("Please enter a location first.");
      return;
    }
    setIsAnalyzingPhoto(true);
    try {
      const result = await processPhotoIncident(base64, photoLocation);
      setPhotoAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleVoiceReport = async () => {
    // Simulate speech-to-text for demo
    setIsRecording(true);
    setTimeout(async () => {
      setIsRecording(false);
      const mockTranscript = "Suspicious person near gate 3 wearing a black hoodie.";
      setTranscript(mockTranscript);
      setIsProcessingVoice(true);
      try {
        const result = await processVoiceIncident(mockTranscript);
        setVoiceData(result);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessingVoice(false);
      }
    }, 3000);
  };

  const submitVoiceReport = async () => {
    await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shift_id: shift?.activeShift?.id,
        type: voiceData?.type || 'Voice Report',
        location: voiceData?.location || 'Unknown',
        reported_by: auth?.user?.name,
        note: transcript
      })
    });
    setMode('main');
    setVoiceData(null);
    setTranscript('');
  };

  const submitPhotoReport = async () => {
    await fetch('/api/incidents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shift_id: shift?.activeShift?.id,
        type: photoAnalysis?.hazard_identification || 'Safety Hazard',
        location: photoLocation,
        reported_by: auth?.user?.name,
        note: photoNote,
        photo_url: capturedImage,
        status: 'Open',
        hazard_identification: photoAnalysis?.hazard_identification,
        severity: photoAnalysis?.severity,
        risk_description: photoAnalysis?.risk_description,
        root_cause: photoAnalysis?.root_cause,
        corrective_action: photoAnalysis?.corrective_action,
        preventive_action: photoAnalysis?.preventive_action,
        risk_priority: photoAnalysis?.risk_priority,
        assigned_to_name: assignedToName,
        assigned_to_phone: assignedToPhone
      })
    });
    if (shift?.activePatrol) {
      setMode('patrol');
    } else {
      setMode('main');
    }
    setCapturedImage(null);
    setPhotoAnalysis(null);
    setPhotoNote('');
    setPhotoLocation('');
    setAssignedToName('');
    setAssignedToPhone('');
    fetchTimeline();
  };

  const handleShareReportWhatsApp = async () => {
    if (!photoAnalysis || !capturedImage) return;

    const messageText = 
      `🚨 *SAFETY HAZARD ALERT: ACTION REQUIRED* 🚨\n\n` +
      `Hello *${assignedToName || 'Team'}*,\n` +
      `A safety hazard has been identified and assigned to you for corrective action.\n\n` +
      `📍 *Location:* ${photoLocation}\n` +
      `⚠️ *Hazard:* ${photoAnalysis.hazard_identification}\n` +
      `📉 *Risk Level:* ${photoAnalysis.severity} (${photoAnalysis.risk_priority} Priority)\n\n` +
      `📝 *Risk Description:* \n${photoAnalysis.risk_description}\n\n` +
      `✅ *CORRECTIVE ACTION REQUIRED:* \n*${photoAnalysis.corrective_action}*\n\n` +
      `🛡️ *Preventive Action:* \n${photoAnalysis.preventive_action}`;

    // Try native sharing first (supports sending the actual image file)
    if (navigator.share && navigator.canShare) {
      try {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        const file = new File([blob], 'hazard-report.jpg', { type: 'image/jpeg' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Safety Hazard Report',
            text: messageText,
          });
          return; // Success!
        }
      } catch (err) {
        console.error('Native share failed:', err);
      }
    }

    // Fallback to direct WhatsApp link (targeted to phone number, but no image attachment)
    const whatsappUrl = `https://wa.me/${assignedToPhone.replace(/\D/g, '')}?text=${encodeURIComponent(messageText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleVisitorEntry = async () => {
    if (!shift?.activeShift) return;
    const res = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shift_id: shift.activeShift.id,
        name: visitorForm.name,
        phone: visitorForm.phone,
        purpose: visitorForm.purpose,
        person_to_meet: visitorForm.personToMeet,
        vehicle_number: visitorForm.vehicleNumber,
        photo_url: visitorForm.photo,
        location: 'Main Gate - Site Alpha'
      })
    });
    if (res.ok) {
      const data = await res.json();
      const newVisitor = { 
        ...visitorForm, 
        id: data.id, 
        qr_code: data.qr_code, 
        timestamp: new Date().toISOString(), 
        shift_id: shift.activeShift.id,
        status: 'Pending',
        approval_status: 'Pending',
        person_to_meet: visitorForm.personToMeet,
        vehicle_number: visitorForm.vehicleNumber,
        photo_url: visitorForm.photo,
        location: 'Main Gate - Site Alpha'
      } as Visitor;
      setVisitorPass(newVisitor);
      fetchTimeline();
    }
  };

  const handleEmergency = async () => {
    setIsActivatingEmergency(true);
    setMode('emergency');
    
    // 1. Capture GPS Location
    let location = "Sector 7 - Chemical Storage Area"; // Default fallback
    
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)} (Gate 3 Area)`;
      } catch (e) {
        console.warn("Geolocation failed, using fallback", e);
      }
    }
    
    setEmergencyLocation(location);
    
    // 2. Record Date and Time
    const timestamp = new Date().toISOString();
    
    // 3. Notify ERP & Safety Team
    try {
      const erpIncident = await createEmergencyIncident({
        type: 'Initial Alert',
        location,
        reported_by: auth?.user?.name || 'Guard',
        timestamp
      });
      
      setEmergencyData({
        type: 'Pending Selection',
        location,
        timestamp,
        instructions: [],
        erp_id: erpIncident.id,
        status: 'Open',
        actions_taken: ['Emergency Alert Triggered', 'GPS Location Captured', 'Safety Team Notified']
      });
    } catch (e) {
      console.error("Emergency Activation Error:", e);
    } finally {
      setIsActivatingEmergency(false);
    }
  };

  const handleSelectEmergencyType = async (type: string, manualLocation?: string, manualDescription?: string) => {
    if (!emergencyData) return;
    
    const finalLocation = manualLocation || emergencyData.location;
    setIsActivatingEmergency(true);
    try {
      // 1. Get AI Guidance
      const guidance = await getEmergencyGuidance(type);
      
      // 2. Perform AI Security Analysis if applicable
      let aiReport = null;
      const isSecurityIncident = EMERGENCY_STRUCTURE.find(c => c.category === "Security Incidents")?.types.some(t => t.label === type);
      
      if (isSecurityIncident && emergencyPhoto) {
        try {
          aiReport = await analyzeSecurityIncident(emergencyPhoto, type, finalLocation, manualDescription);
        } catch (err) {
          console.error("AI Analysis Error:", err);
        }
      }
      
      // 3. Update ERP
      await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shift_id: shift?.activeShift?.id,
          type: `EMERGENCY: ${type}`,
          location: finalLocation,
          reported_by: auth?.user?.name,
          note: `Emergency type confirmed: ${type}. AI Guidance provided. ${manualDescription ? `Description: ${manualDescription}` : ''}`,
          emergency_type: type,
          erp_id: emergencyData.erp_id,
          status: 'Open',
          photo_url: emergencyPhoto,
          ai_report: aiReport ? JSON.stringify(aiReport) : null
        })
      });

      setEmergencyData({
        ...emergencyData,
        type,
        location: finalLocation,
        instructions: guidance.instructions,
        ai_report: aiReport ? JSON.stringify(aiReport) : null,
        actions_taken: [
          ...emergencyData.actions_taken, 
          `Emergency Type Confirmed: ${type}`, 
          `Location Confirmed: ${finalLocation}`,
          'AI Guidance Received', 
          emergencyPhoto ? 'Emergency Photo Attached' : 'No Photo Attached',
          aiReport ? 'AI Security Analysis Completed' : 'No AI Analysis'
        ]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsActivatingEmergency(false);
    }
  };

  const handleEndShift = async () => {
    setLoadingSummary(true);
    setFlowMode('summary');
    const shiftId = shift?.activeShift?.id;
    // We end the shift on the backend but keep the UI in summary mode
    await shift?.endShift();
    try {
      const res = await fetch(`/api/shifts/${shiftId}/summary`);
      const data = await res.json();
      const summaryText = await generateHandoverSummary({ ...data, language: lang?.language });
      setSummary(summaryText);
    } catch (e) {
      setSummary("Error generating summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  if (flowMode === 'summary') {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-6 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {loadingSummary ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-24 h-24 border-4 border-emerald-100 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-24 h-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <FileText className="absolute inset-0 m-auto text-emerald-500 animate-bounce" size={32} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-slate-900">{lang?.t('generating_report')}</h3>
                <p className="text-slate-500 text-sm animate-pulse">Our AI is analyzing your shift activities...</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl space-y-8">
              <div className="flex flex-col items-center text-center space-y-2 mb-4">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200 rotate-3">
                  <FileText size={32} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shift Handover Report</h2>
                <p className="text-slate-500 font-medium">Review and finalize your shift summary</p>
              </div>
              
              <div className="space-y-6">
                {/* AI Summary Section */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                      <BarChart3 size={18} />
                    </div>
                    <label className="text-sm font-black text-slate-700 uppercase tracking-wider">AI Generated Summary</label>
                  </div>
                  <div className="relative group">
                    <textarea 
                      className="w-full p-6 rounded-[32px] border-2 border-slate-100 bg-white shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 min-h-[250px] text-sm leading-relaxed font-medium text-slate-700 transition-all"
                      value={summary}
                      onChange={e => setSummary(e.target.value)}
                      placeholder="AI summary will appear here..."
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase">Editable</span>
                    </div>
                  </div>
                </section>

                {/* Handover Details Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                        <UserPlus size={18} />
                      </div>
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Handed Over To</label>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] border-2 border-slate-100 shadow-sm space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Full Name</label>
                        <input 
                          type="text" 
                          className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                          placeholder="e.g. Rahul Sharma"
                          value={nextShiftPerson}
                          onChange={e => setNextShiftPerson(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Designation</label>
                        <input 
                          type="text" 
                          className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                          placeholder="e.g. Senior Guard"
                          value={nextShiftDesignation}
                          onChange={e => setNextShiftDesignation(e.target.value)}
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                        <Plus size={18} />
                      </div>
                      <label className="text-sm font-black text-slate-700 uppercase tracking-wider">Additional Notes</label>
                    </div>
                    <textarea 
                      className="w-full p-6 rounded-[32px] border-2 border-slate-100 bg-white shadow-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 min-h-[165px] text-sm font-medium text-slate-700 transition-all"
                      placeholder="e.g. Gate 3 lock is loose..."
                      value={handoverNotes}
                      onChange={e => setHandoverNotes(e.target.value)}
                    />
                  </section>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold">Share & Export</h3>
                  <div className="flex gap-2">
                    <button onClick={handleShareWhatsApp} className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                      <Share2 size={20} />
                    </button>
                    <button onClick={handleSendEmail} className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                      <Mail size={20} />
                    </button>
                    <button onClick={handleDownloadPDF} className="w-10 h-10 bg-slate-700 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="h-px bg-white/10 w-full" />

                <div className="flex flex-col gap-3">
                  <Button onClick={() => setFlowMode('final')} className="w-full py-6 text-xl bg-emerald-500 hover:bg-emerald-400 shadow-xl shadow-emerald-500/20" icon={CheckCircle2}>
                    Complete Handover
                  </Button>
                  <p className="text-white/40 text-[10px] text-center uppercase tracking-[0.2em] font-bold">This will finalize the shift record</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (flowMode === 'final') {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          className="w-full max-w-lg space-y-12"
        >
          <div className="relative mx-auto w-32 h-32">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="absolute inset-0 bg-emerald-100 rounded-full"
            />
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="absolute inset-2 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-200"
            >
              <CheckCircle2 size={64} />
            </motion.div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-4 border-2 border-dashed border-emerald-200 rounded-full"
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Shift Handover <br />
              <span className="text-emerald-600">Successful!</span>
            </h2>
            <p className="text-slate-500 text-xl font-medium max-w-xs mx-auto">
              Your report has been saved and shared with the next team.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 pt-8">
            <Button 
              onClick={() => { setFlowMode('main'); window.location.reload(); }} 
              className="w-full py-8 text-2xl bg-slate-900 hover:bg-slate-800 shadow-2xl shadow-slate-200 rounded-3xl" 
              icon={Play}
            >
              {lang?.t('start_new_shift')}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => { setFlowMode('main'); window.location.reload(); }} 
              className="w-full py-4 text-slate-400 font-bold hover:text-slate-600"
            >
              {lang?.t('go_to_dashboard')}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white p-6 rounded-b-[40px] shadow-sm sticky top-0 z-20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Shield className="text-emerald-600" size={24} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{shift?.activeShift?.type} Shift</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                {lang?.t('on_duty')}
              </div>
            </div>
          </div>
          <button onClick={() => setMode('timeline')} className="p-3 bg-slate-100 rounded-2xl text-slate-600">
            <History size={24} />
          </button>
        </div>
      </header>

      <main className="p-6">
        <AnimatePresence mode="wait">
          {mode === 'main' && (
            <motion.div key="main" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setMode('voice')} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-all aspect-square">
                  <div className="p-5 bg-blue-50 text-blue-600 rounded-3xl"><Mic size={40} /></div>
                  <span className="font-bold text-slate-700">{lang?.t('speak_report')}</span>
                </button>
                <button 
                  onClick={() => {
                    if (shift?.activePatrol) {
                      setMode('patrol');
                    } else {
                      shift?.startPatrol();
                      setMode('patrol');
                    }
                  }} 
                  className={`p-8 rounded-[32px] shadow-sm border flex flex-col items-center justify-center gap-4 active:scale-95 transition-all aspect-square ${shift?.activePatrol ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-700'}`}
                >
                  <div className={`p-5 rounded-3xl ${shift?.activePatrol ? 'bg-emerald-100' : 'bg-emerald-50 text-emerald-600'}`}>
                    {shift?.activePatrol ? <MapPin size={40} className="animate-bounce" /> : <MapPin size={40} />}
                  </div>
                  <span className="font-bold">{shift?.activePatrol ? "Resume Patrol" : lang?.t('start_patrol')}</span>
                </button>
                <button onClick={() => setMode('visitor')} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-all aspect-square">
                  <div className="p-5 bg-emerald-50 text-emerald-600 rounded-3xl"><UserPlus size={40} /></div>
                  <span className="font-bold text-slate-700">{lang?.t('visitor_entry')}</span>
                </button>
                <button onClick={() => setMode('photo')} className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4 active:scale-95 transition-all aspect-square">
                  <div className="p-5 bg-purple-50 text-purple-600 rounded-3xl"><Camera size={40} /></div>
                  <span className="font-bold text-slate-700">{lang?.t('photo_report')}</span>
                </button>
              </div>
              <button onClick={handleEmergency} className="bg-rose-500 p-8 rounded-[32px] shadow-xl shadow-rose-200 flex items-center justify-center gap-6 active:scale-95 transition-all text-white">
                <AlertOctagon size={48} />
                <span className="text-2xl font-black uppercase tracking-tighter">{lang?.t('emergency_alert')}</span>
              </button>
              <button onClick={() => setShowEndConfirm(true)} className="bg-slate-900 p-6 rounded-[32px] flex items-center justify-center gap-4 text-white active:scale-95 transition-all mt-4">
                <LogOut size={24} />
                <span className="font-bold">{lang?.t('end_shift')}</span>
              </button>
            </motion.div>
          )}

          {mode === 'emergency' && (
            <>
              <EmergencyAlertView 
                data={emergencyData} 
                onSelectType={handleSelectEmergencyType} 
                onClose={() => { setMode('main'); setEmergencyPhoto(null); stopCamera(); }}
                loading={isActivatingEmergency}
                onCapturePhoto={() => startCamera('environment')}
                capturedPhoto={emergencyPhoto}
                onUpdateData={(updated) => setEmergencyData(updated)}
              />
              {isCameraOpen && (
                <div className="fixed inset-0 z-[70] bg-black flex flex-col">
                  <div className="p-6 flex justify-between items-center text-white">
                    <h3 className="font-bold">Capture Emergency Evidence</h3>
                    <button onClick={stopCamera} className="p-2 bg-white/10 rounded-full"><X size={24} /></button>
                  </div>
                  <div className="flex-1 relative">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                      <button onClick={takePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-slate-200/50 flex items-center justify-center shadow-lg active:scale-90 transition-all">
                        <div className="w-12 h-12 bg-rose-600 rounded-full" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {mode === 'patrol' && (
            <motion.div key="patrol" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-32">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                  <button onClick={() => setMode('main')} className="p-2 bg-white rounded-full shadow-sm"><X size={24} /></button>
                  <h2 className="text-2xl font-bold">Active Patrol</h2>
                </div>
                <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                  Live Tracking
                </div>
              </div>

              <SafetyHeatmap />

              <div className="fixed bottom-24 left-6 right-6 z-30">
                <div className="flex gap-3">
                  <Button 
                    onClick={() => setMode('photo')} 
                    className="flex-1 py-5 bg-rose-500 shadow-xl shadow-rose-200" 
                    icon={AlertTriangle}
                  >
                    {lang?.t('report_hazard')}
                  </Button>
                  <Button 
                    onClick={() => { shift?.endPatrol(); setMode('main'); }} 
                    variant="secondary" 
                    className="flex-1 py-5" 
                    icon={Square}
                  >
                    {lang?.t('end_patrol')}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'voice' && (
            <motion.div key="voice" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setMode('main')} className="p-2 bg-white rounded-full shadow-sm"><X size={24} /></button>
                <h2 className="text-2xl font-bold">{lang?.t('speak_report')}</h2>
              </div>
              <Card className="flex flex-col items-center py-12 space-y-8">
                <button 
                  onClick={handleVoiceReport} 
                  disabled={isRecording || isProcessingVoice}
                  className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all ${isRecording ? 'bg-rose-500 animate-pulse scale-110' : 'bg-blue-600'}`}
                >
                  <Mic size={48} className="text-white" />
                </button>
                <div className="text-center">
                  <p className="text-slate-500 font-medium">
                    {isRecording ? "Listening..." : isProcessingVoice ? "AI is analyzing..." : "Tap to speak your report"}
                  </p>
                  {transcript && <p className="mt-4 p-4 bg-slate-50 rounded-2xl italic text-slate-600">"{transcript}"</p>}
                </div>
              </Card>
              {voiceData && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <Card className="space-y-3">
                    <div className="flex flex-col border-b pb-2">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Incident Type</span>
                      <input 
                        type="text"
                        className="font-bold text-blue-600 bg-transparent outline-none border-none p-0"
                        value={voiceData.type}
                        onChange={e => setVoiceData({...voiceData, type: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col border-b pb-2">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Location</span>
                      <input 
                        type="text"
                        className="font-bold bg-transparent outline-none border-none p-0"
                        value={voiceData.location}
                        onChange={e => setVoiceData({...voiceData, location: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col border-b pb-2">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Time</span>
                      <span className="font-bold text-slate-500">{voiceData.time}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Reported By</span>
                      <span className="font-bold text-slate-500">{voiceData.reported_by}</span>
                    </div>
                  </Card>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => {
                      const text = `🚨 *Incident Report*\n\n*Type:* ${voiceData.type}\n*Location:* ${voiceData.location}\n*Time:* ${voiceData.time}\n*Reported By:* ${voiceData.reported_by}\n\n*Details:* ${transcript}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }} icon={Share2}>WhatsApp</Button>
                    <Button variant="secondary" className="flex-1" onClick={() => {
                      const subject = `Incident Report: ${voiceData.type}`;
                      const body = `Incident Report\n\nType: ${voiceData.type}\nLocation: ${voiceData.location}\nTime: ${voiceData.time}\nReported By: ${voiceData.reported_by}\n\nDetails: ${transcript}`;
                      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }} icon={Mail}>Email</Button>
                  </div>
                  <Button onClick={submitVoiceReport} className="w-full py-6 text-xl" icon={Send}>{lang?.t('submit_report')}</Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {mode === 'photo' && (
            <motion.div key="photo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => { setMode('main'); stopCamera(); setCapturedImage(null); setPhotoAnalysis(null); }} className="p-2 bg-white rounded-full shadow-sm"><X size={24} /></button>
                <h2 className="text-2xl font-bold">Safety Photo Report</h2>
              </div>
              
              {!capturedImage && !isCameraOpen && (
                <Card className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Hazard Location</label>
                    <input 
                      type="text" 
                      className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                      placeholder="e.g. Building B, 4th Floor, Server Room"
                      value={photoLocation}
                      onChange={e => setPhotoLocation(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col items-center py-6 space-y-6">
                    <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><Camera size={40} /></div>
                    <Button 
                      onClick={() => startCamera()} 
                      className="w-full" 
                      icon={Camera}
                      disabled={!photoLocation}
                    >
                      Take Hazard Photo
                    </Button>
                  </div>
                </Card>
              )}

              {isCameraOpen && (
                <div className="relative rounded-[40px] overflow-hidden bg-black aspect-[3/4] shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <button onClick={takePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-slate-200/50 flex items-center justify-center shadow-lg active:scale-90 transition-all">
                      <div className="w-12 h-12 bg-purple-600 rounded-full" />
                    </button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pb-12">
                  <div className="relative rounded-[40px] overflow-hidden shadow-xl aspect-video">
                    <img src={capturedImage} className="w-full h-full object-cover" />
                    {isAnalyzingPhoto && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-4">
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
                        <p className="font-bold">AI is performing HIRA & CAPA...</p>
                      </div>
                    )}
                  </div>
                  
                  {photoAnalysis && (
                    <div className="space-y-6">
                      {/* HIRA Section */}
                      <Card className={`space-y-4 border-l-4 ${
                        photoAnalysis.severity === 'Critical' || photoAnalysis.severity === 'High' ? 'border-l-rose-500 bg-rose-50/30' : 
                        photoAnalysis.severity === 'Medium' ? 'border-l-orange-500 bg-orange-50/30' : 
                        'border-l-blue-500 bg-blue-50/30'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-black text-slate-400 uppercase text-[10px] tracking-widest mb-1">HIRA Result</h3>
                            <input 
                              type="text"
                              className="text-xl font-black text-slate-900 leading-tight bg-transparent outline-none w-full"
                              value={photoAnalysis.hazard_identification}
                              onChange={e => setPhotoAnalysis({...photoAnalysis, hazard_identification: e.target.value})}
                            />
                          </div>
                          <select 
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider outline-none appearance-none cursor-pointer ${
                              photoAnalysis.severity === 'Critical' || photoAnalysis.severity === 'High' ? 'bg-rose-100 text-rose-600' : 
                              photoAnalysis.severity === 'Medium' ? 'bg-orange-100 text-orange-600' : 
                              'bg-blue-100 text-blue-600'
                            }`}
                            value={photoAnalysis.severity}
                            onChange={e => setPhotoAnalysis({...photoAnalysis, severity: e.target.value})}
                          >
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <textarea 
                            className="text-sm text-slate-600 font-medium leading-relaxed italic bg-transparent outline-none w-full resize-none h-20"
                            value={photoAnalysis.risk_description}
                            onChange={e => setPhotoAnalysis({...photoAnalysis, risk_description: e.target.value})}
                          />
                        </div>
                      </Card>

                      {/* CAPA Section */}
                      <Card className="space-y-4 bg-white border-2 border-slate-100">
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest border-b pb-2">Advanced CAPA Plan</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Root Cause Analysis</label>
                            <textarea 
                              className="text-sm font-medium text-slate-700 bg-transparent outline-none w-full resize-none h-12"
                              value={photoAnalysis.root_cause}
                              onChange={e => setPhotoAnalysis({...photoAnalysis, root_cause: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-emerald-500 uppercase">Corrective Action (Immediate)</label>
                            <textarea 
                              className="text-sm font-bold text-slate-900 bg-transparent outline-none w-full resize-none h-12"
                              value={photoAnalysis.corrective_action}
                              onChange={e => setPhotoAnalysis({...photoAnalysis, corrective_action: e.target.value})}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-blue-500 uppercase">Preventive Action (Future)</label>
                            <textarea 
                              className="text-sm font-medium text-slate-700 bg-transparent outline-none w-full resize-none h-12"
                              value={photoAnalysis.preventive_action}
                              onChange={e => setPhotoAnalysis({...photoAnalysis, preventive_action: e.target.value})}
                            />
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Risk Priority</span>
                            <select 
                              className="text-sm font-black text-purple-600 bg-transparent outline-none appearance-none cursor-pointer"
                              value={photoAnalysis.risk_priority}
                              onChange={e => setPhotoAnalysis({...photoAnalysis, risk_priority: e.target.value})}
                            >
                              <option value="P1">P1 (Immediate)</option>
                              <option value="P2">P2 (High)</option>
                              <option value="P3">P3 (Medium)</option>
                              <option value="P4">P4 (Low)</option>
                            </select>
                          </div>
                        </div>
                      </Card>

                      {/* Assignment Section */}
                      <Card className="space-y-4">
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Assign Responsibility</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Person Name</label>
                            <input 
                              type="text" 
                              className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                              placeholder="e.g. Mike Tech"
                              value={assignedToName}
                              onChange={e => setAssignedToName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                            <input 
                              type="tel" 
                              className="w-full p-3 rounded-xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-purple-500 text-sm font-bold"
                              placeholder="+91..."
                              value={assignedToPhone}
                              onChange={e => setAssignedToPhone(e.target.value)}
                            />
                          </div>
                        </div>
                      </Card>

                      <div className="flex flex-col gap-3">
                        <div className="flex gap-3">
                          <Button variant="secondary" className="flex-1" onClick={() => { setCapturedImage(null); setPhotoAnalysis(null); startCamera(); }}>Retake Photo</Button>
                          <Button className="flex-[2] bg-purple-600" icon={Send} onClick={submitPhotoReport} disabled={isAnalyzingPhoto}>Send Report</Button>
                        </div>
                        <div className="flex gap-3">
                          <Button 
                            variant="ghost" 
                            className="flex-1 py-4 text-emerald-600 bg-emerald-50 border-2 border-emerald-100 hover:bg-emerald-100" 
                            icon={Share2}
                            onClick={handleShareReportWhatsApp}
                            disabled={!assignedToPhone}
                          >
                            WhatsApp
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="flex-1 py-4 text-blue-600 bg-blue-50 border-2 border-blue-100 hover:bg-blue-100" 
                            icon={Mail}
                            onClick={() => {
                              const subject = `Safety Hazard Report: ${photoAnalysis.hazard_identification}`;
                              const body = `🚨 SAFETY HAZARD ALERT: ACTION REQUIRED 🚨\n\nLocation: ${photoLocation}\nHazard: ${photoAnalysis.hazard_identification}\nRisk Level: ${photoAnalysis.severity} (${photoAnalysis.risk_priority} Priority)\n\nRisk Description:\n${photoAnalysis.risk_description}\n\nCORRECTIVE ACTION REQUIRED:\n${photoAnalysis.corrective_action}\n\nPreventive Action:\n${photoAnalysis.preventive_action}`;
                              window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                            }}
                          >
                            Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {mode === 'visitor' && (
            <motion.div key="visitor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => { setMode('main'); setVisitorPass(null); setIsCapturingVisitorPhoto(false); stopCamera(); }} className="p-2 bg-white rounded-full shadow-sm"><X size={24} /></button>
                <h2 className="text-2xl font-bold">{lang?.t('visitor_entry')}</h2>
              </div>

              {!visitorPass ? (
                <div className="space-y-6">
                  {/* Photo Capture Section */}
                  <section className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Visitor Photograph</label>
                    {!visitorForm.photo && !isCapturingVisitorPhoto ? (
                      <button 
                        onClick={() => { setIsCapturingVisitorPhoto(true); startCamera('environment'); }}
                        className="w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center gap-3 text-slate-400 hover:bg-slate-50 transition-all"
                      >
                        <Camera size={40} />
                        <span className="font-bold">Tap to Capture Photo</span>
                      </button>
                    ) : isCapturingVisitorPhoto ? (
                      <div className="relative rounded-[32px] overflow-hidden bg-black aspect-video shadow-xl">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                          <button 
                            onClick={() => {
                              const canvas = document.createElement('canvas');
                              canvas.width = videoRef.current?.videoWidth || 640;
                              canvas.height = videoRef.current?.videoHeight || 480;
                              const ctx = canvas.getContext('2d');
                              if (ctx && videoRef.current) {
                                ctx.drawImage(videoRef.current, 0, 0);
                                const data = canvas.toDataURL('image/jpeg');
                                setVisitorForm({ ...visitorForm, photo: data });
                                setIsCapturingVisitorPhoto(false);
                                stopCamera();
                              }
                            }}
                            className="w-16 h-16 bg-white rounded-full border-4 border-emerald-500 flex items-center justify-center shadow-lg active:scale-90 transition-all"
                          >
                            <div className="w-10 h-10 bg-emerald-600 rounded-full" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative rounded-[32px] overflow-hidden shadow-xl aspect-video group">
                        <img src={visitorForm.photo} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => { setVisitorForm({ ...visitorForm, photo: '' }); setIsCapturingVisitorPhoto(true); startCamera('environment'); }}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity"
                        >
                          Retake Photo
                        </button>
                      </div>
                    )}
                  </section>

                  <Card className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">{lang?.t('visitor_name')}</label>
                      <input type="text" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="John Doe" value={visitorForm.name} onChange={e => setVisitorForm({...visitorForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">{lang?.t('phone_number')}</label>
                      <input type="tel" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="+91 98765 43210" value={visitorForm.phone} onChange={e => setVisitorForm({...visitorForm, phone: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">{lang?.t('purpose')}</label>
                        <input type="text" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Delivery" value={visitorForm.purpose} onChange={e => setVisitorForm({...visitorForm, purpose: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Vehicle No.</label>
                        <input type="text" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="ABC-123" value={visitorForm.vehicleNumber} onChange={e => setVisitorForm({...visitorForm, vehicleNumber: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">{lang?.t('person_to_meet')}</label>
                      <input type="text" className="w-full p-4 rounded-2xl border border-slate-100 bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Manager / Resident" value={visitorForm.personToMeet} onChange={e => setVisitorForm({...visitorForm, personToMeet: e.target.value})} />
                    </div>
                    <Button className="w-full py-5 text-lg mt-4" icon={QrCode} onClick={handleVisitorEntry} disabled={!visitorForm.name || !visitorForm.phone || !visitorForm.photo}>{lang?.t('generate_pass')}</Button>
                  </Card>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                  {/* Professional Gate Pass ID Card */}
                  <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 relative">
                    <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest opacity-80">Visitor Gate Pass</h4>
                        <p className="text-lg font-black tracking-tight">Site Alpha Security</p>
                      </div>
                      <Shield size={32} />
                    </div>
                    
                    <div className="p-8 flex flex-col items-center space-y-6">
                      <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg">
                          <img src={visitorPass.photo_url} className="w-full h-full object-cover" />
                        </div>
                        <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md ${
                          visitorPass.status === 'Approved' ? 'bg-emerald-500 text-white' : 
                          visitorPass.status === 'Denied' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {visitorPass.status}
                        </div>
                      </div>

                      <div className="text-center space-y-1">
                        <h3 className="text-3xl font-black text-slate-900">{visitorPass.name}</h3>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">ID: {visitorPass.qr_code}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 w-full py-6 border-y border-slate-50">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting With</p>
                          <p className="font-bold text-slate-800">{visitorPass.person_to_meet}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purpose</p>
                          <p className="font-bold text-slate-800">{visitorPass.purpose}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Time</p>
                          <p className="font-bold text-slate-800">{new Date(visitorPass.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle No.</p>
                          <p className="font-bold text-slate-800">{visitorPass.vehicle_number || 'None'}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-3xl">
                        <QRCodeSVG value={JSON.stringify({
                          id: visitorPass.id,
                          name: visitorPass.name,
                          meeting: visitorPass.person_to_meet,
                          time: visitorPass.timestamp,
                          status: visitorPass.status
                        })} size={120} />
                      </div>
                    </div>
                  </div>

                  {/* Approval Simulation (For Demo) */}
                  {visitorPass.status === 'Pending' && (
                    <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 space-y-4">
                      <div className="flex items-center gap-3 text-amber-700 font-bold">
                        <Clock className="animate-spin-slow" />
                        <span>Awaiting Approval from {visitorPass.person_to_meet}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button onClick={() => handleVisitorStatusUpdate(visitorPass.id, 'Approved', 'Approved')} className="bg-emerald-600" icon={Check}>Simulate Allow</Button>
                        <Button onClick={() => handleVisitorStatusUpdate(visitorPass.id, 'Denied', 'Denied')} variant="danger" icon={X}>Simulate Deny</Button>
                      </div>
                    </div>
                  )}

                  {visitorPass.status === 'Approved' && (
                    <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 flex items-center gap-4 text-emerald-700 font-bold">
                      <CheckCircle2 className="text-emerald-500" />
                      <span>Visitor Entry Approved! Entry time recorded.</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handleShareVisitorPass('whatsapp')} className="w-full bg-emerald-600" icon={Share2}>WhatsApp</Button>
                      <Button onClick={() => handleShareVisitorPass('email')} variant="secondary" className="w-full" icon={Mail}>Email</Button>
                    </div>
                    <Button variant="ghost" className="w-full" onClick={() => { setVisitorPass(null); setVisitorForm({ name: '', phone: '', purpose: '', personToMeet: '', vehicleNumber: '', photo: '' }); }}>New Entry</Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {mode === 'emergency' && (
            <motion.div key="emergency" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-8">
              <div className="w-32 h-32 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center animate-bounce shadow-2xl shadow-rose-200">
                <AlertOctagon size={64} />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-rose-600 uppercase tracking-tighter">Emergency Alert Sent</h2>
                <p className="text-xl font-bold text-slate-700">{lang?.t('emergency_confirmed')} <span className="text-rose-600">{emergencyLocation}</span></p>
                <div className="flex items-center justify-center gap-2 text-slate-500 font-medium">
                  <MapPin size={20} />
                  <span>GPS Location Shared with Supervisor</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full max-w-xs py-5" onClick={() => setMode('main')}>Back to Main</Button>
            </motion.div>
          )}

          {mode === 'timeline' && (
            <motion.div key="timeline" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setMode('main')} className="p-2 bg-white rounded-full shadow-sm"><X size={24} /></button>
                <h2 className="text-2xl font-bold">{lang?.t('activity_timeline')}</h2>
              </div>
              <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Active Visitors Section */}
                {activeVisitors.filter(v => v.status !== 'Completed' && v.status !== 'Denied').length > 0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-12">Active Visitors</h3>
                    {activeVisitors.filter(v => v.status !== 'Completed' && v.status !== 'Denied').map((vis) => (
                      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={vis.id} className="relative pl-12">
                        <div className="absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 bg-amber-500" />
                        <Card className="py-4 border-l-4 border-l-amber-500">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                              <img src={vis.photo_url} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-slate-900">{vis.name}</h4>
                                <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(vis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-xs text-slate-500 font-medium">Meeting: {vis.person_to_meet}</p>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-50 flex gap-2">
                            <Button 
                              onClick={() => handleVisitorStatusUpdate(vis.id, 'Completed')} 
                              className="flex-1 py-2 text-xs bg-slate-900" 
                              icon={Check}
                            >
                              Checkout Visitor
                            </Button>
                            <Button 
                              onClick={() => { setVisitorPass(vis); setMode('visitor'); }} 
                              variant="secondary" 
                              className="py-2 text-xs" 
                              icon={QrCode}
                            >
                              View Pass
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-12">Activity History</h3>
                {activities.map((act: any, i) => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} key={act.id} className="relative pl-12">
                    <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${
                      act.type === 'Incident Report' || act.hazard_identification ? 'bg-rose-500' : 
                      act.type === 'Visitor Entry' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} />
                    <Card className="py-4">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          act.type === 'Incident Report' || act.hazard_identification ? 'bg-rose-50 text-rose-600' : 
                          act.type === 'Visitor Entry' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                        }`}>{act.hazard_identification ? 'Safety Hazard' : act.type}</span>
                      </div>
                      
                      {act.hazard_identification ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-black text-slate-900">{act.hazard_identification}</p>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                              act.status === 'Closed' ? 'bg-emerald-100 text-emerald-600' : 
                              act.status === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                            }`}>{act.status}</span>
                          </div>
                          <p className="text-xs text-slate-500">Location: {act.location}</p>
                          {act.photo_url && <img src={act.photo_url} className="rounded-xl w-full h-32 object-cover border border-slate-100" />}
                          
                          {act.status !== 'Closed' && (
                            <div className="pt-3 border-t flex flex-col gap-2">
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Verification & Closure</p>
                              <div className="flex gap-2">
                                <Button 
                                  className="flex-1 py-2 text-xs bg-emerald-600" 
                                  icon={Camera}
                                  onClick={() => {
                                    // Logic to capture after photo and close
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = async (e: any) => {
                                      const file = e.target.files[0];
                                      const reader = new FileReader();
                                      reader.onload = async () => {
                                        const base64 = reader.result as string;
                                        await fetch(`/api/incidents/${act.id}/close`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ after_photo_url: base64, status: 'Closed' })
                                        });
                                        fetchTimeline();
                                      };
                                      reader.readAsDataURL(file);
                                    };
                                    input.click();
                                  }}
                                >
                                  Upload After Photo
                                </Button>
                                <Button 
                                  variant="secondary" 
                                  className="flex-1 py-2 text-xs"
                                  onClick={async () => {
                                    await fetch(`/api/incidents/${act.id}/close`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ status: 'In Progress' })
                                    });
                                    fetchTimeline();
                                  }}
                                >
                                  Mark In Progress
                                </Button>
                              </div>
                            </div>
                          )}
                          {act.after_photo_url && (
                            <div className="pt-3 border-t">
                              <p className="text-[10px] font-bold text-emerald-500 uppercase mb-2">Resolved Photo</p>
                              <img src={act.after_photo_url} className="rounded-xl w-full h-32 object-cover border-2 border-emerald-100" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-800">{act.note}</p>
                          {act.photo_url && <img src={act.photo_url} className="mt-3 rounded-xl w-full h-32 object-cover border border-slate-100" />}
                        </>
                      )}
                    </Card>
                  </motion.div>
                ))}
                {activities.length === 0 && <p className="text-center text-slate-400 py-12">No activities logged yet.</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <canvas ref={canvasRef} className="hidden" />
      </main>

      {/* End Shift Confirmation */}
      <AnimatePresence>
        {showEndConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEndConfirm(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-sm rounded-[40px] p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto"><LogOut size={40} /></div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{lang?.t('end_shift')}</h3>
                <p className="text-slate-500">{lang?.t('confirm_end_shift')}</p>
              </div>
              <div className="flex flex-col gap-3">
                <Button variant="danger" className="w-full py-5" onClick={() => { setShowEndConfirm(false); handleEndShift(); }}>{lang?.t('confirm')}</Button>
                <Button variant="secondary" className="w-full py-5" onClick={() => setShowEndConfirm(false)}>{lang?.t('cancel')}</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SupervisorDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/supervisor/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(d === null);
      })
      .catch(err => {
        console.error('Dashboard fetch error:', err);
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-slate-400">Loading dashboard...</div>;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-bold px-2 flex items-center gap-2">
          <Users size={20} className="text-emerald-600" />
          Active Guards ({data?.activeShifts?.length || 0})
        </h3>
        <div className="space-y-3">
          {data?.activeShifts?.map((s: any) => (
            <Card key={s.id} className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                  {s.user_name?.[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{s.user_name}</p>
                  <p className="text-xs text-slate-500">{s.type} Shift</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full">ACTIVE</span>
              </div>
            </Card>
          ))}
          {(!data?.activeShifts || data.activeShifts.length === 0) && (
            <p className="text-center text-slate-400 py-4 text-sm">No guards currently on duty.</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold px-2 flex items-center gap-2">
          <AlertTriangle size={20} className="text-rose-500" />
          Recent Safety Hazards
        </h3>
        <div className="space-y-3">
          {data?.recentIncidents?.map((i: any) => (
            <Card key={i.id} className={`border-l-4 ${
              i.severity === 'Critical' || i.severity === 'High' ? 'border-l-rose-500' : 
              i.severity === 'Medium' ? 'border-l-orange-500' : 'border-l-blue-500'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    i.severity === 'Critical' || i.severity === 'High' ? 'text-rose-600' : 
                    i.severity === 'Medium' ? 'text-orange-600' : 'text-blue-600'
                  }`}>
                    {i.severity} Severity Hazard
                  </span>
                  <h4 className="font-black text-slate-900">{i.hazard_identification || i.type}</h4>
                </div>
                <span className="text-[10px] text-slate-400">{new Date(i.timestamp).toLocaleTimeString()}</span>
              </div>
              
              <p className="text-xs text-slate-500 mb-2 font-medium">Location: {i.location}</p>
              
              {i.photo_url && (
                <div className="mb-3 rounded-xl overflow-hidden border border-slate-100">
                  <img src={i.photo_url} alt="Hazard" className="w-full h-32 object-cover" />
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl mb-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Corrective Action</p>
                <p className="text-xs font-bold text-slate-700">{i.corrective_action}</p>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-[10px] text-slate-400 font-medium">Assigned to: <span className="text-slate-900 font-bold">{i.assigned_to_name || 'Unassigned'}</span></p>
                <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                  i.status === 'Closed' ? 'bg-emerald-100 text-emerald-600' : 
                  i.status === 'In Progress' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                }`}>{i.status}</span>
              </div>
            </Card>
          ))}
          {(!data?.recentIncidents || data.recentIncidents.length === 0) && (
            <p className="text-center text-slate-400 py-4 text-sm">No hazards reported recently.</p>
          )}
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [activePatrol, setActivePatrol] = useState<Patrol | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedUser = localStorage.getItem('guard_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedShift = localStorage.getItem('active_shift');
    if (savedShift) setActiveShift(JSON.parse(savedShift));

    const savedPatrol = localStorage.getItem('active_patrol');
    if (savedPatrol) setActivePatrol(JSON.parse(savedPatrol));

    const savedLang = localStorage.getItem('app_lang');
    if (savedLang) setLanguage(savedLang);

    setLoading(false);
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('app_lang', lang);
  };

  const t = (key: string) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const login = async (data: Partial<User>) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Login failed');
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('guard_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const logout = () => {
    setUser(null);
    setActiveShift(null);
    localStorage.clear();
  };

  const startShift = async (type: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/shifts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, type })
      });
      if (!res.ok) throw new Error('Failed to start shift');
      const shiftData = await res.json();
      setActiveShift(shiftData);
      localStorage.setItem('active_shift', JSON.stringify(shiftData));
    } catch (error) {
      console.error('Start shift error:', error);
    }
  };

  const endShift = async () => {
    if (!activeShift) return;
    await fetch('/api/shifts/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shift_id: activeShift.id })
    });
    setActiveShift(null);
    localStorage.removeItem('active_shift');
  };

  const startPatrol = async () => {
    if (!activeShift) return;
    try {
      const res = await fetch('/api/patrols/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shift_id: activeShift.id })
      });
      if (!res.ok) throw new Error('Failed to start patrol');
      const patrolData = await res.json();
      setActivePatrol(patrolData);
      localStorage.setItem('active_patrol', JSON.stringify(patrolData));
    } catch (error) {
      console.error('Start patrol error:', error);
    }
  };

  const endPatrol = async () => {
    if (!activePatrol) return;
    await fetch('/api/patrols/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patrol_id: activePatrol.id })
    });
    setActivePatrol(null);
    localStorage.removeItem('active_patrol');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      <AuthContext.Provider value={{ user, login, logout }}>
        <ShiftContext.Provider value={{ activeShift, startShift, endShift, activePatrol, startPatrol, endPatrol }}>
          {!user ? <LoginPage /> : <Dashboard />}
        </ShiftContext.Provider>
      </AuthContext.Provider>
    </LanguageContext.Provider>
  );
}
