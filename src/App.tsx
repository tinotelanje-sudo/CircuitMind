import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Cpu, 
  Layers, 
  MessageSquare, 
  Settings, 
  ChevronRight, 
  Search, 
  Save, 
  Play, 
  Share2, 
  Zap,
  Box,
  Trash2,
  Undo,
  Redo,
  Terminal,
  Presentation,
  ChevronLeft,
  Target,
  TrendingUp,
  Users,
  Briefcase,
  ShieldCheck,
  Rocket
} from 'lucide-react';
import { Stage, Layer, Rect, Circle, Line, Text, Group, Shape } from 'react-konva';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { getCircuitAdvice } from './services/geminiService';
import { autoPlace, groupComponents, calculateDesignScore, PCBComponent, Track, DesignScore } from './services/pcbService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  versions?: ProjectVersion[];
}

interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  commit_message: string;
  created_at: string;
}

interface Component {
  id: string;
  name: string;
  type: string;
  value: string;
  x: number;
  y: number;
  group?: string;
}

interface Connection {
  from: string;
  to: string;
  label?: string;
}

interface SchematicData {
  id?: string;
  components: Component[];
  connections: Connection[];
}

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
      active ? "bg-black text-white shadow-lg" : "text-gray-500 hover:bg-gray-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const ProjectCard = ({ project, onClick }: { project: Project, onClick: () => void }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    onClick={onClick}
    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
        <Cpu size={24} />
      </div>
      <span className="text-xs font-mono text-gray-400">{new Date(project.created_at).toLocaleDateString()}</span>
    </div>
    <h3 className="text-lg font-bold mb-2">{project.name}</h3>
    <p className="text-gray-500 text-sm line-clamp-2 mb-4">{project.description}</p>
    <div className="flex items-center text-indigo-600 text-sm font-semibold">
      Open Project <ChevronRight size={16} className="ml-1" />
    </div>
  </motion.div>
);

const PitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    {
      title: "CircuitMind AI",
      subtitle: "Design Electronics by Prompt",
      content: "Platform reka bentuk elektronik berasaskan AI. Idea → Schematic → PCB → Simulasi → Fabrikasi",
      tagline: "10× lebih pantas. Lebih pintar daripada EDA tradisional.",
      icon: Zap,
      color: "bg-black text-white"
    },
    {
      title: "The Problem",
      subtitle: "Masalah Industri Elektronik Hari Ini",
      items: [
        "Lambat (minggu → bulan)",
        "Bergantung pada jurutera pakar",
        "Tools kompleks & berasingan",
        "Kesilapan mahal (PCB respin)"
      ],
      icon: Trash2,
      color: "bg-red-50 text-red-900"
    },
    {
      title: "The Solution",
      subtitle: "CircuitMind AI: AI Engineer Platform",
      items: [
        "Text-to-Schematic AI",
        "AI jana PCB layout optimum",
        "Simulasi & optimasi automatik",
        "Export terus ke fabrikasi"
      ],
      icon: Cpu,
      color: "bg-indigo-50 text-indigo-900"
    },
    {
      title: "Market Opportunity",
      subtitle: "TAM / SAM / SOM",
      content: "TAM: $12B+ | SAM: $4.5B | SOM: $300M",
      items: ["IoT", "EV", "AI hardware", "Maker & startup boom"],
      icon: TrendingUp,
      color: "bg-emerald-50 text-emerald-900"
    },
    {
      title: "Business Model",
      subtitle: "SaaS + Usage-Based",
      items: [
        "Free: Projek terhad",
        "Pro: RM / user / bulan",
        "Team: RM / seat / bulan",
        "Pay-Per-Design: One-off generation"
      ],
      icon: Briefcase,
      color: "bg-amber-50 text-amber-900"
    },
    {
      title: "Technology Moat",
      subtitle: "Sukar ditiru kerana:",
      items: [
        "AI multi-agent architecture",
        "Rule-aware electrical AI",
        "Reinforcement learning placement",
        "Dataset reka bentuk sebenar"
      ],
      icon: ShieldCheck,
      color: "bg-blue-50 text-blue-900"
    }
  ];

  return (
    <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className={cn(
            "w-full max-w-4xl aspect-video rounded-[32px] shadow-2xl p-16 flex flex-col justify-center relative overflow-hidden",
            slides[currentSlide].color
          )}
        >
          <div className="absolute top-12 right-12 opacity-10">
            {React.createElement(slides[currentSlide].icon, { size: 200 })}
          </div>
          
          <div className="relative z-10">
            <h2 className="text-6xl font-black tracking-tighter mb-4">{slides[currentSlide].title}</h2>
            <h3 className="text-2xl font-medium opacity-80 mb-8">{slides[currentSlide].subtitle}</h3>
            
            {slides[currentSlide].content && (
              <p className="text-xl max-w-2xl mb-8 leading-relaxed">{slides[currentSlide].content}</p>
            )}
            
            {slides[currentSlide].items && (
              <ul className="space-y-4">
                {slides[currentSlide].items.map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-xl font-medium">
                    <div className="w-2 h-2 rounded-full bg-current opacity-50" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
            
            {slides[currentSlide].tagline && (
              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-sm uppercase tracking-widest font-bold opacity-60">{slides[currentSlide].tagline}</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-12 flex items-center gap-8">
        <button 
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0}
          className="p-4 rounded-full bg-white shadow-lg disabled:opacity-30 hover:scale-110 transition-transform"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === currentSlide ? "w-8 bg-black" : "bg-gray-300")} />
          ))}
        </div>
        <button 
          onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlide === slides.length - 1}
          className="p-4 rounded-full bg-white shadow-lg disabled:opacity-30 hover:scale-110 transition-transform"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      <div className="absolute bottom-8 left-8 text-xs font-bold text-gray-400 uppercase tracking-widest">
        CircuitMind AI // Investor Deck v1.0
      </div>
    </div>
  );
};

export default function App() {
  const [view, setView] = useState<'dashboard' | 'editor' | 'pitch'>('dashboard');
  const [mode, setMode] = useState<'schematic' | 'pcb'>('schematic');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);
  const [schematic, setSchematic] = useState<SchematicData>({ components: [], connections: [] });
  const [tracks, setTracks] = useState<Track[]>([]);
  const [designScore, setDesignScore] = useState<DesignScore | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [promptValue, setPromptValue] = useState('');
  
  const stageRef = useRef<any>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const res = await fetch('/api/v1/projects');
    const data = await res.json();
    setProjects(data);
  };

  const createProject = async () => {
    const name = window.prompt("Project Name?");
    if (!name) return;
    const res = await fetch('/api/v1/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description: "New AI-assisted electronic design project." })
    });
    const newProj = await res.json();
    setProjects([newProj, ...projects]);
  };

  const openProject = async (project: Project) => {
    const resProj = await fetch(`/api/v1/projects/${project.id}`);
    const projectData = await resProj.json();
    setSelectedProject(projectData);
    
    if (projectData.versions && projectData.versions.length > 0) {
      const latestVersion = projectData.versions[0];
      setSelectedVersion(latestVersion);
      const resSch = await fetch(`/api/v1/projects/${project.id}/versions/${latestVersion.id}/schematic`);
      const schematicData = await resSch.json();
      setSchematic({ ...JSON.parse(schematicData.canvas_data), id: schematicData.id });
    }
    
    setView('editor');
  };

  const saveSchematic = async () => {
    if (!schematic.id) return;
    await fetch(`/api/v1/schematics/${schematic.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canvasData: schematic, netlist: "" })
    });
  };

  const handleAiPrompt = async () => {
    if (!promptValue.trim()) return;
    const userMsg = promptValue;
    setAiChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setPromptValue('');
    setIsAiLoading(true);

    try {
      const advice = await getCircuitAdvice(userMsg, schematic);
      
      // Construct a rich text response from the structured advice
      let richText = `**Design Summary:** ${advice.designSummary}\n\n`;
      if (advice.componentSelection) richText += `**Component Selection:** ${advice.componentSelection}\n\n`;
      if (advice.pcbGuidance) richText += `**PCB Guidance:** ${advice.pcbGuidance}\n\n`;
      if (advice.simulationInsight) richText += `**Simulation Insight:** ${advice.simulationInsight}\n\n`;
      if (advice.aiDesignAdvisor) richText += `**AI Advisor:** ${advice.aiDesignAdvisor}`;

      setAiChat(prev => [...prev, { role: 'ai', text: richText }]);
      
      if (advice.suggestedComponents) {
        setSchematic(prev => ({
          ...prev,
          components: [...prev.components, ...advice.suggestedComponents.map((c: any) => ({
            ...c,
            x: c.position?.x || Math.random() * 400 + 100,
            y: c.position?.y || Math.random() * 400 + 100,
          }))]
        }));
      }
      
      if (advice.connections) {
        setSchematic(prev => ({
          ...prev,
          connections: [...prev.connections, ...advice.connections]
        }));
      }
    } catch (err) {
      console.error(err);
      setAiChat(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error processing your request." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const addComponent = (type: string) => {
    const newComp: Component = {
      id: Math.random().toString(36).substring(7),
      name: `${type}_${schematic.components.length + 1}`,
      type,
      value: '10k',
      x: 100,
      y: 100
    };
    setSchematic(prev => ({ ...prev, components: [...prev.components, newComp] }));
  };

  const runAutoPlace = () => {
    const grouped = groupComponents(schematic.components);
    const nets = schematic.connections.map(c => ({ name: 'net', nodes: [c.from, c.to] }));
    const placed = autoPlace(grouped as any, nets, { w: 600, h: 400 });
    setSchematic(prev => ({ ...prev, components: placed as any }));
    updateScore(placed as any, nets, tracks);
  };

  const runAutoRoute = () => {
    // Simplified routing: direct lines for prototype
    const newTracks: Track[] = schematic.connections.map(conn => {
      const from = schematic.components.find(c => c.id === conn.from);
      const to = schematic.components.find(c => c.id === conn.to);
      if (!from || !to) return null;
      return {
        netName: 'net',
        points: [{ x: from.x + 40, y: from.y + 20 }, { x: to.x, y: to.y + 20 }],
        layer: 1,
        width: 2
      };
    }).filter(Boolean) as Track[];
    setTracks(newTracks);
    updateScore(schematic.components as any, [], newTracks);
  };

  const updateScore = (comps: PCBComponent[], nets: any[], trks: Track[]) => {
    const score = calculateDesignScore(comps, nets, trks);
    setDesignScore(score);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-4 gap-6">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
            <Zap size={18} fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">CircuitMind</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <SidebarItem icon={Layers} label="Projects" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
          <SidebarItem icon={Presentation} label="Pitch Deck" active={view === 'pitch'} onClick={() => setView('pitch')} />
          <SidebarItem icon={Box} label="Library" />
          <SidebarItem icon={Terminal} label="Simulations" />
          <SidebarItem icon={Settings} label="Settings" />
        </nav>

        {designScore && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Design Score</p>
            <div className="text-2xl font-bold text-emerald-700">{Math.round(designScore.total)}%</div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-[10px] text-emerald-600"><span>DRC</span><span>{designScore.drc}%</span></div>
              <div className="flex justify-between text-[10px] text-emerald-600"><span>Signal</span><span>{Math.round(designScore.signalIntegrity)}%</span></div>
            </div>
          </div>
        )}

        <div className="p-4 bg-indigo-50 rounded-2xl">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">AI Credits</p>
          <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 w-3/4" />
          </div>
          <p className="text-[10px] text-indigo-400 mt-2">750 / 1000 requests left</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#F8F9FA] relative overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'pitch' ? (
            <motion.div 
              key="pitch"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex"
            >
              <PitchDeck />
            </motion.div>
          ) : view === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 max-w-6xl mx-auto w-full"
            >
              <div className="flex justify-between items-end mb-12">
                <div>
                  <h2 className="text-4xl font-bold mb-2">My Projects</h2>
                  <p className="text-gray-500">Design, simulate, and optimize your electronics with AI.</p>
                </div>
                <button 
                  onClick={createProject}
                  className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg"
                >
                  <Plus size={20} /> New Project
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(p => (
                  <ProjectCard key={p.id} project={p} onClick={() => openProject(p)} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex"
            >
              {/* Editor Toolbar */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="glass-panel p-2 rounded-xl flex flex-col gap-1">
                  <button onClick={() => addComponent('Resistor')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Add Resistor"><Box size={20} /></button>
                  <button onClick={() => addComponent('Capacitor')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Add Capacitor"><Circle size={20} /></button>
                  <button onClick={() => addComponent('IC')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Add IC"><Rect size={20} /></button>
                </div>
                <div className="glass-panel p-2 rounded-xl flex flex-col gap-1">
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Undo size={20} /></button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><Redo size={20} /></button>
                </div>
                {mode === 'pcb' && (
                  <div className="glass-panel p-2 rounded-xl flex flex-col gap-1">
                    <button onClick={runAutoPlace} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg" title="AI Auto-Place"><Zap size={20} /></button>
                    <button onClick={runAutoRoute} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg" title="AI Auto-Route"><Layers size={20} /></button>
                  </div>
                )}
              </div>

              {/* Editor Header */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-6">
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setMode('schematic')}
                      className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", mode === 'schematic' ? "bg-white shadow-sm text-black" : "text-gray-500")}
                    >
                      Schematic
                    </button>
                    <button 
                      onClick={() => setMode('pcb')}
                      className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", mode === 'pcb' ? "bg-white shadow-sm text-black" : "text-gray-500")}
                    >
                      PCB Layout
                    </button>
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <h3 className="font-bold text-sm">{selectedProject?.name}</h3>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex gap-2">
                    <button onClick={saveSchematic} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black transition-colors">
                      <Save size={14} /> Save
                    </button>
                    <button className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                      <Play size={14} /> Simulate
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className={cn("flex-1 relative", mode === 'pcb' ? "bg-[#1A1A1A]" : "canvas-container")}>
                <Stage 
                  width={window.innerWidth - 256 - 384} 
                  height={window.innerHeight}
                  ref={stageRef}
                >
                  <Layer>
                    {/* Board Outline (PCB Mode) */}
                    {mode === 'pcb' && (
                      <Rect 
                        x={50} y={50} width={600} height={400} 
                        stroke="#4B5563" strokeWidth={2} dash={[10, 5]}
                        cornerRadius={8}
                      />
                    )}

                    {/* Tracks (PCB Mode) */}
                    {mode === 'pcb' && tracks.map((track, i) => (
                      <Line
                        key={i}
                        points={track.points.flatMap(p => [p.x, p.y])}
                        stroke="#F59E0B"
                        strokeWidth={track.width}
                        lineJoin="round"
                        lineCap="round"
                      />
                    ))}

                    {/* Connections (Schematic Mode) */}
                    {mode === 'schematic' && schematic.connections.map((conn, i) => {
                      const from = schematic.components.find(c => c.id === conn.from);
                      const to = schematic.components.find(c => c.id === conn.to);
                      if (!from || !to) return null;
                      return (
                        <Line
                          key={i}
                          points={[from.x + 40, from.y + 20, to.x, to.y + 20]}
                          stroke="#6366F1"
                          strokeWidth={2}
                          tension={0.5}
                        />
                      );
                    })}

                    {/* Components */}
                    {schematic.components.map((comp) => (
                      <Group 
                        key={comp.id} 
                        x={comp.x} 
                        y={comp.y} 
                        draggable
                        onDragEnd={(e) => {
                          setSchematic(prev => ({
                            ...prev,
                            components: prev.components.map(c => 
                              c.id === comp.id ? { ...c, x: e.target.x(), y: e.target.y() } : c
                            )
                          }));
                        }}
                      >
                        <Rect
                          width={80}
                          height={40}
                          fill={mode === 'pcb' ? "#374151" : "white"}
                          stroke={mode === 'pcb' ? "#9CA3AF" : "#1A1A1A"}
                          strokeWidth={1.5}
                          cornerRadius={4}
                          shadowBlur={5}
                          shadowOpacity={0.1}
                        />
                        <Text
                          text={comp.name}
                          fontSize={10}
                          fontFamily="Inter"
                          fontStyle="bold"
                          x={5}
                          y={5}
                          fill={mode === 'pcb' ? "#F3F4F6" : "#1A1A1A"}
                        />
                        <Text
                          text={comp.value}
                          fontSize={9}
                          fontFamily="JetBrains Mono"
                          x={5}
                          y={25}
                          fill={mode === 'pcb' ? "#9CA3AF" : "#6B7280"}
                        />
                      </Group>
                    ))}
                  </Layer>
                </Stage>
              </div>

              {/* AI Advisor Sidebar */}
              <aside className="w-96 bg-white border-l border-gray-100 flex flex-col">
                <div className="p-6 border-bottom border-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={18} className="text-indigo-600" fill="currentColor" />
                    <h3 className="font-bold">CircuitMind AI Advisor</h3>
                  </div>
                  <p className="text-xs text-gray-500">Ask for component suggestions, routing tips, or design reviews.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  {aiChat.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                        <MessageSquare size={24} />
                      </div>
                      <p className="text-sm text-gray-400">No messages yet. Start by asking for a power supply circuit or an LED driver!</p>
                    </div>
                  )}
                  {aiChat.map((msg, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "p-4 rounded-2xl text-sm max-w-[90%] prose prose-sm prose-indigo",
                        msg.role === 'user' 
                          ? "bg-gray-100 self-end rounded-tr-none" 
                          : "bg-indigo-50 text-indigo-900 self-start rounded-tl-none"
                      )}
                    >
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex gap-1 p-4 bg-indigo-50 rounded-2xl self-start">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100">
                  <div className="relative">
                    <textarea 
                      value={promptValue}
                      onChange={(e) => setPromptValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAiPrompt())}
                      placeholder="Describe your circuit needs..."
                      className="w-full bg-gray-50 border-none rounded-2xl p-4 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                      rows={3}
                    />
                    <button 
                      onClick={handleAiPrompt}
                      disabled={isAiLoading || !promptValue.trim()}
                      className="absolute bottom-3 right-3 p-2 bg-black text-white rounded-xl disabled:opacity-50 hover:scale-105 transition-transform"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </aside>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

