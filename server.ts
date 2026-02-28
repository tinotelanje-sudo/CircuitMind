import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("circuitmind.db");

// Initialize Database with expanded production-ready tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    team_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    version_number INTEGER,
    commit_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS schematics (
    id TEXT PRIMARY KEY,
    version_id TEXT,
    canvas_data TEXT,
    netlist TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(version_id) REFERENCES project_versions(id)
  );

  CREATE TABLE IF NOT EXISTS ai_requests (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    type TEXT,
    prompt TEXT,
    status TEXT, -- 'queued', 'processing', 'completed', 'failed'
    progress INTEGER DEFAULT 0,
    result_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API v1 Routes ---

  // Auth Mock
  app.post("/api/v1/auth/login", (req, res) => {
    res.json({ accessToken: "mock-jwt-token", expiresIn: 3600 });
  });

  // Projects
  app.get("/api/v1/projects", (req, res) => {
    const projects = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
    res.json(projects);
  });

  app.post("/api/v1/projects", (req, res) => {
    const { name, description, teamId } = req.body;
    const projectId = Math.random().toString(36).substring(7);
    const versionId = Math.random().toString(36).substring(7);
    
    db.transaction(() => {
      db.prepare("INSERT INTO projects (id, name, description, team_id) VALUES (?, ?, ?, ?)").run(projectId, name, description, teamId || 'default');
      db.prepare("INSERT INTO project_versions (id, project_id, version_number, commit_message) VALUES (?, ?, ?, ?)").run(versionId, projectId, 1, "Initial commit");
      db.prepare("INSERT INTO schematics (id, version_id, canvas_data) VALUES (?, ?, ?)").run(Math.random().toString(36).substring(7), versionId, JSON.stringify({ components: [], connections: [] }));
    })();

    res.json({ id: projectId, name, description });
  });

  app.get("/api/v1/projects/:id", (req, res) => {
    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
    const versions = db.prepare("SELECT * FROM project_versions WHERE project_id = ? ORDER BY version_number DESC").all(req.params.id);
    res.json({ ...project, versions });
  });

  // Schematic
  app.get("/api/v1/projects/:projectId/versions/:versionId/schematic", (req, res) => {
    const schematic = db.prepare("SELECT * FROM schematics WHERE version_id = ?").get(req.params.versionId);
    res.json(schematic || { canvas_data: JSON.stringify({ components: [], connections: [] }) });
  });

  app.put("/api/v1/schematics/:id", (req, res) => {
    const { canvasData, netlist } = req.body;
    db.prepare("UPDATE schematics SET canvas_data = ?, netlist = ? WHERE id = ?").run(JSON.stringify(canvasData), netlist, req.params.id);
    res.json({ success: true });
  });

  // AI Orchestrator (Async Flow Simulation)
  app.post("/api/v1/ai/request", (req, res) => {
    const { projectId, versionId, type, prompt } = req.body;
    const requestId = Math.random().toString(36).substring(7);
    
    db.prepare("INSERT INTO ai_requests (id, project_id, type, prompt, status) VALUES (?, ?, ?, ?, ?)").run(requestId, projectId, type, prompt, 'queued');
    
    // Simulate async processing
    setTimeout(() => {
      db.prepare("UPDATE ai_requests SET status = 'processing', progress = 50 WHERE id = ?").run(requestId);
      setTimeout(() => {
        db.prepare("UPDATE ai_requests SET status = 'completed', progress = 100 WHERE id = ?").run(requestId);
      }, 2000);
    }, 1000);

    res.json({ requestId, status: "queued" });
  });

  app.get("/api/v1/ai/request/:id", (req, res) => {
    const request = db.prepare("SELECT * FROM ai_requests WHERE id = ?").get(req.params.id);
    res.json(request);
  });

  // BOM
  app.get("/api/v1/bom/:versionId", (req, res) => {
    // Mock BOM generation from schematic
    const schematic = db.prepare("SELECT canvas_data FROM schematics WHERE version_id = ?").get(req.params.versionId);
    if (!schematic) return res.json([]);
    const data = JSON.parse(schematic.canvas_data);
    const bom = data.components.map((c: any) => ({ ref: c.name, part: c.type, qty: 1 }));
    res.json(bom);
  });

  // PCB Endpoints
  app.post("/api/v1/pcb/generate", (req, res) => {
    const { schematicId, layerCount, boardSize } = req.body;
    // In a real app, this would trigger the AI placement algorithm
    res.json({ pcbId: Math.random().toString(36).substring(7), status: "generated" });
  });

  app.post("/api/v1/pcb/:pcbId/autoroute", (req, res) => {
    const { priority } = req.body;
    // Trigger AI routing algorithm
    res.json({ success: true, tracks: 150, vias: 4 });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
