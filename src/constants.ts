import { 
  Shield, 
  Flame, 
  PlusCircle, 
  AlertTriangle, 
  Building2, 
  HelpCircle,
  Lock,
  UserX,
  Bomb,
  Target,
  UserMinus,
  Trash2,
  Activity,
  Wind,
  Zap,
  Droplets,
  HardHat,
  Skull,
  Box,
  Waves,
  Hammer,
  Settings,
  Power,
  ArrowUpCircle,
  Car,
  Users,
  Globe
} from 'lucide-react';

export const EMERGENCY_STRUCTURE = [
  {
    category: "Security Incidents",
    icon: Shield,
    color: "bg-blue-600",
    types: [
      { id: "theft", label: "Theft / Missing Item", icon: UserMinus },
      { id: "suspicious", label: "Suspicious Person", icon: UserX },
      { id: "bomb", label: "Bomb Threat", icon: Bomb },
      { id: "shooter", label: "Active Shooter", icon: Target },
      { id: "unauthorized", label: "Unauthorized Access", icon: Lock },
      { id: "vandalism", label: "Vandalism", icon: Trash2 },
      { id: "breach", label: "Security Breach", icon: Shield }
    ]
  },
  {
    category: "Fire and Explosion",
    icon: Flame,
    color: "bg-orange-600",
    types: [
      { id: "fire", label: "Fire", icon: Flame },
      { id: "smoke", label: "Smoke Detected", icon: Wind },
      { id: "explosion", label: "Explosion", icon: Zap },
      { id: "flammable", label: "Flammable Material Incident", icon: AlertTriangle }
    ]
  },
  {
    category: "Medical Emergencies",
    icon: PlusCircle,
    color: "bg-rose-600",
    types: [
      { id: "medical", label: "Medical Emergency", icon: PlusCircle },
      { id: "injury", label: "Injury or Accident", icon: Activity },
      { id: "unconscious", label: "Unconscious Person", icon: UserX },
      { id: "cardiac", label: "Cardiac Arrest", icon: Activity },
      { id: "first_aid", label: "First Aid Required", icon: PlusCircle }
    ]
  },
  {
    category: "Safety Hazards",
    icon: AlertTriangle,
    color: "bg-amber-600",
    types: [
      { id: "electrical", label: "Electrical Hazard", icon: Zap },
      { id: "gas", label: "Gas Leak", icon: Wind },
      { id: "chemical", label: "Chemical Spill", icon: Droplets },
      { id: "toxic", label: "Toxic Exposure", icon: Skull },
      { id: "confined", label: "Confined Space Emergency", icon: Box }
    ]
  },
  {
    category: "Facility or Environmental Issues",
    icon: Building2,
    color: "bg-slate-600",
    types: [
      { id: "flood", label: "Water Leak or Flood", icon: Waves },
      { id: "structural", label: "Structural Damage", icon: Hammer },
      { id: "equipment", label: "Equipment Failure", icon: Settings },
      { id: "power", label: "Power Outage", icon: Power },
      { id: "elevator", label: "Elevator or Lift Emergency", icon: ArrowUpCircle }
    ]
  },
  {
    category: "Other Emergencies",
    icon: HelpCircle,
    color: "bg-indigo-600",
    types: [
      { id: "vehicle", label: "Vehicle Accident", icon: Car },
      { id: "violence", label: "Workplace Violence", icon: Users },
      { id: "pollution", label: "Environmental Pollution", icon: Globe },
      { id: "other", label: "Other Emergency", icon: HelpCircle }
    ]
  }
];
