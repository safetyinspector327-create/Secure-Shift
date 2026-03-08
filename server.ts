import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("guardsync.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    designation TEXT,
    whatsapp TEXT,
    email TEXT,
    selfie_url TEXT
  );

  CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    start_time DATETIME,
    end_time DATETIME,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    shift_id TEXT,
    type TEXT,
    note TEXT,
    photo_url TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS patrols (
    id TEXT PRIMARY KEY,
    shift_id TEXT,
    start_time DATETIME,
    end_time DATETIME
  );

  CREATE TABLE IF NOT EXISTS visitors (
    id TEXT PRIMARY KEY,
    shift_id TEXT,
    name TEXT,
    phone TEXT,
    purpose TEXT,
    person_to_meet TEXT,
    vehicle_number TEXT,
    photo_url TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    exit_time DATETIME,
    duration INTEGER,
    qr_code TEXT,
    status TEXT DEFAULT 'Pending',
    approval_status TEXT DEFAULT 'Pending',
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    shift_id TEXT,
    type TEXT,
    location TEXT,
    reported_by TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'Open',
    hazard_identification TEXT,
    severity TEXT,
    risk_description TEXT,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    risk_priority TEXT,
    assigned_to_name TEXT,
    assigned_to_phone TEXT,
    after_photo_url TEXT,
    closed_at DATETIME,
    emergency_type TEXT,
    erp_id TEXT,
    ai_report TEXT
  );
`);

// Migration for existing visitors table if needed
try { db.exec("ALTER TABLE visitors ADD COLUMN vehicle_number TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE visitors ADD COLUMN photo_url TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE visitors ADD COLUMN exit_time DATETIME"); } catch(e) {}
try { db.exec("ALTER TABLE visitors ADD COLUMN duration INTEGER"); } catch(e) {}
try { db.exec("ALTER TABLE visitors ADD COLUMN approval_status TEXT DEFAULT 'Pending'"); } catch(e) {}
try { db.exec("ALTER TABLE visitors ADD COLUMN location TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN hazard_identification TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN severity TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN risk_description TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN root_cause TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN corrective_action TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN preventive_action TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN risk_priority TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN assigned_to_name TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN assigned_to_phone TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN after_photo_url TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN closed_at DATETIME"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN emergency_type TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN erp_id TEXT"); } catch(e) {}
try { db.exec("ALTER TABLE incidents ADD COLUMN ai_report TEXT"); } catch(e) {}
try { db.exec("UPDATE incidents SET status = 'Open' WHERE status = 'pending'"); } catch(e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    try {
      const { name, designation, whatsapp, email } = req.body;
      const id = Math.random().toString(36).substring(7);
      db.prepare("INSERT OR REPLACE INTO users (id, name, designation, whatsapp, email) VALUES (?, ?, ?, ?, ?)")
        .run(id, name, designation, whatsapp, email);
      res.json({ id, name, designation, whatsapp, email });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/shifts/start", (req, res) => {
    try {
      const { user_id, type } = req.body;
      const id = Math.random().toString(36).substring(7);
      const startTime = new Date().toISOString();
      db.prepare("INSERT INTO shifts (id, user_id, type, start_time) VALUES (?, ?, ?, ?)")
        .run(id, user_id, type, startTime);
      res.json({ id, user_id, type, start_time: startTime });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/shifts/end", (req, res) => {
    try {
      const { shift_id } = req.body;
      const endTime = new Date().toISOString();
      db.prepare("UPDATE shifts SET end_time = ?, status = 'completed' WHERE id = ?")
        .run(endTime, shift_id);
      res.json({ success: true, end_time: endTime });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/shifts/:id/summary", (req, res) => {
    try {
      const shift = db.prepare("SELECT s.*, u.name as user_name, u.designation FROM shifts s JOIN users u ON s.user_id = u.id WHERE s.id = ?").get(req.params.id);
      const activities = db.prepare("SELECT * FROM activities WHERE shift_id = ? ORDER BY timestamp DESC").all(req.params.id);
      const patrols = db.prepare("SELECT * FROM patrols WHERE shift_id = ?").all(req.params.id);
      const visitors = db.prepare("SELECT * FROM visitors WHERE shift_id = ?").all(req.params.id);
      
      // Enrich activities with incident data if it's a safety hazard or emergency
      const enrichedActivities = activities.map(act => {
        if (act.type === 'Incident Report' || act.type === 'Safety Hazard' || act.type === 'Emergency Alert') {
          const incident = db.prepare("SELECT * FROM incidents WHERE shift_id = ? AND timestamp = ?").get(act.shift_id, act.timestamp);
          if (incident) return { ...act, ...incident };
        }
        return act;
      });

      res.json({ shift, activities: enrichedActivities, patrols, visitors });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/activities", (req, res) => {
    try {
      const { shift_id, type, note, photo_url } = req.body;
      const id = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO activities (id, shift_id, type, note, photo_url) VALUES (?, ?, ?, ?, ?)")
        .run(id, shift_id, type, note, photo_url);
      res.json({ id, shift_id, type, note, photo_url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/patrols/start", (req, res) => {
    try {
      const { shift_id } = req.body;
      const id = Math.random().toString(36).substring(7);
      const startTime = new Date().toISOString();
      db.prepare("INSERT INTO patrols (id, shift_id, start_time, end_time) VALUES (?, ?, ?, ?)")
        .run(id, shift_id, startTime, null);
      res.json({ id, startTime });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/patrols/end", (req, res) => {
    try {
      const { patrol_id } = req.body;
      const endTime = new Date().toISOString();
      db.prepare("UPDATE patrols SET end_time = ? WHERE id = ?")
        .run(endTime, patrol_id);
      res.json({ success: true, end_time: endTime });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/visitors", (req, res) => {
    try {
      const { shift_id, name, phone, purpose, person_to_meet, vehicle_number, photo_url, location } = req.body;
      const id = Math.random().toString(36).substring(7);
      const qr_code = `VIS-${id}`;
      db.prepare("INSERT INTO visitors (id, shift_id, name, phone, purpose, person_to_meet, vehicle_number, photo_url, qr_code, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(id, shift_id, name, phone, purpose, person_to_meet, vehicle_number, photo_url, qr_code, location);
      
      // Also log as activity
      const activityId = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO activities (id, shift_id, type, note) VALUES (?, ?, ?, ?)")
        .run(activityId, shift_id, 'Visitor Entry', `Visitor: ${name} to meet ${person_to_meet}`);

      res.json({ id, qr_code });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/visitors/:id", (req, res) => {
    try {
      const visitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(req.params.id);
      if (!visitor) return res.status(404).json({ error: "Visitor not found" });
      res.json(visitor);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.patch("/api/visitors/:id/status", (req, res) => {
    try {
      const { status, approval_status } = req.body;
      const visitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(req.params.id);
      if (!visitor) return res.status(404).json({ error: "Visitor not found" });

      if (status === 'Completed') {
        const exitTime = new Date().toISOString();
        const entryTime = new Date(visitor.timestamp);
        const duration = Math.round((new Date(exitTime).getTime() - entryTime.getTime()) / (1000 * 60)); // duration in minutes
        db.prepare("UPDATE visitors SET status = ?, exit_time = ?, duration = ? WHERE id = ?")
          .run(status, exitTime, duration, req.params.id);
        
        // Log activity
        const activityId = Math.random().toString(36).substring(7);
        db.prepare("INSERT INTO activities (id, shift_id, type, note) VALUES (?, ?, ?, ?)")
          .run(activityId, visitor.shift_id, 'Visitor Exit', `Visitor: ${visitor.name} checked out. Duration: ${duration} mins`);
      } else {
        const updateFields = [];
        const params = [];
        if (status) { updateFields.push("status = ?"); params.push(status); }
        if (approval_status) { updateFields.push("approval_status = ?"); params.push(approval_status); }
        params.push(req.params.id);
        
        db.prepare(`UPDATE visitors SET ${updateFields.join(", ")} WHERE id = ?`)
          .run(...params);
        
        // Log activity if approved
        if (approval_status === 'Approved') {
          const activityId = Math.random().toString(36).substring(7);
          db.prepare("INSERT INTO activities (id, shift_id, type, note) VALUES (?, ?, ?, ?)")
            .run(activityId, visitor.shift_id, 'Visitor Approved', `Entry for ${visitor.name} approved by ${visitor.person_to_meet}`);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/incidents", (req, res) => {
    try {
      const { 
        shift_id, type, location, reported_by, note, photo_url, status,
        hazard_identification, severity, risk_description, root_cause,
        corrective_action, preventive_action, risk_priority,
        assigned_to_name, assigned_to_phone, emergency_type, erp_id, ai_report
      } = req.body;
      const id = Math.random().toString(36).substring(7);
      const timestamp = new Date().toISOString();

      db.prepare(`
        INSERT INTO incidents (
          id, shift_id, type, location, reported_by, timestamp, note, photo_url, status,
          hazard_identification, severity, risk_description, root_cause,
          corrective_action, preventive_action, risk_priority,
          assigned_to_name, assigned_to_phone, emergency_type, erp_id, ai_report
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, shift_id, type, location, reported_by, timestamp, note, photo_url, status || 'Open',
        hazard_identification, severity, risk_description, root_cause,
        corrective_action, preventive_action, risk_priority,
        assigned_to_name, assigned_to_phone, emergency_type, erp_id, ai_report
      );
      
      // Also log as activity
      const activityId = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO activities (id, shift_id, type, note, photo_url, timestamp) VALUES (?, ?, ?, ?, ?, ?)")
        .run(activityId, shift_id, emergency_type ? 'Emergency Alert' : (hazard_identification ? 'Safety Hazard' : 'Incident Report'), 
             emergency_type ? `EMERGENCY: ${emergency_type} at ${location}` : (hazard_identification ? `Safety Hazard: ${hazard_identification} at ${location}` : `${type} at ${location}: ${note}`), 
             photo_url, timestamp);

      res.json({ id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.patch("/api/incidents/:id/close", (req, res) => {
    try {
      const { status, after_photo_url } = req.body;
      const closedAt = status === 'Closed' ? new Date().toISOString() : null;
      
      db.prepare("UPDATE incidents SET status = ?, after_photo_url = ?, closed_at = ? WHERE id = ?")
        .run(status, after_photo_url, closedAt, req.params.id);
      
      // Update activity if closed
      if (status === 'Closed') {
        const incident = db.prepare("SELECT * FROM incidents WHERE id = ?").get(req.params.id);
        const activityId = Math.random().toString(36).substring(7);
        db.prepare("INSERT INTO activities (id, shift_id, type, note, photo_url) VALUES (?, ?, ?, ?, ?)")
          .run(activityId, incident.shift_id, 'Safety Resolved', `Safety Hazard Resolved: ${incident.hazard_identification} at ${incident.location}`, after_photo_url);
      }

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Supervisor Dashboard Data
  app.get("/api/supervisor/dashboard", (req, res) => {
    const activeShifts = db.prepare(`
      SELECT s.*, u.name as user_name, u.designation 
      FROM shifts s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.status = 'active'
    `).all();
    
    const recentIncidents = db.prepare(`
      SELECT a.*, u.name as user_name 
      FROM activities a 
      JOIN shifts s ON a.shift_id = s.id 
      JOIN users u ON s.user_id = u.id 
      WHERE a.type = 'Incident Report' 
      ORDER BY a.timestamp DESC LIMIT 10
    `).all();

    res.json({ activeShifts, recentIncidents });
  });

  // AI Hazard Heatmap Data
  app.get("/api/safety/heatmap", (req, res) => {
    try {
      const incidents = db.prepare(`
        SELECT location, severity, COUNT(*) as count 
        FROM incidents 
        WHERE hazard_identification IS NOT NULL 
        GROUP BY location, severity
      `).all();

      // Aggregate data by location
      const heatmap: Record<string, any> = {};
      
      incidents.forEach((inc: any) => {
        if (!heatmap[inc.location]) {
          heatmap[inc.location] = {
            location: inc.location,
            hazard_count: 0,
            risk_score: 0,
            severities: { Low: 0, Medium: 0, High: 0, Critical: 0 }
          };
        }
        
        const severity = inc.severity || 'Low';
        heatmap[inc.location].hazard_count += inc.count;
        heatmap[inc.location].severities[severity] += inc.count;
        
        // Calculate risk score
        const weights: Record<string, number> = { Low: 1, Medium: 3, High: 5, Critical: 10 };
        heatmap[inc.location].risk_score += inc.count * weights[severity];
      });

      res.json(Object.values(heatmap));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // AI Smart Insights
  app.get("/api/safety/insights", (req, res) => {
    try {
      const incidents = db.prepare(`
        SELECT location, hazard_identification, severity, timestamp 
        FROM incidents 
        WHERE hazard_identification IS NOT NULL
        ORDER BY timestamp DESC
      `).all();

      // This would normally be a more complex AI analysis
      // For now, we generate insights based on the data
      const insights = [];
      
      // 1. Identify high risk areas
      const locationStats: Record<string, number> = {};
      incidents.forEach((inc: any) => {
        locationStats[inc.location] = (locationStats[inc.location] || 0) + 1;
      });
      
      const topRiskArea = Object.entries(locationStats).sort((a, b) => b[1] - a[1])[0];
      if (topRiskArea) {
        insights.push({
          type: 'patrol',
          title: 'Increase Patrol Frequency',
          description: `The ${topRiskArea[0]} has reported ${topRiskArea[1]} hazards recently. Recommend increasing patrol frequency to every 2 hours.`,
          priority: 'High'
        });
      }

      // 2. Identify repeated hazards
      const hazardStats: Record<string, number> = {};
      incidents.forEach((inc: any) => {
        hazardStats[inc.hazard_identification] = (hazardStats[inc.hazard_identification] || 0) + 1;
      });
      
      const repeatedHazard = Object.entries(hazardStats).sort((a, b) => b[1] - a[1])[0];
      if (repeatedHazard && repeatedHazard[1] > 1) {
        insights.push({
          type: 'training',
          title: 'Additional Safety Training',
          description: `Repeated issues with "${repeatedHazard[0]}" detected. Recommend mandatory safety training for staff in affected departments.`,
          priority: 'Medium'
        });
      }

      // 3. Equipment focus
      const equipmentHazards = incidents.filter((inc: any) => 
        inc.hazard_identification.toLowerCase().includes('wire') || 
        inc.hazard_identification.toLowerCase().includes('leak') ||
        inc.hazard_identification.toLowerCase().includes('machine')
      );
      if (equipmentHazards.length > 0) {
        insights.push({
          type: 'maintenance',
          title: 'Preventive Maintenance',
          description: `Multiple equipment-related hazards detected. Schedule a full facility maintenance audit for next week.`,
          priority: 'Medium'
        });
      }

      res.json(insights);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
